<template>
  <q-page class="auth-page">
    <!-- Background effects -->
    <div class="auth-bg">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="floating-bullets">
        <div class="bullet b1">🔴</div>
        <div class="bullet b2">⚪</div>
        <div class="bullet b3">🔴</div>
        <div class="bullet b4">⚪</div>
        <div class="bullet b5">🔴</div>
      </div>
    </div>

    <div class="auth-container">
      <!-- Logo / Header -->
      <header class="auth-header">
        <div class="logo-icon">🎯</div>
        <h1 class="auth-title">REVOLVER GAMBIT</h1>
        <p class="auth-subtitle">Connectez-vous pour jouer</p>
      </header>

      <!-- Auth Card -->
      <div class="auth-card">
        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          class="auth-tabs"
          indicator-color="amber"
          active-color="amber"
          align="justify"
          narrow-indicator
        >
          <q-tab name="login" label="Connexion" />
          <q-tab name="register" label="Inscription" />
        </q-tabs>

        <q-separator color="white" class="q-mb-lg" style="opacity: 0.08" />

        <!-- Login Form -->
        <q-form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
          <q-input
            v-model="loginEmail"
            type="email"
            label="Email"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            :rules="[val => !!val || 'Email requis', val => /.+@.+\..+/.test(val) || 'Email invalide']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="email" color="amber-7" />
            </template>
          </q-input>

          <q-input
            v-model="loginPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Mot de passe"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            :rules="[val => !!val || 'Mot de passe requis']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="amber-7" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-6"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Se connecter"
            color="amber"
            text-color="black"
            class="auth-submit-btn"
            :loading="authStore.loading"
            unelevated
            no-caps
          >
            <template v-slot:loading>
              <q-spinner-dots color="black" />
            </template>
          </q-btn>
        </q-form>

        <!-- Register Form -->
        <q-form v-else class="auth-form" @submit.prevent="handleRegister">
          <q-input
            v-model="registerEmail"
            type="email"
            label="Email"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            :rules="[val => !!val || 'Email requis', val => /.+@.+\..+/.test(val) || 'Email invalide']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="email" color="amber-7" />
            </template>
          </q-input>

          <q-input
            v-model="registerUsername"
            type="text"
            label="Pseudo"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            hint="Sera affiché en jeu"
            :rules="[
              val => !!val || 'Pseudo requis',
              val => val.length >= 2 || 'Minimum 2 caractères',
              val => val.length <= 12 || 'Maximum 12 caractères',
              val => /^[a-zA-Z0-9_]+$/.test(val) || 'Lettres, chiffres et _ uniquement (sans espaces)'
            ]"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="person" color="amber-7" />
            </template>
          </q-input>

          <q-input
            v-model="registerPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Mot de passe"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            :rules="[val => !!val || 'Mot de passe requis', val => val.length >= 6 || 'Minimum 6 caractères']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="amber-7" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-6"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Créer un compte"
            color="amber"
            text-color="black"
            class="auth-submit-btn"
            :loading="authStore.loading"
            unelevated
            no-caps
          >
            <template v-slot:loading>
              <q-spinner-dots color="black" />
            </template>
          </q-btn>
        </q-form>

        <!-- Google Auth (disabled) -->
        <template v-if="enableGoogle">
          <div class="auth-divider">
            <span class="divider-line"></span>
            <span class="divider-text">ou</span>
            <span class="divider-line"></span>
          </div>

          <div class="google-section">
            <div ref="googleButtonRef" class="google-button"></div>
            <q-btn
              v-if="!googleReady"
              outline
              color="white"
              class="google-fallback-btn"
              no-caps
              @click="initGoogle"
            >
              <q-icon name="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" size="20px" class="q-mr-sm" />
              Continuer avec Google
            </q-btn>
          </div>
        </template>

        <!-- Error message -->
        <q-banner v-if="authStore.error" class="auth-error q-mt-md" rounded>
          <template v-slot:avatar>
            <q-icon name="warning" color="negative" />
          </template>
          {{ authStore.error }}
        </q-banner>
      </div>
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
const showPassword = ref(false);
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
    Notify.create({ type: 'negative', message, icon: 'warning', position: 'top' });
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
    Notify.create({ type: 'negative', message, icon: 'cloud_off', position: 'top' });
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
    position: 'top'
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
    const data = await authStore.register({
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value
    });
    if (data?.requiresVerification) {
      const message = data.emailSent === false
        ? 'Compte créé, mais l’email de confirmation n’a pas pu être envoyé. Contactez le support.'
        : 'Compte créé. Confirmez votre email pour vous connecter.';
      notifyAuthState(data.emailSent === false ? 'negative' : 'positive', message);
      activeTab.value = 'login';
    } else {
      notifyAuthState('positive', 'Compte créé. Bienvenue à bord !');
      router.push('/menu');
    }
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
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0;
}

.auth-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.floating-bullets {
  position: absolute;
  inset: 0;
}

.bullet {
  position: absolute;
  font-size: 20px;
  opacity: 0.15;
  animation: float-bullet 20s ease-in-out infinite;
}

.b1 { top: 15%; left: 10%; animation-delay: 0s; }
.b2 { top: 25%; right: 15%; animation-delay: -4s; }
.b3 { top: 60%; left: 5%; animation-delay: -8s; }
.b4 { top: 70%; right: 8%; animation-delay: -12s; }
.b5 { top: 85%; left: 50%; animation-delay: -16s; }

