<template>
  <q-page class="menu-page">
    <!-- Animated background -->
    <div class="bg-effects">
      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>
      <div class="bg-particles"></div>
    </div>

    <!-- Main content -->
    <div class="menu-content">
      <!-- Logo/Title -->
      <header class="menu-header">
        <div class="logo-icon">🎰</div>
        <h1 class="game-title">
          <span class="title-bucket">BUCKET</span>
          <span class="title-roulette">ROULETTE</span>
        </h1>
        <p class="tagline">Tentez votre chance... si vous l'osez</p>
      </header>

      <!-- Main menu buttons -->
      <div class="menu-buttons" v-if="!showMultiplayer">
        <button class="menu-btn btn-primary" @click="startBot">
          <span class="btn-icon">🤖</span>
          <span class="btn-text">
            <span class="btn-title">Jouer vs Bot</span>
            <span class="btn-desc">Affrontez l'IA</span>
          </span>
        </button>

        <button class="menu-btn btn-secondary" @click="showMultiplayer = true">
          <span class="btn-icon">👥</span>
          <span class="btn-text">
            <span class="btn-title">Multijoueur</span>
            <span class="btn-desc">Jouez avec un ami</span>
          </span>
        </button>
      </div>

      <!-- Multiplayer panel -->
      <div class="multiplayer-panel" v-if="showMultiplayer">
        <button class="back-btn" @click="goBack">
          <span>←</span> Retour
        </button>

        <h2 class="panel-title">Multijoueur</h2>

        <!-- Player name input -->
        <div v-if="!netStore.playerName" class="name-input-section">
          <label class="name-label">Entrez votre nom</label>
          <input
            v-model="playerNameInput"
            type="text"
            class="name-input"
            placeholder="Votre nom"
            maxlength="12"
            @keyup.enter="setPlayerName"
          />
          <button class="name-btn" @click="setPlayerName" :disabled="!playerNameInput.trim()">
            Valider
          </button>
        </div>

        <!-- Connection status -->
        <div v-if="netStore.playerName" class="connection-status" :class="{ connected: netStore.connected }">
          <span class="status-dot"></span>
          <span class="status-text">
            {{ netStore.connecting ? 'Connexion...' : netStore.connected ? 'Connecté' : 'Déconnecté' }}
          </span>
        </div>

        <!-- Error message -->
        <div v-if="netStore.error" class="error-message">
          {{ netStore.error }}
          <button class="dismiss-btn" @click="netStore.clearError">✕</button>
        </div>

        <!-- Not in room yet -->
        <div v-if="netStore.playerName && !netStore.roomId" class="room-actions">
          <button class="action-btn create-btn" @click="createRoom" :disabled="netStore.connecting">
            <span class="action-icon">🏠</span>
            <span class="action-text">Créer une partie</span>
          </button>

          <div class="divider">
            <span>ou</span>
          </div>

          <div class="join-form">
            <input
              v-model="roomInput"
              type="text"
              class="room-input"
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

        <!-- In room - waiting for opponent -->
        <div v-else class="room-lobby">
          <div class="room-code-display">
            <span class="code-label">Code de la partie</span>
            <div class="code-value" @click="copyCode">
              <span>{{ netStore.roomId }}</span>
              <span class="copy-hint">📋 Cliquer pour copier</span>
            </div>
          </div>

          <div class="lobby-status">
            <div class="player-slot you">
              <span class="slot-icon">{{ netStore.isHost ? '👑' : '👤' }}</span>
              <span class="slot-label">{{ netStore.playerName }}{{ netStore.isHost ? ' (Hôte)' : '' }}</span>
              <span class="slot-status ready">Prêt</span>
            </div>

            <div class="player-slot opponent" :class="{ waiting: !netStore.opponentConnected }">
              <span class="slot-icon">{{ netStore.opponentConnected ? '👤' : '⏳' }}</span>
              <span class="slot-label">{{ netStore.opponentName || 'En attente...' }}</span>
              <span class="slot-status" :class="netStore.opponentConnected ? 'ready' : ''">
                {{ netStore.opponentConnected ? 'Prêt' : 'En attente' }}
              </span>
            </div>
          </div>

          <button 
            v-if="netStore.isHost && netStore.roomReady"
            class="start-btn"
            @click="startMultiplayer"
          >
            🎮 Lancer la partie
          </button>

          <p v-else-if="netStore.isHost" class="waiting-text">
            En attente d'un adversaire...
          </p>
          <p v-else class="waiting-text">
            En attente que l'hôte lance la partie...
          </p>

          <button class="leave-btn" @click="leaveRoom">
            Quitter la room
          </button>
        </div>
      </div>

      <!-- Footer -->
      <footer class="menu-footer">
        <p>Un jeu de chance et de stratégie</p>
      </footer>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();

