<template>
  <div ref="gameScreen" class="game-screen">
    <!-- Animated background -->
    <div class="bg-effects">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="floating-bullets">
        <div class="bullet b1">🔴</div>
        <div class="bullet b2">⚪</div>
        <div class="bullet b3">🔴</div>
        <div class="bullet b4">⚪</div>
        <div class="bullet b5">🔴</div>
      </div>
    </div>

    <div ref="gameContent" class="game-content">
      
      <!-- OPPONENTS SECTION (TOP) -->
      <div
        class="opponents-row"
        :class="{ 'single-opponent': opponents.length === 1 }"
      >
        <GameScenePlayerCard
          v-for="opponent in opponents"
          :key="opponent.id"
          :player="opponent"
          is-enemy
          show-items
          :is-compact="opponents.length > 1"
          :emoji="playerEmojis?.[opponent.id]"
        />
      </div>

      <!-- CENTER SECTION -->
      <section class="center-section">
        <!-- Turn indicator -->
        <div class="turn-indicator" :class="turnClass">
          {{ phaseLabel }}
        </div>
        <div v-if="turnTimeLeft !== null" class="turn-timer">
          ⏱ {{ turnTimeLeft }}s
        </div>
        <div v-if="turnOrderDisplay.length > 2" class="turn-order-chip">
          <span class="turn-order-label">Ordre</span>
          <div class="turn-order-list">
            <span
              v-for="(entry, index) in turnOrderDisplay"
              :key="entry.key"
              class="turn-order-item"
              :class="{ active: entry.isCurrent, self: entry.isSelf }"
            >
              <span class="turn-order-index">{{ index + 1 }}</span>
              <span class="turn-order-name">{{ entry.name }}</span>
            </span>
          </div>
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
      <div v-if="player.scannerHint" class="scanner-banner">
        📡 Scanner : la {{ player.scannerHint }}ème balle est réelle.
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
        :targets="shootTargets"
        @shoot="emit('shoot', $event)"
      />

      <div class="emoji-toolbar">
        <q-btn
          round
          dense
          flat
          color="white"
          :disable="!canSendEmoji"
          class="emoji-trigger"
          aria-label="Envoyer un emoji"
        >
          <span class="emoji-trigger-icon" aria-hidden="true">😊</span>
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
        :emoji="playerEmojis?.[player?.id]"
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
          <div class="enemy-item-title">Un adversaire utilise</div>
          <div class="enemy-item-name">{{ enemyItemName }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- TARGET PICKER MODAL -->
    <q-dialog v-model="showTargetModal" persistent position="standard">
      <q-card class="target-modal-card">
        <q-card-section class="text-center">
          <div class="target-modal-title">Choisir une cible</div>
          <div class="target-modal-subtitle">Sélectionnez le joueur visé</div>
          <div class="target-modal-buttons">
            <q-btn
              v-for="target in itemTargets"
              :key="target.key"
              color="deep-orange"
              unelevated
              @click="confirmItemTarget(target.key)"
            >
              {{ target.label }}
            </q-btn>
          </div>
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
            <div v-if="revealInverterText" class="reveal-inverter">{{ revealInverterText }}</div>
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
  opponents: {
    type: Array,
    default: () => []
  },
  playersByKey: {
    type: Object,
    default: () => ({})
  },
  localPlayerKey: {
    type: String,
    default: 'player'
  },
  turnOrder: {
    type: Array,
    default: () => []
  },
  currentTurnKey: {
    type: String,
    default: null
  },
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
  playerEmojis: {
    type: Object,
    default: () => ({})
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

// Target picker modal (for items)
const showTargetModal = ref(false);
const pendingItemId = ref(null);

const activePlayers = computed(() => {
  return Object.values(props.playersByKey || {}).filter((player) => player?.isActive && player.hp > 0);
});

const shootTargets = computed(() => {
  return activePlayers.value.map((player) => ({
    key: player.id,
    label: player.id === props.localPlayerKey ? 'Moi' : player.name,
    isSelf: player.id === props.localPlayerKey
  }));
});

const itemTargets = computed(() => {
  return shootTargets.value.filter((target) => target.key !== props.localPlayerKey);
});

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
const revealInverterText = ref('');
const revealCardClass = computed(() => revealIsReal.value ? 'card-real' : 'card-blank');

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
  () => [props.canSendEmoji, props.isAnimating],
  ([canSend, isAnimating]) => {
    if (!canSend || isAnimating) {
      showEmojiPicker.value = false;
    }
  }
);

onMounted(() => {
  const handler = () => {
    if (document.visibilityState === 'visible') {
      resetZoomAfterVisibility();
    }
  };
  visibilityResetHandler.value = handler;
  document.addEventListener('visibilitychange', handler);
  window.addEventListener('focus', handler);
});

onBeforeUnmount(() => {
  if (visibilityResetHandler.value) {
    document.removeEventListener('visibilitychange', visibilityResetHandler.value);
    window.removeEventListener('focus', visibilityResetHandler.value);
  }
});

const canAct = computed(() => {
  if (props.canActOverride !== null) {
    return props.canActOverride;
  }
  return props.currentTurnKey === props.localPlayerKey && !props.isAnimating;
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
const totalSlots = computed(() => props.barrel?.chambers?.length ?? 6);
const currentChamberNumber = computed(() => Math.min((props.barrel?.index ?? 0) + 1, totalSlots.value));
const showBarrelInfo = computed(() => !props.isFlipVisible && !props.barrel.firstShotFired);

const phaseLabel = computed(() => {
  if (props.phase === 'animating') return '⏳ ...';
  if (!props.currentTurnKey) return '';
  if (props.currentTurnKey === props.localPlayerKey) return '🎮 VOTRE TOUR';
  const name = props.playersByKey?.[props.currentTurnKey]?.name || 'Joueur';
  return `🎯 Tour de ${name}`;
});

const turnOrderDisplay = computed(() => {
  return (props.turnOrder || []).map((key) => ({
    key,
    name: props.playersByKey?.[key]?.name || 'Joueur',
    isCurrent: key === props.currentTurnKey,
    isSelf: key === props.localPlayerKey
  }));
});

const turnClass = computed(() => ({
  'turn-player': props.currentTurnKey === props.localPlayerKey,
  'turn-enemy': props.currentTurnKey !== props.localPlayerKey || props.phase === 'animating'
}));

function handleUseItem(itemId) {
  if (itemId === 'handcuffs' && itemTargets.value.length) {
    pendingItemId.value = itemId;
    showTargetModal.value = true;
    return;
  }
  emit('use-item', itemId);
}

function confirmItemTarget(targetKey) {
  if (!pendingItemId.value) return;
  emit('use-item', pendingItemId.value, targetKey);
  pendingItemId.value = null;
  showTargetModal.value = false;
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
  const actorName = actionData.actorName || props.playersByKey?.[actionData.actor]?.name || 'Joueur';
  const targetName = actionData.targetName || props.playersByKey?.[actionData.target]?.name || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.localPlayerKey;
  const targetIsYou = actionData.target === props.localPlayerKey;

  actionModalIcon.value = isSelf ? '🔫' : '🎯';
  if (isSelf) {
    actionModalText.value = isYou
      ? `Vous vous tirez dessus...`
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

// Start zoom animation
function startZoom() {
  if (!gameContent.value) return;
  
  gsap.to(gameContent.value, {
    scale: 2.2,
    duration: 0.8,
    ease: 'power2.out'
  });
}

function setZoom(scale = 1) {
  if (!gameContent.value) return;
  gsap.set(gameContent.value, { scale, x: 0, y: 0 });
}

function resetZoomAfterVisibility() {
  if (!gameContent.value) return;
  gsap.killTweensOf(gameContent.value);
  setZoom(1);
}

// Show shot result modal
async function showShotResult(actionData) {
  const isReal = actionData.shot === 'real';
  revealIsReal.value = isReal;
  revealDamage.value = actionData.damage || 0;
  revealInverterText.value = '';
  
  // Build subtitle text
  const actorName = actionData.actorName || props.playersByKey?.[actionData.actor]?.name || 'Joueur';
  const targetName = actionData.targetName || props.playersByKey?.[actionData.target]?.name || 'Joueur';
  const isSelf = actionData.actorIsSelf ?? (actionData.actor === actionData.target);
  const isYou = actionData.actor === props.localPlayerKey;
  const targetIsYou = actionData.target === props.localPlayerKey;
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
  if (actionData.inverterInfo?.from && actionData.inverterInfo?.to) {
    const formatBullet = (bullet) => bullet === 'real' ? '🔴 réelle' : '⚪ blanche';
    const initial = formatBullet(actionData.inverterInfo.from);
    const flipped = formatBullet(actionData.inverterInfo.to);
    revealInverterText.value = `La balle initiale était ${initial}, elle est devenue ${flipped}.`;
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
  background: #0a0a0f;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Background effects */
.bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 0% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.floating-bullets {
  position: absolute;
  inset: 0;
}

.bullet {
  position: absolute;
  font-size: 20px;
  opacity: 0.15;
  animation: float-bullet 20s ease-in-out infinite;
}

.b1 { top: 15%; left: 10%; animation-delay: 0s; }
.b2 { top: 25%; right: 15%; animation-delay: -4s; }
.b3 { top: 60%; left: 5%; animation-delay: -8s; }
.b4 { top: 70%; right: 8%; animation-delay: -12s; }
.b5 { top: 85%; left: 50%; animation-delay: -16s; }

@keyframes float-bullet {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(90deg); }
  50% { transform: translateY(0) rotate(180deg); }
  75% { transform: translateY(30px) rotate(270deg); }
}

.game-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform-origin: center 45%;
  min-height: 100%;
}

.opponents-row {
  width: 100%;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: 16px 24px 0;
}

.opponents-row.single-opponent {
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
}

.opponents-row.single-opponent :deep(.player-card) {
  width: min(520px, 100%);
}

/* Center section */
.center-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 0;
  padding: 8px 12px;
}

.turn-indicator {
  padding: 8px 22px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 2px solid;
  backdrop-filter: blur(8px);
}

.turn-timer {
  margin-top: 6px;
  padding: 4px 14px;
  border-radius: 20px;
  background: rgba(245, 158, 11, 0.15);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
  animation: timer-pulse 1s ease-in-out infinite;
}

.turn-order-chip {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.25);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.turn-order-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(226, 232, 240, 0.6);
  font-weight: 700;
}

.turn-order-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.turn-order-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.6);
  color: rgba(226, 232, 240, 0.85);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.turn-order-item.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
  color: #bbf7d0;
}

.turn-order-item.self {
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.4);
}

