<template>
  <q-layout view="lHh Lpr lFf" class="app-shell">
    <ServerStatusOverlay
      :connection-state="connectionState"
      :waking-up="isWakingUp"
      :message="netStore.connectionMessage"
    />
    <q-page-container class="app-overlay">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import ServerStatusOverlay from './components/ServerStatusOverlay.vue';
import { useServerHealth } from './composables/useServerHealth.js';
import { useNetStore } from './stores/netStore.js';

const netStore = useNetStore();
const { isWakingUp } = useServerHealth();

const connectionState = computed(() => {
  if (netStore.connected) return 'connected';
  if (netStore.connecting) return 'connecting';
  if (netStore.connectionStatus === 'reconnecting') return 'reconnecting';
  return 'disconnected';
});

import { onMounted, onUnmounted } from 'vue';
import { audioManager } from './engine/audio.js';

const unlockAudio = () => {
  audioManager.unlock();
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
};

const playButtonSound = (event) => {
  const target = event.target;
  if (!target) return;
  const button = target.closest('button, [role="button"], .q-btn');
  if (!button) return;
  if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
  audioManager.play('click');
};

onMounted(() => {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('click', playButtonSound);
});

onUnmounted(() => {
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('click', playButtonSound);
});
</script>
