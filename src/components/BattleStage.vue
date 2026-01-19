<template>
  <div class="battle-stage">
    <div class="battle-stage__row">
      <div class="avatar-card" :class="{ 'avatar-card--hit': enemyHit }">
        <img :src="enemyAvatar" alt="Avatar ennemi" />
        <div class="avatar-card__info">
          <p class="avatar-card__name">{{ enemy.name }}</p>
          <div class="avatar-card__hp">
            <div class="avatar-card__hp-fill" :style="{ width: enemyHpPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="battle-stage__table">
      <TableCenter 
        :barrel="barrel" 
        :counts="counts" 
        :last-action="lastAction" 
        @register-refs="onTableRefs"
      />
      <div class="shot-effect" :class="shotClass"></div>
    </div>

    <div class="battle-stage__row battle-stage__row--bottom">
      <div class="avatar-card avatar-card--player" :class="{ 'avatar-card--hit': playerHit }">
        <img :src="playerAvatar" alt="Avatar joueur" />
        <div class="avatar-card__info">
          <p class="avatar-card__name">{{ player.name }}</p>
          <div class="avatar-card__hp">
            <div class="avatar-card__hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import TableCenter from './TableCenter.vue';

const props = defineProps({
  player: Object,
  enemy: Object,
  barrel: Object,
  counts: Object,
  lastAction: Object,
  enemyAvatar: String,
  playerAvatar: String
});

const emit = defineEmits(['register-refs']);

const onTableRefs = (refs) => {
  emit('register-refs', refs);
};

const enemyHpPercent = computed(() => (props.enemy.hp / props.enemy.maxHp) * 100);
const playerHpPercent = computed(() => (props.player.hp / props.player.maxHp) * 100);

const shotClass = ref('');
const enemyHit = ref(false);
const playerHit = ref(false);
let shotTimeout;
let hitTimeout;

watch(
  () => props.lastAction,
  (action) => {
    if (!action || action.type !== 'shot') return;
    shotClass.value = `shot-${action.actor}-to-${action.target}`;
    clearTimeout(shotTimeout);
    shotTimeout = setTimeout(() => {
      shotClass.value = '';
    }, 550);

    clearTimeout(hitTimeout);
    if (action.damage > 0) {
      if (action.target === 'enemy') {
        enemyHit.value = true;
      }
      if (action.target === 'player') {
        playerHit.value = true;
      }
      hitTimeout = setTimeout(() => {
        enemyHit.value = false;
        playerHit.value = false;
      }, 500);
    }
  }
);
</script>

<style scoped>
.battle-stage {
  @apply flex h-full flex-col justify-center gap-2 rounded-3xl p-3 md:gap-4 md:p-6;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(20, 10, 5, 0.5));
  border: 1px solid rgba(255, 180, 100, 0.15);
  position: relative;
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden; /* Prevent spillover */
}

/* ... existing styles ... */

.avatar-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  min-width: 160px; /* Reduced from 220 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* ... */

.avatar-card img {
  width: 56px; /* Reduced from 76 */
  height: 56px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
}

/* On very small vertical screens, hide avatars or scale even more? 
   For now, just tighter spacing above */
.battle-stage__table {
  flex: 1; /* Allow table to take available space */
  display: flex;
  align-items: center; /* Center vertically */
  justify-content: center;
  min-height: 0; /* Important for flex scaling */
}

.avatar-card__hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #8d2a2a, #f38a4b);
  transition: width 0.4s ease;
}

.shot-effect {
  position: absolute;
  width: 6px;
  height: 0;
  background: linear-gradient(180deg, rgba(255, 212, 131, 0.8), rgba(255, 90, 62, 0.9));
  opacity: 0;
  border-radius: 999px;
  left: 50%;
  top: 50%;
  transform: translateX(-50%);
}

.shot-player-to-enemy,
.shot-enemy-to-player {
  animation: shot-line 0.55s ease;
}

.shot-player-to-self,
.shot-enemy-to-self {
  animation: shot-self 0.55s ease;
}

.shot-player-to-enemy {
  transform: translateX(-50%) rotate(-6deg);
}

.shot-enemy-to-player {
  transform: translateX(-50%) rotate(6deg);
}

@keyframes shot-line {
  0% {
    opacity: 0;
    height: 0;
  }
  20% {
    opacity: 1;
  }
  60% {
    height: 260px;
  }
  100% {
    opacity: 0;
    height: 0;
  }
}

@keyframes shot-self {
  0% {
    opacity: 0;
    height: 0;
  }
  30% {
    opacity: 1;
    height: 120px;
  }
  100% {
    opacity: 0;
    height: 0;
  }
}

@media (max-width: 768px) {
  .battle-stage {
    padding: 12px;
  }

  .avatar-card {
    min-width: 180px;
  }

  .avatar-card img {
    width: 64px;
    height: 64px;
  }
}
</style>
