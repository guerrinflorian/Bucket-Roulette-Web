<template>
  <div ref="gameScreen" class="game-screen">
    <div ref="gameContent" class="game-content">
      
      <!-- ENEMY SECTION (TOP) -->
      <GameScenePlayerCard
        :player="enemy"
        is-enemy
        show-items
        :emoji="enemyEmoji"
      />

      <!-- CENTER SECTION -->
      <section class="center-section">
        <!-- Turn indicator -->
        <div class="turn-indicator" :class="turnClass">
          {{ phaseLabel }}
        </div>
        <div v-if="turnTimeLeft !== null" class="turn-timer">
          ⏱ {{ turnTimeLeft }}s
        </div>
        
        <!-- Barrel -->
        <div class="barrel-zone">
          <BarrelRevolver
            ref="barrelComp"
            :barrel-data="barrel"
            @animation-start="onBarrelAnimStart"
            @animation-end="onBarrelAnimEnd"
          />
        </div>
        
        <!-- Barrel Info -->
        <div v-if="showBarrelInfo" class="barrel-info">
          <span>🔴 {{ realCount }} réelles</span>
          <span class="separator">•</span>
          <span>⚪ {{ blankCount }} blanches</span>
          <span class="separator">•</span>
          <span>🎲 {{ totalCount }} cartouches</span>
        </div>
      </section>

      <!-- PEEKED INFO (always visible when peeked) -->
      <div v-if="player.peekedNext" class="peeked-banner" :class="player.peekedNext === 'real' ? 'peek-real' : 'peek-blank'">
        🔍 Prochaine balle : <strong>{{ player.peekedNext === 'real' ? 'RÉELLE 🔴' : 'BLANCHE ⚪' }}</strong>
      </div>

      <!-- ITEMS SECTION -->
      <GameSceneItems
        :items="player.items"
        :can-act="canAct"
        :can-use-items="canUseItems"
        @use-item="handleUseItem"
      />

      <!-- ACTION BUTTONS -->
      <GameSceneActions
        :can-act="canAct"
        @shoot="emit('shoot', $event)"
      />

      <div class="emoji-toolbar">
        <q-btn
          round
          dense
          flat
          icon="emoji_emotions"
          color="white"
          :disable="!canSendEmoji"
          class="emoji-trigger"
        >
          <q-tooltip>Envoyer un emoji</q-tooltip>
          <q-menu v-model="showEmojiPicker" anchor="top middle" self="bottom middle">
            <div class="emoji-picker-wrapper">
              <EmojiPicker 
                :native="true" 
                theme="dark"
                @select="onEmojiSelect" 
              />
            </div>
          </q-menu>
        </q-btn>
        <div v-if="!canSendEmoji && emojiCooldownLeft > 0" class="emoji-cooldown">
          ⏳ {{ emojiCooldownLeft }}s
        </div>
      </div>

      <!-- PLAYER SECTION (BOTTOM) -->
      <GameScenePlayerCard
        :player="player"
        :is-reversed="true"
        :is-bottom="true"
        :emoji="playerEmoji"
      />

    </div>

    <!-- ACTION CHOICE MODAL (shown before shooting) -->
    <q-dialog v-model="showActionModal" persistent position="standard">
      <q-card class="action-modal-card" :class="actionModalClass">
        <q-card-section class="text-center">
          <div class="action-modal-icon">{{ actionModalIcon }}</div>
          <div class="action-modal-text">{{ actionModalText }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- RELOAD MODAL -->
    <q-dialog v-model="showReloadModal" persistent position="standard">
      <q-card class="reload-modal-card">
        <q-card-section class="text-center">
          <div class="reload-icon">🔄</div>
          <div class="reload-title">Barillet chargé</div>
          <div class="reload-subtitle">{{ reloadText }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ENEMY ITEM MODAL -->
    <q-dialog v-model="showEnemyItemModal" persistent position="standard">
      <q-card class="enemy-item-card">
        <q-card-section class="text-center">
          <div class="enemy-item-icon">{{ enemyItemEmoji }}</div>
          <div class="enemy-item-title">L'ennemi utilise</div>
          <div class="enemy-item-name">{{ enemyItemName }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- PEEK RESULT MODAL -->
    <q-dialog v-model="showPeekModal" persistent position="standard">
      <q-card class="peek-modal-card" :class="peekResultIsReal ? 'peek-modal-real' : 'peek-modal-blank'">
        <q-card-section class="text-center">
          <div class="peek-modal-icon">🔍</div>
          <div class="peek-modal-title">Prochaine balle</div>
          <div class="peek-modal-result">
            {{ peekResultIsReal ? '🔴 RÉELLE' : '⚪ BLANCHE' }}
          </div>
          <div class="peek-modal-hint">
            {{ peekResultIsReal ? 'Attention, ça va faire mal !' : 'Pas de danger immédiat' }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- EJECT RESULT MODAL -->
    <q-dialog v-model="showEjectModal" persistent position="standard">
      <q-card class="eject-modal-card" :class="ejectResultIsReal ? 'eject-modal-real' : 'eject-modal-blank'">
        <q-card-section class="text-center">
          <div class="eject-modal-icon">⏏️</div>
          <div class="eject-modal-title">Cartouche éjectée</div>
          <div class="eject-modal-result">
            {{ ejectResultIsReal ? '🔴 RÉELLE' : '⚪ BLANCHE' }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- SHOT REVEAL MODAL -->
    <Teleport to="body">
      <Transition name="reveal-fade">
        <div v-if="showRevealModal" class="reveal-overlay">
          <div class="reveal-card" :class="revealCardClass">
            <div class="reveal-icon">{{ revealIsReal ? '💥' : '💨' }}</div>
            <div class="reveal-title">{{ revealIsReal ? 'BALLE RÉELLE !' : 'À BLANC' }}</div>
            <div class="reveal-subtitle">{{ revealSubtitle }}</div>
            <div v-if="revealDamage > 0" class="reveal-damage">-{{ revealDamage }} PV</div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';
import BarrelRevolver from './BarrelRevolver.vue';
import GameSceneActions from './game/GameSceneActions.vue';
import GameSceneItems from './game/GameSceneItems.vue';
import GameScenePlayerCard from './game/GameScenePlayerCard.vue';
import { remainingCounts } from '../engine/barrel.js';
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const props = defineProps({
  player: Object,
  enemy: Object,
  barrel: Object,
  phase: String,
  isFlipVisible: {
    type: Boolean,
    default: false
  },
  lastResult: Object,
  lastAction: Object,
  isAnimating: Boolean,
  turnTimeLeft: {
    type: Number,
    default: null
  },
  canActOverride: {
    type: Boolean,
    default: null
  },
  canUseItems: {
    type: Boolean,
    default: null
  },
  canSendEmoji: {
    type: Boolean,
    default: true
  },
  emojiCooldownLeft: {
    type: Number,
    default: 0
  },
  playerEmoji: {
    type: String,
    default: ''
  },
  enemyEmoji: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['shoot', 'use-item', 'send-emoji']);

const gameScreen = ref(null);
const gameContent = ref(null);
const barrelComp = ref(null);
const showEmojiPicker = ref(false);
const visibilityResetHandler = ref(null);

// Action choice modal (before shooting)
const showActionModal = ref(false);
const actionModalText = ref('');
const actionModalIcon = ref('');
const actionModalClass = ref('');

// Enemy item modal
const showEnemyItemModal = ref(false);
const enemyItemEmoji = ref('');
const enemyItemName = ref('');

// Peek result modal
const showPeekModal = ref(false);
const peekResultIsReal = ref(false);

// Eject result modal
const showEjectModal = ref(false);
const ejectResultIsReal = ref(false);

// Shot reveal modal
const showRevealModal = ref(false);
const revealIsReal = ref(false);
const revealSubtitle = ref('');
const revealDamage = ref(0);
const revealCardClass = computed(() => revealIsReal.value ? 'card-real' : 'card-blank');

const itemData = {
  heart: { emoji: '❤️', name: '+1 PV' },
  double: { emoji: '⚡', name: 'Double dégâts' },
  peek: { emoji: '🔍', name: 'Voir la balle' },
  eject: { emoji: '🔄', name: 'Éjecter' },
  handcuffs: { emoji: '⛓️', name: 'Les Menottes' }
};

function getItemEmoji(id) {
  return itemData[id]?.emoji || '📦';
}

function getItemName(id) {
  return itemData[id]?.name || id;
}

// Reload modal
const showReloadModal = ref(false);
const reloadText = ref('Cartouches mélangées aléatoirement.');

// Computed
const onEmojiSelect = (emoji) => {
  // L'objet renvoyé par ce picker contient l'emoji dans la propriété 'i'
  if (!emoji || !emoji.i) return;
  
  emit('send-emoji', emoji.i);
  showEmojiPicker.value = false;
};

watch(
  () => [props.turnTimeLeft, props.canSendEmoji, props.isAnimating, props.phase],
  ([turnLeft, canSend, isAnimating, phase]) => {
    if (turnLeft !== null && turnLeft <= 3) {
      showEmojiPicker.value = false;
      return;
    }
    if (!canSend || isAnimating || phase !== 'player_turn') {
      showEmojiPicker.value = false;
    }
  }
);

onMounted(() => {
  const handler = () => {
    if (document.visibilityState === 'visible') {
      resetZoom();
    }
  };
  visibilityResetHandler.value = handler;
  document.addEventListener('visibilitychange', handler);
});

onBeforeUnmount(() => {
  if (visibilityResetHandler.value) {
    document.removeEventListener('visibilitychange', visibilityResetHandler.value);
  }
});

const canAct = computed(() => {
  if (props.canActOverride !== null) {
    return props.canActOverride;
  }
  return props.phase === 'player_turn' && !props.isAnimating;
});
const canUseItems = computed(() => {
  if (props.canUseItems !== null) {
    return props.canUseItems;
  }
  return canAct.value;
});

const counts = computed(() => remainingCounts(props.barrel));
const realCount = computed(() => counts.value.real);
const blankCount = computed(() => counts.value.blank);
const totalCount = computed(() => counts.value.remaining);
const showBarrelInfo = computed(() => !props.isFlipVisible && !props.barrel?.firstShotFired);

const phaseLabel = computed(() => {
  if (props.phase === 'player_turn') return '🎮 VOTRE TOUR';
  if (props.phase === 'enemy_turn') return "💀 TOUR DE L'ENNEMI";
  if (props.phase === 'animating') return '⏳ ...';
  return '';
});

const turnClass = computed(() => ({
  'turn-player': props.phase === 'player_turn',
  'turn-enemy': props.phase === 'enemy_turn' || props.phase === 'animating'
}));

function handleUseItem(itemId) {
  emit('use-item', itemId);
}

// Animation handlers
function onBarrelAnimStart() {
  // Could add effects here
}

function onBarrelAnimEnd() {
  // Animation completed
}

// Show enemy using an item
async function showEnemyUsingItem(itemId) {
  enemyItemEmoji.value = getItemEmoji(itemId);
  enemyItemName.value = getItemName(itemId);
  showEnemyItemModal.value = true;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  showEnemyItemModal.value = false;
}

// Show peek result
async function showPeekResult(isReal) {
  peekResultIsReal.value = isReal;
  showPeekModal.value = true;
  
  await new Promise(resolve => setTimeout(resolve, 2500));
  showPeekModal.value = false;
}

// Show eject result
async function showEjectResult(isReal) {
  ejectResultIsReal.value = isReal;
  showEjectModal.value = true;
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  showEjectModal.value = false;
}

// Show reload modal
async function showReloadNotice(text = 'Barillet chargé.') {
  reloadText.value = text || 'Barillet chargé.';
  showReloadModal.value = true;
  await new Promise(resolve => setTimeout(resolve, 2400));
  showReloadModal.value = false;
}

// Show action choice modal (before shooting)
async function showActionChoice(actionData) {
  const actorName = actionData.actorName || (actionData.actor === 'player' ? props.player?.name : props.enemy?.name) || 'Joueur';
  const targetName = actionData.targetName || (actionData.target === 'player' ? props.player?.name : props.enemy?.name) || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.player?.id;

  actionModalIcon.value = isSelf ? '🔫' : '🎯';
  if (isSelf) {
    actionModalText.value = isYou
      ? `Vous vous tirez dessus...`
      : `${actorName} s'est tiré dessus...`;
  } else {
    actionModalText.value = isYou
      ? `Vous tirez sur ${targetName}...`
      : `${actorName} tire sur vous...`;
  }
  actionModalClass.value = isSelf ? 'action-self' : 'action-enemy';
  
  showActionModal.value = true;
  await new Promise(r => setTimeout(r, 1800));
  showActionModal.value = false;
}

// Start zoom animation
function startZoom() {
  if (!gameContent.value) return;
  
  gsap.to(gameContent.value, {
    scale: 2.2,
    duration: 0.8,
    ease: 'power2.out'
  });
}

function resetZoom() {
  if (!gameContent.value) return;
  gsap.set(gameContent.value, { scale: 1, x: 0, y: 0 });
}

// Show shot result modal
async function showShotResult(actionData) {
  const isReal = actionData.shot === 'real';
  revealIsReal.value = isReal;
  revealDamage.value = actionData.damage || 0;
  
  // Build subtitle text
  const actorName = actionData.actorName || (actionData.actor === 'player' ? props.player?.name : props.enemy?.name) || 'Joueur';
  const targetName = actionData.targetName || (actionData.target === 'player' ? props.player?.name : props.enemy?.name) || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.player?.id;
  const targetIsYou = actionData.target === props.player?.id;
  if (isSelf) {
    revealSubtitle.value = isYou
      ? `Vous vous êtes tiré dessus`
      : `${actorName} s'est tiré dessus`;
  } else if (isYou) {
    revealSubtitle.value = `Vous avez tiré sur ${targetName}`;
  } else if (targetIsYou) {
    revealSubtitle.value = `${actorName} vous a tiré dessus`;
  } else {
    revealSubtitle.value = `${actorName} a tiré sur ${targetName}`;
  }
  
  // Show modal
  showRevealModal.value = true;
  
  // Shake if real bullet
  if (isReal && gameContent.value) {
    gsap.to(gameContent.value, {
      x: 'random(-12, 12)',
      y: 'random(-8, 8)',
      duration: 0.05,
      repeat: 6,
      yoyo: true,
      ease: 'none',
      onComplete: () => {
        gsap.set(gameContent.value, { x: 0, y: 0 });
      }
    });
  }
  
  // Wait for player to read
  await new Promise(r => setTimeout(r, 2200));
  
  // Hide modal
  showRevealModal.value = false;
}

// End zoom animation
async function endZoom() {
  if (!gameContent.value) return;
  
  return new Promise(resolve => {
    gsap.to(gameContent.value, {
      scale: 1,
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: resolve
    });
  });
}

// Rotate barrel to next slot (called before shooting)
function rotateBarrel() {
  if (barrelComp.value?.rotateToNextSlot) {
    return barrelComp.value.rotateToNextSlot();
  }
  return false;
}

// Show red bullet reveal (for real bullets)
function revealBullet(isReal) {
  if (barrelComp.value?.revealBullet) {
    return barrelComp.value.revealBullet(isReal);
  }
  return false;
}

// Drop bullet animation (when HP changes)
async function dropBullet() {
  if (barrelComp.value?.dropBullet) {
    await barrelComp.value.dropBullet();
  }
}

// Hide bullet without animation
function hideBullet() {
  if (barrelComp.value?.hideBullet) {
    barrelComp.value.hideBullet();
  }
}

defineExpose({
  showActionChoice,
  startZoom,
  showShotResult,
  endZoom,
  showEnemyUsingItem,
  showPeekResult,
  showEjectResult,
  showReloadNotice,
  rotateBarrel,
  revealBullet,
  dropBullet,
  hideBullet
});
</script>

<style scoped>
.game-screen {
  width: 100vw;
  height: 100dvh;
  min-height: 100vh;
  background: linear-gradient(to bottom, #1c1917, #0c0a09, #000);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.game-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform-origin: center 45%;
  min-height: 100%;
}

/* Center section */
.center-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 0;
  padding: 6px 8px;
}

.turn-indicator {
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 2px solid;
}

.turn-timer {
  margin-top: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fef3c7;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.turn-player {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.4);
}

.turn-enemy {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.barrel-zone {
  flex-shrink: 0;
}

.barrel-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #78716c;
}

.separator {
  opacity: 0.5;
}

.emoji-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-bottom: 8px;
}

.emoji-trigger {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(6px);
}

.emoji-picker-wrapper {
  padding: 8px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
}

.emoji-cooldown {
  font-size: 12px;
  font-weight: 600;
  color: #facc15;
}

/* Peeked banner */
.peeked-banner {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  border: 2px solid;
  animation: pulse-peek 2s ease-in-out infinite;
}

:deep(.q-dialog__inner--standard) {
  padding: 18px 12px;
}

@media (max-height: 740px) {
  .game-content {
    gap: 4px;
  }

  .center-section {
    gap: 6px;
  }

  .turn-indicator {
    font-size: 10px;
    padding: 5px 14px;
  }

  .barrel-info {
    display: none;
  }

  .peeked-banner {
    font-size: 11px;
    padding: 6px 12px;
  }
}

@media (max-width: 420px) {
  .emoji-toolbar {
    padding-bottom: 6px;
  }

  .action-modal-card,
  .enemy-item-card,
  .reload-modal-card,
  .peek-modal-card,
  .eject-modal-card {
    min-width: 0;
    width: min(90vw, 320px);
    max-width: 90vw;
    padding: 16px 18px;
  }

  .enemy-item-card,
  .reload-modal-card {
    padding: 18px 20px;
  }

  .action-modal-icon {
    font-size: 34px;
  }

  .action-modal-text {
    font-size: 14px;
  }

  .enemy-item-icon {
    font-size: 38px;
  }

  .enemy-item-name {
    font-size: 16px;
  }

  .reload-title {
    font-size: 14px;
  }

  .reload-subtitle {
    font-size: 11px;
  }

  .peek-modal-result,
  .eject-modal-result {
    font-size: 16px;
  }

  .reveal-card {
    padding: 28px 24px;
  }

  .reveal-icon {
    font-size: 56px;
  }

  .reveal-title {
    font-size: 26px;
  }

  .reveal-subtitle {
    font-size: 13px;
  }

  .reveal-damage {
    font-size: 24px;
  }
}

@keyframes pulse-peek {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.peek-real {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.5);
}

.peek-blank {
  background: rgba(168, 162, 158, 0.15);
  color: #d6d3d1;
  border-color: rgba(168, 162, 158, 0.4);
}

/* Enemy item modal */
/* Action choice modal */
.action-modal-card {
  border-radius: 16px;
  padding: 20px 32px;
  min-width: 240px;
  border: 2px solid;
  text-align: center;
}

.action-self {
  background: linear-gradient(145deg, #1e3a2f, #14532d);
  border-color: rgba(34, 197, 94, 0.5);
}

.action-enemy {
  background: linear-gradient(145deg, #3b1c1c, #450a0a);
  border-color: rgba(239, 68, 68, 0.5);
}

.action-modal-icon {
  font-size: 42px;
  margin-bottom: 8px;
}

.action-modal-text {
  font-size: 16px;
  font-weight: 700;
  color: #e7e5e4;
  letter-spacing: 0.02em;
}

.enemy-item-card {
  background: linear-gradient(145deg, #292524, #1c1917);
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 20px;
  padding: 24px 40px;
  min-width: 260px;
}

.enemy-item-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.enemy-item-title {
  font-size: 12px;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.enemy-item-name {
  font-size: 20px;
  font-weight: 700;
  color: #fbbf24;
}

/* Reload modal */
.reload-modal-card {
  background: linear-gradient(145deg, #1c1917, #0c0a09);
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 20px;
  padding: 22px 36px;
  min-width: 260px;
}

.reload-icon {
  font-size: 36px;
  margin-bottom: 6px;
}

.reload-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fbbf24;
  margin-bottom: 4px;
}

.reload-subtitle {
  font-size: 12px;
  color: #a8a29e;
}

/* Peek modal */
.peek-modal-card {
  border-radius: 16px;
  padding: 16px 24px;
  width: 200px;
  max-width: 200px;
  border: 2px solid;
}

.peek-modal-real {
  background: linear-gradient(145deg, #450a0a, #1c0505);
  border-color: rgba(239, 68, 68, 0.6);
}

.peek-modal-blank {
  background: linear-gradient(145deg, #292524, #1c1917);
  border-color: rgba(168, 162, 158, 0.4);
}

.peek-modal-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.peek-modal-title {
  font-size: 10px;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.peek-modal-result {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 4px;
  white-space: nowrap;
}

.peek-modal-real .peek-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

.peek-modal-blank .peek-modal-result {
  color: #e7e5e4;
}

.peek-modal-hint {
  font-size: 10px;
  color: #78716c;
  font-style: italic;
}

/* Eject modal */
.eject-modal-card {
  border-radius: 16px;
  padding: 16px 24px;
  width: 220px;
  max-width: 220px;
  border: 2px solid;
}

.eject-modal-real {
  background: linear-gradient(145deg, #450a0a, #1c0505);
  border-color: rgba(239, 68, 68, 0.6);
}

.eject-modal-blank {
  background: linear-gradient(145deg, #292524, #1c1917);
  border-color: rgba(168, 162, 158, 0.4);
}

.eject-modal-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.eject-modal-title {
  font-size: 10px;
  color: #a8a29e;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.eject-modal-result {
  font-size: 18px;
  font-weight: 800;
  white-space: nowrap;
}

.eject-modal-real .eject-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
}

.eject-modal-blank .eject-modal-result {
  color: #e7e5e4;
}

/* Reveal modal */
.reveal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  z-index: 3000;
}

.reveal-card {
  padding: 48px 64px;
  border-radius: 28px;
  text-align: center;
  border: 3px solid;
  animation: reveal-pop 0.4s ease-out;
  max-width: 92vw;
}

@keyframes reveal-pop {
  0% { transform: scale(0.7); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.card-real {
  background: linear-gradient(145deg, #7f1d1d, #450a0a);
  border-color: #ef4444;
  box-shadow: 0 0 100px rgba(239,68,68,0.5);
}

.card-blank {
  background: linear-gradient(145deg, #3f3f46, #27272a);
  border-color: #71717a;
  box-shadow: 0 0 60px rgba(0,0,0,0.5);
}

.reveal-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.reveal-title {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.card-real .reveal-title {
  color: #fca5a5;
  text-shadow: 0 0 40px rgba(239,68,68,0.6);
}

.card-blank .reveal-title {
  color: #e4e4e7;
}

.reveal-subtitle {
  font-size: 16px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 8px;
}

.reveal-damage {
  font-size: 32px;
  font-weight: 900;
  color: #ef4444;
  margin-top: 16px;
  animation: shake-dmg 0.4s ease-out;
}

@keyframes shake-dmg {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Transitions */
.reveal-fade-enter-active {
  transition: opacity 0.2s ease;
}
.reveal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.reveal-fade-enter-from,
.reveal-fade-leave-to {
  opacity: 0;
}
</style>
