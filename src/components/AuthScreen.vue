<template>
  <q-page class="auth-page">
    <div class="auth-container">
      <div class="auth-hero">
        <header class="auth-header">
          <div class="flex items-center gap-3">
            <q-avatar size="44px" class="auth-avatar">
              <q-icon name="casino" size="28px" />
            </q-avatar>
            <div>
              <h1>Bienvenue</h1>
              <p>Connectez-vous pour sauvegarder votre progression.</p>
            </div>
          </div>
        </header>
      </div>

      <q-card class="auth-card">
        <q-card-section class="auth-card-header">
          <div>
            <div class="text-lg font-semibold text-amber-2">Espace joueur</div>
            <div class="text-xs text-zinc-400">Retrouvez vos stats et votre historique.</div>
          </div>
          <q-chip dense color="amber-1" text-color="dark" icon="shield">
            Accès sécurisé
          </q-chip>
        </q-card-section>

        <q-separator dark />

        <q-card-section class="auth-tabs">
          <q-tabs v-model="activeTab" dense active-color="amber-4" indicator-color="amber-4">
            <q-tab name="login" icon="login" label="Connexion" />
            <q-tab name="register" icon="person_add" label="Inscription" />
          </q-tabs>
        </q-card-section>

        <q-separator dark />

        <q-card-section class="auth-form-section">
          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="login" class="px-0">
              <q-form class="auth-form" @submit.prevent="handleLogin">
                <q-input
                  v-model="loginEmail"
                  type="email"
                  label="Email"
                  placeholder="exemple@email.com"
                  dense
                  filled
                  hide-bottom-space
                  :rules="[val => !!val || 'Email requis']"
                >
                  <template #prepend>
                    <q-icon name="mail" />
                  </template>
                </q-input>
                <q-input
                  v-model="loginPassword"
                  type="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  dense
                  filled
                  hide-bottom-space
                  :rules="[val => !!val || 'Mot de passe requis']"
                >
                  <template #prepend>
                    <q-icon name="lock" />
                  </template>
                </q-input>
                <q-btn
                  type="submit"
                  color="amber-6"
                  text-color="black"
                  class="primary-btn"
                  :loading="authStore.loading"
                  unelevated
                >
                  Se connecter
                </q-btn>
              </q-form>
            </q-tab-panel>

            <q-tab-panel name="register" class="px-0">
              <q-form class="auth-form" @submit.prevent="handleRegister">
                <q-input
                  v-model="registerEmail"
                  type="email"
                  label="Email"
                  placeholder="exemple@email.com"
                  dense
                  filled
                  hide-bottom-space
                  :rules="[val => !!val || 'Email requis']"
                >
                  <template #prepend>
                    <q-icon name="mail" />
                  </template>
                </q-input>
                <q-input
                  v-model="registerUsername"
                  type="text"
                  label="Pseudo"
                  placeholder="Votre pseudo"
                  dense
                  filled
                  hide-bottom-space
                >
                  <template #prepend>
                    <q-icon name="badge" />
                  </template>
                </q-input>
                <q-input
                  v-model="registerPassword"
                  type="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  dense
                  filled
                  hide-bottom-space
                  :rules="[val => !!val || 'Mot de passe requis']"
                >
                  <template #prepend>
                    <q-icon name="lock" />
                  </template>
                </q-input>
                <q-btn
                  type="submit"
                  color="amber-6"
                  text-color="black"
                  class="primary-btn"
                  :loading="authStore.loading"
                  unelevated
                >
                  Créer un compte
                </q-btn>
              </q-form>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-section v-if="enableGoogle" class="pt-0">
          <div class="divider">
            <span>ou</span>
          </div>

          <div class="google-section">
            <div ref="googleButtonRef" class="google-button"></div>
            <q-btn
              v-if="!googleReady"
              outline
              color="blue-grey-2"
              text-color="white"
              class="secondary-btn"
              icon="google"
              label="Continuer avec Google"
              @click="initGoogle"
            />
          </div>
        </q-card-section>

        <q-card-section v-if="authStore.error" class="pt-0">
          <q-banner dense rounded class="auth-error" icon="error">
            {{ authStore.error }}
          </q-banner>
        </q-card-section>

      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { Notify } from 'quasar';
