<template>
  <q-page class="menu-page">
    <!-- Animated background -->
    <div class="bg-effects">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="floating-bullets">
        <div class="bullet b1">🔴</div>
        <div class="bullet b2">⚪</div>
        <div class="bullet b3">🔴</div>
        <div class="bullet b4">⚪</div>
        <div class="bullet b5">🔴</div>
      </div>
    </div>

    <div class="menu-hero-model" v-if="!showMultiplayer" aria-hidden="true">
      <div class="menu-hero-canvas" ref="menuModelRef"></div>
    </div>

    <!-- Main content -->
    <div class="menu-content">
      <!-- Logo/Title -->
      <header class="menu-header">
        <div class="logo-container">
          <div class="revolver-icon">
            <svg viewBox="0 0 100 100" class="revolver-svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="3"/>
              <circle cx="50" cy="50" r="12" fill="currentColor"/>
              <circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="76" cy="35" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="76" cy="65" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="50" cy="80" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="24" cy="65" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              <circle cx="24" cy="35" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </div>
        <h1 class="game-title">
          <span class="title-main">REVOLVER GAMBIT</span>
          <span class="title-sub">ONLINE</span>
        </h1>
        <p class="tagline">Tentez votre chance... si vous l'osez</p>
      </header>

      <!-- Player name section -->
      <section class="player-section" v-if="!showMultiplayer">
        <div class="player-card">
          <div class="player-avatar">
            <span class="avatar-emoji">🎭</span>
          </div>
          <div class="player-info">
            <template v-if="!netStore.playerName || editingName">
              <input
                v-model="playerNameInput"
                type="text"
                class="name-input"
                placeholder="Votre pseudo..."
                maxlength="12"
                @keyup.enter="setPlayerName"
                ref="nameInputRef"
              />
              <button class="save-name-btn" @click="setPlayerName" :disabled="!playerNameInput.trim()">
                <span>✓</span>
              </button>
            </template>
            <template v-else>
              <span class="player-name">{{ netStore.playerName }}</span>
              <button class="edit-btn" @click="startEditingName">
                <span>✏️</span>
              </button>
            </template>
          </div>
        </div>
        <p v-if="nameError" class="error-text">{{ nameError }}</p>
      </section>

      <!-- Main menu buttons -->
      <div class="menu-buttons" v-if="!showMultiplayer">
        <button class="game-btn btn-solo" @click="openSoloModal" :disabled="!netStore.playerName">
          <div class="btn-glow"></div>
          <div class="btn-content">
            <span class="btn-icon">🤖</span>
            <div class="btn-text">
              <span class="btn-title">Solo vs IA</span>
              <span class="btn-subtitle">Entraînez-vous contre le bot</span>
            </div>
          </div>
        </button>

        <button class="game-btn btn-multi" @click="showMultiplayer = true" :disabled="!netStore.playerName">
          <div class="btn-glow"></div>
          <div class="btn-content">
            <span class="btn-icon">⚔️</span>
            <div class="btn-text">
              <span class="btn-title">Multijoueur</span>
              <span class="btn-subtitle">Défiez un ami en ligne</span>
            </div>
          </div>
        </button>
      </div>

      <!-- Multiplayer panel -->
      <div class="multiplayer-panel" v-if="showMultiplayer">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          <span>Retour</span>
        </button>

        <div class="panel-header">
          <h2 class="panel-title">⚔️ Multijoueur</h2>
          <div class="connection-badge" :class="{ online: netStore.connected }">
            <span class="badge-dot"></span>
            <span class="badge-text">
              {{ netStore.connecting ? 'Connexion...' : netStore.connected ? 'En ligne' : 'Hors ligne' }}
            </span>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="netStore.error" class="error-banner">
          <span class="error-icon">⚠️</span>
          <span class="error-msg">{{ netStore.error }}</span>
          <button class="error-close" @click="netStore.clearError">✕</button>
        </div>

        <!-- Not in room yet -->
        <div v-if="!netStore.roomId" class="room-actions">
          <button class="action-btn create-btn" @click="createRoom" :disabled="netStore.connecting">
            <span class="action-icon">🏠</span>
            <span class="action-label">Créer une partie</span>
          </button>

          <div class="separator">
            <span class="sep-line"></span>
            <span class="sep-text">ou rejoindre</span>
            <span class="sep-line"></span>
          </div>

          <div class="join-section">
            <input
              v-model="roomInput"
              type="text"
              class="code-input"
              placeholder="CODE"
              maxlength="4"
              @input="roomInput = roomInput.toUpperCase()"
              @keyup.enter="joinRoom"
            />
            <button class="action-btn join-btn" @click="joinRoom" :disabled="!roomInput || netStore.connecting">
              Rejoindre
            </button>
          </div>
        </div>

        <!-- In room - lobby -->
        <div v-else class="room-lobby">
          <div class="lobby-code">
            <span class="code-label">Code de la partie</span>
            <div class="code-display" @click="copyCode">
              <span class="code-text">{{ netStore.roomId }}</span>
              <span class="code-copy">📋</span>
            </div>
            <span class="code-hint">Cliquez pour copier</span>
          </div>

          <div class="players-list">
            <div
              v-for="(slot, index) in lobbySlots"
              :key="slot.id || `slot-${index}`"
              class="player-row"
              :class="{ 'is-you': slot.isSelf, waiting: slot.isEmpty }"
            >
              <div class="player-badge" :class="slot.isHost ? 'host' : 'guest'">
                <span class="badge-crown" v-if="slot.isHost">👑</span>
                <span class="badge-icon" v-else>👤</span>
                <span class="badge-label">{{ slot.isHost ? 'HÔTE' : 'JOUEUR' }}</span>
              </div>
              <div class="player-details">
                <span class="player-row-name">
                  {{ slot.name }}
                </span>
                <span v-if="slot.isSelf" class="you-tag">(vous)</span>
                <span v-if="slot.isEmpty" class="waiting-text">En attente d'un joueur...</span>
              </div>
              <div class="player-status" :class="{ ready: !slot.isEmpty }">
                <span class="status-dot"></span>
                <span>{{ slot.isEmpty ? 'Attente' : 'Prêt' }}</span>
              </div>
              <button
                v-if="netStore.isHost && slot.id && !slot.isSelf"
                class="kick-btn"
                @click="kickPlayer(slot.id)"
              >
                Éjecter
              </button>
            </div>
          </div>

          <button 
            v-if="netStore.isHost && canStartMatch"
            class="start-game-btn"
            @click="startMultiplayer"
          >
            <span class="start-icon">🎮</span>
            <span>Lancer la partie</span>
          </button>

          <p v-else-if="netStore.isHost" class="waiting-message">
            <span class="pulse-dot"></span>
            <span v-if="missingPlayerCount > 0">
              En attente de {{ missingPlayerCount }} joueur{{ missingPlayerCount > 1 ? 's' : '' }}...
            </span>
            <span v-else>
              Vous pouvez lancer à 2 joueurs ou attendre un 3e.
            </span>
          </p>
          <p v-else class="waiting-message">
            <span class="pulse-dot"></span>
            L'hôte va bientôt lancer la partie...
          </p>

          <button class="leave-room-btn" @click="leaveRoom">
            🚪 Quitter la room
          </button>
        </div>
      </div>

      <!-- Footer -->
      <footer class="menu-footer">
        <p>Un jeu de chance et de stratégie</p>
      </footer>
    </div>

    <q-dialog v-model="showDifficultyModal">
      <q-card class="difficulty-modal-card">
        <q-card-section class="difficulty-modal-header">
          <h2>Choisir la difficulté</h2>
        </q-card-section>
        <q-card-section>
          <div class="difficulty-grid">
            <button
              v-for="level in botLevels"
              :key="level.id"
              class="difficulty-card"
              :class="{ selected: botDifficulty === level.id }"
              @click="selectBotDifficulty(level.id)"
            >
              <div class="difficulty-stars">{{ level.stars }}</div>
              <div class="difficulty-name">{{ level.name }}</div>
              <div class="difficulty-tag">{{ level.tag }}</div>
            </button>
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            unelevated
            color="positive"
            label="Lancer la partie"
            class="start-bot-btn"
            @click="startBot"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();

