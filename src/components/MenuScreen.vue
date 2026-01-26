<template>
  <q-page class="menu-page">
    <MenuBackground />

    <div class="menu-hero-model" v-if="!showMultiplayer" aria-hidden="true">
      <div class="menu-hero-canvas" ref="menuModelRef"></div>
    </div>

    <MenuUserBar
      :is-authenticated="authStore.isAuthenticated"
      :display-name="displayName"
      :avatar-seed="avatarSeed"
      :avatar-colors="avatarColors"
      :email="authStore.user?.email"
      @profile="openProfileSelf"
      @settings="openProfileSettings"
      @weapon-skins="openWeaponSkins"
      @logout="handleLogout"
    />

    <MenuUtilityButtons @help="goHelp" @leaderboard="openLeaderboard" />

    <!-- Main content -->
    <div class="menu-content" :class="{ 'menu-content--multiplayer': showMultiplayer }">
      <MenuHeader :is-authenticated="authStore.isAuthenticated" @auth="goAuth" />

      <MenuButtons
        :show-multiplayer="showMultiplayer"
        @solo="openSoloModal"
        @multiplayer="showMultiplayer = true"
      />

      <MenuMultiplayerPanel
        v-if="showMultiplayer"
        :net-store="netStore"
        :lobby-slots="lobbySlots"
        :room-input="roomInput"
        :code-copied="codeCopied"
        :can-start-match="canStartMatch"
        :missing-player-count="missingPlayerCount"
        @back="goBack"
        @create-room="createRoom"
        @join-room="joinRoom"
        @update:roomInput="updateRoomInput"
        @copy-code="copyCode"
        @kick-player="kickPlayer"
        @open-profile="openProfileFromSlot"
        @start-game="startMultiplayer"
        @leave-room="leaveRoom"
      />

      <MenuFooter />
    </div>

    <q-dialog v-model="showDifficultyModal" persistent>
      <q-card class="difficulty-modal-card">
        <q-card-section class="difficulty-modal-header">
          <div class="modal-icon-wrapper">
            <q-icon name="psychology" size="48px" class="modal-icon" />
          </div>
          <h2 class="modal-title">Choisir la difficulté</h2>
          <p class="modal-subtitle">Testez vos compétences contre l'IA</p>
        </q-card-section>

        <q-separator dark class="q-my-md" />

        <q-card-section class="difficulty-content">
          <div class="difficulty-grid">
            <q-card
              v-for="level in botLevels"
              :key="level.id"
              class="difficulty-option"
              :class="{ 
                'difficulty-selected': botDifficulty === level.id,
                'difficulty-locked': isLevelLocked(level),
                [`difficulty-level-${level.id}`]: true
              }"
              @click="selectBotDifficulty(level.id)"
            >
              <q-card-section class="difficulty-option-content">
                <div class="difficulty-stars">{{ level.stars }}</div>
                <div class="difficulty-name">{{ level.name }}</div>
                <q-chip 
                  :color="getDifficultyColor(level.id)" 
                  text-color="white" 
                  size="sm"
                  class="difficulty-chip"
                >
                  {{ level.tag }}
                </q-chip>
                
                <div class="difficulty-status" v-if="authStore.isAuthenticated">
                  <q-badge
                    v-if="!isLevelLocked(level) && soloProgressStatus(level).label"
                    :color="soloProgressStatus(level).color"
                    class="status-badge"
                    rounded
                  >
                    <q-icon :name="soloProgressStatus(level).icon" size="12px" class="q-mr-xs" />
                    {{ soloProgressStatus(level).label }}
                  </q-badge>
                  <q-badge
                    v-else-if="isLevelLocked(level)"
                    color="grey-8"
                    class="status-badge"
                    rounded
                  >
                    <q-icon name="lock" size="12px" class="q-mr-xs" />
                    Verrouillé
                  </q-badge>
                </div>

                <div class="difficulty-check" v-if="botDifficulty === level.id && !isLevelLocked(level)">
                  <q-icon name="check_circle" size="24px" color="positive" />
                </div>

                <div class="difficulty-lock-overlay" v-if="isLevelLocked(level)">
                  <q-icon name="lock" size="48px" color="grey-5" />
                </div>
              </q-card-section>

              <q-inner-loading :showing="false" />
            </q-card>
          </div>

          <q-banner v-if="!authStore.isAuthenticated" rounded class="auth-hint-banner q-mt-md">
            <template v-slot:avatar>
              <q-icon name="info" color="blue-4" />
            </template>
            Connectez-vous pour débloquer tous les niveaux et suivre votre progression.
          </q-banner>
          <q-banner v-else rounded class="progression-hint-banner q-mt-md">
            <template v-slot:avatar>
              <q-icon name="emoji_events" color="amber-6" />
            </template>
            Battez chaque niveau pour débloquer le suivant !
          </q-banner>
        </q-card-section>

        <q-separator dark class="q-my-md" />

        <q-card-actions class="difficulty-actions q-px-lg q-pb-lg q-pt-md">
          <button
            type="button"
            class="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white justify-center"
            @click="showDifficultyModal = false"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-8 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 justify-center flex items-center gap-2"
            @click="startBot"
          >
            <span>Lancer la partie</span>
            <q-icon name="play_arrow" size="18px" />
            <q-tooltip>Commencer le duel contre {{ botLevels.find(l => l.id === botDifficulty)?.name }}</q-tooltip>
          </button>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ProfileStatsModal
      v-model="showProfileModal"
      :profile="selectedProfile"
      :stats="profileStats"
      :loading="profileLoading"
      :error="profileError"
      :confrontation="confrontationStats"
      :confrontation-loading="confrontationLoading"
      :confrontation-error="confrontationError"
      :solo-progress="soloProgress"
      :bot-levels="botLevels"
    />

    <ProfileSettingsModal v-model="showProfileSettingsModal" />

    <LeaderboardModal
      v-model="showLeaderboardModal"
      :leaderboards="leaderboards"
      :loading="leaderboardLoading"
      :error="leaderboardError"
      :highlight-id="leaderboardUserId"
      @select-profile="openProfileFromLeaderboard"
    />

    <WeaponSkinModal v-model="showWeaponSkinsModal" />
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { useMatchStore } from '../stores/matchStore.js';
import ProfileStatsModal from './ProfileStatsModal.vue';
import LeaderboardModal from './LeaderboardModal.vue';
import ProfileSettingsModal from './ProfileSettingsModal.vue';
import MenuBackground from './menu/MenuBackground.vue';
import MenuButtons from './menu/MenuButtons.vue';
import MenuFooter from './menu/MenuFooter.vue';
import MenuHeader from './menu/MenuHeader.vue';
import MenuMultiplayerPanel from './menu/MenuMultiplayerPanel.vue';
import MenuUserBar from './menu/MenuUserBar.vue';
import MenuUtilityButtons from './menu/MenuUtilityButtons.vue';
import WeaponSkinModal from './WeaponSkinModal.vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();
const authStore = useAuthStore();
const matchStore = useMatchStore();

