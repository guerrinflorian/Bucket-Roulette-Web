<template>
  <section v-if="items?.length" class="items-section">
    <div class="items-row">
      <button
        v-for="(itemId, index) in items"
        :key="`${itemId}-${index}`"
        class="item-btn"
        :disabled="!canUseItems"
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
import { computed } from 'vue';
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  canAct: {
    type: Boolean,
    default: false
  },
  canUseItems: {
    type: Boolean,
    default: null
  }
});

const canUseItems = computed(() => {
  if (props.canUseItems === null) {
    return props.canAct;
  }
  return props.canUseItems;
});

const emit = defineEmits(['use-item']);

const itemData = {
  heart: { emoji: '❤️', name: '+1 PV', description: 'Soigne 1 PV (max).'},
  double: { emoji: '⚡', name: 'Double dégâts', description: 'Le prochain tir consomme l’effet.' },
  peek: { emoji: '🔍', name: 'Voir la balle', description: 'Révèle la prochaine cartouche.' },
  eject: { emoji: '🔄', name: 'Éjecter', description: 'Retire la prochaine cartouche sans tirer.' },
  handcuffs: { emoji: '⛓️', name: 'Les Menottes', description: "Empêche l'adversaire de jouer au prochain tour." }
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
  padding: 10px 14px;
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
  padding: 8px 12px;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
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

@media (max-height: 700px) {
  .items-section {
    padding: 6px 12px;
  }

  .item-btn {
    padding: 6px 10px;
    font-size: 10px;
    gap: 6px;
  }

  .item-icon {
    font-size: 14px;
  }
}

@media (max-width: 420px) {
  .items-row {
    gap: 6px;
  }
}
</style>
