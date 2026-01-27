<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="profile-modal-card">
      <q-card-section class="profile-modal-header">
        <div class="profile-modal-title">
          Statistiques
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="profile-tabs-section">
        <q-tabs
          v-model="activeTab"
          class="profile-tabs"
          active-color="amber"
          indicator-color="amber"
          align="left"
          narrow-indicator
        >
          <q-tab name="global" label="Global" icon="leaderboard" />
          <q-tab name="ranked" label="Ranked" icon="emoji_events" />
          <q-tab name="solo" label="Solo" icon="smart_toy" />
          <q-tab name="1v1" label="1v1" icon="sports_kabaddi" />
          <q-tab name="1v1v1" label="1v1v1" icon="groups" />
          <q-tab
            v-if="showConfrontationTab"
            name="confrontation"
            label="Confrontation"
            icon="compare_arrows"
          />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="profile-modal-body">
        <div v-if="loading" class="profile-loading">
          <q-spinner size="32px" color="amber" />
          <span>Chargement des statistiques...</span>
        </div>

        <div v-else-if="error" class="profile-error">
          <q-icon name="warning" color="negative" size="20px" />
          <span>{{ error }}</span>
        </div>

        <div v-else class="profile-content">
          <q-tab-panels v-model="activeTab" animated class="profile-panels">
            <q-tab-panel name="global">
              <div class="profile-panel-layout">
                <div class="profile-panel-stats">
                  <ProfileStatsGlobalPanel
                    :profile="profile"
                    :stats="statsPayload"
                  />
                </div>
                <div class="profile-panel-history">
                  <ProfileMatchHistory
                    title="Historique global"
                    subtitle="Tous les modes confondus"
                    :matches="matchHistoryAll"
                    :loading="matchHistoryLoading"
                    :error="matchHistoryError"
                    :focus-user-id="viewerId || profile?.userId"
                    :focus-name="profile?.name"
                    :viewer-id="viewerId"
                    empty-label="Aucun match global enregistré."
                  />
                </div>
              </div>
            </q-tab-panel>
            <q-tab-panel name="solo">
              <ProfileStatsModePanel
                title="Solo"
                subtitle="Parties contre les bots"
                badge-label="Solo"
                badge-color="grey-8"
                :mode-stats="soloStats"
                highlight="solo"
              >
                <ProfileSoloProgress
                  v-if="profile?.isSelf"
                  :solo-progress="soloProgress"
                  :bot-levels="botLevels"
                />
                <div class="profile-panel-history">
                  <ProfileMatchHistory
                    title="Historique solo"
                    subtitle="Du plus récent au plus ancien"
                    :matches="matchHistorySolo"
                    :loading="matchHistoryLoading"
                    :error="matchHistoryError"
                    :focus-user-id="viewerId || profile?.userId"
                    :focus-name="profile?.name"
                    :viewer-id="viewerId"
                    empty-label="Aucun match solo enregistré."
                  />
                </div>
              </ProfileStatsModePanel>
            </q-tab-panel>
            <q-tab-panel name="ranked">
              <ProfileStatsModePanel
                title="Ranked"
                subtitle="Duels classés 1v1"
                badge-label="Ranked"
                badge-color="amber-8"
                :mode-stats="rankedStats"
                :show-elo="true"
                :elo-value="rankedElo"
                highlight="duel"
              >
                <div class="profile-panel-history">
                  <ProfileMatchHistory
                    title="Historique ranked"
                    subtitle="Derniers matchs classés"
                    :matches="matchHistoryRanked"
                    :loading="matchHistoryLoading"
                    :error="matchHistoryError"
                    :focus-user-id="viewerId || profile?.userId"
                    :focus-name="profile?.name"
                    :viewer-id="viewerId"
                    empty-label="Aucun match ranked enregistré."
                  />
                </div>
              </ProfileStatsModePanel>
            </q-tab-panel>
            <q-tab-panel name="1v1">
              <ProfileStatsModePanel
                title="Multijoueur 1v1"
                subtitle="Duels classiques"
                badge-label="Duel"
                badge-color="positive"
                :mode-stats="duelStats"
                highlight="duel"
              >
                <div class="profile-panel-history">
                  <ProfileMatchHistory
                    title="Historique 1v1"
                    subtitle="Vos derniers duels (hors ranked)"
                    :matches="matchHistory1v1"
                    :loading="matchHistoryLoading"
                    :error="matchHistoryError"
                    :focus-user-id="viewerId || profile?.userId"
                    :focus-name="profile?.name"
                    :viewer-id="viewerId"
                    empty-label="Aucun duel enregistré."
                  />
                </div>
              </ProfileStatsModePanel>
            </q-tab-panel>
            <q-tab-panel name="1v1v1">
              <ProfileStatsModePanel
                title="Multijoueur 1v1v1"
                subtitle="Trio stratégique"
                badge-label="1v1v1"
                badge-color="deep-purple-4"
                :mode-stats="trioStats"
                highlight="trio"
                show-top2
              >
                <div class="profile-panel-history">
                  <ProfileMatchHistory
                    title="Historique 1v1v1"
                    subtitle="Combats à trois (hors ranked)"
                    :matches="matchHistory1v1v1"
                    :loading="matchHistoryLoading"
                    :error="matchHistoryError"
                    :focus-user-id="viewerId || profile?.userId"
                    :focus-name="profile?.name"
                    :viewer-id="viewerId"
                    empty-label="Aucun match 1v1v1 enregistré."
                  />
                </div>
              </ProfileStatsModePanel>
            </q-tab-panel>
            <q-tab-panel v-if="showConfrontationTab" name="confrontation">
              <div class="profile-panel-layout">
                <div v-if="confrontationLoading" class="profile-loading">
                  <q-spinner size="32px" color="amber" />
                  <span>Chargement des confrontations...</span>
                </div>
                <div v-else-if="confrontationError" class="profile-error">
                  <q-icon name="warning" color="negative" size="20px" />
                  <span>{{ confrontationError }}</span>
                </div>
                <template v-else>
                  <div class="profile-panel-stats">
                    <ProfileConfrontationPanel
                      :profile="profile"
                      :confrontation="confrontationPayload"
                    />
                  </div>
                  <div class="profile-panel-history">
                    <div class="profile-history-stack">
                      <ProfileMatchHistory
                        title="Confrontation ranked"
                        subtitle="Face à ce joueur (classé)"
                        :matches="confrontationRankedHistory"
                        :loading="confrontationLoading"
                        :error="confrontationError"
                        :focus-user-id="viewerId"
                        :focus-name="profile?.name"
                        :viewer-id="viewerId"
                        empty-label="Aucune confrontation ranked."
                      />
                      <ProfileMatchHistory
                        title="Confrontation non-ranked"
                        subtitle="Face à ce joueur (hors classé)"
                        :matches="confrontationUnrankedHistory"
                        :loading="confrontationLoading"
                        :error="confrontationError"
                        :focus-user-id="viewerId"
                        :focus-name="profile?.name"
                        :viewer-id="viewerId"
                        empty-label="Aucune confrontation non-ranked."
                      />
                    </div>
                  </div>
                </template>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import ProfileStatsGlobalPanel from './profile/ProfileStatsGlobalPanel.vue';
