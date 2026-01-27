<template>
  <div class="leaderboard-table">
    <div v-if="topRows.length === 0 && !extraRow" class="leaderboard-empty">
      Aucun classement disponible pour le moment.
    </div>
    <div v-else class="leaderboard-table-inner" :class="tableClass">
      <div class="leaderboard-row leaderboard-header">
        <div class="cell rank">Rang</div>
        <div class="cell name">Pseudo</div>
        <div v-if="isRanked" class="cell elo">Elo</div>
        <div class="cell win">Victoires</div>
        <div v-if="isTrio" class="cell top2">Top 2</div>
        <div v-if="isTrio" class="cell top3">Top 3</div>
        <div class="cell loss">Défaites</div>
        <div class="cell ratio">Ratio</div>
      </div>

      <div
        v-for="entry in topRows"
        :key="resolveUserId(entry)"
        class="leaderboard-row"
        :class="{
          'is-self': entry.isSelf,
          'is-top': entry.rank <= 3,
          'is-clickable': hasUserId(entry)
        }"
        @click="selectEntry(entry)"
      >
        <div class="cell rank">{{ entry.rank }}</div>
        <div class="cell name">{{ entry.username || 'Joueur' }}</div>
        <div v-if="isRanked" class="cell elo">{{ entry.elo ?? 1000 }}</div>
        <div class="cell win">{{ entry.wins }}</div>
        <div v-if="isTrio" class="cell top2">{{ top2Count(entry) }}</div>
        <div v-if="isTrio" class="cell top3">{{ top3Count(entry) }}</div>
        <div class="cell loss">{{ entry.losses }}</div>
        <div class="cell ratio">{{ ratioValue(entry.wins, entry.losses) }}</div>
      </div>

      <div v-if="extraRow" class="leaderboard-self-divider">
        Votre rang
      </div>
      <div
        v-if="extraRow"
        class="leaderboard-row is-self extra-row"
        :class="{ 'is-clickable': hasUserId(extraRow) }"
        @click="selectEntry(extraRow)"
      >
        <div class="cell rank">{{ extraRow.rank }}</div>
        <div class="cell name">{{ extraRow.username || 'Joueur' }}</div>
        <div v-if="isRanked" class="cell elo">{{ extraRow.elo ?? 1000 }}</div>
        <div class="cell win">{{ extraRow.wins }}</div>
        <div v-if="isTrio" class="cell top2">{{ top2Count(extraRow) }}</div>
        <div v-if="isTrio" class="cell top3">{{ top3Count(extraRow) }}</div>
        <div class="cell loss">{{ extraRow.losses }}</div>
        <div class="cell ratio">{{ ratioValue(extraRow.wins, extraRow.losses) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entries: { type: Array, default: () => [] },
  selfEntry: { type: Object, default: null },
  mode: { type: String, required: true },
  highlightId: { type: String, default: '' }
});

const emit = defineEmits(['select']);

const isTrio = computed(() => props.mode === '1v1v1');
const isRanked = computed(() => props.mode === 'ranked');

const topRows = computed(() =>
  props.entries.map((entry) => ({
    ...entry,
    wins: entry.wins ?? 0,
    losses: entry.losses ?? 0,
    top2_finishes: entry.top2_finishes ?? 0,
    isSelf: entry.userId === props.highlightId
  }))
);

const extraRow = computed(() => {
  if (!props.selfEntry) return null;
  if (props.entries.some((entry) => entry.userId === props.selfEntry.userId)) {
    return null;
  }
  return {
    ...props.selfEntry,
    wins: props.selfEntry.wins ?? 0,
    losses: props.selfEntry.losses ?? 0,
    top2_finishes: props.selfEntry.top2_finishes ?? 0
  };
});

const ratioValue = (wins, losses) => {
  if (losses > 0) {
    return (wins / losses).toFixed(2);
  }
  return wins > 0 ? wins.toFixed(2) : '0.00';
};

const resolveUserId = (entry) => entry?.userId ?? entry?.user_id ?? '';
const hasUserId = (entry) => Boolean(resolveUserId(entry));

const selectEntry = (entry) => {
  if (!hasUserId(entry)) return;
  emit('select', {
    userId: resolveUserId(entry),
    username: entry?.username
  });
};

const top2Count = (entry) => Math.max(0, (entry.top2_finishes ?? 0) - (entry.wins ?? 0));
const top3Count = (entry) => Math.max(0, (entry.losses ?? 0) - top2Count(entry));

const tableClass = computed(() => ({
  'is-trio': isTrio.value,
  'is-ranked': isRanked.value
}));
</script>

<style scoped>
.leaderboard-table {
  width: 100%;
}

.leaderboard-empty {
  padding: 18px;
  font-size: 13px;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.45);
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.25);
}

.leaderboard-table-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 64px 1.6fr repeat(3, minmax(80px, 1fr));
  align-items: center;
  gap: 8px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 13px;
  color: #e2e8f0;
  min-width: 540px;
}

.leaderboard-table-inner.is-ranked .leaderboard-row {
  grid-template-columns: 64px 1.6fr repeat(4, minmax(80px, 1fr));
  min-width: 600px;
}

.leaderboard-table-inner.is-trio .leaderboard-row {
  grid-template-columns: 64px 1.6fr repeat(5, minmax(80px, 1fr));
  min-width: 680px;
}

.leaderboard-header {
  background: rgba(15, 23, 42, 0.7);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.6px;
  color: #f8fafc;
}

.leaderboard-row.is-top {
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
}

.leaderboard-row.is-self {
  border-color: rgba(59, 130, 246, 0.45);
  background: rgba(37, 99, 235, 0.12);
}

.leaderboard-row.extra-row {
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.25);
}

.leaderboard-row.is-clickable {
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.leaderboard-row.is-clickable:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(30, 41, 59, 0.7);
}

.leaderboard-self-divider {
  margin-top: 10px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #93c5fd;
  letter-spacing: 1px;
}

.cell {
  display: flex;
  align-items: center;
}

.cell.rank {
  font-weight: 800;
  color: #fbbf24;
}

.leaderboard-row.is-self .cell.rank {
  color: #93c5fd;
}

.cell.name {
  font-weight: 700;
  color: #f1f5f9;
}

.leaderboard-table-inner.is-ranked .cell.elo {
  font-weight: 700;
  color: #fcd34d;
}

.cell.ratio {
  font-weight: 700;
  color: #38bdf8;
}

@media (max-width: 700px) {
  .leaderboard-table-inner {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .leaderboard-row {
    font-size: 11px;
    padding: 8px 8px;
    grid-template-columns: 50px 1.2fr repeat(3, minmax(70px, 0.9fr));
    min-width: 480px;
    gap: 6px;
  }

  .leaderboard-table-inner.is-ranked .leaderboard-row {
    grid-template-columns: 50px 1.2fr repeat(4, minmax(70px, 0.9fr));
    min-width: 540px;
  }

  .leaderboard-table-inner.is-trio .leaderboard-row {
    grid-template-columns: 50px 1.2fr repeat(5, minmax(70px, 0.9fr));
    min-width: 600px;
  }

  .leaderboard-header {
    font-size: 9px;
    letter-spacing: 0.4px;
  }

  .cell.rank {
    font-size: 12px;
  }

  .cell.name {
    font-size: 12px;
  }
}
</style>
