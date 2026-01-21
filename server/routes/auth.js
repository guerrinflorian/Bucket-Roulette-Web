import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../db.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  avatarUrl: user.avatar_url,
  lastLogin: user.last_login,
  createdAt: user.created_at
});

const normalizeEmail = (email) => email.trim().toLowerCase();

export default async function authRoutes(fastify) {
  fastify.post('/register', async (request, reply) => {
    const { email, password, username } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email et mot de passe requis.' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
        [normalizedEmail]
      );

      const user = userResult.rows[0];
      if (user) {
        const passwordAccount = await client.query(
          'SELECT id FROM accounts WHERE user_id = $1 AND provider_type = $2 LIMIT 1',
          [user.id, 'password']
        );

        if (passwordAccount.rowCount > 0) {
          await client.query('ROLLBACK');
          return reply.code(409).send({ error: 'Un compte avec cet email existe déjà.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await client.query(
          'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
          [randomUUID(), user.id, 'password', normalizedEmail, passwordHash]
        );

        const updatedUser = await client.query(
          'UPDATE users SET last_login = NOW(), username = COALESCE(username, $1) WHERE id = $2 RETURNING *',
          [username || null, user.id]
        );

        await client.query('COMMIT');

        const token = fastify.jwt.sign({ userId: user.id });
        return reply.send({ token, user: sanitizeUser(updatedUser.rows[0]) });
      }

      const userId = randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      const createdUser = await client.query(
        'INSERT INTO users (id, created_at, last_login, email, username, avatar_url) VALUES ($1, NOW(), NOW(), $2, $3, $4) RETURNING *',
        [userId, normalizedEmail, username || null, null]
      );

      await client.query(
        'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), userId, 'password', normalizedEmail, passwordHash]
      );

      await client.query('COMMIT');

      const token = fastify.jwt.sign({ userId });
      return reply.send({ token, user: sanitizeUser(createdUser.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: "Erreur serveur lors de l'inscription." });
    } finally {
      client.release();
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email et mot de passe requis.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
        [normalizedEmail]
      );
      const user = userResult.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return reply.code(401).send({ error: 'Email ou mot de passe incorrect.' });
      }

      const accountResult = await client.query(
        'SELECT * FROM accounts WHERE user_id = $1 AND provider_type = $2 LIMIT 1',
        [user.id, 'password']
      );
      const account = accountResult.rows[0];
      if (!account?.password_hash) {
        await client.query('ROLLBACK');
        return reply.code(409).send({ error: 'Ce compte utilise Google. Connectez-vous via Google.' });
      }

      const isValid = await bcrypt.compare(password, account.password_hash);
      if (!isValid) {
        await client.query('ROLLBACK');
        return reply.code(401).send({ error: 'Email ou mot de passe incorrect.' });
      }

      const updatedUser = await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING *',
        [user.id]
      );

      await client.query('COMMIT');

      const token = fastify.jwt.sign({ userId: user.id });
      return reply.send({ token, user: sanitizeUser(updatedUser.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la connexion.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/google', async (request, reply) => {
    const { idToken } = request.body || {};
    if (!idToken) {
      return reply.code(400).send({ error: 'Token Google manquant.' });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload?.sub) {
        return reply.code(400).send({ error: 'Token Google invalide.' });
      }

      const normalizedEmail = normalizeEmail(payload.email);
      const providerId = payload.sub;
      const displayName = payload.name || payload.given_name || null;
      const avatarUrl = payload.picture || null;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const accountResult = await client.query(
          'SELECT * FROM accounts WHERE provider_type = $1 AND provider_id = $2 LIMIT 1',
          ['google', providerId]
        );
        let userId = accountResult.rows[0]?.user_id;
        let user;

        if (!userId) {
          const existingUser = await client.query(
            'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
            [normalizedEmail]
          );
          if (existingUser.rows[0]) {
            userId = existingUser.rows[0].id;
            user = existingUser.rows[0];
          } else {
            userId = randomUUID();
            const newUser = await client.query(
              'INSERT INTO users (id, created_at, last_login, email, username, avatar_url) VALUES ($1, NOW(), NOW(), $2, $3, $4) RETURNING *',
              [userId, normalizedEmail, displayName, avatarUrl]
            );
            user = newUser.rows[0];
          }

          await client.query(
            'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
            [randomUUID(), userId, 'google', providerId, null]
          );
        }

        const updatedUser = await client.query(
          'UPDATE users SET last_login = NOW(), username = COALESCE(username, $1), avatar_url = COALESCE(avatar_url, $2) WHERE id = $3 RETURNING *',
          [displayName, avatarUrl, userId]
        );

        await client.query('COMMIT');

        const token = fastify.jwt.sign({ userId });
        return reply.send({ token, user: sanitizeUser(updatedUser.rows[0]) });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(401).send({ error: 'Connexion Google échouée.' });
    }
  });

  fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Utilisateur introuvable.' });
    }
    return reply.send({ user: sanitizeUser(result.rows[0]) });
  });
}

