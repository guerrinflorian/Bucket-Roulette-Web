<template>
  <section v-if="items?.length" class="w-full overflow-hidden">
    <div class="flex flex-nowrap justify-start gap-1.5 overflow-x-auto px-2 pb-2 sm:justify-center sm:gap-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
      <button
        v-for="(itemId, index) in items"
        :key="`${itemId}-${index}`"
        class="group relative flex flex-shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[0.6rem] font-semibold text-white shadow-md shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs"
        :disabled="!canUseItems"
        @click="handleUseItem(itemId)"
      >
        <img
          :src="getItemImage(itemId)"
          :alt="getItemName(itemId)"
          class="h-4 w-4 object-contain drop-shadow sm:h-6 sm:w-6"
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
