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
    roomId: null
  }),
  getters: {
    isPlayerTurn: (state) => state.phase === PHASES.PLAYER_TURN,
    isEnemyTurn: (state) => state.phase === PHASES.ENEMY_TURN,
    counts: (state) => remainingCounts(state.barrel)
  },
  actions: {
    initGame(mode = 'bot') {
      this.mode = mode;
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
      this.dealItems();
    },
    setRoom(id) {
      this.roomId = id;
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
    async shoot(target) {
      if (this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) return;
      if (this.phase !== PHASES.PLAYER_TURN && this.phase !== PHASES.ENEMY_TURN) return;

      const actorKey = this.phase === PHASES.PLAYER_TURN ? 'player' : 'enemy';
      const actor = this.players[actorKey];
      if (actorKey === 'player' && this.phase !== PHASES.PLAYER_TURN) return;

      if (isEmpty(this.barrel)) {
        this.barrel = createBarrel();
        this.dealItems();
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
      let damage = isReal ? 1 : 0;
      if (isReal && actor.doubleDamageNextShot) {
        damage = 2;
        actor.doubleDamageNextShot = false;
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
        this.barrel = createBarrel();
        this.dealItems();
      }

      if (!isReal && targetKey === actorKey) {
        this.phase = actorKey === 'player' ? PHASES.PLAYER_TURN : PHASES.ENEMY_TURN;
      } else {
        this.phase = actorKey === 'player' ? PHASES.ENEMY_TURN : PHASES.PLAYER_TURN;
      }

      if (this.mode === 'bot' && this.phase === PHASES.ENEMY_TURN) {
        this.queueBotAction();
      }
    },
    async queueBotAction() {
      if (this.mode !== 'bot') return;
      if (this.phase !== PHASES.ENEMY_TURN) return;

      await sleep(900);
      const decision = decideBotAction(this.$state);
      if (decision.type === 'item') {
        this.lastResult = { text: `Le bot utilise ${describeBotItem(decision.itemId)}.` };
        await this.useItem(decision.itemId, 'enemy');
      } else {
        await this.shoot(decision.target);
      }
    }
  }
});
