export function serializeState(state) {
  return JSON.stringify({
    phase: state.phase,
    currentTurn: state.currentTurn,
    barrel: state.barrel,
    players: state.players,
    lastResult: state.lastResult,
    lastAction: state.lastAction,
    winner: state.winner
  });
}

export function hydrateState(payload) {
  try {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return data;
  } catch (error) {
    return null;
  }
}
