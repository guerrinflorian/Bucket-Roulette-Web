<template>
  <q-page class="auth-page">
    <div class="auth-container">
      <header class="auth-header">
        <h1>Bienvenue</h1>
        <p>Connectez-vous pour sauvegarder votre progression</p>
      </header>

      <div class="auth-card">
        <div class="auth-tabs">
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
          >
            Connexion
          </button>
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'register' }"
            @click="activeTab = 'register'"
          >
            Inscription
          </button>
        </div>

        <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
          <label class="field">
            <span>Email</span>
            <input v-model="loginEmail" type="email" placeholder="exemple@email.com" required />
          </label>
          <label class="field">
            <span>Mot de passe</span>
            <input v-model="loginPassword" type="password" placeholder="••••••••" required />
          </label>
          <button class="primary-btn" :disabled="authStore.loading">
            {{ authStore.loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <form v-else class="auth-form" @submit.prevent="handleRegister">
          <label class="field">
            <span>Email</span>
            <input v-model="registerEmail" type="email" placeholder="exemple@email.com" required />
          </label>
          <label class="field">
            <span>Pseudo</span>
            <input v-model="registerUsername" type="text" placeholder="Votre pseudo" />
          </label>
          <label class="field">
            <span>Mot de passe</span>
            <input v-model="registerPassword" type="password" placeholder="••••••••" required />
          </label>
          <button class="primary-btn" :disabled="authStore.loading">
            {{ authStore.loading ? 'Création...' : 'Créer un compte' }}
          </button>
        </form>

        <div v-if="enableGoogle">
          <div class="divider">
            <span>ou</span>
          </div>

          <div class="google-section">
            <div ref="googleButtonRef" class="google-button"></div>
            <button v-if="!googleReady" class="secondary-btn" @click="initGoogle">
              Continuer avec Google
            </button>
          </div>
        </div>

        <div v-if="authStore.error" class="auth-error">
          ⚠️ {{ authStore.error }}
        </div>
      </div>

      <button class="back-btn" @click="goBack">← Retour au menu</button>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('login');
const loginEmail = ref('');
const loginPassword = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerUsername = ref('');
const enableGoogle = false;
const googleButtonRef = ref(null);
const googleReady = ref(false);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

const initGoogle = async () => {
  if (!clientId) {
    authStore.setError('Google non configuré sur le client.');
    return;
  }
  try {
    await loadGoogleScript();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        await authStore.loginWithGoogle(response.credential);
        router.push('/menu');
      }
    });
    window.google.accounts.id.renderButton(googleButtonRef.value, {
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'continue_with'
    });
    googleReady.value = true;
  } catch (error) {
    authStore.setError('Impossible de charger Google.');
  }
};

const handleLogin = async () => {
  try {
    await authStore.login({ email: loginEmail.value, password: loginPassword.value });
    router.push('/menu');
  } catch (error) {
    // Erreur déjà stockée dans authStore
  }
};

const handleRegister = async () => {
  try {
    await authStore.register({
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value
    });
    router.push('/menu');
  } catch (error) {
    // Erreur déjà stockée dans authStore
  }
};

const goBack = () => router.push('/menu');

onMounted(() => {
  if (enableGoogle) {
    initGoogle();
  }
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(15, 10, 5, 0.95), rgba(6, 4, 3, 0.98));
}

.auth-container {
  width: min(420px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px 24px;
}

.auth-header h1 {
  margin: 0;
  font-size: 28px;
  color: #f59e0b;
}

.auth-header p {
  margin: 6px 0 0;
  color: #a1a1aa;
  font-size: 14px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.auth-tab {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.4);
  color: #a1a1aa;
  font-weight: 700;
  cursor: pointer;
}

.auth-tab.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(180, 83, 9, 0.2));
  color: #fef3c7;
  border-color: rgba(245, 158, 11, 0.4);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #a1a1aa;
  font-size: 12px;
}

.field input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.6);
  color: #fef3c7;
}

.field input:focus {
  outline: none;
  border-color: rgba(245, 158, 11, 0.6);
  box-shadow: 0 0 18px rgba(245, 158, 11, 0.25);
}

.primary-btn {
  margin-top: 6px;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #0a0a0f;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  margin: 18px 0 10px;
  text-align: center;
  color: #52525b;
  font-size: 12px;
  text-transform: uppercase;
}

.divider span {
  background: rgba(0, 0, 0, 0.6);
  padding: 0 8px;
}

.google-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.google-button {
  min-height: 44px;
}

.secondary-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.5);
  color: #fef3c7;
  cursor: pointer;
}

.auth-error {
  margin-top: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.back-btn {
  align-self: center;
  background: none;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
}
</style>

