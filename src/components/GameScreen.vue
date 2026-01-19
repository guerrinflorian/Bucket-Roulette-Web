<template>
  <div class="container game">
    <div class="game__header">
      <button class="button-secondary" @click="backToMenu">Retour menu</button>
      <div class="game__room" v-if="netStore.roomId">Room: {{ netStore.roomId }}</div>
    </div>

    <CombatHUD :player="players.player" :enemy="players.enemy" :phase="phase" />

    <TableCenter
      :barrel="barrel"
      :counts="counts"
      :last-action="lastAction"
    />

    <ActionButtons
      :disabled="phase !== PHASES.PLAYER_TURN"
      @shoot-enemy="shootEnemy"
      @shoot-self="shootSelf"
    />

    <ItemsPanel
      :items="players.player.items"
      :disabled="phase !== PHASES.PLAYER_TURN"
      :peeked-next="players.player.peekedNext"
      @use-item="useItem"
    />

    <ResultToast :text="lastResult?.text" />

    <CoinFlipModal
      v-if="phase === PHASES.COIN_FLIP"
      @resolved="onCoinFlip"
    />

    <div v-if="phase === PHASES.GAME_OVER" class="game__over">
      <div class="game__over-card">
        <h2>{{ winner === 'player' ? 'Victoire !' : 'Défaite...' }}</h2>
        <button class="button-primary" @click="restart">Rejouer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import { PHASES } from '../engine/rules.js';
import CombatHUD from './CombatHUD.vue';
import TableCenter from './TableCenter.vue';
import ActionButtons from './ActionButtons.vue';
import ItemsPanel from './ItemsPanel.vue';
import ResultToast from './ResultToast.vue';
import CoinFlipModal from './CoinFlipModal.vue';

const router = useRouter();
const gameStore = useGameStore();
const netStore = useNetStore();

const players = computed(() => gameStore.players);
const phase = computed(() => gameStore.phase);
const barrel = computed(() => gameStore.barrel);
const counts = computed(() => gameStore.counts);
const lastResult = computed(() => gameStore.lastResult);
const lastAction = computed(() => gameStore.lastAction);
const winner = computed(() => gameStore.winner);

const shootEnemy = () => gameStore.shoot('enemy');
const shootSelf = () => gameStore.shoot('self');
const useItem = (itemId) => gameStore.useItem(itemId, 'player');

const onCoinFlip = (starts) => {
  gameStore.setCoinFlipResult(starts);
};

const restart = () => {
  gameStore.initGame(gameStore.mode);
};

const backToMenu = () => {
  router.push('/menu');
};

onMounted(() => {
  if (gameStore.players.player.items.length === 0) {
    gameStore.initGame('bot');
  }
});
</script>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.game__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.game__room {
  font-weight: 700;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 999px;
}

.game__over {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: grid;
  place-items: center;
  z-index: 20;
}

.game__over-card {
  background: rgba(20, 10, 6, 0.95);
  padding: 32px 48px;
  border-radius: 18px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
