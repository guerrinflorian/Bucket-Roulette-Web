import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
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

function getRoomInfo(room) {
  return {
    hostId: room.host,
    hostName: room.hostName,
    guestId: room.guest,
    guestName: room.guestName,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded
  };
}

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Create a new room
  socket.on('room:create', ({ playerName }) => {
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Nom de joueur requis' });
      return;
    }
    let roomId = generateRoomCode();
    // Ensure unique
    while (rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    rooms.set(roomId, {
      host: socket.id,
      hostName: playerName,
      guest: null,
      guestName: null,
      gameState: null,
      players: [socket.id],
      gameStarted: false,
      gameEnded: false
    });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = true;
    socket.playerName = playerName;

    console.log(`🏠 Room created: ${roomId} by ${playerName} (${socket.id})`);
    socket.emit('room:created', { roomId, isHost: true, hostName: playerName });
  });

  // Join an existing room
  socket.on('room:join', ({ roomId, playerName }) => {
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length < 4) {
      socket.emit('room:error', { message: 'Code de room invalide' });
      return;
    }
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      socket.emit('room:error', { message: 'Nom de joueur requis' });
      return;
    }
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

    if (room.players.length >= 2) {
      socket.emit('room:error', { message: 'Room pleine' });
      return;
    }

    room.guest = socket.id;
    room.guestName = playerName;
    room.players.push(socket.id);
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
    io.to(room.host).emit('room:player-joined', { 
      playerId: socket.id,
      playerName: playerName
    });

    // If both players are here, notify both that the game can start
    if (room.players.length === 2) {
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

    // Send to guest only
    if (room.guest) {
      io.to(room.guest).emit('game:state', gameState);
    }
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
          wasHost: wasHost
        });

        // Remove player from room
        room.players = room.players.filter(id => id !== socket.id);

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
            // Game not started yet, promote guest
            room.host = room.guest;
            room.hostName = room.guestName;
            room.guest = null;
            room.guestName = null;
            
            // Update socket data for promoted player
            const promotedSocket = io.sockets.sockets.get(room.host);
            if (promotedSocket) {
              promotedSocket.isHost = true;
            }
            
            io.to(room.host).emit('room:promoted-host', {
              hostName: room.hostName
            });
            console.log(`👑 ${room.hostName} promoted to host in room ${socket.roomId}`);
          }
        } else {
          // Guest left
          room.guest = null;
          room.guestName = null;
          
          if (room.gameStarted && !room.gameEnded) {
            // Game in progress, notify host
            io.to(room.host).emit('room:guest-left', { 
              message: "L'adversaire a quitté la partie" 
            });
          }
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
          wasHost: wasHost
        });

        // Remove player from room
        room.players = room.players.filter(id => id !== socket.id);
        socket.leave(socket.roomId);

        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted`);
        } else if (wasHost) {
          room.host = room.guest;
          room.hostName = room.guestName;
          room.guest = null;
          room.guestName = null;
          
          const promotedSocket = io.sockets.sockets.get(room.host);
          if (promotedSocket) {
            promotedSocket.isHost = true;
          }
          
          io.to(room.host).emit('room:promoted-host', {
            hostName: room.hostName
          });
        } else {
          room.guest = null;
          room.guestName = null;
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
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});
