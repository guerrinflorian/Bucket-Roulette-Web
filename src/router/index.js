import { createRouter, createWebHistory } from 'vue-router';
import MenuScreen from '../components/MenuScreen.vue';
import GameScreen from '../components/GameScreen.vue';

const routes = [
  { path: '/', redirect: '/menu' },
  { path: '/menu', component: MenuScreen },
  { path: '/game', component: GameScreen }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
