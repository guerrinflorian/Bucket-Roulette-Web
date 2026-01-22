<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="action-modal-card" :class="cardClass">
      <q-card-section class="action-modal-content">
        <div class="action-modal-icon-wrapper">
          <div class="action-modal-icon">{{ icon }}</div>
        </div>
        <div class="action-modal-text">{{ text }}</div>
        <div class="action-modal-glow"></div>
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
  icon: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  cardClass: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>
.action-modal-card {
  position: relative;
  border-radius: 24px;
  padding: 0;
  min-width: 280px;
  max-width: 380px;
  background: linear-gradient(145deg, rgba(15, 15, 20, 0.95), rgba(8, 8, 12, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.action-modal-content {
  position: relative;
  text-align: center;
  padding: 32px 28px;
  z-index: 1;
}

.action-modal-glow {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  pointer-events: none;
  border-radius: 24px;
  transition: opacity 0.3s ease;
}

.action-modal-card.action-self {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(34, 197, 94, 0.15);
}

.action-modal-card.action-self .action-modal-glow {
  background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, transparent 70%);
}

.action-modal-card.action-enemy {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(239, 68, 68, 0.15);
}

.action-modal-card.action-enemy .action-modal-glow {
  background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
}

.action-modal-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 14px;
}

.action-modal-icon {
  font-size: 56px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
  animation: pulse-scale 2s ease-in-out infinite;
}

@keyframes pulse-scale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.action-modal-text {
  font-size: 16px;
  font-weight: 600;
  color: #e5e7eb;
  letter-spacing: 0.03em;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.action-modal-card.action-self .action-modal-text {
  color: #d1fae5;
}

.action-modal-card.action-enemy .action-modal-text {
  color: #fecaca;
}

@media (max-width: 420px) {
  .action-modal-card {
    min-width: 0;
    width: min(92vw, 340px);
    max-width: 92vw;
  }

  .action-modal-content {
    padding: 24px 20px;
  }

  .action-modal-icon {
    font-size: 42px;
  }

  .action-modal-text {
    font-size: 14px;
  }
}
</style>
