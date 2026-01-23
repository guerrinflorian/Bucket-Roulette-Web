<template>
  <div class="menu-utility-buttons">
    <q-btn
      class="utility-icon"
      round
      flat
      icon="help_outline"
      aria-label="Ouvrir l'aide"
      @click="emit('help')"
    >
      <q-tooltip>Voir l'aide</q-tooltip>
    </q-btn>
    <q-btn
      class="utility-icon leaderboard-icon"
      round
      flat
      icon="leaderboard"
      aria-label="Ouvrir le classement"
      @click="emit('leaderboard')"
    >
      <q-tooltip>Classements</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup>
const emit = defineEmits(['help', 'leaderboard']);
</script>

<style scoped>
.menu-utility-buttons {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.utility-icon {
  color: #fef3c7;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
}

.utility-icon:hover {
  border-color: rgba(251, 191, 36, 0.8);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.3);
}

.leaderboard-icon {
  border-color: rgba(59, 130, 246, 0.4);
}

.leaderboard-icon:hover {
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);
}

@media (max-width: 480px) {
  .menu-utility-buttons {
    top: 10px;
    left: 10px;
  }
}
</style>
