<template>
  <div>
    <GameSceneActionModal
      v-model="showActionModal"
      :icon="actionModalIcon"
      :text="actionModalText"
      :card-class="actionModalClass"
    />

    <GameSceneReloadModal v-model="showReloadModal" :text="reloadText" />

    <GameSceneEnemyItemModal
      v-model="showEnemyItemModal"
      :emoji="enemyItemEmoji"
      :name="enemyItemName"
    />

    <GameSceneTargetModal
      v-model="showTargetModal"
      :targets="itemTargets"
      @confirm="confirmItemTarget"
    />

    <GameScenePeekModal v-model="showPeekModal" :is-real="peekResultIsReal" />

    <GameSceneEjectModal v-model="showEjectModal" :is-real="ejectResultIsReal" />

    <GameSceneRevealModal
      :model-value="showRevealModal"
      :is-real="revealIsReal"
      :subtitle="revealSubtitle"
      :inverter-text="revealInverterText"
      :damage="revealDamage"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GameSceneActionModal from './modals/GameSceneActionModal.vue';
import GameSceneReloadModal from './modals/GameSceneReloadModal.vue';
import GameSceneEnemyItemModal from './modals/GameSceneEnemyItemModal.vue';
import GameSceneTargetModal from './modals/GameSceneTargetModal.vue';
import GameScenePeekModal from './modals/GameScenePeekModal.vue';
import GameSceneEjectModal from './modals/GameSceneEjectModal.vue';
import GameSceneRevealModal from './modals/GameSceneRevealModal.vue';

const props = defineProps({
  playersByKey: {
    type: Object,
    default: () => ({})
  },
  localPlayerKey: {
    type: String,
    default: 'player'
  },
  itemTargets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['confirm-item-target']);

const showActionModal = ref(false);
const actionModalText = ref('');
const actionModalIcon = ref('');
const actionModalClass = ref('');

const showEnemyItemModal = ref(false);
const enemyItemEmoji = ref('');
const enemyItemName = ref('');

const showTargetModal = ref(false);
const pendingItemId = ref(null);

const showPeekModal = ref(false);
const peekResultIsReal = ref(false);

const showEjectModal = ref(false);
const ejectResultIsReal = ref(false);

const showReloadModal = ref(false);
const reloadText = ref('Cartouches mélangées aléatoirement.');

const showRevealModal = ref(false);
const revealIsReal = ref(false);
const revealSubtitle = ref('');
const revealDamage = ref(0);
const revealInverterText = ref('');

const itemData = {
  heart: { emoji: '❤️', name: '+1 PV' },
  double: { emoji: '⚡', name: 'Double dégâts' },
  peek: { emoji: '🔍', name: 'Voir la balle' },
  eject: { emoji: '🔄', name: 'Éjecter' },
  handcuffs: { emoji: '⛓️', name: 'Les Menottes' },
  inverter: { emoji: '🔁', name: "L'Inverseur" },
  scanner: { emoji: '📡', name: 'Scanner' }
};

function getItemEmoji(id) {
  return itemData[id]?.emoji || '📦';
}

function getItemName(id) {
  return itemData[id]?.name || id;
}

function openTargetPicker(itemId) {
  pendingItemId.value = itemId;
  showTargetModal.value = true;
}

function confirmItemTarget(targetKey) {
  if (!pendingItemId.value) return;
  emit('confirm-item-target', pendingItemId.value, targetKey);
  pendingItemId.value = null;
  showTargetModal.value = false;
}

async function showEnemyUsingItem(itemId) {
  enemyItemEmoji.value = getItemEmoji(itemId);
  enemyItemName.value = getItemName(itemId);
  showEnemyItemModal.value = true;

  await new Promise(resolve => setTimeout(resolve, 2000));
  showEnemyItemModal.value = false;
}

async function showPeekResult(isReal) {
  peekResultIsReal.value = isReal;
  showPeekModal.value = true;

  await new Promise(resolve => setTimeout(resolve, 2500));
  showPeekModal.value = false;
}

async function showEjectResult(isReal) {
  ejectResultIsReal.value = isReal;
  showEjectModal.value = true;

  await new Promise(resolve => setTimeout(resolve, 2000));
  showEjectModal.value = false;
}

async function showReloadNotice(text = 'Barillet chargé.') {
  reloadText.value = text || 'Barillet chargé.';
  showReloadModal.value = true;
  await new Promise(resolve => setTimeout(resolve, 2400));
  showReloadModal.value = false;
}

async function showActionChoice(actionData) {
  const actorName = actionData.actorName || props.playersByKey?.[actionData.actor]?.name || 'Joueur';
  const targetName = actionData.targetName || props.playersByKey?.[actionData.target]?.name || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.localPlayerKey;
  const targetIsYou = actionData.target === props.localPlayerKey;

  actionModalIcon.value = isSelf ? '🔫' : '🎯';
  if (isSelf) {
    actionModalText.value = isYou
      ? 'Vous vous tirez dessus...'
      : `${actorName} s'est tiré dessus...`;
  } else {
    actionModalText.value = isYou
      ? `Vous tirez sur ${targetName}...`
      : targetIsYou
        ? `${actorName} tire sur vous...`
        : `${actorName} tire sur ${targetName}...`;
  }
  actionModalClass.value = isSelf ? 'action-self' : 'action-enemy';

  showActionModal.value = true;
  await new Promise(r => setTimeout(r, 1800));
  showActionModal.value = false;
}

async function showShotResult(actionData) {
  const isReal = actionData.shot === 'real';
  revealIsReal.value = isReal;
  revealDamage.value = actionData.damage || 0;
  revealInverterText.value = '';

  const actorName = actionData.actorName || props.playersByKey?.[actionData.actor]?.name || 'Joueur';
  const targetName = actionData.targetName || props.playersByKey?.[actionData.target]?.name || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.localPlayerKey;
  const targetIsYou = actionData.target === props.localPlayerKey;

  if (isSelf) {
    revealSubtitle.value = isYou
      ? 'Vous vous êtes tiré dessus'
      : `${actorName} s'est tiré dessus`;
  } else if (isYou) {
    revealSubtitle.value = `Vous avez tiré sur ${targetName}`;
  } else if (targetIsYou) {
    revealSubtitle.value = `${actorName} vous a tiré dessus`;
  } else {
    revealSubtitle.value = `${actorName} a tiré sur ${targetName}`;
  }

  if (actionData.inverterInfo?.from && actionData.inverterInfo?.to) {
    const formatBullet = (bullet) => bullet === 'real' ? '🔴 réelle' : '⚪ blanche';
    const initial = formatBullet(actionData.inverterInfo.from);
    const flipped = formatBullet(actionData.inverterInfo.to);
    revealInverterText.value = `La balle initiale était ${initial}, elle est devenue ${flipped}.`;
  }

  showRevealModal.value = true;
  await new Promise(r => setTimeout(r, 2200));
  showRevealModal.value = false;
}

defineExpose({
  openTargetPicker,
  showActionChoice,
  showEnemyUsingItem,
  showPeekResult,
  showEjectResult,
  showReloadNotice,
  showShotResult
});
</script>

<style scoped>
:deep(.q-dialog__inner--standard) {
  padding: 18px 12px;
}
</style>
