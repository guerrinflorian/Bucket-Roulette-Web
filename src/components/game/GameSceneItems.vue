<template>
  <section v-if="items?.length" class="items-section">
    <div class="items-row">
      <button
        v-for="(itemId, index) in items"
        :key="`${itemId}-${index}`"
        class="item-btn"
        :disabled="!canAct"
        @click="handleUseItem(itemId)"
      >
        <span class="item-icon">{{ getItemEmoji(itemId) }}</span>
        <span class="item-name">{{ getItemName(itemId) }}</span>
        <q-tooltip>{{ getItemName(itemId) }} — {{ getItemDescription(itemId) }}</q-tooltip>
      </button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  canAct: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['use-item']);

const itemData = {
  heart: { emoji: '❤️', name: '+1 PV', description: 'Soigne 1 PV (max).'},
  double: { emoji: '⚡', name: 'Double dégâts', description: 'Le prochain tir consomme l’effet.' },
  peek: { emoji: '🔍', name: 'Voir la balle', description: 'Révèle la prochaine cartouche.' },
  eject: { emoji: '🔄', name: 'Éjecter', description: 'Retire la prochaine cartouche sans tirer.' },
  invert: { emoji: '🔀', name: 'Inverser cible', description: 'Inverse votre cible au prochain tir.' }
};

function getItemEmoji(id) {
  return itemData[id]?.emoji || '📦';
}

function getItemName(id) {
  return itemData[id]?.name || id;
}

function getItemDescription(id) {
  return itemData[id]?.description || 'Objet spécial';
}

function handleUseItem(itemId) {
  emit('use-item', itemId);
}
</script>

<style scoped>
.items-section {
  padding: 12px 16px;
}

.items-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.item-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px 14px;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 600;
}

.item-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.12);
}

.item-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-icon {
  font-size: 16px;
}

.item-name {
  white-space: nowrap;
}
</style>
