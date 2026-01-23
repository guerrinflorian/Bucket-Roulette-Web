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
  return process.env.APP_BASE_URL;
};

const clientBaseUrl = () => {
  return process.env.APP_BASE_URL;
};

const renderVerificationPage = ({ title, message, buttonLabel, buttonUrl }) => `
  <!doctype html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        :root {
          color-scheme: dark;
          --bg: #0a0a0f;
          --panel: #0d1117;
          --panel-border: #f59e0b;
          --text: #fef3c7;
          --muted: #a1a1aa;
          --button: #f59e0b;
          --button-hover: #d97706;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background: radial-gradient(circle at top, rgba(245, 158, 11, 0.2), transparent 45%), var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .card {
          max-width: 520px;
          width: 100%;
          background: linear-gradient(145deg, #161b22 0%, var(--panel) 100%);
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          text-align: center;
        }
        h1 {
          margin: 0 0 12px;
          font-size: 26px;
          letter-spacing: 1px;
        }
        p {
          margin: 0 0 24px;
          font-size: 16px;
          color: var(--muted);
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--button) 0%, var(--button-hover) 100%);
          color: #1f1300;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);
        }
        .button:hover {
          filter: brightness(1.05);
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #52525b;
        }
      </style>
    </head>
    <body>
      <main class="card">
        <div style="font-size: 42px; margin-bottom: 8px;">🎯</div>
        <h1>${title}</h1>
        <p>${message}</p>
        ${buttonUrl ? `<a class="button" href="${buttonUrl}">${buttonLabel}</a>` : ''}
        <div class="footer">© 2026 Revolver Gambit</div>
      </main>
    </body>
  </html>
`;

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
    from: `Revolver Gambit <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎯 Activez votre compte - Revolver Gambit',
    html: `
      <div style="background-color: #0a0a0f; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #ffffff; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(145deg, #161b22 0%, #0d1117 100%); border: 1px solid #f59e0b; border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <div style="font-size: 40px; margin-bottom: 10px;">🎯</div>
          <h1 style="color: #fef3c7; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Revolver Gambit</h1>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #f59e0b, transparent); margin: 20px 0;"></div>
  
          <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa;">
            Bonjour <strong style="color: #f59e0b;">${displayName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa;">
            Le barillet est chargé, il ne manque plus que vous. Pour rejoindre l'arène et enregistrer vos statistiques, confirmez votre identité :
          </p>
  
          <div style="margin: 35px 0;">
            <a href="${url}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: orange; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); display: inline-block;">
              VÉRIFIER MON COMPTE
            </a>
          </div>
  
          <p style="font-size: 12px; color: #52525b; margin-top: 30px;">
            Ce lien est à usage unique et expirera dans <span style="color: #ef4444;">24 heures</span>.<br>
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
          </p>
        </div>
  
        <footer style="margin-top: 25px; font-size: 11px; color: #3f3f46;">
          © 2026 Revolver Gambit - Que la chance soit avec vous.
        </footer>
      </div>
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
      return reply
        .code(400)
        .type('text/html')
        .send(
          renderVerificationPage({
            title: 'Lien manquant',
            message: 'Le lien de vérification est incomplet. Veuillez relancer une demande.',
            buttonLabel: 'Retour à l’accueil',
            buttonUrl: clientBaseUrl()
          })
        );
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
        return reply
          .code(400)
          .type('text/html')
          .send(
            renderVerificationPage({
              title: 'Lien expiré',
              message: 'Ce lien de vérification est invalide ou a expiré.',
              buttonLabel: 'Retour à l’accueil',
              buttonUrl: clientBaseUrl()
            })
          );
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
      return reply
        .type('text/html')
        .send(
          renderVerificationPage({
            title: 'Email vérifié',
            message: 'Votre email est vérifié, vous pouvez vous connecter maintenant.',
            buttonLabel: 'Se connecter',
            buttonUrl: clientBaseUrl()
          })
        );
    } catch (error) {
      await client.query('ROLLBACK');
      fastify.log.error(error);
      return reply
        .code(500)
        .type('text/html')
        .send(
          renderVerificationPage({
            title: 'Erreur serveur',
            message: 'Une erreur est survenue pendant la vérification. Réessayez plus tard.',
            buttonLabel: 'Retour à l’accueil',
            buttonUrl: clientBaseUrl()
          })
        );
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
