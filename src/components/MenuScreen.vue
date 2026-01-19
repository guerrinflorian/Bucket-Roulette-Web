<template>
  <q-page class="flex h-screen items-center justify-center px-4">
    <div class="glass-panel w-full max-w-3xl space-y-10 p-8 text-center shadow-2xl">
      <header class="space-y-3">
        <p class="text-xs uppercase tracking-[0.4em] text-amber-200/80">Expérience Quasar + Tailwind</p>
        <h1 class="text-4xl font-bold text-amber-50 md:text-6xl">Bucket Roulette</h1>
        <p class="text-sm text-amber-100/80 md:text-base">
          Affrontez le capitaine dans une taverne pirate embrumée, sans scroll et pensée pour mobile/PC.
        </p>
      </header>

      <div class="space-y-6">
        <q-btn
          unelevated
          color="primary"
          class="w-full text-base font-bold"
          label="Jouer vs Bot"
          @click="startBot"
        />
        <div class="glass-panel space-y-4 p-6 text-left">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-amber-100">Multijoueur (prototype)</h2>
            <q-badge v-if="netStore.roomId" color="amber" class="text-xs">Room: {{ netStore.roomId }}</q-badge>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <q-btn outline color="secondary" label="Créer une room" @click="createRoom" />
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <q-input
              v-model="roomInput"
              dense
              standout="bg-white/10 text-white"
              placeholder="ID de room"
              class="flex-1 min-w-[180px]"
            />
            <q-btn outline color="secondary" label="Rejoindre" @click="joinRoom" />
          </div>
          <p class="text-xs text-amber-100/70">L'hôte garde l'autorité et envoie l'état.</p>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();
const roomInput = ref('');

const startBot = () => {
  gameStore.initGame('bot');
  router.push('/game');
};

const createRoom = () => {
  netStore.createRoom();
  gameStore.initGame('online');
  router.push('/game');
};

const joinRoom = () => {
  if (!roomInput.value) return;
  netStore.joinRoom(roomInput.value.trim());
  gameStore.initGame('online');
  router.push('/game');
};
</script>

<style scoped></style>
