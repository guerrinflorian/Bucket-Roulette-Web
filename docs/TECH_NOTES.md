# Technical Notes

## State machine (gameStore)
Phases possibles :
- `coin_flip` : animation de la pièce, on décide qui commence.
- `player_turn` : input joueur actif.
- `enemy_turn` : bot ou adversaire remote.
- `animating` : tir/impact en cours, actions bloquées.
- `round_end` : réservé pour extensions (ex: pause/reload anim).
- `game_over` : victoire/défaite.

Transitions principales :
- `coin_flip` -> `player_turn` ou `enemy_turn`.
- `player_turn` -> `animating` -> (`player_turn` si blank sur soi, sinon `enemy_turn`).
- `enemy_turn` -> `animating` -> (`enemy_turn` si blank sur soi, sinon `player_turn`).
- `*` -> `game_over` lorsque PV <= 0.

## Format de l’état sérialisé
Voir `src/engine/sync.js`. L’état envoyé par l’hôte contient :
```json
{
  "phase": "player_turn",
  "currentTurn": "player",
  "barrel": { "chambers": ["real","blank"], "index": 3 },
  "players": {
    "player": { "hp": 5, "items": ["heart"], "doubleDamageNextShot": false },
    "enemy": { "hp": 4, "items": ["peek"], "doubleDamageNextShot": true }
  },
  "lastResult": { "text": "BALLE RÉELLE !" },
  "lastAction": { "actor": "player", "target": "enemy", "shot": "real", "damage": 1 },
  "winner": null
}
```

## Ajouter un item
1. Ajouter une entrée dans `src/engine/items.js` :
   - `id`, `name`, `icon`, `description`, `canUse(state, actorKey)`, `apply(state, actorKey)`.
2. L’item devient disponible dans le loot (tirage aléatoire par défaut).
3. L’UI se met à jour automatiquement via `ItemsPanel`.

## Bot
Le bot calcule :
- `pReal = realRemaining / remaining`.
- Utilise un item `peek` si PV critique.
- Utilise `double` quand pReal élevé.
- Sinon tire sur l’ennemi si `pReal >= 0.5`, ou sur soi pour chercher un blanc.

## TODO
- Matchmaking / lobby complet.
- Anti-triche côté serveur.
- Synchronisation fine des animations et des tours en multijoueur.

## Auth (client)
Variables d’environnement (Vite) :
```
VITE_API_BASE=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Assets placeholders
Les assets visuels sont des SVG texte pour éviter les binaires dans le repo. Le son utilise un WAV silencieux en data URI dans `AudioManager`.

## Build tooling
Le déploiement utilise `npm` pour installer les dépendances; le verrouillage `pnpm-lock.yaml` a été retiré afin d’éviter les erreurs de lockfile obsolète en CI. 
