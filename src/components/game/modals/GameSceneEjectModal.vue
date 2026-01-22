<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="eject-modal-card" :class="isReal ? 'eject-modal-real' : 'eject-modal-blank'">
      <q-card-section class="text-center">
        <div class="eject-modal-icon">⏏️</div>
        <div class="eject-modal-title">Cartouche éjectée</div>
        <div class="eject-modal-bullet">
          {{ isReal ? 'BALLE RÉELLE' : 'BALLE BLANCHE' }}
        </div>
        <div class="eject-modal-result">
          {{ isReal ? '🔴 RÉELLE' : '⚪ BLANCHE' }}
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
.eject-modal-card {
  border-radius: 20px;
  padding: 24px 32px;
  width: 260px;
  max-width: 260px;
  border: 2px solid;
  backdrop-filter: blur(16px);
}

.eject-modal-real {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(28, 5, 5, 0.95));
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
}

.eject-modal-blank {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(15, 15, 20, 0.95));
  border-color: rgba(168, 162, 158, 0.4);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}

.eject-modal-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.eject-modal-bullet {
  font-size: 14px;
  color: #d1d5db;
  margin-bottom: 6px;
}

.eject-modal-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.eject-modal-result {
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}

.eject-modal-real .eject-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.eject-modal-blank .eject-modal-result {
  color: #f4f4f5;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

@media (max-width: 420px) {
  .eject-modal-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 16px 18px;
  }

  .eject-modal-result {
    font-size: 16px;
  }
}
</style>
