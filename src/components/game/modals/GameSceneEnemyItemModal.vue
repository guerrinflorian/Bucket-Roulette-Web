<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="enemy-item-card">
      <q-card-section class="text-center">
        <div class="enemy-item-icon">{{ emoji }}</div>
        <div class="enemy-item-title">Un adversaire utilise</div>
        <div class="enemy-item-name">{{ name }}</div>
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
  emoji: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<style scoped>
.enemy-item-card {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 15, 20, 0.95));
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 24px;
  padding: 32px 48px;
  min-width: 280px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 50px rgba(245, 158, 11, 0.15);
}

.enemy-item-icon {
  font-size: 56px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.3));
}

.enemy-item-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 6px;
}

.enemy-item-name {
  font-size: 22px;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

@media (max-width: 420px) {
  .enemy-item-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 18px 20px;
  }

  .enemy-item-icon {
    font-size: 38px;
  }

  .enemy-item-name {
    font-size: 16px;
  }
}
</style>
