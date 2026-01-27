<template>
  <div class="match-history">
    <div class="match-history-header">
      <div>
        <div class="history-title">{{ title }}</div>
        <div class="history-subtitle">{{ subtitle }}</div>
      </div>
      <q-badge color="blue-grey-7" class="history-count">
        {{ sortedMatches.length }} match{{ sortedMatches.length > 1 ? 's' : '' }}
      </q-badge>
    </div>

    <div v-if="loading" class="history-state">
      <q-spinner size="28px" color="amber" />
      <span>Chargement des matchs...</span>
    </div>
    <div v-else-if="error" class="history-state history-error">
      <q-icon name="warning" color="negative" size="20px" />
      <span>{{ error }}</span>
    </div>
    <div v-else-if="sortedMatches.length === 0" class="history-state history-empty">
      <q-icon name="history" color="blue-grey-5" size="20px" />
      <span>{{ emptyLabel }}</span>
    </div>

    <div v-else class="history-list">
      <div v-for="match in sortedMatches" :key="match.id" class="history-card">
        <div class="history-player" :class="outcomeSideClass(match, 'player')">
          <q-avatar size="48px" class="player-avatar">
            <Avatar
              :name="focusAvatarSeed"
              variant="beam"
              :size="44"
              :colors="avatarColors"
            />
          </q-avatar>
          <div class="player-info">
            <div class="player-name">{{ focusDisplayName }}</div>
            <div class="player-role">Joueur</div>
          </div>
        </div>

        <div class="history-details">
          <div class="history-meta">
            <q-badge :color="modeBadgeColor(match.mode)" class="mode-pill">
              {{ modeLabel(match.mode) }}
            </q-badge>
            <q-badge v-if="match.isRanked" color="amber-8" class="ranked-pill">
              RANKED
            </q-badge>
            <span class="match-date">{{ formatDate(match.createdAt) }}</span>
          </div>
          <div class="history-info">
            <span>{{ formatRounds(match.roundsPlayed) }}</span>
            <span class="history-dot">•</span>
            <span>{{ formatVictory(match.victoryType) }}</span>
            <span v-if="match.mode === 'solo'" class="history-dot">•</span>
            <span v-if="match.mode === 'solo'">{{ formatBotLevel(match.botLevel) }}</span>
          </div>
          <q-badge :color="outcomeColor(match)" class="outcome-pill">
            {{ outcomeLabel(match) }}
          </q-badge>
          <div
            v-if="match.isRanked && getEloDelta(match) !== null"
            class="history-elo"
            :class="getEloDelta(match) >= 0 ? 'elo-positive' : 'elo-negative'"
          >
            Elo {{ formatEloDelta(getEloDelta(match)) }}
          </div>
        </div>

        <div class="history-opponents" :class="outcomeSideClass(match, 'opponents')">
          <div
            v-for="(opponent, index) in resolveOpponents(match)"
            :key="`${match.id}-${index}`"
            class="opponent-row"
          >
            <q-avatar size="40px" class="opponent-avatar" :class="{ 'bot-avatar': opponent.isBot }">
              <Avatar
                :name="opponent.avatarSeed"
                variant="beam"
                :size="36"
                :colors="avatarColors"
              />
            </q-avatar>
            <div class="opponent-info">
              <div class="opponent-name">{{ opponent.name }}</div>
              <div class="opponent-role">{{ opponent.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from 'vue-boring-avatars';

const props = defineProps({
  matches: { type: Array, default: () => [] },
  focusUserId: { type: [String, Number], default: null },
  focusName: { type: String, default: 'Joueur' },
  viewerId: { type: [String, Number], default: null },
  title: { type: String, default: 'Historique des matchs' },
  subtitle: { type: String, default: 'Plus récent en haut' },
  emptyLabel: { type: String, default: 'Aucun match enregistré.' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

const sortedMatches = computed(() =>
  [...(props.matches || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
);

const isSameUser = (left, right) => {
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
};

const focusBaseName = computed(() => props.focusName || 'Joueur');
const focusDisplayName = computed(() => {
  if (isSameUser(props.focusUserId, props.viewerId)) {
    return `${focusBaseName.value} (vous)`;
  }
  return focusBaseName.value;
});

const avatarColors = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'];

const getAvatarSeed = (name) => {
  const safeName = String(name || 'Joueur');
  return safeName.split(' ')[0] || safeName;
};

const focusAvatarSeed = computed(() => getAvatarSeed(focusBaseName.value));

const formatDate = (value) => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatRounds = (rounds) => {
  if (!rounds) return 'Manches inconnues';
  return `${rounds} manche${rounds > 1 ? 's' : ''}`;
};

const formatVictory = (victoryType) => {
  if (!victoryType) return 'Fin classique';
  const key = String(victoryType).toLowerCase();
  if (key === 'abandon') return 'Abandon';
  if (key === 'death') return 'Élimination';
  return victoryType;
};

const formatBotLevel = (level) => {
  if (!level) return 'IA';
  return `IA ${String(level).toUpperCase()}`;
};

const modeLabel = (mode) => {
  if (mode === 'solo') return 'Solo';
  if (mode === '1v1') return '1v1';
  if (mode === '1v1v1') return '1v1v1';
  return mode || 'Match';
};

const modeBadgeColor = (mode) => {
  if (mode === 'solo') return 'grey-8';
  if (mode === '1v1') return 'positive';
  if (mode === '1v1v1') return 'deep-purple-4';
  return 'blue-grey-7';
};

const resolveOutcome = (match) => {
  const focusId = props.focusUserId;
  const participants = match?.participants || [];
  const focusParticipant = focusId
    ? participants.find((participant) => isSameUser(participant.userId, focusId))
    : null;

  if (match?.winnerId) {
    if (focusId && isSameUser(match.winnerId, focusId)) return 'win';
    if (focusParticipant) return 'loss';
  }

  if (focusParticipant) {
    if (focusParticipant.rank === 1) return 'win';
    return 'loss';
  }

  return 'draw';
};

const resolveFocusParticipant = (match) => {
  const focusId = props.focusUserId || props.viewerId;
  if (!focusId) return null;
  const participants = match?.participants || [];
  return participants.find((participant) => isSameUser(participant.userId, focusId)) || null;
};

const getEloDelta = (match) => {
  const participant = resolveFocusParticipant(match);
  if (participant?.eloDelta === null || participant?.eloDelta === undefined) return null;
  return Number(participant.eloDelta);
};

const formatEloDelta = (value) => (value > 0 ? `+${value}` : `${value}`);

const outcomeLabel = (match) => {
  const outcome = resolveOutcome(match);
  if (outcome === 'win') return 'Victoire';
  if (outcome === 'loss') return 'Défaite';
  return 'Nul';
};

const outcomeSideClass = (match, side) => {
  if (match?.mode !== '1v1') return '';
  const outcome = resolveOutcome(match);
  if (outcome === 'draw') return '';

  if (side === 'player') return outcome === 'win' ? 'side-win' : 'side-loss';
  if (side === 'opponents') return outcome === 'win' ? 'side-loss' : 'side-win';
  return '';
};

const outcomeColor = (match) => {
  const outcome = resolveOutcome(match);
  if (outcome === 'win') return 'positive';
  if (outcome === 'loss') return 'negative';
  return 'blue-grey-5';
};

const resolveOpponents = (match) => {
  const focusId = props.focusUserId;
  const participants = match?.participants || [];
  const opponents = focusId
    ? participants.filter((participant) => !isSameUser(participant.userId, focusId))
    : participants;

  if (match?.mode === 'solo' && opponents.length === 0) {
    return [
      {
        name: 'Bot',
        label: formatBotLevel(match.botLevel),
        isBot: true
      }
    ];
  }

  if (opponents.length === 0) {
    return [
      {
        name: 'Joueur supprimé',
        label: 'Compte supprimé',
        isBot: false
      }
    ];
  }

  return opponents.map((participant) => {
    const isDeleted = Boolean(participant.accountDeleted);
    const participantName = participant.username || participant.name || 'Joueur';
    const name = participant.isBot
      ? 'Bot'
      : isDeleted
        ? 'Joueur supprimé'
        : isSameUser(participant.userId, props.viewerId)
          ? `${participantName} (vous)`
          : participantName;
    return {
      name,
      label: participant.isBot ? 'IA' : isDeleted ? 'Compte supprimé' : 'Opposant',
      isBot: participant.isBot,
      avatarSeed: getAvatarSeed(participantName)
    };
  });
};
</script>

<style scoped>
.match-history {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  padding: 16px;
  min-height: 0;
  height: 100%;
}

.match-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.history-subtitle {
  font-size: 11px;
  color: #94a3b8;
}

.history-count {
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 12px;
}

.history-state {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #cbd5f5;
}

.history-error {
  color: #fca5a5;
}

.history-empty {
  color: #94a3b8;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.history-player,
.history-opponents {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-opponents {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.side-win,
.side-loss {
  padding: 8px 12px;
  border-radius: 12px;
}

.side-win {
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.side-loss {
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.player-avatar,
.opponent-avatar {
  background: rgba(148, 163, 184, 0.2);
  color: #f8fafc;
  font-weight: 700;
}

.bot-avatar {
  background: rgba(94, 234, 212, 0.2);
  color: #2dd4bf;
}

.player-info,
.opponent-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-name,
.opponent-name {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
}

.player-role,
.opponent-role {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.history-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.mode-pill {
  font-weight: 700;
  border-radius: 10px;
}

.ranked-pill {
  font-weight: 800;
  border-radius: 10px;
  letter-spacing: 0.12em;
  font-size: 9px;
}

.match-date {
  font-size: 11px;
  color: #94a3b8;
}

.history-info {
  font-size: 12px;
  color: #cbd5f5;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.history-dot {
  color: #64748b;
}

.outcome-pill {
  font-weight: 800;
  letter-spacing: 0.4px;
  border-radius: 10px;
}

.history-elo {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.elo-positive {
  color: #86efac;
}

.elo-negative {
  color: #fca5a5;
}

.opponent-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 900px) {
  .history-card {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .history-details {
    align-items: flex-start;
    text-align: left;
  }

  .history-opponents {
    justify-content: flex-start;
  }
}
</style>
