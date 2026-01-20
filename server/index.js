import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
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

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Create a new room
  socket.on('room:create', ({ playerName }) => {
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
      players: [socket.id]
    });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = true;
    socket.playerName = playerName;

    console.log(`🏠 Room created: ${roomId} by ${playerName} (${socket.id})`);
    socket.emit('room:created', { roomId, isHost: true });
  });

  // Join an existing room
  socket.on('room:join', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('room:error', { message: 'Room introuvable' });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('room:error', { message: 'Room pleine' });
      return;
    }

    room.guest = socket.id;
    room.guestName = playerName;
    room.players.push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.isHost = false;
    socket.playerName = playerName;

    console.log(`👥 ${playerName} (${socket.id}) joined room ${roomId}`);

    // Notify the guest they joined
    socket.emit('room:joined', { roomId, isHost: false });

    // Notify the host that someone joined (with name)
    io.to(room.host).emit('room:player-joined', { 
      playerId: socket.id,
      playerName: playerName
    });

    // If both players are here, notify both that the game can start
    if (room.players.length === 2) {
      io.to(roomId).emit('room:ready', { 
        hostId: room.host,
        hostName: room.hostName,
        guestId: room.guest,
        guestName: room.guestName
      });
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
    console.log(`🎮 Game started in room ${roomId} by host ${socket.id}`);
    console.log(`📤 Broadcasting game:state to room ${roomId} (${room.players.length} players)`);
    
    // Send state to all players in the room
    io.to(roomId).emit('game:state', gameState);
    
    console.log(`✅ game:state sent to room ${roomId}`);
  });

  // Player performs an action
  socket.on('game:action', ({ roomId, action }) => {
    const room = rooms.get(roomId);
    if (!room) return;

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
    // Send to guest only
    if (room.guest) {
      io.to(room.guest).emit('game:state', gameState);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        // Notify other player
        socket.to(socket.roomId).emit('room:player-left', { 
          playerId: socket.id,
          wasHost: socket.isHost 
        });

        // Remove player from room
        room.players = room.players.filter(id => id !== socket.id);

        // If room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted`);
        } else if (socket.isHost) {
          // If host left, promote guest to host
          room.host = room.guest;
          room.guest = null;
          io.to(room.host).emit('room:promoted-host');
        } else {
          room.guest = null;
        }
      }
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
