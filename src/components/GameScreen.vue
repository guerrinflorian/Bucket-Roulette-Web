<template>
  <q-page class="game-wrapper">
    <GameScene
      ref="gameSceneRef"
      v-if="gameStore.players.player"
      :player="uiPlayer"
      :opponents="uiOpponents"
      :players-by-key="gameStore.players"
      :current-turn-key="gameStore.currentTurn"
      :local-player-key="localPlayerKey"
      :turn-order="gameStore.turnOrder"
      :barrel="gameStore.barrel"
      :phase="uiPhase"
      :is-flip-visible="isFlipVisible"
      :last-result="gameStore.lastResult"
      :last-action="gameStore.lastAction"
      :is-animating="gameStore.isAnimating"
      :can-act-override="canAct"
      :can-use-items="canUseItems"
      :turn-time-left="turnCountdown"
      :can-send-emoji="canSendEmoji"
      :emoji-cooldown-left="emojiCooldownLeft"
      :player-emojis="playerEmojis"
      @shoot="handleShoot"
      @use-item="handleUseItem"
      @send-emoji="handleSendEmoji"
    />
    
    <!-- Fallback if store not ready -->
    <div v-else class="loading">Chargement...</div>

    <!-- Coin Flip Modal -->
    <CoinFlipModal 
      v-if="gameStore.phase === 'coin_flip'" 
      @resolved="onCoinFlip" 
    />

    <!-- Multiplayer start coin flip (forced, shown once per session) -->
    <CoinFlipModal
      v-if="showOnlineFlip"
      :forced-result="onlineFlipResult"
      @resolved="onOnlineFlipResolved"
    />

    <!-- Multiplayer turn order modal (3+ players) -->
    <q-dialog v-model="showOrderModal" persistent>
      <q-card class="order-modal-card">
        <q-card-section class="text-center">
          <div class="order-modal-icon">🎲</div>
          <div class="order-modal-title">Ordre de tir</div>
          <div class="order-modal-subtitle">
            {{ orderRevealDone ? 'Ordre déterminé !' : 'Tirage aléatoire en cours...' }}
          </div>
          <div class="order-modal-list">
            <div
              v-for="(entry, index) in orderModalEntries"
              :key="entry.key"
              class="order-modal-item"
              :class="{
                revealed: index <= orderRevealIndex,
                active: entry.key === gameStore.currentTurn,
                self: entry.key === localPlayerKey
              }"
            >
              <span class="order-index">{{ index + 1 }}</span>
              <span class="order-name">{{ entry.name }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Game Over Dialog -->
    <q-dialog v-model="showGameOver" persistent>
      <q-card class="game-over-card" :class="isLocalWinner ? 'card-victory' : 'card-defeat'">
        <q-card-section class="text-center">
          <div class="game-over-icon">
            {{ isLocalWinner ? '👑' : '💀' }}
          </div>
          <h1 class="game-over-title">
            {{ isLocalWinner ? 'VICTOIRE' : 'DÉFAITE' }}
          </h1>
          <p class="game-over-subtitle">
            {{ gameOverSubtitle }}
          </p>
        </q-card-section>
        <q-card-actions align="center" class="pb-6">
          <q-btn 
            unelevated 
            :color="isLocalWinner ? 'positive' : 'negative'" 
            label="Retour au menu" 
            class="px-8 py-2 text-lg font-bold"
            @click="restart"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch, toRaw } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { Notify } from 'quasar';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useMatchStore } from '../stores/matchStore.js';
import { useWeaponSkinsStore } from '../stores/weaponSkinsStore.js';
import { getBotLevel } from '../engine/botLevels/index.js';
import { audioManager } from '../engine/audio.js';
import { remainingCounts } from '../engine/barrel.js';
import GameScene from './GameScene.vue';
import CoinFlipModal from './CoinFlipModal.vue';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();
const authStore = useAuthStore();
const matchStore = useMatchStore();
const weaponSkinsStore = useWeaponSkinsStore();
const gameSceneRef = ref(null);
const matchSubmitted = ref(false);
const cloneBarrel = (barrel) => {
  const source = toRaw(barrel) || barrel;
  return {
    chambers: Array.isArray(source?.chambers) ? [...source.chambers] : [],
    index: Number.isFinite(source?.index) ? source.index : 0,
    firstShotFired: Boolean(source?.firstShotFired),
    invertedNext: source?.invertedNext ? { ...source.invertedNext } : null
  };
};
const forfeitApplied = ref(false);
const playerUserIds = computed(() => {
  const ids = new Set();
  Object.values(gameStore.players).forEach((player) => {
    if (player?.userId) ids.add(player.userId);
  });
  if (authStore.user?.id) ids.add(authStore.user.id);
  return Array.from(ids);
});

