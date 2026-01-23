<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="profile-settings-card">
      <q-card-section class="profile-settings-header">
        <div class="profile-settings-title">Mon profil</div>
        <div class="profile-settings-subtitle">Gérez votre pseudo et votre sécurité</div>
      </q-card-section>

      <q-separator dark class="q-my-sm" />

      <q-card-section class="profile-settings-body">
        <div class="profile-settings-section">
          <div class="section-title">Pseudo</div>
          <q-input
            v-model="username"
            filled
            dark
            color="amber"
            label="Nouveau pseudo"
            class="profile-settings-input"
            :rules="usernameRules"
            lazy-rules
          />
          <div class="section-hint">
            Votre pseudo actuel : <strong>{{ currentUsername }}</strong>
          </div>
          <q-btn
            color="amber"
            text-color="black"
            class="w-full font-bold"
            :loading="authStore.loading"
            :disable="!canUpdateUsername"
            unelevated
            no-caps
            @click="submitUsername"
          >
            Mettre à jour le pseudo
          </q-btn>
        </div>

        <q-separator dark class="q-my-md" />

        <div class="profile-settings-section">
          <div class="section-title">Mot de passe</div>
          <div class="section-hint">
            Connecté avec :
            <strong>{{ authProviderLabel }}</strong>
          </div>
          <div v-if="!hasPasswordProvider" class="section-hint">
            Votre compte utilise Google. Le mot de passe est géré depuis Google.
          </div>
          <div v-else class="section-hint">
            Un lien sécurisé sera envoyé à <strong>{{ authStore.user?.email }}</strong>.
          </div>
          <q-btn
            outline
            color="amber"
            class="w-full font-bold"
            :loading="authStore.loading"
            :disable="!hasPasswordProvider"
            no-caps
            @click="requestPasswordReset"
          >
            Envoyer le lien de changement de mot de passe
          </q-btn>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat color="grey-4" no-caps @click="closeDialog">Fermer</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { Notify } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const authStore = useAuthStore();
const username = ref('');
const authProviders = computed(() => authStore.user?.authProviders || []);
const hasPasswordProvider = computed(() => authProviders.value.includes('password'));
const hasGoogleProvider = computed(() => authProviders.value.includes('google'));
const authProviderLabel = computed(() => {
  if (hasPasswordProvider.value && hasGoogleProvider.value) {
    return 'Email + Google';
  }
  if (hasGoogleProvider.value) {
    return 'Google';
  }
  if (hasPasswordProvider.value) {
    return 'Email';
  }
  return 'Inconnu';
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const currentUsername = computed(() => authStore.user?.username || 'Non défini');

const usernameRules = [
  (val) => !!val || 'Pseudo requis',
  (val) => val.length >= 2 || 'Minimum 2 caractères',
  (val) => val.length <= 12 || 'Maximum 12 caractères',
  (val) => /^[a-zA-Z0-9_]+$/.test(val) || 'Lettres, chiffres et _ uniquement'
];

const canUpdateUsername = computed(() => {
  const trimmed = username.value.trim();
  return trimmed.length >= 2 && trimmed.length <= 12 && trimmed !== (authStore.user?.username || '');
});

const submitUsername = async () => {
  try {
    const trimmed = username.value.trim();
    if (!trimmed) {
      Notify.create({ type: 'negative', message: 'Pseudo requis.', position: 'top' });
      return;
    }
    await authStore.updateUsername(trimmed);
    Notify.create({ type: 'positive', message: 'Pseudo mis à jour.', position: 'top' });
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error?.message || 'Impossible de mettre à jour le pseudo.',
      position: 'top'
    });
  }
};

const requestPasswordReset = async () => {
  try {
    await authStore.requestPasswordReset();
    Notify.create({
      type: 'positive',
      message: 'Lien de changement de mot de passe envoyé.',
      position: 'top'
    });
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error?.message || 'Impossible d\'envoyer le lien.',
      position: 'top'
    });
  }
};

const closeDialog = () => {
  emit('update:modelValue', false);
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      username.value = authStore.user?.username || '';
    }
  }
);
</script>

<style scoped>
.profile-settings-card {
  width: 100%;
  max-width: 460px;
  background: rgba(13, 16, 24, 0.98);
  border: 1px solid rgba(251, 191, 36, 0.18);
  border-radius: 18px;
  color: #e2e8f0;
}

.profile-settings-header {
  padding: 18px 20px 8px;
}

.profile-settings-title {
  font-size: 20px;
  font-weight: 800;
  color: #fff7ed;
}

.profile-settings-subtitle {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.profile-settings-body {
  padding: 8px 20px 16px;
}

.profile-settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #fef3c7;
}

.section-hint {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.profile-settings-input :deep(.q-field__control) {
  border-radius: 10px;
}
</style>
