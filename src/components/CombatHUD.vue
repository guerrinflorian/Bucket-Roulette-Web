<template>
  <div class="hud glass-panel space-y-4 p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-amber-200/70">Ennemi</p>
        <p class="text-sm font-semibold">{{ enemy.name }}</p>
      </div>
      <div class="text-xs font-semibold text-amber-100">{{ enemy.hp }} / {{ enemy.maxHp }} PV</div>
    </div>
    <div class="hud__bar">
      <div class="hud__fill" :style="{ width: enemyHpPercent + '%' }"></div>
    </div>

    <div class="hud-banner">
      {{ phase === PHASES.PLAYER_TURN ? 'Votre tour' : phase === PHASES.ENEMY_TURN ? \"Tour de l'ennemi\" : 'En attente' }}
    </div>

    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-amber-200/70">Vous</p>
        <p class="text-sm font-semibold">{{ player.name }}</p>
      </div>
      <div class="text-xs font-semibold text-amber-100">{{ player.hp }} / {{ player.maxHp }} PV</div>
    </div>
    <div class="hud__bar">
      <div class="hud__fill" :style="{ width: playerHpPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { PHASES } from '../engine/rules.js';

const props = defineProps({
  player: Object,
  enemy: Object,
  phase: String
});

const playerHpPercent = computed(() => (props.player.hp / props.player.maxHp) * 100);
const enemyHpPercent = computed(() => (props.enemy.hp / props.enemy.maxHp) * 100);
</script>

<style scoped>
.hud__bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.hud__fill {
  height: 100%;
  background: linear-gradient(90deg, #8d2a2a, #e0582c);
  transition: width 0.4s ease;
}
</style>