import ProfileStatsModePanel from './profile/ProfileStatsModePanel.vue';
import ProfileSoloProgress from './profile/ProfileSoloProgress.vue';
import ProfileConfrontationPanel from './profile/ProfileConfrontationPanel.vue';
import ProfileMatchHistory from './profile/ProfileMatchHistory.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  confrontation: { type: Object, default: null },
  confrontationLoading: { type: Boolean, default: false },
  confrontationError: { type: String, default: '' },
  soloProgress: { type: Array, default: () => [] },
  botLevels: { type: Array, default: () => [] },
  matchHistoryAll: { type: Array, default: () => [] },
  matchHistorySolo: { type: Array, default: () => [] },
  matchHistoryRanked: { type: Array, default: () => [] },
  matchHistory1v1: { type: Array, default: () => [] },
  matchHistory1v1v1: { type: Array, default: () => [] },
  matchHistoryLoading: { type: Boolean, default: false },
  matchHistoryError: { type: String, default: '' },
  confrontationHistory: { type: Array, default: () => [] },
  viewerId: { type: [String, Number], default: null }
});

const emit = defineEmits(['update:modelValue']);

const activeTab = ref('global');

const statsPayload = computed(() => props.stats || {});
const modeStats = computed(() => statsPayload.value?.modes ?? {});
const soloStats = computed(() => modeStats.value?.solo ?? {});
const duelStats = computed(() => modeStats.value?.['1v1'] ?? {});
const trioStats = computed(() => modeStats.value?.['1v1v1'] ?? {});
const confrontationPayload = computed(() => props.confrontation || {});
const showConfrontationTab = computed(() => Boolean(props.profile && !props.profile.isSelf));
const rankedFocusId = computed(() => props.viewerId || props.profile?.userId || null);
const matchHistoryRanked = computed(() => props.matchHistoryRanked || []);
const confrontationRankedHistory = computed(() =>
  (props.confrontationHistory || []).filter((match) => match?.isRanked)
);
const confrontationUnrankedHistory = computed(() =>
  (props.confrontationHistory || []).filter((match) => !match?.isRanked)
);

