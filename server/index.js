import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { createRoom, joinRoom, leaveRoom, getRoom, setState } from './rooms.js';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  socket.on('room:create', () => {
    const roomId = createRoom(socket.id);
    socket.join(roomId);
    socket.emit('room:created', roomId);
  });

  socket.on('room:join', ({ roomId }) => {
    const room = joinRoom(roomId, socket.id);
    if (!room) {
      socket.emit('room:error', 'Room introuvable');
      return;
    }
    socket.join(roomId);
    socket.emit('room:joined', { roomId, hostId: room.hostId });
    if (room.state) {
      socket.emit('game:state', room.state);
    }
  });

  socket.on('player:ready', ({ roomId }) => {
    io.to(roomId).emit('player:ready', { playerId: socket.id });
  });

  socket.on('game:action', ({ roomId, action }) => {
    const room = getRoom(roomId);
    if (!room) return;
    io.to(room.hostId).emit('game:action', { playerId: socket.id, action });
  });

  socket.on('game:state', ({ roomId, state }) => {
    const room = getRoom(roomId);
    if (!room) return;
    if (room.hostId !== socket.id) return;
    setState(roomId, state);
    socket.to(roomId).emit('game:state', state);
  });

  socket.on('disconnect', () => {
    for (const room of io.sockets.adapter.rooms.keys()) {
      if (room.length !== 6) continue;
      leaveRoom(room, socket.id);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Bucket Roulette server online');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
