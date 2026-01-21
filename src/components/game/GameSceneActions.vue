<template>
  <section class="flex w-full flex-col items-center gap-3">
    <div v-if="isTwoTargetMode" class="flex w-full flex-wrap items-center justify-center gap-2 px-2">
      <q-btn
        class="flex-1 min-w-[120px] max-w-[180px] rounded-xl text-[0.6rem] sm:text-[0.7rem] font-semibold leading-tight shadow-lg shadow-red-500/20 py-2"
        color="negative"
        unelevated
        :disable="!canAct || !opponentTargets.length"
        @click="emit('shoot', opponentTargets[0]?.key)"
      >
        <span class="flex flex-col items-center gap-0.5">
          <span>🎯 TIRER SUR</span>
          <span class="text-[0.7rem] sm:text-xs font-bold">ADVERSAIRE</span>
        </span>
      </q-btn>
      <q-btn
        class="flex-1 min-w-[120px] max-w-[180px] rounded-xl text-[0.6rem] sm:text-[0.7rem] font-semibold leading-tight shadow-lg shadow-red-500/20 py-2"
        color="negative"
        unelevated
        :disable="!canAct || !selfTarget"
        @click="emit('shoot', selfTarget?.key)"
      >
        <span class="flex flex-col items-center gap-0.5">
          <span>🎯 TIRER SUR</span>
          <span class="text-[0.7rem] sm:text-xs font-bold">SOI-MÊME</span>
        </span>
      </q-btn>
    </div>

    <div v-else-if="!isMultiTargetMode" class="flex w-full flex-wrap items-center justify-center gap-2 px-2">
      <div class="flex w-full max-w-md flex-col gap-2">
        <div class="text-[0.6rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/60 text-center">Cible</div>
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
        class="min-w-[140px] max-w-[180px] rounded-xl text-[0.65rem] sm:text-xs font-semibold shadow-lg shadow-red-500/20"
        color="negative"
        unelevated
        :disable="!canAct || !selectedTarget"
        @click="emit('shoot', selectedTarget)"
      >
        🎯 Tirer
        <q-tooltip>Choisissez la cible avant de tirer.</q-tooltip>
      </q-btn>
    </div>

    <div v-else class="flex w-full flex-wrap items-center justify-center gap-2 px-2">
      <q-btn-dropdown
        class="shoot-dropdown flex-1 min-w-[120px] max-w-[180px] rounded-xl text-[0.6rem] sm:text-xs font-semibold py-2 shadow-lg shadow-orange-500/20"
        color="deep-orange"
        unelevated
        :disable="!canAct || !opponentTargets.length"
        dropdown-icon="arrow_drop_down"
        :content-style="dropdownMenuStyle"
      >
        <template #label>
          <span class="flex flex-col items-center gap-0.5">
            <span>🎯 TIRER SUR</span>
            <span class="text-[0.7rem] sm:text-xs font-bold">ADVERSAIRE</span>
          </span>
        </template>
        <q-list class="min-w-[180px]" style="background: transparent; padding: 4px;">
          <q-item
            v-for="target in opponentTargets"
            :key="target.key"
            clickable
            v-close-popup
            style="background: transparent; border-radius: 8px; margin: 2px 0;"
            class="dropdown-item-hover"
            @click="emit('shoot', target.key)"
          >
            <q-item-section style="color: #fef3c7; font-weight: 600;">
              🎯 {{ target.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn
        class="flex-1 min-w-[120px] max-w-[180px] rounded-xl text-[0.6rem] sm:text-xs font-semibold shadow-lg shadow-red-500/20 py-2"
        color="negative"
        unelevated
        :disable="!canAct || !selfTarget"
        @click="emit('shoot', selfTarget?.key)"
      >
        <span class="flex flex-col items-center gap-0.5">
          <span>🎯 TIRER SUR</span>
          <span class="text-[0.7rem] sm:text-xs font-bold">SOI-MÊME</span>
        </span>
        <q-tooltip>Tirer sur soi-même.</q-tooltip>
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

// Style for the dropdown menu content
const dropdownMenuStyle = {
  background: 'linear-gradient(135deg, rgba(30, 20, 15, 0.98) 0%, rgba(15, 10, 5, 0.98) 100%)',
  border: '1px solid rgba(234, 88, 12, 0.5)',
  borderRadius: '12px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(234, 88, 12, 0.2)',
  overflow: 'hidden'
};

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

<style>
/* Dropdown item hover effect */
.dropdown-item-hover:hover {
  background: rgba(234, 88, 12, 0.3) !important;
}

.dropdown-item-hover:hover .q-item__section {
  color: #fff !important;
}
</style>