const showGameOver = computed(() => gameStore.phase === 'game_over');
const isOnlineMode = computed(() => gameStore.mode === 'online');
const redirectedToLobby = ref(false);
const showOnlineFlip = ref(false);
const isFlipVisible = computed(() => gameStore.phase === 'coin_flip' || showOnlineFlip.value);
const onlineFlipResult = ref(null);
const onlineFlipShown = ref(false);
const showOrderModal = ref(false);
const orderModalShown = ref(false);
const orderRevealIndex = ref(-1);
const orderRevealDone = ref(false);
const orderRevealTimers = [];
const initialFlipResolved = ref(false);
const isHandlingShot = ref(false);
const pendingNetworkState = ref(null);
const isOnlineInitialFlipPending = computed(() => {
  if (!isOnlineMode.value) return false;
  if (onlineFlipShown.value) return false;
  if (!gameStore.currentTurn) return false;
  return isInitialOnlineFlip();
});
const turnCountdown = ref(null);
const currentTimerPhase = ref(null);
const isTurnTimerPaused = ref(false);
const timerBlockCount = ref(0);
const isApplyingTimerState = ref(false);
const TURN_TIME_LIMIT = 15;
const EMOJI_COOLDOWN_MS = 5000;
const EMOJI_DISPLAY_MS = 3000;
const GAME_OVER_REDIRECT_DELAY_MS = 3000;
let turnTimer = null;
let turnTick = null;
let emojiTick = null;
let gameOverRedirectTimer = null;
let visibilityHandler = null;
const emojiNow = ref(Date.now());
const playerEmojis = ref({});
const emojiLastSentAt = ref({});
const emojiTimeouts = {};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const createActionId = () => {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const processedActionIds = new Set();
const hasProcessedAction = (actionId) => actionId && processedActionIds.has(actionId);
const markActionProcessed = (actionId) => {
  if (!actionId) return;
  processedActionIds.add(actionId);
};
const turnTimeLimit = computed(() => {
  if (isOnlineMode.value && gameStore.turnOrder.length >= 3) {
    return 20;
  }
  return TURN_TIME_LIMIT;
});
const localPlayerKey = computed(() => {
  if (!isOnlineMode.value) return 'player';
  const socketId = netStore.socketId;
  const entries = Object.entries(gameStore.players);
  const match = entries.find(([, player]) => player?.socketId === socketId);
  return match?.[0] || 'player';
});

const isMyTurn = computed(() => {
  if (!isOnlineMode.value) return gameStore.phase === 'player_turn';
  return gameStore.currentTurn === localPlayerKey.value;
});

const uiPhase = computed(() => gameStore.phase);

const mapOnlineFlipResult = (result) => {
  if (!isOnlineMode.value || !result) return result;
  if (netStore.isHost) return result;
  return result === 'player' ? 'enemy' : 'player';
};

const isInitialOnlineFlip = (state = null) => {
  const lastAction = state?.lastAction ?? gameStore.lastAction;
  return !lastAction;
};

const uiNameForStoreKey = (key) => {
  return gameStore.players[key]?.name || 'Joueur';
};

const itemNotifyLabels = {
  heart: '+1 PV',
  double: 'Double dégâts',
  peek: 'Voir la balle',
  eject: 'Éjecter',
  handcuffs: 'Les Menottes',
  inverter: "L'Inverseur",
  scanner: 'Scanner'
};

const actionNotifySignature = ref(null);

const formatActorName = (actorKey) => {
  if (!actorKey) return 'Un joueur';
  return actorKey === localPlayerKey.value ? 'Vous' : uiNameForStoreKey(actorKey);
};

const formatTargetName = (targetKey) => {
  if (!targetKey) return 'un joueur';
  if (targetKey === localPlayerKey.value) return 'vous';
  return uiNameForStoreKey(targetKey);
};

const shouldNotifyAction = (action) => {
  if (!action) return false;
  if (action.type === 'shot') return false;
  if (action.type === 'item') {
    if (action.itemId === 'peek' || action.itemId === 'eject') return false;
    if (gameStore.mode === 'bot' && action.actor && action.actor !== localPlayerKey.value) {
      return false;
    }
  }
  return true;
};

const buildActionNotifyMessage = (action) => {
  const actorName = formatActorName(action.actor);

  if (action.type === 'item') {
    switch (action.itemId) {
      case 'handcuffs': {
        const targetName = formatTargetName(action.target);
        return `⛓️ ${actorName} a menotté ${targetName}.`;
      }
      case 'heart':
        return `❤️ ${actorName} a récupéré 1 PV.`;
      case 'double':
        return `⚡ ${actorName} a activé Double dégâts.`;
      case 'inverter':
        return `🔁 ${actorName} a utilisé l'Inverseur.`;
      case 'scanner':
        return `📡 ${actorName} a utilisé le Scanner.`;
      default: {
        const label = itemNotifyLabels[action.itemId] || 'un objet';
        return `📦 ${actorName} a utilisé ${label}.`;
      }
    }
  }

  if (action.type === 'timeout') {
    return `⏳ ${actorName} a perdu son tour.`;
  }

  if (action.type === 'surrender') {
    return `🏳️ ${actorName} a abandonné.`;
  }

  return null;
};

const getVictoryType = () => {
  const text = gameStore.lastResult?.text?.toLowerCase() || '';
  if (text.includes('abandon') || text.includes('quitté')) {
    return 'abandon';
  }
  if (text.includes('afk') || text.includes('inactivité')) {
    return 'abandon';
  }
  if (gameStore.lastAction?.type === 'timeout') {
    return 'abandon';
  }
  return 'death';
};

const getMatchPlayerEntries = () => {
  const order = gameStore.turnOrder.length
    ? gameStore.turnOrder
    : Object.keys(gameStore.players);
  return order
    .map((key) => ({ key, player: gameStore.players[key] }))
    .filter(({ player }) => player?.isActive);
};

const rankParticipants = (entries) => {
  const winnerKey = gameStore.winner;
  const winnerPresent = entries.some((entry) => entry.key === winnerKey);
  return [...entries]
    .sort((a, b) => {
      if (winnerPresent) {
        if (a.key === winnerKey) return -1;
        if (b.key === winnerKey) return 1;
      }
      const hpDelta = (b.player?.hp ?? 0) - (a.player?.hp ?? 0);
      if (hpDelta !== 0) return hpDelta;
      return gameStore.turnOrder.indexOf(a.key) - gameStore.turnOrder.indexOf(b.key);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
};

const shouldSubmitOnlineMatch = () => {
  if (!isOnlineMode.value) return true;
  const hostEntry = netStore.roomPlayers.find((player) => player.isHost);
  if (!hostEntry?.userId) return true;
  return hostEntry.id === netStore.socketId;
};

const buildParticipantsPayload = (entries) =>
  entries.map(({ key, player, rank }) => ({
    userId: player.userId || (key === localPlayerKey.value ? authStore.user?.id : null),
    rank,
    finalHp: player.hp,
    shotsFired: player.shotsFired ?? 0,
    shotsTaken: player.shotsTaken ?? 0,
    itemsUsed: player.itemsUsed ?? 0,
    isBot: !isOnlineMode.value && key !== 'player'
  }));

const submitMatchResult = async () => {
  if (matchSubmitted.value) return;
  if (!authStore.isAuthenticated) return;
  if (isOnlineMode.value && !shouldSubmitOnlineMatch()) return;

  matchSubmitted.value = true;
  const entries = rankParticipants(getMatchPlayerEntries());
  const victoryType = getVictoryType();
  const roundsPlayed = gameStore.reloadCount ?? null;
  const winnerEntry = entries.find((entry) => entry.key === gameStore.winner);
  const winnerId = winnerEntry?.player?.userId || null;

  try {
    if (isOnlineMode.value) {
      const mode = entries.length >= 3 ? '1v1v1' : '1v1';
      await matchStore.recordMultiplayerMatch({
        mode,
        victoryType,
        roundsPlayed,
        winnerId,
        participants: buildParticipantsPayload(entries)
      });
    } else {
      const botLevel = getBotLevel(gameStore.botDifficulty);
      const soloParticipants = buildParticipantsPayload(entries).filter((participant) => !participant.isBot);
      await matchStore.recordSoloMatch({
        victoryType,
        botLevel: botLevel.key,
        roundsPlayed,
        winnerId,
        participants: soloParticipants,
        difficulty: botLevel.key,
        isDefeated: gameStore.winner !== 'player'
      });
    }
  } catch (error) {
    console.warn('Failed to record match:', error);
  }
};

const canAct = computed(() => {
  if (gameStore.isAnimating) return false;
  if (!gameStore.isTurnPhase()) return false;
  if (!isOnlineMode.value) {
    return gameStore.phase === 'player_turn';
  }
  return isMyTurn.value;
});

const canUseItems = computed(() => {
  if (!canAct.value) return false;
  if (turnCountdown.value !== null && turnCountdown.value <= 1) return false;
  return true;
});

const isEmojiCooldownActive = computed(() => {
  const lastSent = emojiLastSentAt.value[localPlayerKey.value] || 0;
  return emojiNow.value - lastSent < EMOJI_COOLDOWN_MS;
});

const isEmojiDisabledByTimer = computed(() => {
  return turnCountdown.value !== null && turnCountdown.value <= 3;
});

const canSendEmoji = computed(() => {
  return !gameStore.isAnimating && !isEmojiDisabledByTimer.value && !isEmojiCooldownActive.value;
});

const emojiCooldownLeft = computed(() => {
  const lastSent = emojiLastSentAt.value[localPlayerKey.value] || 0;
  const remaining = EMOJI_COOLDOWN_MS - (emojiNow.value - lastSent);
  return Math.max(0, Math.ceil(remaining / 1000));
});

// UI mapping: local player is always shown at the bottom
const uiPlayer = computed(() => {
  const key = localPlayerKey.value;
  return gameStore.players[key] || gameStore.players.player;
});

const uiOpponents = computed(() => {
  return gameStore.turnOrder
    .filter((key) => key !== localPlayerKey.value)
    .map((key) => gameStore.players[key])
    .filter((player) => player?.isActive && player.hp > 0);
});

const isLocalWinner = computed(() => {
  if (!gameStore.winner) return false;
  if (!isOnlineMode.value) return gameStore.winner === 'player';
  return gameStore.winner === localPlayerKey.value;
});

const gameOverSubtitle = computed(() => {
  const lastText = gameStore.lastResult?.text || '';
  const afkPlayer = gameStore.lastResult?.afkPlayer;
  
  // Check if game ended due to AFK
  if (afkPlayer) {
    const isLocalPlayerAfk = afkPlayer === localPlayerKey.value;
    if (isLocalPlayerAfk) {
      return '⏳ Vous avez été éliminé pour inactivité.';
    }
    return `🏆 ${lastText.replace('🏳️ ', '')}`;
  }
  
  // Check if game ended due to abandonment
  if (/abandon/i.test(lastText)) {
    return isLocalWinner.value ? `🏆 ${lastText.replace('🏳️ ', '')}` : lastText;
  }
  
  return isLocalWinner.value ? 'Vous avez survécu !' : 'Vous êtes mort...';
});

const shouldAutoTimeout = computed(() => {
  if (!isOnlineMode.value) return true;
  return netStore.isHost;
});

const onlineActorKey = computed(() => localPlayerKey.value);
const orderModalEntries = computed(() => gameStore.turnOrder.map((key) => ({
  key,
  name: gameStore.players[key]?.name || 'Joueur'
})));

const settleWithTimeout = async (promise, timeoutMs, label = 'animation') => {
  if (!promise || typeof promise.then !== 'function') return;
  try {
    await Promise.race([promise, sleep(timeoutMs)]);
  } catch (error) {
    console.warn(`Animation "${label}" failed:`, error);
  }
};

// Watch for pending bot shoot action
watch(() => gameStore.pendingBotAction, async (action) => {
  if (action && action.type === 'shoot') {
    // Always clear the pending action first to avoid blocking
    gameStore.clearPendingBotAction();
    
    // Wait a bit for component to be ready if needed
    if (!gameSceneRef.value) {
      await sleep(100);
    }
    
    // Execute the shot (will work even without animations)
    await handleShoot(action.target);
  }
});

// Watch for pending bot item use - show modal
watch(() => gameStore.pendingBotItem, async (itemId) => {
  if (itemId) {
    // Wait a bit for component to be ready if needed
    if (!gameSceneRef.value) {
      await sleep(100);
    }
    
    if (gameSceneRef.value?.showEnemyUsingItem) {
      await settleWithTimeout(gameSceneRef.value.showEnemyUsingItem(itemId), 2800, 'showEnemyUsingItem');
    } else {
      // Fallback: just wait
      await sleep(2000);
    }
  }
});

// Watch for pending handcuff selection
watch(() => gameStore.pendingHandcuff, async (pending) => {
  if (pending?.actorKey === localPlayerKey.value) {
    if (!gameSceneRef.value) {
      await sleep(100);
    }
    gameSceneRef.value?.openItemTargetPicker?.('handcuffs');
  }
});

const waitForInitialFlip = () => {
  if (initialFlipResolved.value) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const stop = watch(initialFlipResolved, (value) => {
      if (value) {
        stop();
        resolve();
      }
    });
  });
};

const resetTurnTimerAfterAction = () => {
  if (!gameStore.isTurnPhase()) return;
  if (isOnlineMode.value && !netStore.isHost) return;
  startTurnTimer();
};

const syncStateIfHost = (fromNetwork = false) => {
  if (isOnlineMode.value && netStore.isHost && !fromNetwork) {
    netStore.syncState(gameStore.serializeForNetwork());
  }
};

const applyNetworkState = (state) => {
  if (!state) return;
  gameStore.hydrateFromNetwork(state);
  // Show forced coin flip once when initial state arrives
  if (
    !onlineFlipShown.value &&
    state.onlineFlipResult &&
    isInitialOnlineFlip(state) &&
    (state.turnOrder?.length ?? 2) <= 2
  ) {
    onlineFlipResult.value = mapOnlineFlipResult(state.onlineFlipResult);
    showOnlineFlip.value = true;
    onlineFlipShown.value = true;
  }
};

watch(
  () => [gameStore.isAnimating, isHandlingShot.value],
  ([isAnimating, handlingShot]) => {
    if (isAnimating || handlingShot || !pendingNetworkState.value) return;
    const state = pendingNetworkState.value;
    pendingNetworkState.value = null;
    applyNetworkState(state);
  }
);

watch(
  playerUserIds,
  async (ids) => {
    await Promise.all(ids.map((userId) => weaponSkinsStore.fetchPlayerSkin(userId)));
  },
  { immediate: true }
);

// Watch for barrel reload to notify player
watch(() => gameStore.reloadCount, async (count, prev) => {
  if (count && count !== prev) {
    if (!gameSceneRef.value) {
      await sleep(100);
    }
    if (!initialFlipResolved.value) {
      await waitForInitialFlip();
    }
    if (gameSceneRef.value?.showReloadNotice) {
      await pauseTurnTimerFor(async () => {
        await gameSceneRef.value.showReloadNotice(gameStore.lastReloadInfo);
      });
    }
  }
}, { immediate: true });

// Main shoot handler - controls the full animation flow
const handleShoot = async (target, fromNetwork = false, actorKeyOverride = null, actionMeta = null) => {
  // In online mode, check if it's our turn (unless receiving from network)
  if (isOnlineMode.value && !fromNetwork && !isMyTurn.value) {
    console.log('Not your turn!');
    return;
  }
  if (isOnlineMode.value && !fromNetwork && !netStore.isHost) {
    netStore.sendAction({
      type: 'shoot',
      target,
      actorKey: onlineActorKey.value,
      intent: true,
      actionId: createActionId()
    });
    return;
  }
  if (isHandlingShot.value) {
    return;
  }
  isHandlingShot.value = true;

  beginTimerBlock();

  const allowReload = !(isOnlineMode.value && !netStore.isHost);
  const shouldBroadcastResolved = isOnlineMode.value
    && netStore.isHost
    && !actionMeta?.resolved;
  const actionId = actionMeta?.actionId || createActionId();
  const isResolvedNetworkAction = !!(fromNetwork && actionMeta?.resolved);
  if (fromNetwork && actionMeta?.barrelSnapshot) {
    gameStore.barrel = actionMeta.barrelSnapshot;
  }

  if (isResolvedNetworkAction && hasProcessedAction(actionId)) {
    endTimerBlock();
    isHandlingShot.value = false;
    if (actionMeta?.nextState) {
      gameStore.hydrateFromNetwork(actionMeta.nextState);
    }
    return;
  }
  
  if (isResolvedNetworkAction) {
    markActionProcessed(actionId);
    if (actionMeta?.barrelSnapshot) {
      gameStore.barrel = actionMeta.barrelSnapshot;
    }
  }
  
  // Safety: if already animating, wait a bit and check again
  if (gameStore.isAnimating) {
    await sleep(500);
    if (gameStore.isAnimating) {
      gameStore.isAnimating = false;
    }
  }
  
  // 1. Lock UI
  gameStore.isAnimating = true;
  
  let shotResolved = false;

  try {
    // 2. Determine outcome BEFORE anything changes
    const actorKey = actionMeta?.actorKey || actorKeyOverride || gameStore.currentTurn;
    const actor = gameStore.players[actorKey];
    let targetKey = actionMeta?.targetKey || target || actorKey;
    if (!gameStore.players[targetKey]) {
      targetKey = actorKey;
    }
    
    const barrelSnapshot = actionMeta?.barrelSnapshot
      ? cloneBarrel(actionMeta.barrelSnapshot)
      : cloneBarrel(gameStore.barrel);
    const shot = actionMeta?.shot ?? gameStore.barrel.chambers[gameStore.barrel.index];
    const isReal = shot === 'real';
    let damage = actionMeta?.damage ?? (isReal ? 1 : 0);
    if (actionMeta?.damage === undefined && isReal && actor?.doubleDamageNextShot) {
      damage = 2;
    }
    const inverterInfo = actionMeta?.inverterInfo
      ? { ...actionMeta.inverterInfo }
      : gameStore.barrel.invertedNext
        ? { ...gameStore.barrel.invertedNext }
        : null;
    
    const actionData = {
      type: 'shot',
      actor: actorKey,
      target: targetKey,
      shot: shot,
      damage: damage,
      inverterInfo,
      actorName: uiNameForStoreKey(actorKey),
      targetName: uiNameForStoreKey(targetKey),
      actorIsSelf: actorKey === targetKey,
      actorUserId: actor?.userId || (actorKey === localPlayerKey.value ? authStore.user?.id : null)
    };

    if (isOnlineMode.value && netStore.isHost && !fromNetwork && !actionMeta?.resolved) {
      netStore.sendAction({
        type: 'shoot',
        targetKey,
        actorKey,
        intent: true,
        actionId,
        shot,
        damage,
        inverterInfo,
        barrelSnapshot
      });
    }

    const sendResolvedShoot = (nextState) => {
      if (!shouldBroadcastResolved) return;
      netStore.sendAction({
        type: 'shoot',
        targetKey,
        actorKey,
        resolved: true,
        actionId,
        shot,
        damage,
        inverterInfo,
        barrelSnapshot,
        nextState
      });
    };
    
    // Check if only blanks remain (fast mode)
    const counts = remainingCounts(gameStore.barrel);
    const onlyBlanksRemain = counts.real === 0;
    
    if (onlyBlanksRemain) {
      // FAST MODE: No zoom, quick spin, minimal delay
      
      // Quick action text
      await settleWithTimeout(gameSceneRef.value?.showActionChoice?.(actionData), 2200, 'showActionChoice');
      
      // Fast spin (no zoom)
      if (gameSceneRef.value?.rotateBarrel) {
        audioManager.play('spin');
        gameSceneRef.value.rotateBarrel();
        await sleep(600); // Faster spin
      }

      // Reveal the current bullet before showing the result (even on blanks)
      if (gameSceneRef.value?.revealBullet) {
        gameSceneRef.value.revealBullet(isReal);
        setTimeout(() => audioManager.play(isReal ? 'shot' : 'blank'), 200);
      }
      
      // Quick result (just after reveal)
      await settleWithTimeout(gameSceneRef.value?.showShotResult?.(actionData), 2600, 'showShotResult');
      
      // Apply game logic
      if (!isResolvedNetworkAction) {
        await gameStore.shoot(targetKey, actorKey, { allowReload });
        shotResolved = true;
        resetTurnTimerAfterAction();
        sendResolvedShoot(gameStore.serializeForNetwork());
      } else {
        await gameStore.shoot(targetKey, actorKey, { allowReload, skipDelay: true });
      }
      await sleep(200);
      
    } else {
      // NORMAL MODE: Full dramatic animation
      
      // 3. Show action choice modal
      await settleWithTimeout(gameSceneRef.value?.showActionChoice?.(actionData), 2200, 'showActionChoice');
      
      // 4. Zoom on barrel (start sound slightly earlier)
      if (gameSceneRef.value?.startZoom) {
        audioManager.play('spin');
        gameSceneRef.value.startZoom();
        await sleep(600);
      }
      
      // 5. Barrel spins to reveal
      if (gameSceneRef.value?.rotateBarrel) {
        gameSceneRef.value.rotateBarrel();
        await sleep(1200);
      }
      
      // 6. Reveal what's in the chamber
      if (gameSceneRef.value?.revealBullet) {
        gameSceneRef.value.revealBullet(isReal);
        setTimeout(() => audioManager.play(isReal ? 'shot' : 'blank'), 200);
      }
      
      // 7. Show result modal (just after reveal)
      if (gameSceneRef.value?.showShotResult) {
        await settleWithTimeout(gameSceneRef.value.showShotResult(actionData), 3000, 'showShotResult');
      } else {
        await sleep(1500);
      }
      
      // 9. Drop bullet animation (if real)
      if (isReal && gameSceneRef.value?.dropBullet) {
        gameSceneRef.value.dropBullet();
      } else if (gameSceneRef.value?.hideBullet) {
        gameSceneRef.value.hideBullet();
      }
      
      // 10. Apply game logic
      if (!isResolvedNetworkAction) {
        await gameStore.shoot(targetKey, actorKey, { allowReload });
        shotResolved = true;
        resetTurnTimerAfterAction();
        sendResolvedShoot(gameStore.serializeForNetwork());
      } else {
        await gameStore.shoot(targetKey, actorKey, { allowReload, skipDelay: true });
      }
      
      // 11. Brief pause
      await sleep(400);
      
      // 12. End zoom
      await settleWithTimeout(gameSceneRef.value?.endZoom?.(), 1200, 'endZoom');
    }
  } catch (error) {
    console.error('Error during shot:', error);
  } finally {
    // 11. ALWAYS unlock UI
    gameStore.isAnimating = false;
    endTimerBlock();
    isHandlingShot.value = false;
    if (shotResolved) {
      syncStateIfHost(fromNetwork);
    }
    if (isResolvedNetworkAction && actionMeta?.nextState) {
      gameStore.hydrateFromNetwork(actionMeta.nextState);
    }
  }
};

const handleUseItem = async (itemId, targetKey = null, fromNetwork = false, actorKeyOverride = null, actionMeta = null) => {
  if (gameStore.isAnimating) return;
  
  // In online mode, check if it's our turn (unless receiving from network)
  if (isOnlineMode.value && !fromNetwork && !isMyTurn.value) {
    console.log('Not your turn!');
    return;
  }
  if (isOnlineMode.value && !fromNetwork && !netStore.isHost) {
    netStore.sendAction({
      type: 'item',
      itemId,
      targetKey,
      actorKey: onlineActorKey.value,
      intent: true,
      actionId: createActionId()
    });
    return;
  }

  const shouldAnnounceLocalAction = () => {
    if (fromNetwork) return false;
    if (itemId === 'peek' || itemId === 'eject') return false;
    if (gameStore.mode === 'bot' && actorKeyOverride && actorKeyOverride !== localPlayerKey.value) {
      return false;
    }
    if (gameStore.mode === 'bot' && !actorKeyOverride && gameStore.currentTurn !== localPlayerKey.value) {
      return false;
    }
    return true;
  };

  const notifyLocalItemUse = (actorKey) => {
    if (!shouldAnnounceLocalAction()) return;
    const message = buildActionNotifyMessage({
      type: 'item',
      actor: actorKey,
      itemId,
      target: targetKey
    });
    if (!message) return;
    const signature = `local-item:${actorKey || ''}:${itemId}:${targetKey || ''}`;
    if (signature === actionNotifySignature.value) return;
    Notify.create({
      message,
      color: 'blue-6',
      textColor: 'white',
      icon: 'campaign',
      position: 'top',
      timeout: 2500
    });
    actionNotifySignature.value = signature;
  };

  const actionId = actionMeta?.actionId || createActionId();
  const isResolvedNetworkAction = !!(fromNetwork && actionMeta?.resolved);

  if (isResolvedNetworkAction && hasProcessedAction(actionId)) {
    if (actionMeta?.nextState) {
      gameStore.hydrateFromNetwork(actionMeta.nextState);
    }
    return;
  }
  if (isResolvedNetworkAction) {
    markActionProcessed(actionId);
    if (actionMeta?.barrelSnapshot) {
      gameStore.barrel = actionMeta.barrelSnapshot;
    }
  }
  
  const runItemAction = async () => {
    const actorKey = actionMeta?.actorKey || actorKeyOverride || gameStore.currentTurn;
    const barrelSnapshot = actionMeta?.barrelSnapshot
      ? cloneBarrel(actionMeta.barrelSnapshot)
      : cloneBarrel(gameStore.barrel);
    const shouldBroadcastResolved = isOnlineMode.value
      && netStore.isHost
      && !actionMeta?.resolved;
    
    const sendResolvedItem = (payload) => {
      if (!shouldBroadcastResolved) return;
      netStore.sendAction(payload);
    };

    // For peek, we need to show the result
    if (itemId === 'peek') {
      const nextBullet = actionMeta?.peekBullet ?? gameStore.barrel.chambers[gameStore.barrel.index];
      if (!isResolvedNetworkAction) {
        await gameStore.useItem(itemId, actorKey, targetKey);
        syncStateIfHost(fromNetwork);
      }
      sendResolvedItem({
        type: 'item',
        itemId,
        targetKey,
        actorKey,
        resolved: true,
        actionId,
        barrelSnapshot,
        peekBullet: nextBullet,
        nextState: gameStore.serializeForNetwork()
      });
      
      // Show peek result modal
      if (gameSceneRef.value && nextBullet) {
        await settleWithTimeout(
          gameSceneRef.value.showPeekResult(nextBullet === 'real'),
          3000,
          'showPeekResult'
        );
      }
      return;
    }
    // For eject, we need to spin, reveal, then eject
    if (itemId === 'eject') {
      gameStore.isAnimating = true;
      
      try {
        // Get what will be ejected BEFORE the item is used
        const ejectedBullet = actionMeta?.ejectedBullet ?? gameStore.barrel.chambers[gameStore.barrel.index];
        const isReal = ejectedBullet === 'real';
        
        // Spin barrel to show current slot
        if (gameSceneRef.value?.rotateBarrel) {
          audioManager.play('spin');
          gameSceneRef.value.rotateBarrel();
          await sleep(1000);
        }
        
        // Reveal what's in the chamber
        if (gameSceneRef.value?.revealBullet) {
          gameSceneRef.value.revealBullet(isReal);
        }
        
        // Pause to see
        await sleep(1500);
        
        // Show eject modal
        await settleWithTimeout(
          gameSceneRef.value?.showEjectResult?.(isReal),
          2800,
          'showEjectResult'
        );
        
        // Drop animation if real
        if (isReal && gameSceneRef.value?.dropBullet) {
          gameSceneRef.value.dropBullet();
        } else if (gameSceneRef.value?.hideBullet) {
          gameSceneRef.value.hideBullet();
        }
        
        // Now apply the item (increments barrel index)
        if (!isResolvedNetworkAction) {
          await gameStore.useItem(itemId, actorKey, targetKey);
          syncStateIfHost(fromNetwork);
        }
        sendResolvedItem({
          type: 'item',
          itemId,
          targetKey,
          actorKey,
          resolved: true,
          actionId,
          barrelSnapshot,
          ejectedBullet,
          nextState: gameStore.serializeForNetwork()
        });
        
        await sleep(300);
      } finally {
        gameStore.isAnimating = false;
      }
      return;
    }

    if (!isResolvedNetworkAction) {
      await gameStore.useItem(itemId, actorKey, targetKey);
      syncStateIfHost(fromNetwork);
    }
    if (!isResolvedNetworkAction) {
      notifyLocalItemUse(actorKey);
    }
    sendResolvedItem({
      type: 'item',
      itemId,
      targetKey,
      actorKey,
      resolved: true,
      actionId,
      barrelSnapshot,
      nextState: gameStore.serializeForNetwork()
    });
  };

  const shouldPauseForItem = itemId === 'peek' || itemId === 'eject';
  if (shouldPauseForItem) {
    await pauseTurnTimerFor(runItemAction);
  } else {
    await runItemAction();
  }

  resetTurnTimerAfterAction();
  if (isResolvedNetworkAction && actionMeta?.nextState) {
    gameStore.hydrateFromNetwork(actionMeta.nextState);
  }
};

const handleTimeout = async (fromNetwork = false, actorKeyOverride = null, actionMeta = null) => {
  if (gameStore.isAnimating) return;
  if (!canAct.value && !fromNetwork && !(isOnlineMode.value && netStore.isHost)) return;

  const actorKey = actionMeta?.actorKey || actorKeyOverride || gameStore.currentTurn;
  if (!actorKey) return;
  const actionId = actionMeta?.actionId || createActionId();
  const isResolvedNetworkAction = !!(fromNetwork && actionMeta?.resolved);

  if (isResolvedNetworkAction && hasProcessedAction(actionId)) {
    if (actionMeta?.nextState) {
      gameStore.hydrateFromNetwork(actionMeta.nextState);
    }
    return;
  }
  if (isResolvedNetworkAction) {
    markActionProcessed(actionId);
  }

  if (isOnlineMode.value && !fromNetwork && !netStore.isHost) {
    netStore.sendAction({ type: 'timeout', actorKey, intent: true, actionId });
    return;
  }

  const sendResolvedTimeout = (nextState) => {
    if (!isOnlineMode.value || !netStore.isHost || actionMeta?.resolved) return;
    netStore.sendAction({ type: 'timeout', actorKey, resolved: true, actionId, nextState });
  };

  if (!isResolvedNetworkAction) {
    gameStore.timeoutTurn(actorKey);
    syncStateIfHost(fromNetwork);
    sendResolvedTimeout(gameStore.serializeForNetwork());
    if (!fromNetwork) {
      const signature = `local-timeout:${actorKey}`;
      if (signature !== actionNotifySignature.value) {
        const message = buildActionNotifyMessage({ type: 'timeout', actor: actorKey });
        if (message) {
          Notify.create({
            message,
            color: 'blue-6',
            textColor: 'white',
            icon: 'campaign',
            position: 'top',
            timeout: 2500
          });
          actionNotifySignature.value = signature;
        }
      }
    }
  }
  if (isResolvedNetworkAction && actionMeta?.nextState) {
    gameStore.hydrateFromNetwork(actionMeta.nextState);
  }
};

const showEmoji = (playerKey, emoji) => {
  if (!playerKey) return;
  playerEmojis.value = { ...playerEmojis.value, [playerKey]: emoji };
  clearTimeout(emojiTimeouts[playerKey]);
  emojiTimeouts[playerKey] = setTimeout(() => {
    const next = { ...playerEmojis.value };
    delete next[playerKey];
    playerEmojis.value = next;
  }, EMOJI_DISPLAY_MS);
};

const handleSendEmoji = (emoji) => {
  if (!emoji || !canSendEmoji.value) return;
  const now = Date.now();
  const key = localPlayerKey.value;
  emojiLastSentAt.value = { ...emojiLastSentAt.value, [key]: now };
  showEmoji(key, emoji);

  if (isOnlineMode.value) {
    netStore.sendAction({ type: 'emoji', emoji, actorKey: key });
  }
};

const handleReceiveEmoji = (emoji, actorKey) => {
  if (!emoji || !actorKey) return;
  const now = Date.now();
  const lastSent = emojiLastSentAt.value[actorKey] || 0;
  if (now - lastSent < EMOJI_COOLDOWN_MS) return;
  emojiLastSentAt.value = { ...emojiLastSentAt.value, [actorKey]: now };
  showEmoji(actorKey, emoji);
};

const onCoinFlip = async (starts) => {
  // Add delay after coin flip before starting
  await sleep(500);
  gameStore.setCoinFlipResult(starts);
  
  // In online mode, host syncs the coin flip result
  if (isOnlineMode.value && netStore.isHost) {
    netStore.syncState(gameStore.serializeForNetwork());
  }
};

const onOnlineFlipResolved = async () => {
  showOnlineFlip.value = false;
  onlineFlipResult.value = null;
};

const startOrderReveal = () => {
  if (orderModalShown.value) return;
  const entries = orderModalEntries.value;
  if (entries.length < 3) return;
  orderModalShown.value = true;
  showOrderModal.value = true;
  orderRevealIndex.value = -1;
  orderRevealDone.value = false;

  const revealDelay = 650;
  entries.forEach((_, index) => {
    const timerId = setTimeout(() => {
      orderRevealIndex.value = index;
      if (index === entries.length - 1) {
        orderRevealDone.value = true;
        const closeTimer = setTimeout(() => {
          showOrderModal.value = false;
        }, 1400);
        orderRevealTimers.push(closeTimer);
      }
    }, revealDelay * (index + 1));
    orderRevealTimers.push(timerId);
  });
};

const applyLocalForfeit = async () => {
  if (forfeitApplied.value) return;
  if (!gameStore.sessionActive || gameStore.phase === 'game_over') return;
  forfeitApplied.value = true;

  const localKey = localPlayerKey.value || 'player';
  const localName = gameStore.players[localKey]?.name || 'Joueur';
  if (gameStore.players[localKey]) {
    gameStore.players[localKey].hp = 0;
    gameStore.players[localKey].isActive = false;
  }

  const remaining = gameStore.getActivePlayerKeys().filter((key) => key !== localKey);
  const fallbackOpponent = gameStore.turnOrder.find((key) => key !== localKey) || remaining[0] || null;

  gameStore.winner = remaining[0] || fallbackOpponent || null;
  gameStore.phase = 'game_over';
  gameStore.lastAction = { type: 'surrender', actor: localKey };
  gameStore.lastResult = { text: `🏳️ ${localName} a abandonné.` };

  syncStateIfHost(false);
  await submitMatchResult();

  if (isOnlineMode.value && netStore.isInRoom) {
    netStore.gameEnded = true;
  }
};

const restart = () => {
  if (isOnlineMode.value && netStore.isInRoom) {
    netStore.gameEnded = true;
  }
  if (gameOverRedirectTimer) {
    clearTimeout(gameOverRedirectTimer);
    gameOverRedirectTimer = null;
  }
  gameStore.sessionActive = false;
  router.push('/menu');
};

// Setup multiplayer listeners
onMounted(() => {
  matchSubmitted.value = false;
  if (!gameStore.players.player.items) {
    gameStore.initGame('bot');
  }

  audioManager.startBackground();

  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return;
    if (gameStore.mode !== 'bot') return;
    if (gameStore.currentTurn !== 'enemy') return;
    if (gameStore.pendingBotAction || gameStore.pendingBotItem) return;
    if (gameStore.isAnimating) return;
    gameStore.queueBotAction();
  };
  document.addEventListener('visibilitychange', visibilityHandler);
  window.addEventListener('focus', visibilityHandler);
  
  // Online mode: listen for game state updates and actions
  if (isOnlineMode.value) {
    // Listen for state sync (for guests)
    netStore.onGameState((state) => {
      if (!netStore.isHost && state) {
        if (gameStore.isAnimating || isHandlingShot.value) {
          pendingNetworkState.value = state;
          return;
        }
        applyNetworkState(state);
      }
    });
    
    // Listen for actions from opponent
    netStore.onGameAction(async ({ action }) => {
      if (netStore.isHost && action.resolved) return;
      if (!netStore.isHost && action.intent && action.actionId) {
        markActionProcessed(action.actionId);
      }
      
      console.log('📨 Received action from opponent:', action);
      
      // Execute the action (mark as fromNetwork to avoid re-sending)
      if (action.type === 'shoot') {
        await handleShoot(action.targetKey || action.target, true, action.actorKey || null, action);
      } else if (action.type === 'item') {
        await handleUseItem(action.itemId, action.targetKey || null, true, action.actorKey || null, action);
      } else if (action.type === 'timeout') {
        await handleTimeout(true, action.actorKey || null, action);
      } else if (action.type === 'coinFlip') {
        gameStore.setCoinFlipResult(action.starts);
      } else if (action.type === 'timer') {
        if (action.state) {
          setTurnTimerState(
            action.state.remaining ?? null,
            action.state.paused,
            undefined,
            action.state.phase,
            false
          );
        }
      } else if (action.type === 'emoji') {
        handleReceiveEmoji(action.emoji, action.actorKey);
      }

      if (shouldNotifyAction(action)) {
        const signature = `${action.type}:${action.actor || ''}:${action.itemId || ''}:${action.target || ''}`;
        if (signature !== actionNotifySignature.value) {
          const message = buildActionNotifyMessage(action);
          if (message) {
            Notify.create({
              message,
              color: 'blue-6',
              textColor: 'white',
              icon: 'campaign',
              position: 'top',
              timeout: 2500
            });
            actionNotifySignature.value = signature;
          }
        }
      }
      
      // Host syncs state after processing
      if (netStore.isHost) {
        netStore.syncState(gameStore.serializeForNetwork());
      }
    });

    // Host: show flip once when entering game (forced result)
    if (
      netStore.isHost &&
      !onlineFlipShown.value &&
      gameStore.currentTurn &&
      isInitialOnlineFlip() &&
      gameStore.turnOrder.length <= 2
    ) {
      onlineFlipResult.value = mapOnlineFlipResult(gameStore.currentTurn);
      showOnlineFlip.value = true;
      onlineFlipShown.value = true;
    }

    // Guest: show flip once on initial load (state already hydrated in menu)
    if (
      !netStore.isHost &&
      !onlineFlipShown.value &&
      gameStore.currentTurn &&
      isInitialOnlineFlip() &&
      gameStore.turnOrder.length <= 2
    ) {
      onlineFlipResult.value = mapOnlineFlipResult(gameStore.currentTurn);
      showOnlineFlip.value = true;
      onlineFlipShown.value = true;
    }
  }

  emojiTick = setInterval(() => {
    emojiNow.value = Date.now();
  }, 1000);
});

