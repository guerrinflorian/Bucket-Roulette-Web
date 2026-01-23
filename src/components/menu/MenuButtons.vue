<template>
  <div class="menu-buttons" v-if="!showMultiplayer">
    <button class="game-btn btn-solo" @click="emit('solo')">
      <div class="btn-glow"></div>
      <div class="btn-content">
        <span class="btn-icon">🤖</span>
        <div class="btn-text">
          <span class="btn-title">Solo vs IA</span>
          <span class="btn-subtitle">Entraînez-vous contre le bot</span>
        </div>
      </div>
    </button>

    <button class="game-btn btn-multi" @click="emit('multiplayer')">
      <div class="btn-glow"></div>
      <div class="btn-content">
        <span class="btn-icon">⚔️</span>
        <div class="btn-text">
          <span class="btn-title">Multijoueur</span>
          <span class="btn-subtitle">Défiez un ami en ligne</span>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
defineProps({
  showMultiplayer: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['solo', 'multiplayer']);
</script>

<style scoped>
.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 340px;
}

@media (min-width: 768px) {
  .menu-buttons {
    flex-direction: row;
    max-width: 700px;
    gap: 20px;
  }
  
  .menu-buttons .game-btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .menu-buttons {
    max-width: 800px;
    gap: 24px;
  }
}

.game-btn {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 16px;
  border: 2px solid;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
}

.game-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.btn-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.game-btn:hover:not(:disabled) .btn-glow {
  opacity: 1;
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  width: 100%;
}

.btn-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.btn-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.btn-title {
  font-size: 18px;
  font-weight: 700;
  color: #fcd34d;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.btn-subtitle {
  font-size: 12px;
  color: #a8a29e;
  margin-top: 2px;
}

.btn-solo,
.btn-multi {
  background: linear-gradient(145deg, rgba(30, 20, 10, 0.9) 0%, rgba(15, 10, 5, 0.95) 100%);
  border-color: rgba(180, 120, 60, 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 100, 0.08),
    0 4px 20px rgba(0, 0, 0, 0.4);
}

.btn-solo .btn-glow,
.btn-multi .btn-glow {
  background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.12) 0%, transparent 70%);
}

.btn-solo:hover:not(:disabled),
.btn-multi:hover:not(:disabled) {
  border-color: rgba(245, 158, 11, 0.6);
  transform: translateY(-3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 100, 0.12),
    0 12px 40px rgba(180, 120, 40, 0.25),
    0 0 30px rgba(245, 158, 11, 0.15);
}

.btn-solo:active:not(:disabled),
.btn-multi:active:not(:disabled) {
  transform: translateY(-1px);
}

@media (max-width: 480px) {
  .btn-content {
    padding: 16px 18px;
    gap: 14px;
  }

  .btn-icon {
    font-size: 28px;
  }

  .btn-title {
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .btn-content {
    padding: 24px 32px;
  }

  .btn-icon {
    font-size: 42px;
  }

  .btn-title {
    font-size: 20px;
  }

  .btn-subtitle {
    font-size: 14px;
  }
}

@media (min-width: 1024px) {
  .btn-content {
    padding: 28px 36px;
  }

  .btn-icon {
    font-size: 48px;
  }

  .btn-title {
    font-size: 22px;
  }
}
</style>
