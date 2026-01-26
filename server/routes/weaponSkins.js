import { pool } from '../db.js';

const DEFAULT_SKIN = {
  id: null,
  color_hex: '#111111',
  metalness: 0.3,
  roughness: 0.7
};

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeSkin = (skin) => ({
  id: skin?.id || null,
  name: skin?.name || null,
  price_coins: skin?.price_coins ?? 0,
  color_hex: skin?.color_hex || DEFAULT_SKIN.color_hex,
  metalness: parseNumber(skin?.metalness, DEFAULT_SKIN.metalness),
  roughness: parseNumber(skin?.roughness, DEFAULT_SKIN.roughness)
});

const ensureUserStats = async (client, userId) => {
  await client.query(
    'INSERT INTO user_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  );
};

export default async function weaponSkinRoutes(fastify) {
  fastify.get('/weapon-skins', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const result = await pool.query(
      `SELECT id, name, price_coins, color_hex, metalness, roughness
       FROM weapon_skins
       WHERE is_active = TRUE
       ORDER BY price_coins ASC, name ASC`
    );
    return reply.send({ skins: result.rows.map((row) => normalizeSkin(row)) });
  });

  fastify.get('/weapon-skins/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureUserStats(client, userId);
      const statsResult = await client.query(
        'SELECT coins, equipped_weapon_skin_id FROM user_stats WHERE user_id = $1',
        [userId]
      );
      const ownedResult = await client.query(
        'SELECT skin_id FROM user_weapon_skins WHERE user_id = $1',
        [userId]
      );
      await client.query('COMMIT');

      return reply.send({
        coins: statsResult.rows[0]?.coins ?? 0,
        equippedSkinId: statsResult.rows[0]?.equipped_weapon_skin_id ?? null,
        ownedSkinIds: ownedResult.rows.map((row) => row.skin_id)
      });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors du chargement des skins.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/weapon-skins/user/:userId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.params || {};
    if (!userId) {
      return reply.code(400).send({ error: 'Identifiant utilisateur requis.' });
    }

    const result = await pool.query(
      `SELECT ws.id, ws.color_hex, ws.metalness, ws.roughness
       FROM user_stats us
       LEFT JOIN weapon_skins ws ON ws.id = us.equipped_weapon_skin_id
       WHERE us.user_id = $1
       LIMIT 1`,
      [userId]
    );

    const skin = normalizeSkin(result.rows[0] || DEFAULT_SKIN);
    return reply.send({ skin });
  });

  fastify.post('/weapon-skins/buy', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { skinId } = request.body || {};
    if (!skinId) {
      return reply.code(400).send({ error: 'Skin requis.' });
    }

    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureUserStats(client, userId);

      const skinResult = await client.query(
        `SELECT id, price_coins
         FROM weapon_skins
         WHERE id = $1 AND is_active = TRUE
         LIMIT 1`,
        [skinId]
      );
      if (!skinResult.rows[0]) {
        await client.query('ROLLBACK');
        return reply.code(404).send({ error: 'Skin introuvable.' });
      }

      const ownedResult = await client.query(
        'SELECT 1 FROM user_weapon_skins WHERE user_id = $1 AND skin_id = $2',
        [userId, skinId]
      );
      if (ownedResult.rowCount > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: 'Skin déjà possédé.' });
      }

      const statsResult = await client.query(
        'SELECT coins FROM user_stats WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const currentCoins = Number(statsResult.rows[0]?.coins ?? 0);
      const priceCoins = Number(skinResult.rows[0]?.price_coins ?? 0);

      if (currentCoins < priceCoins) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: 'Solde insuffisant.' });
      }

      const newCoins = currentCoins - priceCoins;
      await client.query('UPDATE user_stats SET coins = $1 WHERE user_id = $2', [newCoins, userId]);
      await client.query(
        'INSERT INTO user_weapon_skins (user_id, skin_id, owned_at) VALUES ($1, $2, NOW())',
        [userId, skinId]
      );

      await client.query('COMMIT');
      return reply.send({ coins: newCoins, ownedSkinId: skinId });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: "Erreur serveur lors de l'achat." });
    } finally {
      client.release();
    }
  });

  fastify.post('/weapon-skins/equip', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { skinId } = request.body || {};
    const userId = request.user.userId;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await ensureUserStats(client, userId);

      if (skinId) {
        const ownedResult = await client.query(
          'SELECT 1 FROM user_weapon_skins WHERE user_id = $1 AND skin_id = $2',
          [userId, skinId]
        );
        if (ownedResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return reply.code(400).send({ error: 'Skin non possédé.' });
        }
      }

      await client.query(
        'UPDATE user_stats SET equipped_weapon_skin_id = $1 WHERE user_id = $2',
        [skinId || null, userId]
      );

      await client.query('COMMIT');
      return reply.send({ equippedSkinId: skinId || null });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: "Erreur serveur lors de l'équipement." });
    } finally {
      client.release();
    }
  });
}