const showMultiplayer = ref(false);
const roomInput = ref('');
const showDifficultyModal = ref(false);
const showProfileModal = ref(false);
const showProfileSettingsModal = ref(false);
const botDifficulty = ref(gameStore.botDifficulty ?? 1);
const menuModelRef = ref(null);
const soloProgress = ref([]);
const profileLoading = ref(false);
const profileError = ref('');
const profileStats = ref(null);
const confrontationStats = ref(null);
const confrontationLoading = ref(false);
const confrontationError = ref('');
const showLeaderboardModal = ref(false);
const showWeaponSkinsModal = ref(false);
const leaderboardLoading = ref(false);
const leaderboardError = ref('');
const leaderboards = ref({
  '1v1': { entries: [], selfEntry: null },
  '1v1v1': { entries: [], selfEntry: null }
});
const selectedProfile = ref(null);
let renderer;
let scene;
let camera;
let gunModel;
let animationFrameId;
let resizeObserver;
let floatingClock;
let resizeHandler;
const botLevels = [
  { id: 1, key: 'peasant', name: 'Bot Paysan', stars: '⭐', tag: 'Facile' },
  { id: 2, key: 'prince', name: 'Bot Prince', stars: '⭐⭐', tag: 'Moyen' },
  { id: 3, key: 'tsar', name: 'Bot Tsar', stars: '⭐⭐⭐', tag: 'Difficile' },
  { id: 4, key: 'emperor', name: 'Empereur', stars: '⭐⭐⭐⭐', tag: 'Difficile ++' }
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 3;

const displayName = computed(() => {
  const user = authStore.user;
  return user?.username || user?.email?.split('@')[0] || 'Joueur';
});
const avatarSeed = computed(() => displayName.value.split(' ')[0] || displayName.value);
const avatarColors = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'];

const leaderboardUserId = computed(() => authStore.user?.id || '');

const getDifficultyColor = (levelId) => {
  const colors = {
    1: 'green-6',
    2: 'blue-6',
    3: 'orange-6',
    4: 'red-6'
  };
  return colors[levelId] || 'grey-6';
};

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
const soloProgressMap = computed(
  () => new Map(soloProgress.value.map((entry) => [entry.difficulty, entry]))
);

const hasSoloVictory = (entry) => {
  if (!entry) return false;
  if (typeof entry.times_defeated === 'number') {
    return entry.times_defeated > 0;
  }
  return entry.is_defeated === false;
};

const hasSoloLoss = (entry) => {
  if (!entry) return false;
  if (typeof entry.times_lost === 'number') {
    return entry.times_lost > 0;
  }
  return entry.is_defeated === true;
};

const isLevelLocked = (level) => {
  if (level.id === 1) return false; // Level 1 always unlocked
  if (!authStore.isAuthenticated) return true; // Lock all except 1 if not authenticated
  
  // Find previous level
  const prevLevel = botLevels.find(l => l.id === level.id - 1);
  if (!prevLevel) return false;
  
  const entry = soloProgressMap.value.get(prevLevel.key);
  
  // Locked if no entry or if the previous bot hasn't been beaten at least once.
  if (!entry) return true;
  return !hasSoloVictory(entry);
};

const selectBotDifficulty = (levelId) => {
  const level = botLevels.find(l => l.id === levelId);
  if (level && isLevelLocked(level)) return; // Prevent selection if locked
  
  botDifficulty.value = levelId;
  gameStore.setBotDifficulty(levelId);
};

const openSoloModal = () => {
  showDifficultyModal.value = true;
  loadSoloProgress();
};

const startBot = () => {
  if (!netStore.playerName) return;
  gameStore.initGame('bot', { botDifficulty: botDifficulty.value });
  gameStore.players.player.name = netStore.playerName;
  gameStore.players.player.userId = authStore.user?.id || null;
  showDifficultyModal.value = false;
  router.push('/game');
};

const goBack = () => {
  showMultiplayer.value = false;
  netStore.leaveRoom();
};

const goAuth = () => {
  router.push('/auth');
};

const goHelp = () => {
  router.push('/help');
};

const openWeaponSkins = () => {
  showWeaponSkinsModal.value = true;
};

const loadLeaderboards = async () => {
  leaderboardError.value = '';
  if (!authStore.isAuthenticated) {
    leaderboardError.value = 'Connectez-vous pour voir le classement.';
    return;
  }
  leaderboardLoading.value = true;
  try {
    const [duel, trio] = await Promise.all([
      matchStore.fetchLeaderboard('1v1'),
      matchStore.fetchLeaderboard('1v1v1')
    ]);
    leaderboards.value = {
      '1v1': duel,
      '1v1v1': trio
    };
  } catch (error) {
    leaderboardError.value = error?.message || 'Impossible de charger le classement.';
  } finally {
    leaderboardLoading.value = false;
  }
};

const openLeaderboard = () => {
  showLeaderboardModal.value = true;
  loadLeaderboards();
};

const soloProgressStatus = (level) => {
  if (!authStore.isAuthenticated) {
    return { label: '', color: 'grey-7', icon: 'help_outline' };
  }
  const entry = soloProgressMap.value.get(level.key);
  if (!entry) {
    return { label: 'Non tenté', color: 'grey-7', icon: 'hourglass_empty' };
  }
  if (hasSoloVictory(entry)) {
    return { label: 'Bot battu', color: 'positive', icon: 'check' };
  }
  if (hasSoloLoss(entry)) {
    return { label: 'Défaite', color: 'negative', icon: 'close' };
  }
  return { label: 'En cours', color: 'warning', icon: 'hourglass_top' };
};

const loadSoloProgress = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const data = await matchStore.fetchSoloProgress();
    soloProgress.value = data?.progress || [];
  } catch (error) {
    console.warn('Impossible de charger la progression solo:', error);
  }
};

