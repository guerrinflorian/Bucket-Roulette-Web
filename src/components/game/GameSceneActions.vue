<template>
  <section class="actions-section">
    <div class="target-picker">
      <div class="target-label">Cible</div>
      <q-btn-toggle
        v-model="selectedTarget"
        :options="targetOptions"
        class="target-toggle"
        color="deep-orange"
        text-color="white"
        unelevated
        spread
        :disable="!canAct"
      />
    </div>
    <q-btn
      class="shoot-btn"
      color="negative"
      unelevated
      :disable="!canAct || !selectedTarget"
      @click="emit('shoot', selectedTarget)"
    >
      🎯 Tirer
      <q-tooltip>Choisissez la cible avant de tirer.</q-tooltip>
    </q-btn>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  canAct: {
    type: Boolean,
    default: false
  },
  targets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['shoot']);
const selectedTarget = ref(null);

const targetOptions = computed(() => props.targets.map((target) => ({
  label: target.label,
  value: target.key
})));

watch(
  () => props.targets,
  (targets) => {
    if (!targets.length) {
      selectedTarget.value = null;
      return;
    }
    const stillAvailable = targets.some((target) => target.key === selectedTarget.value);
    if (!stillAvailable) {
      selectedTarget.value = targets[0]?.key || null;
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.actions-section {
  display: grid;
  gap: 14px;
  justify-items: center;
  padding: 12px 18px 18px;
}

.target-picker {
  width: min(520px, 100%);
  display: grid;
  gap: 8px;
}

.target-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(244, 244, 245, 0.7);
  font-weight: 700;
}

.target-toggle {
  width: 100%;
  background: rgba(24, 24, 27, 0.6);
  border-radius: 14px;
  padding: 4px;
}

.shoot-btn {
  width: min(260px, 100%);
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 700;
  color: #f4f4f5;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25);
}

@media (max-height: 700px) {
  .actions-section {
    padding: 8px 14px 14px;
    gap: 10px;
  }

  .shoot-btn {
    padding: 10px 14px;
    font-size: 12px;
    border-radius: 14px;
  }
}

@media (max-width: 380px) {
  .shoot-btn {
    padding: 10px 12px;
    font-size: 11px;
  }
}
</style>
