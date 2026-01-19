import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { hydrateState } from '../engine/sync.js';

export const useNetStore = defineStore('net', {
  state: () => ({
    socket: null,
    connected: false,
    roomId: null,
    isHost: false
  }),
  actions: {
    connect() {
      if (this.socket) return;
      this.socket = io('http://localhost:3001');
      this.socket.on('connect', () => {
        this.connected = true;
      });
      this.socket.on('disconnect', () => {
        this.connected = false;
      });
    },
    createRoom() {
      this.connect();
      this.isHost = true;
      this.socket.emit('room:create');
      this.socket.on('room:created', (id) => {
        this.roomId = id;
      });
    },
    joinRoom(id) {
      this.connect();
      this.isHost = false;
      this.socket.emit('room:join', { roomId: id });
      this.roomId = id;
    },
    sendAction(action) {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('game:action', { roomId: this.roomId, action });
    },
    listenState(callback) {
      if (!this.socket) return;
      this.socket.on('game:state', (payload) => {
        const data = hydrateState(payload);
        if (data) callback(data);
      });
    }
  }
});
