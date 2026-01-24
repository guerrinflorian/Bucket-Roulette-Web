<template>
  <div class="server-status-overlay">
    <transition name="slide-down">
      <div v-if="showConnectionBanner" class="connection-banner" :class="bannerClass">
        <span class="status-dot" :class="bannerClass" aria-hidden="true"></span>
        <span>{{ connectionMessage }}</span>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="wakingUp" class="wakeup-overlay">
        <div class="wakeup-card">
          <div class="wakeup-spinner" aria-hidden="true"></div>
          <div class="wakeup-text">
            <h2>Le serveur se réveille doucement...</h2>
            <p>(cela peut prendre 1-2 minutes)</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  connectionState: {
    type: String,
    default: 'disconnected'
  },
  wakingUp: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
});

const connectionMessage = computed(() => {
  if (props.message) return props.message;
  if (props.connectionState === 'connecting') return 'Connexion au serveur...';
  if (props.connectionState === 'reconnecting') return 'Connexion perdue, reconnexion en cours...';
  return '';
});

const showConnectionBanner = computed(() => props.connectionState !== 'connected' && connectionMessage.value);

const bannerClass = computed(() => {
  if (props.connectionState === 'connecting') return 'is-connecting';
  if (props.connectionState === 'reconnecting') return 'is-reconnecting';
  if (props.connectionState === 'disconnected') return 'is-disconnected';
  return 'is-connected';
});
</script>

<style scoped>
.server-status-overlay {
  pointer-events: none;
}

.connection-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 50;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.connection-banner.is-connecting,
.connection-banner.is-reconnecting,
.connection-banner.is-disconnected {
  background: rgba(229, 94, 94, 0.92);
}

.connection-banner.is-connecting {
  background: rgba(80, 114, 229, 0.92);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.wakeup-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(12, 12, 20, 0.7);
  z-index: 40;
  pointer-events: all;
}

.wakeup-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 242, 255, 0.9));
  color: #1c1c28;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.wakeup-spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid rgba(86, 98, 247, 0.2);
  border-top-color: #5662f7;
  animation: spin 1s linear infinite;
}

.wakeup-text h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.wakeup-text p {
  margin: 4px 0 0;
  font-size: 0.95rem;
  color: rgba(28, 28, 40, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translate(-50%, -10px);
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
