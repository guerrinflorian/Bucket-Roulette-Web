import { peekNext, popNext } from './barrel.js';
import { MAX_HP } from './rules.js';

export const ITEM_DEFS = [
  {
    id: 'heart',
    name: '+1 Coeur',
    icon: '/src/assets/items/heart.svg',
    description: 'Soigne 1 PV (max 5).',
    canUse: (state, actorKey) => state.players[actorKey].hp < MAX_HP,
    apply: (state, actorKey) => {
      const actor = state.players[actorKey];
      actor.hp = Math.min(actor.hp + 1, MAX_HP);
      return { message: `${actor.name} regagne 1 PV.` };
    }
  },
  {
    id: 'double',
    name: 'Double dégâts',
    icon: '/src/assets/items/double.svg',
    description: 'Le prochain tir (même à blanc) consomme l’effet. Si réel : 2 PV.',
    canUse: (state, actorKey) => !state.players[actorKey].doubleDamageNextShot,
    apply: (state, actorKey) => {
      state.players[actorKey].doubleDamageNextShot = true;
      return { message: `${state.players[actorKey].name} active double dégâts.` };
    }
  },
  {
    id: 'peek',
    name: 'Voir la prochaine balle',
    icon: '/src/assets/items/peek.svg',
    description: 'Révèle la prochaine cartouche pour vous.',
    canUse: (state) => peekNext(state.barrel) !== null,
    apply: (state, actorKey) => {
      const next = peekNext(state.barrel);
      state.players[actorKey].peekedNext = next;
      return { message: `${state.players[actorKey].name} observe la prochaine balle.` };
    }
  },
  {
    id: 'eject',
    name: 'Éjecter la prochaine balle',
    icon: '/src/assets/items/eject.svg',
    description: 'Retire la prochaine cartouche sans la tirer.',
    canUse: (state) => peekNext(state.barrel) !== null,
    apply: (state, actorKey) => {
      const removed = popNext(state.barrel);
      state.players[actorKey].peekedNext = null;
      return { message: `${state.players[actorKey].name} éjecte une cartouche (${removed}).` };
    }
  },
  {
    id: 'invert',
    name: 'Inverser la cible',
    icon: '/src/assets/items/eject.svg',
    description: 'Le prochain tir inverse votre cible.',
    canUse: (state, actorKey) => !state.players[actorKey].invertTargetNext,
    apply: (state, actorKey) => {
      state.players[actorKey].invertTargetNext = true;
      return { message: `${state.players[actorKey].name} prépare une inversion.` };
    }
  }
];

export function getItemById(id) {
  return ITEM_DEFS.find((item) => item.id === id);
}

export function rollRandomItems(count) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(Math.random() * ITEM_DEFS.length);
    items.push(ITEM_DEFS[index].id);
  }
  return items;
}

export function applyItem(state, actorKey, itemId) {
  const item = getItemById(itemId);
  if (!item || !item.canUse(state, actorKey)) {
    return { message: 'Objet inutilisable.', success: false };
  }
  return { ...item.apply(state, actorKey), success: true };
}
