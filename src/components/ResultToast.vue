<template>
  <transition name="fade">
    <div v-if="text" class="toast">{{ text }}</div>
  </transition>
</template>

<script setup>
defineProps({
  text: String
});
</script>

<style scoped>
.toast {
  text-align: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
