<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="leaderboard-modal-card">
      <q-card-section class="leaderboard-modal-header">
        <div class="leaderboard-modal-title">
          Classements
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="leaderboard-tabs-section">
        <q-tabs
          v-model="activeTab"
          class="leaderboard-tabs"
          active-color="amber"
          indicator-color="amber"
          align="left"
          narrow-indicator
        >
          <q-tab name="1v1" label="1v1" icon="sports_kabaddi" />
          <q-tab name="1v1v1" label="1v1v1" icon="groups" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="leaderboard-modal-body">
        <div v-if="loading" class="leaderboard-loading">
          <q-spinner size="32px" color="amber" />
          <span>Chargement du classement...</span>
        </div>

        <div v-else-if="error" class="leaderboard-error">
          <q-icon name="warning" color="negative" size="20px" />
          <span>{{ error }}</span>
        </div>

        <div v-else class="leaderboard-content">
          <q-tab-panels v-model="activeTab" animated class="leaderboard-panels">
            <q-tab-panel name="1v1">
              <div class="leaderboard-panel">
                <div class="leaderboard-panel-header">
                  <div>
                    <div class="panel-title">Multijoueur 1v1</div>
                    <div class="panel-subtitle">Score = (Victoires × 20) - (Défaites × 10)</div>
                  </div>
                  <q-badge color="positive" class="panel-badge">Duel</q-badge>
                </div>
                <LeaderboardTable
                  :entries="duelEntries"
                  :self-entry="duelSelfEntry"
                  mode="1v1"
                  :highlight-id="highlightId"
                />
              </div>
            </q-tab-panel>
            <q-tab-panel name="1v1v1">
              <div class="leaderboard-panel">
                <div class="leaderboard-panel-header trio">
                  <div>
                    <div class="panel-title">Multijoueur 1v1v1</div>
                    <div class="panel-subtitle">
                      Score = (Top 1 × 100 + Top 2 × 40) / (Matchs + 10)
                    </div>
                  </div>
                  <q-badge color="deep-purple-4" class="panel-badge">1v1v1</q-badge>
                </div>
                <LeaderboardTable
                  :entries="trioEntries"
                  :self-entry="trioSelfEntry"
                  mode="1v1v1"
                  :highlight-id="highlightId"
                />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import LeaderboardTable from './leaderboard/LeaderboardTable.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  leaderboards: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  highlightId: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const activeTab = ref('1v1');

const duelEntries = computed(() => props.leaderboards?.['1v1']?.entries ?? []);
const duelSelfEntry = computed(() => props.leaderboards?.['1v1']?.selfEntry ?? null);
const trioEntries = computed(() => props.leaderboards?.['1v1v1']?.entries ?? []);
const trioSelfEntry = computed(() => props.leaderboards?.['1v1v1']?.selfEntry ?? null);
</script>

<style scoped>
.leaderboard-modal-card {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background: linear-gradient(160deg, rgba(15, 15, 20, 0.98), rgba(8, 10, 16, 0.98));
  border: none;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}

.leaderboard-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
}

.leaderboard-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.leaderboard-tabs-section {
  padding: 10px 24px 6px;
}

.leaderboard-tabs {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 14px;
  padding: 4px 6px;
}

.leaderboard-modal-body {
  flex: 1;
  overflow: auto;
  padding: 18px 24px 24px;
  display: flex;
  flex-direction: column;
}

.leaderboard-loading,
.leaderboard-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5f5;
  font-size: 14px;
  padding: 16px 0;
}

.leaderboard-error {
  color: #fca5a5;
}

.leaderboard-content {
  flex: 1;
  min-height: 0;
}

.leaderboard-panels {
  background: transparent;
}

.leaderboard-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leaderboard-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.leaderboard-panel-header.trio {
  border-color: rgba(168, 85, 247, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
}

.panel-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.panel-badge {
  font-weight: 800;
  letter-spacing: 0.8px;
  padding: 4px 10px;
}

@media (max-width: 700px) {
  .leaderboard-modal-header,
  .leaderboard-tabs-section,
  .leaderboard-modal-body {
    padding-left: 16px;
    padding-right: 16px;
  }

  .leaderboard-panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