@keyframes float-bullet {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}

.auth-container {
  position: relative;
  z-index: 1;
  width: min(400px, 90vw);
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vh, 20px);
  padding: clamp(8px, 2vh, 16px);
}

/* Header */
.auth-header {
  text-align: center;
}

.logo-icon {
  font-size: clamp(32px, 6vh, 42px);
  margin-bottom: clamp(4px, 1vh, 8px);
  filter: drop-shadow(0 4px 20px rgba(245, 158, 11, 0.4));
}

.auth-title {
  margin: 0;
  font-size: clamp(20px, 4vh, 26px);
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fef3c7;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
}

.auth-subtitle {
  margin: clamp(4px, 1vh, 6px) 0 0;
  color: #71717a;
  font-size: clamp(12px, 2vh, 13px);
}

/* Card */
.auth-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.2) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 16px;
  padding: clamp(16px, 3vh, 20px);
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 80px rgba(245, 158, 11, 0.05);
}

/* Tabs */
.auth-tabs {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 3px;
}

.auth-tabs :deep(.q-tab) {
  border-radius: 7px;
  min-height: clamp(36px, 5vh, 40px);
  font-weight: 700;
  letter-spacing: 0.05em;
  font-size: clamp(12px, 2vh, 14px);
}

.auth-tabs :deep(.q-tab--active) {
  background: rgba(245, 158, 11, 0.15);
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2vh, 14px);
}

.auth-input {
  border-radius: 10px;
}

.auth-input :deep(.q-field__control) {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.4);
  min-height: clamp(48px, 7vh, 56px);
}

.auth-input :deep(.q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.1);
}

.auth-input :deep(.q-field__control:hover:before) {
  border-color: rgba(245, 158, 11, 0.4);
}

.auth-input :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}

.auth-input :deep(.q-field__native),
.auth-input :deep(.q-field__input) {
  color: #fef3c7;
  font-size: clamp(13px, 2vh, 15px);
}

.auth-input :deep(.q-field__label) {
  font-size: clamp(12px, 2vh, 14px);
}

.auth-input :deep(.q-field__bottom) {
  padding-top: 4px;
  min-height: 16px;
  font-size: 11px;
}

.auth-submit-btn {
  margin-top: clamp(4px, 1vh, 6px);
  padding: clamp(10px, 2vh, 12px) clamp(16px, 3vh, 20px);
  border-radius: 10px;
  font-size: clamp(13px, 2vh, 15px);
  font-weight: 700;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
  transition: all 0.2s;
}

.auth-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.4);
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: clamp(12px, 2vh, 16px) 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.divider-text {
  font-size: 11px;
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Google */
.google-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.google-button {
  min-height: 40px;
}

.google-fallback-btn {
  border-color: rgba(255, 255, 255, 0.15);
  padding: 8px 16px;
  border-radius: 10px;
  font-size: clamp(12px, 2vh, 14px);
}

/* Error */
.auth-error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fecaca;
  padding: 10px 12px;
  font-size: clamp(11px, 2vh, 13px);
}

.auth-error :deep(.q-banner__avatar) {
  min-width: 32px;
}

.auth-error :deep(.q-icon) {
  font-size: 20px;
}

/* Responsive - Mobile portrait */
@media (max-width: 480px) {
  .auth-page {
    padding: 8px 0;
  }

  .auth-container {
    width: 94vw;
    max-height: 98vh;
    padding: 8px;
    gap: 10px;
  }

  .auth-card {
    padding: 14px 12px;
    border-radius: 14px;
  }

  .auth-form {
    gap: 10px;
  }

  .auth-input :deep(.q-field__bottom) {
    min-height: 14px;
    font-size: 10px;
  }
}

/* Responsive - Small height screens */
@media (max-height: 700px) {
  .auth-container {
    gap: 8px;
    max-height: 96vh;
  }

  .logo-icon {
    font-size: 32px;
    margin-bottom: 4px;
  }

  .auth-title {
    font-size: 20px;
  }

  .auth-subtitle {
    margin: 4px 0 0;
    font-size: 11px;
  }

  .auth-card {
    padding: 14px;
  }

  .auth-form {
    gap: 8px;
  }

  .auth-input :deep(.q-field__control) {
    min-height: 48px;
  }

  .auth-input :deep(.q-field__bottom) {
    min-height: 12px;
    padding-top: 2px;
  }

  .auth-submit-btn {
    padding: 10px 16px;
    margin-top: 4px;
  }
}

/* Responsive - Very small height */
@media (max-height: 600px) {
  .auth-container {
    gap: 6px;
  }

  .logo-icon {
    font-size: 28px;
    margin-bottom: 2px;
  }

  .auth-title {
    font-size: 18px;
  }

  .auth-subtitle {
    display: none;
  }

  .auth-card {
    padding: 12px;
  }

  .auth-tabs {
    padding: 2px;
  }

  .auth-tabs :deep(.q-tab) {
    min-height: 34px;
    font-size: 12px;
  }

  .auth-form {
    gap: 6px;
  }

  .auth-input :deep(.q-field__control) {
    min-height: 44px;
  }

  .auth-input :deep(.q-field__bottom) {
    display: none;
  }

  .auth-submit-btn {
    padding: 8px 14px;
    margin-top: 2px;
  }
}
</style>