onBeforeRouteLeave(async () => {
  if (!gameStore.sessionActive || gameStore.phase === 'game_over') return true;
  await applyLocalForfeit();
  return true;
});

onUnmounted(() => {
  audioManager.stopBackground();
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    window.removeEventListener('focus', visibilityHandler);
  }
  if (isOnlineMode.value) {
    netStore.offGameState();
    netStore.offGameAction();
  }
  clearTurnTimer();
  if (gameOverRedirectTimer) {
    clearTimeout(gameOverRedirectTimer);
    gameOverRedirectTimer = null;
  }
  orderRevealTimers.splice(0).forEach((timerId) => clearTimeout(timerId));
  if (emojiTick) clearInterval(emojiTick);
  Object.values(emojiTimeouts).forEach((timeoutId) => clearTimeout(timeoutId));
});

watch(
  () => netStore.opponentLeft,
  (opponentLeft) => {
    if (!opponentLeft || !isOnlineMode.value) return;
    if (gameStore.phase === 'game_over') {
      netStore.clearOpponentLeft();
      return;
    }
    
    // Find the player who left - by playerId or by wasHost flag
    let leftPlayerEntry = null;
    if (opponentLeft.playerId) {
      leftPlayerEntry = Object.entries(gameStore.players).find(([, player]) => (
        player?.socketId === opponentLeft.playerId
      ));
    }
    
    // If wasHost and no playerId, find the first active opponent (likely the host)
    if (!leftPlayerEntry && opponentLeft.wasHost) {
      leftPlayerEntry = Object.entries(gameStore.players).find(([key, player]) => (
        key !== localPlayerKey.value && player?.isActive && player?.hp > 0
      ));
    }
    
    const leftKey = leftPlayerEntry?.[0];
    const leftName = leftPlayerEntry?.[1]?.name || opponentLeft.playerName || 'Un joueur';

    // Mark ONLY the player who left as inactive
    if (leftKey && gameStore.players[leftKey]) {
      gameStore.players[leftKey].hp = 0;
      gameStore.players[leftKey].isActive = false;
    }

    // Get remaining active players (excluding those who left)
    const activePlayers = gameStore.getActivePlayerKeys();
    
    // Count how many opponents are still active (not the local player)
    const activeOpponents = activePlayers.filter(key => key !== localPlayerKey.value);
    
    // Game ends ONLY if there's 1 or fewer players left (regardless of who was host)
    if (activePlayers.length <= 1) {
      // Victory by abandonment
      gameStore.winner = activePlayers[0] || localPlayerKey.value;
      gameStore.phase = 'game_over';
      gameStore.lastResult = {
        text: `🏳️ ${leftName} a quitté la partie. Victoire par abandon !`
      };
    } else {
      // Multiple players still active, game continues
      gameStore.lastResult = {
        text: `🏳️ ${leftName} a quitté la partie.`
      };
      // If it was the leaving player's turn, advance to next player
      if (leftKey && gameStore.currentTurn === leftKey) {
        const nextKey = gameStore.getNextTurnKey(activePlayers, leftKey);
        gameStore.resolveNextTurn(nextKey);
      }
    }
    netStore.clearOpponentLeft();
  }
);

