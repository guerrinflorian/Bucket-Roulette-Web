<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="profile-modal-card">
      <q-card-section class="profile-modal-header">
        <div class="profile-modal-title">
          Statistiques
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="profile-tabs-section">
        <q-tabs
          v-model="activeTab"
          class="profile-tabs"
          active-color="amber"
          indicator-color="amber"
          align="left"
          narrow-indicator
        >
          <q-tab name="global" label="Global" icon="leaderboard" />
          <q-tab name="solo" label="Solo" icon="smart_toy" />
          <q-tab name="1v1" label="1v1" icon="sports_kabaddi" />
          <q-tab name="1v1v1" label="1v1v1" icon="groups" />
        </q-tabs>
      </q-card-section>

      <q-separator />

      <q-card-section class="profile-modal-body">
        <div v-if="loading" class="profile-loading">
          <q-spinner size="32px" color="amber" />
          <span>Chargement des statistiques...</span>
        </div>

        <div v-else-if="error" class="profile-error">
          <q-icon name="warning" color="negative" size="20px" />
          <span>{{ error }}</span>
        </div>

        <div v-else class="profile-content">
          <q-tab-panels v-model="activeTab" animated class="profile-panels">
            <q-tab-panel name="global">
              <ProfileStatsGlobalPanel
                :profile="profile"
                :stats="statsPayload"
              />
            </q-tab-panel>
            <q-tab-panel name="solo">
              <ProfileStatsModePanel
                title="Solo"
                subtitle="Parties contre les bots"
                badge-label="Solo"
                badge-color="grey-8"
                :mode-stats="soloStats"
                highlight="solo"
              >
                <ProfileSoloProgress
                  v-if="profile?.isSelf"
                  :solo-progress="soloProgress"
                  :bot-levels="botLevels"
                />
              </ProfileStatsModePanel>
            </q-tab-panel>
            <q-tab-panel name="1v1">
              <ProfileStatsModePanel
                title="Multijoueur 1v1"
                subtitle="Duels classiques"
                badge-label="Duel"
                badge-color="positive"
                :mode-stats="duelStats"
                highlight="duel"
              />
            </q-tab-panel>
            <q-tab-panel name="1v1v1">
              <ProfileStatsModePanel
                title="Multijoueur 1v1v1"
                subtitle="Trio stratégique"
                badge-label="1v1v1"
                badge-color="deep-purple-4"
                :mode-stats="trioStats"
                highlight="trio"
                show-top2
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import ProfileStatsGlobalPanel from './profile/ProfileStatsGlobalPanel.vue';
import ProfileStatsModePanel from './profile/ProfileStatsModePanel.vue';
import ProfileSoloProgress from './profile/ProfileSoloProgress.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  soloProgress: { type: Array, default: () => [] },
  botLevels: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);

const activeTab = ref('global');

const statsPayload = computed(() => props.stats || {});
const modeStats = computed(() => statsPayload.value?.modes ?? {});
const soloStats = computed(() => modeStats.value?.solo ?? {});
const duelStats = computed(() => modeStats.value?.['1v1'] ?? {});
const trioStats = computed(() => modeStats.value?.['1v1v1'] ?? {});
</script>

<style scoped>
.profile-modal-card {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background: linear-gradient(160deg, rgba(15, 15, 20, 0.98), rgba(8, 10, 16, 0.98));
  border: none;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}

.profile-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
}

.profile-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
}

.profile-tabs-section {
  padding: 10px 24px 6px;
}

.profile-tabs {
  background: rgba(15, 23, 42, 0.45);
  border-radius: 14px;
  padding: 4px 6px;
}

.profile-loading,
.profile-error {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5f5;
  font-size: 14px;
  padding: 16px 0;
}

.profile-error {
  color: #fca5a5;
}

.profile-modal-body {
  flex: 1;
  overflow: auto;
  padding: 18px 24px 24px;
  display: flex;
  flex-direction: column;
}

.profile-content {
  flex: 1;
  min-height: 0;
}

.profile-panels {
  background: transparent;
}
</style>
