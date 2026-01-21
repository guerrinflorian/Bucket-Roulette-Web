<template>
  <section v-if="items?.length" class="px-4 pb-4">
    <div class="flex max-h-32 flex-wrap justify-center gap-2 overflow-y-auto">
      <button
        v-for="(itemId, index) in items"
        :key="`${itemId}-${index}`"
        class="group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        :disabled="!canUseItems"
        @click="handleUseItem(itemId)"
      >
        <img
          :src="getItemImage(itemId)"
          :alt="getItemName(itemId)"
          class="h-6 w-6 object-contain drop-shadow"
        />
        <span class="whitespace-nowrap">{{ getItemName(itemId) }}</span>
        <q-tooltip>{{ getItemName(itemId) }} — {{ getItemDescription(itemId) }}</q-tooltip>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import heartImg from '../../assets/items/heart.png';
import doubleImg from '../../assets/items/double.png';
import peekImg from '../../assets/items/peek.png';
import ejectImg from '../../assets/items/eject.png';
import handcuffsImg from '../../assets/items/handcuffs.png';
import inverterImg from '../../assets/items/inverter.png';
import scannerImg from '../../assets/items/scanner.png';
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
  heart: { image: heartImg, name: '+1 PV', description: 'Soigne 1 PV (max).' },
  double: { image: doubleImg, name: 'Double dégâts', description: 'Le prochain tir consomme l’effet.' },
  peek: { image: peekImg, name: 'Voir la balle', description: 'Révèle la prochaine cartouche.' },
  eject: { image: ejectImg, name: 'Éjecter', description: 'Retire la prochaine cartouche sans tirer.' },
  handcuffs: { image: handcuffsImg, name: 'Les Menottes', description: 'Choisissez un adversaire à bloquer au prochain tour.' },
  inverter: { image: inverterImg, name: "L'Inverseur", description: 'Inverse la balle actuelle : blanche ⇄ réelle.' },
  scanner: { image: scannerImg, name: 'Scanner', description: "Révèle la position d'une balle réelle." }
};

function getItemImage(id) {
  return itemData[id]?.image || heartImg;
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
