import { randomUUID } from 'crypto';
import { pool } from '../db.js';

const MAX_HISTORY_LIMIT = 50;
const DEFAULT_HISTORY_LIMIT = 20;
const LEADERBOARD_LIMIT = 10;
const MULTIPLAYER_MODES = new Set(['1v1', '1v1v1']);
const MODE_STAT_KEYS = ['solo', '1v1', '1v1v1'];
const BOT_WIN_REWARDS = {
  paysan: 2,
  prince: 5,
  tsar: 10,
  empereur: 15
};
const MULTIPLAYER_WIN_REWARDS = {
  '1v1': {
    1: 10,
    2: 0
  },
  '1v1v1': {
    1: 15,
    2: 7,
    3: 0
  }
};
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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const resolveReward = (baseReward, victoryType) => {
  if (!baseReward || baseReward <= 0) return 0;
  if (victoryType === 'abandon') {
    return Math.floor(baseReward / 4);
  }
  return baseReward;
};

const getBotReward = (difficulty) => {
  if (!difficulty) return 0;
  const key = String(difficulty).toLowerCase();
  return BOT_WIN_REWARDS[key] || 0;
};

const getMultiplayerReward = (mode, rank) => {
  return MULTIPLAYER_WIN_REWARDS[mode]?.[rank] || 0;
};

const ensureUserStats = async (client, userId) => {
  await client.query(
    'INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  );
};

const ensureUserModeStats = async (client, userId, mode) => {
  await client.query(
    'INSERT INTO user_mode_stats (user_id, mode) VALUES ($1, $2) ON CONFLICT (user_id, mode) DO NOTHING',
    [userId, mode]
  );
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
        shotsTaken: null,
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
    shotsTaken: participant?.shotsTaken ?? null,
    itemsUsed: participant?.itemsUsed ?? null,
    isBot: Boolean(participant?.isBot)
  }));
};

