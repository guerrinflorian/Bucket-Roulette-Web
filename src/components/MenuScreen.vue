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

    <!-- User bar (top right) -->
    <div v-if="authStore.isAuthenticated" class="user-bar">
      <q-btn-dropdown
        class="user-dropdown"
        unelevated
        no-caps
        dropdown-icon="expand_more"
        content-class="user-dropdown-menu"
        menu-anchor="bottom right"
        menu-self="top right"
      >
        <template v-slot:label>
          <q-avatar size="34px" class="user-avatar">
            <Avatar
              :name="avatarSeed"
              variant="beam"
              :size="34"
              :colors="avatarColors"
            />
          </q-avatar>
          <div class="user-meta">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-subtitle">Mon compte</span>
          </div>
        </template>

        <div class="dropdown-panel">
          <div class="dropdown-header">
            <q-avatar size="58px" class="dropdown-avatar">
              <Avatar
                :name="avatarSeed"
                variant="beam"
                :size="58"
                :colors="avatarColors"
              />
            </q-avatar>
            <div class="dropdown-text">
              <div class="dropdown-name">{{ displayName }}</div>
              <div class="dropdown-email">
                {{ authStore.user?.email || 'Compte connecté' }}
              </div>
            </div>
          </div>

          <q-separator dark class="q-my-sm" />

          <q-list class="dropdown-actions">
            <q-item clickable v-close-popup @click="openProfileSelf">
              <q-item-section avatar>
                <q-icon name="insights" color="amber" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Voir mes statistiques</q-item-label>
                <q-item-label caption>Performances et progression</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="handleLogout">
              <q-item-section avatar>
                <q-icon name="logout" color="red-4" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Se déconnecter</q-item-label>
                <q-item-label caption>Quitter la session</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-btn-dropdown>
    </div>

    <div class="menu-utility-buttons">
      <q-btn
        class="utility-icon"
        round
        flat
        icon="help_outline"
        aria-label="Ouvrir l'aide"
        @click="goHelp"
      >
        <q-tooltip>Voir l'aide</q-tooltip>
      </q-btn>
      <q-btn
        class="utility-icon leaderboard-icon"
        round
        flat
        icon="leaderboard"
        aria-label="Ouvrir le classement"
        @click="openLeaderboard"
      >
        <q-tooltip>Classements</q-tooltip>
      </q-btn>
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
        <button v-if="!authStore.isAuthenticated" class="auth-cta" @click="goAuth">
          🔐 Se connecter
        </button>
      </header>

      <!-- Main menu buttons -->
      <div class="menu-buttons" v-if="!showMultiplayer">
        <button class="game-btn btn-solo" @click="openSoloModal">
          <div class="btn-glow"></div>
          <div class="btn-content">
            <span class="btn-icon">🤖</span>
            <div class="btn-text">
              <span class="btn-title">Solo vs IA</span>
              <span class="btn-subtitle">Entraînez-vous contre le bot</span>
            </div>
          </div>
        </button>

        <button class="game-btn btn-multi" @click="showMultiplayer = true">
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
          <div v-if="netStore.connecting || netStore.connected" class="connection-badge" :class="{ online: netStore.connected }">
            <span class="badge-dot"></span>
            <span class="badge-text">
              {{ netStore.connecting ? 'Connexion...' : 'En ligne' }}
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
          <div class="action-card create-card">
            <div class="action-card-icon">🎯</div>
            <div class="action-card-content">
              <h3 class="action-card-title">Créer une partie</h3>
              <p class="action-card-desc">Invitez vos amis avec un code</p>
            </div>
            <button class="action-card-btn create-btn" @click="createRoom" :disabled="netStore.connecting">
              {{ netStore.connecting ? '...' : 'Créer' }}
            </button>
          </div>

          <div class="separator">
            <span class="sep-line"></span>
            <span class="sep-text">ou</span>
            <span class="sep-line"></span>
          </div>

          <div class="action-card join-card">
            <div class="join-card-header">
              <div class="action-card-icon">🔗</div>
              <h3 class="action-card-title">Rejoindre une partie</h3>
            </div>
            <div class="join-input-row">
              <input
                v-model="roomInput"
                type="text"
                class="code-input"
                placeholder="CODE"
                maxlength="4"
                @input="roomInput = roomInput.toUpperCase()"
                @keyup.enter="joinRoom"
              />
              <button class="join-btn" @click="joinRoom" :disabled="!roomInput || netStore.connecting">
                Rejoindre
              </button>
            </div>
          </div>
        </div>

        <!-- In room - lobby -->
        <div v-else class="room-lobby">
          <div class="lobby-code-card">
            <div class="code-card-header">
              <span class="code-card-icon">🎮</span>
              <span class="code-card-label">Code de la partie</span>
            </div>
            <div class="code-display-wrapper" @click="copyCode">
              <div class="code-display" :class="{ copied: codeCopied }">
                <span class="code-char" v-for="(char, i) in netStore.roomId.split('')" :key="i">{{ char }}</span>
              </div>
              <div class="code-copy-btn" :class="{ copied: codeCopied }">
                {{ codeCopied ? '✓' : '📋' }}
              </div>
            </div>
            <span class="code-hint">{{ codeCopied ? '✅ Copié dans le presse-papier !' : '💡 Cliquez pour copier et partager' }}</span>
          </div>

          <div class="players-list">
            <div class="players-list-header">
              <span class="list-title">👥 Joueurs</span>
              <span class="list-count">{{ lobbySlots.filter(s => !s.isEmpty).length }}/3</span>
            </div>
            <div
              v-for="(slot, index) in lobbySlots"
              :key="slot.id || `slot-${index}`"
              class="player-row"
              :class="{ 'is-you': slot.isSelf, waiting: slot.isEmpty }"
            >
              <div class="player-avatar-slot" :class="{ empty: slot.isEmpty }">
                <span v-if="slot.isHost" class="crown-badge">👑</span>
                <span class="avatar-placeholder">{{ slot.isEmpty ? '?' : slot.name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="player-details">
                <span class="player-row-name">
                  {{ slot.isEmpty ? 'Slot vide' : slot.name }}
                  <span v-if="slot.isSelf" class="you-tag">vous</span>
                </span>
                <span class="player-role">{{ slot.isHost ? 'Hôte' : slot.isEmpty ? 'En attente...' : 'Joueur' }}</span>
              </div>
              <div class="player-status-indicator" :class="{ ready: !slot.isEmpty, waiting: slot.isEmpty }">
                <span class="status-dot"></span>
              </div>
              <button
                v-if="!slot.isEmpty"
                class="player-profile-btn"
                type="button"
                @click="openProfileFromSlot(slot)"
                title="Voir le profil"
              >
                <q-icon name="insights" size="18px" />
              </button>
              <button
                v-if="netStore.isHost && slot.id && !slot.isSelf"
                class="kick-btn"
                @click="kickPlayer(slot.id)"
                title="Éjecter ce joueur"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="lobby-actions">
            <button 
              v-if="netStore.isHost && canStartMatch"
              class="start-game-btn"
              @click="startMultiplayer"
            >
              <span class="btn-glow"></span>
              <span class="start-icon">⚔️</span>
              <span>Lancer la partie</span>
            </button>

            <div v-else class="waiting-message">
              <div class="waiting-animation">
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
              </div>
              <span v-if="netStore.isHost && missingPlayerCount > 0">
                En attente de {{ missingPlayerCount }} joueur{{ missingPlayerCount > 1 ? 's' : '' }}...
              </span>
              <span v-else-if="netStore.isHost">
                Prêt ! Lancez à 2 ou attendez un 3e joueur.
              </span>
              <span v-else>
                L'hôte va bientôt lancer la partie...
              </span>
            </div>

            <button class="leave-room-btn" @click="leaveRoom">
              <span>🚪</span>
              <span>Quitter</span>
            </button>
          </div>
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
              <div class="difficulty-status" v-if="authStore.isAuthenticated">
                <q-badge
                  v-if="soloProgressStatus(level).label"
                  :color="soloProgressStatus(level).color"
                  class="status-badge"
                  rounded
                >
                  <q-icon :name="soloProgressStatus(level).icon" size="14px" class="q-mr-xs" />
                  {{ soloProgressStatus(level).label }}
                </q-badge>
              </div>
            </button>
          </div>
          <div v-if="!authStore.isAuthenticated" class="difficulty-hint">
            Connectez-vous pour suivre votre progression contre les bots.
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

    <ProfileStatsModal
      v-model="showProfileModal"
      :profile="selectedProfile"
      :stats="profileStats"
      :loading="profileLoading"
      :error="profileError"
      :solo-progress="soloProgress"
      :bot-levels="botLevels"
    />

    <LeaderboardModal
      v-model="showLeaderboardModal"
      :leaderboards="leaderboards"
      :loading="leaderboardLoading"
      :error="leaderboardError"
      :highlight-id="leaderboardUserId"
    />
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
import Avatar from 'vue-boring-avatars';
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
const botDifficulty = ref(gameStore.botDifficulty ?? 1);
const menuModelRef = ref(null);
const soloProgress = ref([]);
const profileLoading = ref(false);
const profileError = ref('');
const profileStats = ref(null);
const showLeaderboardModal = ref(false);
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


const selectBotDifficulty = (levelId) => {
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
  if (entry.is_defeated) {
    return { label: 'Défaite', color: 'negative', icon: 'close' };
  }
  return { label: 'Bot battu', color: 'positive', icon: 'check' };
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

/* User bar */
.user-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #fef3c7;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-subtitle {
  font-size: 11px;
  color: rgba(226, 232, 240, 0.7);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-avatar {
  border: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.35);
}

.user-dropdown :deep(.q-btn) {
  padding: 6px 10px 6px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(30, 20, 10, 0.92) 0%, rgba(15, 10, 5, 0.98) 100%);
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  color: #fef3c7;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-dropdown :deep(.q-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
}

.user-dropdown :deep(.q-btn__content) {
  gap: 10px;
  align-items: center;
}

.user-dropdown :deep(.q-btn__dropdown-icon) {
  font-size: 20px;
  color: rgba(251, 191, 36, 0.85);
}

:deep(.user-dropdown-menu) {
  min-width: 280px;
  background: rgba(13, 16, 24, 0.98);
  border: 1px solid rgba(251, 191, 36, 0.18);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
}

.dropdown-panel {
  padding: 14px 16px 10px;
  color: #e2e8f0;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-avatar {
  border: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.3);
}

