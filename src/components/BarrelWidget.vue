<template>
  <div class="barrel">
    <div
      v-for="slot in 6"
      :key="slot"
      class="barrel__slot"
      :class="{ 'barrel__slot--used': slot <= barrel.index }"
    >
      {{ slot <= barrel.index ? '×' : '?' }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  barrel: Object
});
</script>

<style scoped>
.barrel {
  display: grid;
  grid-template-columns: repeat(6, 36px);
  gap: 10px;
}

.barrel__slot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: grid;
  place-items: center;
  font-weight: 700;
}

.barrel__slot--used {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
}
</style>
