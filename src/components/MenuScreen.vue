<template>
  <div class="container menu">
    <header class="menu__header">
      <h1>Bucket Roulette</h1>
      <p>Affrontez le capitaine dans une taverne pirate embrumée.</p>
    </header>

    <div class="menu__actions">
      <button class="button-primary" @click="startBot">Jouer vs Bot</button>
      <div class="menu__card">
        <h2>Multijoueur (prototype)</h2>
        <div class="menu__row">
          <button class="button-secondary" @click="createRoom">Créer une room</button>
          <span v-if="netStore.roomId" class="menu__room">Room: {{ netStore.roomId }}</span>
        </div>
        <div class="menu__row">
          <input v-model="roomInput" placeholder="ID de room" />
          <button class="button-secondary" @click="joinRoom">Rejoindre</button>
        </div>
        <p class="menu__hint">L'hôte garde l'autorité et envoie l'état.</p>
      </div>
    </div>
  </div>
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

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  text-align: center;
}

.menu__header h1 {
  font-size: 56px;
  margin-bottom: 8px;
}

.menu__actions {
  display: grid;
  gap: 24px;
}

.menu__card {
  background: rgba(0, 0, 0, 0.6);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.menu__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.menu__room {
  font-weight: 700;
  color: #f4e9d9;
}

.menu__hint {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.7;
}

input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 12px;
  border-radius: 8px;
  color: inherit;
}
</style>