const showMultiplayer = ref(false);
const roomInput = ref('');
const playerNameInput = ref('');

const startBot = () => {
  gameStore.initGame('bot');
  router.push('/game');
};

const goBack = () => {
  showMultiplayer.value = false;
  playerNameInput.value = '';
  netStore.playerName = null;
  netStore.leaveRoom();
};

const setPlayerName = () => {
  const name = playerNameInput.value.trim();
  if (!name) return;
  netStore.playerName = name;
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

const copyCode = () => {
  if (netStore.roomId) {
    navigator.clipboard.writeText(netStore.roomId);
  }
};

const startMultiplayer = async () => {
  console.log('🎮 Host starting game...');
  gameStore.initGame('online');
  
  // Set player names based on host/guest
  gameStore.players.player.name = netStore.playerName;
  gameStore.players.enemy.name = netStore.opponentName || 'Adversaire';
  
  // Host decides who starts (sync to both players)
  const starts = Math.random() > 0.5 ? 'player' : 'enemy';
  gameStore.setCoinFlipResult(starts);

  // Wait a bit to ensure guest is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Serialize and send initial state to all players
  const state = {
    phase: gameStore.phase,
    currentTurn: gameStore.currentTurn,
    barrel: gameStore.barrel,
    players: gameStore.players,
    lastResult: gameStore.lastResult,
    lastAction: gameStore.lastAction,
    winner: gameStore.winner,
    reloadCount: gameStore.reloadCount,
    hostName: netStore.playerName,
    guestName: netStore.opponentName,
    onlineFlipResult: starts
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
      gameStore.initGame('online');
      
      // Set player names for guest (inverted)
      gameStore.players.player.name = netStore.playerName;
      gameStore.players.enemy.name = netStore.opponentName || 'Adversaire';
      
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

onUnmounted(() => {
  console.log('👋 MenuScreen unmounted, removing listeners');
  netStore.offGameState();
});
</script>

<style scoped>
.menu-page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0908 0%, #1c1917 50%, #0f0d0c 100%);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Background effects */
.bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
}

.glow-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #dc2626 0%, transparent 70%);
  top: -200px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.glow-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #f59e0b 0%, transparent 70%);
  bottom: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 20px); }
}

/* Menu content */
.menu-content {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  gap: 28px;
}

/* Header */
.menu-header {
  text-align: center;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.game-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
}

.title-bucket {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #fef3c7;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
}

.title-roulette {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #dc2626;
  text-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
}

.tagline {
  margin-top: 6px;
  font-size: 11px;
  color: #a8a29e;
  letter-spacing: 0.06em;
}

/* Menu buttons */
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.btn-primary {
  background: linear-gradient(145deg, rgba(220, 38, 38, 0.2), rgba(153, 27, 27, 0.3));
  border-color: rgba(220, 38, 38, 0.5);
}

.btn-primary:hover {
  background: linear-gradient(145deg, rgba(220, 38, 38, 0.3), rgba(153, 27, 27, 0.4));
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(220, 38, 38, 0.3);
}

.btn-secondary {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.2));
  border-color: rgba(245, 158, 11, 0.4);
}

.btn-secondary:hover {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.3));
  border-color: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
}

.btn-icon {
  font-size: 32px;
}

.btn-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-title {
  font-size: 18px;
  font-weight: 700;
  color: #fef3c7;
}

.btn-desc {
  font-size: 12px;
  color: #a8a29e;
}

/* Multiplayer panel */
.multiplayer-panel {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: #a8a29e;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #fef3c7;
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
  color: #fef3c7;
  text-align: center;
  margin: 0;
}

/* Name input section */
.name-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-label {
  font-size: 14px;
  font-weight: 600;
  color: #e7e5e4;
  text-align: center;
}

.name-input {
  padding: 14px 20px;
  border-radius: 12px;
  border: 2px solid #3d352d;
  background: rgba(0, 0, 0, 0.3);
  color: #fef3c7;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.name-input::placeholder {
  color: #57534e;
}

.name-input:focus {
  border-color: #f59e0b;
}

