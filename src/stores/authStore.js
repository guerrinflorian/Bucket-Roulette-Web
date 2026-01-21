import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const API_BASE = import.meta.env.VITE_API_BASE
  || `${window.location.protocol}//${window.location.hostname}:3001`;

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('auth_token') || '');
  const loading = ref(false);
  const error = ref('');

  const isAuthenticated = computed(() => !!token.value);

  const setError = (message) => {
    error.value = message || '';
  };

  const setSession = (payload) => {
    token.value = payload.token;
    user.value = payload.user;
    localStorage.setItem('auth_token', payload.token);
  };

  const clearSession = () => {
    token.value = '';
    user.value = null;
    localStorage.removeItem('auth_token');
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
  });

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: authHeaders(),
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur.');
    }
    return data;
  };

  const register = async ({ email, password, username }) => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      });
      setSession(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const login = async ({ email, password }) => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setSession(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loginWithGoogle = async (idToken) => {
    loading.value = true;
    setError('');
    try {
      const data = await request('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
      setSession(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMe = async () => {
    if (!token.value) return null;
    loading.value = true;
    try {
      const data = await request('/api/auth/me');
      user.value = data.user;
      return data;
    } catch (err) {
      clearSession();
      setError(err.message);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    setError,
    register,
    login,
    loginWithGoogle,
    fetchMe,
    clearSession
  };
});

