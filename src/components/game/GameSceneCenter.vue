<template>
  <section class="flex w-full flex-col items-center gap-3">
    <div
      class="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md"
      :class="turnContainerClass"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
        <span class="text-white/70">Tour de</span>
        <span v-if="!isMultiTurnOrder" class="text-sm font-extrabold text-emerald-300">
          {{ currentTurnName }}
        </span>
        <div v-else class="flex flex-wrap items-center gap-1 text-xs">
          <span
            v-for="(entry, index) in turnOrderDisplay"
            :key="entry.key"
            class="font-bold"
            :class="entry.isCurrent ? 'text-emerald-300' : 'text-rose-200/80'"
          >
            {{ entry.name }}<span v-if="index < turnOrderDisplay.length - 1" class="px-1 text-white/30">/</span>
          </span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
        <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-white/70">
          Tour {{ currentChamberNumber }}/{{ totalSlots }}
        </span>
        <span
          v-if="turnTimeLeft !== null"
          class="rounded-full bg-amber-400/15 px-3 py-1 text-[0.65rem] font-bold tracking-[0.2em] text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.4)]"
        >
          ⏱ {{ turnTimeLeft }}s
        </span>
      </div>
    </div>

    <div class="flex w-full flex-wrap items-center justify-center gap-4">
      <div class="flex-shrink-0">
        <BarrelRevolver
          ref="barrelRef"
          :barrel-data="barrel"
          @animation-start="emit('animation-start')"
          @animation-end="emit('animation-end')"
        />
      </div>
      <div
        v-if="showBarrelInfo"
        class="flex min-w-[140px] flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold"
      >
        <div class="flex items-center gap-2 text-white/80">
          <span class="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]"></span>
          <span>{{ realCount }} réelles</span>
        </div>
        <div class="flex items-center gap-2 text-white/80">
          <span class="h-2 w-2 rounded-full bg-zinc-100 shadow-[0_0_10px_rgba(244,244,245,0.6)]"></span>
          <span>{{ blankCount }} blanches</span>
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