const showMultiplayer = ref(false);
const roomInput = ref('');
const playerNameInput = ref('');
const editingName = ref(!netStore.playerName);
const nameError = ref('');
const nameInputRef = ref(null);
const showDifficultyModal = ref(false);
const botDifficulty = ref(gameStore.botDifficulty ?? 1);
const menuModelRef = ref(null);
let renderer;
let scene;
let camera;
let gunModel;
let animationFrameId;
let resizeObserver;
let floatingClock;
let resizeHandler;
const botLevels = [
  { id: 1, name: 'Bot Paysan', stars: '⭐', tag: 'Facile' },
  { id: 2, name: 'Bot Prince', stars: '⭐⭐', tag: 'Moyen' },
  { id: 3, name: 'Bot Tsar', stars: '⭐⭐⭐', tag: 'Difficile' },
  { id: 4, name: 'Empereur', stars: '⭐⭐⭐⭐', tag: 'Difficile ++' }
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 3;

const lobbySlots = computed(() => {
  const slots = netStore.roomPlayers.map((player) => ({
    ...player,
    isSelf: player.id === netStore.socketId,
    isEmpty: false
  }));
  while (slots.length < MAX_PLAYERS) {
    slots.push({
      id: null,
      name: 'Emplacement libre',
      isHost: false,
      isSelf: false,
      isEmpty: true
    });
  }
  return slots;
});

const missingPlayerCount = computed(() => Math.max(0, MIN_PLAYERS - netStore.roomPlayers.length));
const canStartMatch = computed(() => netStore.roomPlayers.length >= MIN_PLAYERS && !netStore.gameEnded);

const selectBotDifficulty = (levelId) => {
  botDifficulty.value = levelId;
  gameStore.setBotDifficulty(levelId);
};

const openSoloModal = () => {
  if (!netStore.playerName) {
    nameError.value = 'Veuillez renseigner un nom pour jouer.';
    editingName.value = true;
    return;
  }
  showDifficultyModal.value = true;
};

const startBot = () => {
  if (!netStore.playerName) {
    nameError.value = 'Veuillez renseigner un nom pour jouer.';
    editingName.value = true;
    return;
  }
  gameStore.initGame('bot', { botDifficulty: botDifficulty.value });
  gameStore.players.player.name = netStore.playerName;
  showDifficultyModal.value = false;
  router.push('/game');
};

const goBack = () => {
  showMultiplayer.value = false;
  editingName.value = false;
  netStore.leaveRoom();
};

const setPlayerName = () => {
  const name = playerNameInput.value.trim();
  if (!name) return;
  netStore.playerName = name;
  nameError.value = '';
  editingName.value = false;
};

const startEditingName = async () => {
  editingName.value = true;
  playerNameInput.value = netStore.playerName || '';
  nameError.value = '';
  await nextTick();
  nameInputRef.value?.focus();
};

const createRoom = async () => {
  if (!netStore.playerName) return;
  await netStore.createRoom();
};

const joinRoom = async () => {
  if (!roomInput.value || roomInput.value.length < 4 || !netStore.playerName) return;
  await netStore.joinRoom(roomInput.value.trim());
};

const leaveRoom = () => {
  netStore.leaveRoom();
  roomInput.value = '';
};

const kickPlayer = (playerId) => {
  netStore.kickPlayer(playerId);
};

const copyCode = () => {
  if (netStore.roomId) {
    navigator.clipboard.writeText(netStore.roomId);
  }
};

const startMultiplayer = async () => {
  console.log('🎮 Host starting game...');
  const roster = netStore.roomPlayers;
  if (roster.length < MIN_PLAYERS) {
    return;
  }

  const playerKeys = roster.length >= MAX_PLAYERS
    ? ['player', 'enemy', 'enemy2']
    : ['player', 'enemy'];
  gameStore.initGame('online', { playerKeys });

  playerKeys.forEach((key, index) => {
    const playerInfo = roster[index];
    if (!playerInfo) return;
    gameStore.players[key].name = playerInfo.name;
    gameStore.players[key].socketId = playerInfo.id;
    gameStore.players[key].isActive = true;
  });

  const shuffled = [...playerKeys].sort(() => Math.random() - 0.5);
  gameStore.turnOrder = shuffled;
  gameStore.setCoinFlipResult(shuffled[0]);

  // Wait a bit to ensure guest is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Serialize and send initial state to all players
  const state = {
    phase: gameStore.phase,
    currentTurn: gameStore.currentTurn,
    turnOrder: gameStore.turnOrder,
    barrel: gameStore.barrel,
    players: gameStore.players,
    lastResult: gameStore.lastResult,
    lastAction: gameStore.lastAction,
    winner: gameStore.winner,
    reloadCount: gameStore.reloadCount,
    lastReloadInfo: gameStore.lastReloadInfo,
    hostName: netStore.playerName,
    onlineFlipResult: gameStore.currentTurn
  };
  
  console.log('📤 Sending game state to all players:', state);
  netStore.startGame(state);
  
  // Wait a bit before redirecting to ensure event is sent
  await new Promise(resolve => setTimeout(resolve, 200));
  router.push('/game');
};

// Listen for game start from host (for guests)
onMounted(() => {
  console.log('👂 MenuScreen mounted');
  
  // Setup listener immediately
  setupGameStateListener();
  nextTick(() => {
    if (!showMultiplayer.value) {
      initMenuModel();
    }
  });
});

watch(() => netStore.playerName, (value) => {
  if (!editingName.value) {
    playerNameInput.value = value || '';
  }
});

watch(playerNameInput, () => {
  nameError.value = '';
});

// Setup the listener
const setupGameStateListener = () => {
  console.log('🎧 Setting up game:state listener...');
  
  netStore.onGameState((state) => {
    console.log('📥 Received game:state event!');
    console.log('  - State:', state);
    console.log('  - isHost:', netStore.isHost);
    console.log('  - roomId:', netStore.roomId);
    
    // Guest receives state and starts game
    if (!netStore.isHost && state && netStore.roomId) {
      console.log('🚀 Guest redirecting to game!');
      const playerKeys = state.turnOrder ?? Object.keys(state.players ?? {});
      gameStore.initGame('online', { playerKeys });
      gameStore.hydrateFromNetwork(state);
      router.push('/game');
    } else {
      console.log('❌ Not redirecting:', {
        isHost: netStore.isHost,
        hasState: !!state,
        hasRoomId: !!netStore.roomId
      });
    }
  });
};

// Re-setup listener when room is joined
watch(() => netStore.roomId, (roomId) => {
  if (roomId && !netStore.isHost) {
    console.log('👥 Guest joined room, re-setting up listener');
    setupGameStateListener();
  }
});

watch(showMultiplayer, async (value) => {
  if (value) {
    cleanupMenuModel();
    return;
  }
  await nextTick();
  initMenuModel();
});

onUnmounted(() => {
  console.log('👋 MenuScreen unmounted, removing listeners');
  netStore.offGameState();
  cleanupMenuModel();
});

const initMenuModel = async () => {
  if (!menuModelRef.value || renderer) return;

  const container = menuModelRef.value;
  const width = container.clientWidth || 1;
  const height = container.clientHeight || 1;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0.2, 0.25, width < 380 ? 30 : 24);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  const keyLight = new THREE.DirectionalLight(0xffedd5, 1.3);
  keyLight.position.set(3, 4, 2);
  const fillLight = new THREE.PointLight(0xf59e0b, 0.6, 10);
  fillLight.position.set(-2, 1, 3);
  scene.add(ambientLight, keyLight, fillLight);

  floatingClock = new THREE.Clock();

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(new URL('../assets/3d/gun.glb', import.meta.url).href);
  gunModel = gltf.scene;
  gunModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  const startScale = 0.08;
  const finalScale = 0.004;
  const startPosition = { x: -0.1, y: -0.35, z: 1.6 };
  const finalPosition = { x: 0.45, y: 0.15, z: -1.6 };
  const startRotation = { x: 0.1, y: Math.PI * 0.8, z: 0 };
  const finalRotation = { x: -0.15, y: Math.PI * 1.35, z: 0.08 };

  gunModel.scale.set(startScale, startScale, startScale);
  gunModel.position.set(startPosition.x, startPosition.y, startPosition.z);
  gunModel.rotation.set(startRotation.x, startRotation.y, startRotation.z);
  gunModel.userData.floatBase = finalPosition.y;
  gunModel.userData.isSettled = false;
  scene.add(gunModel);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    gunModel.scale.set(finalScale, finalScale, finalScale);
    gunModel.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
    gunModel.rotation.set(finalRotation.x, finalRotation.y, finalRotation.z);
    gunModel.userData.isSettled = true;
  } else {
    gsap.timeline({
      defaults: { duration: 1.8, ease: 'power3.out' },
      onComplete: () => {
        if (gunModel) {
          gunModel.userData.isSettled = true;
        }
      }
    })
      .to(gunModel.scale, { x: finalScale, y: finalScale, z: finalScale }, 0)
      .to(gunModel.position, { ...finalPosition }, 0)
      .to(gunModel.rotation, { ...finalRotation, duration: 2.2, ease: 'power2.out' }, 0);
  }

  const renderFrame = () => {
    animationFrameId = window.requestAnimationFrame(renderFrame);
    if (gunModel) {
      gunModel.rotation.y += 0.003;
      if (gunModel.userData.isSettled) {
        const t = floatingClock.getElapsedTime();
        gunModel.position.y = gunModel.userData.floatBase + Math.sin(t * 1.4) * 0.05;
      }
    }
    renderer.render(scene, camera);
  };

  resizeHandler = () => {
    if (!renderer || !camera || !menuModelRef.value) return;
    const nextWidth = menuModelRef.value.clientWidth || 1;
    const nextHeight = menuModelRef.value.clientHeight || 1;
    renderer.setSize(nextWidth, nextHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.position.z = nextWidth < 380 ? 5 : 4;
    camera.updateProjectionMatrix();
  };

  resizeObserver = new ResizeObserver(resizeHandler);
  resizeObserver.observe(menuModelRef.value);
  window.addEventListener('resize', resizeHandler);
  renderFrame();
};