watch(
  () => gameStore.phase,
  (phase) => {
    if (phase !== 'game_over') return;
    submitMatchResult();
    if (isOnlineMode.value && netStore.isHost) {
      netStore.endGame();
    }
    if (isOnlineMode.value && netStore.isInRoom && !redirectedToLobby.value) {
      if (gameOverRedirectTimer) {
        clearTimeout(gameOverRedirectTimer);
      }
      gameOverRedirectTimer = setTimeout(() => {
        redirectedToLobby.value = true;
        gameStore.sessionActive = false;
        router.push('/menu');
      }, GAME_OVER_REDIRECT_DELAY_MS);
    }
  }
);

const clearTurnTimer = (resetCountdown = true) => {
  if (turnTimer) {
    clearTimeout(turnTimer);
    turnTimer = null;
  }
  if (turnTick) {
    clearInterval(turnTick);
    turnTick = null;
  }
  if (resetCountdown) {
    turnCountdown.value = null;
  }
};

const updateTimerStore = (remaining, paused, autoTimeout, phase) => {
  isApplyingTimerState.value = true;
  gameStore.turnTimer = {
    remaining,
    paused,
    autoTimeout,
    phase
  };
  queueMicrotask(() => {
    isApplyingTimerState.value = false;
  });
};

const broadcastTimerState = (state) => {
  if (!isOnlineMode.value || !netStore.isHost) return;
  netStore.sendAction({ type: 'timer', state });
};