.name-btn {
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(145deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #1c1917;
  cursor: pointer;
  transition: all 0.2s;
}

.name-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.name-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Connection status */
.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-status.connected .status-dot {
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
}

.status-text {
  color: #a8a29e;
}

/* Error message */
.error-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 14px;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  padding: 4px;
}

/* Room actions */
.room-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn {
  background: linear-gradient(145deg, #22c55e, #16a34a);
  border: none;
  color: white;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #57534e;
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #57534e, transparent);
}

.join-form {
  display: flex;
  gap: 12px;
}

.room-input {
  flex: 1;
  padding: 16px 20px;
  border-radius: 12px;
  border: 2px solid #3d352d;
  background: rgba(0, 0, 0, 0.3);
  color: #fef3c7;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s;
}

.room-input::placeholder {
  color: #57534e;
  letter-spacing: 0.2em;
}

.room-input:focus {
  border-color: #f59e0b;
}

.join-btn {
  background: linear-gradient(145deg, #f59e0b, #d97706);
  border: none;
  color: #1c1917;
  padding: 16px 24px;
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
  gap: 16px;
}

.room-code-display {
  text-align: center;
  padding: 16px 20px;
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(180, 83, 9, 0.15));
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
}

.code-label {
  display: block;
  font-size: 12px;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.code-value {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.code-value:hover {
  transform: scale(1.02);
}

.code-value span:first-child {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 0.25em;
  color: #f59e0b;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.5);
}

.copy-hint {
  font-size: 11px !important;
  color: #78716c !important;
  letter-spacing: 0.05em !important;
}

/* Lobby status */
.lobby-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.player-slot.waiting {
  opacity: 0.5;
  border-style: dashed;
}

.slot-icon {
  font-size: 24px;
}

.slot-label {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #e7e5e4;
}

.slot-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #78716c;
}

.slot-status.ready {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

/* Start button */
.start-btn {
  padding: 18px 32px;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(145deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(34, 197, 94, 0.4);
}

.waiting-text {
  text-align: center;
  color: #78716c;
  font-size: 14px;
  animation: pulse-opacity 2s ease-in-out infinite;
}

@keyframes pulse-opacity {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.leave-btn {
  padding: 12px 20px;
  font-size: 14px;
  background: transparent;
  border: 1px solid #57534e;
  border-radius: 8px;
  color: #a8a29e;
  cursor: pointer;
  transition: all 0.2s;
}

.leave-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Footer */
.menu-footer {
  margin-top: auto;
  padding-top: 16px;
  flex-shrink: 0;
}

.menu-footer p {
  font-size: 10px;
  color: #57534e;
  letter-spacing: 0.04em;
  margin: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .menu-content {
    padding: 20px 16px;
    gap: 20px;
  }
  
  .logo-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }
  
  .title-bucket {
    font-size: 26px;
    letter-spacing: 0.1em;
  }
  
  .title-roulette {
    font-size: 18px;
    letter-spacing: 0.12em;
  }
  
  .tagline {
    font-size: 10px;
    margin-top: 4px;
  }
  
  .menu-btn {
    padding: 14px 18px;
    gap: 12px;
  }
  
  .btn-icon {
    font-size: 26px;
  }
  
  .btn-title {
    font-size: 15px;
  }
  
  .btn-desc {
    font-size: 11px;
  }
  
  .panel-title {
    font-size: 20px;
  }
  
  .multiplayer-panel {
    gap: 12px;
  }
  
  .name-input,
  .name-btn {
    padding: 12px 18px;
    font-size: 15px;
  }
  
  .room-code-display {
    padding: 12px 16px;
  }
  
  .code-value span:first-child {
    font-size: 30px;
    letter-spacing: 0.2em;
  }
  
  .room-actions,
  .room-lobby {
    gap: 12px;
  }
  
  .action-btn,
  .start-btn {
    padding: 12px 18px;
    font-size: 14px;
  }
  
  .room-input {
    padding: 12px 16px;
    font-size: 17px;
  }
  
  .menu-footer {
    padding-top: 12px;
  }
}

@media (max-width: 380px) {
  .menu-content {
    padding: 16px 12px;
    gap: 16px;
  }
  
  .logo-icon {
    font-size: 32px;
  }
  
  .title-bucket {
    font-size: 22px;
  }
  
  .title-roulette {
    font-size: 16px;
  }
  
  .code-value span:first-child {
    font-size: 26px;
  }
  
  .multiplayer-panel {
    gap: 10px;
  }
}
</style>