const cleanupMenuModel = () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (resizeObserver && menuModelRef.value) {
    resizeObserver.unobserve(menuModelRef.value);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  resizeObserver = null;
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  resizeHandler = null;
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  if (scene) {
    scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose?.();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose?.());
        } else {
          child.material.dispose?.();
        }
      }
    });
  }
  renderer = null;
  scene = null;
  camera = null;
  gunModel = null;
  floatingClock = null;
};
</script>

<style scoped>
.menu-page {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: #0a0a0f;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Background effects */
.bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.menu-hero-model {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: clamp(24px, 7vh, 60px);
  pointer-events: none;
  z-index: 0;
}

.menu-hero-canvas {
  width: min(85vw, 520px);
  height: clamp(220px, 42vh, 420px);
  filter: drop-shadow(0 18px 30px rgba(15, 23, 42, 0.45));
  opacity: 0.9;
}

.menu-hero-canvas canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.floating-bullets {
  position: absolute;
  inset: 0;
}

.bullet {
  position: absolute;
  font-size: 20px;
  opacity: 0.15;
  animation: float-bullet 20s ease-in-out infinite;
}

.b1 { top: 15%; left: 10%; animation-delay: 0s; }
.b2 { top: 25%; right: 15%; animation-delay: -4s; }
.b3 { top: 60%; left: 5%; animation-delay: -8s; }
.b4 { top: 70%; right: 8%; animation-delay: -12s; }
.b5 { top: 85%; left: 50%; animation-delay: -16s; }

@keyframes float-bullet {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}

/* Menu content */
.menu-content {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  padding-bottom: 60px;
  gap: 32px;
  box-sizing: border-box;
}

/* Center content only when there's enough space and not in multiplayer mode */
@media (min-height: 750px) {
  .menu-content:not(:has(.multiplayer-panel)) {
    justify-content: center;
  }
}

/* Multiplayer panel always starts from top for better scroll */
.menu-content:has(.multiplayer-panel) {
  justify-content: flex-start;
  padding-top: 30px;
  padding-bottom: 80px;
}

/* Header */
.menu-header {
  text-align: center;
}

.logo-container {
  margin-bottom: 16px;
}

.revolver-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  animation: spin-slow 20s linear infinite;
}

