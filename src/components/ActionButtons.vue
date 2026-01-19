<template>
  <div class="actions">
    <q-btn
      unelevated
      color="primary"
      class="text-sm font-bold"
      :disable="disabled"
      icon="gps_fixed"
      label="Tirer sur l'ennemi"
      @click="$emit('shoot-enemy')"
    />
    <q-btn
      unelevated
      color="primary"
      class="text-sm font-bold"
      :disable="disabled"
      icon="person"
      label="Tirer sur soi"
      @click="$emit('shoot-self')"
    />
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
</style>
