<template>
  <div class="league-tooltip">
    <div class="tooltip-header">
      <div class="tooltip-title">Position dans les ligues</div>
      <div class="tooltip-elo">Elo {{ formattedElo }}</div>
    </div>

    <div class="tooltip-list">
      <div
        v-for="league in leagues"
        :key="league.label"
        class="tooltip-row"
        :class="{ active: league.label === currentLeague?.label }"
      >
        <div class="tooltip-left">
          <span class="tooltip-icon">{{ league.icon }}</span>
          <div class="tooltip-text">
            <div class="tooltip-league">{{ league.label }}</div>
            <div class="tooltip-range">{{ league.range }}</div>
          </div>
        </div>
        <q-linear-progress
          :value="progressForLeague(league)"
          rounded
          color="amber-5"
          track-color="grey-10"
          height="6px"
          class="tooltip-progress"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  leagues: { type: Array, default: () => [] },
  elo: { type: Number, default: 0 }
});

const formattedElo = computed(() => Math.round(props.elo ?? 0));
const currentLeague = computed(() =>
  props.leagues.find((league) => props.elo >= league.min && props.elo <= league.max)
);

const progressForLeague = (league) => {
  if (!league) return 0;
  if (props.elo <= league.min) return 0;
  if (props.elo >= league.max) return 1;
  const span = league.max - league.min;
  if (span <= 0) return 1;
  return (props.elo - league.min) / span;
};
</script>

<style scoped>
.league-tooltip {
  min-width: 260px;
  max-width: 320px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #e2e8f0;
}

.tooltip-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.tooltip-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f8fafc;
}

.tooltip-elo {
  font-size: 12px;
  font-weight: 700;
  color: #fcd34d;
}

.tooltip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tooltip-row.active {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(251, 191, 36, 0.12);
}

.tooltip-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-icon {
  font-size: 16px;
}

.tooltip-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-league {
  font-size: 12px;
  font-weight: 700;
  color: #f8fafc;
}

.tooltip-range {
  font-size: 10px;
  color: #94a3b8;
}

.tooltip-progress {
  opacity: 0.9;
}
</style>
