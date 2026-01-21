<template>
  <section class="flex w-full flex-col items-center gap-3 px-4 pb-4">
    <div v-if="isTwoTargetMode" class="flex w-full flex-nowrap items-center justify-center gap-3 overflow-x-auto">
      <q-btn
        class="min-w-[200px] rounded-xl text-[0.7rem] font-semibold leading-tight shadow-lg shadow-red-500/20 whitespace-nowrap"
        color="negative"
        unelevated
        :disable="!canAct || !opponentTargets.length"
        @click="emit('shoot', opponentTargets[0]?.key)"
      >
        🎯 Tirer sur l'adversaire
      </q-btn>
      <q-btn
        class="min-w-[180px] rounded-xl text-[0.7rem] font-semibold leading-tight shadow-lg shadow-red-500/20 whitespace-nowrap"
        color="negative"
        unelevated
        :disable="!canAct || !selfTarget"
        @click="emit('shoot', selfTarget?.key)"
      >
        🎯 Tirer sur moi
      </q-btn>
    </div>

    <div v-else-if="!isMultiTargetMode" class="flex w-full flex-wrap items-center justify-center gap-3">
      <div class="flex w-full max-w-2xl flex-col gap-2">
        <div class="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/60">Cible</div>
        <q-btn-toggle
          v-model="selectedTarget"
          :options="targetOptions"
          class="rounded-xl bg-white/5 p-1"
          color="deep-orange"
          text-color="white"
          unelevated
          spread
          :disable="!canAct"
        />
      </div>
      <q-btn
        class="min-w-[180px] rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20"
        color="negative"
        unelevated
        :disable="!canAct || !selectedTarget"
        @click="emit('shoot', selectedTarget)"
      >
        🎯 Tirer
        <q-tooltip>Choisissez la cible avant de tirer.</q-tooltip>
      </q-btn>
    </div>

    <div v-else class="flex w-full flex-nowrap items-center justify-center gap-3 overflow-x-auto">
      <q-btn-dropdown
        class="min-w-[240px] rounded-xl text-xs font-semibold"
        color="deep-orange"
        unelevated
        :disable="!canAct || !opponentTargets.length"
        label="Tirer sur un adversaire"
        dropdown-icon="arrow_drop_down"
      >
        <q-list class="min-w-[220px]">
          <q-item
            v-for="target in opponentTargets"
            :key="target.key"
            clickable
            v-close-popup
            @click="emit('shoot', target.key)"
          >
            <q-item-section>{{ target.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn
        class="min-w-[180px] rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20"
        color="negative"
        unelevated
        :disable="!canAct || !selfTarget"
        @click="emit('shoot', selfTarget?.key)"
      >
        🎯 Tirer sur soi
        <q-tooltip>Choisissez la cible avant de tirer.</q-tooltip>
      </q-btn>
    </div>

    <span v-if="!isMultiTargetMode && !isTwoTargetMode" class="sr-only">
      Bouton de tir affiché dans la section cible.
    </span>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  canAct: {
    type: Boolean,
    default: false
  },
  targets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['shoot']);
const selectedTarget = ref(null);

const isMultiTargetMode = computed(() => props.targets.length > 2);
const isTwoTargetMode = computed(() => props.targets.length === 2);

const targetOptions = computed(() => props.targets.map((target) => ({
  label: target.label,
  value: target.key
})));

const selfTarget = computed(() => props.targets.find((target) => target.isSelf));
const opponentTargets = computed(() => props.targets.filter((target) => !target.isSelf));

watch(
  () => props.targets,
  (targets) => {
    if (!targets.length) {
      selectedTarget.value = null;
      return;
    }
    const stillAvailable = targets.some((target) => target.key === selectedTarget.value);
    if (!stillAvailable) {
      selectedTarget.value = targets[0]?.key || null;
    }
  },
  { immediate: true, deep: true }
);
</script>