const loadProfileStats = async (target) => {
  profileError.value = '';
  profileStats.value = null;
  if (!authStore.isAuthenticated) {
    profileError.value = 'Connectez-vous pour voir les statistiques.';
    return;
  }
  if (!target?.userId) {
    profileError.value = 'Stats indisponibles pour ce joueur.';
    return;
  }
  profileLoading.value = true;
  try {
    const response = target.isSelf
      ? await matchStore.fetchMyStats()
      : await matchStore.fetchUserStats(target.userId);
    profileStats.value = response?.stats || {};
    if (target.isSelf) {
      await loadSoloProgress();
    }
  } catch (error) {
    profileError.value = error?.message || 'Impossible de charger les stats.';
  } finally {
    profileLoading.value = false;
  }

  if (target.isSelf) {
    confrontationStats.value = null;
    confrontationError.value = '';
  } else {
    await loadConfrontationStats(target);
  }
};

const openProfileSelf = () => {
  const user = authStore.user;
  const payload = {
    name: displayName.value,
    userId: user?.id || null,
    isSelf: true
  };
  selectedProfile.value = payload;
  showProfileModal.value = true;
  loadProfileStats(payload);
};

const openProfileSettings = () => {
  showProfileSettingsModal.value = true;
};

const openProfileFromSlot = (slot) => {
  if (!slot || slot.isEmpty) return;
  const payload = {
    name: slot.name,
    userId: slot.userId || null,
    isSelf: slot.isSelf
  };
  selectedProfile.value = payload;
  showProfileModal.value = true;
  loadProfileStats(payload);
};

