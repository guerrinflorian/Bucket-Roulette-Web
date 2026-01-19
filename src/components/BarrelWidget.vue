<template>
  <div class="barrel-container">
    <div class="barrel-circle">
      <div
        v-for="slot in 6"
        :key="slot"
        class="barrel-slot"
        :class="getSlotClass(slot - 1)"
        :style="getSlotStyle(slot - 1)"
      >
        <div class="slot-content">
          <span v-if="slot - 1 < barrel.index">×</span>
          <span v-else>?</span>
        </div>
      </div>
      <div class="barrel-center"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  barrel: Object,
  isRevealed: Boolean // Optional, for items
});

const getSlotStyle = (index) => {
  const angle = (index * 60 - 90) * (Math.PI / 180);
  const radius = 60; // radius in px
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return {
    transform: `translate(${x}px, ${y}px)`
  };
};

const getSlotClass = (index) => {
  if (index < props.barrel.index) return 'barrel-slot--spent';
  if (index === props.barrel.index && props.isRevealed) return 'barrel-slot--revealed';
  return 'barrel-slot--unknown';
};
</script>

<style scoped>
.barrel-container {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.barrel-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
  filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.5));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.barrel-slot {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(40, 40, 40, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.barrel-center {
  width: 40px;
  height: 40px;
  background: rgba(80, 80, 80, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.barrel-slot--spent {
  background: rgba(20, 20, 20, 0.6);
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.2);
}

.barrel-slot--revealed {
  background: linear-gradient(135deg, #f2b36d, #b46c2c);
  border-color: #f2b36d;
  box-shadow: 0 0 15px rgba(242, 179, 109, 0.6);
  color: #0d0a07;
  transform: scale(1.15) !important;
}

.barrel-slot--unknown {
  background: radial-gradient(circle at top left, #444, #222);
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
