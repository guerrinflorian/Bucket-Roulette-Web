<template>
  <q-card class="progression-solo-card shadow-5">
    <div class="accent-line"></div>

    <q-card-section>
      <div class="row items-center justify-between q-mb-lg">
        <div class="row items-center">
          <q-avatar color="deep-orange-1" text-color="deep-orange" icon="precision_manufacturing" size="40px" class="q-mr-md" />
          <div class="column">
            <div class="metric-title text-orange-8">Progression Solo</div>
            <div class="metric-subtitle">Défis contre l'IA</div>
          </div>
        </div>
        <q-badge color="orange-10" label="SÉRIE" outline class="q-pa-xs px-sm" />
      </div>

      <div class="levels-grid">
        <div
          v-for="level in botLevels"
          :key="level.id"
          class="level-item"
          :class="['status-' + soloProgressStatus(level).class]"
        >
          <div class="row items-center no-wrap full-width">
            <div class="status-indicator q-mr-md">
              <q-icon 
                :name="soloProgressStatus(level).icon" 
                :color="soloProgressStatus(level).iconColor" 
                size="20px" 
              />
            </div>

            <div class="column">
              <span class="level-name">{{ level.name }}</span>
              <span class="level-status" :class="'text-' + soloProgressStatus(level).iconColor">
                {{ soloProgressStatus(level).label }}
              </span>
            </div>
            
            <q-space />
            
            <q-icon name="chevron_right" color="orange-3" size="16px" />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  soloProgress: { type: Array, default: () => [] },
  botLevels: { type: Array, default: () => [] }
});

const soloProgressMap = computed(
  () => new Map(props.soloProgress.map((entry) => [entry.difficulty, entry]))
);

const hasSoloVictory = (entry) => {
  if (!entry) return false;
  if (typeof entry.times_defeated === 'number') {
    return entry.times_defeated > 0;
  }
  return entry.is_defeated === false;
};

const hasSoloLoss = (entry) => {
  if (!entry) return false;
  if (typeof entry.times_lost === 'number') {
    return entry.times_lost > 0;
  }
  return entry.is_defeated === true;
};

const soloProgressStatus = (level) => {
  const entry = soloProgressMap.value.get(level.key);
  
  if (!entry) {
    return { 
      label: 'Verrouillé', 
      class: 'locked', 
      icon: 'lock',
      iconColor: 'orange-3' // Orange pâle pour le verrouillé
    };
  }
  if (hasSoloVictory(entry)) {
    return { 
      label: 'Battu', 
      class: 'completed', 
      icon: 'check_circle',
      iconColor: 'orange-7' // Orange vif pour le succès
    };
  }
  if (hasSoloLoss(entry)) {
    return { 
      label: 'Échec', 
      class: 'defeated', 
      icon: 'close',
      iconColor: 'red-5' 
    };
  }
  return { 
    label: 'En cours', 
    class: 'locked', 
    icon: 'hourglass_top',
    iconColor: 'orange-3'
  };
};
</script>

<style scoped>
.progression-solo-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 120, 40, 0.2); /* Bordure orange subtile */
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

/* Ligne orange vive en haut du composant */
.accent-line {
  height: 4px;
  background: linear-gradient(90deg, #f97316, #ea580c);
  width: 100%;
}

.metric-title {
  font-size: 15px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metric-subtitle {
  font-size: 11px;
  color: #94a3b8;
}

/* Grille et Items */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.level-item {
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  display: flex;
}

/* Effet au survol : on fait ressortir l'orange */
.level-item:hover {
  transform: scale(1.02);
  border-color: rgba(249, 115, 22, 0.5);
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.15);
}

.status-indicator {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
}

.level-name {
  font-size: 13px;
  font-weight: 800;
  color: #f8fafc;
}

.level-status {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* On force l'orange sur les items complétés */
.status-completed {
  border-color: rgba(249, 115, 22, 0.3);
  background: rgba(249, 115, 22, 0.05);
}

.status-completed .status-indicator {
  background: rgba(249, 115, 22, 0.15);
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.2);
}

.status-locked {
  opacity: 0.7;
}
</style>