const openProfileFromLeaderboard = (entry) => {
  if (!entry?.userId) return;
  const payload = {
    name: entry.username || 'Joueur',
    userId: entry.userId,
    isSelf: entry.userId === authStore.user?.id
  };
  showLeaderboardModal.value = false;
  selectedProfile.value = payload;
  showProfileModal.value = true;
  loadProfileStats(payload);
};

const loadConfrontationStats = async (target) => {
  confrontationError.value = '';
  confrontationStats.value = null;
  if (!authStore.isAuthenticated) {
    confrontationError.value = 'Connectez-vous pour voir la confrontation.';
    return;
  }
  if (!target?.userId) {
    confrontationError.value = 'Confrontation indisponible.';
    return;
  }
  confrontationLoading.value = true;
  try {
    const response = await matchStore.fetchMatchHistory({ mode: '1v1', limit: 50 });
    const matches = response?.matches || [];
    const selfId = authStore.user?.id;
    const targetId = target.userId;
    const relevantMatches = matches.filter((match) => {
      const participants = match?.participants || [];
      const hasSelf = participants.some((player) => player.userId === selfId);
      const hasTarget = participants.some((player) => player.userId === targetId);
      return hasSelf && hasTarget;
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let lastResult = 'Aucun';
    let lastDateLabel = 'Pas encore de duel';

    for (const match of relevantMatches) {
      const participants = match?.participants || [];
      const selfParticipant = participants.find((player) => player.userId === selfId);
      const targetParticipant = participants.find((player) => player.userId === targetId);
      if (!selfParticipant || !targetParticipant) continue;

      let outcome = 'draw';
      if (match.winnerId) {
        if (match.winnerId === selfId) {
          outcome = 'win';
        } else if (match.winnerId === targetId) {
          outcome = 'loss';
        }
      } else if (selfParticipant.rank === 1) {
        outcome = 'win';
      } else if (targetParticipant.rank === 1) {
        outcome = 'loss';
      }

      if (outcome === 'win') wins += 1;
      else if (outcome === 'loss') losses += 1;
      else draws += 1;
    }

    const lastMatch = relevantMatches[0];
    if (lastMatch) {
      const participants = lastMatch?.participants || [];
      const selfParticipant = participants.find((player) => player.userId === selfId);
      const targetParticipant = participants.find((player) => player.userId === targetId);
      if (selfParticipant && targetParticipant) {
        if (lastMatch.winnerId === selfId || selfParticipant.rank === 1) {
          lastResult = 'Victoire';
        } else if (lastMatch.winnerId === targetId || targetParticipant.rank === 1) {
          lastResult = 'Défaite';
        } else {
          lastResult = 'Nul';
        }
      }
      if (lastMatch.createdAt) {
        const date = new Date(lastMatch.createdAt);
        lastDateLabel = date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }

    confrontationStats.value = {
      matches: relevantMatches.length,
      wins,
      losses,
      draws,
      lastResult,
      lastDateLabel
    };
  } catch (error) {
    confrontationError.value = error?.message || 'Impossible de charger la confrontation.';
  } finally {
    confrontationLoading.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/auth');
};

const createRoom = async () => {
  if (!netStore.playerName) return;
  await netStore.createRoom();
};

const joinRoom = async () => {
  if (!roomInput.value || roomInput.value.length < 4 || !netStore.playerName) return;
  await netStore.joinRoom(roomInput.value.trim());
};

const updateRoomInput = (value) => {
  roomInput.value = value;
};

const leaveRoom = () => {
  netStore.leaveRoom();
  roomInput.value = '';
};

const kickPlayer = (playerId) => {
  netStore.kickPlayer(playerId);
};

const codeCopied = ref(false);

const copyCode = async () => {
  if (!netStore.roomId) return;
  
  try {
    await navigator.clipboard.writeText(netStore.roomId);
    codeCopied.value = true;
    setTimeout(() => {
      codeCopied.value = false;
    }, 2000);
  } catch (err) {
    // Fallback pour les navigateurs qui ne supportent pas clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = netStore.roomId;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      codeCopied.value = true;
      setTimeout(() => {
        codeCopied.value = false;
      }, 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
    document.body.removeChild(textArea);
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
    gameStore.players[key].userId = playerInfo.userId || null;
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

watch(
  () => authStore.user,
  (user) => {
    if (!user) {
      netStore.userId = null;
      return;
    }
    netStore.playerName = displayName.value;
    netStore.userId = user.id;
    netStore.restoreRoomSession();
  },
  { immediate: true }
);

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
  if (roomId) {
    showMultiplayer.value = true;
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
  width: min(85vw, 400px);
  height: clamp(180px, 35vh, 320px);
  filter: drop-shadow(0 18px 30px rgba(15, 23, 42, 0.45));
  opacity: 0.9;
}

@media (min-width: 768px) {
  .menu-hero-canvas {
    width: min(90vw, 600px);
    height: clamp(280px, 45vh, 480px);
  }
}

@media (min-width: 1024px) {
  .menu-hero-canvas {
    width: min(95vw, 800px);
    height: clamp(350px, 50vh, 550px);
  }
}

.menu-hero-canvas canvas {
  width: 100%;
  height: 100%;
  display: block;
}

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

@media (min-height: 750px) {
  .menu-content:not(.menu-content--multiplayer) {
    justify-content: center;
  }
}

.menu-content--multiplayer {
  justify-content: flex-start;
  padding-top: 30px;
  padding-bottom: 80px;
}

@media (max-width: 480px) {
  .menu-content {
    padding: 30px 16px;
    gap: 24px;
  }
}

@media (max-width: 360px) {
  .menu-content {
    padding: 24px 12px;
    gap: 20px;
  }
}

@media (min-width: 768px) {
  .menu-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 50px 32px;
    gap: 40px;
  }
}

@media (min-width: 1024px) {
  .menu-content {
    max-width: 1000px;
    padding: 60px 48px;
    gap: 48px;
  }
}

.difficulty-status {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.difficulty-status .status-badge {
  font-size: 11px;
}

.difficulty-hint {
  margin-top: 12px;
  text-align: center;
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
}

/* Difficulty modal */
.difficulty-modal-card {
  width: min(95vw, 600px);
  max-width: 600px;
  max-height: 90vh;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(15, 15, 20, 0.98), rgba(8, 8, 12, 0.98));
  border: 1px solid rgba(245, 158, 11, 0.3);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.difficulty-modal-header {
  text-align: center;
  padding: 24px 24px 16px;
  flex-shrink: 0;
}

.modal-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.modal-icon {
  color: #fbbf24;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.5));
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.modal-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #a1a1aa;
  letter-spacing: 0.05em;
}

.difficulty-content {
  padding: 16px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}

.difficulty-content::-webkit-scrollbar {
  width: 8px;
}

.difficulty-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.difficulty-content::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.3);
  border-radius: 4px;
}

.difficulty-content::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 158, 11, 0.5);
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.difficulty-option {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(30, 30, 40, 0.6), rgba(20, 20, 28, 0.6));
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.difficulty-option::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.difficulty-option:hover {
  transform: translateY(-2px) scale(1.02);
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
}

.difficulty-option:hover::before {
  opacity: 1;
}

.difficulty-selected {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.25));
  border-color: rgba(245, 158, 11, 0.8) !important;
  box-shadow: 0 0 30px rgba(245, 158, 11, 0.4), 0 6px 20px rgba(0, 0, 0, 0.3);
  transform: scale(1.03);
}

.difficulty-selected::before {
  opacity: 1;
}

.difficulty-locked {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
}

.difficulty-locked:hover {
  transform: none !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
}

.difficulty-locked::before {
  opacity: 0 !important;
}

.difficulty-lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 10;
  pointer-events: none;
}

.difficulty-option-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 10px;
  text-align: center;
}

