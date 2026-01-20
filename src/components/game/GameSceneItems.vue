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
  padding: 12px 16px;
}

.items-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.item-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 10px 16px;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.item-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.25s;
}

.item-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.item-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 20px rgba(245, 158, 11, 0.1);
}

.item-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.item-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.item-icon {
  font-size: 18px;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.item-name {
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

@media (max-height: 700px) {
  .items-section {
    padding: 8px 12px;
  }

  .item-btn {
    padding: 8px 12px;
    font-size: 11px;
    gap: 8px;
    border-radius: 12px;
  }

  .item-icon {
    font-size: 15px;
  }
}

@media (max-width: 420px) {
  .items-row {
    gap: 8px;
  }

  .item-btn {
    padding: 8px 12px;
  }
}
</style>
