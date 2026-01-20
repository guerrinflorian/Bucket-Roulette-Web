<template>
  <div class="barrel-wrapper">
    <!-- Fixed Indicator Arrow -->
    <div class="barrel-indicator">
      <svg viewBox="0 0 24 24" class="indicator-arrow">
        <path fill="currentColor" d="M12 2L8 10h8L12 2z"/>
      </svg>
      <span class="indicator-label">PROCHAIN TIR</span>
    </div>
    
    <!-- Barrel Container -->
    <div ref="barrelContainer" class="barrel-container">
      <div ref="cylinder" class="barrel-wheel" :style="barrelRotationStyle">
        <!-- Center Hub -->
        <div class="barrel-center">
          <div class="barrel-center-inner"></div>
        </div>
        
        <!-- 6 Chamber Slots -->
        <div
          v-for="(chamber, i) in 6"
          :key="i"
          class="chamber-slot"
          :class="getSlotClass(i)"
          :style="getSlotPosition(i)"
        >
          <div class="chamber-inner">
            <!-- Revealed bullet (real or blank) -->
            <span
              v-if="showRevealBullet && i === currentRevealIndex"
              :class="revealIsReal ? 'bullet-real' : 'bullet-blank'"
              ref="revealBulletEl"
            ></span>
            <!-- Spent = empty hole -->
            <span v-else-if="isSpent(i)" class="bullet-empty"></span>
            <!-- Unknown = ? -->
            <span v-else class="bullet-unknown">?</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Falling bullet element (for drop animation) -->
    <div ref="fallingBullet" class="falling-bullet" v-show="showFallingBullet">
      <span class="bullet-real-falling"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  barrelData: Object
});

const emit = defineEmits(['animation-start', 'animation-end']);

const cylinder = ref(null);
const barrelContainer = ref(null);
const fallingBullet = ref(null);

// Manual rotation control - only rotates when we tell it to
const rotationAngle = ref(360); // Start at 360 (one full turn back from 0)
const hasHadFirstSpin = ref(false);
const transitionEnabled = ref(false);

// Reveal bullet state
const showRevealBullet = ref(false);
const showFallingBullet = ref(false);
const currentRevealIndex = ref(0);
const revealIsReal = ref(false);

function playReloadAnimation() {
  if (!barrelContainer.value) return;
  const spins = Math.floor(Math.random() * 3) + 2;
  const randomSlot = Math.floor(Math.random() * 6);
  transitionEnabled.value = false;
  rotationAngle.value = 360 + spins * 360 + randomSlot * 60;
  gsap.set(barrelContainer.value, { opacity: 0 });
  setTimeout(() => {
    rotationAngle.value = 360;
    gsap.to(barrelContainer.value, {
      opacity: 1,
      duration: 0.35,
      ease: 'power1.out'
    });
  }, 180);
}

// Rotation style with controllable transition
const barrelRotationStyle = computed(() => {
  return {
    transform: `rotate(${rotationAngle.value}deg)`,
    transition: transitionEnabled.value 
      ? 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' 
      : 'none'
  };
});

// Check if chamber was already fired (based on actual data)
function isSpent(index) {
  if (!props.barrelData) return false;
  // Don't mark as spent if we're revealing a bullet there
  if (showRevealBullet.value && index === currentRevealIndex.value) return false;
  return index < props.barrelData.index;
}

function getSlotClass(index) {
  return {
    'chamber-spent': isSpent(index),
    'chamber-reveal': showRevealBullet.value && index === currentRevealIndex.value,
    'chamber-reveal-real': showRevealBullet.value && index === currentRevealIndex.value && revealIsReal.value,
    'chamber-reveal-blank': showRevealBullet.value && index === currentRevealIndex.value && !revealIsReal.value
  };
}

// Position chambers in circle - slot 0 at TOP
function getSlotPosition(i) {
  const total = 6;
  const radius = 52;
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return {
    transform: `translate(${x}px, ${y}px)`
  };
}

// Rotate to show the current index slot at top
// ALWAYS rotates - even for first shot
function rotateToNextSlot() {
  const targetIndex = props.barrelData?.index || 0;
  // Target angle: negative because we rotate clockwise
  // Each slot is 60 degrees
  const targetAngle = -targetIndex * 60;
  
  // First shot - animate from initial position (360) to target
  if (!hasHadFirstSpin.value) {
    hasHadFirstSpin.value = true;
    // Enable transition and animate to target
    transitionEnabled.value = true;
    rotationAngle.value = targetAngle;
    return true;
  }
  
  // Already at target angle? Add a full rotation for dramatic effect
  if (rotationAngle.value === targetAngle) {
    // Disable transition, jump back one full rotation
    transitionEnabled.value = false;
    rotationAngle.value = targetAngle + 360;
    
    // Force reflow then animate
    setTimeout(() => {
      transitionEnabled.value = true;
      rotationAngle.value = targetAngle;
    }, 20);
    return true;
  }
  
  // Normal case: just animate to new target
  transitionEnabled.value = true;
  rotationAngle.value = targetAngle;
  return true;
}

// Show red bullet at current slot (for real bullets)
function revealBullet(isReal) {
  revealIsReal.value = !!isReal;
  currentRevealIndex.value = props.barrelData?.index || 0;
  showRevealBullet.value = true;
  return true;
}

