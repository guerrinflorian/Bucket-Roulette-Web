import { remainingCounts, peekNext } from './barrel.js';
import { getItemById } from './items.js';
import { getBotLevel } from './botLevels/index.js';

function getBotCounts(state, level) {
  if (!level.behavior.usesProbability) {
    return {
      real: null,
      blank: null,
      remaining: null,
      pReal: 0.5
    };
  }
  const memory = state.botMemory;
  const real = memory?.realRemaining ?? remainingCounts(state.barrel).real;
  const blank = memory?.blankRemaining ?? remainingCounts(state.barrel).blank;
  const remaining = Math.max(0, real + blank);
  const pReal = remaining > 0 ? real / remaining : 0.5;
  return { real, blank, remaining, pReal };
}

function maybeForgetPeek(bot, level) {
  if (!bot.peekedNext) return null;
  if (level.behavior.forgetPeekChance > 0 && Math.random() < level.behavior.forgetPeekChance) {
    return null;
  }
  return bot.peekedNext;
}

function shouldUseImmediateItem(bot, itemId) {
  return bot.items.includes(itemId);
}

function canUseItem(state, itemId, actorKey, targetKey = null) {
  const item = getItemById(itemId);
  if (!item) return false;
  return item.canUse(state, actorKey, targetKey);
}

function decideItemAction(state, level, counts) {
  const bot = state.players.enemy;
  const opponent = state.players.player;
  const next = maybeForgetPeek(bot, level) ?? peekNext(state.barrel);

  if (level.behavior.itemUseStrategy === 'immediate') {
    const order = ['handcuffs', 'double', 'scanner', 'peek', 'eject', 'inverter', 'heart'];
    for (const itemId of order) {
      const targetKey = itemId === 'handcuffs' ? 'player' : null;
      if (shouldUseImmediateItem(bot, itemId) && canUseItem(state, itemId, 'enemy', targetKey)) {
        return { type: 'item', itemId };
      }
    }
  }

  if (
    bot.items.includes('heart') &&
    bot.hp <= level.behavior.healThreshold &&
    canUseItem(state, 'heart', 'enemy')
  ) {
    return { type: 'item', itemId: 'heart' };
  }

  if (
    bot.items.includes('handcuffs') &&
    !opponent.skipNextTurn &&
    (level.behavior.handcuffsPriority || Math.random() < (level.behavior.handcuffsRandomChance ?? 0)) &&
    canUseItem(state, 'handcuffs', 'enemy', 'player')
  ) {
    return { type: 'item', itemId: 'handcuffs' };
  }

  if (level.behavior.itemUseStrategy === 'imperial') {
    if (bot.items.includes('peek') && !bot.peekedNext && canUseItem(state, 'peek', 'enemy')) {
      return { type: 'item', itemId: 'peek' };
    }
    if (
      bot.items.includes('scanner') &&
      Math.random() < level.behavior.scannerUseChance &&
      canUseItem(state, 'scanner', 'enemy')
    ) {
      return { type: 'item', itemId: 'scanner' };
    }
    if (
      bot.items.includes('eject') &&
      counts.pReal === 1 &&
      bot.hp <= 1 &&
      opponent.hp >= 3 &&
      canUseItem(state, 'eject', 'enemy')
    ) {
      return { type: 'item', itemId: 'eject' };
    }
    if (bot.items.includes('inverter') && next && canUseItem(state, 'inverter', 'enemy')) {
      if (next === 'blank' && counts.pReal >= 0.5) {
        return { type: 'item', itemId: 'inverter' };
      }
      if (next === 'real' && counts.pReal < 0.5) {
        return { type: 'item', itemId: 'inverter' };
      }
    }
    if (bot.items.includes('eject') && next === 'blank' && canUseItem(state, 'eject', 'enemy')) {
      return { type: 'item', itemId: 'eject' };
    }
    if (bot.items.includes('double') && next === 'real' && canUseItem(state, 'double', 'enemy')) {
      return { type: 'item', itemId: 'double' };
    }
  }

  if (
    bot.items.includes('peek') &&
    !bot.peekedNext &&
    Math.random() < level.behavior.peekUseChance &&
    canUseItem(state, 'peek', 'enemy')
  ) {
    return { type: 'item', itemId: 'peek' };
  }

  if (
    bot.items.includes('scanner') &&
    Math.random() < level.behavior.scannerUseChance &&
    canUseItem(state, 'scanner', 'enemy')
  ) {
    return { type: 'item', itemId: 'scanner' };
  }

  if (
    bot.items.includes('inverter') &&
    next &&
    Math.random() < level.behavior.inverterUseChance &&
    canUseItem(state, 'inverter', 'enemy')
  ) {
    return { type: 'item', itemId: 'inverter' };
  }

  if (
    bot.items.includes('eject') &&
    next &&
    Math.random() < level.behavior.ejectUseChance &&
    canUseItem(state, 'eject', 'enemy')
  ) {
    return { type: 'item', itemId: 'eject' };
  }

  if (
    bot.items.includes('double') &&
    counts.pReal >= level.behavior.doubleUseThreshold &&
    canUseItem(state, 'double', 'enemy')
  ) {
    return { type: 'item', itemId: 'double' };
  }

  if (
    bot.items.includes('double') &&
    next === 'real' &&
    counts.remaining <= 2 &&
    canUseItem(state, 'double', 'enemy')
  ) {
    return { type: 'item', itemId: 'double' };
  }

  return null;
}

function decideShootTarget(state, level, counts) {
  const bot = state.players.enemy;
  const next = maybeForgetPeek(bot, level);
  const opponentKey = 'player';
  const selfKey = 'enemy';

  if (next === 'real') {
    return opponentKey;
  }
  if (next === 'blank') {
    return selfKey;
  }

  if (bot.scannerHint !== null && bot.scannerHint !== undefined) {
    if (bot.scannerHint <= 1) {
      return opponentKey;
    }
    return selfKey;
  }

  if (bot.doubleDamageNextShot) {
    return opponentKey;
  }

  if (level.behavior.randomTarget) {
    return Math.random() < 0.5 ? 'enemy' : 'self';
  }

  if (!level.behavior.usesProbability) {
    return Math.random() < 0.5 ? 'enemy' : 'self';
  }

  if (level.behavior.itemUseStrategy === 'advanced' && counts.blank > counts.real) {
    return selfKey;
  }

  if (counts.pReal > 0.5) {
    return opponentKey;
  }

  if (counts.pReal < 0.5) {
  return selfKey;
}

  return Math.random() < 0.5 ? 'enemy' : 'self';
}

export function decideBotAction(state) {
  const level = getBotLevel(state.botDifficulty ?? 1);
  const counts = getBotCounts(state, level);
  const itemAction = decideItemAction(state, level, counts);
  if (itemAction) {
    return itemAction;
  }

  const target = decideShootTarget(state, level, counts);
  return { type: 'shoot', target };
}

export function describeBotItem(itemId) {
  const item = getItemById(itemId);
  return item ? item.name : 'Objet';
}