const setTurnTimerState = (remaining, paused, autoTimeout, phase, broadcast = true) => {
  clearTurnTimer(false);
  if (phase !== undefined) {
    currentTimerPhase.value = phase;
  }

  const resolvedAutoTimeout = autoTimeout ?? shouldAutoTimeout.value;

  if (remaining === null || remaining === undefined) {
    turnCountdown.value = null;
    isTurnTimerPaused.value = false;
    updateTimerStore(null, false, resolvedAutoTimeout, currentTimerPhase.value);
    if (broadcast) {
      broadcastTimerState({
        remaining: null,
        paused: false,
        autoTimeout: resolvedAutoTimeout,
        phase: currentTimerPhase.value
      });
    }
    return;
  }

  turnCountdown.value = Math.max(0, remaining);
  isTurnTimerPaused.value = !!paused;

  if (!isTurnTimerPaused.value) {
    turnTick = setInterval(() => {
      if (turnCountdown.value === null) return;
      turnCountdown.value = Math.max(0, turnCountdown.value - 1);
    }, 1000);
    if (resolvedAutoTimeout) {
      turnTimer = setTimeout(async () => {
        await handleTimeout();
      }, turnCountdown.value * 1000);
    }
  }

  updateTimerStore(turnCountdown.value, isTurnTimerPaused.value, resolvedAutoTimeout, currentTimerPhase.value);
  if (broadcast) {
    broadcastTimerState({
      remaining: turnCountdown.value,
      paused: isTurnTimerPaused.value,
      autoTimeout: resolvedAutoTimeout,
      phase: currentTimerPhase.value
    });
  }
};