// Drop the bullet with GSAP animation
async function dropBullet() {
  if (!showRevealBullet.value) return;
  
  // Get position of the revealed bullet slot
  const bulletEl = barrelContainer.value?.querySelector('.bullet-real');
  if (!bulletEl || !fallingBullet.value) {
    showRevealBullet.value = false;
    return;
  }
  
  // Get bullet position relative to viewport
  const rect = bulletEl.getBoundingClientRect();
  
  // Position falling bullet at the same spot
  gsap.set(fallingBullet.value, {
    position: 'fixed',
    left: rect.left + rect.width / 2,
    top: rect.top + rect.height / 2,
    x: '-50%',
    y: '-50%',
    scale: 1,
    opacity: 1
  });
  
  // Hide the original
  showRevealBullet.value = false;
  showFallingBullet.value = true;
  
  // Animate: jump up then fall down
  await gsap.to(fallingBullet.value, {
    y: -80,
    scale: 1.3,
    duration: 0.25,
    ease: 'power2.out'
  });
  
  await gsap.to(fallingBullet.value, {
    y: window.innerHeight + 100,
    scale: 0.8,
    rotation: 720,
    duration: 0.8,
    ease: 'power2.in'
  });
  
  showFallingBullet.value = false;
}

// Hide bullet without animation
function hideBullet() {
  showRevealBullet.value = false;
  showFallingBullet.value = false;
}

// Reset when barrel is replaced (new round)
watch(() => props.barrelData, (next, prev) => {
  // Check if it's a completely new barrel (reload)
  if (next && prev && next !== prev && next.index === 0) {
    // Reset to initial position (one full turn back from 0)
    transitionEnabled.value = false;
    rotationAngle.value = 360;
    hasHadFirstSpin.value = false;
    showRevealBullet.value = false;
    showFallingBullet.value = false;
    revealIsReal.value = false;
    playReloadAnimation();
  }
}, { deep: false });

defineExpose({ 
  cylinder,
  barrelContainer,
  rotateToNextSlot,
  revealBullet,
  dropBullet,
  hideBullet
});
</script>

<style scoped>
.barrel-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36px;
}

.barrel-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 10;
}

.indicator-arrow {
  width: 28px;
  height: 28px;
  color: #f59e0b;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  animation: bounce-arrow 1.5s ease-in-out infinite;
}

@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.indicator-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #f59e0b;
  text-transform: uppercase;
  white-space: nowrap;
}

.barrel-container {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.barrel-wheel {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2520, #1a1512);
  border: 4px solid #3d352d;
  box-shadow: 
    inset 0 0 25px rgba(0,0,0,0.6),
    0 6px 24px rgba(0,0,0,0.5),
    0 0 0 2px rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.barrel-center {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1a1512, #0d0a07);
  border: 2px solid #3d352d;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.barrel-center-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0d0a07;
  border: 1px solid #2a2520;
}

.chamber-slot {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1a1512, #0d0a07);
  border: 2px solid #3d352d;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.6);
  transition: opacity 0.3s ease, background 0.3s ease;
}

.chamber-inner {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bullet-unknown {
  color: #57534e;
  font-size: 11px;
}

.bullet-empty {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0a0806;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
}

.bullet-real {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b);
  box-shadow: 
    0 0 12px rgba(220, 38, 38, 0.8),
    0 0 24px rgba(220, 38, 38, 0.4),
    inset 0 -2px 4px rgba(0,0,0,0.3);
  animation: bullet-pulse-real 0.5s ease-in-out infinite alternate;
}

.bullet-blank {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffffff, #f8fafc, #e2e8f0);
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.9),
    0 0 20px rgba(255, 255, 255, 0.6),
    inset 0 -2px 4px rgba(0,0,0,0.25);
  animation: bullet-pulse-blank 0.5s ease-in-out infinite alternate;
}

@keyframes bullet-pulse-real {
  from { 
    box-shadow: 
      0 0 12px rgba(220, 38, 38, 0.8),
      0 0 24px rgba(220, 38, 38, 0.4),
      inset 0 -2px 4px rgba(0,0,0,0.3);
  }
  to { 
    box-shadow: 
      0 0 18px rgba(220, 38, 38, 1),
      0 0 36px rgba(220, 38, 38, 0.6),
      inset 0 -2px 4px rgba(0,0,0,0.3);
  }
}

@keyframes bullet-pulse-blank {
  from { 
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.7),
      0 0 20px rgba(255, 255, 255, 0.5),
      inset 0 -2px 4px rgba(0,0,0,0.25);
  }
  to { 
    box-shadow: 
      0 0 16px rgba(255, 255, 255, 1),
      0 0 28px rgba(255, 255, 255, 0.7),
      inset 0 -2px 4px rgba(0,0,0,0.25);
  }
}

.chamber-reveal {
  background: linear-gradient(145deg, #1a1512, #0d0a07) !important;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.6);
}

.chamber-reveal-real {
  background: linear-gradient(145deg, #2a1a1a, #1a0a0a) !important;
  border-color: #dc2626 !important;
  box-shadow: 
    inset 0 2px 5px rgba(0,0,0,0.6),
    0 0 15px rgba(220, 38, 38, 0.5) !important;
}

.chamber-reveal-blank {
  background: linear-gradient(145deg, #ffffff, #e2e8f0) !important;
  border-color: #f8fafc !important;
  box-shadow: 
    inset 0 2px 5px rgba(0,0,0,0.6),
    0 0 15px rgba(255, 255, 255, 0.6) !important;
}

.chamber-spent {
  opacity: 0.5;
  background: linear-gradient(145deg, #151210, #0a0806);
}

/* Falling bullet */
.falling-bullet {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}

.bullet-real-falling {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626, #991b1b);
  box-shadow: 
    0 0 15px rgba(220, 38, 38, 0.9),
    0 0 30px rgba(220, 38, 38, 0.5);
}
</style>
