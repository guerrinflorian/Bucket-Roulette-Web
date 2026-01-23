import { onMounted, onUnmounted, ref } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const HEALTH_ENDPOINT = `${API_BASE}/health`;
const WAKEUP_THRESHOLD_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

export const useServerHealth = () => {
  const isWakingUp = ref(false);
  const isChecking = ref(false);
  let heartbeatId = null;

  const runHealthCheck = async ({ trackSlow = false } = {}) => {
    if (isChecking.value) return;
    isChecking.value = true;

    let slowTimer = null;
    if (trackSlow) {
      slowTimer = setTimeout(() => {
        isWakingUp.value = true;
      }, WAKEUP_THRESHOLD_MS);
    }

    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      isWakingUp.value = false;
    } catch {
      isWakingUp.value = true;
    } finally {
      if (slowTimer) clearTimeout(slowTimer);
      isChecking.value = false;
    }
  };

  onMounted(() => {
    runHealthCheck({ trackSlow: true });
    heartbeatId = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      runHealthCheck();
    }, HEARTBEAT_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (heartbeatId) clearInterval(heartbeatId);
  });

  return {
    isWakingUp,
    runHealthCheck
  };
};
