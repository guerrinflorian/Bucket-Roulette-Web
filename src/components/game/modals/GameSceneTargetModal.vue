<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    position="standard"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="target-selection-card">
      <!-- Header Section -->
      <q-card-section class="target-header">
        <div class="target-icon">🎯</div>
        <h2 class="target-title">Choisir une cible</h2>
        <p class="target-subtitle">Sélectionnez le joueur que vous souhaitez viser</p>
      </q-card-section>

      <q-separator class="target-separator" />

      <!-- Targets Grid -->
      <q-card-section class="target-body">
        <div class="targets-grid">
          <button
            v-for="target in targets"
            :key="target.key"
            class="target-button"
            @click="handleTargetSelect(target.key)"
          >
            <div class="target-button-icon">🔫</div>
            <div class="target-button-label">{{ target.label }}</div>
            <div class="target-button-hint">Cliquez pour viser</div>
          </button>
        </div>
      </q-card-section>

      <!-- Footer (optional) -->
      <q-card-section class="target-footer">
        <p class="target-warning">⚠️ Cette action est irréversible</p>
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

function handleTargetSelect(targetKey) {
  emit('confirm', targetKey);
}
</script>

<style scoped>
/* ===============================================
   CARD CONTAINER
   =============================================== */
.target-selection-card {
  background: linear-gradient(
    145deg,
    rgba(20, 20, 30, 0.98) 0%,
    rgba(10, 10, 15, 0.98) 100%
  );
  border: 2px solid rgba(239, 68, 68, 0.4);
  border-radius: 24px;
  min-width: min(420px, 92vw);
  max-width: 500px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(239, 68, 68, 0.15);
  overflow: hidden;
}

/* ===============================================
   HEADER SECTION
   =============================================== */
.target-header {
  text-align: center;
  padding: 32px 24px 24px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.08) 0%,
    transparent 100%
  );
}

.target-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 16px rgba(239, 68, 68, 0.6));
  }
}

.target-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 900;
  color: #fef2f2;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 12px rgba(239, 68, 68, 0.4);
}

.target-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(254, 242, 242, 0.6);
  letter-spacing: 0.05em;
}

/* ===============================================
   SEPARATOR
   =============================================== */
.target-separator {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(239, 68, 68, 0.4) 50%,
    transparent 100%
  );
  height: 1px;
  border: none;
}

/* ===============================================
   BODY SECTION - TARGETS GRID
   =============================================== */
.target-body {
  padding: 24px;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

/* ===============================================
   TARGET BUTTONS
   =============================================== */
.target-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.15) 0%,
    rgba(220, 38, 38, 0.05) 100%
  );
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  color: #fef2f2;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.target-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.2) 0%,
    rgba(220, 38, 38, 0.1) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.target-button:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(239, 68, 68, 0.6);
  box-shadow: 
    0 8px 24px rgba(239, 68, 68, 0.3),
    0 0 20px rgba(239, 68, 68, 0.2);
}

.target-button:hover::before {
  opacity: 1;
}

.target-button:active {
  transform: translateY(-2px) scale(0.98);
}

.target-button-icon {
  font-size: 32px;
  margin-bottom: 8px;
  transform: rotate(-15deg);
  transition: transform 0.3s ease;
}

.target-button:hover .target-button-icon {
  transform: rotate(0deg) scale(1.1);
}

.target-button-label {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.target-button-hint {
  font-size: 11px;
  color: rgba(254, 242, 242, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.target-button:hover .target-button-hint {
  opacity: 1;
}

/* ===============================================
   FOOTER SECTION
   =============================================== */
.target-footer {
  padding: 16px 24px 24px;
  text-align: center;
}

.target-warning {
  margin: 0;
  font-size: 12px;
  color: rgba(251, 191, 36, 0.8);
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* ===============================================
   RESPONSIVE DESIGN
   =============================================== */
@media (max-width: 480px) {
  .target-selection-card {
    min-width: 95vw;
  }

  .targets-grid {
    grid-template-columns: 1fr;
  }

  .target-title {
    font-size: 20px;
  }

  .target-icon {
    font-size: 40px;
  }
}

/* ===============================================
   DIALOG OVERRIDES
   =============================================== */
:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(8px);
}
</style>
