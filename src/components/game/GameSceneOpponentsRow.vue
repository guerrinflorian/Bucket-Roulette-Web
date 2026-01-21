<template>
  <section
    class="flex w-full flex-nowrap items-stretch justify-center gap-0.5 overflow-x-auto px-1 pt-1 sm:gap-2 sm:px-4 sm:pt-3 md:px-6"
  >
    <GameScenePlayerCard
      v-for="opponent in opponents"
      :key="opponent.id"
      :player="opponent"
      is-enemy
      show-items
      :is-compact="opponents.length > 1"
      :emoji="playerEmojis?.[opponent.id]"
      class="min-w-[150px] flex-shrink-0 sm:min-w-[200px]"
      :class="isSingleOpponent ? 'max-w-xl flex-1' : 'max-w-[180px] sm:max-w-[280px]'"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import GameScenePlayerCard from './GameScenePlayerCard.vue';

const props = defineProps({
  opponents: {
    type: Array,
    default: () => []
  },
  playerEmojis: {
    type: Object,
    default: () => ({})
  }
});

const isSingleOpponent = computed(() => props.opponents.length === 1);
</script>
