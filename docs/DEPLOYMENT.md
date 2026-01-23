# Déploiement monorepo (Render pour l'API + Vercel pour le front)

## Objectif
Ce guide prépare la migration du serveur (API + WebSocket) vers **Render** tout en gardant le front sur **Vercel**, **sans sortir du monorepo**.

**Découpage dans ce repo :**
- **Front** : racine du repo (`/`).
- **Back** : dossier `server/` (API + WebSocket).

## 1) Render — API + WebSocket (dossier `server/`)
Créer un **Web Service** Render et lui pointer le dossier `server/` du monorepo.

### Réglages Render (monorepo)
- **Build Command** : `npm install`
- **Start Command** : `npm start`
- **Root Directory** : `server`
- **Region** : au choix (proche de tes joueurs)

### Variables d’environnement (Render)
À définir dans l’interface Render :
- `DATABASE_URL`
- `DATABASE_SSL` (mettre `true` si ta base l’exige)
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `EMAIL_USER`
- `EMAIL_APP_PASSWORD`
- `APP_BASE_URL` → URL publique du front Vercel

> Render injecte déjà `PORT`, pas besoin de la définir.

### URL Render à récupérer
Après déploiement, Render te donne une URL du type :
```
https://ton-api.onrender.com
```
Garde-la, on l’utilise côté Vercel.

## 2) Vercel — Front uniquement (racine du repo)
Tu gardes le front sur Vercel. Ici on **change seulement les variables d’environnement**.

### Réglages Vercel (monorepo)
- **Root Directory** : `/` (la racine du repo)
- **Framework** : Vite (auto-détection)

### Variables d’environnement (Vercel)
Dans Vercel > Project Settings > Environment Variables :
- `VITE_API_BASE` → `https://ton-api.onrender.com`
- `VITE_SOCKET_URL` → `https://ton-api.onrender.com`
- `VITE_GOOGLE_CLIENT_ID` → même valeur que côté API

> `VITE_SOCKET_URL` peut être la même URL que l’API : Socket.io gère le WebSocket via HTTPS.

### Pourquoi on ne garde rien côté Vercel ?
Le serveur est maintenant sur Render, donc **pas de serverless** Vercel nécessaire (le front est statique).

## 3) .env local (dev)
### Front (`.env` à la racine)
```
VITE_API_BASE=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### API (`server/.env`)
```
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SSL=true
JWT_SECRET=change_me
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
EMAIL_USER=you@gmail.com
EMAIL_APP_PASSWORD=app_password
APP_BASE_URL=http://localhost:5173
```

## 4) Checklist rapide
- [ ] Render : service `server/` déployé (Root Directory = `server`)
- [ ] Render : env API configurées
- [ ] Vercel : Root Directory = `/`
- [ ] Vercel : `VITE_API_BASE` & `VITE_SOCKET_URL` pointent vers Render
- [ ] Front : authentification + sockets OK en prod