const isSameUser = (left, right) => {
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
};

const resolveFocusParticipant = (match) => {
  const focusId = rankedFocusId.value;
  if (!focusId) return null;
  const participants = match?.participants || [];
  return participants.find((participant) => isSameUser(participant.userId, focusId)) || null;
};

const resolveRankedOutcome = (match) => {
  const participant = resolveFocusParticipant(match);
  if (!participant) return 'draw';
  const focusId = rankedFocusId.value;
  if (match?.winnerId) {
    if (focusId && isSameUser(match.winnerId, focusId)) return 'win';
    return 'loss';
  }
  if (participant.rank === 1) return 'win';
  if (participant.rank) return 'loss';
  return 'draw';
};

const rankedStats = computed(() => {
  const stats = {
    wins: 0,
    losses: 0,
    shots_fired: 0,
    items_used: 0
  };

  matchHistoryRanked.value.forEach((match) => {
    const participant = resolveFocusParticipant(match);
    if (!participant) return;
    const outcome = resolveRankedOutcome(match);
    if (outcome === 'win') stats.wins += 1;
    else if (outcome === 'loss') stats.losses += 1;
    stats.shots_fired += participant.shotsFired ?? 0;
    stats.items_used += participant.itemsUsed ?? 0;
  });

  return stats;
});

const rankedElo = computed(() => {
  const focusId = rankedFocusId.value;
  if (!focusId) return null;
  const sorted = [...matchHistoryRanked.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  for (const match of sorted) {
    const participant = resolveFocusParticipant(match);
    if (!participant) continue;
    if (participant.eloAfter !== null && participant.eloAfter !== undefined) {
      return Number(participant.eloAfter);
    }
    if (participant.eloBefore !== null && participant.eloBefore !== undefined) {
      return Number(participant.eloBefore);
    }
  }
  return null;
});

watch(
  () => props.profile?.userId,
  () => {
    activeTab.value = 'global';
  }
);
</script>

<style scoped>
.profile-modal-card {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background: linear-gradient(160deg, rgba(15, 15, 20, 0.98), rgba(8, 10, 16, 0.98));
  border: none;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}

.profile-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
}

.profile-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.profile-tabs-section {
  padding: 10px 24px 6px;
}

.profile-tabs {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 14px;
  padding: 4px 6px;
}

.profile-loading,
.profile-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5f5;
  font-size: 14px;
  padding: 16px 0;
}

.profile-error {
  color: #fca5a5;
}

.profile-modal-body {
  flex: 1;
  overflow: hidden;
  padding: 18px 24px 24px;
  display: flex;
  flex-direction: column;
}

.profile-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.profile-panels {
  background: transparent;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.profile-panels :deep(.q-tab-panel) {
  height: 100%;
  padding: 0;
  overflow: auto;
}

.profile-panel-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  min-height: 0;
}

.profile-panel-stats {
  flex: 0 0 auto;
}

.profile-panel-history {
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.profile-history-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
