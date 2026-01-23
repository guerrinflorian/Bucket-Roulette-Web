<template>
  <div class="lobby-panel lobby-chat">
    <div class="lobby-chat-header">
      <div>
        <div class="chat-title">💬 Salon de discussion</div>
        <div class="chat-subtitle">Discutez avant le lancement de la partie</div>
      </div>
      <div class="chat-status">
        <span class="status-dot"></span>
        {{ netStore.roomPlayers.length }} en ligne
      </div>
    </div>

    <div ref="chatScrollRef" class="chat-messages">
      <div v-if="!lobbyChatMessages.length" class="chat-empty">
        Lancez la discussion et partagez vos stratégies. 🎯
      </div>
      <q-chat-message
        v-for="message in lobbyChatMessages"
        :key="message.id"
        :name="message.name"
        :text="[message.text]"
        :sent="message.isSelf"
        :stamp="formatChatTime(message.timestamp)"
        :bg-color="message.type === 'system' ? 'grey-9' : message.isSelf ? 'deep-orange-6' : 'blue-grey-9'"
        :text-color="message.type === 'system' ? 'blue-grey-2' : 'white'"
        class="lobby-chat-message"
      >
        <template v-slot:avatar>
          <q-avatar size="36px" class="chat-avatar" :class="{ 'chat-avatar--system': message.type === 'system' }">
            <Avatar
              v-if="message.name"
              :name="getAvatarSeed(message.name)"
              variant="beam"
              :size="36"
              :colors="avatarColors"
            />
            <div v-else class="chat-avatar-placeholder">💬</div>
          </q-avatar>
        </template>
      </q-chat-message>
    </div>

    <form class="chat-input-row" @submit.prevent="sendChatMessage">
      <q-btn
        ref="emojiButtonRef"
        flat
        dense
        class="chat-emoji-btn"
        :disable="!netStore.roomId"
        aria-label="Ajouter un emoji"
        @click="showEmojiPicker = true"
      >
        😊
        <q-menu v-model="showEmojiPicker" anchor="top left" self="bottom left">
          <EmojiPicker :native="true" @select="handleEmojiSelect" />
        </q-menu>
      </q-btn>
      <input
        v-model="chatInput"
        type="text"
        class="chat-input"
        placeholder="Écrivez un message..."
        maxlength="150"
        :disabled="!netStore.roomId"
      />
      <button type="submit" class="chat-send-btn" :disabled="!canSendChat">
        {{ chatCooldownLeft > 0 ? `Attendre ${chatCooldownLeft}s` : 'Envoyer' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { useNetStore } from '../stores/netStore.js';
import Avatar from 'vue-boring-avatars';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const netStore = useNetStore();
const CHAT_COOLDOWN_MS = 3000;

const chatInput = ref('');
const showEmojiPicker = ref(false);
const emojiButtonRef = ref(null);
const chatScrollRef = ref(null);
const nowTick = ref(Date.now());
const lobbyChatMessages = computed(() => netStore.lobbyChatMessages);
const chatCooldownLeft = computed(() => {
  const remaining = CHAT_COOLDOWN_MS - (nowTick.value - (netStore.lastLobbyChatSentAt || 0));
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 1000);
});
const canSendChat = computed(() => {
  const hasMessage = chatInput.value.trim().length > 0;
  return hasMessage && !!netStore.roomId && chatCooldownLeft.value === 0;
});
const avatarColors = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90'];

const getAvatarSeed = (name) => name?.split(' ')[0] || name || 'Joueur';

const formatChatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sendChatMessage = () => {
  if (!canSendChat.value) return;
  netStore.sendLobbyChat(chatInput.value);
  chatInput.value = '';
  showEmojiPicker.value = false;
};

const handleEmojiSelect = (emoji) => {
  if (!emoji || !emoji.i) return;
  chatInput.value = `${chatInput.value}${emoji.i}`;
  showEmojiPicker.value = false;
};

watch(
  () => lobbyChatMessages.value.length,
  async () => {
    await nextTick();
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  }
);

watch(
  () => netStore.roomId,
  () => {
    chatInput.value = '';
    showEmojiPicker.value = false;
  }
);

let tickInterval = null;

onMounted(() => {
  tickInterval = setInterval(() => {
    nowTick.value = Date.now();
  }, 250);
});

onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval);
});
</script>

<style scoped>
.lobby-chat {
  background: rgba(15, 20, 30, 0.85);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(100, 120, 160, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
}

.lobby-chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chat-title {
  font-size: 18px;
  font-weight: 700;
  color: #fef3c7;
}

.chat-subtitle {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.75);
}

.chat-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #bbf7d0;
  background: rgba(22, 163, 74, 0.15);
  border: 1px solid rgba(22, 163, 74, 0.3);
  padding: 4px 10px;
  border-radius: 999px;
}

.chat-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.7);
}

.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 6px;
}

.chat-empty {
  color: rgba(226, 232, 240, 0.7);
  font-style: italic;
  text-align: center;
  padding: 20px 0;
}

.lobby-chat :deep(.q-message-name) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.lobby-chat :deep(.q-message-text) {
  font-size: 13px;
}

.lobby-chat :deep(.q-message-stamp) {
  opacity: 0.7;
  font-size: 11px;
}

.chat-avatar {
  border: 2px solid rgba(148, 163, 184, 0.4);
  background: rgba(30, 41, 59, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-avatar--system {
  border-color: rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.4);
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(8, 12, 18, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 10px 12px;
  border-radius: 14px;
  flex-wrap: wrap;
}

.chat-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 13px;
  outline: none;
}

.chat-input::placeholder {
  color: rgba(226, 232, 240, 0.6);
}

.chat-emoji-btn {
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: #f8fafc;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 32px;
}

.chat-emoji-btn:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.25);
}

.chat-emoji-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-send-btn {
  border: none;
  background: linear-gradient(135deg, #f97316 0%, #f43f5e 100%);
  color: white;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 10px;
  min-width: 110px;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(244, 63, 94, 0.35);
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .lobby-chat {
    min-height: 320px;
  }

  .chat-messages {
    max-height: 240px;
  }
}
</style>
