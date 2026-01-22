export const botLevel3 = {
  id: 3,
  key: 'tsar',
  name: '⭐⭐⭐ Bot Tsar',
  label: 'Bot Tsar',
  stars: 3,
  hp: {
    player: 5,
    bot: 5
  },
  behavior: {
    usesProbability: true,
    randomTarget: false,
    itemUseStrategy: 'advanced',
    healThreshold: 4,
    handcuffsPriority: true,
    doubleUseThreshold: 0.7,
    peekUseChance: 0.6,
    ejectUseChance: 0.5,
    inverterUseChance: 0.35,
    scannerUseChance: 0.4,
    forgetPeekChance: 0.0
  }
};