const startTurnTimer = () => {
  const shouldPause = timerBlockCount.value > 0;
  setTurnTimerState(turnTimeLimit.value, shouldPause, shouldAutoTimeout.value, gameStore.phase);
};

const pauseTurnTimer = () => {
  if (turnCountdown.value === null) return;
  setTurnTimerState(turnCountdown.value, true, shouldAutoTimeout.value, currentTimerPhase.value);
};

const resumeTurnTimer = () => {
  if (turnCountdown.value === null) return;
  if (!isTurnTimerPaused.value) return;
  setTurnTimerState(turnCountdown.value, false, shouldAutoTimeout.value, currentTimerPhase.value);
};

const beginTimerBlock = () => {
  timerBlockCount.value += 1;
  if (turnCountdown.value !== null) {
    pauseTurnTimer();
  }
};

const endTimerBlock = () => {
  timerBlockCount.value = Math.max(0, timerBlockCount.value - 1);
  if (timerBlockCount.value === 0 && turnCountdown.value !== null && isTurnTimerPaused.value) {
    resumeTurnTimer();
  }
};

const pauseTurnTimerFor = async (action) => {
  const shouldPause = turnCountdown.value !== null;
  beginTimerBlock();
  try {
    await action();
  } finally {
    endTimerBlock();
    if (!shouldPause && timerBlockCount.value === 0) {
      resumeTurnTimer();
    }
  }
};

