<template>
  <q-page class="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background effects -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Gradient effects -->
      <div class="absolute inset-0 bg-gradient-radial"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <!-- Grid -->
      <div class="absolute inset-0 bg-grid opacity-20"></div>
      
      <!-- Floating bullets -->
      <div class="floating-bullet text-2xl opacity-10 top-[15%] left-[10%]">🔴</div>
      <div class="floating-bullet text-2xl opacity-10 top-[25%] right-[15%] animation-delay-4">⚪</div>
      <div class="floating-bullet text-2xl opacity-10 top-[60%] left-[5%] animation-delay-8">🔴</div>
      <div class="floating-bullet text-2xl opacity-10 top-[70%] right-[8%] animation-delay-12">⚪</div>
      <div class="floating-bullet text-2xl opacity-10 bottom-[10%] left-1/2 animation-delay-16">🔴</div>
    </div>

    <!-- Auth Container -->
    <div class="w-full max-w-md relative z-10">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-3 drop-shadow-glow">🎯</div>
        <h1 class="text-3xl font-black tracking-widest text-amber-100 mb-2 text-shadow-glow">
          REVOLVER GAMBIT
        </h1>
        <p class="text-sm text-zinc-500">Connectez-vous pour jouer</p>
      </div>

      <!-- Auth Card -->
      <div class="bg-gradient-to-br from-white/5 to-black/20 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 shadow-2xl shadow-amber-500/10">
        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          class="bg-black/30 rounded-xl mb-6"
          indicator-color="amber"
          active-color="amber"
          align="justify"
          narrow-indicator
        >
          <q-tab 
            name="login" 
            label="Connexion"
            class="font-bold text-sm tracking-wide"
          />
          <q-tab 
            name="register" 
            label="Inscription"
            class="font-bold text-sm tracking-wide"
          />
        </q-tabs>

        <q-separator color="white" class="mb-6 opacity-5" />

        <!-- Login Form -->
        <q-form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
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

          <div class="flex items-center justify-between text-xs">
            <span class="text-zinc-500">Besoin d'aide pour vous connecter ?</span>
            <q-btn
              flat
              dense
              no-caps
              class="text-amber-200 hover:text-amber-100 px-0"
              @click="handleForgotPassword"
            >
              Mot de passe oublié ?
            </q-btn>
          </div>

          <q-btn
            type="submit"
            label="Se connecter"
            color="amber"
            text-color="black"
            class="w-full font-bold py-3 rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
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
        <q-form v-else @submit.prevent="handleRegister" class="space-y-4">
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
            hint="2-12 caractères, lettres/chiffres/_"
            :rules="[
              val => !!val || 'Pseudo requis',
              val => val.length >= 2 || 'Minimum 2 caractères',
              val => val.length <= 12 || 'Maximum 12 caractères',
              val => /^[a-zA-Z0-9_]+$/.test(val) || 'Lettres, chiffres et _ uniquement'
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
            hint="Minimum 6 caractères"
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

          <q-checkbox
            v-model="registerConsent"
            color="amber"
            dark
            class="text-sm"
          >
            <span class="text-zinc-300">
              J'accepte la politique de confidentialité (RGPD)
            </span>
            <q-icon name="info" size="16px" class="ml-1 text-zinc-500">
              <q-tooltip class="bg-zinc-900 border border-zinc-700 text-xs max-w-xs">
                Vos données sont utilisées pour créer votre compte, vous contacter en cas de besoin
                et assurer le bon fonctionnement du service.
              </q-tooltip>
            </q-icon>
          </q-checkbox>

          <q-btn
            type="submit"
            label="Créer un compte"
            color="amber"
            text-color="black"
            class="w-full font-bold py-3 rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
            :loading="authStore.loading"
            unelevated
            no-caps
          >
            <template v-slot:loading>
              <q-spinner-dots color="black" />
            </template>
          </q-btn>
        </q-form>

        <!-- Google Auth -->
        <template v-if="enableGoogle">
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <span class="text-xs text-zinc-600 uppercase tracking-wider">ou</span>
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div ref="googleButtonRef" class="google-button min-h-[40px]"></div>
            <q-btn
              v-if="!googleReady"
              outline
              color="white"
              class="w-full border-white/15 rounded-lg hover:border-amber-500/40 transition-all"
              no-caps
              @click="initGoogle"
            >
              <q-icon name="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" size="20px" class="mr-2" />
              Continuer avec Google
            </q-btn>
          </div>
        </template>

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
const registerConsent = ref(false);
const showPassword = ref(false);
const enableGoogle = true;
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
        try {
          const data = await authStore.loginWithGoogle(response.credential);
          
          if (data?.requiresVerification) {
             authStore.clearSession();
             const message = 'Veuillez confirmer votre email avant de vous connecter.';
             notifyAuthState('warning', message);
             return;
          }

          notifyAuthState('positive', 'Connexion Google réussie. Bon jeu !');
          router.push('/menu');
        } catch (error) {
          const message = resolveAuthMessage(error?.message || authStore.error);
          authStore.setError(message);
          notifyAuthState('negative', message);
        }
      }
    });
    window.google.accounts.id.renderButton(googleButtonRef.value, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
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
  const isNetworkError = (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('network error') ||
    normalized.includes('connexion au serveur') ||
    normalized.includes('impossible de se connecter')
  );
  if (isNetworkError) {
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
    const data = await authStore.login({ email: loginEmail.value, password: loginPassword.value });
    
    if (data?.requiresVerification) {
      authStore.clearSession(); // Ensure no partial state remains
      const message = 'Veuillez confirmer votre email avant de vous connecter.';
      notifyAuthState('warning', message);
      return; 
    }

    notifyAuthState('positive', 'Connexion réussie. Bon jeu !');
    router.push('/menu');
  } catch (error) {
    const message = resolveAuthMessage(error?.message || authStore.error);
    authStore.setError(message);
    notifyAuthState('negative', message);
  }
};

