<template>
  <div class="items">
    <h3>Objets</h3>
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
    <p v-if="peekedNext" class="items__peek">Prochaine balle: {{ peekedNext }}</p>
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
  background: rgba(0, 0, 0, 0.55);
  padding: 16px 20px;
  border-radius: 16px;
}

.items__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
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
}

.items__button img {
  width: 48px;
  height: 48px;
}

.items__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.items__peek {
  margin-top: 12px;
  font-size: 14px;
  opacity: 0.8;
}
</style>
