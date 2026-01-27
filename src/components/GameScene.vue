<template>
  <div
    ref="gameScreen"
    class="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#0a0a0f] text-white"
    style="padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);"
  >
    <GameSceneBackground />

    <div
      ref="gameContent"
      class="relative z-10 flex min-h-[100dvh] w-full flex-col"
      style="transform-origin: center 45%;"
    >
      <GameSceneOpponentsRow
        :opponents="opponents"
        :player-emojis="playerEmojis"
      />

      <section class="flex flex-1 flex-col justify-center gap-4 px-4 py-2 md:px-6">
        <GameSceneCenter
          ref="barrelComp"
          :players-by-key="playersByKey"
          :local-player-key="localPlayerKey"
          :turn-order="turnOrder"
          :current-turn-key="currentTurnKey"
          :barrel="barrel"
          :turn-time-left="turnTimeLeft"
          :show-barrel-info="showBarrelInfo"
          :real-count="realCount"
          :blank-count="blankCount"
          :current-chamber-number="currentChamberNumber"
          :total-slots="totalSlots"
          :phase="phase"
          :scanner-hint="player.scannerHint"
          @animation-start="onBarrelAnimStart"
          @animation-end="onBarrelAnimEnd"
        />

        <GameSceneStatusBanners
          :peeked-next="player.peekedNext"
        />
      </section>

      <section class="w-full px-4 pb-2 md:px-6">
        <div class="flex flex-col items-center gap-3">
          <GameSceneActions
            :can-act="canAct"
            :targets="shootTargets"
            @shoot="emit('shoot', $event)"
          />
          <GameSceneItems
            :items="player.items"
            :can-act="canAct"
            :can-use-items="canUseItems"
            @use-item="handleUseItem"
          />
        </div>
      </section>

      <GameScenePlayerArea
        :player="player"
        :can-send-emoji="canSendEmoji"
        :emoji-cooldown-left="emojiCooldownLeft"
        :is-animating="isAnimating"
        :player-emojis="playerEmojis"
        :is-single-opponent="isSingleOpponent"
        @send-emoji="emit('send-emoji', $event)"
      />
    </div>

    <GameSceneModals
      ref="modalsRef"
      :players-by-key="playersByKey"
      :local-player-key="localPlayerKey"
      :item-targets="itemTargets"
      @confirm-item-target="confirmItemTarget"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Notify } from 'quasar';
import { gsap } from 'gsap';
import GameSceneBackground from './game/GameSceneBackground.vue';
import GameSceneCenter from './game/GameSceneCenter.vue';
import GameSceneModals from './game/GameSceneModals.vue';
import GameSceneOpponentsRow from './game/GameSceneOpponentsRow.vue';
import GameSceneStatusBanners from './game/GameSceneStatusBanners.vue';
import GameScenePlayerArea from './game/GameScenePlayerArea.vue';
import GameSceneActions from './game/GameSceneActions.vue';
import GameSceneItems from './game/GameSceneItems.vue';
import { remainingCounts } from '../engine/barrel.js';

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
const modalsRef = ref(null);
const visibilityResetHandler = ref(null);

const activePlayers = computed(() => {
  return Object.values(props.playersByKey || {}).filter((player) => player?.isActive && player.hp > 0);
});

const isSingleOpponent = computed(() => props.opponents.length === 1);

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

const counts = computed(() => {
  const base = remainingCounts(props.barrel);
  // Hide inverter changes to preserve mystery
  if (props.barrel.invertedNext) {
    const { from, to } = props.barrel.invertedNext;
    if (to === 'blank' && from === 'real') {
      return { ...base, real: base.real + 1, blank: base.blank - 1 };
    }
    if (to === 'real' && from === 'blank') {
      return { ...base, real: base.real - 1, blank: base.blank + 1 };
    }
  }
  return base;
});
const realCount = computed(() => counts.value.real);
const blankCount = computed(() => counts.value.blank);
const totalSlots = computed(() => props.barrel?.chambers?.length ?? 6);
const currentChamberNumber = computed(() => Math.min((props.barrel?.index ?? 0) + 1, totalSlots.value));
const showBarrelInfo = computed(() => !props.isFlipVisible && !props.barrel.firstShotFired);

const notifyScannerHint = (scannerHint) => {
  const hintValue = Number(scannerHint);
  if (!Number.isFinite(hintValue) || hintValue <= 0) return;
  const suffix = hintValue === 1 ? 'ère' : 'ème';
  const actorName = props.player?.name || 'Vous';
  Notify.create({
    message: `📡 ${actorName} a scanné : la ${hintValue}${suffix} balle est réelle.`,
    timeout: 4000,
    color: 'blue-6',
    textColor: 'white',
    icon: 'sensors',
    position: 'top'
  });
};

watch(
  () => props.player?.scannerHint,
  (next, prev) => {
    if (!next || next === prev) return;
    if (prev && next < prev && props.lastAction?.itemId !== 'scanner') {
      return;
    }
    notifyScannerHint(next);
  }
);

function handleUseItem(itemId) {
  if (itemId === 'handcuffs' && itemTargets.value.length) {
    if (itemTargets.value.length === 1) {
      emit('use-item', itemId, itemTargets.value[0].key);
      return;
    }
    modalsRef.value?.openTargetPicker?.(itemId);
    return;
  }
  emit('use-item', itemId);
}

function confirmItemTarget(itemId, targetKey) {
  if (!itemId) return;
  emit('use-item', itemId, targetKey);
}

function onBarrelAnimStart() {
  // Could add effects here
}

function onBarrelAnimEnd() {
  // Animation completed
}

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

async function showActionChoice(actionData) {
  return modalsRef.value?.showActionChoice?.(actionData);
}

async function showEnemyUsingItem(itemId) {
  return modalsRef.value?.showEnemyUsingItem?.(itemId);
}

async function showPeekResult(isReal) {
  return modalsRef.value?.showPeekResult?.(isReal);
}

async function showEjectResult(isReal) {
  return modalsRef.value?.showEjectResult?.(isReal);
}

async function showReloadNotice(text = 'Barillet chargé.') {
  return modalsRef.value?.showReloadNotice?.(text);
}

async function showShotResult(actionData) {
  const isReal = actionData.shot === 'real';
  const modalPromise = modalsRef.value?.showShotResult?.(actionData);

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

  return modalPromise;
}

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

function rotateBarrel() {
  return barrelComp.value?.rotateToNextSlot?.();
}

function revealBullet(isReal) {
  return barrelComp.value?.revealBullet?.(isReal);
}

async function dropBullet() {
  if (barrelComp.value?.dropBullet) {
    await barrelComp.value.dropBullet();
  }
}

function hideBullet() {
  if (barrelComp.value?.hideBullet) {
    barrelComp.value.hideBullet();
  }
}

function openItemTargetPicker(itemId) {
  modalsRef.value?.openTargetPicker?.(itemId);
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
  hideBullet,
  openItemTargetPicker
});
</script>
