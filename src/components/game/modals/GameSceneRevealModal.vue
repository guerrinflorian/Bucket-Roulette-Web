<template>
  <Teleport to="body">
    <Transition name="reveal-fade">
      <div v-if="modelValue" class="reveal-overlay">
        <div class="reveal-card" :class="isReal ? 'card-real' : 'card-blank'">
          <div class="reveal-glow"></div>
          <div class="reveal-content">
            <Gun3D ref="gunRef" class="reveal-gun" />
            <div class="reveal-icon">{{ isReal ? '💥' : '💨' }}</div>
            <div class="reveal-title">{{ isReal ? 'BALLE RÉELLE' : 'À BLANC' }}</div>
            <div class="reveal-subtitle">{{ subtitle }}</div>
            <div v-if="inverterText" class="reveal-inverter">
              <q-icon name="sync" size="14px" class="q-mr-xs" />
              {{ inverterText }}
            </div>
            <div v-if="damage > 0" class="reveal-damage">
              <span class="damage-icon">⚔️</span>
              <span class="damage-value">-{{ damage }} HP</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import Gun3D from './Gun3D.vue';

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
  },
  ammoType: {
    type: String,
    default: 'REAL'
  },
  weaponSkin: {
    type: Object,
    default: null
  }
});

const gunRef = ref(null);

watch(
  () => [props.modelValue, props.weaponSkin, props.ammoType],
  async ([isOpen]) => {
    if (!isOpen) return;
    await nextTick();
    gunRef.value?.applyWeaponSkin?.(props.weaponSkin);
    gunRef.value?.playSequence?.(props.ammoType);
  }
);
</script>

<style scoped>
.reveal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.93);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  z-index: 3000;
}

.reveal-card {
  position: relative;
  padding: 0;
  border-radius: 28px;
  text-align: center;
  border: 1px solid;
  animation: reveal-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 92vw;
  background: linear-gradient(145deg, rgba(15, 15, 20, 0.97), rgba(8, 8, 12, 0.99));
  overflow: hidden;
}

.reveal-content {
  position: relative;
  z-index: 1;
  padding: 48px 64px;
}

.reveal-gun {
  width: 320px;
  height: 220px;
  margin: 0 auto 18px;
}

.reveal-glow {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  pointer-events: none;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.25;
  }
}

@keyframes reveal-pop {
  0% {
    transform: scale(0.7) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.03) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.card-real {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 
    0 24px 60px rgba(0, 0, 0, 0.7),
    0 0 60px rgba(239, 68, 68, 0.2);
}

.card-real .reveal-glow {
  background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.4) 0%, transparent 70%);
}

.card-blank {
  border-color: rgba(161, 161, 170, 0.3);
  box-shadow: 
    0 24px 60px rgba(0, 0, 0, 0.7),
    0 0 40px rgba(161, 161, 170, 0.1);
}

.card-blank .reveal-glow {
  background: radial-gradient(ellipse at center, rgba(161, 161, 170, 0.3) 0%, transparent 70%);
}

.reveal-icon {
  font-size: 72px;
  margin-bottom: 16px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.6));
  animation: gentle-bounce 2s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.reveal-title {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
  line-height: 1.2;
}

.card-real .reveal-title {
  color: #fca5a5;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.5), 0 2px 8px rgba(0, 0, 0, 0.5);
}

.card-blank .reveal-title {
  color: #e5e7eb;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.5);
}

.reveal-subtitle {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

.reveal-inverter {
  font-size: 13px;
  color: rgba(251, 191, 36, 0.9);
  margin-top: 8px;
  padding: 6px 16px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.reveal-damage {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 28px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  animation: damage-pulse 0.6s ease-out;
}

@keyframes damage-pulse {
  0%, 100% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.1) rotate(-2deg);
  }
  60% {
    transform: scale(0.95) rotate(2deg);
  }
}

.damage-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
}

.damage-value {
  font-size: 32px;
  font-weight: 900;
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.reveal-fade-enter-active {
  transition: opacity 0.25s ease;
}

.reveal-fade-leave-active {
  transition: opacity 0.35s ease;
}

.reveal-fade-enter-from,
.reveal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 420px) {
  .reveal-content {
    padding: 32px 28px;
  }

  .reveal-gun {
    width: 240px;
    height: 170px;
    margin-bottom: 12px;
  }

  .reveal-icon {
    font-size: 52px;
  }

  .reveal-title {
    font-size: 28px;
  }

  .reveal-subtitle {
    font-size: 13px;
  }

  .reveal-inverter {
    font-size: 11px;
    padding: 5px 12px;
  }

  .damage-icon {
    font-size: 20px;
  }

  .damage-value {
    font-size: 24px;
  }
}
</style>