const handleForgotPassword = async () => {
  const trimmedEmail = loginEmail.value.trim();
  if (!trimmedEmail) {
    Notify.create({
      type: 'warning',
      message: 'Entrez votre email pour recevoir le lien de réinitialisation.',
      position: 'top'
    });
    return;
  }
  if (!/.+@.+\..+/.test(trimmedEmail)) {
    Notify.create({
      type: 'warning',
      message: 'Merci de renseigner un email valide.',
      position: 'top'
    });
    return;
  }
  try {
    const data = await authStore.requestPasswordResetByEmail(trimmedEmail);
    Notify.create({
      type: 'positive',
      message: data?.message || 'Si un compte existe, un email de réinitialisation a été envoyé.',
      position: 'top'
    });
  } catch (error) {
    const message = resolveAuthMessage(error?.message || authStore.error);
    authStore.setError(message);
    Notify.create({ type: 'negative', message, position: 'top' });
  }
};

const handleRegister = async () => {
  if (!registerConsent.value) {
    const message = 'Merci de valider votre consentement RGPD pour continuer.';
    authStore.setError(message);
    notifyAuthState('negative', message);
    return;
  }
  try {
    const data = await authStore.register({
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value
    });
    if (data?.requiresVerification) {
      const message = data.emailSent === false
        ? 'Compte créé, mais l\'email de confirmation n\'a pas pu être envoyé. Contactez le support.'
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
  if (enableGoogle && clientId) {
    initGoogle();
  }
});

watch(activeTab, () => {
  authStore.setError('');
});
</script>

<style scoped>
/* Background effects */
.bg-grid {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.bg-gradient-radial {
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%);
}

.drop-shadow-glow {
  filter: drop-shadow(0 4px 20px rgba(245, 158, 11, 0.4));
}

.text-shadow-glow {
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.4);
}

/* Floating bullets animation */
.floating-bullet {
  position: absolute;
  animation: float 20s ease-in-out infinite;
}

.animation-delay-4 { animation-delay: -4s; }
.animation-delay-8 { animation-delay: -8s; }
.animation-delay-12 { animation-delay: -12s; }
.animation-delay-16 { animation-delay: -16s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}

/* Custom Quasar overrides with Tailwind approach */
.auth-input :deep(.q-field__control) {
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  min-height: 3rem;
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
}

/* Tabs styling */
:deep(.q-tab) {
  border-radius: 0.5rem;
  min-height: 2.5rem;
  transition: all 0.2s;
}

:deep(.q-tab--active) {
  background: rgba(245, 158, 11, 0.15);
}

/* Google button container */
.google-button {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
