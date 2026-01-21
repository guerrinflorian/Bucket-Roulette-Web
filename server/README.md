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
```

## Auth API
- `POST /api/auth/register` { email, password, username }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/google` { idToken }
- `GET /api/auth/me` (Authorization: Bearer <token>)

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