.revolver-svg {
  width: 100%;
  height: 100%;
  color: #f59e0b;
  filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.4));
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.game-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

.title-main {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: #fef3c7;
  text-shadow: 
    0 0 40px rgba(245, 158, 11, 0.5),
    0 2px 0 rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.title-sub {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.4em;
  color: #dc2626;
  text-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
}

.tagline {
  margin-top: 12px;
  font-size: 13px;
  color: #71717a;
  font-style: italic;
}

/* Player section */
.player-section {
  width: 100%;
  max-width: 340px;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.player-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f1f2e 0%, #0f0f17 100%);
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.avatar-emoji {
  font-size: 24px;
}

.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name {
  font-size: 18px;
  font-weight: 700;
  color: #fef3c7;
}

.name-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fef3c7;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
}

.name-input::placeholder {
  color: #52525b;
}

.name-input:focus {
  border-color: #f59e0b;
}

.save-name-btn,
.edit-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 10px;
  color: #0a0a0f;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.save-name-btn:hover:not(:disabled),
.edit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
}

.save-name-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #a1a1aa;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fef3c7;
}

.error-text {
  margin: 8px 0 0;
  font-size: 13px;
  color: #f87171;
  text-align: center;
}

/* Difficulty modal */
.difficulty-modal-card {
  width: min(90vw, 360px);
  border-radius: 20px;
  padding: 8px 4px 16px;
  background: linear-gradient(145deg, rgba(15, 15, 20, 0.98), rgba(8, 8, 12, 0.98));
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.difficulty-modal-header {
  text-align: center;
  padding: 16px 18px 8px;
}

.difficulty-modal-header h2 {
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #fef3c7;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.difficulty-card {
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #fef3c7;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-card:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.2);
}

.difficulty-card.selected {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(180, 83, 9, 0.2));
  border-color: rgba(245, 158, 11, 0.6);
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.25);
}

