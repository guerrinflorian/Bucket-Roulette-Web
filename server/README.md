# Bucket Roulette Server

## Installation
```bash
npm install
npm start
```

Le serveur tourne par défaut sur `http://localhost:3001`.

## Variables d'environnement
Créer un fichier `.env` dans `server/` :
```
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SSL=true
JWT_SECRET=change_me
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
EMAIL_USER=you@gmail.com
EMAIL_APP_PASSWORD=app_password
APP_BASE_URL=http://localhost:3001
```

### Production (Render, monorepo)
Sur Render, crée un **Web Service** pointant vers `server/` :
- **Build Command** : `npm install`
- **Start Command** : `npm start`
- **Root Directory** : `server`
- **Auto Deploy** : activé si tu veux déployer à chaque push.

Variables d’environnement côté API (Render) :
- `DATABASE_URL` (+ `DATABASE_SSL=true` si ta base l’exige)
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `EMAIL_USER` / `EMAIL_APP_PASSWORD`
- `APP_BASE_URL` (URL publique de ton front, ex: `https://revolver-gambit.vercel.app`)
- `PORT` **inutile** sur Render (il est injecté automatiquement)

## Auth API
- `POST /api/auth/register` { email, password, username }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/google` { idToken }
- `GET /api/auth/me` (Authorization: Bearer <token>)
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/resend-verification` { email }

## Matchs & stats API
- `POST /api/matches/solo` { victoryType, botLevel?, roundsPlayed?, participants?, difficulty?, isDefeated? }
- `POST /api/matches/multiplayer` { mode: '1v1' | '1v1v1', victoryType, roundsPlayed?, participants, winnerId? }
- `GET /api/matches/history?mode=&limit=` (Authorization: Bearer <token>)
- `GET /api/stats/me` (Authorization: Bearer <token>)
- `GET /api/solo/progress` (Authorization: Bearer <token>)

## Events Socket
- `room:create` → `room:created`
- `room:join` → `room:joined`
- `player:ready`
- `game:action` (envoyé par client vers l'hôte)
- `game:state` (envoyé par l'hôte, broadcast aux autres)

## TODO
- Matchmaking
- Auth / anti-triche
- Relay fiable des actions
