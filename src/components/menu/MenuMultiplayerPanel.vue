<template>
  <div class="multiplayer-panel">
    <button class="back-btn" @click="emit('back')">
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

    <div v-if="netStore.error" class="error-banner">
      <span class="error-icon">⚠️</span>
      <span class="error-msg">{{ netStore.error }}</span>
      <button class="error-close" @click="netStore.clearError">✕</button>
    </div>

    <div v-if="!netStore.roomId && !hideRoomLobby" class="room-actions">
      <div class="action-card quickplay-card">
        <div class="action-card-icon">⚡</div>
        <div class="action-card-content">
          <h3 class="action-card-title">Partie rapide 1v1</h3>
          <p class="action-card-desc">
            {{
              quickplayCountdown > 0
                ? 'Match trouvé, lancement imminent...'
                : quickplaySearching
                  ? 'Recherche en cours...'
                  : 'Trouvez un adversaire immédiatement'
            }}
          </p>
        </div>
        <button
          v-if="!quickplaySearching && quickplayCountdown === 0"
          class="action-card-btn quickplay-btn"
          @click="emit('quickplay')"
          :disabled="netStore.connecting"
        >
          {{ netStore.connecting ? '...' : 'Lancer' }}
        </button>
        <button
          v-else
          class="action-card-btn quickplay-cancel-btn"
          @click="emit('quickplay-cancel')"
        >
          Annuler
        </button>
      </div>

      <div v-if="quickplaySearching || quickplayCountdown > 0" class="quickplay-status">
        <div class="status-row">
          <span class="status-dot"></span>
          {{ quickplayCountdown > 0 ? 'Match trouvé' : "Recherche d'un adversaire disponible..." }}
        </div>
        <div v-if="quickplayOpponent" class="status-match">
          Adversaire trouvé : <strong>{{ quickplayOpponent }}</strong>
        </div>
        <div v-if="quickplayCountdown > 0" class="status-countdown">
          Démarrage dans {{ quickplayCountdown }}s...
        </div>
      </div>

      <div class="action-card quickplay-card ranked-card">
        <div class="action-card-icon">🏆</div>
        <div class="action-card-content">
          <h3 class="action-card-title">Match Ranked 1v1</h3>
          <p class="action-card-desc">
            {{
              rankedCountdown > 0
                ? 'Match classé trouvé, lancement imminent...'
                : rankedSearching
                  ? 'Recherche d’un adversaire classé...'
                  : 'Affrontez un adversaire de votre niveau'
            }}
          </p>
        </div>
        <button
          v-if="!rankedSearching && rankedCountdown === 0"
          class="action-card-btn quickplay-btn"
          @click="emit('ranked')"
          :disabled="netStore.connecting"
        >
          {{ netStore.connecting ? '...' : 'Lancer' }}
        </button>
        <button
          v-else
          class="action-card-btn quickplay-cancel-btn"
          @click="emit('ranked-cancel')"
        >
          Annuler
        </button>
      </div>

      <div v-if="rankedSearching || rankedCountdown > 0" class="quickplay-status ranked-status">
        <div class="status-row">
          <span class="status-dot"></span>
          {{ rankedCountdown > 0 ? 'Match classé trouvé' : "Recherche d'un adversaire classé..." }}
        </div>
        <div v-if="rankedOpponent" class="status-match">
          Adversaire classé : <strong>{{ rankedOpponent }}</strong>
        </div>
        <div v-if="rankedQueueStatus" class="status-queue">
          <span>Position {{ rankedQueueStatus.position }}</span>
          <span class="status-divider">•</span>
          <span>Plage Elo ±{{ rankedQueueStatus.range }}</span>
        </div>
        <div v-if="rankedCountdown > 0" class="status-countdown">
          Démarrage dans {{ rankedCountdown }}s...
        </div>
      </div>

      <div class="action-card create-card">
        <div class="action-card-icon">🎯</div>
        <div class="action-card-content">
          <h3 class="action-card-title">Créer une partie</h3>
          <p class="action-card-desc">Invitez vos amis avec un code</p>
        </div>
        <button class="action-card-btn create-btn" @click="emit('create-room')" :disabled="netStore.connecting">
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
            :value="roomInput"
            type="text"
            class="code-input"
            placeholder="CODE"
            maxlength="4"
            @input="onRoomInput"
            @keyup.enter="emit('join-room')"
          />
          <button class="join-btn" @click="emit('join-room')" :disabled="!roomInput || netStore.connecting">
            Rejoindre
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="hideRoomLobby" class="ranked-found-panel">
      <div class="ranked-found-icon">🏆</div>
      <div class="ranked-found-title">Match classé trouvé</div>
      <div class="ranked-found-subtitle">Lancement imminent...</div>
    </div>

    <div v-else class="room-lobby">
      <div class="lobby-code-card">
        <div class="code-card-header">
          <span class="code-card-icon">🎮</span>
          <span class="code-card-label">Code de la partie</span>
        </div>
        <div class="code-display-wrapper" @click="emit('copy-code')">
          <div class="code-display" :class="{ copied: codeCopied }">
            <span class="code-char" v-for="(char, i) in netStore.roomId.split('')" :key="i">{{ char }}</span>
          </div>
          <div class="code-copy-btn" :class="{ copied: codeCopied }">
            {{ codeCopied ? '✓' : '📋' }}
          </div>
        </div>
        <span class="code-hint">{{ codeCopied ? '✅ Copié dans le presse-papier !' : '💡 Cliquez pour copier et partager' }}</span>
      </div>

      <div class="lobby-body">
        <div class="lobby-panel players-panel">
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
                @click="emit('open-profile', slot)"
                title="Voir le profil"
              >
                <q-icon name="insights" size="18px" />
              </button>
              <button
                v-if="netStore.isHost && slot.id && !slot.isSelf"
                class="kick-btn"
                @click="emit('kick-player', slot.id)"
                title="Éjecter ce joueur"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <LobbyChatPanel />
      </div>

      <div class="lobby-actions">
        <button
          v-if="netStore.isHost && canStartMatch"
          class="start-game-btn"
          @click="emit('start-game')"
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

        <button class="leave-room-btn" @click="emit('leave-room')">
          <span>🚪</span>
          <span>Quitter</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import LobbyChatPanel from '../LobbyChatPanel.vue';