watch(
  () => showOnlineFlip.value || gameStore.phase === 'coin_flip',
  (isBlocked) => {
    if (isBlocked) {
      beginTimerBlock();
      return;
    }
    endTimerBlock();
  },
  { immediate: true }
);

watch(
  () => showOrderModal.value,
  (isBlocked) => {
    if (isBlocked) {
      beginTimerBlock();
      return;
    }
    endTimerBlock();
  }
);

watch(
  () => [isOnlineMode.value, gameStore.turnOrder.length, gameStore.currentTurn],
  ([onlineMode, turnOrderLength, currentTurn]) => {
    if (!onlineMode || !currentTurn || turnOrderLength < 3) return;
    startOrderReveal();
  },
  { immediate: true }
);

watch(
  () => [gameStore.phase, showOnlineFlip.value, isOnlineInitialFlipPending.value],
  ([phase, onlineFlip, onlineFlipPending]) => {
    if (!initialFlipResolved.value && phase !== 'coin_flip' && !onlineFlip && !onlineFlipPending) {
      initialFlipResolved.value = true;
    }
  },
  { immediate: true }
);

watch(
  () => gameStore.turnTimer,
  (timer) => {
    if (isApplyingTimerState.value) return;
    if (!isOnlineMode.value || netStore.isHost || !timer) return;
    setTurnTimerState(
      timer.remaining ?? null,
      timer.paused,
      undefined,
      timer.phase,
      false
    );
  },
  { deep: true, immediate: true }
);

