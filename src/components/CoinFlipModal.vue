<template>
  <q-dialog v-model="show" persistent>
    <q-card class="coin-card">
      <q-card-section class="text-center">
        <h2 class="text-xl font-bold uppercase tracking-widest text-amber-200 mb-8">
          Qui commence ?
        </h2>
        
        <!-- Coin Animation Container -->
        <div class="coin-stage">
          <div ref="coinEl" class="coin-flipper">
            <!-- PILE (Joueur) -->
            <div class="coin-side coin-heads">
              <div class="coin-inner">
                <div class="coin-symbol">👑</div>
                <div class="coin-label">VOUS</div>
              </div>
            </div>
            <!-- FACE (Ennemi) -->
            <div class="coin-side coin-tails">
              <div class="coin-inner">
                <div class="coin-symbol">💀</div>
                <div class="coin-label">ENNEMI</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Result Text -->
        <div ref="resultEl" class="result-container">
          <p class="result-text">{{ resultText }}</p>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  forcedResult: {
    type: String,
    default: null // 'player' | 'enemy'
  }
});

const emit = defineEmits(['resolved']);

const show = ref(true);
const coinEl = ref(null);
const resultEl = ref(null);
const resultText = ref('Lancement de la pièce...');

onMounted(async () => {
  await nextTick();
  
  if (!coinEl.value || !resultEl.value) return;
  
  const result = props.forcedResult || (Math.random() > 0.5 ? 'player' : 'enemy');
  // Player = heads (0°, 360°, 720°...), Enemy = tails (180°, 540°, 900°...)
  const finalRotation = result === 'player' ? 1440 : 1620; // 4 tours + position finale
  
  // Initial state
  gsap.set(resultEl.value, { opacity: 0, y: 20 });
  
  const tl = gsap.timeline();
  
  // 1. Anticipation - coin goes up
  tl.to(coinEl.value, {
    y: -30,
    duration: 0.4,
    ease: 'power2.out'
  });
  
  // 2. Fast spin at start, slows down
  tl.to(coinEl.value, {
    rotateX: finalRotation,
    y: 0,
    duration: 3,
    ease: 'power3.out'
  });
  
  // 3. Small bounce
  tl.to(coinEl.value, {
    y: -15,
    duration: 0.2,
    ease: 'power2.out'
  });
  
  tl.to(coinEl.value, {
    y: 0,
    duration: 0.3,
    ease: 'bounce.out'
  });
  
  // 4. Update result text
  tl.add(() => {
    resultText.value = result === 'player' 
      ? '👑 Vous commencez !' 
      : '💀 L\'ennemi commence !';
  });
  
  // 5. Show result with animation
  tl.to(resultEl.value, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'back.out(1.5)'
  });
  
  // 6. Wait then close
  tl.add(() => {
    setTimeout(() => {
      show.value = false;
      emit('resolved', result);
    }, 1500);
  }, '+=1');
});
</script>

<style scoped>
.coin-card {
  background: linear-gradient(145deg, #1a1510, #0d0a07);
  border: 2px solid rgba(139, 105, 20, 0.5);
  border-radius: 24px;
  padding: 32px 48px;
  min-width: 340px;
}

.coin-stage {
  perspective: 1000px;
  width: 140px;
  height: 140px;
  margin: 0 auto 24px;
}

.coin-flipper {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
}

.coin-side {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin-heads {
  background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b, #8b6914);
  border: 4px solid #a07c20;
  box-shadow: 
    0 4px 15px rgba(0,0,0,0.4),
    inset 0 -4px 10px rgba(0,0,0,0.3),
    inset 0 4px 10px rgba(255,255,255,0.2);
  transform: rotateX(0deg);
}

.coin-tails {
  background: radial-gradient(circle at 30% 30%, #c0c0c0, #808080, #505050);
  border: 4px solid #707070;
  box-shadow: 
    0 4px 15px rgba(0,0,0,0.4),
    inset 0 -4px 10px rgba(0,0,0,0.3),
    inset 0 4px 10px rgba(255,255,255,0.2);
  transform: rotateX(180deg);
}

.coin-inner {
  text-align: center;
}

.coin-symbol {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 4px;
}

.coin-label {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: rgba(0,0,0,0.7);
}

.coin-tails .coin-label {
  color: rgba(255,255,255,0.8);
}

.result-container {
  min-height: 40px;
}

.result-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  margin: 0;
}
</style>
