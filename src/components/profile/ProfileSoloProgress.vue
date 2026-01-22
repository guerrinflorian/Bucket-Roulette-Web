<template>
  <q-card class="profile-metric-card">
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
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  soloProgress: { type: Array, default: () => [] },
  botLevels: { type: Array, default: () => [] }
});

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