.dropdown-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-name {
  font-size: 16px;
  font-weight: 800;
  color: #fff7ed;
}

.dropdown-email {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.dropdown-actions :deep(.q-item) {
  border-radius: 12px;
  margin: 4px 0;
  color: inherit;
  transition: background 0.2s ease, transform 0.2s ease;
}

.dropdown-actions :deep(.q-item:hover) {
  background: rgba(251, 191, 36, 0.12);
  transform: translateX(2px);
}

.dropdown-actions :deep(.q-item__label--caption) {
  color: rgba(226, 232, 240, 0.6);
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

.menu-utility-buttons {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.utility-icon {
  color: #fef3c7;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.utility-icon:hover {
  border-color: rgba(251, 191, 36, 0.8);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.3);
}

.leaderboard-icon {
  border-color: rgba(59, 130, 246, 0.4);
}

.leaderboard-icon:hover {
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);
}

@media (max-width: 480px) {
  .user-bar {
    top: 10px;
    right: 10px;
  }

  .menu-utility-buttons {
    top: 10px;
    left: 10px;
  }

  .user-name {
    font-size: 12px;
    max-width: 80px;
  }

  .user-subtitle {
    font-size: 10px;
  }
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

.auth-cta {
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(15, 10, 5, 0.6);
  color: #fef3c7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-cta:hover {
  transform: translateY(-1px);
  border-color: #f59e0b;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
}

/* Player section */
.player-section {
  width: 100%;
  max-width: 340px;
}

@media (min-width: 768px) {
  .player-section {
    max-width: 420px;
  }
}

@media (min-width: 1024px) {
  .player-section {
    max-width: 480px;
  }
}

.player-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

@media (min-width: 400px) {
  .player-card {
    gap: 16px;
    padding: 16px 20px;
  }
}

.player-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid rgba(245, 158, 11, 0.4);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

@media (min-width: 400px) {
  .player-avatar {
    width: 48px;
    height: 48px;
  }
}

.player-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-size: 18px;
  font-weight: 700;
  color: #fef3c7;
}

.name-input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fef3c7;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
}

