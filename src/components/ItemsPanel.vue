<template>
  <div class="items glass-panel space-y-3 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/80">Objets</h3>
      <span v-if="peekedNext" class="text-xs text-amber-100/70">Prochaine balle: {{ peekedNext }}</span>
    </div>
    <div class="items__row">
      <button
        v-for="(itemId, index) in items"
        :key="`${itemId}-${index}`"
        class="items__button"
        :disabled="disabled"
        @click="$emit('use-item', itemId)"
      >
        <img :src="getItem(itemId).icon" :alt="getItem(itemId).name" />
        <span>{{ getItem(itemId).name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { getItemById } from '../engine/items.js';

defineProps({
  items: Array,
  disabled: Boolean,
  peekedNext: String
});

const getItem = (id) => getItemById(id) || { name: id, icon: '' };
</script>

<style scoped>
.items {
  min-height: 0;
}

.items__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.items__button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  min-width: 110px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.items__button img {
  width: 42px;
  height: 42px;
}

.items__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
