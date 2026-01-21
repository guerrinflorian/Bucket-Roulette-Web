import { botLevel1 } from './level1.js';
import { botLevel2 } from './level2.js';
import { botLevel3 } from './level3.js';
import { botLevel4 } from './level4.js';

export const BOT_LEVELS = [botLevel1, botLevel2, botLevel3, botLevel4];

export function getBotLevel(id = 1) {
  return BOT_LEVELS.find((level) => level.id === id) || botLevel1;
}
