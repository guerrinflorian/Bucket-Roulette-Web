<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="action-modal-card" :class="cardClass">
      <q-card-section class="text-center">
        <div class="action-modal-icon">{{ icon }}</div>
        <div class="action-modal-text">{{ text }}</div>
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
  border-radius: 20px;
  padding: 28px 40px;
  min-width: 260px;
  border: 2px solid;
  text-align: center;
  backdrop-filter: blur(16px);
}

.action-modal-card.action-self {
  background: linear-gradient(145deg, rgba(34, 197, 94, 0.15), rgba(20, 83, 45, 0.25));
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.05);
}

.action-modal-card.action-enemy {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(69, 10, 10, 0.25));
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.05);
}

.action-modal-icon {
  font-size: 52px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.action-modal-text {
  font-size: 17px;
  font-weight: 700;
  color: #f4f4f5;
  letter-spacing: 0.02em;
}

@media (max-width: 420px) {
  .action-modal-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 16px 18px;
  }

  .action-modal-icon {
    font-size: 34px;
  }

  .action-modal-text {
    font-size: 14px;
  }
}
</style>
