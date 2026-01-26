<template>
  <div class="confrontation-panel">
    <div class="stats-section shadow-5">
      <div class="accent-line"></div>

      <div class="section-header q-pa-md">
        <div class="row items-center full-width justify-between">
          <div class="column">
            <div class="section-title text-uppercase">Confrontation 1v1</div>
            <div class="section-subtitle">Face à {{ opponentName }}</div>
          </div>
          <q-badge color="indigo-5" class="mode-badge q-py-xs q-px-sm">
            Duel
          </q-badge>
        </div>
      </div>

      <div class="profile-stats-grid q-px-md q-pb-md">
        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-xs">
              <div class="stat-title">Matchs joués</div>
              <q-icon name="sports_kabaddi" color="indigo-4" size="20px" />
            </div>
            <div class="stat-value">{{ matches }}</div>
            <div class="stat-sub">
              Victoires: {{ wins }} · Défaites: {{ losses }} · Nuls: {{ draws }}
            </div>
            <q-linear-progress :value="winRate" color="indigo-4" track-color="grey-9" rounded height="6px" class="q-mt-sm" />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card highlight-indigo">
          <q-card-section class="column items-center">
            <div class="stat-title self-start q-mb-sm">Taux de victoire</div>
            <q-circular-progress
              show-value
              font-size="16px"
              :value="winRate * 100"
              size="80px"
              :thickness="0.2"
              color="indigo-4"
              track-color="grey-9"
              class="text-white win-rate-circle"
            >
              {{ Math.round(winRate * 100) }}%
            </q-circular-progress>
            <div class="stat-sub q-mt-sm">Ratio W/L: {{ winLossRatio }}</div>
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-xs">
              <div class="stat-title">Dernier duel</div>
              <q-icon name="history" color="blue-grey-2" size="20px" />
            </div>
            <div class="stat-value">{{ lastResult }}</div>
            <div class="stat-sub">{{ lastDateLabel }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="matches === 0" class="confrontation-empty q-px-md q-pb-md">
        Aucun duel enregistré contre ce joueur pour le moment.
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  profile: { type: Object, default: null },
  confrontation: { type: Object, default: null }
});

const payload = computed(() => props.confrontation || {});
const opponentName = computed(() => props.profile?.name || 'Joueur');
const matches = computed(() => payload.value?.matches ?? 0);
const wins = computed(() => payload.value?.wins ?? 0);
const losses = computed(() => payload.value?.losses ?? 0);
const draws = computed(() => payload.value?.draws ?? 0);
const winRate = computed(() => (matches.value > 0 ? wins.value / matches.value : 0));
const winLossRatio = computed(() =>
  losses.value > 0 ? (wins.value / losses.value).toFixed(2) : (wins.value > 0 ? wins.value.toFixed(2) : '0')
);
const lastResult = computed(() => payload.value?.lastResult || 'Aucun');
const lastDateLabel = computed(() => payload.value?.lastDateLabel || 'Pas encore de duel');
</script>

<style scoped>
.confrontation-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-section {
  position: relative;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.accent-line {
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #4338ca);
  width: 100%;
}

.section-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.5px;
}

.section-subtitle {
  font-size: 11px;
  color: #94a3b8;
}

.mode-badge {
  font-weight: 800;
  border-radius: 6px;
  letter-spacing: 1px;
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.profile-stat-card {
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.profile-stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(30, 41, 59, 0.6);
}

.highlight-indigo {
  border-color: rgba(99, 102, 241, 0.2);
}

.win-rate-circle {
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  font-weight: 800;
}

.stat-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.stat-sub {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.confrontation-empty {
  font-size: 12px;
  color: #94a3b8;
}
</style>
