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
  gap: 12px;
  justify-content: center;
  padding: 10px 16px 16px;
}

.shoot-btn {
  flex: 1;
  max-width: 220px;
  border: none;
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.shoot-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shoot-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.shoot-enemy {
  background: linear-gradient(145deg, #7f1d1d, #450a0a);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25);
}

.shoot-self {
  background: linear-gradient(145deg, #292524, #1c1917);
  box-shadow: 0 4px 20px rgba(120, 113, 108, 0.25);
}

@media (max-height: 700px) {
  .actions-section {
    padding: 8px 12px 12px;
    gap: 8px;
  }

  .shoot-btn {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
