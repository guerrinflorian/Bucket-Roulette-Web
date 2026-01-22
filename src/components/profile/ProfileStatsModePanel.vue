<template>
  <div class="mode-panel">
    <div class="stats-section">
      <div class="section-header" :class="sectionHeaderClass">
        <div>
          <div class="section-title">{{ title }}</div>
          <div class="section-subtitle">{{ subtitle }}</div>
        </div>
        <q-badge :color="badgeColor" text-color="white">{{ badgeLabel }}</q-badge>
      </div>

      <div class="profile-stats-grid">
        <q-card class="profile-stat-card stat-card-primary">
          <q-card-section>
            <div class="stat-title">Matchs joués</div>
            <div class="stat-value">{{ matches }}</div>
            <div class="stat-sub">Victoires: {{ wins }} · Défaites: {{ losses }}</div>
            <q-linear-progress :value="winRate" color="positive" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Taux de victoire</div>
            <div class="stat-center">
              <q-circular-progress
                :value="winRate * 100"
                size="86px"
                :thickness="0.18"
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

        <q-card v-if="showTop2" class="profile-stat-card stat-card-alt">
          <q-card-section>
            <div class="stat-title">Top 2</div>
            <div class="stat-value">{{ top2Finishes }}</div>
            <div class="stat-sub">Présence dans le top 2</div>
            <q-linear-progress :value="top2Rate" color="deep-purple-4" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card v-if="showTop2" class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Taux Top 2</div>
            <div class="stat-center">
              <q-circular-progress
                :value="top2Rate * 100"
                size="86px"
                :thickness="0.18"
                color="deep-purple-4"
                track-color="grey-9"
                show-value
              >
                {{ Math.round(top2Rate * 100) }}%
              </q-circular-progress>
            </div>
            <div class="stat-sub">Finitions top 2</div>
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Activité</div>
            <div class="stat-value">{{ shotsFired }}</div>
            <div class="stat-sub">Tirs · Objets: {{ itemsUsed }}</div>
            <q-linear-progress :value="shotsProgress" color="amber" track-color="dark" rounded />
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
  losses.value > 0 ? (wins.value / losses.value).toFixed(2) : '∞'
);
const shotsFired = computed(() => stats.value?.shots_fired ?? 0);
const itemsUsed = computed(() => stats.value?.items_used ?? 0);
const top2Finishes = computed(() => stats.value?.top2_finishes ?? 0);
const top2Rate = computed(() =>
  matches.value > 0 ? top2Finishes.value / matches.value : 0
);
const shotsProgress = computed(() => Math.min(1, Math.max(0, shotsFired.value / 200)));

const sectionHeaderClass = computed(() => ({
  'section-header-solo': props.highlight === 'solo',
  'section-header-duel': props.highlight === 'duel',
  'section-header-trio': props.highlight === 'trio'
}));
</script>

<style scoped>
.mode-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stats-section {
  padding: 18px;
  border-radius: 18px;
  background: rgba(8, 12, 20, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header-solo {
  background: linear-gradient(120deg, rgba(16, 185, 129, 0.15), transparent);
  border-radius: 12px;
  padding: 8px 10px;
}

.section-header-duel {
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.18), transparent);
  border-radius: 12px;
  padding: 8px 10px;
}

.section-header-trio {
  background: linear-gradient(120deg, rgba(88, 28, 135, 0.2), transparent);
  border-radius: 12px;
  padding: 8px 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.section-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.profile-stat-card {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
}

.stat-card-primary {
  background: linear-gradient(150deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.55));
  border-color: rgba(16, 185, 129, 0.3);
}

.stat-card-alt {
  background: linear-gradient(150deg, rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.55));
  border-color: rgba(99, 102, 241, 0.35);
}

.stat-title {
  font-size: 11px;
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

.mode-extras {
  padding: 0 4px;
}
</style>
