<template>
  <div v-if="isAuthenticated" class="user-bar">
    <q-btn-dropdown
      class="user-dropdown"
      unelevated
      no-caps
      dropdown-icon="expand_more"
      content-class="user-dropdown-menu bg-black"
      menu-anchor="bottom right"
      menu-self="top right"
    >
      <template v-slot:label>
        <q-avatar size="30px" class="user-avatar">
          <Avatar
            :name="avatarSeed"
            variant="beam"
            :size="30"
            :colors="avatarColors"
          />
        </q-avatar>
        <div class="user-meta">
          <span class="user-name">{{ displayName }}</span>
          <span class="user-subtitle">Mon compte</span>
        </div>
      </template>

      <div class="dropdown-panel">
        <div class="dropdown-header">
          <q-avatar size="58px" class="dropdown-avatar">
            <Avatar
              :name="avatarSeed"
              variant="beam"
              :size="58"
              :colors="avatarColors"
            />
          </q-avatar>
          <div class="dropdown-text">
            <div class="dropdown-name">{{ displayName }}</div>
            <div class="dropdown-email">
              {{ email || 'Compte connecté' }}
            </div>
          </div>
        </div>

        <q-separator dark class="q-my-sm" />

        <q-list class="dropdown-actions">
          <q-item clickable v-close-popup @click="emit('profile')">
            <q-item-section avatar>
              <q-icon name="insights" color="amber" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Voir mes statistiques</q-item-label>
              <q-item-label caption>Performances et progression</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="emit('logout')">
            <q-item-section avatar>
              <q-icon name="logout" color="red-4" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Se déconnecter</q-item-label>
              <q-item-label caption>Quitter la session</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-btn-dropdown>
  </div>
</template>

<script setup>
import Avatar from 'vue-boring-avatars';

defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    required: true
  },
  avatarSeed: {
    type: String,
    required: true
  },
  avatarColors: {
    type: Array,
    required: true
  },
  email: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['profile', 'logout']);
</script>

<style scoped>
.user-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #fef3c7;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-subtitle {
  font-size: 11px;
  color: rgba(226, 232, 240, 0.7);
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-avatar {
  border: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.35);
}

.user-dropdown :deep(.q-btn) {
  padding: 6px 10px 6px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(30, 20, 10, 0.92) 0%, rgba(15, 10, 5, 0.98) 100%);
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  color: #fef3c7;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-dropdown :deep(.q-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
}

.user-dropdown :deep(.q-btn__content) {
  gap: 10px;
  align-items: center;
}

.user-dropdown :deep(.q-btn__dropdown-icon) {
  font-size: 20px;
  color: rgba(251, 191, 36, 0.85);
}

:deep(.user-dropdown-menu) {
  min-width: 280px;
  background: rgba(13, 16, 24, 0.98);
  border: 1px solid rgba(251, 191, 36, 0.18);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
}

.dropdown-panel {
  padding: 14px 16px 10px;
  color: #e2e8f0;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-avatar {
  border: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.3);
}

.dropdown-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-name {
  font-size: 16px;
  font-weight: 800;
  color: #fff7ed;
}

.dropdown-email {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.7);
}

.dropdown-actions :deep(.q-item) {
  border-radius: 12px;
  margin: 4px 0;
  color: inherit;
  transition: background 0.2s ease, transform 0.2s ease;
}

.dropdown-actions :deep(.q-item:hover) {
  background: rgba(251, 191, 36, 0.12);
  transform: translateX(2px);
}

.dropdown-actions :deep(.q-item__label--caption) {
  color: rgba(226, 232, 240, 0.6);
}

@media (max-width: 480px) {
  .user-bar {
    top: 10px;
    right: 10px;
  }

  .user-name {
    font-size: 12px;
    max-width: 80px;
  }

  .user-subtitle {
    font-size: 10px;
  }

  .user-meta {
    display: none;
  }

  .user-dropdown :deep(.q-btn__content) {
    gap: 0;
  }
}
</style>
