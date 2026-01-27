import { randomUUID } from 'crypto';

const RANKED_MODE = '1v1';
const RANGE_STEPS = [
  { seconds: 10, range: 100 },
  { seconds: 20, range: 200 },
  { seconds: 30, range: 300 }
];
const MAX_RANGE = 400;

const getRangeForWait = (waitMs) => {
  const waitSeconds = waitMs / 1000;
  const step = RANGE_STEPS.find((entry) => waitSeconds <= entry.seconds);
  return step?.range ?? MAX_RANGE;
};

const sortByJoinedAt = (a, b) => a.joinedAt - b.joinedAt;

export class RankedMatchmakingService {
  constructor({ io, pool, createRoom }) {
    this.io = io;
    this.pool = pool;
    this.createRoom = createRoom;
    this.queue = [];
    this.queueBySocket = new Map();
    this.matchInterval = null;
  }

  start() {
    if (this.matchInterval) return;
    this.matchInterval = setInterval(() => {
      this.matchAll().catch((error) => {
        console.error('Ranked matchmaking tick failed:', error);
      });
    }, 1000);
  }

  stop() {
    if (this.matchInterval) {
      clearInterval(this.matchInterval);
      this.matchInterval = null;
    }
  }

  async enqueue(socket, { playerName, userId }) {
    if (!socket) return;
    console.info('Ranked enqueue requested', {
      socketId: socket.id,
      playerName,
      userId,
      roomId: socket.roomId ?? null
    });
    if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
      console.warn('Ranked enqueue rejected: missing playerName', { socketId: socket.id, userId });
      socket.emit('ranked:error', { message: 'Nom de joueur requis.' });
      return;
    }
    if (!userId || typeof userId !== 'string') {
      console.warn('Ranked enqueue rejected: missing userId', { socketId: socket.id, playerName });
      socket.emit('ranked:error', { message: 'Connexion requise pour jouer en classé.' });
      return;
    }
    if (socket.roomId) {
      console.warn('Ranked enqueue rejected: already in room', { socketId: socket.id, roomId: socket.roomId });
      socket.emit('ranked:error', { message: 'Vous êtes déjà dans une partie.' });
      return;
    }
    if (this.queueBySocket.has(socket.id)) {
      console.warn('Ranked enqueue rejected: already queued', { socketId: socket.id, userId });
      socket.emit('ranked:error', { message: 'Recherche classée déjà active.' });
      return;
    }
    if ([...this.queueBySocket.values()].some((entry) => entry.userId === userId)) {
      console.warn('Ranked enqueue rejected: user already queued elsewhere', { socketId: socket.id, userId });
      socket.emit('ranked:error', { message: 'Recherche classée déjà active sur un autre appareil.' });
      return;
    }

    const client = await this.pool.connect();
    try {
      console.info('Ranked enqueue: ensuring elo entry', { socketId: socket.id, userId, mode: RANKED_MODE });
      const eloResult = await client.query(
        `INSERT INTO user_elo (user_id, mode, elo, games_played, wins, losses, updated_at)
         VALUES ($1, $2, 1000, 0, 0, 0, NOW())
         ON CONFLICT (user_id, mode) DO UPDATE SET updated_at = user_elo.updated_at
         RETURNING elo`,
        [userId, RANKED_MODE]
      );
      const elo = Number.parseInt(eloResult.rows[0]?.elo ?? 1000, 10);
      const entry = {
        socketId: socket.id,
        userId,
        playerName: playerName.trim(),
        elo,
        joinedAt: Date.now()
      };
      this.queue.push(entry);
      this.queueBySocket.set(socket.id, entry);
      console.info('Ranked enqueue: added to queue', {
        socketId: socket.id,
        userId,
        elo,
        queueSize: this.queue.length
      });
      this.emitQueueStatus(socket.id);
    } catch (error) {
      console.error('Ranked enqueue failed during DB work', {
        socketId: socket.id,
        userId,
        message: error?.message,
        code: error?.code
      });
      throw error;
    } finally {
      client.release();
    }

