<template>
  <q-page class="game-wrapper">
    <GameScene
      ref="gameSceneRef"
      v-if="gameStore.players.player"
      :player="gameStore.players.player"
      :enemy="gameStore.players.enemy"
      :barrel="gameStore.barrel"
      :phase="gameStore.phase"
      :last-result="gameStore.lastResult"
      :last-action="gameStore.lastAction"
      :is-animating="gameStore.isAnimating"
      @shoot="handleShoot"
      @use-item="handleUseItem"
    />
    
    <!-- Fallback if store not ready -->
    <div v-else class="loading">Chargement...</div>

    <!-- Coin Flip Modal -->
    <CoinFlipModal 
      v-if="gameStore.phase === 'coin_flip'" 
      @resolved="onCoinFlip" 
    />

    <!-- Game Over Dialog -->
    <q-dialog v-model="showGameOver" persistent>
      <q-card class="game-over-card" :class="gameStore.winner === 'player' ? 'card-victory' : 'card-defeat'">
        <q-card-section class="text-center">
          <div class="game-over-icon">
            {{ gameStore.winner === 'player' ? '👑' : '💀' }}
          </div>
          <h1 class="game-over-title">
            {{ gameStore.winner === 'player' ? 'VICTOIRE' : 'DÉFAITE' }}
          </h1>
          <p class="game-over-subtitle">
            {{ gameStore.winner === 'player' ? 'Vous avez survécu !' : 'Vous êtes mort...' }}
          </p>
        </q-card-section>
        <q-card-actions align="center" class="pb-6">
          <q-btn 
            unelevated 
            :color="gameStore.winner === 'player' ? 'positive' : 'negative'" 
            label="Rejouer" 
            class="px-8 py-2 text-lg font-bold"
            @click="restart"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useGameStore } from '../stores/gameStore.js';
import { remainingCounts } from '../engine/barrel.js';
import GameScene from './GameScene.vue';
import CoinFlipModal from './CoinFlipModal.vue';

const gameStore = useGameStore();
const gameSceneRef = ref(null);

const showGameOver = computed(() => gameStore.phase === 'game_over');

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

// Main shoot handler - controls the full animation flow
const handleShoot = async (target) => {
  // Safety: if already animating, wait a bit and check again
  if (gameStore.isAnimating) {
    await sleep(500);
    if (gameStore.isAnimating) {
      gameStore.isAnimating = false;
    }
  }
  
  // 1. Lock UI
  gameStore.isAnimating = true;
  
  try {
    // 2. Determine outcome BEFORE anything changes
    const actorKey = gameStore.phase === 'player_turn' ? 'player' : 'enemy';
    const actor = gameStore.players[actorKey];
    const opponentKey = actorKey === 'player' ? 'enemy' : 'player';
    let targetKey = target === 'self' ? actorKey : opponentKey;
    
    if (actor.invertTargetNext) {
      targetKey = targetKey === actorKey ? opponentKey : actorKey;
    }
    
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
      damage: damage
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
        gameSceneRef.value.rotateBarrel();
        await sleep(600); // Faster spin
      }
      
      // Quick result
      if (gameSceneRef.value?.showShotResult) {
        await gameSceneRef.value.showShotResult(actionData);
      }
      
      // Apply game logic
      await gameStore.shoot(target);
      await sleep(200);
      
    } else {
      // NORMAL MODE: Full dramatic animation
      
      // 3. Show action choice modal
      if (gameSceneRef.value?.showActionChoice) {
        await gameSceneRef.value.showActionChoice(actionData);
      }
      
      // 4. Zoom on barrel
      if (gameSceneRef.value?.startZoom) {
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
      }
      
      // 7. PAUSE to see the revealed bullet
      await sleep(isReal ? 2500 : 1200);
      
      // 8. Show result modal
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
      await gameStore.shoot(target);
      
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
  }
};

const handleUseItem = async (itemId) => {
  if (gameStore.isAnimating) return;
  
  // For peek, we need to show the result
  if (itemId === 'peek') {
    const nextBullet = gameStore.barrel.chambers[gameStore.barrel.index];
    await gameStore.useItem(itemId, 'player');
    
    // Show peek result modal
    if (gameSceneRef.value && nextBullet) {
      await gameSceneRef.value.showPeekResult(nextBullet === 'real');
    }
  } 
  // For eject, we need to spin, reveal, then eject
  else if (itemId === 'eject') {
    gameStore.isAnimating = true;
    
    try {
      // Get what will be ejected BEFORE the item is used
      const ejectedBullet = gameStore.barrel.chambers[gameStore.barrel.index];
      const isReal = ejectedBullet === 'real';
      
      // Spin barrel to show current slot
      if (gameSceneRef.value?.rotateBarrel) {
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
      await gameStore.useItem(itemId, 'player');
      
      await sleep(300);
    } finally {
      gameStore.isAnimating = false;
    }
  }
  else {
    await gameStore.useItem(itemId, 'player');
  }
};

const onCoinFlip = async (starts) => {
  // Add delay after coin flip before starting
  await sleep(500);
  gameStore.setCoinFlipResult(starts);
};

const restart = () => {
  gameStore.initGame(gameStore.mode);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

onMounted(() => {
  if (!gameStore.players.player.items) {
    gameStore.initGame('bot');
  }
});
</script>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  background: black;
  overflow: hidden;
  position: relative;
}

.loading {
  color: white;
  text-align: center;
  margin-top: 20%;
  font-size: 18px;
}

.game-over-card {
  min-width: 320px;
  border-radius: 24px;
  padding: 24px;
}

.card-victory {
  background: linear-gradient(145deg, #14532d, #052e16);
  border: 2px solid rgba(34, 197, 94, 0.5);
}

.card-defeat {
  background: linear-gradient(145deg, #450a0a, #1c0505);
  border: 2px solid rgba(239, 68, 68, 0.5);
}

.game-over-icon {
  font-size: 64px;
  margin-bottom: 8px;
}

.game-over-title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin: 0 0 8px 0;
  text-transform: uppercase;
}

.card-victory .game-over-title {
  color: #86efac;
  text-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
}

.card-defeat .game-over-title {
  color: #fca5a5;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
}

.game-over-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}
</style>
