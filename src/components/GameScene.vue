<template>
  <div ref="gameScreen" class="game-screen">
    <div ref="gameContent" class="game-content">
      
      <!-- ENEMY SECTION (TOP) -->
      <section class="player-section enemy-section">
        <div class="player-card">
          <img 
            src="../assets/portraits/enemy_portrait.png" 
            alt="Ennemi" 
            class="player-avatar"
          />
          <div class="player-info">
            <div class="player-header">
              <span class="player-name">{{ enemy.name }}</span>
              <span class="player-hp-text">{{ enemy.hp }}/{{ enemy.maxHp }}</span>
            </div>
            <div class="hp-bar">
              <div 
                class="hp-fill hp-enemy"
                :style="{ width: enemyHpPercent + '%' }"
              ></div>
            </div>
          </div>
          <!-- Enemy items -->
          <div v-if="enemy.items?.length" class="enemy-items">
            <span 
              v-for="(itemId, index) in enemy.items" 
              :key="index"
              class="enemy-item-badge"
              :title="getItemName(itemId)"
            >
              {{ getItemEmoji(itemId) }}
            </span>
          </div>
        </div>
      </section>

      <!-- CENTER SECTION -->
      <section class="center-section">
        <!-- Turn indicator -->
        <div class="turn-indicator" :class="turnClass">
          {{ phaseLabel }}
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
        <div class="barrel-info">
          <span>🔴 {{ realCount }} réelles</span>
          <span class="separator">•</span>
          <span>⚪ {{ blankCount }} blanches</span>
        </div>
      </section>

      <!-- PEEKED INFO (always visible when peeked) -->
      <div v-if="player.peekedNext" class="peeked-banner" :class="player.peekedNext === 'real' ? 'peek-real' : 'peek-blank'">
        🔍 Prochaine balle : <strong>{{ player.peekedNext === 'real' ? 'RÉELLE 🔴' : 'BLANCHE ⚪' }}</strong>
      </div>

      <!-- ITEMS SECTION -->
      <section v-if="player.items?.length" class="items-section">
        <div class="items-row">
          <button
            v-for="(itemId, index) in player.items"
            :key="`${itemId}-${index}`"
            class="item-btn"
            :disabled="!canAct"
            @click="handleUseItem(itemId)"
          >
            <span class="item-icon">{{ getItemEmoji(itemId) }}</span>
            <span class="item-name">{{ getItemName(itemId) }}</span>
          </button>
        </div>
      </section>

      <!-- ACTION BUTTONS -->
      <section class="actions-section">
        <button
          class="shoot-btn shoot-enemy"
          :disabled="!canAct"
          @click="emit('shoot', 'enemy')"
        >
          🎯 Tirer sur l'ennemi
        </button>
        <button
          class="shoot-btn shoot-self"
          :disabled="!canAct"
          @click="emit('shoot', 'self')"
        >
          🔫 Se tirer dessus
        </button>
      </section>

      <!-- PLAYER SECTION (BOTTOM) -->
      <section class="player-section player-section-bottom">
        <div class="player-card player-card-reverse">
          <div class="player-info">
            <div class="player-header">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-hp-text">{{ player.hp }}/{{ player.maxHp }}</span>
            </div>
            <div class="hp-bar">
              <div 
                class="hp-fill hp-player"
                :style="{ width: playerHpPercent + '%' }"
              ></div>
            </div>
          </div>
          <img 
            src="../assets/portraits/player_back.png" 
            alt="Vous" 
            class="player-avatar"
          />
        </div>
      </section>

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
import { computed, ref, nextTick } from 'vue';
import { gsap } from 'gsap';
import BarrelRevolver from './BarrelRevolver.vue';
import { remainingCounts } from '../engine/barrel.js';

const props = defineProps({
  player: Object,
  enemy: Object,
  barrel: Object,
  phase: String,
  lastResult: Object,
  lastAction: Object,
  isAnimating: Boolean
});

const emit = defineEmits(['shoot', 'use-item']);

const gameScreen = ref(null);
const gameContent = ref(null);
const barrelComp = ref(null);

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

// Computed
const enemyHpPercent = computed(() => (props.enemy.hp / props.enemy.maxHp) * 100);
const playerHpPercent = computed(() => (props.player.hp / props.player.maxHp) * 100);
const canAct = computed(() => props.phase === 'player_turn' && !props.isAnimating);

const counts = computed(() => remainingCounts(props.barrel));
const realCount = computed(() => counts.value.real);
const blankCount = computed(() => counts.value.blank);

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

