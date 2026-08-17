# IMPOSTEUR — suivi de build

Jeu social anime/manga (type Undercover), édité par INKU.
Stack : Next.js 16 (App Router, TS) · Tailwind v4 · Supabase (Postgres + Realtime + Auth anon) · Zustand · Vercel.

- **Prod** : https://imposteur-mauve.vercel.app
- **Repo** : https://github.com/Billal93/imposteur (privé)
- **Supabase** : projet `qggynwzcjdxrdwmqrqys`

## Étapes

- [x] 1. Scaffold projet (Next.js TS + Tailwind, structure `/app` `/components` `/lib` `/server`, design tokens DA)
- [x] 2. Git + GitHub (repo créé, branche `main`, poussé)
- [x] 3. Supabase (schéma SQL appliqué, RLS vérifiées, types TS)
- [x] 4. Seed base de mots : 67 paires curées, 125 mots, 6 catégories, 4 types de proximité
- [x] 5. Landing + création de room (réglages host → code → lobby)
- [x] 6. Rejoindre une room (code + pseudo + avatar, aperçu de la room)
- [x] 7. Lobby temps réel (joueurs, réglages éditables par l'hôte, prêt, lancement)
- [x] 8. Logique de tirage serveur (catégorie + paire + rôles, anti-répétition, fallback catégorie, pool tournant d'imposteurs)
- [x] 9. UI du tour de jeu (mot masquable, timer serveur, indice, validation anti-triche)
- [x] 10. Sync temps réel des indices (broadcast Supabase + refetch d'état filtré)
- [x] 11. Phase de vote (caché, tally, revote sur égalité, tour d'indice supplémentaire)
- [x] 12. Résultat de manche (révélation + devinette de l'imposteur avec tolérance orthographique)
- [x] 13. Scores multi-manches + leaderboard de fin de room
- [x] 14. Déconnexion / reconnexion (token de session, grace period, migration host, quorum, pause)
- [x] 15. Polish DA (dark/light, watermark INKU, animations, mobile-first)
- [x] 16. Déploiement Vercel + test de bout en bout sur l'URL de prod

## Vérifications passées

| Quoi | Comment |
| --- | --- |
| Types, lint | `npm run typecheck`, `npm run lint` |
| Règles du jeu | `npm test` — 31 tests (ordre de passage, pool d'imposteurs, dépouillement, barème, codes de room, filtre anti-insultes, anti-triche, tolérance orthographique) |
| Schéma + RLS + auth | `node scripts/check-db.mjs` |
| Partie complète via l'API | `node scripts/e2e.mjs https://imposteur-mauve.vercel.app` — 40 assertions, 3 manches |
| Partie complète via l'UI | 3 onglets sur la prod : lobby synchronisé, rôles distincts, indice contenant le mot refusé, tour auto-passé, vote caché, devinette avec faute de frappe acceptée, scores |

## Reste à faire de ton côté

1. **Auth anonyme Supabase** — encore désactivée. Dashboard → Authentication → Sign In / Providers →
   *Anonymous Sign-ins* → activer. Le jeu tourne sans (le Realtime marche avec la clé anon), mais
   c'est ce que prévoit la spec et ça donne une identité Supabase à chaque joueur.
2. **Auto-déploiement Git** — `vercel git connect` a échoué : il faut d'abord ajouter une
   *Login Connection* GitHub sur le compte Vercel (Settings → Authentication). Sans ça, les
   déploiements passent par `vercel --prod` en local, ce qui marche très bien.
3. **Repo privé** — créé en privé par prudence. `gh repo edit --visibility public` si tu veux l'ouvrir.

## Décisions à valider

- **Tokens Tailwind en CSS plutôt qu'en `tailwind.config`.** Tailwind v4 (installé par
  `create-next-app`) déclare les design tokens dans `@theme` au sein de `globals.css` ;
  `tailwind.config.ts` n'existe plus. Les tokens demandés (violet #7C3AED, dégradé rose→violet,
  radius, typos) y sont tous.
- **Colonnes ajoutées au schéma fourni.** Le schéma du cahier des charges ne permettait pas de tenir
  l'état d'une manche (tour courant, échéance, égalités, devinette). Colonnes ajoutées sans rien
  retirer : `rooms.used_pair_ids/paused_at`, `players.is_ready/is_spectator/has_left/last_seen_at`,
  `rounds.round_number/turn_number/total_turns/turn_index/deadline/vote_round/revote_candidate_ids/
  tie_count/eliminated_player_id/imposter_guess/imposter_guess_correct/winner/ended_at`,
  `clues.passed/reported_by`, `votes.vote_round`, `word_pairs.difficulty`.
- **RLS plus stricte que « lecture publique des joueurs ».** `players` contient `session_token` :
  une lecture publique permettrait d'usurper n'importe qui. Les clients lisent la vue
  `players_public` (sans token) ; `rounds`, `votes`, `words` et `word_pairs` sont fermés au client
  anonyme (sinon on lit le rôle de l'imposteur et le mot). Tout passe par les API routes en service
  role. Vérifié par `scripts/check-db.mjs`.
- **Timers réveillés par les clients.** Vercel étant serverless, aucun processus ne fait avancer un
  timer tout seul. Les échéances sont en base (autorité serveur) ; les clients appellent `/tick`
  quand leur compte à rebours atteint zéro, et chaque transition est conditionnée sur l'état attendu
  pour rester idempotente même si dix clients tapent en même temps.
- **Élimination par manche, pas par partie.** « Il reste 2 joueurs en lice dont lui » est interprété
  comme : pendant une manche, s'il ne reste que 2 joueurs non éliminés dont un imposteur, l'imposteur
  gagne la manche. Les éliminés reviennent à la manche suivante — sinon une partie en 7 manches
  serait impossible à 4 joueurs.
- **Quorum basé sur la fenêtre de reconnexion (75 s), pas sur le dernier heartbeat.** Sinon poser son
  téléphone quinze secondes suffit à mettre la partie en pause.
- **Pénalité de tour passé : −1 point**, le cahier des charges dit « légère pénalité » sans chiffrer.
  Conséquence assumée : un score total peut devenir négatif.
- **Durées non paramétrables** : vote 45 s, revote 25 s, devinette 30 s, écran de résultat 20 s.
- **Garde-fou anti-boucle** : après 2 tours d'indices supplémentaires liés à des égalités
  successives, la manche se termine sans élimination et sans point.
- **Reprise de place conditionnée au pseudo.** On ne réutilise le token stocké que si le pseudo saisi
  est le même ; sinon c'est quelqu'un d'autre sur le même appareil, et il entre comme nouveau joueur.

## Limites connues

- Le canal Realtime n'a pas de politique d'autorisation : n'importe qui connaissant le code d'une
  room peut écouter son canal. Sans conséquence — le canal ne transporte qu'un signal « ça a
  changé », jamais de mot ni de rôle — mais à durcir si le jeu s'ouvre au public (Realtime
  Authorization + RLS sur `realtime.messages`).
- Pas de purge automatique des vieilles rooms. La fonction `purge_old_rooms()` existe dans la
  migration, il reste à la brancher sur `pg_cron` (ou un cron Vercel).
- Le mode « manches illimitées » s'arrête uniquement quand l'hôte appuie sur *Arrêter*.
- La discussion libre est un minuteur partagé, pas un chat : on parle de vive voix.