    await this.matchAll();
  }

  leave(socketId) {
    const entry = this.queueBySocket.get(socketId);
    if (!entry) return;
    this.queueBySocket.delete(socketId);
    this.queue = this.queue.filter((queued) => queued.socketId !== socketId);
    console.info('Ranked leave: removed from queue', {
      socketId,
      userId: entry.userId,
      queueSize: this.queue.length
    });
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('ranked:cancelled');
    }
  }

  emitQueueStatus(socketId) {
    const entry = this.queueBySocket.get(socketId);
    if (!entry) return;
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) return;
    const sorted = [...this.queue].sort(sortByJoinedAt);
    const position = sorted.findIndex((item) => item.socketId === socketId) + 1;
    const waitMs = Date.now() - entry.joinedAt;
    const range = getRangeForWait(waitMs);
    socket.emit('ranked:queueStatus', {
      position,
      waitSeconds: Math.floor(waitMs / 1000),
      range
    });
    console.debug('Ranked queue status emitted', {
      socketId,
      userId: entry.userId,
      position,
      waitSeconds: Math.floor(waitMs / 1000),
      range,
      queueSize: this.queue.length
    });
  }

  async matchAll() {
    console.debug('Ranked match tick', { queueSize: this.queue.length });
    this.queue.forEach((entry) => this.emitQueueStatus(entry.socketId));
    if (this.queue.length < 2) return;
    let matched = true;
    while (matched) {
      matched = false;
      if (this.queue.length < 2) return;
      const now = Date.now();
      const entries = [...this.queue];
      let bestPair = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (let i = 0; i < entries.length; i += 1) {
        const first = entries[i];
        const rangeA = getRangeForWait(now - first.joinedAt);
        for (let j = i + 1; j < entries.length; j += 1) {
          const second = entries[j];
          const rangeB = getRangeForWait(now - second.joinedAt);
          const diff = Math.abs(first.elo - second.elo);
          if (diff <= rangeA && diff <= rangeB) {
            const score = diff;
            if (score < bestScore) {
              bestScore = score;
              bestPair = [first, second];
            }
          }
        }
      }

      if (bestPair) {
        matched = true;
        const [first, second] = bestPair;
        console.info('Ranked match pair found', {
          first: { socketId: first.socketId, userId: first.userId, elo: first.elo },
          second: { socketId: second.socketId, userId: second.userId, elo: second.elo },
          score: bestScore
        });
        this.queue = this.queue.filter(
          (entry) => entry.socketId !== first.socketId && entry.socketId !== second.socketId
        );
        this.queueBySocket.delete(first.socketId);
        this.queueBySocket.delete(second.socketId);
        await this.createRankedMatch(first, second);
      }
    }
  }

  async createRankedMatch(entryA, entryB) {
    const hostSocket = this.io.sockets.sockets.get(entryA.socketId);
    const guestSocket = this.io.sockets.sockets.get(entryB.socketId);
    if (!hostSocket || !guestSocket) {
      console.warn('Ranked match aborted: missing sockets', {
        hostSocketId: entryA.socketId,
        guestSocketId: entryB.socketId,
        hasHostSocket: Boolean(hostSocket),
        hasGuestSocket: Boolean(guestSocket)
      });
      if (hostSocket) this.enqueue(hostSocket, { playerName: entryA.playerName, userId: entryA.userId });
      if (guestSocket) this.enqueue(guestSocket, { playerName: entryB.playerName, userId: entryB.userId });
      return;
    }

    const matchId = randomUUID();
    const client = await this.pool.connect();
    try {
      console.info('Ranked match create: inserting history', {
        matchId,
        hostUserId: entryA.userId,
        guestUserId: entryB.userId
      });
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO match_history (id, mode, victory_type, bot_level, rounds_played, winner_id, is_ranked)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [matchId, RANKED_MODE, null, null, null, null, true]
      );
      const participantsValues = [
        [entryA.userId, entryA.elo],
        [entryB.userId, entryB.elo]
      ];
      const values = [];
      const placeholders = participantsValues
        .map(([userId, elo], index) => {
          const baseIndex = index * 14;
          values.push(
            randomUUID(),
            matchId,
            userId,
            0,
            0,
            0,
            0,
            0,
            false,
            elo,
            null,
            null,
            null,
            null
          );
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14})`;
        })
        .join(', ');

      await client.query(
        `INSERT INTO match_participants
         (id, match_id, user_id, rank, final_hp, shots_fired, shots_taken, items_used, is_bot, elo_before, elo_after, elo_delta, expected_score, k_factor)
         VALUES ${placeholders}`,
        values
      );
      await client.query('COMMIT');
      console.info('Ranked match create: database committed', {
        matchId,
        participantCount: participantsValues.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to create ranked match history:', {
        matchId,
        hostUserId: entryA.userId,
        guestUserId: entryB.userId,
        message: error?.message,
        code: error?.code,
        detail: error?.detail
      });
      hostSocket.emit('ranked:error', { message: 'Erreur lors de la création du match classé.' });
      guestSocket.emit('ranked:error', { message: 'Erreur lors de la création du match classé.' });
      return;
    } finally {
      client.release();
    }

    this.createRoom(hostSocket, guestSocket, { matchId, isRanked: true });
    console.info('Ranked match created: room created', {
      matchId,
      hostSocketId: entryA.socketId,
      guestSocketId: entryB.socketId
    });

    hostSocket.emit('ranked:matchFound', {
      matchId,
      opponent: {
        id: entryB.userId,
        username: entryB.playerName,
        elo: entryB.elo
      },
      self: {
        id: entryA.userId,
        username: entryA.playerName,
        elo: entryA.elo
      }
    });
    guestSocket.emit('ranked:matchFound', {
      matchId,
      opponent: {
        id: entryA.userId,
        username: entryA.playerName,
        elo: entryA.elo
      },
      self: {
        id: entryB.userId,
        username: entryB.playerName,
        elo: entryB.elo
      }
    });
  }
}
