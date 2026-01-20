import { randomInt, shuffle } from './rng.js';

const BARREL_TOTAL_MIN = 2;
const BARREL_TOTAL_MAX = 7;
const REAL_COUNT_OPTIONS = {
  2: [1],
  3: [1, 2],
  4: [2],
  5: [2, 3],
  6: [2, 3, 4],
  7: [3, 4]
};

export function createBarrel() {
  const total = randomInt(BARREL_TOTAL_MIN, BARREL_TOTAL_MAX);
  const options = REAL_COUNT_OPTIONS[total] || [Math.floor(total / 2)];
  const realCount = options[randomInt(0, options.length - 1)];
  const blanks = total - realCount;
  const chambers = shuffle([
    ...Array(realCount).fill('real'),
    ...Array(blanks).fill('blank')
  ]);

  return {
    chambers,
    index: 0,
    firstShotFired: false
  };
}

export function getBarrelSummary(barrel) {
  const total = barrel?.chambers?.length ?? 0;
  const real = barrel?.chambers?.filter((round) => round === 'real').length ?? 0;
  return {
    total,
    real,
    blank: Math.max(0, total - real)
  };
}

export function formatBarrelAnnouncement(barrel) {
  const { total, real, blank } = getBarrelSummary(barrel);
  return `Barillet chargé : ${total} cartouches (${real} réelles, ${blank} blanches).`;
}

export function peekNext(barrel) {
  return barrel.chambers[barrel.index] ?? null;
}

export function popNext(barrel) {
  const value = barrel.chambers[barrel.index] ?? null;
  if (value !== null) {
    barrel.index += 1;
  }
  return value;
}

export function remainingCounts(barrel) {
  const remaining = barrel.chambers.slice(barrel.index);
  return {
    real: remaining.filter((round) => round === 'real').length,
    blank: remaining.filter((round) => round === 'blank').length,
    remaining: remaining.length
  };
}

export function isEmpty(barrel) {
  return barrel.index >= barrel.chambers.length;
}
