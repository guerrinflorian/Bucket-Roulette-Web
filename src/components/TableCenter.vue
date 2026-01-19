<template>
  <div class="table">
    <div class="table__pistol">
      <img ref="pistolRef" src="/src/assets/ui/pistol.svg" alt="Pistol" />
      <img ref="flashRef" class="table__flash" src="/src/assets/ui/flash.svg" alt="Flash" />
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
import { ref, watch } from 'vue';
import { gsap } from 'gsap';
import BarrelWidget from './BarrelWidget.vue';

const props = defineProps({
  barrel: Object,
  counts: Object,
  lastAction: Object
});

const pistolRef = ref(null);
const flashRef = ref(null);

watch(
  () => props.lastAction,
  (action) => {
    if (!action) return;
    const rotation = action.target === 'enemy' ? -18 : 18;
    gsap.to(pistolRef.value, { rotate: rotation, duration: 0.2, yoyo: true, repeat: 1 });
    gsap.fromTo(
      flashRef.value,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 }
    );
  }
);
</script>

<style scoped>
.table {
  display: grid;
  gap: 16px;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 24px;
  border-radius: 18px;
}

.table__pistol {
  position: relative;
  width: 260px;
  height: 140px;
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
  gap: 24px;
  font-weight: 600;
}
</style>
