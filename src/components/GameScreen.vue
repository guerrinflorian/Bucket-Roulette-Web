<template>
  <q-page class="game-wrapper">
    <GameScene
      ref="gameSceneRef"
      v-if="gameStore.players.player"
      :player="uiPlayer"
      :enemy="uiEnemy"
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
      :player-emoji="playerEmoji"
      :enemy-emoji="enemyEmoji"
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
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import { audioManager } from '../engine/audio.js';
import { remainingCounts } from '../engine/barrel.js';
import GameScene from './GameScene.vue';
import CoinFlipModal from './CoinFlipModal.vue';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();
const gameSceneRef = ref(null);

const showGameOver = computed(() => gameStore.phase === 'game_over');
const isOnlineMode = computed(() => gameStore.mode === 'online');
const showOnlineFlip = ref(false);
const isFlipVisible = computed(() => gameStore.phase === 'coin_flip' || showOnlineFlip.value);
const onlineFlipResult = ref(null);
const onlineFlipShown = ref(false);
const initialFlipResolved = ref(false);
const isHandlingShot = ref(false);
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
let turnTimer = null;
let turnTick = null;
let emojiTick = null;
const emojiNow = ref(Date.now());
const playerEmoji = ref('');
const enemyEmoji = ref('');
const emojiLastSentAt = ref({
  player: 0,
  enemy: 0
});
const emojiTimeouts = {
  player: null,
  enemy: null
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const isMyTurn = computed(() => {
  if (!isOnlineMode.value) return true;
  // In online mode: host is player, guest is enemy
  const myRole = netStore.isHost ? 'player' : 'enemy';
  return (gameStore.phase === 'player_turn' && myRole === 'player') ||
         (gameStore.phase === 'enemy_turn' && myRole === 'enemy');
});

const uiPhase = computed(() => {
  if (!isOnlineMode.value) return gameStore.phase;
  if (gameStore.phase === 'player_turn') {
    return netStore.isHost ? 'player_turn' : 'enemy_turn';
  }
  if (gameStore.phase === 'enemy_turn') {
    return netStore.isHost ? 'enemy_turn' : 'player_turn';
  }
  return gameStore.phase;
});

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
  if (uiPlayer.value?.id === key) return uiPlayer.value?.name;
  return uiEnemy.value?.name;
};

const canAct = computed(() => {
  if (gameStore.isAnimating) return false;
  if (gameStore.phase !== 'player_turn' && gameStore.phase !== 'enemy_turn') return false;
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
  return emojiNow.value - emojiLastSentAt.value.player < EMOJI_COOLDOWN_MS;
});

const isEmojiDisabledByTimer = computed(() => {
  return turnCountdown.value !== null && turnCountdown.value <= 3;
});

const canSendEmoji = computed(() => {
  return !gameStore.isAnimating && !isEmojiDisabledByTimer.value && !isEmojiCooldownActive.value;
});

const emojiCooldownLeft = computed(() => {
  const remaining = EMOJI_COOLDOWN_MS - (emojiNow.value - emojiLastSentAt.value.player);
  return Math.max(0, Math.ceil(remaining / 1000));
});

// UI mapping: local player is always shown at the bottom
const uiPlayer = computed(() => {
  if (!isOnlineMode.value) return gameStore.players.player;
  return netStore.isHost ? gameStore.players.player : gameStore.players.enemy;
});

const uiEnemy = computed(() => {
  if (!isOnlineMode.value) return gameStore.players.enemy;
  return netStore.isHost ? gameStore.players.enemy : gameStore.players.player;
});

const isLocalWinner = computed(() => {
  if (!gameStore.winner) return false;
  if (!isOnlineMode.value) return gameStore.winner === 'player';
  return gameStore.winner === (netStore.isHost ? 'player' : 'enemy');
});

const gameOverSubtitle = computed(() => {
  const lastText = gameStore.lastResult?.text || '';
  if (/abandon|afk/i.test(lastText)) {
    return lastText;
  }
  return isLocalWinner.value ? 'Vous avez survécu !' : 'Vous êtes mort...';
});

