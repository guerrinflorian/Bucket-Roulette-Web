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

function decideItemAction(state, level, counts) {
  const bot = state.players.enemy;
  const opponent = state.players.player;
  const next = maybeForgetPeek(bot, level) ?? peekNext(state.barrel);

  if (level.behavior.itemUseStrategy === 'immediate') {
    const order = ['handcuffs', 'double', 'scanner', 'peek', 'eject', 'inverter', 'heart'];
    for (const itemId of order) {
      if (shouldUseImmediateItem(bot, itemId)) {
        return { type: 'item', itemId };
      }
    }
  }

  if (bot.items.includes('heart') && bot.hp <= level.behavior.healThreshold) {
    return { type: 'item', itemId: 'heart' };
  }

  if (
    bot.items.includes('handcuffs') &&
    !opponent.skipNextTurn &&
    (level.behavior.handcuffsPriority || Math.random() < (level.behavior.handcuffsRandomChance ?? 0))
  ) {
    return { type: 'item', itemId: 'handcuffs' };
  }

  if (level.behavior.itemUseStrategy === 'imperial') {
    if (bot.items.includes('peek') && !bot.peekedNext) {
      return { type: 'item', itemId: 'peek' };
    }
    if (bot.items.includes('scanner') && Math.random() < level.behavior.scannerUseChance) {
      return { type: 'item', itemId: 'scanner' };
    }
    if (bot.items.includes('eject') && counts.pReal === 1 && bot.hp <= 1 && opponent.hp >= 3) {
      return { type: 'item', itemId: 'eject' };
    }
    if (bot.items.includes('inverter') && next) {
      if (next === 'blank' && counts.pReal >= 0.5) {
        return { type: 'item', itemId: 'inverter' };
      }
      if (next === 'real' && counts.pReal < 0.5) {
        return { type: 'item', itemId: 'inverter' };
      }
    }
    if (bot.items.includes('eject') && next === 'blank') {
      return { type: 'item', itemId: 'eject' };
    }
    if (bot.items.includes('double') && next === 'real') {
      return { type: 'item', itemId: 'double' };
    }
  }

  if (bot.items.includes('peek') && !bot.peekedNext && Math.random() < level.behavior.peekUseChance) {
    return { type: 'item', itemId: 'peek' };
  }

  if (bot.items.includes('scanner') && Math.random() < level.behavior.scannerUseChance) {
    return { type: 'item', itemId: 'scanner' };
  }

  if (bot.items.includes('inverter') && next && Math.random() < level.behavior.inverterUseChance) {
    return { type: 'item', itemId: 'inverter' };
  }

  if (bot.items.includes('eject') && next && Math.random() < level.behavior.ejectUseChance) {
    return { type: 'item', itemId: 'eject' };
  }

  if (bot.items.includes('double') && counts.pReal >= level.behavior.doubleUseThreshold) {
    return { type: 'item', itemId: 'double' };
  }

  if (bot.items.includes('double') && next === 'real' && counts.remaining <= 2) {
    return { type: 'item', itemId: 'double' };
  }

  return null;
}

function decideShootTarget(state, level, counts) {
  if (level.behavior.randomTarget) {
    return Math.random() < 0.5 ? 'enemy' : 'self';
  }

  if (!level.behavior.usesProbability) {
    return Math.random() < 0.5 ? 'enemy' : 'self';
  }

  if (level.behavior.itemUseStrategy === 'advanced' && counts.blank > counts.real) {
    return 'self';
  }

  if (counts.pReal > 0.5) {
    return 'enemy';
  }

  if (counts.pReal < 0.5) {
    return 'self';
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
