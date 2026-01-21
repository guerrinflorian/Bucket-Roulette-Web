<template>
  <section class="flex w-full flex-col items-center gap-3">
    <div
      class="flex w-full max-w-md flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3 lg:max-w-lg"
      :class="turnContainerClass"
    >
      <div class="flex flex-wrap items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:gap-2 sm:text-xs sm:tracking-[0.15em]">
        <span class="text-white/70">Tour de</span>
        <span v-if="!isMultiTurnOrder" class="text-[0.7rem] font-extrabold text-emerald-300 sm:text-sm">
          {{ currentTurnName }}
        </span>
        <div v-else class="flex flex-wrap items-center gap-0.5 text-[0.55rem] sm:gap-1 sm:text-xs">
          <template v-for="(entry, index) in turnOrderDisplay" :key="entry.key">
            <span
              class="rounded-md px-1.5 py-0.5 font-bold transition-all sm:px-2"
              :class="entry.isCurrent 
                ? 'bg-emerald-500/25 text-emerald-300 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                : 'text-white/50'"
            >
              {{ entry.isSelf ? 'Vous' : entry.name }}
            </span>
            <span 
              v-if="index < turnOrderDisplay.length - 1" 
              class="text-amber-400/70"
            >
              →
            </span>
          </template>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1 text-[0.55rem] font-semibold uppercase sm:gap-2 sm:text-xs">
        <span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 tracking-[0.15em] text-white/70 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.2em]">
          {{ currentChamberNumber }}/{{ totalSlots }}
        </span>
        <span
          v-if="turnTimeLeft !== null"
          class="rounded-full bg-amber-400/15 px-2 py-0.5 font-bold tracking-[0.15em] text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.4)] sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.2em]"
        >
          ⏱ {{ turnTimeLeft }}s
        </span>
      </div>
    </div>

    <div class="relative flex w-full items-center justify-center">
      <BarrelRevolver
        ref="barrelRef"
        :barrel-data="barrel"
        @animation-start="emit('animation-start')"
        @animation-end="emit('animation-end')"
      />
      <div
        v-if="showBarrelInfo"
        class="absolute left-1/2 ml-[85px] flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 sm:ml-[100px] sm:px-3"
      >
        <div class="flex items-center gap-1.5 sm:gap-2">
          <span class="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] sm:h-2.5 sm:w-2.5"></span>
          <span class="text-sm font-bold text-white/90 sm:text-xs sm:font-semibold">{{ realCount }}</span>
          <span class="hidden text-xs text-white/60 sm:inline">réelles</span>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <span class="h-3 w-3 rounded-full bg-zinc-100 shadow-[0_0_10px_rgba(244,244,245,0.6)] sm:h-2.5 sm:w-2.5"></span>
          <span class="text-sm font-bold text-white/90 sm:text-xs sm:font-semibold">{{ blankCount }}</span>
          <span class="hidden text-xs text-white/60 sm:inline">blanches</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import BarrelRevolver from '../BarrelRevolver.vue';

const props = defineProps({
  playersByKey: {
    type: Object,
    default: () => ({})
  },
  localPlayerKey: {
    type: String,
    default: 'player'
  },
  turnOrder: {
    type: Array,
    default: () => []
  },
  currentTurnKey: {
    type: String,
    default: null
  },
  barrel: Object,
  turnTimeLeft: {
    type: Number,
    default: null
  },
  showBarrelInfo: {
    type: Boolean,
    default: false
  },
  realCount: {
    type: Number,
    default: 0
  },
  blankCount: {
    type: Number,
    default: 0
  },
  currentChamberNumber: {
    type: Number,
    default: 1
  },
  totalSlots: {
    type: Number,
    default: 6
  },
  phase: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['animation-start', 'animation-end']);
const barrelRef = ref(null);

const currentTurnName = computed(() => {
  if (!props.currentTurnKey) return '';
  if (props.currentTurnKey === props.localPlayerKey) return 'VOUS';
  return props.playersByKey?.[props.currentTurnKey]?.name || 'Joueur';
});

const turnOrderDisplay = computed(() => {
  return (props.turnOrder || []).map((key) => ({
    key,
    name: props.playersByKey?.[key]?.name || 'Joueur',
    isCurrent: key === props.currentTurnKey,
    isSelf: key === props.localPlayerKey
  }));
});

const isMultiTurnOrder = computed(() => turnOrderDisplay.value.length > 2);

const turnContainerClass = computed(() => {
  const isPlayerTurn = props.currentTurnKey === props.localPlayerKey;
  if (isPlayerTurn && props.phase !== 'animating') {
    return 'border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]';
  }
  return 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]';
});

function rotateToNextSlot() {
  return barrelRef.value?.rotateToNextSlot?.();
}

function revealBullet(isReal) {
  return barrelRef.value?.revealBullet?.(isReal);
}

async function dropBullet() {
  if (barrelRef.value?.dropBullet) {
    await barrelRef.value.dropBullet();
  }
}

function hideBullet() {
  if (barrelRef.value?.hideBullet) {
    barrelRef.value.hideBullet();
  }
}

defineExpose({
  rotateToNextSlot,
  revealBullet,
  dropBullet,
  hideBullet
});
</script>
