<template>
  <q-page class="game h-screen px-4 py-4 md:px-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <q-btn flat color="amber" icon="arrow_back" label="Retour menu" @click="backToMenu" />
        <q-badge v-if="netStore.roomId" color="amber" class="text-xs">Room: {{ netStore.roomId }}</q-badge>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="hud-banner">{{ phaseLabel }}</div>
        <div class="glass-panel flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.3em] text-amber-200/80">
          <span>Temps</span>
          <span class="text-base font-bold text-amber-50">{{ turnTimeLeft }}</span>
        </div>
      </div>
    </header>

    <section class="mt-4 grid flex-1 grid-cols-1 gap-4 md:grid-cols-[1.35fr_0.85fr]">
      <div class="flex min-h-0 flex-col gap-4">
        <BattleStage
          :player="players.player"
          :enemy="players.enemy"
          :barrel="barrel"
          :counts="counts"
          :last-action="lastAction"
          :enemy-avatar="enemyAvatar"
          :player-avatar="playerAvatar"
        />
        <div class="glass-panel flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.2em] text-amber-100/70">
          <span>Action rapide</span>
          <span v-if="lastResult?.text" class="text-amber-50">{{ lastResult.text }}</span>
        </div>
      </div>
      <div class="flex min-h-0 flex-col gap-4">
        <CombatHUD :player="players.player" :enemy="players.enemy" :phase="phase" />
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
      </div>
    </section>

    <ActionNotice :action="lastAction" :result="lastResult" />

    <CoinFlipModal v-if="phase === PHASES.COIN_FLIP" @resolved="onCoinFlip" />

    <div v-if="phase === PHASES.GAME_OVER" class="game__over">
      <div class="game__over-card">
        <h2 class="text-2xl font-bold">{{ winner === 'player' ? 'Victoire !' : 'Défaite...' }}</h2>
        <button class="button-primary mt-4" @click="restart">Rejouer</button>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useNetStore } from '../stores/netStore.js';
import { PHASES } from '../engine/rules.js';
import CombatHUD from './CombatHUD.vue';
import ActionButtons from './ActionButtons.vue';
import ItemsPanel from './ItemsPanel.vue';
import CoinFlipModal from './CoinFlipModal.vue';
import BattleStage from './BattleStage.vue';
import ActionNotice from './ActionNotice.vue';

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
const phaseLabel = computed(() => {
  if (phase.value === PHASES.PLAYER_TURN) return 'Votre tour';
  if (phase.value === PHASES.ENEMY_TURN) return "Tour de l'ennemi";
  return 'En attente';
});

const enemyAvatar = '/src/assets/portraits/enemy_front.svg';
const playerAvatar = '/src/assets/portraits/player_back.svg';

const TURN_DURATION = 15;
const turnTimeLeft = ref(TURN_DURATION);
let timerId;

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

const startTimer = () => {
  clearInterval(timerId);
  if (phase.value !== PHASES.PLAYER_TURN && phase.value !== PHASES.ENEMY_TURN) {
    turnTimeLeft.value = 0;
    return;
  }
  turnTimeLeft.value = TURN_DURATION;
  timerId = setInterval(() => {
    if (turnTimeLeft.value > 0) {
      turnTimeLeft.value -= 1;
    }
    if (turnTimeLeft.value === 0) {
      clearInterval(timerId);
      if (phase.value === PHASES.PLAYER_TURN) {
        gameStore.shoot('enemy');
      }
    }
  }, 1000);
};

watch(phase, () => startTimer(), { immediate: true });

onBeforeUnmount(() => clearInterval(timerId));
</script>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  position: relative;
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