@media (min-width: 400px) {
  .name-input {
    padding: 10px 14px;
    font-size: 16px;
  }
}

.name-input::placeholder {
  color: #52525b;
}

.name-input:focus {
  border-color: #f59e0b;
}

.save-name-btn,
.edit-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: #0a0a0f;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

@media (min-width: 400px) {
  .save-name-btn,
  .edit-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 16px;
  }
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

@media (min-width: 768px) {
  .menu-buttons {
    flex-direction: row;
    max-width: 700px;
    gap: 20px;
  }
  
  .menu-buttons .game-btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .menu-buttons {
    max-width: 800px;
    gap: 24px;
  }
}

.game-btn {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 16px;
  border: 2px solid;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
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
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-title {
  font-size: 18px;
  font-weight: 700;
  color: #fcd34d;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.btn-subtitle {
  font-size: 12px;
  color: #a8a29e;
  margin-top: 2px;
}

.btn-solo,
.btn-multi,
.btn-help {
  background: linear-gradient(145deg, rgba(30, 20, 10, 0.9) 0%, rgba(15, 10, 5, 0.95) 100%);
  border-color: rgba(180, 120, 60, 0.4);
  box-shadow: 
    inset 0 1px 0 rgba(255, 200, 100, 0.08),
    0 4px 20px rgba(0, 0, 0, 0.4);
}

.btn-solo .btn-glow,
.btn-multi .btn-glow,
.btn-help .btn-glow {
  background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.12) 0%, transparent 70%);
}

