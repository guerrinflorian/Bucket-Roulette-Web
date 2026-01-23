import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { pool } from '../db.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  lastLogin: user.last_login,
  createdAt: user.created_at,
  emailVerifiedAt: user.email_verified_at
});

const normalizeEmail = (email) => email.trim().toLowerCase();

const createVerificationToken = () => randomBytes(32).toString('hex');

const getVerificationExpiry = () => new Date(Date.now() + 1000 * 60 * 60 * 24);

const verificationBaseUrl = () => {
  const fallback = 'http://localhost:3001';
  return process.env.APP_BASE_URL || process.env.API_BASE_URL || process.env.SERVER_URL || fallback;
};

const createMailer = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

const mailer = createMailer();

const sendVerificationEmail = async ({ email, token, username }) => {
  if (!mailer) {
    throw new Error('Service email non configuré.');
  }
  const url = `${verificationBaseUrl()}/api/auth/verify-email?token=${token}`;
  const displayName = username || 'joueur';
  await mailer.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirmez votre adresse email',
    html: `
      <p>Bonjour ${displayName},</p>
      <p>Merci de confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
      <p><a href="${url}">Confirmer mon email</a></p>
      <p>Ce lien expire dans 24 heures.</p>
    `
  });
};

const ensureUniqueUsername = async (client, baseName) => {
  if (!baseName) return null;
  const trimmed = baseName.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  let attempt = 0;
  while (attempt < 5) {
    const existing = await client.query(
      'SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1',
      [candidate]
    );
    if (existing.rowCount === 0) {
      return candidate;
    }
    attempt += 1;
    candidate = `${trimmed}${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  return null;
};

export default async function authRoutes(fastify) {
  fastify.post('/register', async (request, reply) => {
    const { email, password, username } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email et mot de passe requis.' });
    }

    // Validation du pseudo
    if (!username) {
      return reply.code(400).send({ error: 'Le pseudo est requis.' });
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 12) {
      return reply.code(400).send({ error: 'Le pseudo doit contenir entre 2 et 12 caractères.' });
    }
    // Regex pour lettres, chiffres et underscores, pas d'espaces
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return reply.code(400).send({ error: 'Le pseudo ne peut contenir que des lettres, chiffres et underscores (pas d\'espaces).' });
    }

    if (password.length < 6) {
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Vérifier si le pseudo est déjà pris
      const usernameCheck = await client.query(
        'SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1',
        [trimmedUsername]
      );
      if (usernameCheck.rowCount > 0) {
        await client.query('ROLLBACK');
        return reply.code(409).send({ error: 'Ce pseudo est déjà utilisé.' });
      }

      const userResult = await client.query(
        'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
        [normalizedEmail]
      );

      const user = userResult.rows[0];
      if (user) {
        await client.query('ROLLBACK');
        return reply.code(409).send({
          error: 'Email déjà utilisé. Si vous avez oublié votre mot de passe ou utilisé un compte social, passez par la page de connexion.'
        });
      }

      const userId = randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = createVerificationToken();
      const verificationExpiresAt = getVerificationExpiry();
      const createdUser = await client.query(
        `INSERT INTO users
         (id, created_at, last_login, email, username, verification_token, token_expires_at)
         VALUES ($1, NOW(), NOW(), $2, $3, $4, $5)
         RETURNING *`,
        [userId, normalizedEmail, username.trim(), verificationToken, verificationExpiresAt]
      );

      await client.query(
        'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), userId, 'password', normalizedEmail, passwordHash]
      );

      await client.query('COMMIT');

      let emailSent = true;
      try {
        await sendVerificationEmail({
          email: normalizedEmail,
          token: createdUser.rows[0].verification_token,
          username: createdUser.rows[0].username
        });
      } catch (mailError) {
        emailSent = false;
        fastify.log.error(mailError);
      }

      return reply.send({
        requiresVerification: true,
        emailSent,
        user: sanitizeUser(createdUser.rows[0])
      });
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

      if (!user.email_verified_at) {
        const now = new Date();
        const needsToken = !user.verification_token || !user.token_expires_at || user.token_expires_at <= now;
        if (needsToken) {
          const verificationToken = createVerificationToken();
          const expiresAt = getVerificationExpiry();
          const refreshed = await client.query(
            `UPDATE users
             SET verification_token = $1, token_expires_at = $2
             WHERE id = $3
             RETURNING *`,
            [verificationToken, expiresAt, user.id]
          );
          await client.query('COMMIT');
          try {
            await sendVerificationEmail({
              email: normalizedEmail,
              token: refreshed.rows[0].verification_token,
              username: refreshed.rows[0].username
            });
          } catch (mailError) {
            fastify.log.error(mailError);
          }
        } else {
          await client.query('COMMIT');
        }

        return reply.code(403).send({ error: 'Email non vérifié. Veuillez confirmer votre adresse.' });
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

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const accountResult = await client.query(
          'SELECT * FROM accounts WHERE provider_type = $1 AND provider_id = $2 LIMIT 1',
          ['google', providerId]
        );
        let userId = accountResult.rows[0]?.user_id;
        let user;
        let desiredUsername = null;
        let shouldCreateGoogleAccount = false;

        if (!userId) {
          const existingUser = await client.query(
            'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
            [normalizedEmail]
          );
          if (existingUser.rows[0]) {
            userId = existingUser.rows[0].id;
            user = existingUser.rows[0];
            if (!user.username) {
              desiredUsername = await ensureUniqueUsername(
                client,
                displayName || normalizedEmail.split('@')[0]
              );
            }
          } else {
            userId = randomUUID();
            const uniqueUsername = await ensureUniqueUsername(client, displayName || normalizedEmail.split('@')[0]);
            const newUser = await client.query(
              `INSERT INTO users
               (id, created_at, last_login, email, username, email_verified_at)
               VALUES ($1, NOW(), NOW(), $2, $3, NOW())
               RETURNING *`,
              [userId, normalizedEmail, uniqueUsername]
            );
            user = newUser.rows[0];
            shouldCreateGoogleAccount = true;
          }
        }

        if (!user && userId) {
          const fetchedUser = await client.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
          user = fetchedUser.rows[0];
          if (user && !user.username) {
            desiredUsername = await ensureUniqueUsername(
              client,
              displayName || normalizedEmail.split('@')[0]
            );
          }
        }

        if (shouldCreateGoogleAccount) {
          await client.query(
            'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
            [randomUUID(), userId, 'google', providerId, null]
          );
        }

        const updatedUser = await client.query(
          `UPDATE users
           SET last_login = NOW(),
               username = COALESCE(username, $1),
               email_verified_at = COALESCE(email_verified_at, NOW()),
               verification_token = NULL,
               token_expires_at = NULL
           WHERE id = $2
           RETURNING *`,
          [desiredUsername, userId]
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

  fastify.get('/verify-email', async (request, reply) => {
    const { token } = request.query || {};
    if (!token) {
      return reply.code(400).send({ error: 'Token de vérification manquant.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT * FROM users
         WHERE verification_token = $1
           AND token_expires_at IS NOT NULL
           AND token_expires_at > NOW()
         LIMIT 1`,
        [token]
      );

      const user = result.rows[0];
      if (!user) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: 'Lien de vérification invalide ou expiré.' });
      }

      const updatedUser = await client.query(
        `UPDATE users
         SET email_verified_at = NOW(),
             verification_token = NULL,
             token_expires_at = NULL
         WHERE id = $1
         RETURNING *`,
        [user.id]
      );

      await client.query('COMMIT');
      return reply.send({ message: 'Email vérifié avec succès.', user: sanitizeUser(updatedUser.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la vérification.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/resend-verification', async (request, reply) => {
    const { email } = request.body || {};
    if (!email) {
      return reply.code(400).send({ error: 'Email requis.' });
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
        return reply.send({ message: 'Si un compte existe, un email a été envoyé.' });
      }

      if (user.email_verified_at) {
        await client.query('ROLLBACK');
        return reply.send({ message: 'Email déjà vérifié.' });
      }

      const token = createVerificationToken();
      const expiresAt = getVerificationExpiry();
      const updatedUser = await client.query(
        `UPDATE users
         SET verification_token = $1, token_expires_at = $2
         WHERE id = $3
         RETURNING *`,
        [token, expiresAt, user.id]
      );

      await client.query('COMMIT');

      await sendVerificationEmail({
        email: normalizedEmail,
        token: updatedUser.rows[0].verification_token,
        username: updatedUser.rows[0].username
      });

      return reply.send({ message: 'Email de vérification renvoyé.' });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la relance.' });
    } finally {
      client.release();
    }
  });

  fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (!result.rows[0]) {
      return reply.code(404).send({ error: 'Utilisateur introuvable.' });
    }
    if (!result.rows[0].email_verified_at) {
      return reply.code(403).send({ error: 'Email non vérifié.' });
    }
    return reply.send({ user: sanitizeUser(result.rows[0]) });
  });
}
