import { BARREL_SIZE, REAL_MIN, REAL_MAX } from './rules.js';
import { randomInt, shuffle } from './rng.js';

export function createBarrel() {
  const realCount = randomInt(REAL_MIN, REAL_MAX);
  const blanks = BARREL_SIZE - realCount;
  const chambers = shuffle([
    ...Array(realCount).fill('real'),
    ...Array(blanks).fill('blank')
  ]);

  return {
    chambers,
    index: 0
  };
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
