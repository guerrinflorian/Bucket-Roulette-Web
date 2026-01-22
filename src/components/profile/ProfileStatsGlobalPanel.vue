<template>
  <div class="global-panel">
    <div class="profile-identity shadow-2">
      <q-avatar size="80px" class="profile-avatar-styled">
        <q-icon name="person" color="white" size="45px" />
        <q-badge floating color="deep-orange" rounded border />
      </q-avatar>
      
      <div class="profile-identity-text">
        <div class="row items-center q-gutter-x-sm">
          <div class="profile-name">{{ displayName }}</div>
          <q-badge v-if="profile?.isSelf" color="deep-orange" label="VOUS" outline />
        </div>
        <div class="profile-meta">
          <q-icon name="alternate_email" color="orange-5" size="14px" />
          <span class="profile-subtitle">{{ pseudo }}</span>
        </div>
      </div>
    </div>

    <div class="stats-container">
      <div class="section-header q-mb-lg">
        <div>
          <div class="section-title text-uppercase">Tableau de Bord</div>
          <div class="section-subtitle">Statistiques globales du compte</div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <q-card class="stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="stat-label">Parties</div>
              <q-icon name="sports_esports" color="deep-orange" size="24px" />
            </div>
            <div class="stat-value">{{ totalGames }}</div>
            <div class="stat-sub q-mb-sm">Matchs terminés</div>
            <q-linear-progress :value="gamesProgress" color="deep-orange" track-color="grey-9" rounded height="6px" />
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="stat-label">Tirs Infligés</div>
              <q-icon name="gps_fixed" color="orange-8" size="24px" />
            </div>
            <div class="stat-value text-orange-5">{{ totalShots }}</div>
            <div class="stat-sub q-mb-sm">Balles tirées</div>
            <q-linear-progress :value="shotsProgress" color="orange-8" track-color="grey-9" rounded height="6px" />
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="stat-label">Tirs Subis</div>
              <q-icon name="shield" color="red-5" size="24px" />
            </div>
            <div class="stat-value">{{ totalShotsTaken }}</div>
            <div class="stat-sub q-mb-sm">Balles encaissées</div>
            <q-linear-progress :value="shotsTakenProgress" color="red-5" track-color="grey-9" rounded height="6px" />
          </q-card-section>
        </q-card>

        <q-card class="stat-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="stat-label">Items</div>
              <q-icon name="inventory_2" color="amber-7" size="24px" />
            </div>
            <div class="stat-value">{{ totalItems }}</div>
            <div class="stat-sub q-mb-sm">Objets activés</div>
            <q-linear-progress :value="itemsProgress" color="amber-7" track-color="grey-9" rounded height="6px" />
          </q-card-section>
        </q-card>

        <q-card class="stat-card special-card">
          <q-card-section>
            <div class="row justify-between items-center q-mb-sm">
              <div class="stat-label text-white">Série Record</div>
              <q-icon name="military_tech" color="white" size="28px" />
            </div>
            <div class="stat-value text-white">{{ highestWinStreak }}</div>
            <div class="stat-sub text-orange-1 q-mb-sm">Meilleure série</div>
            <q-linear-progress :value="winStreakProgress" color="white" track-color="orange-9" rounded height="6px" />
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
const displayName = computed(() => props.profile?.name || 'Joueur');
const pseudo = computed(() =>
  props.profile?.username || props.profile?.pseudo || props.profile?.name || 'Inconnu'
);

const totalShots = computed(() => statsPayload.value?.total_shots_fired ?? 0);
const totalShotsTaken = computed(() => statsPayload.value?.total_shots_taken ?? 0);
const totalItems = computed(() => statsPayload.value?.total_items_used ?? 0);
const totalGames = computed(() => statsPayload.value?.total_games_played ?? 0);
const highestWinStreak = computed(() => statsPayload.value?.highest_win_streak ?? 0);

const gamesProgress = computed(() => Math.min(1, totalGames.value / 100));
const shotsProgress = computed(() => Math.min(1, totalShots.value / 1000));
const shotsTakenProgress = computed(() => Math.min(1, totalShotsTaken.value / 1000));
const itemsProgress = computed(() => Math.min(1, totalItems.value / 500));
const winStreakProgress = computed(() => Math.min(1, highestWinStreak.value / 20));
</script>

<style scoped>
.global-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e2e8f0;
}

/* Nouvel Avatar sans photo */
.profile-avatar-styled {
  background: linear-gradient(135deg, #f97316 0%, #7c2d12 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 120, 40, 0.15);
}

.profile-name {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
}

.profile-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

/* Grille de stats */
.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(249, 115, 22, 0.3);
}

.special-card {
  background: linear-gradient(135deg, #ea580c 0%, #9a3412 100%);
}

.stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
}

.stat-sub {
  font-size: 11px;
  color: #64748b;
}

.section-title {
  font-size: 13px;
  font-weight: 900;
  color: #f8fafc;
  opacity: 0.9;
}

.section-subtitle {
  font-size: 11px;
  color: #64748b;
}
</style>