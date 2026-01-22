export const botLevel2 = {
  id: 2,
  key: 'prince',
  name: '⭐⭐ Bot Prince',
  label: 'Bot Prince',
  stars: 2,
  hp: {
    player: 4,
    bot: 4
  },
  behavior: {
    usesProbability: true,
    randomTarget: false,
    itemUseStrategy: 'basic',
    healThreshold: 2,
    handcuffsRandomChance: 0.4,
    doubleUseThreshold: 0.55,
    peekUseChance: 0.15,
    ejectUseChance: 0.1,
    inverterUseChance: 0.1,
    scannerUseChance: 0.15,
    forgetPeekChance: 0.1
  }
};