.btn-solo:hover:not(:disabled),
.btn-multi:hover:not(:disabled),
.btn-help:hover:not(:disabled) {
  border-color: rgba(245, 158, 11, 0.6);
  transform: translateY(-3px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 200, 100, 0.12),
    0 12px 40px rgba(180, 120, 40, 0.25),
    0 0 30px rgba(245, 158, 11, 0.15);
}

.btn-solo:active:not(:disabled),
.btn-multi:active:not(:disabled),
.btn-help:active:not(:disabled) {
  transform: translateY(-1px);
}

/* Multiplayer panel */
.multiplayer-panel {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .multiplayer-panel {
    max-width: 520px;
  }
}

@media (min-width: 1024px) {
  .multiplayer-panel {
    max-width: 600px;
  }
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
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(180, 83, 9, 0.03) 100%);
}

.action-card-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%);
  border-radius: 14px;
  flex-shrink: 0;
}

.action-card-content {
  flex: 1;
  min-width: 0;
}

.action-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #fef3c7;
  margin: 0 0 4px 0;
}

.action-card-desc {
  font-size: 12px;
  color: #71717a;
  margin: 0;
}

.action-card-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex-shrink: 0;
}

.create-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(34, 197, 94, 0.4);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.separator {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}

.sep-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.sep-text {
  font-size: 11px;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.join-card {
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
}

.join-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.join-card-header .action-card-icon {
  width: 44px;
  height: 44px;
  font-size: 24px;
}

.join-card-header .action-card-title {
  margin: 0;
}

.join-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #f59e0b;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.35em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: all 0.2s;
  min-width: 0;
}

.code-input::placeholder {
  color: #52525b;
  letter-spacing: 0.2em;
  font-weight: 700;
}

.code-input:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);
}

.join-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #0a0a0f;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
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

.lobby-code-card {
  text-align: center;
  padding: 24px;
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(30, 20, 10, 0.95) 100%);
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.lobby-code-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
}

.code-card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.code-card-icon {
  font-size: 20px;
}

.code-card-label {
  font-size: 12px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
}

.code-display-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s;
}

.code-display-wrapper:hover {
  background: rgba(245, 158, 11, 0.1);
}

.code-display {
  display: flex;
  gap: 8px;
}

.code-char {
  font-size: 36px;
  font-weight: 900;
  color: #f59e0b;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  min-width: 48px;
  text-align: center;
  transition: all 0.2s;
}

.code-display.copied .code-char {
  color: #22c55e;
  text-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
  border-color: rgba(34, 197, 94, 0.3);
}

.code-copy-btn {
  font-size: 24px;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 8px;
}

.code-display-wrapper:hover .code-copy-btn {
  opacity: 1;
  transform: scale(1.1);
}

.code-copy-btn.copied {
  color: #22c55e;
  opacity: 1;
}

