<template>
  <div class="mode-panel">
    <div class="stats-section shadow-5">
      <div class="accent-line"></div>

      <div class="section-header q-pa-md" :class="sectionHeaderClass">
        <div class="row items-center full-width justify-between">
          <div class="column">
            <div class="section-title text-uppercase">{{ title }}</div>
            <div class="section-subtitle">{{ subtitle }}</div>
          </div>
          <q-badge :color="badgeColor" class="mode-badge q-py-xs q-px-sm">
            {{ badgeLabel }}
          </q-badge>
        </div>
      </div>

      <div class="profile-stats-grid q-px-md q-pb-md">
        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-xs">
              <div class="stat-title">Matchs joués</div>
              <q-icon name="style" color="orange-8" size="20px" />
            </div>
            <div class="stat-value">{{ matches }}</div>
            <div class="stat-sub">Victoires: {{ wins }} · Défaites: {{ losses }}</div>
            <q-linear-progress :value="winRate" color="deep-orange-6" track-color="grey-9" rounded height="6px" class="q-mt-sm" />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card highlight-orange">
          <q-card-section class="column items-center">
            <div class="stat-title self-start q-mb-sm">Taux de victoire</div>
            <q-circular-progress
              show-value
              font-size="16px"
              :value="winRate * 100"
              size="80px"
              :thickness="0.2"
              color="deep-orange"
              track-color="grey-9"
              class="text-white win-rate-circle"
            >
              {{ Math.round(winRate * 100) }}%
            </q-circular-progress>
            <div class="stat-sub q-mt-sm">Ratio W/L: {{ winLossRatio }}</div>
          </q-card-section>
        </q-card>

        <q-card v-if="showTop2" class="profile-stat-card special-top2">
          <q-card-section>
            <div class="row justify-between items-center q-mb-xs">
              <div class="stat-title text-orange-2">Top 2</div>
              <q-icon name="military_tech" color="orange-3" size="24px" />
            </div>
            <div class="stat-value text-white">{{ top2Finishes }}</div>
            <q-linear-progress :value="top2Rate" color="white" track-color="orange-9" rounded height="6px" class="q-mt-sm" />
          </q-card-section>
        </q-card>

        <q-card v-if="showTop2" class="profile-stat-card">
          <q-card-section class="column items-center">
            <div class="stat-title self-start q-mb-sm">Efficacité Top 2</div>
            <q-circular-progress
              show-value
              font-size="16px"
              :value="top2Rate * 100"
              size="80px"
              :thickness="0.2"
              color="orange-8"
              track-color="grey-9"
              class="text-white"
            >
              {{ Math.round(top2Rate * 100) }}%
            </q-circular-progress>
            <div class="stat-sub q-mt-sm">Fréquence podium</div>
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-xs">
              <div class="stat-title">Activité</div>
              <q-icon name="bolt" color="amber-7" size="20px" />
            </div>
            <div class="stat-value">{{ shotsFired }}</div>
            <div class="stat-sub">Tirs · Items: {{ itemsUsed }}</div>
            <q-linear-progress :value="shotsProgress" color="amber-7" track-color="grey-9" rounded height="6px" class="q-mt-sm" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="$slots.default" class="mode-extras">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  badgeLabel: { type: String, default: '' },
  badgeColor: { type: String, default: 'grey-8' },
  modeStats: { type: Object, default: null },
  highlight: { type: String, default: 'default' },
  showTop2: { type: Boolean, default: false }
});

const stats = computed(() => props.modeStats || {});
const wins = computed(() => stats.value?.wins ?? 0);
const losses = computed(() => stats.value?.losses ?? 0);
const matches = computed(() => wins.value + losses.value);
const winRate = computed(() => (matches.value > 0 ? wins.value / matches.value : 0));
const winLossRatio = computed(() =>
  losses.value > 0 ? (wins.value / losses.value).toFixed(2) : (wins.value > 0 ? wins.value.toFixed(2) : '0')
);
const shotsFired = computed(() => stats.value?.shots_fired ?? 0);
const itemsUsed = computed(() => stats.value?.items_used ?? 0);
const top2Finishes = computed(() => stats.value?.top2_finishes ?? 0);
const top2Rate = computed(() =>
  matches.value > 0 ? top2Finishes.value / matches.value : 0
);
const shotsProgress = computed(() => Math.min(1, Math.max(0, shotsFired.value / 200)));

const sectionHeaderClass = computed(() => ({
  'header-solo': props.highlight === 'solo',
  'header-duel': props.highlight === 'duel',
  'header-trio': props.highlight === 'trio'
}));
</script>

<style scoped>
.mode-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-section {
  position: relative;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 120, 40, 0.15);
  border-radius: 20px;
  overflow: hidden;
}

.accent-line {
  height: 4px;
  background: linear-gradient(90deg, #f97316, #ea580c);
  width: 100%;
}

/* Header Variations */
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

/* Grid & Cards */
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
  border-color: rgba(249, 115, 22, 0.4);
  background: rgba(30, 41, 59, 0.6);
}

.highlight-orange {
  border-color: rgba(249, 115, 22, 0.2);
}

/* Carte spéciale Top 2 (Degradé orange) */
.special-top2 {
  background: linear-gradient(135deg, #ea580c 0%, #9a3412 100%);
  border: none;
}

.win-rate-circle {
  text-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
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

/* Slot Style */
.mode-extras {
  border-radius: 16px;
  overflow: hidden;
}

/* Couleurs de Header par mode (subtil) */
.header-solo { background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent); }
.header-duel { background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent); }
.header-trio { background: linear-gradient(90deg, rgba(168, 85, 247, 0.1), transparent); }
</style>