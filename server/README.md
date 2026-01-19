# Bucket Roulette Server

## Installation
```bash
npm install
npm start
```

Le serveur tourne par défaut sur `http://localhost:3001`.

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