.turn-order-index {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: #0f172a;
  background: rgba(226, 232, 240, 0.9);
}

.turn-order-name {
  white-space: nowrap;
}

@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.turn-player {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
}

.turn-enemy {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
}

.barrel-zone {
  flex-shrink: 0;
}

.barrel-info {
  display: flex;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #71717a;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.separator {
  opacity: 0.4;
  color: #52525b;
}

.emoji-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 10px;
}

.emoji-trigger {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.emoji-trigger-icon {
  font-size: 18px;
  line-height: 1;
}

.emoji-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.emoji-picker-wrapper {
  padding: 8px;
  background: rgba(10, 10, 15, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(12px);
}

.emoji-cooldown {
  font-size: 12px;
  font-weight: 700;
  color: #fbbf24;
  padding: 4px 10px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 12px;
}

/* Peeked banner */
.peeked-banner {
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  max-width: min(90vw, 320px);
  margin: 0 auto;
  border: 2px solid;
  backdrop-filter: blur(8px);
  animation: pulse-peek 2s ease-in-out infinite;
}

.scanner-banner {
  padding: 8px 18px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #bfdbfe;
  background: rgba(30, 64, 175, 0.15);
  backdrop-filter: blur(8px);
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

  .peeked-banner {
    font-size: 10px;
    padding: 6px 12px;
    max-width: min(90vw, 260px);
  }
}

@media (max-width: 640px) {
  .opponents-row {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    padding: 12px 12px 0;
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

  .reveal-inverter {
    font-size: 11px;
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

/* Action choice modal */
.action-modal-card {
  border-radius: 20px;
  padding: 28px 40px;
  min-width: 260px;
  border: 2px solid;
  text-align: center;
  backdrop-filter: blur(16px);
}

.action-self {
  background: linear-gradient(145deg, rgba(34, 197, 94, 0.15), rgba(20, 83, 45, 0.25));
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.05);
}

.action-enemy {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(69, 10, 10, 0.25));
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.2), inset 0 0 30px rgba(239, 68, 68, 0.05);
}

.action-modal-icon {
  font-size: 52px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.action-modal-text {
  font-size: 17px;
  font-weight: 700;
  color: #f4f4f5;
  letter-spacing: 0.02em;
}

/* Enemy item modal */
.enemy-item-card {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 15, 20, 0.95));
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 24px;
  padding: 32px 48px;
  min-width: 280px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 50px rgba(245, 158, 11, 0.15);
}

.enemy-item-icon {
  font-size: 56px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.3));
}

