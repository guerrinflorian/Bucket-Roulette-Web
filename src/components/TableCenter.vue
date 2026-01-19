<template>
  <div class="table">
    <div class="table__pistol">
      <div class="table__ammo-rack">
        <div
          v-for="(round, index) in remainingChambers"
          :key="`${round}-${index}`"
          class="table__round"
          :class="round === 'real' ? 'table__round--real' : 'table__round--blank'"
        ></div>
      </div>
      <img ref="pistolRef" src="/src/assets/ui/pistol.svg" alt="Pistol" />
      <img ref="flashRef" class="table__flash" src="/src/assets/ui/flash.svg" alt="Flash" />
      <div class="table__magazines">
        <div class="table__mag"></div>
        <div class="table__mag"></div>
        <div class="table__mag"></div>
      </div>
    </div>
    <BarrelWidget :barrel="barrel" />
    <div class="table__stats">
      <div>Réelles: {{ counts.real }}</div>
      <div>Blanches: {{ counts.blank }}</div>
      <div>Restantes: {{ counts.remaining }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { gsap } from 'gsap';
import BarrelWidget from './BarrelWidget.vue';

const props = defineProps({
  barrel: Object,
  counts: Object,
  lastAction: Object
});

const pistolRef = ref(null);
const flashRef = ref(null);
const remainingChambers = computed(() => props.barrel.chambers.slice(props.barrel.index));

watch(
  () => props.lastAction,
  (action) => {
    if (!action || action.type !== 'shot') return;
    const rotation = action.target === 'enemy' ? -16 : 16;
    gsap.to(pistolRef.value, { rotate: rotation, duration: 0.2, yoyo: true, repeat: 1 });
    gsap.fromTo(
      flashRef.value,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1.3, duration: 0.1, yoyo: true, repeat: 1 }
    );
  }
);
</script>

<style scoped>
.table {
  @apply grid place-items-center gap-4 rounded-3xl bg-black/60 px-6 py-5 shadow-2xl;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.table__pistol {
  position: relative;
  width: 260px;
  height: 150px;
  display: grid;
  place-items: center;
}

.table__pistol img {
  width: 220px;
  height: auto;
}

.table__flash {
  position: absolute;
  width: 120px;
  opacity: 0;
  pointer-events: none;
}

.table__stats {
  display: flex;
  gap: 16px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
}

.table__ammo-rack {
  position: absolute;
  top: -16px;
  display: flex;
  gap: 4px;
}

.table__round {
  width: 10px;
  height: 24px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.table__round--real {
  background: linear-gradient(180deg, #f4a460, #c56a2d);
}

.table__round--blank {
  background: linear-gradient(180deg, #c7c7c7, #7a7a7a);
}

.table__magazines {
  position: absolute;
  right: -12px;
  bottom: 0;
  display: grid;
  gap: 6px;
}

.table__mag {
  width: 32px;
  height: 60px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(20, 12, 8, 0.9), rgba(80, 40, 20, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
