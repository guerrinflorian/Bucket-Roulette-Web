import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './authStore.js';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export const useMatchStore = defineStore('match', () => {
  const submitting = ref(false);
  const error = ref('');

  const setError = (message) => {
    error.value = message || '';
  };

  const request = async (path, options = {}) => {
    const authStore = useAuthStore();
    const headers = {
      'Content-Type': 'application/json',
      ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur.');
    }
    return data;
  };

  const recordSoloMatch = async (payload) => {
    submitting.value = true;
    setError('');
    try {
      return await request('/api/matches/solo', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      submitting.value = false;
    }
  };

  const recordMultiplayerMatch = async (payload) => {
    submitting.value = true;
    setError('');
    try {
      return await request('/api/matches/multiplayer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      submitting.value = false;
    }
  };

  const fetchMatchHistory = async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.mode) searchParams.set('mode', params.mode);
    if (params.limit) searchParams.set('limit', params.limit);
    const query = searchParams.toString();
    return request(`/api/matches/history${query ? `?${query}` : ''}`);
  };

  const fetchMyStats = async () => request('/api/stats/me');

  const fetchSoloProgress = async () => request('/api/solo/progress');

  return {
    submitting,
    error,
    recordSoloMatch,
    recordMultiplayerMatch,
    fetchMatchHistory,
    fetchMyStats,
    fetchSoloProgress
  };
});
