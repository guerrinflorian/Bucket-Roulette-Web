import { createRouter, createWebHistory } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import { useAuthStore } from '../stores/authStore.js';
import MenuScreen from '../components/MenuScreen.vue';
import GameScreen from '../components/GameScreen.vue';
import AuthScreen from '../components/AuthScreen.vue';

const routes = [
  { path: '/', redirect: '/menu' },
  { path: '/menu', component: MenuScreen },
  { path: '/auth', component: AuthScreen },
  { path: '/game', component: GameScreen, meta: { requiresGame: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to enforce auth + active game
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.path !== '/auth') {
    if (!authStore.isAuthenticated) {
      return next('/auth');
    }
    if (!authStore.user) {
      await authStore.fetchMe();
      if (!authStore.user) {
        return next('/auth');
      }
    }
  } else if (authStore.isAuthenticated && authStore.user) {
    return next('/menu');
  }

  if (to.meta.requiresGame) {
    const gameStore = useGameStore();
    
    // Allow only if a session was started from the menu (prevents refresh going to /game)
    if (gameStore.sessionActive) {
      next();
    } else {
      // Redirect to menu if no active game
      console.log('⚠️ No active game, redirecting to menu');
      next('/menu');
    }
  } else {
    next();
  }
});

export default router;