import { onMounted, ref, watch } from 'vue';
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
    const message = 'Google non configuré sur le client.';
    authStore.setError(message);
    Notify.create({ type: 'negative', message, icon: 'warning' });
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
    const message = 'Impossible de charger Google.';
    authStore.setError(message);
    Notify.create({ type: 'negative', message, icon: 'cloud_off' });
  }
};

const resolveAuthMessage = (message) => {
  const normalized = String(message || '').toLowerCase();
  if (!normalized) {
    return 'Une erreur est survenue. Merci de réessayer.';
  }
  if (
    normalized.includes('identifiant')
    || normalized.includes('invalid')
    || normalized.includes('incorrect')
    || normalized.includes('password')
  ) {
    return 'Identifiants invalides. Vérifiez votre email et votre mot de passe.';
  }
  if (normalized.includes('existe') || normalized.includes('already')) {
    return 'Ce compte existe déjà. Essayez de vous connecter.';
  }
  if (normalized.includes('connexion') || normalized.includes('network') || normalized.includes('fetch')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.';
  }
  return message;
};

const notifyAuthState = (status, message) => {
  Notify.create({
    type: status,
    message,
    icon: status === 'positive' ? 'check_circle' : 'error',
    position: 'top-right'
  });
};

const handleLogin = async () => {
  try {
    await authStore.login({ email: loginEmail.value, password: loginPassword.value });
    notifyAuthState('positive', 'Connexion réussie. Bon jeu !');
    router.push('/menu');
  } catch (error) {
    const message = resolveAuthMessage(error?.message || authStore.error);
    authStore.setError(message);
    notifyAuthState('negative', message);
  }
};

const handleRegister = async () => {
  try {
    await authStore.register({
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value
    });
    notifyAuthState('positive', 'Compte créé. Bienvenue à bord !');
    router.push('/menu');
  } catch (error) {
    const message = resolveAuthMessage(error?.message || authStore.error);
    authStore.setError(message);
    notifyAuthState('negative', message);
  }
};

onMounted(() => {
  if (enableGoogle) {
    initGoogle();
  }
});

watch(activeTab, () => {
  authStore.setError('');
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(23, 14, 8, 0.97), rgba(4, 4, 6, 0.98));
  position: relative;
  overflow: hidden;
}

.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.15), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(245, 158, 11, 0.12), transparent 50%);
  pointer-events: none;
}

.auth-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

.auth-hero {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px 22px;
}

.auth-header h1 {
  margin: 0;
  font-size: 28px;
  color: #fde68a;
  font-weight: 700;
}

.auth-header p {
  margin: 4px 0 0;
  color: #d4d4d8;
  font-size: 13px;
}

.auth-avatar {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.8), rgba(217, 119, 6, 0.9));
  color: #1c1917;
}

.auth-card {
  background: rgba(11, 10, 13, 0.78);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
}

.auth-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auth-tabs {
  padding-top: 10px;
  padding-bottom: 4px;
}

.auth-form-section {
  padding-top: 18px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.primary-btn {
  margin-top: 8px;
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.divider {
  margin: 14px 0 6px;
  text-align: center;
  color: #71717a;
  font-size: 11px;
  text-transform: uppercase;
}

.divider span {
  background: rgba(5, 5, 7, 0.8);
  padding: 0 10px;
}

.google-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.google-button {
  min-height: 44px;
}

.secondary-btn {
  width: 100%;
  border-radius: 12px;
}

.auth-error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
}

:deep(.q-tab) {
  text-transform: none;
  font-weight: 600;
}

:deep(.q-field--filled .q-field__control) {
  background: linear-gradient(135deg, rgba(24, 20, 26, 0.95), rgba(10, 9, 14, 0.95));
  border-radius: 12px;
}

:deep(.q-field--filled .q-field__control:before) {
  border-bottom: 1px solid rgba(245, 158, 11, 0.25);
}

:deep(.q-field--filled.q-field--focused .q-field__control:after) {
  color: rgba(245, 158, 11, 0.85);
}

:deep(.q-field__label) {
  color: #f8fafc;
  font-weight: 600;
}

:deep(.q-field__native) {
  color: #fef3c7;
}

:deep(.q-field__prepend) {
  color: rgba(245, 158, 11, 0.75);
}

:deep(.q-field--focused .q-field__prepend) {
  color: rgba(245, 158, 11, 1);
}

:deep(.q-banner__content) {
  font-size: 13px;
}
</style>
