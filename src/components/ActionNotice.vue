<template>
  <transition name="fade">
    <div v-if="visible" class="action-notice">
      <div class="action-notice__card">
        <p class="action-notice__title">{{ title }}</p>
        <p class="action-notice__message">{{ message }}</p>
        <p v-if="detail" class="action-notice__detail">{{ detail }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { getItemById } from '../engine/items.js';

const props = defineProps({
  action: Object,
  result: Object
});

const visible = ref(false);
const title = ref('');
const message = ref('');
const detail = ref('');
let timer;

const buildMessage = () => {
  const action = props.action;
  if (!action) return;
  const actorLabel = action.actor === 'player' ? 'Vous' : "L'ennemi";
  const verb = action.actor === 'player' ? 'utilisez' : 'utilise';

  if (action.type === 'item') {
    const item = getItemById(action.itemId);
    title.value = `${actorLabel} ${verb} un objet`;
    message.value = item?.name ?? action.itemId;
    detail.value = props.result?.text ?? '';
    return;
  }

  if (action.type === 'shot') {
    const targetLabel = action.target === 'player' ? 'vous' : "l'ennemi";
    title.value = action.actor === 'player' ? `${actorLabel} tirez` : `${actorLabel} tire`;
    message.value = `Cible : ${targetLabel}`;
    detail.value = props.result?.text ?? '';
  }
};

const showNotice = () => {
  buildMessage();
  visible.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = false;
  }, 1800);
};

watch(
  () => props.action,
  (action) => {
    if (!action) return;
    showNotice();
  }
);

watch(
  () => props.result,
  (result) => {
    if (!result) return;
    if (!props.action) {
      message.value = result.text;
      title.value = 'Action';
      detail.value = '';
      visible.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        visible.value = false;
      }, 1600);
    }
  }
);
</script>

<style scoped>
.action-notice {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  pointer-events: none;
  z-index: 30;
  padding-top: 16px;
}

.action-notice__card {
  background: rgba(5, 3, 2, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 12px 18px;
  border-radius: 14px;
  text-align: center;
  min-width: 240px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.action-notice__title {
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.action-notice__message {
  font-weight: 700;
  margin-top: 4px;
}

.action-notice__detail {
  font-size: 12px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.65);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
