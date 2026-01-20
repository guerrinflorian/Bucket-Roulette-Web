import { createRouter, createWebHistory } from 'vue-router';
import { useGameStore } from '../stores/gameStore.js';
import MenuScreen from '../components/MenuScreen.vue';
import GameScreen from '../components/GameScreen.vue';

const routes = [
  { path: '/', redirect: '/menu' },
  { path: '/menu', component: MenuScreen },
  { path: '/game', component: GameScreen, meta: { requiresGame: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to prevent accessing /game without active game
router.beforeEach((to, from, next) => {
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
