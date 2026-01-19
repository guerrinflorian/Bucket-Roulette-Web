<template>
  <div class="hud">
    <div class="hud__row">
      <div class="hud__portrait">
        <img src="/src/assets/portraits/enemy_front.svg" alt="Enemy" />
      </div>
      <div class="hud__info">
        <h3>{{ enemy.name }}</h3>
        <div class="hud__bar">
          <div class="hud__fill" :style="{ width: enemyHpPercent + '%' }"></div>
        </div>
        <span>{{ enemy.hp }} / {{ enemy.maxHp }} PV</span>
      </div>
    </div>

    <div class="banner">
      {{ phase === PHASES.PLAYER_TURN ? 'VOTRE TOUR' : phase === PHASES.ENEMY_TURN ? "TOUR DE L'ENNEMI" : 'EN ATTENTE' }}
    </div>

    <div class="hud__row hud__row--bottom">
      <div class="hud__portrait">
        <img src="/src/assets/portraits/player_back.svg" alt="Player" />
      </div>
      <div class="hud__info">
        <h3>{{ player.name }}</h3>
        <div class="hud__bar">
          <div class="hud__fill" :style="{ width: playerHpPercent + '%' }"></div>
        </div>
        <span>{{ player.hp }} / {{ player.maxHp }} PV</span>
      </div>
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
.hud {
  display: grid;
  gap: 16px;
}

.hud__row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.55);
  padding: 12px 16px;
  border-radius: 14px;
}

.hud__row--bottom {
  justify-content: flex-end;
}

.hud__portrait img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hud__info {
  flex: 1;
}

.hud__bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  margin: 6px 0;
}

.hud__fill {
  height: 100%;
  background: linear-gradient(90deg, #8d2a2a, #e0582c);
  transition: width 0.4s ease;
}
</style>