.difficulty-stars {
  font-size: 18px;
  letter-spacing: 0.1em;
  filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.5));
}

.difficulty-name {
  font-size: 13px;
  font-weight: 700;
  color: #fef3c7;
  letter-spacing: 0.05em;
}

.difficulty-chip {
  font-weight: 600;
  font-size: 10px;
}

.difficulty-status {
  margin-top: 4px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  font-size: 9px;
  padding: 3px 6px;
}

.difficulty-check {
  position: absolute;
  top: 6px;
  right: 6px;
  animation: check-appear 0.3s ease-out;
}

@keyframes check-appear {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.auth-hint-banner {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  font-size: 12px;
}

.progression-hint-banner {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fef3c7;
  font-size: 12px;
}

.difficulty-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.difficulty-actions button {
  cursor: pointer;
  border: none;
  outline: none;
}

.difficulty-actions button:focus-visible {
  outline: 2px solid rgba(245, 158, 11, 0.5);
  outline-offset: 2px;
}

/* Level-specific accent colors */
.difficulty-level-1:hover {
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
}

.difficulty-level-2:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
}

.difficulty-level-3:hover {
  border-color: rgba(249, 115, 22, 0.5);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
}

.difficulty-level-4:hover {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
}

/* Tablet and larger */
@media (min-width: 600px) {
  .difficulty-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .difficulty-option-content {
    padding: 18px 12px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-subtitle {
    font-size: 14px;
  }

  .difficulty-stars {
    font-size: 20px;
  }

  .difficulty-name {
    font-size: 14px;
  }

  .difficulty-chip {
    font-size: 11px;
  }

  .start-bot-btn {
    min-width: 180px;
    flex: 0;
  }
}

/* Mobile optimization */
@media (max-width: 599px) {
  .difficulty-modal-card {
    width: 96vw;
    max-height: 85vh;
    border-radius: 20px;
  }

  .difficulty-modal-header {
    padding: 20px 16px 12px;
  }

  .modal-icon {
    font-size: 40px !important;
  }

  .modal-title {
    font-size: 18px;
  }

  .modal-subtitle {
    font-size: 12px;
  }

  .difficulty-content {
    padding: 12px 16px;
  }

  .difficulty-grid {
    gap: 10px;
  }

  .difficulty-option-content {
    padding: 14px 8px;
    gap: 5px;
  }

  .difficulty-stars {
    font-size: 16px;
  }

  .difficulty-name {
    font-size: 12px;
  }

  .difficulty-chip {
    font-size: 9px;
  }

  .status-badge {
    font-size: 8px;
    padding: 2px 5px;
  }

  .difficulty-check {
    top: 4px;
    right: 4px;
  }

  .difficulty-check .q-icon {
    font-size: 20px !important;
  }

  .difficulty-actions {
    flex-direction: column;
    gap: 10px;
  }

  .difficulty-actions button {
    width: 100%;
  }

  .auth-hint-banner {
    font-size: 11px;
  }
}

/* Very small screens */
@media (max-width: 380px) {
  .difficulty-modal-card {
    max-height: 80vh;
  }

  .difficulty-option-content {
    padding: 12px 6px;
  }

  .difficulty-name {
    font-size: 11px;
  }
}

</style>
