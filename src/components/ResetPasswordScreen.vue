<template>
  <q-page class="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔐</div>
        <h1 class="text-2xl font-black tracking-wide text-amber-100 mb-1">
          Nouveau mot de passe
        </h1>
        <p class="text-sm text-zinc-500">Choisissez un mot de passe sécurisé</p>
      </div>

      <div class="bg-gradient-to-br from-white/5 to-black/20 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 shadow-2xl shadow-amber-500/10">
        <q-form @submit.prevent="submitReset" class="space-y-4">
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Nouveau mot de passe"
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

          <q-input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirmer le mot de passe"
            filled
            dark
            color="amber"
            label-color="grey-5"
            class="auth-input"
            :rules="[val => !!val || 'Confirmation requise']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="amber-7" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Mettre à jour"
            color="amber"
            text-color="black"
            class="w-full font-bold py-3 rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
            :loading="authStore.loading"
            unelevated
            no-caps
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { Notify } from 'quasar';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const token = ref('');

const submitReset = async () => {
  if (!token.value) {
    Notify.create({ type: 'negative', message: 'Lien invalide.', position: 'top' });
    return;
  }
  if (password.value !== confirmPassword.value) {
    Notify.create({ type: 'negative', message: 'Les mots de passe ne correspondent pas.', position: 'top' });
    return;
  }
  try {
    await authStore.resetPassword({ token: token.value, password: password.value });
    Notify.create({ type: 'positive', message: 'Mot de passe mis à jour.', position: 'top' });
    router.push('/auth');
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error?.message || 'Impossible de mettre à jour le mot de passe.',
      position: 'top'
    });
  }
};

onMounted(() => {
  token.value = route.query.token ? String(route.query.token) : '';
  if (!token.value) {
    Notify.create({ type: 'negative', message: 'Lien de réinitialisation invalide.', position: 'top' });
  }
});
</script>

<style scoped>
.auth-input :deep(.q-field__control) {
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  min-height: 3rem;
}

.auth-input :deep(.q-field__native),
.auth-input :deep(.q-field__input) {
  color: #fef3c7;
}
</style>
