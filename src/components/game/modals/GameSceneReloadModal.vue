<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="reload-modal-card">
      <q-card-section class="text-center">
        <div class="reload-icon">🔄</div>
        <div class="reload-title">Barillet chargé</div>
        <div class="reload-subtitle">{{ text }}</div>
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
  text: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>
.reload-modal-card {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.08), rgba(10, 10, 15, 0.95));
  border: 2px solid rgba(245, 158, 11, 0.35);
  border-radius: 24px;
  padding: 28px 44px;
  min-width: 280px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 50px rgba(245, 158, 11, 0.1);
}

.reload-icon {
  font-size: 44px;
  margin-bottom: 10px;
  animation: spin-reload 1s ease-out;
}

@keyframes spin-reload {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.reload-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fbbf24;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
}

.reload-subtitle {
  font-size: 13px;
  color: #a1a1aa;
  line-height: 1.4;
}

@media (max-width: 420px) {
  .reload-modal-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 18px 20px;
  }

  .reload-title {
    font-size: 14px;
  }

  .reload-subtitle {
    font-size: 11px;
  }
}
</style>
