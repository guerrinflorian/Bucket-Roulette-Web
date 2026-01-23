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

const clientBaseUrl = () => {
  const fallback = 'http://localhost:5173';
  return process.env.APP_BASE_URL || process.env.CLIENT_BASE_URL || fallback;
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

const generateVodkaShotUsername = async (client) => {
  const base = 'Vodka-Shot';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
    const unique = await ensureUniqueUsername(client, candidate);
    if (unique) {
      return unique;
    }
  }
  return ensureUniqueUsername(client, `${base}${Math.floor(Math.random() * 9000 + 1000)}`);
};

const validateUsername = async (client, userId, username) => {
  if (!username) {
    return 'Le pseudo est requis.';
  }
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 2 || trimmedUsername.length > 12) {
    return 'Le pseudo doit contenir entre 2 et 12 caractères.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    return 'Le pseudo ne peut contenir que des lettres, chiffres et underscores (pas d\'espaces).';
  }
  const usernameCheck = await client.query(
    'SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2 LIMIT 1',
    [trimmedUsername, userId]
  );
  if (usernameCheck.rowCount > 0) {
    return 'Ce pseudo est déjà utilisé.';
  }
  return '';
};

const sendPasswordResetEmail = async ({ email, token, username }) => {
  if (!mailer) {
    throw new Error('Service email non configuré.');
  }
  const url = `${clientBaseUrl()}/reset-password?token=${token}`;
  const displayName = username || 'joueur';
  const year = new Date().getFullYear();
  await mailer.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Réinitialisez votre mot de passe',
    html: `
      <div style="background:#0b0f19;padding:32px 16px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">
          <tr>
            <td style="padding:24px 24px 12px;background:linear-gradient(135deg,#1f2937 0%,#0b0f19 100%);text-align:center;">
              <div style="font-size:28px;line-height:1;margin-bottom:8px;">🎯</div>
              <div style="font-size:18px;font-weight:700;color:#fcd34d;letter-spacing:2px;">REVOLVER GAMBIT</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:6px;">Sécurité du compte</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;">Bonjour ${displayName},</p>
              <p style="margin:0 0 16px;color:#cbd5f5;font-size:14px;line-height:1.6;">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
                <tr>
                  <td align="center" bgcolor="#fbbf24" style="border-radius:10px;">
                    <a href="${url}" style="display:inline-block;padding:12px 22px;color:#1f2937;text-decoration:none;font-weight:700;font-size:14px;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                Ce lien expire dans <strong>1 heure</strong>. Si le bouton ne fonctionne pas, copiez ce lien :
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:#60a5fa;word-break:break-all;">${url}</p>
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#0b0f19;text-align:center;font-size:11px;color:#6b7280;">
              © ${year} Revolver Gambit — Tous droits réservés.
            </td>
          </tr>
        </table>
      </div>
    `
  });
};

export default async function authRoutes(fastify) {
  fastify.post('/register', async (request, reply) => {
    const { email, password, username } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email et mot de passe requis.' });
    }

    // Validation du pseudo
    const trimmedUsername = username?.trim?.() ?? '';
    if (!trimmedUsername) {
      return reply.code(400).send({ error: 'Le pseudo est requis.' });
    }
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
        [userId, normalizedEmail, trimmedUsername, verificationToken, verificationExpiresAt]
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
              desiredUsername = await generateVodkaShotUsername(client);
            }
          } else {
            userId = randomUUID();
            const uniqueUsername = await generateVodkaShotUsername(client);
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
            desiredUsername = await generateVodkaShotUsername(client);
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

  fastify.patch('/username', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { username } = request.body || {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const errorMessage = await validateUsername(client, userId, username);
      if (errorMessage) {
        await client.query('ROLLBACK');
        return reply.code(400).send({ error: errorMessage });
      }

      const trimmedUsername = username.trim();
      const updatedUser = await client.query(
        `UPDATE users
         SET username = $1
         WHERE id = $2
         RETURNING *`,
        [trimmedUsername, userId]
      );

      await client.query('COMMIT');
      return reply.send({ user: sanitizeUser(updatedUser.rows[0]) });
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la mise à jour du pseudo.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/password-reset', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const client = await pool.connect();
    try {
      const userResult = await client.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
      const user = userResult.rows[0];
      if (!user) {
        return reply.code(404).send({ error: 'Utilisateur introuvable.' });
      }
      if (!mailer) {
        return reply.code(500).send({ error: 'Service email non configuré.' });
      }
      const resetToken = fastify.jwt.sign(
        { userId, type: 'password_reset' },
        { expiresIn: '1h' }
      );
      await sendPasswordResetEmail({
        email: user.email,
        token: resetToken,
        username: user.username
      });
      return reply.send({ message: 'Email de réinitialisation envoyé.' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la réinitialisation.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/password-reset-request', async (request, reply) => {
    const { email } = request.body || {};
    const trimmedEmail = email?.trim?.() ?? '';
    if (!trimmedEmail) {
      return reply.code(400).send({ error: 'Email requis.' });
    }
    if (!mailer) {
      return reply.code(500).send({ error: 'Service email non configuré.' });
    }
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
        [trimmedEmail]
      );
      const user = userResult.rows[0];
      if (user) {
        const resetToken = fastify.jwt.sign(
          { userId: user.id, type: 'password_reset' },
          { expiresIn: '1h' }
        );
        await sendPasswordResetEmail({
          email: user.email,
          token: resetToken,
          username: user.username
        });
      }
      return reply.send({
        message: 'Si un compte existe, un email de réinitialisation a été envoyé.'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erreur serveur lors de la réinitialisation.' });
    } finally {
      client.release();
    }
  });

  fastify.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body || {};
    if (!token || !password) {
      return reply.code(400).send({ error: 'Token et mot de passe requis.' });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }
    try {
      const payload = fastify.jwt.verify(token);
      if (payload.type !== 'password_reset') {
        return reply.code(400).send({ error: 'Token invalide.' });
      }
      const userId = payload.userId;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userResult = await client.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
        const user = userResult.rows[0];
        if (!user) {
          await client.query('ROLLBACK');
          return reply.code(404).send({ error: 'Utilisateur introuvable.' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const accountResult = await client.query(
          'SELECT * FROM accounts WHERE user_id = $1 AND provider_type = $2 LIMIT 1',
          [userId, 'password']
        );
        if (accountResult.rows[0]) {
          await client.query(
            'UPDATE accounts SET password_hash = $1 WHERE id = $2',
            [passwordHash, accountResult.rows[0].id]
          );
        } else {
          await client.query(
            'INSERT INTO accounts (id, user_id, provider_type, provider_id, password_hash) VALUES ($1, $2, $3, $4, $5)',
            [randomUUID(), userId, 'password', user.email, passwordHash]
          );
        }
        await client.query('COMMIT');
        return reply.send({ message: 'Mot de passe mis à jour.' });
      } catch (error) {
        await client.query('ROLLBACK');
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Erreur serveur lors de la mise à jour du mot de passe.' });
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(400).send({ error: 'Token invalide ou expiré.' });
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
