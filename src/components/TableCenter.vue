<template>
  <div class="table">
    <div class="table__pistol" ref="pistolRef">
      <Gun3D 
        ref="gunComponent" 
        :rotation="gunRotation"
      />
      <img ref="flashRef" class="table__flash" src="/src/assets/ui/flash.svg" alt="Flash" />
    </div>
    <div ref="barrelRef">
      <BarrelWidget :barrel="barrel" />
    </div>
    <div class="table__stats">
      <div>Réelles: {{ counts.real }}</div>
      <div>Blanches: {{ counts.blank }}</div>
      <div>Restantes: {{ counts.remaining }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { gsap } from 'gsap';
import BarrelWidget from './BarrelWidget.vue';
import Gun3D from './Gun3D.vue';

const props = defineProps({
  barrel: Object,
  counts: Object,
  lastAction: Object
});

const emit = defineEmits(['register-refs']);

const pistolRef = ref(null);
const barrelRef = ref(null);
const flashRef = ref(null);
const gunRotation = ref(0);
const remainingChambers = computed(() => props.barrel.chambers.slice(props.barrel.index));

onMounted(() => {
  emit('register-refs', {
    pistol: pistolRef.value,
    barrel: barrelRef.value
  });
});

watch(
  () => props.lastAction,
  (action) => {
    if (!action || action.type !== 'shot') return;
    const targetRotation = action.target === 'enemy' ? -25 : 25;
    
    // 360 Spin + Recoil
    gsap.to(gunRotation, { 
      value: targetRotation + 360, 
      duration: 0.6, 
      ease: 'back.out(1.5)'
    });
    
    // Reset rotation after spin (optional, but keeps numbers sane)
    gsap.delayedCall(0.7, () => {
      gunRotation.value = 0;
    });

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
  @apply grid place-items-center gap-6 rounded-3xl px-8 py-6;
  background: linear-gradient(135deg, rgba(10, 5, 2, 0.9), rgba(30, 15, 8, 0.8));
  border: 2px solid rgba(242, 179, 109, 0.2);
  backdrop-filter: blur(12px);
  box-shadow: 
    0 0 30px rgba(242, 179, 109, 0.1),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.table__pistol {
  position: relative;
  width: 100%;
  max-width: 380px;
  height: 220px; /* Keep height fixed for aspect ratio or make flexible? */
  display: grid;
  place-items: center;
  perspective: 1000px;
}

@media (max-height: 700px) {
  .table__pistol {
    height: 180px;
  }
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
