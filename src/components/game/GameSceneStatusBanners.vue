<template>
  <div v-if="peekedNext || scannerHint" class="flex flex-col items-center gap-2">
    <div
      v-if="peekedNext"
      class="rounded-xl border px-4 py-2 text-center text-xs font-bold uppercase tracking-wide shadow-lg"
      :class="peekedNext === 'real'
        ? 'border-red-400/60 bg-red-500/15 text-red-200'
        : 'border-stone-300/40 bg-stone-200/10 text-stone-200'"
    >
      🔍 Prochaine balle :
      <strong class="ml-1">
        {{ peekedNext === 'real' ? 'RÉELLE 🔴' : 'BLANCHE ⚪' }}
      </strong>
    </div>
    <div
      v-if="scannerHint"
      class="rounded-xl border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-100"
    >
      📡 Scanner : la {{ scannerHint }}ème balle est réelle.
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  peekedNext: {
    type: String,
    default: ''
  },
  scannerHint: {
    type: [String, Number],
    default: ''
  }
});
</script>
