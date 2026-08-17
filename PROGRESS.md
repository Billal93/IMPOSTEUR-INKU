# IMPOSTEUR — suivi de build

Jeu social anime/manga (type Undercover), édité par INKU.
Stack : Next.js 16 (App Router, TS) · Tailwind v4 · Supabase (Postgres + Realtime + Auth anon) · Zustand · Vercel.

## Étapes

- [x] 1. Scaffold projet (Next.js TS + Tailwind, structure `/app` `/components` `/lib` `/server`, design tokens DA)
- [x] 2. Git + premier commit — repo GitHub à créer (bloqué sur `gh auth login`)
- [x] 3. Schéma SQL + RLS + types TS écrits — application sur un projet Supabase en attente de clés
- [x] 4. Seed base de mots : 69 paires curées, 6 catégories, 4 types de proximité + script d'import
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
- [ ] 16. Déploiement Vercel (bloqué sur `vercel login`)

## Ce qui reste à faire (nécessite une action de ta part)

1. **Supabase** — créer le projet, coller les 3 clés dans `.env.local`, exécuter
   `supabase/migrations/0001_init.sql`, activer l'auth anonyme, puis `npm run seed`.
2. **GitHub** — `gh auth login`, puis création du repo et push.
3. **Vercel** — `vercel login`, puis link + variables d'env + `vercel --prod`.

## Décisions à valider

- **Tokens Tailwind en CSS plutôt qu'en `tailwind.config`.** Tailwind v4 (installé par
  `create-next-app`) déclare les design tokens dans `@theme` au sein de `globals.css`.
  Le fichier `tailwind.config.ts` n'existe plus par défaut. Les tokens demandés
  (violet #7C3AED, dégradé rose→violet, radius, typos) y sont tous.
- **Colonnes ajoutées au schéma fourni.** Le schéma du cahier des charges ne
  permettait pas de tenir l'état d'une manche (tour courant, échéance, égalités,
  devinette). Colonnes ajoutées sans rien retirer : `rooms.used_pair_ids`,
  `rooms.paused_at`, `players.is_ready/is_spectator/has_left/last_seen_at`,
  `rounds.round_number/turn_number/total_turns/turn_index/deadline/vote_round/
  revote_candidate_ids/tie_count/eliminated_player_id/imposter_guess/
  imposter_guess_correct/winner/ended_at`, `clues.passed/reported_by`,
  `votes.vote_round`, `word_pairs.difficulty`.
- **RLS plus stricte que « lecture publique des joueurs ».** `players` contient
  `session_token` : une lecture publique permettrait d'usurper n'importe qui. Les
  clients lisent la vue `players_public` (sans token) ; `rounds`, `votes`, `words`
  et `word_pairs` sont fermés au client anonyme (sinon on lit le rôle de
  l'imposteur et le mot). Tout passe par les API routes en service role.
- **Timers réveillés par les clients.** Vercel étant serverless, aucun processus ne
  peut faire avancer un timer tout seul. Les échéances sont stockées en base
  (autorité serveur) ; les clients appellent `/tick` quand leur compte à rebours
  atteint zéro, et les transitions sont conditionnées sur l'état attendu pour
  rester idempotentes même si dix clients tapent en même temps.
- **Élimination par manche, pas par partie.** « Il reste 2 joueurs en lice dont lui »
  est interprété comme : pendant une manche, s'il ne reste que 2 joueurs actifs
  connectés dont un imposteur, l'imposteur gagne la manche. Les éliminés
  reviennent à la manche suivante (sinon une partie en 7 manches serait
  impossible à 4 joueurs).
- **Pénalité de tour passé : −1 point.** Le cahier des charges dit « légère
  pénalité » sans chiffrer.
- **Durées non paramétrables** : vote 45 s, revote 25 s, devinette 30 s,
  écran de résultat 20 s.
- **Garde-fou anti-boucle** : après 2 tours d'indices supplémentaires liés à des
  égalités successives, la manche se termine sans élimination et sans point.

## Notes

- Aucun logo INKU n'existait dans `Downloads/INKU` (seulement une bibliothèque de
  jaquettes) : la mascotte pieuvre et l'icône tentacule ont été dessinées en SVG
  d'après la description de la DA, avec une variante « déguisée » (masque/cape)
  pour les écrans imposteur.
- Le watermark INKU est fixe en bas à droite, semi-transparent, non cliquable.