.enemy-item-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 6px;
}

.enemy-item-name {
  font-size: 22px;
  font-weight: 800;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}

/* Target modal */
.target-modal-card {
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.12), rgba(10, 10, 15, 0.95));
  border: 2px solid rgba(59, 130, 246, 0.35);
  border-radius: 24px;
  padding: 28px 36px 32px;
  min-width: min(360px, 90vw);
  text-align: center;
  backdrop-filter: blur(16px);
}

.target-modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #e0f2fe;
  margin-bottom: 6px;
}

.target-modal-subtitle {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.6);
  margin-bottom: 18px;
}

.target-modal-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

/* Reload modal */
.reload-modal-card {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.08), rgba(10, 10, 15, 0.95));
  border: 2px solid rgba(245, 158, 11, 0.35);
  border-radius: 24px;
  padding: 28px 44px;
  min-width: 280px;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 50px rgba(245, 158, 11, 0.1);
}

.reload-icon {
  font-size: 44px;
  margin-bottom: 10px;
  animation: spin-reload 1s ease-out;
}

@keyframes spin-reload {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.reload-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fbbf24;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
}

.reload-subtitle {
  font-size: 13px;
  color: #a1a1aa;
  line-height: 1.4;
}

/* Peek modal */
.peek-modal-card {
  border-radius: 20px;
  padding: 24px 32px;
  width: 240px;
  max-width: 240px;
  border: 2px solid;
  backdrop-filter: blur(16px);
}

