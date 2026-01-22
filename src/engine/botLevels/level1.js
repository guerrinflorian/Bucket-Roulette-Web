export const botLevel1 = {
  id: 1,
  key: 'peasant',
  name: '⭐ Bot Paysan',
  label: 'Bot Paysan',
  stars: 1,
  hp: {
    player: 3,
    bot: 3
  },
  behavior: {
    usesProbability: false,
    randomTarget: true,
    itemUseStrategy: 'immediate',
    healThreshold: 5,
    handcuffsRandomChance: 0.0,
    doubleUseThreshold: 0.0,
    peekUseChance: 0.0,
    ejectUseChance: 0.0,
    inverterUseChance: 0.0,
    scannerUseChance: 0.0,
    forgetPeekChance: 0.35
  }
};
