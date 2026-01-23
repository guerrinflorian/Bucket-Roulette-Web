<template>
  <header class="menu-header text-center">
    <div class="logo-container mb-4">
      <div class="revolver-icon">
        <svg viewBox="0 0 100 100" class="revolver-svg">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="3"/>
          <circle cx="50" cy="50" r="12" fill="currentColor"/>
          <circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="76" cy="35" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="76" cy="65" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="50" cy="80" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="24" cy="65" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="24" cy="35" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
    </div>
    <h1 class="game-title">
      <span class="title-main">REVOLVER GAMBIT</span>
      <span class="title-sub">ONLINE</span>
    </h1>
    <p class="tagline">Tentez votre chance... si vous l'osez</p>
    <button
      v-if="!isAuthenticated"
      class="auth-cta"
      type="button"
      @click="emit('auth')"
    >
      🔐 Se connecter
    </button>
  </header>
</template>

<script setup>
defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['auth']);
</script>

<style scoped>
.menu-header {
  text-align: center;
}

.revolver-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  animation: spin-slow 20s linear infinite;
}

.revolver-svg {
  width: 100%;
  height: 100%;
  color: #f59e0b;
  filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.4));
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.game-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

.title-main {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: #fef3c7;
  text-shadow:
    0 0 40px rgba(245, 158, 11, 0.5),
    0 2px 0 rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.title-sub {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.4em;
  color: #dc2626;
  text-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
}

.tagline {
  margin-top: 12px;
  font-size: 13px;
  color: #71717a;
  font-style: italic;
}

.auth-cta {
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(15, 10, 5, 0.6);
  color: #fef3c7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-cta:hover {
  transform: translateY(-1px);
  border-color: #f59e0b;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
}

@media (max-width: 480px) {
  .revolver-icon {
    width: 60px;
    height: 60px;
  }

  .title-main {
    font-size: 32px;
  }

  .title-sub {
    font-size: 16px;
    letter-spacing: 0.3em;
  }

  .auth-cta {
    padding: 8px 14px;
    font-size: 11px;
  }
}

@media (max-width: 360px) {
  .title-main {
    font-size: 26px;
  }

  .title-sub {
    font-size: 14px;
    letter-spacing: 0.25em;
  }
}

@media (min-width: 768px) {
  .title-main {
    font-size: 52px;
  }

  .title-sub {
    font-size: 24px;
  }

  .revolver-icon {
    width: 100px;
    height: 100px;
  }

  .tagline {
    font-size: 15px;
  }
}

@media (min-width: 1024px) {
  .title-main {
    font-size: 60px;
  }

  .title-sub {
    font-size: 28px;
  }

  .revolver-icon {
    width: 120px;
    height: 120px;
  }
}
</style>