.difficulty-stars {
  font-size: 13px;
  color: #fbbf24;
  letter-spacing: 0.1em;
}

.difficulty-name {
  font-size: 12px;
  font-weight: 700;
}

.difficulty-tag {
  font-size: 10px;
  color: #a1a1aa;
}

.start-bot-btn {
  width: 100%;
  font-weight: 700;
}

/* Menu buttons */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 340px;
}

.game-btn {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 16px;
  border: 1px solid;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.game-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.game-btn:hover:not(:disabled) .btn-glow {
  opacity: 1;
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  width: 100%;
}

.btn-icon {
  font-size: 36px;
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-title {
  font-size: 18px;
  font-weight: 700;
  color: #fef3c7;
}

.btn-subtitle {
  font-size: 12px;
  color: #a1a1aa;
  margin-top: 2px;
}

.btn-solo {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.2) 100%);
  border-color: rgba(220, 38, 38, 0.4);
}

.btn-solo .btn-glow {
  background: radial-gradient(ellipse at center, rgba(220, 38, 38, 0.2) 0%, transparent 70%);
}

.btn-solo:hover:not(:disabled) {
  border-color: #dc2626;
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(220, 38, 38, 0.25);
}

.btn-multi {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.18) 100%);
  border-color: rgba(245, 158, 11, 0.35);
}

