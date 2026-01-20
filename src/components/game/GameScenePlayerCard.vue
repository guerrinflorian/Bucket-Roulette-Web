<template>
  <section class="player-section" :class="{ 'player-section-bottom': isBottom }">
    <div class="player-card" :class="{ 'player-card-reverse': isReversed }">
      <div class="avatar-stack">
       <q-avatar size="56px" class="player-avatar">
          <Avatar 
            :name="firstName" 
            variant="beam" 
            :size="56" 
            :colors="avatarColors"
          />
        </q-avatar>
        <Transition name="emoji-pop">
          <div v-if="emoji" class="emoji-bubble" :class="{ 'emoji-bubble-reverse': isReversed }">
            {{ emoji }}
          </div>
        </Transition>
      </div>
      <div class="player-info">
        <div class="player-header">
          <span class="player-name">{{ displayName }}</span>
          <span class="player-hp-text">{{ player.hp }}/{{ player.maxHp }}</span>
        </div>
        <div class="hp-bar">
          <div
            class="hp-fill"
            :class="isEnemy ? 'hp-enemy' : 'hp-player'"
            :style="{ width: hpPercent + '%' }"
          ></div>
        </div>
      </div>
      <div v-if="showItems && player.items?.length" class="enemy-items">
        <span
          v-for="(itemId, index) in player.items"
          :key="index"
          class="enemy-item-badge"
        >
          {{ getItemEmoji(itemId) }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from "vue-boring-avatars";

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  isEnemy: {
    type: Boolean,
    default: false
  },
  isReversed: {
    type: Boolean,
    default: false
  },
  isBottom: {
    type: Boolean,
    default: false
  },
  showItems: {
    type: Boolean,
    default: false
  },
  emoji: {
    type: String,
    default: ''
  }
});

const displayName = computed(() => props.player?.name || 'Joueur');
const firstName = computed(() => displayName.value.split(' ')[0] || displayName.value);
const hpPercent = computed(() => (props.player.hp / props.player.maxHp) * 100);
const avatarColors = ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"];

const itemEmoji = {
  heart: '❤️',
  double: '⚡',
  peek: '🔍',
  eject: '🔄',
  invert: '🔀'
};

function getItemEmoji(id) {
  return itemEmoji[id] || '📦';
}
</script>

<style scoped>
.player-section {
  flex-shrink: 0;
  padding: 12px 16px;
}

.player-section-bottom {
  padding-bottom: 16px;
}

.player-card {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.player-card-reverse {
  flex-direction: row-reverse;
}

.avatar-stack {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enemy-items {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.enemy-item-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 14px;
  cursor: help;
}

.player-avatar {
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
}

.emoji-bubble {
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 18px;
  line-height: 1;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.emoji-bubble-reverse {
  right: auto;
  left: -10px;
}

.emoji-pop-enter-active,
.emoji-pop-leave-active {
  transition: all 0.25s ease;
}

.emoji-pop-enter-from,
.emoji-pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.9);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.player-name {
  font-size: 14px;
  font-weight: 700;
  color: #e7e5e4;
}

.player-hp-text {
  font-size: 12px;
  font-family: monospace;
  color: #a8a29e;
}

.hp-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.hp-enemy {
  background: linear-gradient(90deg, #b91c1c, #ef4444);
}

.hp-player {
  background: linear-gradient(90deg, #15803d, #22c55e);
}
</style>
