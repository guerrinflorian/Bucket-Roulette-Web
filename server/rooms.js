const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createRoom(hostId) {
  let id = generateRoomId();
  while (rooms.has(id)) {
    id = generateRoomId();
  }
  rooms.set(id, {
    id,
    hostId,
    clients: new Set([hostId]),
    state: null
  });
  return id;
}

export function joinRoom(roomId, clientId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.clients.add(clientId);
  return room;
}

export function leaveRoom(roomId, clientId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.clients.delete(clientId);
  if (room.clients.size === 0) {
    rooms.delete(roomId);
    return null;
  }
  if (room.hostId === clientId) {
    room.hostId = [...room.clients][0];
  }
  return room;
}

export function setState(roomId, state) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.state = state;
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}
