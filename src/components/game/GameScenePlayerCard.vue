<template>
  <section
    class="w-full flex-shrink-0 px-3 py-2"
    :class="{
      'pb-4': isBottom,
      'px-2 py-1': isCompact
    }"
  >
    <div
      class="mx-auto flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/30 backdrop-blur"
      :class="{
        'flex-row-reverse': isReversed,
        'gap-2 px-2 py-2': isCompact
      }"
    >
      <div class="relative flex items-center justify-center">
        <q-avatar :size="isCompact ? '44px' : '56px'" class="rounded-full border border-white/10">
          <Avatar
            :name="firstName"
            variant="beam"
            :size="isCompact ? 44 : 56"
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
        <div class="mb-2 flex items-center justify-between">
          <span class="truncate text-sm font-bold text-white">
            {{ displayName }}
          </span>
          <span class="text-xs font-semibold text-white/60">
            {{ player.hp }}/{{ player.maxHp }}
          </span>
        </div>
        <div class="h-3 rounded-full bg-white/10 shadow-inner">
          <div
            class="h-3 rounded-full transition-all"
            :class="isEnemy ? 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-emerald-700 to-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'"
            :style="{ width: hpPercent + '%' }"
          ></div>
        </div>
        <div
          v-if="showItems && player.items?.length && isEnemy"
          class="mt-2 flex flex-wrap gap-1"
        >
          <span
            v-for="(itemId, index) in player.items"
            :key="index"
            class="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5"
          >
            <img :src="getItemImage(itemId)" :alt="itemId" class="h-4 w-4 object-contain" />
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
</style>
