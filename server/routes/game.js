import { randomUUID } from 'crypto';
import { pool } from '../db.js';

const MAX_HISTORY_LIMIT = 50;
const DEFAULT_HISTORY_LIMIT = 20;
const MULTIPLAYER_MODES = new Set(['1v1', '1v1v1']);
const BOT_DIFFICULTY_TO_DB = {
  peasant: 'Paysan',
  prince: 'Prince',
  tsar: 'Tsar',
  emperor: 'Empereur'
};
const BOT_DIFFICULTY_FROM_DB = {
  paysan: 'peasant',
  prince: 'prince',
  tsar: 'tsar',
  empereur: 'emperor'
};

const normalizeDifficultyInput = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const key = value.toLowerCase();
  return BOT_DIFFICULTY_TO_DB[key] || value;
};

const normalizeDifficultyOutput = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const key = value.toLowerCase();
  return BOT_DIFFICULTY_FROM_DB[key] || value;
};

const toOptionalInt = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const ensureUserStats = async (client, userId) => {
  await client.query(
    'INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  );
};

const getEloDelta = (mode, rank) => {
  if (mode === '1v1') {
    return rank === 1 ? 15 : -15;
  }
  if (mode === '1v1v1') {
    if (rank === 1) return 20;
    if (rank === 2) return 5;
    return -15;
  }
  return 0;
};

const normalizeParticipants = ({
  participants,
  fallbackUserId,
  fallbackRank
}) => {
  const list = Array.isArray(participants) ? participants : [];
  if (list.length === 0) {
    return [
      {
        userId: fallbackUserId,
        rank: fallbackRank,
        finalHp: null,
        shotsFired: null,
        itemsUsed: null,
        isBot: false
      }
    ];
  }
  return list.map((participant) => ({
    userId: participant?.isBot ? null : (participant?.userId || fallbackUserId),
    rank: participant?.rank,
    finalHp: participant?.finalHp ?? null,
    shotsFired: participant?.shotsFired ?? null,
    itemsUsed: participant?.itemsUsed ?? null,
    isBot: Boolean(participant?.isBot)
  }));
};

const insertParticipants = async (client, matchId, participants) => {
  const values = [];
  const placeholders = participants.map((participant, index) => {
    const baseIndex = index * 8;
    values.push(
      randomUUID(),
      matchId,
      participant.isBot ? null : participant.userId,
      participant.rank,
      participant.finalHp,
      participant.shotsFired,
      participant.itemsUsed,
      participant.isBot
    );
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`;
  });

  if (placeholders.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO match_participants (id, match_id, user_id, rank, final_hp, shots_fired, items_used, is_bot)
     VALUES ${placeholders.join(', ')}`,
    values
  );
};

export default async function gameRoutes(fastify) {
  fastify.post('/matches/solo', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const {
      victoryType,
      botLevel,
      roundsPlayed,
      participants,
      difficulty,
      isDefeated,
      winnerId,
      finalHp,
      shotsFired,
      itemsUsed
    } = request.body || {};
    const normalizedBotLevel = normalizeDifficultyInput(botLevel);
    const normalizedDifficulty = normalizeDifficultyInput(difficulty);

    if (!victoryType || typeof victoryType !== 'string') {
      return reply.code(400).send({ error: 'Type de victoire requis.' });
    }

    const userId = request.user.userId;
    const resolvedParticipants = normalizeParticipants({
      participants: Array.isArray(participants) && participants.length > 0
        ? participants
        : [
            {
              userId,
              rank: winnerId && winnerId !== userId ? 2 : 1,
              finalHp,
              shotsFired,
              itemsUsed,
              isBot: false
            }
          ],
      fallbackUserId: userId,
      fallbackRank: 1
    }).map((participant) => ({
      ...participant,
      rank: toOptionalInt(participant.rank)
    }));

    if (resolvedParticipants.some((participant) => !participant.rank)) {
      return reply.code(400).send({ error: 'Classement invalide.' });
    }

    const userParticipant = resolvedParticipants.find(
      (participant) => !participant.isBot && participant.userId === userId
    );
    if (!userParticipant) {
      return reply.code(400).send({ error: 'Participant utilisateur manquant.' });
    }
    const resolvedWinnerId =
      winnerId ||
      resolvedParticipants.find(
        (participant) => !participant.isBot && participant.rank === 1
      )?.userId ||
      null;

    const matchId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO match_history (id, mode, victory_type, bot_level, rounds_played, winner_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          matchId,
          'solo',
          victoryType,
          normalizedBotLevel || null,
          toOptionalInt(roundsPlayed),
          resolvedWinnerId
        ]
      );

      const normalizedParticipants = resolvedParticipants.map((participant) => ({
        ...participant,
        finalHp: toOptionalInt(participant.finalHp),
        shotsFired: toOptionalInt(participant.shotsFired, 0),
        itemsUsed: toOptionalInt(participant.itemsUsed, 0)
      }));

      await insertParticipants(client, matchId, normalizedParticipants);

      if (userParticipant) {
        await ensureUserStats(client, userId);
        await client.query(
          `UPDATE user_stats
           SET total_shots_fired = total_shots_fired + $1,
               items_used_count = items_used_count + $2
           WHERE user_id = $3`,
          [
            toOptionalInt(userParticipant.shotsFired, 0),
            toOptionalInt(userParticipant.itemsUsed, 0),
            userId
          ]
        );
      }

      if (normalizedDifficulty) {
        const defeated = typeof isDefeated === 'boolean'
          ? isDefeated
          : userParticipant
            ? userParticipant.rank !== 1
            : resolvedWinnerId && resolvedWinnerId !== userId;

        const progressResult = await client.query(
          'SELECT id FROM solo_progress WHERE user_id = $1 AND difficulty = $2 LIMIT 1',
          [userId, normalizedDifficulty]
        );
        if (progressResult.rowCount > 0) {
          await client.query(
            'UPDATE solo_progress SET is_defeated = $1 WHERE id = $2',
            [defeated, progressResult.rows[0].id]
          );
        } else {
          await client.query(
            'INSERT INTO solo_progress (id, user_id, difficulty, is_defeated) VALUES ($1, $2, $3, $4)',
            [randomUUID(), userId, normalizedDifficulty, defeated]
          );
        }
      }

      await client.query('COMMIT');
      return reply.code(201).send({ matchId });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la sauvegarde du match.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/matches/multiplayer', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { mode, victoryType, roundsPlayed, participants, winnerId } = request.body || {};

    if (!mode || !MULTIPLAYER_MODES.has(mode)) {
      return reply.code(400).send({ error: 'Mode multijoueur invalide.' });
    }
    if (!victoryType || typeof victoryType !== 'string') {
      return reply.code(400).send({ error: 'Type de victoire requis.' });
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      return reply.code(400).send({ error: 'Participants requis.' });
    }

    const normalizedParticipants = participants.map((participant) => ({
      userId: participant?.userId,
      rank: toOptionalInt(participant?.rank),
      finalHp: toOptionalInt(participant?.finalHp),
      shotsFired: toOptionalInt(participant?.shotsFired, 0),
      itemsUsed: toOptionalInt(participant?.itemsUsed, 0),
      isBot: Boolean(participant?.isBot)
    }));

    if (normalizedParticipants.some((participant) => participant.isBot)) {
      return reply.code(400).send({ error: 'Participants bots non autorisés en multijoueur.' });
    }
    if (normalizedParticipants.some((participant) => !participant.userId)) {
      return reply.code(400).send({ error: 'Identifiants participants requis.' });
    }
    if (normalizedParticipants.some((participant) => !participant.rank)) {
      return reply.code(400).send({ error: 'Participants invalides.' });
    }

    const derivedWinnerId =
      winnerId ||
      normalizedParticipants.find((participant) => participant.rank === 1)?.userId ||
      null;

    const matchId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO match_history (id, mode, victory_type, bot_level, rounds_played, winner_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          matchId,
          mode,
          victoryType,
          null,
          toOptionalInt(roundsPlayed),
          derivedWinnerId
        ]
      );

      await insertParticipants(client, matchId, normalizedParticipants);

      for (const participant of normalizedParticipants) {
        await ensureUserStats(client, participant.userId);
        const winIncrement = participant.rank === 1 ? 1 : 0;
        const lossIncrement = participant.rank === 1 ? 0 : 1;
        const wins1v1v1Increment = mode === '1v1v1' && participant.rank === 1 ? 1 : 0;
        const top2Increment = mode === '1v1v1' && participant.rank <= 2 ? 1 : 0;
        const eloDelta = getEloDelta(mode, participant.rank);

        await client.query(
          `UPDATE user_stats
           SET total_wins_online = total_wins_online + $1,
               total_losses_online = total_losses_online + $2,
               total_shots_fired = total_shots_fired + $3,
               items_used_count = items_used_count + $4,
               wins_1v1v1 = wins_1v1v1 + $5,
               top2_1v1v1 = top2_1v1v1 + $6,
               elo_rating = GREATEST(0, elo_rating + $7)
           WHERE user_id = $8`,
          [
            winIncrement,
            lossIncrement,
            participant.shotsFired,
            participant.itemsUsed,
            wins1v1v1Increment,
            top2Increment,
            eloDelta,
            participant.userId
          ]
        );
      }

      await client.query('COMMIT');
      return reply.code(201).send({ matchId });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la sauvegarde du match.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/matches/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { mode, limit } = request.query || {};
    const userId = request.user.userId;
    const resolvedLimit = Math.min(
      Math.max(toOptionalInt(limit, DEFAULT_HISTORY_LIMIT), 1),
      MAX_HISTORY_LIMIT
    );

    const filters = ['mp.user_id = $1'];
    const values = [userId];
    if (mode) {
      filters.push(`mh.mode = $${values.length + 1}`);
      values.push(mode);
    }

    const client = await pool.connect();
    try {
      const matchesResult = await client.query(
        `SELECT mh.*
         FROM match_history mh
         JOIN match_participants mp ON mp.match_id = mh.id
         WHERE ${filters.join(' AND ')}
         ORDER BY mh.created_at DESC
         LIMIT $${values.length + 1}`,
        [...values, resolvedLimit]
      );

      const matches = matchesResult.rows;
      if (matches.length === 0) {
        return reply.send({ matches: [] });
      }

      const matchIds = matches.map((match) => match.id);
      const participantsResult = await client.query(
        'SELECT * FROM match_participants WHERE match_id = ANY($1::uuid[]) ORDER BY rank ASC',
        [matchIds]
      );

      const participantsByMatch = new Map();
      for (const participant of participantsResult.rows) {
        const list = participantsByMatch.get(participant.match_id) || [];
        list.push({
          id: participant.id,
          userId: participant.user_id,
          rank: participant.rank,
          finalHp: participant.final_hp,
          shotsFired: participant.shots_fired,
          itemsUsed: participant.items_used,
          isBot: participant.is_bot
        });
        participantsByMatch.set(participant.match_id, list);
      }

      const payload = matches.map((match) => ({
        id: match.id,
        mode: match.mode,
        victoryType: match.victory_type,
        botLevel: normalizeDifficultyOutput(match.bot_level),
        roundsPlayed: match.rounds_played,
        createdAt: match.created_at,
        winnerId: match.winner_id,
        participants: participantsByMatch.get(match.id) || []
      }));

      return reply.send({ matches: payload });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la récupération des matchs.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/stats/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await ensureUserStats(client, userId);
      const statsResult = await client.query(
        'SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      return reply.send({ stats: statsResult.rows[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la récupération des stats.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/stats/user/:userId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.params || {};
    if (!userId) {
      return reply.code(400).send({ error: 'Identifiant utilisateur requis.' });
    }

    const client = await pool.connect();
    try {
      await ensureUserStats(client, userId);
      const statsResult = await client.query(
        'SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      if (!statsResult.rows[0]) {
        return reply.code(404).send({ error: 'Stats utilisateur introuvables.' });
      }
      return reply.send({ stats: statsResult.rows[0] });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la récupération des stats.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/solo/progress', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    try {
      const progressResult = await pool.query(
        'SELECT * FROM solo_progress WHERE user_id = $1 ORDER BY difficulty ASC',
        [userId]
      );
      const progress = progressResult.rows.map((row) => ({
        ...row,
        difficulty: normalizeDifficultyOutput(row.difficulty)
      }));
      return reply.send({ progress });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la récupération du solo.' });
    }
  });
}
