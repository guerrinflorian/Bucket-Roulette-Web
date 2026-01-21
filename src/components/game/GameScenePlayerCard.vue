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
          <img :src="getItemImage(itemId)" :alt="itemId" />
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from "vue-boring-avatars";
import heartImg from '../../assets/items/heart.png';
import doubleImg from '../../assets/items/double.png';
import peekImg from '../../assets/items/peek.png';
import ejectImg from '../../assets/items/eject.png';
import handcuffsImg from '../../assets/items/handcuffs.png';
import inverterImg from '../../assets/items/inverter.png';
import scannerImg from '../../assets/items/scanner.png';

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

const itemImages = {
  heart: heartImg,
  double: doubleImg,
  peek: peekImg,
  eject: ejectImg,
  handcuffs: handcuffsImg,
  inverter: inverterImg,
  scanner: scannerImg
};

function getItemImage(id) {
  return itemImages[id] || heartImg;
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
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
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
  gap: 6px;
  flex-shrink: 0;
}

.enemy-item-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  cursor: help;
  transition: all 0.2s;
}

.enemy-item-badge img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.enemy-item-badge:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.1);
}

.player-avatar {
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.emoji-bubble {
  position: absolute;
  top: -12px;
  right: -12px;
  background: rgba(10, 10, 15, 0.92);
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 999px;
  padding: 6px;
  min-width: 40px;
  min-height: 40px;
  max-width: 60px;
  max-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  line-height: 1;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.15);
  animation: emoji-bounce 0.3s ease-out;
}

@keyframes emoji-bounce {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.emoji-bubble-reverse {
  right: auto;
  left: -12px;
}

.emoji-pop-enter-active,
.emoji-pop-leave-active {
  transition: all 0.25s ease;
}

.emoji-pop-enter-from,
.emoji-pop-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.8);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.player-name {
  font-size: 15px;
  font-weight: 700;
  color: #f4f4f5;
  letter-spacing: 0.01em;
}

.player-hp-text {
  font-size: 13px;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-weight: 600;
  color: #a1a1aa;
}

.hp-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hp-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 999px;
}

.hp-enemy {
  background: linear-gradient(90deg, #b91c1c, #ef4444);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

.hp-player {
  background: linear-gradient(90deg, #15803d, #22c55e);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
}

@media (max-height: 700px) {
  .player-section {
    padding: 8px 12px;
  }

  .player-section-bottom {
    padding-bottom: 12px;
  }

  .player-card {
    padding: 10px 14px;
    gap: 12px;
    border-radius: 16px;
  }

  .player-avatar {
    transform: scale(0.9);
  }

  .player-name {
    font-size: 13px;
  }

  .player-hp-text {
    font-size: 11px;
  }

  .hp-bar {
    height: 10px;
  }

  .enemy-item-badge {
    width: 26px;
    height: 26px;
  }

  .enemy-item-badge img {
    width: 16px;
    height: 16px;
  }

  .emoji-bubble {
    min-width: 34px;
    min-height: 34px;
    font-size: 22px;
  }
}
</style>