watch(
  () => [gameStore.phase, shouldAutoTimeout.value],
  ([phase, autoTimeout]) => {
    const isTurnPhase = phase === 'player_turn' || phase === 'enemy_turn' || phase === 'enemy_two_turn';
    if (!isTurnPhase) {
      if (phase === 'animating' && turnCountdown.value !== null) {
        setTurnTimerState(turnCountdown.value, true, autoTimeout, currentTimerPhase.value);
        return;
      }
      setTurnTimerState(null, false, autoTimeout, null);
      return;
    }

    if (isOnlineMode.value && !netStore.isHost) {
      return;
    }

    if (currentTimerPhase.value !== phase) {
      currentTimerPhase.value = phase;
      startTurnTimer();
      return;
    }

    if (turnCountdown.value === null) {
      startTurnTimer();
      return;
    }

    const shouldHaveTimeout = autoTimeout && !turnTimer;
    const shouldRemoveTimeout = !autoTimeout && turnTimer;
    if (shouldHaveTimeout || shouldRemoveTimeout) {
      setTurnTimerState(turnCountdown.value, isTurnTimerPaused.value, autoTimeout, currentTimerPhase.value);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100dvh;
  min-height: 100vh;
  background: #0a0a0f;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
}

.game-wrapper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.loading {
  color: #a1a1aa;
  text-align: center;
  margin-top: 20%;
  font-size: 18px;
  font-weight: 500;
}

.game-over-card {
  min-width: 340px;
  max-width: 90vw;
  border-radius: 28px;
  padding: 36px 32px;
  backdrop-filter: blur(20px);
  animation: game-over-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes game-over-pop {
  0% { transform: scale(0.8) rotate(-3deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.card-victory {
  background: linear-gradient(145deg, rgba(34, 197, 94, 0.15), rgba(5, 46, 22, 0.95));
  border: 3px solid rgba(34, 197, 94, 0.5);
  box-shadow: 
    0 0 60px rgba(34, 197, 94, 0.3),
    0 0 120px rgba(34, 197, 94, 0.15),
    inset 0 0 40px rgba(34, 197, 94, 0.05);
}

.card-defeat {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(28, 5, 5, 0.95));
  border: 3px solid rgba(239, 68, 68, 0.5);
  box-shadow: 
    0 0 60px rgba(239, 68, 68, 0.3),
    0 0 120px rgba(239, 68, 68, 0.15),
    inset 0 0 40px rgba(239, 68, 68, 0.05);
}

.game-over-icon {
  font-size: 80px;
  margin-bottom: 16px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  animation: icon-bounce 0.6s ease-out 0.2s both;
}

@keyframes icon-bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.game-over-title {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0 0 12px 0;
  text-transform: uppercase;
}

.card-victory .game-over-title {
  color: #86efac;
  text-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
}

.card-defeat .game-over-title {
  color: #fca5a5;
  text-shadow: 0 0 40px rgba(239, 68, 68, 0.6);
}

.game-over-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-weight: 500;
}

.order-modal-card {
  min-width: min(380px, 92vw);
  border-radius: 26px;
  padding: 26px 30px 30px;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border: 2px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 0 60px rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(16px);
}

.order-modal-icon {
  font-size: 42px;
  margin-bottom: 8px;
}

.order-modal-title {
  font-size: 20px;
  font-weight: 800;
  color: #e2e8f0;
}

.order-modal-subtitle {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.6);
}

.order-modal-list {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.order-modal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid transparent;
  color: rgba(226, 232, 240, 0.4);
  opacity: 0.3;
  transform: translateY(6px);
  transition: all 0.35s ease;
}

.order-modal-item.revealed {
  opacity: 1;
  transform: translateY(0);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.3);
}

.order-modal-item.active {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(74, 222, 128, 0.5);
  color: #bbf7d0;
}

.order-modal-item.self {
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
}

.order-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: #0f172a;
  background: rgba(226, 232, 240, 0.9);
}

.order-name {
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 420px) {
  .game-over-card {
    min-width: 280px;
    padding: 28px 24px;
  }

  .game-over-icon {
    font-size: 64px;
  }

  .game-over-title {
    font-size: 36px;
  }

  .game-over-subtitle {
    font-size: 14px;
  }

  .order-modal-card {
    padding: 22px 22px 26px;
  }
}
</style>
