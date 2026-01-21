<template>
  <section class="relative w-full px-4 pb-4 md:px-6">
    <div class="flex items-end gap-2" :class="isSingleOpponent ? 'mx-auto max-w-xl' : ''">
      <GameScenePlayerCard
        :player="player"
        :is-reversed="true"
        :is-bottom="true"
        :emoji="playerEmojis?.[player?.id]"
        class="flex-1"
      />
      <div class="mb-2 flex flex-col items-center gap-1">
        <q-btn
          round
          dense
          flat
          color="white"
          :disable="!canSendEmoji"
          class="border border-white/10 bg-white/5 backdrop-blur hover:bg-white/10"
          aria-label="Envoyer un emoji"
        >
          <span class="text-lg" aria-hidden="true">😊</span>
          <q-tooltip>Envoyer un emoji</q-tooltip>
          <q-menu v-model="showEmojiPicker" anchor="top middle" self="bottom middle">
            <div class="rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur">
              <EmojiPicker
                :native="true"
                theme="dark"
                @select="onEmojiSelect"
              />
            </div>
          </q-menu>
        </q-btn>
        <div
          v-if="!canSendEmoji && emojiCooldownLeft > 0"
          class="rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.6rem] font-bold text-amber-300"
        >
          {{ emojiCooldownLeft }}s
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import GameScenePlayerCard from './GameScenePlayerCard.vue';

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  canSendEmoji: {
    type: Boolean,
    default: true
  },
  emojiCooldownLeft: {
    type: Number,
    default: 0
  },
  isAnimating: {
    type: Boolean,
    default: false
  },
  playerEmojis: {
    type: Object,
    default: () => ({})
  },
  isSingleOpponent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send-emoji']);
const showEmojiPicker = ref(false);

const onEmojiSelect = (emoji) => {
  if (!emoji || !emoji.i) return;
  emit('send-emoji', emoji.i);
  showEmojiPicker.value = false;
};

watch(
  () => [props.canSendEmoji, props.isAnimating],
  ([canSend, isAnimating]) => {
    if (!canSend || isAnimating) {
      showEmojiPicker.value = false;
    }
  }
);
</script>
