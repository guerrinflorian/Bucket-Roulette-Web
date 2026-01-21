<template>
  <Teleport to="body">
    <Transition name="reveal-fade">
      <div v-if="modelValue" class="reveal-overlay">
        <div class="reveal-card" :class="isReal ? 'card-real' : 'card-blank'">
          <div class="reveal-icon">{{ isReal ? '💥' : '💨' }}</div>
          <div class="reveal-title">{{ isReal ? 'BALLE RÉELLE !' : 'À BLANC' }}</div>
          <div class="reveal-subtitle">{{ subtitle }}</div>
          <div v-if="inverterText" class="reveal-inverter">{{ inverterText }}</div>
          <div v-if="damage > 0" class="reveal-damage">-{{ damage }} PV</div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
  },
  subtitle: {
    type: String,
    default: ''
  },
  inverterText: {
    type: String,
    default: ''
  },
  damage: {
    type: Number,
    default: 0
  }
});
</script>

<style scoped>
.reveal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  z-index: 3000;
}

.reveal-card {
  padding: 56px 72px;
  border-radius: 32px;
  text-align: center;
  border: 3px solid;
  animation: reveal-pop 0.4s ease-out;
  max-width: 92vw;
  backdrop-filter: blur(20px);
}

@keyframes reveal-pop {
  0% { transform: scale(0.6) rotate(-5deg); opacity: 0; }
  60% { transform: scale(1.08) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.card-real {
  background: linear-gradient(145deg, rgba(127, 29, 29, 0.9), rgba(69, 10, 10, 0.95));
  border-color: #ef4444;
  box-shadow:
    0 0 80px rgba(239, 68, 68, 0.5),
    0 0 150px rgba(239, 68, 68, 0.3),
    inset 0 0 60px rgba(239, 68, 68, 0.1);
}

.card-blank {
  background: linear-gradient(145deg, rgba(63, 63, 70, 0.9), rgba(39, 39, 42, 0.95));
  border-color: #a1a1aa;
  box-shadow:
    0 0 60px rgba(161, 161, 170, 0.2),
    inset 0 0 40px rgba(255, 255, 255, 0.02);
}

.reveal-icon {
  font-size: 90px;
  margin-bottom: 20px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
}

.reveal-title {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.card-real .reveal-title {
  color: #fecaca;
  text-shadow: 0 0 50px rgba(239, 68, 68, 0.7);
}

.card-blank .reveal-title {
  color: #f4f4f5;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.reveal-subtitle {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
}

.reveal-inverter {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
}

.reveal-damage {
  font-size: 36px;
  font-weight: 900;
  color: #ef4444;
  margin-top: 20px;
  padding: 8px 24px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 16px;
  display: inline-block;
  animation: shake-dmg 0.4s ease-out;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

@keyframes shake-dmg {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px) rotate(-2deg); }
  40% { transform: translateX(10px) rotate(2deg); }
  60% { transform: translateX(-6px) rotate(-1deg); }
  80% { transform: translateX(6px) rotate(1deg); }
}

.reveal-fade-enter-active {
  transition: opacity 0.2s ease;
}

.reveal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.reveal-fade-enter-from,
.reveal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 420px) {
  .reveal-card {
    padding: 28px 24px;
  }

  .reveal-icon {
    font-size: 56px;
  }

  .reveal-title {
    font-size: 26px;
  }

  .reveal-subtitle {
    font-size: 13px;
  }

  .reveal-inverter {
    font-size: 11px;
  }

  .reveal-damage {
    font-size: 24px;
  }
}
</style>
