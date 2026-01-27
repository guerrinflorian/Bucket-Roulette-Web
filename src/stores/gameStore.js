import { defineStore } from 'pinia';
import { createBarrel, formatBarrelAnnouncement, isEmpty, remainingCounts } from '../engine/barrel.js';
import { PHASES, MAX_HP, ITEMS_PER_RELOAD } from '../engine/rules.js';
import { rollRandomItems, applyItem } from '../engine/items.js';
import { decideBotAction, describeBotItem } from '../engine/bot.js';
import { getBotLevel } from '../engine/botLevels/index.js';
import { audioManager } from '../engine/audio.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PLAYER_KEYS = ['player', 'enemy', 'enemy2'];
const DEFAULT_TURN_ORDER = ['player', 'enemy'];
const PHASE_BY_KEY = {
  player: PHASES.PLAYER_TURN,
  enemy: PHASES.ENEMY_TURN,
  enemy2: PHASES.ENEMY_TWO_TURN
};
const TURN_PHASES = [PHASES.PLAYER_TURN, PHASES.ENEMY_TURN, PHASES.ENEMY_TWO_TURN];

const getPhaseForKey = (key) => PHASE_BY_KEY[key] || PHASES.PLAYER_TURN;

export const useGameStore = defineStore('game', {
  state: () => ({
    mode: 'bot',
    botDifficulty: 1,
    phase: PHASES.COIN_FLIP,
    currentTurn: null,
    sessionActive: false,
    barrel: createBarrel(),
    players: {
      player: {
        id: 'player',
        socketId: null,
        userId: null,
        elo: null,
        isActive: true,
        name: 'Vous',
        hp: MAX_HP,
        maxHp: MAX_HP,
        items: [],
        shotsFired: 0,
        shotsTaken: 0,
        itemsUsed: 0,
        doubleDamageNextShot: false,
        peekedNext: null,
        scannerHint: null,
        skipNextTurn: false
      },
      enemy: {
        id: 'enemy',
        socketId: null,
        userId: null,
        elo: null,
        isActive: true,
        name: 'Adversaire',
        hp: MAX_HP,
        maxHp: MAX_HP,
        items: [],
        shotsFired: 0,
        shotsTaken: 0,
        itemsUsed: 0,
        doubleDamageNextShot: false,
        peekedNext: null,
        scannerHint: null,
        skipNextTurn: false
      },
      enemy2: {
        id: 'enemy2',
        socketId: null,
        userId: null,
        elo: null,
        isActive: false,
        name: 'Adversaire 2',
        hp: MAX_HP,
        maxHp: MAX_HP,
        items: [],
        shotsFired: 0,
        shotsTaken: 0,
        itemsUsed: 0,
        doubleDamageNextShot: false,
        peekedNext: null,
        scannerHint: null,
        skipNextTurn: false
      }
    },
    turnOrder: [...DEFAULT_TURN_ORDER],
    lastResult: null,
    lastAction: null,
    winner: null,
    roomId: null,
    isRanked: false,
    rankedMatchId: null,
    isAnimating: false,
    reloadCount: 0,
    lastReloadInfo: null,
    lastReloadAt: null,
    botMemory: {
      realRemaining: 0,
      blankRemaining: 0
    },
    turnTimer: {
      remaining: null,
      paused: false,
      phase: null,
      autoTimeout: true
    },
    // Pending bot action for UI to handle
    pendingBotAction: null,
    // Pending bot item use for UI to display
    pendingBotItem: null,
    // Prevent duplicate bot queues while waiting
    botActionQueued: false,
    timeoutStreak: {
      player: 0,
      enemy: 0,
      enemy2: 0
    },
    // Flag to prevent reload modal during network hydration
    isHydratingFromNetwork: false,
    // Pending handcuff target selection for 1v1v1
    pendingHandcuff: null
  }),
  getters: {
    isPlayerTurn: (state) => state.phase === PHASES.PLAYER_TURN,
    isEnemyTurn: (state) => state.phase === PHASES.ENEMY_TURN,
    counts: (state) => remainingCounts(state.barrel)
  },
  actions: {
    initGame(mode = 'bot', options = {}) {
      this.mode = mode;
      this.botDifficulty = options.botDifficulty ?? this.botDifficulty ?? 1;
      this.sessionActive = true;
      this.botActionQueued = false;
      this.phase = PHASES.COIN_FLIP;
      this.currentTurn = null;
      this.barrel = createBarrel();
      this.lastReloadInfo = formatBarrelAnnouncement(this.barrel);
      this.lastReloadAt = Date.now();
      const playerKeys = options.playerKeys ?? DEFAULT_TURN_ORDER;
      this.turnOrder = [...playerKeys];

      // Determine HP settings based on mode and difficulty
      let playerMaxHp = MAX_HP;
      let botMaxHp = MAX_HP;

      if (mode === 'bot') {
        const level = getBotLevel(this.botDifficulty);
        if (level.hp) {
          playerMaxHp = level.hp.player;
          botMaxHp = level.hp.bot;
        }
      }

      PLAYER_KEYS.forEach((key) => {
        const isActive = playerKeys.includes(key);
        const player = this.players[key];
        if (!player) return;
        player.isActive = isActive;
        player.socketId = null;
        player.userId = null;
        player.elo = null;
        player.name = key === 'player' ? 'Vous' : key === 'enemy2' ? 'Adversaire 2' : 'Adversaire';

        // Set HP based on role (player vs enemy)
        const roleMaxHp = key === 'player' ? playerMaxHp : botMaxHp;

        // In multiplayer, everyone gets standard MAX_HP (which is playerMaxHp default)
        // unless we want custom multiplayer rules later.
        // But for now, if not bot mode, playerMaxHp is MAX_HP anyway.
        // Wait, if mode != bot, botMaxHp is MAX_HP. So logic works for both.

        player.maxHp = roleMaxHp;
        player.hp = isActive ? roleMaxHp : 0;

        player.items = [];
        player.shotsFired = 0;
        player.shotsTaken = 0;
        player.itemsUsed = 0;
        player.doubleDamageNextShot = false;
        player.peekedNext = null;
        player.scannerHint = null;
        player.skipNextTurn = false;
      });
      if (mode === 'bot') {
        const level = getBotLevel(this.botDifficulty);
        this.players.enemy.name = level.name;
        this.players.enemy.isActive = true;
        this.players.enemy2.isActive = false;
        this.turnOrder = [...DEFAULT_TURN_ORDER];
      }
      this.lastResult = null;
      this.lastAction = null;
      this.winner = null;
      this.isRanked = Boolean(options?.isRanked);
      this.rankedMatchId = options?.rankedMatchId ?? null;
      this.reloadCount = 1;
      this.lastResult = { text: `🔄 ${this.lastReloadInfo}` };
      this.timeoutStreak.player = 0;
      this.timeoutStreak.enemy = 0;
      this.timeoutStreak.enemy2 = 0;
      this.resetBotMemory();
      this.dealItems();
    },
    setBotDifficulty(level) {
      this.botDifficulty = level;
    },
    setRoom(id) {
      this.roomId = id;
    },
    getActivePlayerKeys() {
      return this.turnOrder.filter((key) => {
        const player = this.players[key];
        return player?.isActive && player.hp > 0;
      });
    },
    getNextTurnKey(order, fromKey) {
      const index = order.indexOf(fromKey);
      if (index === -1) return order[0];
      return order[(index + 1) % order.length];
    },
    setTurnByKey(key) {
      this.currentTurn = key;
      this.phase = getPhaseForKey(key);
    },
    isTurnPhase() {
      return TURN_PHASES.includes(this.phase);
    },
    // Hydrate state from network (for multiplayer sync)
    hydrateFromNetwork(state) {
      this.isHydratingFromNetwork = true;
      this.sessionActive = true;
      if (state.phase) this.phase = state.phase;
      if (state.currentTurn) this.currentTurn = state.currentTurn;
      if (state.turnOrder) this.turnOrder = [...state.turnOrder];

      // smart barrel hydration:
      // If chambers changed (reload), always accept new barrel to sync distributions.
      // If only index changed (shot/item), only accept if not animating to avoid glitches.
      if (state.barrel) {
        const currentChambers = JSON.stringify(this.barrel.chambers);
        const newChambers = JSON.stringify(state.barrel.chambers);
        const isNewBarrel = currentChambers !== newChambers;

        if (isNewBarrel || !this.isAnimating) {
          this.barrel = state.barrel;
        }
      }

      if (state.players) {
        if (state.players.player) Object.assign(this.players.player, state.players.player);
        if (state.players.enemy) Object.assign(this.players.enemy, state.players.enemy);
        if (state.players.enemy2) Object.assign(this.players.enemy2, state.players.enemy2);
      }
      if (state.isRanked !== undefined) this.isRanked = state.isRanked;
      if (state.rankedMatchId !== undefined) this.rankedMatchId = state.rankedMatchId;
      if (state.lastResult !== undefined) this.lastResult = state.lastResult;
      if (state.lastAction !== undefined) this.lastAction = state.lastAction;
      if (state.winner !== undefined) this.winner = state.winner;

      if (state.lastReloadInfo !== undefined) this.lastReloadInfo = state.lastReloadInfo;
      // Update reloadCount to trigger standard reload modal if server says so
      if (state.reloadCount !== undefined && state.reloadCount > this.reloadCount) {
        this.reloadCount = state.reloadCount;
      }
      if (state.turnTimer) {
        if ('remaining' in state.turnTimer) {
          this.turnTimer.remaining = state.turnTimer.remaining;
        }
        if ('paused' in state.turnTimer) {
          this.turnTimer.paused = state.turnTimer.paused;
        }
        if ('phase' in state.turnTimer) {
          this.turnTimer.phase = state.turnTimer.phase;
        }
        if ('autoTimeout' in state.turnTimer) {
          this.turnTimer.autoTimeout = state.turnTimer.autoTimeout;
        }
      }
      if (state.timeoutStreak) {
        this.timeoutStreak.player = state.timeoutStreak.player ?? this.timeoutStreak.player;
        this.timeoutStreak.enemy = state.timeoutStreak.enemy ?? this.timeoutStreak.enemy;
        this.timeoutStreak.enemy2 = state.timeoutStreak.enemy2 ?? this.timeoutStreak.enemy2;
      }
      // Reset hydration flag after a microtask to allow reactive updates to settle
      queueMicrotask(() => {
        this.isHydratingFromNetwork = false;
      });
    },
    // Serialize state for network sync
    serializeForNetwork() {
      return {
        phase: this.phase,
        currentTurn: this.currentTurn,
        turnOrder: this.turnOrder,
        barrel: this.barrel,
        players: this.players,
        lastResult: this.lastResult,
        lastAction: this.lastAction,
        winner: this.winner,
        reloadCount: this.reloadCount,
        lastReloadInfo: this.lastReloadInfo,
        turnTimer: this.turnTimer,
        timeoutStreak: this.timeoutStreak,
        onlineFlipResult: this.currentTurn,
        isRanked: this.isRanked,
        rankedMatchId: this.rankedMatchId
      };
    },
    reloadBarrel({ notify = true } = {}) {
      this.barrel = createBarrel();
      this.lastReloadInfo = formatBarrelAnnouncement(this.barrel);
      this.lastReloadAt = Date.now();
      PLAYER_KEYS.forEach((key) => {
        if (this.players[key]) {
          this.players[key].scannerHint = null;
        }
      });
      this.resetBotMemory();
      this.dealItems();
      if (notify) {
        this.reloadCount += 1;
        this.lastResult = { text: `🔄 ${this.lastReloadInfo}` };
      }
    },
    dealItems() {
      PLAYER_KEYS.forEach((key) => {
        const player = this.players[key];
        if (!player?.isActive || player.hp <= 0) return;
        player.items.push(...rollRandomItems(ITEMS_PER_RELOAD));
      });
      audioManager.play('reload');
    },
    resetBotMemory() {
      const counts = remainingCounts(this.barrel);
      this.botMemory.realRemaining = counts.real;
      this.botMemory.blankRemaining = counts.blank;
    },
    updateBotMemoryAfterShot(shot) {
      if (shot === 'real') {
        this.botMemory.realRemaining = Math.max(0, this.botMemory.realRemaining - 1);
      } else if (shot === 'blank') {
        this.botMemory.blankRemaining = Math.max(0, this.botMemory.blankRemaining - 1);
      }
    },
    updateBotMemoryAfterEject(removed) {
      if (removed === 'real') {
        this.botMemory.realRemaining = Math.max(0, this.botMemory.realRemaining - 1);
      } else if (removed === 'blank') {
        this.botMemory.blankRemaining = Math.max(0, this.botMemory.blankRemaining - 1);
      }
    },
    updateBotMemoryAfterInverter(original, flipped) {
      if (original === flipped) return;
      if (original === 'real' && flipped === 'blank') {
        this.botMemory.realRemaining = Math.max(0, this.botMemory.realRemaining - 1);
        this.botMemory.blankRemaining += 1;
      }
      if (original === 'blank' && flipped === 'real') {
        this.botMemory.blankRemaining = Math.max(0, this.botMemory.blankRemaining - 1);
        this.botMemory.realRemaining += 1;
      }
    },
    updateScannerHintsAfterAdvance() {
      const updateHint = (actor) => {
        if (!actor?.scannerHint) return;
        if (actor.scannerHint <= 1) {
          actor.scannerHint = null;
        } else {
          actor.scannerHint -= 1;
        }
      };
      PLAYER_KEYS.forEach((key) => updateHint(this.players[key]));
    },
    setCoinFlipResult(starts) {
      this.setTurnByKey(starts);
      const starterName = this.players[starts]?.name || 'Joueur';
      this.lastResult = { text: `${starterName} commence.` };
      if (this.mode === 'bot' && starts === 'enemy') {
        this.queueBotAction();
      }
    },
    resolveNextTurn(nextActorKey) {
      const activeOrder = this.getActivePlayerKeys();
      if (activeOrder.length <= 1) {
        this.winner = activeOrder[0] || null;
        this.phase = PHASES.GAME_OVER;
        return;
      }

      let nextKey = nextActorKey;
      if (!nextKey || !activeOrder.includes(nextKey)) {
        nextKey = this.getNextTurnKey(activeOrder, this.currentTurn);
      }

      const skipped = [];
      for (let i = 0; i < activeOrder.length; i += 1) {
        if (this.players[nextKey]?.skipNextTurn) {
          this.players[nextKey].skipNextTurn = false;
          skipped.push(nextKey);
          nextKey = this.getNextTurnKey(activeOrder, nextKey);
        } else {
          break;
        }
      }

      this.setTurnByKey(nextKey);

      if (skipped.length) {
        const skippedNames = skipped.map((key) => this.players[key]?.name || 'Joueur');
        const message = skippedNames.length === 1
          ? `⛓️ ${skippedNames[0]} est menotté et passe son tour.`
          : `⛓️ ${skippedNames.join(' et ')} sont menottés et passent leur tour.`;
        this.lastResult = { text: message };
      }

      if (this.mode === 'bot' && this.currentTurn === 'enemy') {
        this.queueBotAction();
      }
    },
    async useItem(itemId, actorKey = 'player', targetKey = null) {
      const actor = this.players[actorKey];
      if (!actor || this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) {
        return;
      }
      if (this.currentTurn !== actorKey) {
        return;
      }

      if (!actor.items.includes(itemId)) {
        return;
      }

      const currentBullet = itemId === 'eject' || itemId === 'inverter'
        ? this.barrel.chambers[this.barrel.index]
        : null;
      const result = applyItem(this.$state, actorKey, itemId, targetKey);
      if (!result.success) {
        if (result.pending) {
          // Item use is pending target selection (e.g. handcuffs in 1v1v1)
          // State has been updated (pendingHandcuff set), simply return.
          return;
        }
        this.lastResult = { text: result.message };
        return;
      }
      if (itemId === 'eject' && currentBullet) {
        this.updateBotMemoryAfterEject(currentBullet);
        this.updateScannerHintsAfterAdvance();
      }
      if (itemId === 'inverter' && currentBullet) {
        const flipped = currentBullet === 'real' ? 'blank' : 'real';
        this.updateBotMemoryAfterInverter(currentBullet, flipped);
      }
      this.timeoutStreak[actorKey] = 0;
      const index = actor.items.indexOf(itemId);
      if (index !== -1) {
        actor.items.splice(index, 1);
      }
      this.lastResult = { text: result.message };
      this.lastAction = {
        type: 'item',
        actor: actorKey,
        itemId,
        target: targetKey
      };
      // Clear pending state if successful
      if (this.pendingHandcuff && this.pendingHandcuff.actorKey === actorKey) {
        this.pendingHandcuff = null;
      }
      actor.itemsUsed += 1;
      audioManager.play('click');

      if (this.mode === 'bot' && actorKey === 'enemy') {
        await sleep(600);
        this.queueBotAction();
      }
    },
    async resolveHandcuffTarget(targetKey) {
      if (!this.pendingHandcuff) return;

      const { actorKey } = this.pendingHandcuff;
      this.pendingHandcuff = null; // Clear pending state

      // Re-call useItem with the selected target
      await this.useItem('handcuffs', actorKey, targetKey);
    },
    async shoot(target, actorKeyOverride = null, options = {}) {
      if (this.phase === PHASES.ANIMATING || this.phase === PHASES.GAME_OVER) return;
      if (!this.isTurnPhase()) return;

      const previousPhase = this.phase;
      const { allowReload = true, skipDelay = false } = options;

      try {
        const actorKey = actorKeyOverride || this.currentTurn;
        const actor = this.players[actorKey];
        if (!actor) return;

        // Only auto-reload if not online (in online, server sends the new barrel)
        // Or if we are the host/local? No, online mode relies on server state.
        if (isEmpty(this.barrel) && this.mode !== 'online') {
          this.reloadBarrel({ notify: true });
        }

        this.phase = PHASES.ANIMATING;
        let targetKey = target || actorKey;
        if (!this.players[targetKey] || !this.players[targetKey].isActive) {
          targetKey = actorKey;
        }

        const shot = this.barrel.chambers[this.barrel.index];
        this.barrel.index += 1;
        this.barrel.firstShotFired = true;
        this.barrel.invertedNext = null;
        PLAYER_KEYS.forEach((key) => {
          if (this.players[key]) {
            this.players[key].peekedNext = null;
          }
        });
        this.updateBotMemoryAfterShot(shot);
        this.updateScannerHintsAfterAdvance();

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

        this.timeoutStreak[actorKey] = 0;

        if (damage > 0) {
          this.players[targetKey].hp = Math.max(0, this.players[targetKey].hp - damage);
          this.players[targetKey].shotsTaken = (this.players[targetKey].shotsTaken || 0) + 1;
        }

        this.lastAction = {
          type: 'shot',
          actor: actorKey,
          target: targetKey,
          shot,
          damage
        };
        if (damage > 0) {
          actor.shotsFired += 1;
        }

        this.lastResult = {
          text: isReal ? 'BALLE RÉELLE !' : 'À BLANC...'
        };

        if (!skipDelay) {
          await sleep(900);
        }

        const activePlayers = this.getActivePlayerKeys();
        if (activePlayers.length <= 1) {
          this.winner = activePlayers[0] || null;
          this.phase = PHASES.GAME_OVER;
          return;
        }

        if (allowReload && isEmpty(this.barrel)) {
          this.reloadBarrel({ notify: true });
        }

        if (!isReal && targetKey === actorKey) {
          this.resolveNextTurn(actorKey);
        } else {
          const nextActor = this.getNextTurnKey(this.getActivePlayerKeys(), actorKey);
          this.resolveNextTurn(nextActor);
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
      if (!this.isTurnPhase()) return;

      const actorKey = actorKeyOverride || this.currentTurn;
      const actorName = this.players[actorKey]?.name || 'Joueur';

      this.lastAction = {
        type: 'timeout',
        actor: actorKey
      };
      this.lastResult = {
        text: `⏳ ${actorName} a perdu son tour.`
      };

      this.timeoutStreak[actorKey] += 1;
      if (this.timeoutStreak[actorKey] >= 3) {
        this.players[actorKey].hp = 0;
        const activePlayers = this.getActivePlayerKeys();
        if (activePlayers.length <= 1) {
          this.winner = activePlayers[0] || null;
          this.phase = PHASES.GAME_OVER;
          this.lastResult = {
            text: `🏳️ ${actorName} a été éliminé pour inactivité.`,
            afkPlayer: actorKey
          };
          return;
        }
        this.lastResult = {
          text: `🏳️ ${actorName} est AFK et passe son tour.`
        };
      }

      const nextActor = this.getNextTurnKey(this.getActivePlayerKeys(), actorKey);
      this.resolveNextTurn(nextActor);
    },
    async queueBotAction() {
      if (this.mode !== 'bot' || this.botActionQueued) return;
      this.botActionQueued = true;
      let shouldRepeat = false;

      try {
        // Safety check: if phase is ANIMATING, wait and check again
        if (this.phase === PHASES.ANIMATING) {
          await sleep(1000);
          if (this.phase === PHASES.ANIMATING) {
            // Force reset to enemy turn if stuck
            this.setTurnByKey('enemy');
          }
        }

        if (this.currentTurn !== 'enemy') return;

        // Delay so player can see it's enemy turn
        const baseDelay = 2800;
        const reloadPauseMs = 6200;
        const timeSinceReload = this.lastReloadAt ? Date.now() - this.lastReloadAt : reloadPauseMs;
        const reloadDelay = timeSinceReload < reloadPauseMs ? reloadPauseMs - timeSinceReload : 0;
        await sleep(baseDelay + reloadDelay);

        // Double check phase hasn't changed
        if (this.currentTurn !== 'enemy') return;

        const decision = decideBotAction(this.$state);

        if (decision.type === 'item') {
          // Signal item use to UI
          this.pendingBotItem = decision.itemId;
          await sleep(100);
          const targetKey = decision.itemId === 'handcuffs' ? 'player' : null;
          await this.useItem(decision.itemId, 'enemy', targetKey);

          // Clear pending item
          this.pendingBotItem = null;

          // Delay after item use
          await sleep(800);

          // Check if bot should act again
          if (this.currentTurn === 'enemy') {
            shouldRepeat = true;
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
      } finally {
        this.botActionQueued = false;
      }

      if (shouldRepeat) {
        this.queueBotAction();
      }
    },

    clearPendingBotAction() {
      this.pendingBotAction = null;
    }
  }
});
