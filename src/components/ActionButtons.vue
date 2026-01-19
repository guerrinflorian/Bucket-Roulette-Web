<template>
  <div class="actions">
    <button
      class="action-btn action-enemy"
      :disabled="disabled"
      @click="$emit('shoot-enemy')"
    >
      Tirer sur l'ennemi
    </button>
    <button
      class="action-btn action-self"
      :disabled="disabled"
      @click="$emit('shoot-self')"
    >
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
  width: min(720px, 92vw);
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 220px;
  padding: 14px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9), rgba(0, 0, 0, 0.7));
  color: #f4e9d9;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
}

.action-enemy {
  border-color: rgba(242, 106, 75, 0.6);
}

.action-enemy:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(242, 106, 75, 0.35);
}

.action-self {
  border-color: rgba(94, 224, 140, 0.6);
}

.action-self:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(94, 224, 140, 0.35);
}
</style>
