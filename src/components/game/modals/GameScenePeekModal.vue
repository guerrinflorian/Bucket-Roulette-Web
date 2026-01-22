<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="peek-modal-card" :class="isReal ? 'peek-modal-real' : 'peek-modal-blank'">
      <q-card-section class="peek-modal-content">
        <div class="peek-modal-glow"></div>
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
  position: relative;
  border-radius: 24px;
  padding: 0;
  width: 280px;
  max-width: 280px;
  background: linear-gradient(145deg, rgba(15, 15, 20, 0.97), rgba(8, 8, 12, 0.99));
  border: 1px solid;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.peek-modal-content {
  position: relative;
  text-align: center;
  padding: 28px 24px;
  z-index: 1;
}

.peek-modal-glow {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  pointer-events: none;
  border-radius: 24px;
  transition: opacity 0.3s ease;
}

.peek-modal-real {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(239, 68, 68, 0.2);
}

.peek-modal-real .peek-modal-glow {
  background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
}

.peek-modal-blank {
  border-color: rgba(161, 161, 170, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(161, 161, 170, 0.1);
}

.peek-modal-blank .peek-modal-glow {
  background: radial-gradient(ellipse at center, rgba(161, 161, 170, 0.3) 0%, transparent 70%);
}

.peek-modal-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  animation: peek-rotate 3s ease-in-out infinite;
}

@keyframes peek-rotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

.peek-modal-title {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 10px;
  font-weight: 600;
}

.peek-modal-result {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 10px;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.peek-modal-real .peek-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5);
}

.peek-modal-blank .peek-modal-result {
  color: #e5e7eb;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.5);
}

.peek-modal-hint {
  font-size: 12px;
  color: #71717a;
  font-style: italic;
  line-height: 1.4;
}

@media (max-width: 420px) {
  .peek-modal-card {
    min-width: 0;
    width: min(92vw, 320px);
    max-width: 92vw;
  }

  .peek-modal-content {
    padding: 24px 20px;
  }

  .peek-modal-icon {
    font-size: 42px;
  }

  .peek-modal-result {
    font-size: 20px;
  }

  .peek-modal-hint {
    font-size: 11px;
  }
}
</style>
