<template>
  <section class="actions-section">
    <button
      class="shoot-btn shoot-enemy"
      :disabled="!canAct"
      @click="emit('shoot', 'enemy')"
    >
      🎯 Tirer sur l'ennemi
      <q-tooltip>Tirer sur l'ennemi. Si balle réelle, tour change.</q-tooltip>
    </button>
    <button
      class="shoot-btn shoot-self"
      :disabled="!canAct"
      @click="emit('shoot', 'self')"
    >
      🔫 Se tirer dessus
      <q-tooltip>À blanc, vous rejouez. Réelle = dégâts.</q-tooltip>
    </button>
  </section>
</template>

<script setup>
defineProps({
  canAct: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['shoot']);
</script>

<style scoped>
.actions-section {
  display: flex;
  gap: 14px;
  justify-content: center;
  padding: 12px 18px 18px;
}

.shoot-btn {
  flex: 1;
  max-width: 200px;
  border: 2px solid;
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 700;
  color: #f4f4f5;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.shoot-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.25s;
}

.shoot-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.shoot-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.shoot-btn:hover:not(:disabled) {
  transform: translateY(-4px);
}

.shoot-btn:active:not(:disabled) {
  transform: translateY(-2px);
}

.shoot-enemy {
  background: linear-gradient(145deg, #7f1d1d, #450a0a);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 6px 24px rgba(239, 68, 68, 0.25);
}

.shoot-enemy:hover:not(:disabled) {
  border-color: #ef4444;
  box-shadow: 0 12px 36px rgba(239, 68, 68, 0.35), 0 0 30px rgba(239, 68, 68, 0.15);
}

.shoot-self {
  background: linear-gradient(145deg, rgba(63, 63, 70, 0.8), rgba(39, 39, 42, 0.9));
  border-color: rgba(161, 161, 170, 0.3);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}

.shoot-self:hover:not(:disabled) {
  border-color: rgba(161, 161, 170, 0.5);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 255, 255, 0.05);
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
