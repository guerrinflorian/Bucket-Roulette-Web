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

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

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

    if (room.gameEnded) {
      socket.emit('room:error', { message: 'Cette partie est terminée' });
      return;
    }

    room.gameState = gameState;
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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const wasHost = socket.isHost;
        const playerName = socket.playerName;

        // Notify other player immediately
        socket.to(socket.roomId).emit('room:player-left', {
          playerId: socket.id,
          playerName: playerName,
          wasHost: wasHost,
          ...getRoomInfo(room)
        });

        // Remove player from room
        room.players = room.players.filter((player) => player.id !== socket.id);

        // If room is empty or game hasn't started, delete room
        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted (empty)`);
        } else if (wasHost) {
          // If host left, either promote guest or delete room
          if (room.gameStarted && !room.gameEnded) {
            // Game in progress, end it
            room.gameEnded = true;
            io.to(socket.roomId).emit('room:host-left', {
              message: "L'hôte a quitté la partie"
            });
            console.log(`🚪 Host left during game in room ${socket.roomId}`);
          } else if (!room.gameStarted) {
            // Game not started yet, promote first remaining player
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
        } else if (room.gameStarted && !room.gameEnded) {
          io.to(room.host).emit('room:guest-left', {
            message: "Un joueur a quitté la partie"
          });
        }
      }
    }
  });

  // Leave room manually
  socket.on('room:leave', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const wasHost = socket.isHost;

        // Notify other player
        socket.to(socket.roomId).emit('room:player-left', {
          playerId: socket.id,
          playerName: socket.playerName,
          wasHost: wasHost,
          ...getRoomInfo(room)
        });

        // Remove player from room
        room.players = room.players.filter((player) => player.id !== socket.id);
        socket.leave(socket.roomId);

        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted`);
        } else if (wasHost) {
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
