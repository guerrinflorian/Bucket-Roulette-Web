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

        <q-card v-if="showElo" class="profile-stat-card ranked-elo-card">
          <q-card-section class="column items-center">
            <div class="stat-title self-start q-mb-sm">Elo</div>
            <div class="stat-value text-amber-2">{{ eloDisplay }}</div>
            <div class="stat-sub q-mt-sm">Classement actuel</div>
          </q-card-section>
        </q-card>

        <q-card v-if="showElo" class="profile-stat-card ranked-league-card">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="column">
                <div class="stat-title text-amber-2">Ligue actuelle</div>
                <div class="league-name">
                  <span class="league-icon">{{ currentLeague.icon }}</span>
                  <span>{{ currentLeague.label }}</span>
                  <q-tooltip class="league-tooltip-wrapper" anchor="top middle" self="bottom middle">
                    <LeagueProgressTooltip :leagues="leagues" :elo="clampedElo" />
                  </q-tooltip>
                </div>
              </div>
              <q-badge :color="currentLeague.badgeColor" class="league-badge">
                {{ currentLeague.tier }}
              </q-badge>
            </div>
            <div class="league-range">Elo {{ currentLeague.range }}</div>
            <div class="league-progress">
              <q-linear-progress
                :value="eloProgress"
                rounded
                color="amber-5"
                track-color="grey-9"
                height="10px"
              />
              <div class="league-progress-label">{{ clampedElo }} / 2500</div>
            </div>
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
import LeagueProgressTooltip from './LeagueProgressTooltip.vue';

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  badgeLabel: { type: String, default: '' },
  badgeColor: { type: String, default: 'grey-8' },
  modeStats: { type: Object, default: null },
  highlight: { type: String, default: 'default' },
  showTop2: { type: Boolean, default: false },
  showElo: { type: Boolean, default: false },
  eloValue: { type: [Number, String], default: null }
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
const baseElo = computed(() => {
  if (props.eloValue === null || props.eloValue === undefined || props.eloValue === '') {
    return 1000;
  }
  const parsed = Number(props.eloValue);
  return Number.isNaN(parsed) ? 1000 : parsed;
});
const clampedElo = computed(() => Math.min(2500, Math.max(0, baseElo.value)));
const eloDisplay = computed(() => clampedElo.value);
const eloProgress = computed(() => clampedElo.value / 2500);

const leagues = [
  {
    label: 'Condamné I',
    tier: '🩸 Condamné',
    min: 0,
    max: 1049,
    range: '800 – 1049',
    icon: '🩸',
    badgeColor: 'deep-orange-6'
  },
  {
    label: 'Condamné II',
    tier: '🩸 Condamné',
    min: 1050,
    max: 1149,
    range: '1050 – 1149',
    icon: '🩸',
    badgeColor: 'deep-orange-6'
  },
  {
    label: 'Condamné III',
    tier: '🩸 Condamné',
    min: 1150,
    max: 1249,
    range: '1150 – 1249',
    icon: '🩸',
    badgeColor: 'deep-orange-6'
  },
  {
    label: 'Duelliste I',
    tier: '🔫 Duelliste',
    min: 1250,
    max: 1349,
    range: '1250 – 1349',
    icon: '🔫',
    badgeColor: 'amber-7'
  },
  {
    label: 'Duelliste II',
    tier: '🔫 Duelliste',
    min: 1350,
    max: 1449,
    range: '1350 – 1449',
    icon: '🔫',
    badgeColor: 'amber-7'
  },
  {
    label: 'Duelliste III',
    tier: '🔫 Duelliste',
    min: 1450,
    max: 1549,
    range: '1450 – 1549',
    icon: '🔫',
    badgeColor: 'amber-7'
  },
  {
    label: 'Exécuteur I',
    tier: '⚔️ Exécuteur',
    min: 1550,
    max: 1649,
    range: '1550 – 1649',
    icon: '⚔️',
    badgeColor: 'red-6'
  },
  {
    label: 'Exécuteur II',
    tier: '⚔️ Exécuteur',
    min: 1650,
    max: 1749,
    range: '1650 – 1749',
    icon: '⚔️',
    badgeColor: 'red-6'
  },
  {
    label: 'Exécuteur III',
    tier: '⚔️ Exécuteur',
    min: 1750,
    max: 1849,
    range: '1750 – 1849',
    icon: '⚔️',
    badgeColor: 'red-6'
  },
  {
    label: 'Bourreau I',
    tier: '☠️ Bourreau',
    min: 1850,
    max: 1949,
    range: '1850 – 1949',
    icon: '☠️',
    badgeColor: 'deep-purple-5'
  },
  {
    label: 'Bourreau II',
    tier: '☠️ Bourreau',
    min: 1950,
    max: 2049,
    range: '1950 – 2049',
    icon: '☠️',
    badgeColor: 'deep-purple-5'
  },
  {
    label: 'Bourreau III',
    tier: '☠️ Bourreau',
    min: 2050,
    max: 2149,
    range: '2050 – 2149',
    icon: '☠️',
    badgeColor: 'deep-purple-5'
  },
  {
    label: 'Tsar de Sang I',
    tier: '👑 Tsar de Sang',
    min: 2150,
    max: 2249,
    range: '2150 – 2249',
    icon: '👑',
    badgeColor: 'yellow-8'
  },
  {
    label: 'Tsar de Sang II',
    tier: '👑 Tsar de Sang',
    min: 2250,
    max: 2349,
    range: '2250 – 2349',
    icon: '👑',
    badgeColor: 'yellow-8'
  },
  {
    label: 'Tsar de Sang III',
    tier: '👑 Tsar de Sang',
    min: 2350,
    max: 2500,
    range: '2350+',
    icon: '👑',
    badgeColor: 'yellow-8'
  }
];

const currentLeague = computed(() => {
  const elo = clampedElo.value;
  return leagues.find((league) => elo >= league.min && elo <= league.max) || leagues[0];
});

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
  min-height: 0;
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

.ranked-elo-card {
  border-color: rgba(251, 191, 36, 0.35);
}

.ranked-league-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
  border-color: rgba(251, 191, 36, 0.25);
}

.league-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: #fde68a;
}

.league-icon {
  font-size: 22px;
}

.league-badge {
  font-weight: 800;
  letter-spacing: 0.5px;
}

.league-range {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.league-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.league-progress-label {
  font-size: 11px;
  color: #fcd34d;
  font-weight: 700;
  text-align: right;
}

:deep(.league-tooltip-wrapper) {
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(251, 191, 36, 0.35);
  padding: 0;
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
  flex: 1;
  min-height: 0;
}

/* Couleurs de Header par mode (subtil) */
.header-solo { background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent); }
.header-duel { background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent); }
.header-trio { background: linear-gradient(90deg, rgba(168, 85, 247, 0.1), transparent); }
</style>
