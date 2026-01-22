<template>
  <div class="global-panel">
    <div class="profile-identity">
      <q-avatar size="80px" color="dark" text-color="white">
        <q-icon name="person" />
      </q-avatar>
      <div class="profile-identity-text">
        <div class="profile-name">{{ displayName }}</div>
        <div class="profile-meta">
          <q-badge v-if="profile?.isSelf" color="amber" text-color="black">
            Vous
          </q-badge>
          <span class="profile-subtitle">Pseudo : {{ pseudo }}</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="section-header">
        <div>
          <div class="section-title">Statistiques globales</div>
          <div class="section-subtitle">Tous modes confondus</div>
        </div>
        <q-badge color="blue-grey-8" text-color="white">Global</q-badge>
      </div>

      <div class="profile-stats-grid">
        <q-card class="profile-stat-card stat-card-primary">
          <q-card-section>
            <div class="stat-title">Parties jouées</div>
            <div class="stat-value">{{ totalGames }}</div>
            <div class="stat-sub">Matchs terminés</div>
            <q-linear-progress :value="gamesProgress" color="positive" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Tirs infligés</div>
            <div class="stat-value">{{ totalShots }}</div>
            <div class="stat-sub">Balles tirées</div>
            <q-linear-progress :value="shotsProgress" color="amber" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Tirs subis</div>
            <div class="stat-value">{{ totalShotsTaken }}</div>
            <div class="stat-sub">Balles encaissées</div>
            <q-linear-progress :value="shotsTakenProgress" color="deep-orange" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card">
          <q-card-section>
            <div class="stat-title">Objets utilisés</div>
            <div class="stat-value">{{ totalItems }}</div>
            <div class="stat-sub">Tous modes</div>
            <q-linear-progress :value="itemsProgress" color="light-green-4" track-color="dark" rounded />
          </q-card-section>
        </q-card>

        <q-card class="profile-stat-card stat-card-alt">
          <q-card-section>
            <div class="stat-title">Série record</div>
            <div class="stat-value">{{ highestWinStreak }}</div>
            <div class="stat-sub">Meilleure série de victoires</div>
            <q-linear-progress :value="winStreakProgress" color="cyan-6" track-color="dark" rounded />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  profile: { type: Object, default: null },
  stats: { type: Object, default: null }
});

const statsPayload = computed(() => props.stats || {});
const displayName = computed(() => props.profile?.name || 'Profil');
const pseudo = computed(() =>
  props.profile?.username || props.profile?.pseudo || props.profile?.name || 'Inconnu'
);

const totalShots = computed(() => statsPayload.value?.total_shots_fired ?? 0);
const totalShotsTaken = computed(() => statsPayload.value?.total_shots_taken ?? 0);
const totalItems = computed(() => statsPayload.value?.total_items_used ?? 0);
const totalGames = computed(() => statsPayload.value?.total_games_played ?? 0);
const highestWinStreak = computed(() => statsPayload.value?.highest_win_streak ?? 0);

const gamesProgress = computed(() => Math.min(1, Math.max(0, totalGames.value / 100)));
const shotsProgress = computed(() => Math.min(1, Math.max(0, totalShots.value / 500)));
const shotsTakenProgress = computed(() => Math.min(1, Math.max(0, totalShotsTaken.value / 500)));
const itemsProgress = computed(() => Math.min(1, Math.max(0, totalItems.value / 200)));
const winStreakProgress = computed(() => Math.min(1, Math.max(0, highestWinStreak.value / 20)));
</script>

<style scoped>
.global-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(8, 12, 20, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.profile-identity-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.profile-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.stats-section {
  padding: 18px;
  border-radius: 18px;
  background: rgba(8, 12, 20, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.section-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}

.profile-stat-card {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
}

.stat-card-primary {
  background: linear-gradient(150deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.55));
  border-color: rgba(16, 185, 129, 0.3);
}

.stat-card-alt {
  background: linear-gradient(150deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.55));
  border-color: rgba(56, 189, 248, 0.35);
}

.stat-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #94a3b8;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-top: 6px;
  color: #f8fafc;
}

.stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 6px 0 10px;
}
</style>
