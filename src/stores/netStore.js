import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { Notify } from 'quasar';

const notifyDeparture = (message) => {
  if (!message) return;
  Notify.create({
    message,
    color: 'negative',
    position: 'top',
    timeout: 3500,
    icon: 'logout'
  });
};

export const useNetStore = defineStore('net', {
  state: () => ({
    socket: null,
    socketId: null,
    connected: false,
    connecting: false,
    roomId: null,
    isHost: false,
    hostName: null,
    playerName: null,
    userId: null,
    roomPlayers: [],
    opponentLeft: null,
    roomReady: false,
    gameEnded: false,
    error: null,
    lastPing: null,
    lobbyChatMessages: []
  }),

  getters: {
    isInRoom: (state) => !!state.roomId,
    canStartGame: (state) => state.roomReady && state.isHost && !state.gameEnded,
    opponentConnected: (state) => state.roomPlayers.length > 1,
    otherPlayers: (state) => state.roomPlayers.filter((player) => player.id !== state.socketId)
  },

  actions: {
    connect() {
      if (this.socket?.connected) return Promise.resolve();
      if (this.connecting) return Promise.resolve();

      this.connecting = true;
      this.error = null;

      return new Promise((resolve, reject) => {
        // Connect to server
        const serverUrl = `http://${window.location.hostname}:3001`;
        console.log('🔌 Connecting to server at:', serverUrl);
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to server');
          this.connected = true;
          this.connecting = false;
          this.socketId = this.socket.id;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected:', reason);
          this.connected = false;
          this.socketId = null;
          this.roomReady = false;
          this.roomPlayers = [];
          this.lobbyChatMessages = [];
        });

        this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err.message);
          this.connecting = false;
          this.error = 'Impossible de se connecter au serveur';
          reject(err);
        });

        // Room events
        this.socket.on('room:created', ({ roomId, isHost, hostName, players }) => {
          console.log('🏠 Room created:', roomId);
          this.roomId = roomId;
          this.isHost = isHost;
          this.hostName = hostName || this.playerName;
          this.roomPlayers = players || [];
          this.error = null;
          this.gameEnded = false;
          this.lobbyChatMessages = [];
          if (this.playerName) {
            this.addLobbyMessage({
              type: 'system',
              name: this.playerName,
              text: `${this.playerName} a rejoint la room.`
            });
          }
        });

        this.socket.on('room:joined', ({ roomId, isHost, hostName, players }) => {
          console.log('👥 Joined room:', roomId);
          this.roomId = roomId;
          this.isHost = isHost;
          this.hostName = hostName;
          this.roomPlayers = players || [];
          this.error = null;
          this.gameEnded = false;
          this.lobbyChatMessages = [];
          if (this.playerName) {
            this.addLobbyMessage({
              type: 'system',
              name: this.playerName,
              text: `${this.playerName} a rejoint la room.`
            });
          }
        });

        this.socket.on('room:error', ({ message }) => {
          console.error('Room error:', message);
          this.error = message;
        });

        this.socket.on('room:player-joined', ({ playerId, playerName, players }) => {
          console.log('👋 Player joined:', playerName, playerId);
          this.roomPlayers = players || this.roomPlayers;
          if (playerName) {
            this.addLobbyMessage({
              type: 'system',
              name: playerName,
              playerId,
              text: `${playerName} a rejoint la room.`
            });
          }
        });

        this.socket.on('room:ready', ({ hostName, players }) => {
          console.log('🎮 Room ready! Host:', hostName);
          this.roomReady = true;
          this.hostName = hostName;
          this.roomPlayers = players || this.roomPlayers;
        });

        this.socket.on('room:player-left', ({ playerId, playerName, wasHost, players }) => {
          console.log('👋 Player left:', playerName || playerId);
          this.roomPlayers = this.roomPlayers.filter((player) => player.id !== playerId);
          if (players) {
            this.roomPlayers = players;
          }
          this.roomReady = false;
          this.opponentLeft = {
            playerId,
            playerName,
            wasHost
          };
          if (playerName) {
            this.addLobbyMessage({
              type: 'system',
              name: playerName,
              playerId,
              text: `${playerName} a quitté la room.`
            });
          }
          if (wasHost) {
            this.error = "L'hôte a quitté la partie";
            notifyDeparture("L'hôte a quitté la partie.");
          } else {
            this.error = "L'adversaire a quitté la room";
            notifyDeparture(`${playerName || 'Un joueur'} a quitté la partie.`);
          }
        });

        this.socket.on('room:host-left', ({ message }) => {
          console.log('🚪 Host left:', message);
          this.roomReady = false;
          this.gameEnded = true;
          this.opponentLeft = { wasHost: true, message };
          this.error = message;
          notifyDeparture(message || "L'hôte a quitté la partie.");
        });

        this.socket.on('room:guest-left', ({ message }) => {
          console.log('🚪 Guest left:', message);
          this.roomReady = false;
          this.opponentLeft = { wasHost: false, message };
          this.error = message;
          notifyDeparture(message || "Un joueur a quitté la partie.");
        });

        this.socket.on('room:game-ended', ({ roomId }) => {
          console.log('🏁 Game ended in room:', roomId);
          this.gameEnded = true;
        });

        this.socket.on('room:promoted-host', ({ hostName, players }) => {
          console.log('👑 You are now the host');
          this.isHost = true;
          this.hostName = hostName || this.playerName;
          this.roomPlayers = players || this.roomPlayers;
          this.roomReady = false;
        });

        this.socket.on('room:kicked', ({ message }) => {
          this.error = message || "Vous avez été éjecté.";
          this.roomId = null;
          this.isHost = false;
          this.roomPlayers = [];
          this.roomReady = false;
          this.lobbyChatMessages = [];
        });

        this.socket.on('room:chat', ({ playerId, playerName, userId, message, timestamp }) => {
          if (!message || !playerName) return;
          this.addLobbyMessage({
            type: 'chat',
            name: playerName,
            text: message,
            playerId,
            userId,
            timestamp,
            isSelf: playerId === this.socketId
          });
        });

        this.socket.on('pong', ({ time }) => {
          this.lastPing = Date.now() - time;
        });

        // Timeout
        setTimeout(() => {
          if (this.connecting) {
            this.connecting = false;
            this.error = '⏳ Connexion au serveur impossible. Vérifiez votre connexion internet.';
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    },

    async createRoom() {
      if (!this.playerName) {
        this.error = 'Nom de joueur requis';
        return;
      }
      
      try {
        await this.connect();
        this.socket.emit('room:create', { playerName: this.playerName, userId: this.userId });
        this.isHost = true;
        this.hostName = this.playerName;
        this.roomPlayers = [];
      } catch (err) {
        this.error = err.message;
      }
    },

    async joinRoom(roomId) {
      if (!roomId || roomId.length < 4) {
        this.error = 'Code de room invalide';
        return;
      }
      
      if (!this.playerName) {
        this.error = 'Nom de joueur requis';
        return;
      }

      try {
        await this.connect();
        this.socket.emit('room:join', { 
          roomId: roomId.toUpperCase(),
          playerName: this.playerName,
          userId: this.userId
        });
        this.isHost = false;
        this.roomPlayers = [];
      } catch (err) {
        this.error = err.message;
      }
    },

    kickPlayer(playerId) {
      if (!this.socket || !this.roomId || !this.isHost) return;
      this.socket.emit('room:kick', { roomId: this.roomId, playerId });
    },

    // Send an action to all players
    sendAction(action) {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('game:action', { roomId: this.roomId, action });
    },

    sendLobbyChat(message) {
      if (!this.socket || !this.roomId) return;
      const trimmed = message?.trim();
      if (!trimmed) return;
      this.socket.emit('room:chat', { roomId: this.roomId, message: trimmed });
    },

    // Host sends game state to sync
    syncState(gameState) {
      if (!this.socket || !this.roomId || !this.isHost) return;
      this.socket.emit('game:sync', { roomId: this.roomId, gameState });
    },

    // Host starts the game
    startGame(gameState) {
      if (!this.socket || !this.roomId || !this.isHost) {
        console.error('❌ Cannot start game:', {
          hasSocket: !!this.socket,
          roomId: this.roomId,
          isHost: this.isHost
        });
        return;
      }
      console.log('📤 Host emitting game:start for room', this.roomId);
      this.socket.emit('game:start', { roomId: this.roomId, gameState });
    },

    // Notify server game ended
    endGame() {
      if (!this.socket || !this.roomId) return;
      this.socket.emit('game:end', { roomId: this.roomId });
      this.gameEnded = true;
    },

    // Listen for game state updates (for guest)
    onGameState(callback) {
      if (!this.socket) return;
      // Remove any existing listeners first to avoid duplicates
      this.socket.off('game:state');
      this.socket.on('game:state', callback);
      console.log('✅ game:state listener added');
    },

    // Listen for actions
    onGameAction(callback) {
      if (!this.socket) return;
      // Remove any existing listeners first to avoid duplicates
      this.socket.off('game:action');
      this.socket.on('game:action', callback);
      console.log('✅ game:action listener added');
    },

    // Listen for opponent leaving
    onOpponentLeft(callback) {
      if (!this.socket) return;
      this.socket.off('room:player-left');
      this.socket.off('room:host-left');
      this.socket.off('room:guest-left');
      
      this.socket.on('room:player-left', callback);
      this.socket.on('room:host-left', callback);
      this.socket.on('room:guest-left', callback);
    },

    // Remove listeners
    offGameState() {
      if (this.socket) {
        this.socket.off('game:state');
        console.log('❌ game:state listener removed');
      }
    },

    offGameAction() {
      if (this.socket) {
        this.socket.off('game:action');
        console.log('❌ game:action listener removed');
      }
    },

    // Ping server
    ping() {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    },

    // Leave room properly (notify server)
    leaveRoom() {
      if (this.socket) {
        if (this.roomId) {
          this.socket.emit('room:leave');
        }
        this.socket.disconnect();
      }
      this.socket = null;
      this.socketId = null;
      this.connected = false;
      this.roomId = null;
      this.isHost = false;
      this.hostName = null;
      this.roomPlayers = [];
      this.opponentLeft = null;
      this.roomReady = false;
      this.gameEnded = false;
      this.error = null;
      this.lobbyChatMessages = [];
    },

    // Clear error
    clearError() {
      this.error = null;
    },

    clearOpponentLeft() {
      this.opponentLeft = null;
    },

    addLobbyMessage(payload) {
      if (!payload?.text) return;
      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: payload.type || 'chat',
        name: payload.name || 'Système',
        text: payload.text,
        playerId: payload.playerId || null,
        userId: payload.userId || null,
        timestamp: payload.timestamp || Date.now(),
        isSelf: payload.isSelf || false
      };
      const next = [...this.lobbyChatMessages, entry];
      this.lobbyChatMessages = next.slice(-120);
    }
  }
});
