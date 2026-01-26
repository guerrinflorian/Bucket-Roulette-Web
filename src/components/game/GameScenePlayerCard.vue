<template>
  <section
    class="w-full flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2"
    :class="{
      'pb-4': isBottom,
      'px-1 py-0.5 sm:px-2 sm:py-1': isCompact
    }"
  >
    <div
      class="relative mx-auto flex w-full items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 shadow-lg shadow-black/30 backdrop-blur sm:gap-3 sm:rounded-2xl sm:p-3"
      :class="{
        'flex-row-reverse': isReversed,
        'gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2': isCompact
      }"
    >
      <div v-if="isHandcuffed" class="handcuff-overlay" aria-hidden="true">
        <span class="handcuff-overlay__ring handcuff-overlay__ring--left"></span>
        <span class="handcuff-overlay__ring handcuff-overlay__ring--right"></span>
        <span class="handcuff-overlay__chain"></span>
        <img :src="handcuffsImg" alt="" class="handcuff-overlay__icon" />
        <span class="handcuff-overlay__label">Menotté</span>
      </div>
      <div class="relative flex flex-shrink-0 items-center justify-center">
        <q-avatar :size="isCompact ? '32px' : '44px'" class="rounded-full border border-white/10 sm:!w-[44px] sm:!h-[44px]" :class="{ 'sm:!w-[44px] sm:!h-[44px]': isCompact, 'sm:!w-[56px] sm:!h-[56px]': !isCompact }">
          <Avatar
            :name="firstName"
            variant="beam"
            :size="isCompact ? 32 : 44"
            :colors="avatarColors"
          />
        </q-avatar>
        <Transition name="emoji-pop">
          <div
            v-if="emoji"
            class="emoji-bubble"
            :class="isReversed ? 'emoji-bubble-reverse' : ''"
          >
            {{ emoji }}
          </div>
        </Transition>
      </div>

      <div class="flex min-w-0 flex-1 flex-col">
        <div class="mb-1 flex items-center justify-between sm:mb-2">
          <span class="truncate text-xs font-bold text-white sm:text-sm">
            {{ displayName }}
          </span>
          <span class="text-[0.6rem] font-semibold text-white/60 sm:text-xs">
            {{ player.hp }}/{{ player.maxHp }}
          </span>
        </div>
        <div class="h-2 rounded-full bg-white/10 shadow-inner sm:h-3">
          <div
            class="h-2 rounded-full transition-all sm:h-3"
            :class="isEnemy ? 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'"
            :style="{ width: hpPercent + '%' }"
          ></div>
        </div>
        <div
          v-if="showItems && player.items?.length && isEnemy"
          class="mt-1 flex flex-wrap gap-0.5 sm:mt-2 sm:gap-1"
        >
          <span
            v-for="(itemId, index) in player.items"
            :key="index"
            class="flex h-5 w-5 items-center justify-center rounded border border-white/10 bg-white/5 sm:h-6 sm:w-6 sm:rounded-md"
          >
            <img :src="getItemImage(itemId)" :alt="itemId" class="h-3 w-3 object-contain sm:h-4 sm:w-4" />
          </span>
        </div>
      </div>

      <div v-if="showItems && player.items?.length && !isEnemy" class="flex gap-2">
        <span
          v-for="(itemId, index) in player.items"
          :key="index"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5"
        >
          <img :src="getItemImage(itemId)" :alt="itemId" class="h-5 w-5 object-contain" />
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from 'vue-boring-avatars';
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
  isCompact: {
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
const isHandcuffed = computed(() => props.player?.skipNextTurn);
const avatarColors = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'];

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

.emoji-bubble-reverse {
  right: auto;
  left: -12px;
}

@keyframes emoji-bounce {
  0% { transform: scale(0) rotate(-20deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
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

.handcuff-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(120deg, rgba(12, 16, 28, 0.75), rgba(35, 24, 64, 0.8));
  border: 1px solid rgba(130, 139, 255, 0.28);
  box-shadow: inset 0 0 30px rgba(17, 24, 39, 0.7), 0 0 24px rgba(99, 102, 241, 0.25);
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.handcuff-overlay::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 16px;
  border: 1px dashed rgba(148, 163, 255, 0.35);
  opacity: 0.6;
}

.handcuff-overlay__icon {
  width: 26px;
  height: 26px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.45));
  animation: handcuff-float 2.4s ease-in-out infinite;
}

.handcuff-overlay__label {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.25);
  border: 1px solid rgba(129, 140, 248, 0.45);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #eef2ff;
  text-shadow: 0 0 10px rgba(129, 140, 248, 0.6);
}

.handcuff-overlay__ring {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 2px solid rgba(226, 232, 240, 0.7);
  box-shadow: 0 0 12px rgba(148, 163, 255, 0.4);
  animation: handcuff-pulse 1.8s ease-in-out infinite;
}

.handcuff-overlay__ring--left {
  left: 18px;
  top: 14px;
}

.handcuff-overlay__ring--right {
  right: 18px;
  bottom: 14px;
  animation-delay: 0.3s;
}

.handcuff-overlay__chain {
  position: absolute;
  left: 44%;
  top: 52%;
  width: 36px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.4), rgba(129, 140, 248, 0.6));
  box-shadow: 0 0 12px rgba(129, 140, 248, 0.45);
  transform: rotate(-12deg);
}

@keyframes handcuff-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes handcuff-pulse {
  0%,
  100% {
    transform: scale(0.96);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
</style>