// Item helpers
const itemData = {
  heart: { emoji: '❤️', name: '+1 PV' },
  double: { emoji: '⚡', name: 'Double dégâts' },
  peek: { emoji: '🔍', name: 'Voir la balle' },
  eject: { emoji: '🔄', name: 'Éjecter' },
  invert: { emoji: '🔀', name: 'Inverser cible' }
};

function getItemEmoji(id) {
  return itemData[id]?.emoji || '📦';
}

function getItemName(id) {
  return itemData[id]?.name || id;
}

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

// Show action choice modal (before shooting)
async function showActionChoice(actionData) {
  const isSelf = actionData.actor === actionData.target;
  
  if (actionData.actor === 'player') {
    actionModalIcon.value = isSelf ? '🔫' : '🎯';
    actionModalText.value = isSelf ? 'Vous vous tirez dessus...' : "Vous tirez sur l'ennemi...";
    actionModalClass.value = isSelf ? 'action-self' : 'action-enemy';
  } else {
    actionModalIcon.value = isSelf ? '💀' : '☠️';
    actionModalText.value = isSelf ? "L'ennemi se tire dessus..." : "L'ennemi vous tire dessus...";
    actionModalClass.value = isSelf ? 'action-self' : 'action-enemy';
  }
  
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

// Show shot result modal
async function showShotResult(actionData) {
  const isReal = actionData.shot === 'real';
  revealIsReal.value = isReal;
  revealDamage.value = actionData.damage || 0;
  
  // Build subtitle text
  const isSelf = actionData.actor === actionData.target;
  if (actionData.actor === 'player') {
    revealSubtitle.value = isSelf 
      ? 'Vous vous êtes tiré dessus' 
      : "Vous avez tiré sur l'ennemi";
  } else {
    revealSubtitle.value = isSelf 
      ? "L'ennemi s'est tiré dessus" 
      : "L'ennemi vous a tiré dessus";
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
  rotateBarrel,
  revealBullet,
  dropBullet,
  hideBullet
});
</script>

<style scoped>
.game-screen {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to bottom, #1c1917, #0c0a09, #000);
  overflow: hidden;
  position: relative;
}

.game-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform-origin: center 45%;
}

/* Player sections */
.player-section {
  flex-shrink: 0;
  padding: 12px 16px;
}

.player-section-bottom {
  padding-bottom: 16px;
}

.player-card {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.player-card-reverse {
  flex-direction: row-reverse;
}

/* Enemy items display */
.enemy-items {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.enemy-item-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 14px;
  cursor: help;
}

.player-avatar {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.player-name {
  font-size: 14px;
  font-weight: 700;
  color: #e7e5e4;
}

.player-hp-text {
  font-size: 12px;
  font-family: monospace;
  color: #a8a29e;
}

.hp-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.hp-enemy {
  background: linear-gradient(90deg, #b91c1c, #ef4444);
}

.hp-player {
  background: linear-gradient(90deg, #15803d, #22c55e);
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
  padding: 8px;
}

.turn-indicator {
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 2px solid;
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
  font-size: 11px;
  color: #78716c;
}

.separator {
  opacity: 0.5;
}

/* Peeked banner */
.peeked-banner {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  border: 2px solid;
  animation: pulse-peek 2s ease-in-out infinite;
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

/* Items */
.items-section {
  flex-shrink: 0;
  padding: 0 16px 8px;
  text-align: center;
}

.items-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.item-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.item-btn:not(:disabled):hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(245, 158, 11, 0.5);
  transform: translateY(-2px);
}

.item-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.item-icon {
  font-size: 22px;
}

.item-name {
  font-size: 9px;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.peek-info {
  margin-top: 8px;
  font-size: 11px;
  color: #fbbf24;
}

/* Actions */
.actions-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 0 16px 12px;
}

.shoot-btn {
  flex: 1;
  max-width: 200px;
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(145deg, rgba(30,30,30,0.9), rgba(10,10,10,0.95));
}

.shoot-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shoot-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.shoot-enemy {
  color: #fca5a5;
  border-color: rgba(239,68,68,0.5);
}

.shoot-enemy:not(:disabled):hover {
  background: linear-gradient(145deg, rgba(127,29,29,0.6), rgba(30,30,30,0.9));
  box-shadow: 0 0 20px rgba(239,68,68,0.2);
}

.shoot-self {
  color: #86efac;
  border-color: rgba(34,197,94,0.5);
}

.shoot-self:not(:disabled):hover {
  background: linear-gradient(145deg, rgba(20,83,45,0.6), rgba(30,30,30,0.9));
  box-shadow: 0 0 20px rgba(34,197,94,0.2);
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
  z-index: 3000;
}

.reveal-card {
  padding: 48px 64px;
  border-radius: 28px;
  text-align: center;
  border: 3px solid;
  animation: reveal-pop 0.4s ease-out;
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
