import { remainingCounts, peekNext } from './barrel.js';
import { getItemById } from './items.js';

export function decideBotAction(state) {
  const bot = state.players.enemy;
  const counts = remainingCounts(state.barrel);
  const pReal = counts.remaining > 0 ? counts.real / counts.remaining : 0.5;

  if (bot.hp <= 1) {
    const peekItem = bot.items.find((itemId) => itemId === 'peek');
    if (peekItem) {
      return { type: 'item', itemId: peekItem };
    }
  }

  if (bot.items.includes('double') && pReal >= 0.6) {
    return { type: 'item', itemId: 'double' };
  }

  if (bot.items.includes('handcuffs') && !state.players.player.skipNextTurn && pReal >= 0.45) {
    return { type: 'item', itemId: 'handcuffs' };
  }

  if (bot.items.includes('heart') && bot.hp <= 3) {
    return { type: 'item', itemId: 'heart' };
  }

  const next = peekNext(state.barrel);
  if (next === 'blank' && pReal < 0.4) {
    return { type: 'shoot', target: 'self' };
  }

  if (pReal >= 0.5) {
    return { type: 'shoot', target: 'enemy' };
  }

  return { type: 'shoot', target: 'self' };
}

export function describeBotItem(itemId) {
  const item = getItemById(itemId);
  return item ? item.name : 'Objet';
}
