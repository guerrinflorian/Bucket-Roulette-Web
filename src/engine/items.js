import { peekNext, popNext } from './barrel.js';
import { MAX_HP } from './rules.js';

export const ITEM_DEFS = [
  {
    id: 'heart',
    name: '+1 Coeur',
    description: 'Soigne 1 PV (max PV actuel).',
    canUse: (state, actorKey) => state.players[actorKey].hp < state.players[actorKey].maxHp,
    apply: (state, actorKey) => {
      const actor = state.players[actorKey];
      actor.hp = Math.min(actor.hp + 1, actor.maxHp);
      return { message: `${actor.name} regagne 1 PV.` };
    }
  },
  {
    id: 'double',
    name: 'Double dégâts',
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
    description: 'Retire la prochaine cartouche sans la tirer.',
    canUse: (state) => peekNext(state.barrel) !== null,
    apply: (state, actorKey) => {
      const removed = popNext(state.barrel);
      state.players[actorKey].peekedNext = null;
      state.barrel.invertedNext = null;
      return { message: `${state.players[actorKey].name} éjecte une cartouche (${removed}).` };
    }
  },
  {
    id: 'handcuffs',
    name: 'Les Menottes',
    description: 'Choisissez un adversaire à bloquer au prochain tour.',
    canUse: (state, actorKey, targetKey) => {
      // Allow usage if there is at least one eligible opponent.
      // If a target is provided, ensure it's a valid opponent.
      if (targetKey) {
        if (targetKey === actorKey) return false;
        return !state.players[targetKey].skipNextTurn;
      }
      // No explicit target: check if at least one opponent is eligible.
      const opponents = Object.entries(state.players).filter(([key, player]) =>
        key !== actorKey && player && player.isActive && player.hp > 0 && !player.skipNextTurn
      );
      return opponents.length >= 1;
    },
    apply: (state, actorKey, targetKey) => {
      // Determine target
      let target = targetKey;
      if (!target) {
        const opponents = Object.entries(state.players).filter(([key, player]) =>
          key !== actorKey && player && player.isActive && player.hp > 0 && !player.skipNextTurn
        );

        if (opponents.length === 0) {
          return { message: 'Aucun adversaire disponible pour les menottes.' };
        }

        if (opponents.length > 1) {
          // Multiple opponents and no target specified: trigger selection UI
          state.pendingHandcuff = { actorKey };
          return { message: 'Choisissez un adversaire.', success: false, pending: true };
        }

        target = opponents[0][0]; // Auto-select single opponent
      }

      state.players[target].skipNextTurn = true;
      return { message: `⛓️ ${state.players[target].name} sera menotté au prochain tour.` };
    }
  },
  {
    id: 'inverter',
    name: "L'Inverseur",
    description: "Inverse la balle actuelle (blanche ⇄ réelle) sans indiquer le résultat.",
    canUse: (state) => peekNext(state.barrel) !== null,
    apply: (state, actorKey) => {
      const current = peekNext(state.barrel);
      if (!current) {
        return { message: "Impossible d'inverser : barillet vide." };
      }
      const flipped = current === 'real' ? 'blank' : 'real';
      state.barrel.chambers[state.barrel.index] = flipped;
      state.barrel.invertedNext = { from: current, to: flipped };
      if (state.players[actorKey].peekedNext) {
        state.players[actorKey].peekedNext = flipped;
      }
      Object.entries(state.players).forEach(([key, player]) => {
        if (key !== actorKey && player) {
          player.peekedNext = null;
        }
      });
      return { message: `${state.players[actorKey].name} inverse la balle.` };
    }
  },
  {
    id: 'scanner',
    name: 'Scanner',
    description: "Révèle la position d'une balle réelle dans le barillet.",
    canUse: (state) => state.barrel.chambers.slice(state.barrel.index).includes('real'),
    apply: (state, actorKey) => {
      const remaining = state.barrel.chambers.slice(state.barrel.index);
      const realIndices = remaining
        .map((round, idx) => (round === 'real' ? idx : null))
        .filter((idx) => idx !== null);

      if (!realIndices.length) {
        return { message: 'Aucune balle réelle détectée.' };
      }

      const picked = realIndices[Math.floor(Math.random() * realIndices.length)];
      const position = picked + 1;

      // détermine le suffixe (ère pour 1, ème pour le reste)
      const suffix = position === 1 ? 'ère' : 'ème';

      state.players[actorKey].scannerHint = position;

      return {
        message: `📡 Scanner : la ${position}${suffix} balle est réelle.`
      };
    }
  }
];

export function getItemById(id) {
  return ITEM_DEFS.find((item) => item.id === id);
}

const ITEM_WEIGHTS = {
  heart: 0.9,
  double: 0.5,
  peek: 0.9,
  eject: 0.7,
  handcuffs: 0.4,
  inverter: 0.55,
  scanner: 0.7
};

function rollWeightedItemId() {
  const totalWeight = ITEM_DEFS.reduce((sum, item) => sum + (ITEM_WEIGHTS[item.id] ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const item of ITEM_DEFS) {
    roll -= ITEM_WEIGHTS[item.id] ?? 1;
    if (roll <= 0) {
      return item.id;
    }
  }
  return ITEM_DEFS[0]?.id ?? 'heart';
}

export function rollRandomItems(count) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push(rollWeightedItemId());
  }
  return items;
}

export function applyItem(state, actorKey, itemId, targetKey = null) {
  const item = getItemById(itemId);
  if (!item || !item.canUse(state, actorKey, targetKey)) {
    return { message: 'Objet inutilisable.', success: false };
  }
  return { ...item.apply(state, actorKey, targetKey), success: true };
}
