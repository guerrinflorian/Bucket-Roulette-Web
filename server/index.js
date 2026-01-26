import 'dotenv/config';
import { Server } from 'socket.io';
import buildApp from './app.js';
import { getCorsOriginValidator } from './cors.js';

const fastify = await buildApp();
await fastify.ready();

const httpServer = fastify.server;
const io = new Server(httpServer, {
  pingInterval: 25000,
  pingTimeout: 60000,
  cors: {
    origin: getCorsOriginValidator(),
    methods: ['GET', 'POST']
  }
});

// Store rooms and their state
const rooms = new Map();
const quickplayQueue = [];
const ACTION_RATE_LIMIT = {
  minIntervalMs: 1000,
  maxTokens: 6,
  windowMs: 15000
};
const OTHER_RATE_LIMIT = {
  maxTokens: 25,
  refillPerMs: 15 / 1000
};

const refillBucket = (bucket, now, maxTokens, refillPerMs) => {
  const elapsed = now - bucket.lastRefill;
  if (elapsed <= 0) return;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillPerMs);
  bucket.lastRefill = now;
};

const canConsumeAction = (socket, action) => {
  if (!socket?.data?.rateLimits) return true;
  const now = Date.now();
  const isActionType = action?.type === 'shoot' || action?.type === 'item';
  const bucket = isActionType ? socket.data.rateLimits.action : socket.data.rateLimits.other;

  if (isActionType) {
    if (now - bucket.lastActionAt < ACTION_RATE_LIMIT.minIntervalMs) {
      return false;
    }
    refillBucket(
      bucket,
      now,
      ACTION_RATE_LIMIT.maxTokens,
      ACTION_RATE_LIMIT.maxTokens / ACTION_RATE_LIMIT.windowMs
    );
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    bucket.lastActionAt = now;
    return true;
  }

  refillBucket(bucket, now, OTHER_RATE_LIMIT.maxTokens, OTHER_RATE_LIMIT.refillPerMs);
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function serializePlayers(room) {
  return room.players.map((player) => ({
    id: player.id,
    name: player.name,
    userId: player.userId || null,
    isHost: player.id === room.host
  }));
}

function getRoomInfo(room) {
  return {
    hostId: room.host,
    hostName: room.hostName,
    players: serializePlayers(room),
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded
  };
}

function removeFromQuickplayQueue(socketId) {
  const index = quickplayQueue.findIndex((entry) => entry.id === socketId);
  if (index >= 0) {
    quickplayQueue.splice(index, 1);
  }
}

function createQuickplayRoom(hostSocket, guestSocket) {
  let roomId = generateRoomCode();
  while (rooms.has(roomId)) {
    roomId = generateRoomCode();
  }

  const hostName = hostSocket.playerName;
  const guestName = guestSocket.playerName;
  const hostUserId = hostSocket.userId || null;
  const guestUserId = guestSocket.userId || null;

  rooms.set(roomId, {
    host: hostSocket.id,
    hostName,
    gameState: null,
    players: [
      { id: hostSocket.id, name: hostName, userId: hostUserId },
      { id: guestSocket.id, name: guestName, userId: guestUserId }
    ],
    gameStarted: false,
    gameEnded: false
  });

  hostSocket.join(roomId);
  guestSocket.join(roomId);
  hostSocket.roomId = roomId;
  guestSocket.roomId = roomId;
  hostSocket.isHost = true;
  guestSocket.isHost = false;

  hostSocket.emit('room:created', {
    roomId,
    isHost: true,
    hostName,
    ...getRoomInfo(rooms.get(roomId))
  });

  guestSocket.emit('room:joined', {
    roomId,
    isHost: false,
    hostName,
    ...getRoomInfo(rooms.get(roomId))
  });

  io.to(roomId).emit('room:ready', getRoomInfo(rooms.get(roomId)));

  hostSocket.emit('quickplay:matched', {
    roomId,
    opponentName: guestName,
    isHost: true
  });
  guestSocket.emit('quickplay:matched', {
    roomId,
    opponentName: hostName,
    isHost: false
  });
}

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  const now = Date.now();
  socket.data.rateLimits = {
    action: {
      tokens: ACTION_RATE_LIMIT.maxTokens,
      lastRefill: now,
      lastActionAt: 0
    },
    other: {
      tokens: OTHER_RATE_LIMIT.maxTokens,
      lastRefill: now
    }
  };

  // Create a new room
  socket.on('room:create', ({ playerName, userId }) => {
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Nom de joueur requis' });
      return;
    }
    const normalizedUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;
    let roomId = generateRoomCode();
    // Ensure unique
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    rooms.set(roomId, {
      host: socket.id,
      hostName: playerName,
      gameState: null,
      players: [{ id: socket.id, name: playerName, userId: normalizedUserId }],
      gameStarted: false,
      gameEnded: false
    });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = true;
    socket.playerName = playerName;
    socket.userId = normalizedUserId;

    console.log(`🏠 Room created: ${roomId} by ${playerName} (${socket.id})`);
    socket.emit('room:created', {
      roomId,
      isHost: true,
      hostName: playerName,
      ...getRoomInfo(rooms.get(roomId))
    });
  });

  // Join an existing room
  socket.on('room:join', ({ roomId, playerName, userId }) => {
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length < 4) {
      socket.emit('room:error', { message: 'Code de room invalide' });
      return;
    }
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Nom de joueur requis' });
      return;
    }
    const normalizedUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;
    const normalizedRoomId = roomId.trim().toUpperCase();
    const room = rooms.get(normalizedRoomId);

    if (!room) {
      socket.emit('room:error', { message: 'Room introuvable' });
      return;
    }

    if (room.gameEnded) {
      socket.emit('room:error', { message: 'Cette partie est terminée' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('room:error', { message: 'La partie a déjà commencé' });
      return;
    }

    if (room.players.length >= 3) {
      socket.emit('room:error', { message: 'Room pleine' });
      return;
    }

    if (normalizedUserId && room.players.some(p => p.userId === normalizedUserId)) {
      socket.emit('room:error', { message: 'Vous êtes déjà présent dans cette room avec un autre appareil.' });
      return;
    }

    room.players.push({ id: socket.id, name: playerName, userId: normalizedUserId });
    socket.join(normalizedRoomId);
    socket.roomId = normalizedRoomId;
    socket.isHost = false;
    socket.playerName = playerName;
    socket.userId = normalizedUserId;

    console.log(`👥 ${playerName} (${socket.id}) joined room ${normalizedRoomId}`);

    // Notify the guest they joined with full room info
    socket.emit('room:joined', {
      roomId: normalizedRoomId,
      isHost: false,
      ...getRoomInfo(room)
    });

    // Notify the host that someone joined (with name)
    socket.to(normalizedRoomId).emit('room:player-joined', {
      playerId: socket.id,
      playerName: playerName,
      ...getRoomInfo(room)
    });

    // If minimum players are here, notify both that the game can start
    if (room.players.length >= 2) {
      io.to(normalizedRoomId).emit('room:ready', getRoomInfo(room));
    }
  });

  // Host starts the game and sends initial state
  socket.on('game:start', ({ roomId, gameState }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) {
      console.log(`⚠️ Invalid game:start from ${socket.id} for room ${roomId}`);
      return;
    }

    room.gameState = gameState;
    room.gameEnded = false;
    room.gameStarted = true;
    console.log(`🎮 Game started in room ${roomId} by host ${socket.id}`);
    console.log(`📤 Broadcasting game:state to room ${roomId} (${room.players.length} players)`);

    // Send state to all players in the room
    io.to(roomId).emit('game:state', gameState);

    console.log(`✅ game:state sent to room ${roomId}`);
  });

  // Player performs an action
  socket.on('game:action', ({ roomId, action }) => {
    if (!roomId || !action || !action.type) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.gameEnded) return;
    if (!room.gameStarted) return;
    if (socket.roomId !== roomId) return;
    if (action.resolved && !socket.isHost) return;
    if (action.type === 'timer' && !socket.isHost) return;
    if (!canConsumeAction(socket, action)) {
      socket.emit('game:rate-limited', { message: 'Action trop rapide.' });
      return;
    }

    console.log(`🎯 Action in room ${roomId}:`, action.type);

    // Broadcast action to all players in room (including sender for confirmation)
    io.to(roomId).emit('game:action', {
      action,
      playerId: socket.id,
      isHost: socket.isHost
    });
  });

  // Sync game state (host sends full state)
  socket.on('game:sync', ({ roomId, gameState }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;

    room.gameState = gameState;

    // Check if game ended
    if (gameState.winner) {
      room.gameEnded = true;
      room.gameStarted = false;
      console.log(`🏆 Game ended in room ${roomId}, winner: ${gameState.winner}`);
    }

    // Send to everyone except host
    socket.to(roomId).emit('game:state', gameState);
  });

  // Game ended
  socket.on('game:end', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.gameEnded = true;
    room.gameStarted = false;
    console.log(`🏁 Game ended in room ${roomId}`);

    // Notify all players
    io.to(roomId).emit('room:game-ended', { roomId });
  });

  // Host kicks a player
  socket.on('room:kick', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;
    if (!playerId || playerId === room.host) return;

    const targetIndex = room.players.findIndex((player) => player.id === playerId);
    if (targetIndex === -1) return;

    const [removed] = room.players.splice(targetIndex, 1);
    const targetSocket = io.sockets.sockets.get(playerId);

    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.roomId = null;
      targetSocket.isHost = false;
      targetSocket.emit('room:kicked', {
        roomId,
        message: "Vous avez été éjecté par l'hôte."
      });
    }

    io.to(roomId).emit('room:player-left', {
      playerId,
      playerName: removed?.name,
      wasHost: false,
      ...getRoomInfo(room)
    });

  });

  socket.on('room:chat', ({ roomId, message }) => {
    if (!roomId || typeof message !== 'string') return;
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 240) return;
    if (!socket.roomId || socket.roomId !== roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.gameStarted || room.gameEnded) return;

    const player = room.players.find((entry) => entry.id === socket.id);
    if (!player) return;

    io.to(roomId).emit('room:chat', {
      playerId: socket.id,
      playerName: player.name,
      userId: player.userId || null,
      message: trimmed,
      timestamp: Date.now()
    });
  });

  socket.on('quickplay:join', ({ playerName, userId }) => {
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('quickplay:error', { message: 'Nom de joueur requis' });
      return;
    }
    if (socket.roomId) {
      socket.emit('quickplay:error', { message: 'Vous êtes déjà dans une room.' });
      return;
    }
    if (quickplayQueue.some((entry) => entry.id === socket.id)) {
      socket.emit('quickplay:error', { message: 'Recherche déjà en cours.' });
      return;
    }

    const normalizedUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;
    socket.playerName = playerName;
    socket.userId = normalizedUserId;
    quickplayQueue.push({
      id: socket.id,
      name: playerName,
      userId: normalizedUserId
    });

    if (quickplayQueue.length >= 2) {
      const first = quickplayQueue.shift();
      const second = quickplayQueue.shift();
      if (!first || !second) return;
      const hostSocket = io.sockets.sockets.get(first.id);
      const guestSocket = io.sockets.sockets.get(second.id);
      if (!hostSocket || !guestSocket) {
        if (hostSocket) {
          quickplayQueue.push(first);
        }
        if (guestSocket) {
          quickplayQueue.push(second);
        }
        return;
      }
      createQuickplayRoom(hostSocket, guestSocket);
    }
  });

  socket.on('quickplay:leave', () => {
    removeFromQuickplayQueue(socket.id);
    socket.emit('quickplay:left');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    removeFromQuickplayQueue(socket.id);

    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const wasHost = socket.isHost;
        const playerName = socket.playerName;

        // Remove player from room
        room.players = room.players.filter((player) => player.id !== socket.id);

        const roomIsEmpty = room.players.length === 0;
        if (roomIsEmpty) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted (empty)`);
        }

        if (!roomIsEmpty && wasHost) {
          // If host left, either end game or promote next host
          if (room.gameStarted && !room.gameEnded) {
            room.gameEnded = true;
            room.gameStarted = false;
            io.to(socket.roomId).emit('room:host-left', {
              message: "L'hôte a quitté la partie"
            });
            console.log(`🚪 Host left during game in room ${socket.roomId}`);
          } else {
            const nextHost = room.players[0];
            if (nextHost) {
              room.host = nextHost.id;
              room.hostName = nextHost.name;

              const promotedSocket = io.sockets.sockets.get(room.host);
              if (promotedSocket) {
                promotedSocket.isHost = true;
              }

              io.to(room.host).emit('room:promoted-host', {
                hostName: room.hostName,
                ...getRoomInfo(room)
              });
              console.log(`👑 ${room.hostName} promoted to host in room ${socket.roomId}`);
            }
          }
        } else if (!roomIsEmpty && room.gameStarted && !room.gameEnded) {
          io.to(room.host).emit('room:guest-left', {
            message: "Un joueur a quitté la partie"
          });
        }

        if (!roomIsEmpty) {
          // Notify other player with updated room info
          socket.to(socket.roomId).emit('room:player-left', {
            playerId: socket.id,
            playerName: playerName,
            wasHost: wasHost,
            ...getRoomInfo(room)
          });
        }
      }
    }
  });

  // Leave room manually
  socket.on('room:leave', () => {
    removeFromQuickplayQueue(socket.id);
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const wasHost = socket.isHost;

        // Remove player from room
        room.players = room.players.filter((player) => player.id !== socket.id);
        socket.leave(socket.roomId);

        const roomIsEmpty = room.players.length === 0;
        if (roomIsEmpty) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted`);
        }

        if (!roomIsEmpty && wasHost) {
          if (room.gameStarted && !room.gameEnded) {
            room.gameEnded = true;
            room.gameStarted = false;
            io.to(socket.roomId).emit('room:host-left', {
              message: "L'hôte a quitté la partie"
            });
          } else {
            const nextHost = room.players[0];
            if (nextHost) {
              room.host = nextHost.id;
              room.hostName = nextHost.name;

              const promotedSocket = io.sockets.sockets.get(room.host);
              if (promotedSocket) {
                promotedSocket.isHost = true;
              }

              io.to(room.host).emit('room:promoted-host', {
                hostName: room.hostName,
                ...getRoomInfo(room)
              });
            }
          }
        }

        if (!roomIsEmpty) {
          // Notify other player with updated room info
          socket.to(socket.roomId).emit('room:player-left', {
            playerId: socket.id,
            playerName: socket.playerName,
            wasHost: wasHost,
            ...getRoomInfo(room)
          });
        }
      }

      socket.roomId = null;
      socket.isHost = false;
    }
  });

  // Chat/ping for testing
  socket.on('ping', () => {
    socket.emit('pong', { time: Date.now() });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Fastify + Socket.IO running on port ${PORT}`);
});