const shouldAutoTimeout = computed(() => {
  if (!isOnlineMode.value) return true;
  return isMyTurn.value;
});

const onlineActorKey = computed(() => (netStore.isHost ? 'player' : 'enemy'));

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
      await gameSceneRef.value.showEnemyUsingItem(itemId);
    } else {
      // Fallback: just wait
      await sleep(2000);
    }
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
  if (gameStore.phase !== 'player_turn' && gameStore.phase !== 'enemy_turn') return;
  if (isOnlineMode.value && !netStore.isHost) return;
  startTurnTimer();
};

const syncStateIfHost = (fromNetwork = false) => {
  if (isOnlineMode.value && netStore.isHost && !fromNetwork) {
    netStore.syncState(gameStore.serializeForNetwork());
  }
};

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
const handleShoot = async (target, fromNetwork = false, actorKeyOverride = null) => {
  // In online mode, check if it's our turn (unless receiving from network)
  if (isOnlineMode.value && !fromNetwork && !isMyTurn.value) {
    console.log('Not your turn!');
    return;
  }
  if (isHandlingShot.value) {
    return;
  }
  isHandlingShot.value = true;

  beginTimerBlock();
  
  // Send action to network (if not already from network)
  if (isOnlineMode.value && !fromNetwork) {
    netStore.sendAction({ type: 'shoot', target, actorKey: onlineActorKey.value });
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
    const actorKey = actorKeyOverride || (gameStore.phase === 'player_turn' ? 'player' : 'enemy');
    const actor = gameStore.players[actorKey];
    const opponentKey = actorKey === 'player' ? 'enemy' : 'player';
    let targetKey = target === 'self' ? actorKey : opponentKey;
    
    const shot = gameStore.barrel.chambers[gameStore.barrel.index];
    const isReal = shot === 'real';
    let damage = isReal ? 1 : 0;
    if (isReal && actor.doubleDamageNextShot) {
      damage = 2;
    }
    
    const actionData = {
      type: 'shot',
      actor: actorKey,
      target: targetKey,
      shot: shot,
      damage: damage,
      actorName: uiNameForStoreKey(actorKey),
      targetName: uiNameForStoreKey(targetKey),
      actorIsSelf: actorKey === targetKey
    };
    
    // Check if only blanks remain (fast mode)
    const counts = remainingCounts(gameStore.barrel);
    const onlyBlanksRemain = counts.real === 0;
    
    if (onlyBlanksRemain) {
      // FAST MODE: No zoom, quick spin, minimal delay
      
      // Quick action text
      if (gameSceneRef.value?.showActionChoice) {
        await gameSceneRef.value.showActionChoice(actionData);
      }
      
      // Fast spin (no zoom)
      if (gameSceneRef.value?.rotateBarrel) {
        audioManager.play('spin');
        gameSceneRef.value.rotateBarrel();
        await sleep(600); // Faster spin
      }

      // Reveal the current bullet before showing the result (even on blanks)
      if (gameSceneRef.value?.revealBullet) {
        gameSceneRef.value.revealBullet(isReal);
        setTimeout(() => audioManager.play(isReal ? 'shot' : 'blank'), 700);
      }
      
      // Quick result (just after reveal)
      if (gameSceneRef.value?.showShotResult) {
        await gameSceneRef.value.showShotResult(actionData);
      }
      
      // Apply game logic
      await gameStore.shoot(target, actorKey);
      shotResolved = true;
      resetTurnTimerAfterAction();
      await sleep(200);
      
    } else {
      // NORMAL MODE: Full dramatic animation
      
      // 3. Show action choice modal
      if (gameSceneRef.value?.showActionChoice) {
        await gameSceneRef.value.showActionChoice(actionData);
      }
      
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
        setTimeout(() => audioManager.play(isReal ? 'shot' : 'blank'), 700);
      }
      
      // 7. Show result modal (just after reveal)
      if (gameSceneRef.value?.showShotResult) {
        await gameSceneRef.value.showShotResult(actionData);
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
      await gameStore.shoot(target, actorKey);
      shotResolved = true;
      resetTurnTimerAfterAction();
      
      // 11. Brief pause
      await sleep(400);
      
      // 12. End zoom
      if (gameSceneRef.value?.endZoom) {
        await gameSceneRef.value.endZoom();
      }
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
  }
};

const handleUseItem = async (itemId, fromNetwork = false, actorKeyOverride = null) => {
  if (gameStore.isAnimating) return;
  
  // In online mode, check if it's our turn (unless receiving from network)
  if (isOnlineMode.value && !fromNetwork && !isMyTurn.value) {
    console.log('Not your turn!');
    return;
  }
  
  const runItemAction = async () => {
    // Send action to network (if not already from network)
    if (isOnlineMode.value && !fromNetwork) {
      netStore.sendAction({ type: 'item', itemId, actorKey: onlineActorKey.value });
    }

    const actorKey = actorKeyOverride || (gameStore.phase === 'player_turn' ? 'player' : 'enemy');
    
    // For peek, we need to show the result
    if (itemId === 'peek') {
      const nextBullet = gameStore.barrel.chambers[gameStore.barrel.index];
      await gameStore.useItem(itemId, actorKey);
      syncStateIfHost(fromNetwork);
      
      // Show peek result modal
      if (gameSceneRef.value && nextBullet) {
        await gameSceneRef.value.showPeekResult(nextBullet === 'real');
      }
      return;
    }
    // For eject, we need to spin, reveal, then eject
    if (itemId === 'eject') {
      gameStore.isAnimating = true;
      
      try {
        // Get what will be ejected BEFORE the item is used
        const ejectedBullet = gameStore.barrel.chambers[gameStore.barrel.index];
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
        if (gameSceneRef.value?.showEjectResult) {
          await gameSceneRef.value.showEjectResult(isReal);
        }
        
        // Drop animation if real
        if (isReal && gameSceneRef.value?.dropBullet) {
          gameSceneRef.value.dropBullet();
        } else if (gameSceneRef.value?.hideBullet) {
          gameSceneRef.value.hideBullet();
        }
        
        // Now apply the item (increments barrel index)
        await gameStore.useItem(itemId, actorKey);
        syncStateIfHost(fromNetwork);
        
        await sleep(300);
      } finally {
        gameStore.isAnimating = false;
      }
      return;
    }

    await gameStore.useItem(itemId, actorKey);
    syncStateIfHost(fromNetwork);
  };

  const shouldPauseForItem = itemId === 'peek' || itemId === 'eject';
  if (shouldPauseForItem) {
    await pauseTurnTimerFor(runItemAction);
  } else {
    await runItemAction();
  }

  resetTurnTimerAfterAction();
};

const handleTimeout = async (fromNetwork = false, actorKeyOverride = null) => {
  if (gameStore.isAnimating) return;
  if (!canAct.value && !fromNetwork) return;

  if (isOnlineMode.value && !fromNetwork) {
    netStore.sendAction({ type: 'timeout', actorKey: onlineActorKey.value });
  }

  gameStore.timeoutTurn(actorKeyOverride);
  syncStateIfHost(fromNetwork);
};

const showEmoji = (target, emoji) => {
  if (target === 'player') {
    playerEmoji.value = emoji;
    clearTimeout(emojiTimeouts.player);
    emojiTimeouts.player = setTimeout(() => {
      playerEmoji.value = '';
    }, EMOJI_DISPLAY_MS);
    return;
  }

  enemyEmoji.value = emoji;
  clearTimeout(emojiTimeouts.enemy);
  emojiTimeouts.enemy = setTimeout(() => {
    enemyEmoji.value = '';
  }, EMOJI_DISPLAY_MS);
};

const handleSendEmoji = (emoji) => {
  if (!emoji || !canSendEmoji.value) return;
  const now = Date.now();
  emojiLastSentAt.value = { ...emojiLastSentAt.value, player: now };
  showEmoji('player', emoji);

  if (isOnlineMode.value) {
    netStore.sendAction({ type: 'emoji', emoji });
  }
};

const handleReceiveEmoji = (emoji) => {
  if (!emoji) return;
  const now = Date.now();
  if (now - emojiLastSentAt.value.enemy < EMOJI_COOLDOWN_MS) return;
  emojiLastSentAt.value = { ...emojiLastSentAt.value, enemy: now };
  showEmoji('enemy', emoji);
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

const restart = () => {
  if (isOnlineMode.value) {
    netStore.leaveRoom();
  }
  gameStore.sessionActive = false;
  router.push('/menu');
};

// Setup multiplayer listeners
onMounted(() => {
  if (!gameStore.players.player.items) {
    gameStore.initGame('bot');
  }
  
  // Online mode: listen for game state updates and actions
  if (isOnlineMode.value) {
    // Listen for state sync (for guests)
    netStore.onGameState((state) => {
      if (!netStore.isHost && state) {
        gameStore.hydrateFromNetwork(state);
        // Show forced coin flip once when initial state arrives
        if (!onlineFlipShown.value && state.onlineFlipResult && isInitialOnlineFlip(state)) {
          onlineFlipResult.value = mapOnlineFlipResult(state.onlineFlipResult);
          showOnlineFlip.value = true;
          onlineFlipShown.value = true;
        }
      }
    });
    
    // Listen for actions from opponent
    netStore.onGameAction(async ({ action, playerId, isHost }) => {
      // Ignore our own actions
      const isOurAction = (netStore.isHost && isHost) || (!netStore.isHost && !isHost);
      if (isOurAction) return;
      
      console.log('📨 Received action from opponent:', action);
      
      // Execute the action (mark as fromNetwork to avoid re-sending)
      if (action.type === 'shoot') {
        await handleShoot(action.target, true, action.actorKey || null);
      } else if (action.type === 'item') {
        await handleUseItem(action.itemId, true, action.actorKey || null);
      } else if (action.type === 'timeout') {
        await handleTimeout(true, action.actorKey || null);
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
        handleReceiveEmoji(action.emoji);
      }
      
      // Host syncs state after processing
      if (netStore.isHost) {
        netStore.syncState(gameStore.serializeForNetwork());
      }
    });

    // Host: show flip once when entering game (forced result)
    if (netStore.isHost && !onlineFlipShown.value && gameStore.currentTurn && isInitialOnlineFlip()) {
      onlineFlipResult.value = mapOnlineFlipResult(gameStore.currentTurn);
      showOnlineFlip.value = true;
      onlineFlipShown.value = true;
    }

    // Guest: show flip once on initial load (state already hydrated in menu)
    if (!netStore.isHost && !onlineFlipShown.value && gameStore.currentTurn && isInitialOnlineFlip()) {
      onlineFlipResult.value = mapOnlineFlipResult(gameStore.currentTurn);
      showOnlineFlip.value = true;
      onlineFlipShown.value = true;
    }
  }

  emojiTick = setInterval(() => {
    emojiNow.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (isOnlineMode.value) {
    netStore.offGameState();
    netStore.offGameAction();
  }
  clearTurnTimer();
  if (emojiTick) clearInterval(emojiTick);
  clearTimeout(emojiTimeouts.player);
  clearTimeout(emojiTimeouts.enemy);
});

watch(
  () => netStore.opponentLeft,
  (opponentLeft) => {
    if (!opponentLeft || !isOnlineMode.value) return;
    if (gameStore.phase === 'game_over') {
      netStore.clearOpponentLeft();
      return;
    }
    const winnerKey = opponentLeft.wasHost ? 'enemy' : 'player';
    const opponentName = netStore.opponentName || 'Adversaire';
    gameStore.winner = winnerKey;
    gameStore.phase = 'game_over';
    gameStore.lastResult = {
      text: `🏳️ ${opponentName} a quitté la partie. Victoire par abandon de l'adversaire.`
    };
    netStore.clearOpponentLeft();
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
  setTurnTimerState(TURN_TIME_LIMIT, shouldPause, shouldAutoTimeout.value, gameStore.phase);
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
    const isTurnPhase = phase === 'player_turn' || phase === 'enemy_turn';
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
}
</style>
