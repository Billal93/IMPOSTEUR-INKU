# IMPOSTEUR

Jeu social multijoueur sur le thème anime / manga. Un mot pour tout le monde,
un mot proche pour l'imposteur, des indices, un vote. Édité par **INKU**.

- 3 à 12 joueurs, room à 6 caractères, aucune installation
- Pensé mobile d'abord, mode clair / sombre natif
- Français décontracté, tutoiement partout

## Stack

| Couche | Choix |
| --- | --- |
| Frontend + API | Next.js (App Router, TypeScript) |
| Style | Tailwind CSS v4 (design tokens INKU) |
| Temps réel | Supabase Realtime (broadcast + presence par room) |
| Base de données | Supabase Postgres |
| Auth | Supabase Auth, mode anonyme |
| Logique sensible | API routes Next.js, service role, jamais côté client |
| État client | Zustand |
| Hébergement | Vercel |

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplis les clés Supabase
npm run seed                 # importe les paires de mots
npm run dev
```

## Base de données

1. Crée un projet Supabase.
2. Exécute `supabase/migrations/0001_init.sql` dans le SQL Editor.
3. Active l'authentification anonyme (Authentication > Providers > Anonymous).
4. `npm run seed` importe `supabase/seed/word_pairs.json` (69 paires curées).

## Anti-triche

Tout ce qui peut être utilisé pour tricher reste côté serveur :

- le tirage de la paire et l'attribution des rôles se font dans les API routes ;
- le canal Realtime ne transporte qu'un signal « l'état a changé » — chaque
  client refetch ensuite `/api/rooms/[code]/state`, qui filtre selon son rôle ;
- RLS refuse au client anonyme la lecture de `rounds`, `votes`, `words` et
  `word_pairs` ; les joueurs passent par la vue `players_public`, sans les
  tokens de session ;
- les indices contenant le mot sont rejetés par le serveur, avec un bouton
  « signaler » après la manche pour les cas plus subtils.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run seed` | import des paires de mots |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