.code-hint {
  display: block;
  font-size: 12px;
  color: #71717a;
  margin-top: 12px;
}

/* Players list */
.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.players-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.list-title {
  font-size: 13px;
  font-weight: 700;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.list-count {
  font-size: 12px;
  font-weight: 700;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 4px 10px;
  border-radius: 20px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.2s;
}

.player-row.is-you {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%);
  border-color: rgba(245, 158, 11, 0.25);
}

.player-row.waiting {
  opacity: 0.6;
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.1);
}

.player-avatar-slot {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(245, 158, 11, 0.3);
}

.player-avatar-slot.empty {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  border-style: dashed;
}

.avatar-placeholder {
  font-size: 18px;
  font-weight: 800;
  color: #f59e0b;
}

.player-avatar-slot.empty .avatar-placeholder {
  color: #52525b;
  font-size: 16px;
}

.crown-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 14px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.player-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.player-row-name {
  font-size: 14px;
  font-weight: 700;
  color: #fafafa;
  display: flex;
  align-items: center;
  gap: 6px;
}

.you-tag {
  font-size: 10px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.player-role {
  font-size: 11px;
  color: #71717a;
}

.player-status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.player-status-indicator .status-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #52525b;
}

.player-status-indicator.ready .status-dot {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
  animation: pulse-green 2s infinite;
}

.player-status-indicator.waiting .status-dot {
  background: #71717a;
  animation: pulse-gray 2s infinite;
}

.player-profile-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.player-profile-btn:hover {
  background: rgba(148, 163, 184, 0.2);
  color: #fbbf24;
  transform: translateY(-1px);
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

@keyframes pulse-gray {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.3; }
}

.kick-btn {
  background: rgba(239, 68, 68, 0.15);
  border: none;
  color: #f87171;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kick-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fecaca;
}

/* Lobby actions */
.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

/* Start game button */
.start-game-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 40px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
}

.start-game-btn .btn-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.start-game-btn:hover .btn-glow {
  opacity: 1;
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
  gap: 12px;
  color: #a1a1aa;
  font-size: 13px;
  text-align: center;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.waiting-animation {
  display: flex;
  gap: 4px;
}

.waiting-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: bounce-dot 1.4s ease-in-out infinite;
}

.waiting-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.waiting-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce-dot {
  0%, 80%, 100% { 
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1.2);
    opacity: 1;
  }
}

.leave-room-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 600;
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

  .auth-cta {
    padding: 8px 14px;
    font-size: 11px;
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

  .action-card {
    padding: 16px;
    gap: 12px;
  }

  .action-card-icon {
    width: 48px;
    height: 48px;
    font-size: 26px;
  }

  .action-card-title {
    font-size: 14px;
  }

  .action-card-desc {
    font-size: 11px;
  }

  .action-card-btn {
    padding: 10px 18px;
    font-size: 13px;
  }

  .join-card-header .action-card-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .join-input-row {
    gap: 8px;
  }

  .code-input {
    font-size: 18px;
    padding: 12px 14px;
    letter-spacing: 0.3em;
  }

  .join-btn {
    padding: 12px 16px;
    font-size: 13px;
  }

  .code-char {
    font-size: 28px;
    padding: 6px 10px;
    min-width: 40px;
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
    max-width: 800px;
    margin: 0 auto;
    padding: 50px 32px;
    gap: 40px;
  }
  
  .title-main {
    font-size: 52px;
  }
  
  .title-sub {
    font-size: 24px;
  }
  
  .revolver-icon {
    width: 100px;
    height: 100px;
  }
  
  .tagline {
    font-size: 15px;
  }
  
  .btn-content {
    padding: 24px 32px;
  }
  
  .btn-icon {
    font-size: 42px;
  }
  
  .btn-title {
    font-size: 20px;
  }
  
  .btn-subtitle {
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .menu-content {
    max-width: 1000px;
    padding: 60px 48px;
    gap: 48px;
  }
  
  .title-main {
    font-size: 60px;
  }
  
  .title-sub {
    font-size: 28px;
  }
  
  .revolver-icon {
    width: 120px;
    height: 120px;
  }
  
  .btn-content {
    padding: 28px 36px;
  }
  
  .btn-icon {
    font-size: 48px;
  }
  
  .btn-title {
    font-size: 22px;
  }
}
</style>
