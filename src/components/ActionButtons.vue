<template>
  <div class="actions">
    <button class="button-primary" :disabled="disabled" @click="$emit('shoot-enemy')">
      Tirer sur l'ennemi
    </button>
    <button class="button-primary" :disabled="disabled" @click="$emit('shoot-self')">
      Tirer sur soi
    </button>
  </div>
</template>

<script setup>
defineProps({
  disabled: Boolean
});
</script>

<style scoped>
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
