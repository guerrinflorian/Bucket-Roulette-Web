<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="profile-modal-card">
      <q-card-section class="profile-modal-header">
        <div class="profile-header-main">
          <q-avatar size="56px" color="dark" text-color="white">
            <q-icon name="person" />
          </q-avatar>
          <div class="profile-header-text">
            <div class="profile-name">{{ profile?.name || 'Profil' }}</div>
            <div class="profile-subtitle">
              <q-badge v-if="profile?.isSelf" color="amber" text-color="black" class="q-mr-sm">
                Vous
              </q-badge>
              <span v-else>Joueur en ligne</span>
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div v-if="loading" class="profile-loading">
          <q-spinner size="32px" color="amber" />
          <span>Chargement des statistiques...</span>
        </div>

        <div v-else-if="error" class="profile-error">
          <q-icon name="warning" color="negative" size="20px" />
          <span>{{ error }}</span>
        </div>

        <div v-else class="profile-content">
          <div class="profile-stats-grid">
            <q-card class="profile-stat-card">
              <q-card-section>
                <div class="stat-title">Matchs en ligne</div>
                <div class="stat-value">{{ onlineMatches }}</div>
                <div class="stat-sub">Victoires: {{ onlineWins }} · Défaites: {{ onlineLosses }}</div>
                <q-linear-progress :value="winRate" color="positive" track-color="dark" rounded />
              </q-card-section>
            </q-card>
            <q-card class="profile-stat-card">
              <q-card-section>
                <div class="stat-title">Taux de victoire</div>
                <div class="stat-center">
                  <q-circular-progress
                    :value="winRate * 100"
                    size="80px"
                    thickness="0.18"
                    color="amber"
                    track-color="grey-9"
                    show-value
                  >
                    {{ Math.round(winRate * 100) }}%
                  </q-circular-progress>
                </div>
                <div class="stat-sub">Ratio W/L: {{ winLossRatio }}</div>
              </q-card-section>
            </q-card>
            <q-card class="profile-stat-card">
              <q-card-section>
                <div class="stat-title">1v1v1</div>
                <div class="stat-value">{{ wins1v1v1 }}</div>
                <div class="stat-sub">Victoires · Top 2: {{ top2_1v1v1 }}</div>
                <q-linear-progress :value="top2Rate" color="deep-purple-4" track-color="dark" rounded />
              </q-card-section>
            </q-card>
            <q-card class="profile-stat-card">
              <q-card-section>
                <div class="stat-title">ELO</div>
                <div class="stat-value">{{ eloRating }}</div>
                <div class="stat-sub">Classement en ligne</div>
                <q-linear-progress :value="eloProgress" color="cyan-6" track-color="dark" rounded />
              </q-card-section>
            </q-card>
          </div>

          <div class="profile-metrics">
            <q-card class="profile-metric-card">
              <q-card-section>
                <div class="metric-title">Activité</div>
                <div class="metric-items">
                  <q-chip color="grey-9" text-color="amber" icon="flash_on">
                    Tirs: {{ totalShots }}
                  </q-chip>
                  <q-chip color="grey-9" text-color="light-green-4" icon="construction">
                    Objets: {{ totalItems }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>

            <q-card v-if="profile?.isSelf" class="profile-metric-card">
              <q-card-section>
                <div class="metric-title">Progression Solo</div>
                <div class="metric-items">
                  <q-chip
                    v-for="level in botLevels"
                    :key="level.id"
                    :color="soloProgressStatus(level).color"
                    text-color="white"
                    icon="smart_toy"
                  >
                    {{ level.name }} · {{ soloProgressStatus(level).label || 'Inconnu' }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  soloProgress: { type: Array, default: () => [] },
  botLevels: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);

const statsPayload = computed(() => props.stats || {});
const onlineWins = computed(() => statsPayload.value?.total_wins_online ?? 0);
const onlineLosses = computed(() => statsPayload.value?.total_losses_online ?? 0);
const onlineMatches = computed(() => onlineWins.value + onlineLosses.value);
const winRate = computed(() =>
  onlineMatches.value > 0 ? onlineWins.value / onlineMatches.value : 0
);
const winLossRatio = computed(() =>
  onlineLosses.value > 0 ? (onlineWins.value / onlineLosses.value).toFixed(2) : '∞'
);
const totalShots = computed(() => statsPayload.value?.total_shots_fired ?? 0);
const totalItems = computed(() => statsPayload.value?.items_used_count ?? 0);
const wins1v1v1 = computed(() => statsPayload.value?.wins_1v1v1 ?? 0);
const top2_1v1v1 = computed(() => statsPayload.value?.top2_1v1v1 ?? 0);
const top2Rate = computed(() =>
  onlineMatches.value > 0 ? top2_1v1v1.value / onlineMatches.value : 0
);
const eloRating = computed(() => statsPayload.value?.elo_rating ?? 0);
const eloProgress = computed(() => Math.min(1, Math.max(0, eloRating.value / 3000)));
const soloProgressMap = computed(
  () => new Map(props.soloProgress.map((entry) => [entry.difficulty, entry]))
);

const soloProgressStatus = (level) => {
  const entry = soloProgressMap.value.get(level.key);
  if (!entry) {
    return { label: 'Non tenté', color: 'grey-7' };
  }
  if (entry.is_defeated) {
    return { label: 'Défaite', color: 'negative' };
  }
  return { label: 'Bot battu', color: 'positive' };
};
</script>

<style scoped>
.profile-modal-card {
  width: min(92vw, 720px);
  border-radius: 22px;
  background: linear-gradient(160deg, rgba(15, 15, 20, 0.98), rgba(8, 10, 16, 0.98));
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.profile-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
}

.profile-header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.profile-subtitle {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
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

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.profile-stat-card {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
}

.stat-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #94a3b8;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin-top: 6px;
  color: #f8fafc;
}

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 6px 0 10px;
}

.stat-center {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.profile-metrics {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.profile-metric-card {
  background: rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
}

.metric-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #94a3b8;
  margin-bottom: 10px;
}

.metric-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
