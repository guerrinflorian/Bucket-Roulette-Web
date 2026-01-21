<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="target-modal-card">
      <q-card-section class="text-center">
        <div class="target-modal-title">Choisir une cible</div>
        <div class="target-modal-subtitle">Sélectionnez le joueur visé</div>
        <div class="target-modal-buttons">
          <q-btn
            v-for="target in targets"
            :key="target.key"
            color="deep-orange"
            unelevated
            @click="emit('confirm', target.key)"
          >
            {{ target.label }}
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  targets: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);
</script>

<style scoped>
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
</style>