.peek-modal-real {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(28, 5, 5, 0.95));
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
}

.peek-modal-blank {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(15, 15, 20, 0.95));
  border-color: rgba(168, 162, 158, 0.4);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}

.peek-modal-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.peek-modal-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.peek-modal-result {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 8px;
  white-space: nowrap;
}

.peek-modal-real .peek-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.peek-modal-blank .peek-modal-result {
  color: #f4f4f5;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.peek-modal-hint {
  font-size: 11px;
  color: #71717a;
  font-style: italic;
}

/* Eject modal */
.eject-modal-card {
  border-radius: 20px;
  padding: 24px 32px;
  width: 260px;
  max-width: 260px;
  border: 2px solid;
  backdrop-filter: blur(16px);
}

.eject-modal-real {
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.15), rgba(28, 5, 5, 0.95));
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 50px rgba(239, 68, 68, 0.2);
}

.eject-modal-blank {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(15, 15, 20, 0.95));
  border-color: rgba(168, 162, 158, 0.4);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}

.eject-modal-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.eject-modal-title {
  font-size: 11px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
}

.eject-modal-result {
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}

.eject-modal-real .eject-modal-result {
  color: #fca5a5;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.eject-modal-blank .eject-modal-result {
  color: #f4f4f5;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

/* Reveal modal (big shot result) */
.reveal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  z-index: 3000;
}

.reveal-card {
  padding: 56px 72px;
  border-radius: 32px;
  text-align: center;
  border: 3px solid;
  animation: reveal-pop 0.4s ease-out;
  max-width: 92vw;
  backdrop-filter: blur(20px);
}

@keyframes reveal-pop {
  0% { transform: scale(0.6) rotate(-5deg); opacity: 0; }
  60% { transform: scale(1.08) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.card-real {
  background: linear-gradient(145deg, rgba(127, 29, 29, 0.9), rgba(69, 10, 10, 0.95));
  border-color: #ef4444;
  box-shadow: 
    0 0 80px rgba(239, 68, 68, 0.5),
    0 0 150px rgba(239, 68, 68, 0.3),
    inset 0 0 60px rgba(239, 68, 68, 0.1);
}

.card-blank {
  background: linear-gradient(145deg, rgba(63, 63, 70, 0.9), rgba(39, 39, 42, 0.95));
  border-color: #a1a1aa;
  box-shadow: 
    0 0 60px rgba(161, 161, 170, 0.2),
    inset 0 0 40px rgba(255, 255, 255, 0.02);
}

.reveal-icon {
  font-size: 90px;
  margin-bottom: 20px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
}

.reveal-title {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.card-real .reveal-title {
  color: #fecaca;
  text-shadow: 0 0 50px rgba(239, 68, 68, 0.7);
}

.card-blank .reveal-title {
  color: #f4f4f5;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.reveal-subtitle {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 10px;
}

.reveal-inverter {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
}

.reveal-damage {
  font-size: 36px;
  font-weight: 900;
  color: #ef4444;
  margin-top: 20px;
  padding: 8px 24px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 16px;
  display: inline-block;
  animation: shake-dmg 0.4s ease-out;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

@keyframes shake-dmg {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px) rotate(-2deg); }
  40% { transform: translateX(10px) rotate(2deg); }
  60% { transform: translateX(-6px) rotate(-1deg); }
  80% { transform: translateX(6px) rotate(1deg); }
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