.btn-multi .btn-glow {
  background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
}

.btn-multi:hover:not(:disabled) {
  border-color: #f59e0b;
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(245, 158, 11, 0.2);
}

/* Multiplayer panel */
.multiplayer-panel {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #71717a;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #fef3c7;
}

.back-icon {
  font-size: 18px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
  color: #fef3c7;
  margin: 0;
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 12px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: background 0.3s, box-shadow 0.3s;
}

.connection-badge.online .badge-dot {
  background: #22c55e;
  box-shadow: 0 0 12px #22c55e;
}

.badge-text {
  color: #a1a1aa;
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
}

.error-icon {
  font-size: 18px;
}

.error-msg {
  flex: 1;
  color: #fca5a5;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
}

/* Room actions */
.room-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  color: white;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.35);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.separator {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sep-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
}

.sep-text {
  font-size: 12px;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.join-section {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: #fef3c7;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.35em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s;
}

.code-input::placeholder {
  color: #3f3f46;
  letter-spacing: 0.2em;
  font-weight: 600;
}

.code-input:focus {
  border-color: #f59e0b;
}

.join-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: #0a0a0f;
  padding: 16px 28px;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.35);
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Room lobby */
.room-lobby {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lobby-code {
  text-align: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.12) 100%);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 16px;
}

