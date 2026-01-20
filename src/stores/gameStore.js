import { defineStore } from 'pinia';
import { createBarrel, isEmpty, remainingCounts } from '../engine/barrel.js';
import { PHASES, MAX_HP, ITEMS_PER_RELOAD } from '../engine/rules.js';
import { rollRandomItems, applyItem } from '../engine/items.js';
import { decideBotAction, describeBotItem } from '../engine/bot.js';
import { audioManager } from '../engine/audio.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useGameStore = defineStore('game', {
  state: () => ({
    mode: 'bot',
    phase: PHASES.COIN_FLIP,
    currentTurn: null,
    sessionActive: false,
    barrel: createBarrel(),
    players: {
      player: {
        id: 'player',
        name: 'Vous',
        hp: MAX_HP,
        maxHp: MAX_HP,
        items: [],
        doubleDamageNextShot: false,
        peekedNext: null,
        invertTargetNext: false
      },
      enemy: {
        id: 'enemy',
        name: 'Capitaine',
        hp: MAX_HP,
        maxHp: MAX_HP,
        items: [],
        doubleDamageNextShot: false,
        peekedNext: null,
        invertTargetNext: false
      }
    },
    lastResult: null,
    lastAction: null,
    winner: null,
    roomId: null,
    isAnimating: false,
    reloadCount: 0,
    // Pending bot action for UI to handle
    pendingBotAction: null,
    // Pending bot item use for UI to display
    pendingBotItem: null
  }),
  getters: {
    isPlayerTurn: (state) => state.phase === PHASES.PLAYER_TURN,
    isEnemyTurn: (state) => state.phase === PHASES.ENEMY_TURN,
    counts: (state) => remainingCounts(state.barrel)
  },
  actions: {
    initGame(mode = 'bot') {
      this.mode = mode;
      this.sessionActive = true;
      this.phase = PHASES.COIN_FLIP;
      this.currentTurn = null;
      this.barrel = createBarrel();
      this.players.player.hp = MAX_HP;
      this.players.enemy.hp = MAX_HP;
      this.players.player.items = [];
      this.players.enemy.items = [];
      this.players.player.doubleDamageNextShot = false;
      this.players.enemy.doubleDamageNextShot = false;
      this.players.player.peekedNext = null;
      this.players.enemy.peekedNext = null;
      this.players.player.invertTargetNext = false;
      this.players.enemy.invertTargetNext = false;
      this.lastResult = null;
      this.lastAction = null;
      this.winner = null;
      this.reloadCount = 0;
      this.dealItems();
    },
    setRoom(id) {
      this.roomId = id;
    },
    // Hydrate state from network (for multiplayer sync)
    hydrateFromNetwork(state) {
      this.sessionActive = true;
      if (state.phase) this.phase = state.phase;
      if (state.currentTurn) this.currentTurn = state.currentTurn;
      if (state.barrel) this.barrel = state.barrel;
      if (state.players) {
        if (state.players.player) Object.assign(this.players.player, state.players.player);
        if (state.players.enemy) Object.assign(this.players.enemy, state.players.enemy);
      }
      if (state.lastResult !== undefined) this.lastResult = state.lastResult;
      if (state.lastAction !== undefined) this.lastAction = state.lastAction;
      if (state.winner !== undefined) this.winner = state.winner;
      if (state.reloadCount !== undefined) this.reloadCount = state.reloadCount;
    },
    // Serialize state for network sync
    serializeForNetwork() {
      return {
        phase: this.phase,
        currentTurn: this.currentTurn,
        barrel: this.barrel,
        players: this.players,
        lastResult: this.lastResult,
        lastAction: this.lastAction,
        winner: this.winner,
        reloadCount: this.reloadCount,
        onlineFlipResult: this.currentTurn
      };
    },
    reloadBarrel({ notify = true } = {}) {
      this.barrel = createBarrel();
      this.dealItems();
      if (notify) {
        this.reloadCount += 1;
        this.lastResult = { text: '🔄 Barillet rechargé (cartouches mélangées).' };
      }
    },
    dealItems() {
      this.players.player.items.push(...rollRandomItems(ITEMS_PER_RELOAD));
      this.players.enemy.items.push(...rollRandomItems(ITEMS_PER_RELOAD));
      audioManager.play('reload');
    },
    setCoinFlipResult(starts) {
      this.currentTurn = starts;
      this.phase = starts === 'player' ? PHASES.PLAYER_TURN : PHASES.ENEMY_TURN;
      this.lastResult = { text: starts === 'player' ? 'Vous commencez.' : "L'ennemi commence." };
      if (this.mode === 'bot' && this.phase === PHASES.ENEMY_TURN) {
        this.queueBotAction();
      }
    },
    async useItem(itemId, actorKey = 'player') {
      const actor = this.players[actorKey];
      if (!actor || this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) {
        return;
      }
      if (actorKey === 'player' && this.phase !== PHASES.PLAYER_TURN) {
        return;
      }
      if (actorKey === 'enemy' && this.phase !== PHASES.ENEMY_TURN) {
        return;
      }

      if (!actor.items.includes(itemId)) {
        return;
      }

      const result = applyItem(this.$state, actorKey, itemId);
      if (!result.success) {
        this.lastResult = { text: result.message };
        return;
      }
      const index = actor.items.indexOf(itemId);
      if (index !== -1) {
        actor.items.splice(index, 1);
      }
      this.lastResult = { text: result.message };
      this.lastAction = {
        type: 'item',
        actor: actorKey,
        itemId
      };
      audioManager.play('click');

      if (this.mode === 'bot' && actorKey === 'enemy') {
        await sleep(600);
        this.queueBotAction();
      }
    },
    async shoot(target, actorKeyOverride = null) {
      if (this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) return;
      if (this.phase !== PHASES.PLAYER_TURN && this.phase !== PHASES.ENEMY_TURN) return;

      const previousPhase = this.phase;

      try {
        const actorKey = actorKeyOverride || (this.phase === PHASES.PLAYER_TURN ? 'player' : 'enemy');
        const actor = this.players[actorKey];
        if (actorKey === 'player' && this.phase !== PHASES.PLAYER_TURN) return;

      if (isEmpty(this.barrel)) {
        this.reloadBarrel({ notify: true });
      }

        this.phase = PHASES.ANIMATING;
        const opponentKey = actorKey === 'player' ? 'enemy' : 'player';
        let targetKey = target === 'self' ? actorKey : opponentKey;

        if (actor.invertTargetNext) {
          targetKey = targetKey === actorKey ? opponentKey : actorKey;
          actor.invertTargetNext = false;
        }

        const shot = this.barrel.chambers[this.barrel.index];
        this.barrel.index += 1;
        this.players.player.peekedNext = null;
        this.players.enemy.peekedNext = null;

        const isReal = shot === 'real';
        const hadDouble = actor.doubleDamageNextShot;
        if (hadDouble) {
          // Consumed on the next shot, even if blank
          actor.doubleDamageNextShot = false;
        }
        let damage = isReal ? 1 : 0;
        if (isReal && hadDouble) {
          damage = 2;
        }

        if (damage > 0) {
          this.players[targetKey].hp = Math.max(0, this.players[targetKey].hp - damage);
        }

        this.lastAction = {
          type: 'shot',
          actor: actorKey,
          target: targetKey,
          shot,
          damage
        };

        this.lastResult = {
          text: isReal ? 'BALLE RÉELLE !' : 'À BLANC...'
        };

        audioManager.play(isReal ? 'shot' : 'blank');

        await sleep(900);

        if (this.players[targetKey].hp <= 0) {
          this.winner = actorKey;
          this.phase = PHASES.GAME_OVER;
          return;
        }

        if (isEmpty(this.barrel)) {
          this.reloadBarrel({ notify: true });
        }

        if (!isReal && targetKey === actorKey) {
          this.phase = actorKey === 'player' ? PHASES.PLAYER_TURN : PHASES.ENEMY_TURN;
        } else {
          this.phase = actorKey === 'player' ? PHASES.ENEMY_TURN : PHASES.PLAYER_TURN;
        }

        if (this.mode === 'bot' && this.phase === PHASES.ENEMY_TURN) {
          this.queueBotAction();
        }
      } catch (error) {
        // Safety: avoid being stuck in animating state
        console.error('Error during shoot:', error);
        if (this.phase === PHASES.ANIMATING) {
          this.phase = previousPhase;
        }
      }
    },
    timeoutTurn(actorKeyOverride = null) {
      if (this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) return;
      if (this.phase !== PHASES.PLAYER_TURN && this.phase !== PHASES.ENEMY_TURN) return;

      const actorKey = actorKeyOverride || (this.phase === PHASES.PLAYER_TURN ? 'player' : 'enemy');
      const actorName = this.players[actorKey]?.name || 'Joueur';

      this.lastAction = {
        type: 'timeout',
        actor: actorKey
      };
      this.lastResult = {
        text: `⏳ ${actorName} a perdu son tour.`
      };

      this.phase = actorKey === 'player' ? PHASES.ENEMY_TURN : PHASES.PLAYER_TURN;

      if (this.mode === 'bot' && this.phase === PHASES.ENEMY_TURN) {
        this.queueBotAction();
      }
    },
    async queueBotAction() {
      if (this.mode !== 'bot') return;
      
      // Safety check: if phase is ANIMATING, wait and check again
      if (this.phase === PHASES.ANIMATING) {
        await sleep(1000);
        if (this.phase === PHASES.ANIMATING) {
          // Force reset to enemy turn if stuck
          this.phase = PHASES.ENEMY_TURN;
        }
      }
      
      if (this.phase !== PHASES.ENEMY_TURN) return;

      // Delay so player can see it's enemy turn
      await sleep(1500);
      
      // Double check phase hasn't changed
      if (this.phase !== PHASES.ENEMY_TURN) return;
      
      const decision = decideBotAction(this.$state);
      
      if (decision.type === 'item') {
        // Signal item use to UI
        this.pendingBotItem = decision.itemId;
        await sleep(100);
        
        await this.useItem(decision.itemId, 'enemy');
        
        // Clear pending item
        this.pendingBotItem = null;
        
        // Delay after item use
        await sleep(800);
        
        // Check if bot should act again
        if (this.phase === PHASES.ENEMY_TURN) {
          this.queueBotAction();
        }
      } else {
        // Signal that bot wants to shoot - UI will handle animation
        const targetText = decision.target === 'self' ? 'sur lui-même' : 'sur vous';
        this.lastResult = { text: `💀 L'ennemi tire ${targetText}...` };
        await sleep(800);
        
        // Set pending action for UI to process with animation
        this.pendingBotAction = {
          type: 'shoot',
          target: decision.target
        };
      }
    },
    
    clearPendingBotAction() {
      this.pendingBotAction = null;
    }
  }
});