defineProps({
  netStore: {
    type: Object,
    required: true
  },
  lobbySlots: {
    type: Array,
    required: true
  },
  roomInput: {
    type: String,
    default: ''
  },
  codeCopied: {
    type: Boolean,
    default: false
  },
  canStartMatch: {
    type: Boolean,
    default: false
  },
  missingPlayerCount: {
    type: Number,
    default: 0
  },
  quickplaySearching: {
    type: Boolean,
    default: false
  },
  quickplayOpponent: {
    type: String,
    default: ''
  },
  quickplayCountdown: {
    type: Number,
    default: 0
  },
  rankedSearching: {
    type: Boolean,
    default: false
  },
  rankedOpponent: {
    type: String,
    default: ''
  },
  rankedCountdown: {
    type: Number,
    default: 0
  },
  rankedQueueStatus: {
    type: Object,
    default: null
  },
  hideRoomLobby: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'back',
  'create-room',
  'join-room',
  'update:roomInput',
  'copy-code',
  'kick-player',
  'open-profile',
  'start-game',
  'leave-room',
  'quickplay',
  'quickplay-cancel',
  'ranked',
  'ranked-cancel'
]);

const onRoomInput = (event) => {
  emit('update:roomInput', event.target.value.toUpperCase());
};
</script>

<style scoped>
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
    max-width: 850px;
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

.quickplay-card {
  border-color: rgba(59, 130, 246, 0.35);
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.9), rgba(30, 58, 138, 0.35));
}

.quickplay-card:hover {
  border-color: rgba(59, 130, 246, 0.6);
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.95), rgba(30, 58, 138, 0.45));
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

.quickplay-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 18px rgba(59, 130, 246, 0.35);
}

.quickplay-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(59, 130, 246, 0.45);
}

.quickplay-cancel-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #fecaca;
  border: 1px solid rgba(239, 68, 68, 0.45);
}

.quickplay-cancel-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.quickplay-status {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 12px;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quickplay-status .status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.quickplay-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.7);
}

.status-match {
  color: #bfdbfe;
  font-weight: 600;
}

.status-countdown {
  color: #93c5fd;
  font-weight: 700;
}

.status-queue {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #cbd5f5;
  font-weight: 600;
}

.status-divider {
  color: #64748b;
}

.ranked-found-panel {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 18px;
  padding: 24px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #f8fafc;
}

.ranked-found-icon {
  font-size: 32px;
}

.ranked-found-title {
  font-size: 16px;
  font-weight: 700;
}

.ranked-found-subtitle {
  font-size: 13px;
  color: #fcd34d;
  font-weight: 600;
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

.room-lobby {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lobby-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 20px;
  align-items: start;
}

.lobby-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

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

@media (max-width: 480px) {
  .panel-title {
    font-size: 20px;
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
  .player-row {
    padding: 10px 10px;
  }

  .player-details {
    flex-wrap: wrap;
    gap: 4px;
  }
}

@media (max-width: 960px) {
  .lobby-body {
    grid-template-columns: 1fr;
  }
}
</style>
