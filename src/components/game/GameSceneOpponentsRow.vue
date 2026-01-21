<template>
  <section
    class="flex w-full flex-nowrap items-stretch gap-3 overflow-x-auto px-4 pt-4 md:px-6"
    :class="isSingleOpponent ? 'justify-center' : 'justify-start'"
  >
    <GameScenePlayerCard
      v-for="opponent in opponents"
      :key="opponent.id"
      :player="opponent"
      is-enemy
      show-items
      :is-compact="opponents.length > 1"
      :emoji="playerEmojis?.[opponent.id]"
      class="min-w-[220px] max-w-[360px] flex-1"
      :class="isSingleOpponent ? 'max-w-xl' : ''"
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
