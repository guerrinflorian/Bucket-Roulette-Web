<template>
  <div class="coin">
    <div class="coin__card">
      <h2>Pièce de départ</h2>
      <div class="coin__flip">
        <img ref="coinRef" :src="coinImage" alt="Coin" />
      </div>
      <p>{{ resultText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { gsap } from 'gsap';

const emit = defineEmits(['resolved']);
const coinRef = ref(null);
const resultText = ref('Lancement...');
const coinImage = ref('/src/assets/ui/coin_heads.svg');

onMounted(() => {
  const result = Math.random() > 0.5 ? 'player' : 'enemy';
  gsap.to(coinRef.value, {
    rotateY: 720,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      coinImage.value = result === 'player' ? '/src/assets/ui/coin_heads.svg' : '/src/assets/ui/coin_tails.svg';
      resultText.value = result === 'player' ? 'Vous commencez' : "L'ennemi commence";
      setTimeout(() => emit('resolved', result), 600);
    }
  });
});
</script>

<style scoped>
.coin {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: grid;
  place-items: center;
  z-index: 10;
}

.coin__card {
  background: rgba(25, 15, 8, 0.95);
  padding: 32px 48px;
  border-radius: 18px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.coin__flip img {
  width: 120px;
  height: 120px;
  margin: 16px auto;
  display: block;
}
</style>
