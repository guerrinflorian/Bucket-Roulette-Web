<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="peek-modal-card" :class="isReal ? 'peek-modal-real' : 'peek-modal-blank'">
      <q-card-section class="text-center">
        <div class="peek-modal-icon">🔍</div>
        <div class="peek-modal-title">Prochaine balle</div>
        <div class="peek-modal-result">
          {{ isReal ? '🔴 RÉELLE' : '⚪ BLANCHE' }}
        </div>
        <div class="peek-modal-hint">
          {{ isReal ? 'Attention, ça va faire mal !' : 'Pas de danger immédiat' }}
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  isReal: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>
.peek-modal-card {
  border-radius: 20px;
  padding: 24px 32px;
  width: 240px;
  max-width: 240px;
  border: 2px solid;
  backdrop-filter: blur(16px);
}

.peek-modal-real {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(28, 5, 5, 0.95));
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
}

.peek-modal-blank {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(15, 15, 20, 0.95));
  border-color: rgba(168, 162, 158, 0.4);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}

.peek-modal-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.peek-modal-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.peek-modal-result {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 8px;
  white-space: nowrap;
}

.peek-modal-real .peek-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.peek-modal-blank .peek-modal-result {
  color: #f4f4f5;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.peek-modal-hint {
  font-size: 11px;
  color: #71717a;
  font-style: italic;
}

@media (max-width: 420px) {
  .peek-modal-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 16px 18px;
  }

  .peek-modal-result {
    font-size: 16px;
  }
}
</style>