.code-label {
  display: block;
  font-size: 11px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 10px;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.code-display:hover {
  transform: scale(1.02);
}

.code-text {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: #f59e0b;
  text-shadow: 0 0 40px rgba(245, 158, 11, 0.5);
}

.code-copy {
  font-size: 20px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.code-display:hover .code-copy {
  opacity: 1;
}

.code-hint {
  display: block;
  font-size: 11px;
  color: #52525b;
  margin-top: 8px;
}

/* Players list */
.players-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.2s;
}

.player-row.is-you {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

.player-row.waiting {
  opacity: 0.5;
  border-style: dashed;
}

.player-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 50px;
}

.badge-crown,
.badge-icon {
  font-size: 22px;
}

.badge-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #71717a;
}

.player-badge.host .badge-label {
  color: #f59e0b;
}

.player-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.kick-btn {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kick-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.6);
}

.player-row-name {
  font-size: 15px;
  font-weight: 600;
  color: #e4e4e7;
}

.you-tag {
  font-size: 11px;
  color: #71717a;
}

.waiting-text {
  font-size: 13px;
  color: #52525b;
  font-style: italic;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 11px;
  color: #71717a;
}

.player-status.ready {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.player-status.ready .status-dot {
  box-shadow: 0 0 8px currentColor;
}

/* Start game button */
.start-game-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 32px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.start-game-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(34, 197, 94, 0.4);
}

.start-icon {
  font-size: 22px;
}

.waiting-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #71717a;
  font-size: 14px;
  text-align: center;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.leave-room-btn {
  align-self: center;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #71717a;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-room-btn:hover {
  border-color: #ef4444;
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

/* Footer */
.menu-footer {
  margin-top: auto;
  padding-top: 20px;
}

.menu-footer p {
  font-size: 11px;
  color: #3f3f46;
  margin: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .menu-content {
    padding: 30px 16px;
    gap: 24px;
  }

  .revolver-icon {
    width: 60px;
    height: 60px;
  }

  .title-main {
    font-size: 32px;
  }

  .title-sub {
    font-size: 16px;
    letter-spacing: 0.3em;
  }

  .player-card {
    padding: 14px 16px;
  }

  .player-avatar {
    width: 42px;
    height: 42px;
  }

  .btn-content {
    padding: 16px 18px;
    gap: 14px;
  }

  .btn-icon {
    font-size: 28px;
  }

  .btn-title {
    font-size: 16px;
  }

  .panel-title {
    font-size: 20px;
  }

  .lobby-code {
    padding: 16px 14px;
  }

  .code-text {
    font-size: 26px;
    letter-spacing: 0.2em;
  }

  .code-copy {
    font-size: 16px;
  }

  .player-row {
    padding: 12px 12px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .player-badge {
    min-width: 44px;
  }

  .badge-crown,
  .badge-icon {
    font-size: 18px;
  }

  .badge-label {
    font-size: 8px;
  }

  .player-row-name {
    font-size: 14px;
  }

  .player-status {
    padding: 5px 10px;
    font-size: 10px;
  }

  .action-btn,
  .start-game-btn {
    padding: 14px 20px;
    font-size: 15px;
  }

  .join-section {
    flex-direction: column;
    gap: 10px;
  }

  .code-input {
    font-size: 20px;
    padding: 14px 16px;
    letter-spacing: 0.25em;
  }

  .join-btn {
    padding: 14px 20px;
    width: 100%;
  }
}

@media (max-width: 360px) {
  .menu-content {
    padding: 24px 12px;
    gap: 20px;
  }

  .title-main {
    font-size: 26px;
  }

  .title-sub {
    font-size: 14px;
    letter-spacing: 0.25em;
  }

  .code-text {
    font-size: 22px;
    letter-spacing: 0.15em;
  }

  .player-row {
    padding: 10px 10px;
  }

  .player-details {
    flex-wrap: wrap;
    gap: 4px;
  }
}

@media (min-width: 768px) {
  .menu-content {
    max-width: 500px;
    margin: 0 auto;
  }
}
</style>