const insertParticipants = async (client, matchId, participants) => {
  const values = [];
  const placeholders = participants.map((participant, index) => {
    const baseIndex = index * 14;
    values.push(
      randomUUID(),
      matchId,
      participant.isBot ? null : participant.userId,
      participant.rank,
      participant.finalHp,
      participant.shotsFired,
      participant.shotsTaken,
      participant.itemsUsed,
      participant.isBot,
      participant.eloBefore ?? null,
      participant.eloAfter ?? null,
      participant.eloDelta ?? null,
      participant.expectedScore ?? null,
      participant.kFactor ?? null
    );
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14})`;
  });

  if (placeholders.length === 0) {
    return;
  }

  await client.query(
    `INSERT INTO match_participants (
       id,
       match_id,
       user_id,
       rank,
       final_hp,
       shots_fired,
       shots_taken,
       items_used,
       is_bot,
       elo_before,
       elo_after,
       elo_delta,
       expected_score,
       k_factor
     )
     VALUES ${placeholders.join(', ')}`,
    values
  );
};

const ensureUserElo = async (client, userId, mode) => {
  const result = await client.query(
    `INSERT INTO user_elo (user_id, mode, elo, games_played, wins, losses, updated_at)
     VALUES ($1, $2, 1000, 0, 0, 0, NOW())
     ON CONFLICT (user_id, mode) DO UPDATE SET updated_at = user_elo.updated_at
     RETURNING elo, games_played, wins, losses`,
    [userId, mode]
  );
  return result.rows[0];
};

const calculateExpectedScore = (eloPlayer, eloOpponent) =>
  1 / (1 + 10 ** ((eloOpponent - eloPlayer) / 400));

const updateWinStreak = async (client, userId, isWin) => {
  if (!isWin) return;

  // Find the date of the last non-win (rank > 1)
  const lastLossResult = await client.query(
    `SELECT mh.created_at
     FROM match_history mh
     JOIN match_participants mp ON mp.match_id = mh.id
     WHERE mp.user_id = $1 AND mp.rank > 1
     ORDER BY mh.created_at DESC
     LIMIT 1`,
    [userId]
  );

  const lastLossDate = lastLossResult.rows[0]?.created_at || null;

  // Count wins since the last loss
  const streakResult = await client.query(
    `SELECT COUNT(*) as streak
     FROM match_history mh
     JOIN match_participants mp ON mp.match_id = mh.id
     WHERE mp.user_id = $1 AND mp.rank = 1
       AND ($2::timestamptz IS NULL OR mh.created_at > $2::timestamptz)`,
    [userId, lastLossDate]
  );

  // Current match (which we just inserted) + previous consecutive wins
  // Wait, if we call this AFTER inserting the current match (which is a win),
  // then the query above ALREADY includes the current match because created_at > lastLossDate.
  // We need to valid verify transaction visibility. We are in the same transaction.
  // However, match_history uses DEFAULT current_timestamp for created_at if not provided?
  // No, the schema says created_at (timestamp with time zone). The INSERT query does NOT provide it, so it uses DEFAULT or NULL.
  // Wait, the INSERT query in routes/game.js does NOT list created_at. So it defaults to NOW().
  // So the current match IS in the table.
  // So streakResult includes the current match.

  const currentStreak = parseInt(streakResult.rows[0]?.streak || 0, 10);

  await client.query(
    `UPDATE user_stats
     SET highest_win_streak = GREATEST(highest_win_streak, $1)
     WHERE user_id = $2`,
    [currentStreak, userId]
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
        shotsTaken: toOptionalInt(participant.shotsTaken, 0),
        itemsUsed: toOptionalInt(participant.itemsUsed, 0)
      }));

      await insertParticipants(client, matchId, normalizedParticipants);

      if (userParticipant) {
        await ensureUserStats(client, userId);
        await ensureUserModeStats(client, userId, 'solo');
        await client.query(
          `UPDATE user_stats
           SET total_shots_fired = total_shots_fired + $1,
               total_shots_taken = total_shots_taken + $2,
               total_items_used = total_items_used + $3,
               total_games_played = total_games_played + 1
           WHERE user_id = $4`,
          [
            toOptionalInt(userParticipant.shotsFired, 0),
            toOptionalInt(userParticipant.shotsTaken, 0),
            toOptionalInt(userParticipant.itemsUsed, 0),
            userId
          ]
        );
        await client.query(
          `UPDATE user_mode_stats
           SET wins = wins + $1,
               losses = losses + $2,
               shots_fired = shots_fired + $3,
               shots_taken = shots_taken + $4,
               items_used = items_used + $5
           WHERE user_id = $6 AND mode = $7`,
          [
            userParticipant.rank === 1 ? 1 : 0,
            userParticipant.rank === 1 ? 0 : 1,
            toOptionalInt(userParticipant.shotsFired, 0),
            toOptionalInt(userParticipant.shotsTaken, 0),
            toOptionalInt(userParticipant.itemsUsed, 0),
            userId,
            'solo'
          ]
        );
        await updateWinStreak(client, userId, userParticipant.rank === 1);

        if (userParticipant.rank === 1) {
          const baseReward = getBotReward(normalizedBotLevel || normalizedDifficulty);
          const rewardCoins = resolveReward(baseReward, victoryType);
          if (rewardCoins > 0) {
            await client.query(
              'UPDATE user_stats SET coins = coins + $1 WHERE user_id = $2',
              [rewardCoins, userId]
            );
          }
        }
      }

      if (normalizedDifficulty) {
        const defeated = typeof isDefeated === 'boolean'
          ? isDefeated
          : userParticipant
            ? userParticipant.rank !== 1
            : resolvedWinnerId && resolvedWinnerId !== userId;
        const winIncrement = defeated ? 0 : 1;
        const lossIncrement = defeated ? 1 : 0;

        const progressResult = await client.query(
          'SELECT id FROM solo_progress WHERE user_id = $1 AND difficulty = $2 LIMIT 1',
          [userId, normalizedDifficulty]
        );
        if (progressResult.rowCount > 0) {
          await client.query(
            `UPDATE solo_progress
             SET is_defeated = $1,
                 times_defeated = times_defeated + $2,
                 times_lost = times_lost + $3
             WHERE id = $4`,
            [defeated, winIncrement, lossIncrement, progressResult.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO solo_progress
             (id, user_id, difficulty, is_defeated, times_defeated, times_lost)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), userId, normalizedDifficulty, defeated, winIncrement, lossIncrement]
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
    const { mode, victoryType, roundsPlayed, participants, winnerId, isRanked, matchId } = request.body || {};
    const userId = request.user.userId;
    const resolvedIsRanked = Boolean(isRanked || matchId);

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
      shotsTaken: toOptionalInt(participant?.shotsTaken, 0),
      itemsUsed: toOptionalInt(participant?.itemsUsed, 0),
      isBot: Boolean(participant?.isBot)
    }));

    if (normalizedParticipants.some((participant) => participant.isBot)) {
      return reply.code(400).send({ error: 'Participants bots non autorisés en multijoueur.' });
    }
    if (normalizedParticipants.some((participant) => !participant.rank)) {
      return reply.code(400).send({ error: 'Participants invalides.' });
    }
    if (resolvedIsRanked && normalizedParticipants.length !== 2) {
      return reply.code(400).send({ error: 'Le match classé doit être un duel 1v1.' });
    }
    if (!normalizedParticipants.some((participant) => participant.userId === userId)) {
      return reply.code(400).send({ error: 'Participant utilisateur manquant.' });
    }
    const userIds = [
      ...new Set(
        normalizedParticipants
          .map((participant) => participant.userId)
          .filter((id) => Boolean(id))
      )
    ];
    if (userIds.some((id) => !UUID_REGEX.test(id))) {
      return reply.code(400).send({ error: 'Identifiants participants invalides.' });
    }

    const derivedWinnerId =
      winnerId ||
      normalizedParticipants.find((participant) => participant.rank === 1)?.userId ||
      null;

    const resolvedMatchId = resolvedIsRanked ? matchId : randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (resolvedIsRanked) {
        if (mode !== '1v1') {
          await client.query('ROLLBACK');
          return reply.code(400).send({ error: 'Le classé est disponible uniquement en 1v1.' });
        }
        if (!resolvedMatchId || !UUID_REGEX.test(resolvedMatchId)) {
          await client.query('ROLLBACK');
          return reply.code(400).send({ error: 'Identifiant de match classé invalide.' });
        }
        const matchResult = await client.query(
          'SELECT id FROM match_history WHERE id = $1 AND is_ranked = true LIMIT 1',
          [resolvedMatchId]
        );
        if (!matchResult.rows[0]) {
          await client.query('ROLLBACK');
          return reply.code(404).send({ error: 'Match classé introuvable.' });
        }
      }

      if (userIds.length > 0) {
        const existingUsers = await client.query(
          'SELECT id FROM users WHERE id = ANY($1::uuid[])',
          [userIds]
        );
        if (existingUsers.rowCount !== userIds.length) {
          await client.query('ROLLBACK');
          return reply.code(400).send({ error: 'Identifiants participants invalides.' });
        }
      }

      if (resolvedIsRanked) {
        await client.query(
          `UPDATE match_history
           SET victory_type = $1,
               rounds_played = $2,
               winner_id = $3
           WHERE id = $4`,
          [victoryType, toOptionalInt(roundsPlayed), derivedWinnerId, resolvedMatchId]
        );
      } else {
        await client.query(
          `INSERT INTO match_history (id, mode, victory_type, bot_level, rounds_played, winner_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            resolvedMatchId,
            mode,
            victoryType,
            null,
            toOptionalInt(roundsPlayed),
            derivedWinnerId
          ]
        );

        await insertParticipants(client, resolvedMatchId, normalizedParticipants);
      }

      const eloChanges = [];

      if (resolvedIsRanked) {
        const participantIds = normalizedParticipants.map((participant) => participant.userId);
        for (const participantId of participantIds) {
          await ensureUserElo(client, participantId, mode);
        }
        const eloRowsResult = await client.query(
          `SELECT user_id, elo
           FROM user_elo
           WHERE user_id = ANY($1::uuid[]) AND mode = $2
           FOR UPDATE`,
          [participantIds, mode]
        );
        const eloByUser = new Map(
          eloRowsResult.rows.map((row) => [row.user_id, Number.parseInt(row.elo, 10)])
        );
        if (eloByUser.size !== normalizedParticipants.length) {
          await client.query('ROLLBACK');
          return reply.code(500).send({ error: 'Elo introuvable pour un participant.' });
        }

        const [first, second] = normalizedParticipants;
        const firstElo = eloByUser.get(first.userId);
        const secondElo = eloByUser.get(second.userId);
        const expectedFirst = calculateExpectedScore(firstElo, secondElo);
        const expectedSecond = calculateExpectedScore(secondElo, firstElo);
        const diff = Math.abs(firstElo - secondElo);
        const kFactor = 32;

        const computeDelta = (result, expected) => Math.round(kFactor * (result - expected));
        const clampDelta = (delta) => Math.max(-5, Math.min(5, delta));

        const firstResult = first.rank === 1 ? 1 : 0;
        const secondResult = second.rank === 1 ? 1 : 0;
        let firstDelta = computeDelta(firstResult, expectedFirst);
        let secondDelta = computeDelta(secondResult, expectedSecond);
        if (diff > 300) {
          firstDelta = clampDelta(firstDelta);
          secondDelta = clampDelta(secondDelta);
        }
        const firstAfter = firstElo + firstDelta;
        const secondAfter = secondElo + secondDelta;

        const updates = [
          {
            participant: first,
            eloBefore: firstElo,
            eloAfter: firstAfter,
            eloDelta: firstDelta,
            expectedScore: expectedFirst
          },
          {
            participant: second,
            eloBefore: secondElo,
            eloAfter: secondAfter,
            eloDelta: secondDelta,
            expectedScore: expectedSecond
          }
        ];

        for (const update of updates) {
          const winIncrement = update.participant.rank === 1 ? 1 : 0;
          const lossIncrement = update.participant.rank === 1 ? 0 : 1;
          await client.query(
            `UPDATE match_participants
             SET rank = $1,
                 final_hp = $2,
                 shots_fired = $3,
                 shots_taken = $4,
                 items_used = $5,
                 elo_before = $6,
                 elo_after = $7,
                 elo_delta = $8,
                 expected_score = $9,
                 k_factor = $10
             WHERE match_id = $11 AND user_id = $12`,
            [
              update.participant.rank,
              update.participant.finalHp,
              update.participant.shotsFired,
              update.participant.shotsTaken,
              update.participant.itemsUsed,
              update.eloBefore,
              update.eloAfter,
              update.eloDelta,
              update.expectedScore,
              kFactor,
              resolvedMatchId,
              update.participant.userId
            ]
          );
          await client.query(
            `UPDATE user_elo
             SET elo = $1,
                 games_played = games_played + 1,
                 wins = wins + $2,
                 losses = losses + $3,
                 updated_at = NOW()
             WHERE user_id = $4 AND mode = $5`,
            [update.eloAfter, winIncrement, lossIncrement, update.participant.userId, mode]
          );
          eloChanges.push({
            userId: update.participant.userId,
            eloBefore: update.eloBefore,
            eloAfter: update.eloAfter,
            eloDelta: update.eloDelta,
            expectedScore: update.expectedScore,
            kFactor
          });
        }
      }

      for (const participant of normalizedParticipants) {
        if (!participant.userId) {
          continue;
        }
        await ensureUserStats(client, participant.userId);
        await ensureUserModeStats(client, participant.userId, mode);
        const winIncrement = participant.rank === 1 ? 1 : 0;
        const lossIncrement = participant.rank === 1 ? 0 : 1;

        await client.query(
          `UPDATE user_stats
           SET total_shots_fired = total_shots_fired + $1,
               total_shots_taken = total_shots_taken + $2,
               total_items_used = total_items_used + $3,
               total_games_played = total_games_played + 1
           WHERE user_id = $4`,
          [
            participant.shotsFired,
            participant.shotsTaken,
            participant.itemsUsed,
            participant.userId
          ]
        );
        await client.query(
          `UPDATE user_mode_stats
           SET wins = wins + $1,
               losses = losses + $2,
               top2_finishes = top2_finishes + $3,
               shots_fired = shots_fired + $4,
               shots_taken = shots_taken + $5,
               items_used = items_used + $6
           WHERE user_id = $7 AND mode = $8`,
          [
            winIncrement,
            lossIncrement,
            mode === '1v1v1' && participant.rank <= 2 ? 1 : 0,
            participant.shotsFired,
            participant.shotsTaken,
            participant.itemsUsed,
            participant.userId,
            mode
          ]
        );
        await updateWinStreak(client, participant.userId, participant.rank === 1);

        const baseReward = getMultiplayerReward(mode, participant.rank);
        const rewardCoins = resolveReward(baseReward, victoryType);
        if (rewardCoins > 0) {
          await client.query(
            'UPDATE user_stats SET coins = coins + $1 WHERE user_id = $2',
            [rewardCoins, participant.userId]
          );
        }
      }

      await client.query('COMMIT');
      return reply.code(201).send({ matchId: resolvedMatchId, eloChanges: resolvedIsRanked ? eloChanges : null });
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
        `SELECT mp.*, u.username, u.id AS user_exists
         FROM match_participants mp
         LEFT JOIN users u ON u.id = mp.user_id
         WHERE mp.match_id = ANY($1::uuid[])
         ORDER BY mp.rank ASC`,
        [matchIds]
      );

      const participantsByMatch = new Map();
      for (const participant of participantsResult.rows) {
        const list = participantsByMatch.get(participant.match_id) || [];
        const hasUserId = Boolean(participant.user_id);
        const hasUserRecord = hasUserId && Boolean(participant.user_exists);
        const resolvedUsername = participant.is_bot
          ? null
          : hasUserRecord
            ? participant.username || 'Joueur'
            : 'Joueur';
        list.push({
          id: participant.id,
          userId: participant.user_id,
          username: resolvedUsername,
          rank: participant.rank,
          finalHp: participant.final_hp,
          shotsFired: participant.shots_fired,
          shotsTaken: participant.shots_taken,
          itemsUsed: participant.items_used,
          eloBefore: participant.elo_before,
          eloAfter: participant.elo_after,
          eloDelta: participant.elo_delta,
          expectedScore: participant.expected_score,
          kFactor: participant.k_factor,
          isBot: participant.is_bot,
          accountDeleted: !participant.is_bot && hasUserId && !hasUserRecord
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
        isRanked: match.is_ranked,
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
      for (const mode of MODE_STAT_KEYS) {
        await ensureUserModeStats(client, userId, mode);
      }
      const statsResult = await client.query(
        'SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      const modeStatsResult = await client.query(
        'SELECT * FROM user_mode_stats WHERE user_id = $1',
        [userId]
      );
      const modeStats = modeStatsResult.rows.reduce((acc, row) => {
        acc[row.mode] = row;
        return acc;
      }, {});
      return reply.send({ stats: { ...statsResult.rows[0], modes: modeStats } });
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
      for (const mode of MODE_STAT_KEYS) {
        await ensureUserModeStats(client, userId, mode);
      }
      const statsResult = await client.query(
        'SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      if (!statsResult.rows[0]) {
        return reply.code(404).send({ error: 'Stats utilisateur introuvables.' });
      }
      const modeStatsResult = await client.query(
        'SELECT * FROM user_mode_stats WHERE user_id = $1',
        [userId]
      );
      const modeStats = modeStatsResult.rows.reduce((acc, row) => {
        acc[row.mode] = row;
        return acc;
      }, {});
      return reply.send({ stats: { ...statsResult.rows[0], modes: modeStats } });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la récupération des stats.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/leaderboard', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { mode } = request.query || {};
    if (!MULTIPLAYER_MODES.has(mode)) {
      return reply.code(400).send({ error: 'Mode invalide.' });
    }

    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await ensureUserModeStats(client, userId, mode);

      const baseQuery = `
        WITH base AS (
          SELECT
            ums.user_id,
            u.username,
            COALESCE(ums.wins, 0) AS wins,
            COALESCE(ums.losses, 0) AS losses,
            COALESCE(ums.top2_finishes, 0) AS top2_finishes,
            CASE
              WHEN $1 = '1v1' THEN (COALESCE(ums.wins, 0) * 20 - COALESCE(ums.losses, 0) * 10)
              WHEN (COALESCE(ums.wins, 0) + COALESCE(ums.losses, 0)) > 0 THEN
                (
                  (COALESCE(ums.wins, 0) * 100)
                  + (GREATEST(COALESCE(ums.top2_finishes, 0) - COALESCE(ums.wins, 0), 0) * 40)
                )::numeric / (COALESCE(ums.wins, 0) + COALESCE(ums.losses, 0) + 10)
              ELSE 0
            END AS score
          FROM user_mode_stats ums
          JOIN users u ON u.id = ums.user_id
          WHERE ums.mode = $1::game_mode
        ),
        ranked AS (
          SELECT
            base.*,
            RANK() OVER (ORDER BY base.score DESC, base.wins DESC, base.losses ASC, base.username ASC) AS rank
          FROM base
        )
        SELECT *
        FROM ranked
      `;

      const entriesResult = await client.query(
        `${baseQuery} ORDER BY rank ASC LIMIT $2`,
        [mode, LEADERBOARD_LIMIT]
      );
      const selfResult = await client.query(
        `${baseQuery} WHERE user_id = $2 LIMIT 1`,
        [mode, userId]
      );

      return reply.send({
        mode,
        entries: entriesResult.rows,
        selfEntry: selfResult.rows[0] || null
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors du chargement du classement.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/leaderboard/ranked', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await ensureUserElo(client, userId, '1v1');

      const baseQuery = `
        WITH base AS (
          SELECT
            ue.user_id,
            u.username,
            ue.elo,
            ue.wins,
            ue.losses,
            RANK() OVER (ORDER BY ue.elo DESC, ue.wins DESC, ue.losses ASC, u.username ASC) AS rank
          FROM user_elo ue
          JOIN users u ON u.id = ue.user_id
          WHERE ue.mode = '1v1'
        )
        SELECT *
        FROM base
      `;

      const entriesResult = await client.query(
        `${baseQuery} ORDER BY rank ASC LIMIT $1`,
        [LEADERBOARD_LIMIT]
      );
      const selfResult = await client.query(
        `${baseQuery} WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      return reply.send({
        mode: 'ranked',
        entries: entriesResult.rows,
        selfEntry: selfResult.rows[0] || null
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors du chargement du classement classé.' });
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
