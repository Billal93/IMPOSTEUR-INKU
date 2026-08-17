-- IMPOSTEUR — schéma initial
-- À exécuter dans le SQL Editor Supabase (ou via `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_player_id uuid,
  status text not null default 'lobby',           -- lobby | en_cours | terminee
  settings jsonb not null default '{}'::jsonb,    -- maxPlayers, rounds, timerSeconds, clueTurns, discussionSeconds, categories, imposterOverride
  used_pair_ids uuid[] not null default '{}',     -- anti-répétition des paires sur la session
  paused_at timestamptz,                          -- room sous quorum : début de la pause
  created_at timestamptz not null default now()
);

create index if not exists rooms_code_idx on rooms (code);
create index if not exists rooms_created_at_idx on rooms (created_at);

-- -------------------------------------------------------------- players
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  pseudo text not null,
  avatar_id text,
  session_token text not null,
  is_connected boolean not null default true,
  is_ready boolean not null default false,
  is_spectator boolean not null default false,    -- a rejoint en cours de manche
  has_left boolean not null default false,        -- grace period dépassée
  last_seen_at timestamptz not null default now(),
  score int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists players_room_idx on players (room_id, created_at);
create unique index if not exists players_session_token_idx on players (session_token);

-- ---------------------------------------------------------------- games
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  current_round int not null default 0,
  status text not null default 'en_cours',        -- en_cours | terminee | annulee
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists games_room_idx on games (room_id, started_at desc);

-- --------------------------------------------------------------- rounds
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  round_number int not null default 1,
  word_pair_id uuid,
  imposter_player_ids uuid[] not null,
  turn_order uuid[] not null,
  status text not null default 'indices',         -- indices | discussion | vote | revote | devinette | resultat
  turn_number int not null default 1,             -- tour d'indices en cours
  total_turns int not null default 2,             -- peut être incrémenté en cas de double égalité
  turn_index int not null default 0,              -- position dans turn_order
  deadline timestamptz,                           -- fin de la phase courante (autorité serveur)
  vote_round int not null default 1,              -- 1 = vote initial, 2+ = revotes
  revote_candidate_ids uuid[] not null default '{}',
  tie_count int not null default 0,
  eliminated_player_id uuid,
  imposter_guess text,
  imposter_guess_correct boolean,
  winner text,                                    -- civils | imposteur
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists rounds_game_idx on rounds (game_id, round_number);

-- ---------------------------------------------------------------- clues
create table if not exists clues (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  turn_number int not null,
  content text,
  passed boolean not null default false,
  reported_by uuid[] not null default '{}',
  submitted_at timestamptz not null default now()
);

create unique index if not exists clues_unique_turn on clues (round_id, player_id, turn_number);
create index if not exists clues_round_idx on clues (round_id, submitted_at);

-- ---------------------------------------------------------------- votes
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  voter_player_id uuid references players(id) on delete cascade,
  target_player_id uuid references players(id) on delete cascade,
  vote_round int not null default 1,              -- 1 = vote initial, 2+ = revotes
  created_at timestamptz not null default now()
);

create unique index if not exists votes_unique_voter on votes (round_id, voter_player_id, vote_round);
create index if not exists votes_round_idx on votes (round_id, vote_round);

-- ---------------------------------------------------------------- words
create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  difficulty text not null default 'normal'       -- normal | expert
);

create unique index if not exists words_unique_label on words (category, lower(label));

create table if not exists word_pairs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  word_civil_id uuid references words(id) on delete cascade,
  word_imposter_id uuid references words(id) on delete cascade,
  proximity_type text not null,                   -- meme_univers | meme_archetype | pouvoir_similaire | visuellement_proche
  difficulty text not null default 'normal'
);

create unique index if not exists word_pairs_unique on word_pairs (word_civil_id, word_imposter_id);
create index if not exists word_pairs_category_idx on word_pairs (category);

-- FK tardive : rounds.word_pair_id
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rounds_word_pair_fk') then
    alter table rounds
      add constraint rounds_word_pair_fk
      foreign key (word_pair_id) references word_pairs(id) on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------------ RLS
-- Principe : toute la logique sensible (tirage, rôles, indices, votes)
-- passe par les API routes Next.js avec la service role key, qui contourne
-- RLS. Le client anonyme ne peut lire que ce qui ne permet pas de tricher.

alter table rooms enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table rounds enable row level security;
alter table clues enable row level security;
alter table votes enable row level security;
alter table words enable row level security;
alter table word_pairs enable row level security;

-- rooms : lecture publique (nécessaire pour retrouver une room via son code).
drop policy if exists "rooms lisibles" on rooms;
create policy "rooms lisibles" on rooms
  for select using (true);

-- players : jamais en lecture directe (la colonne session_token permettrait
-- l'usurpation). Les clients passent par la vue publique ci-dessous.
-- Aucune policy => tout est refusé sauf service role.

-- games/rounds/clues/votes/words/word_pairs : service role uniquement.
-- Lire `rounds` révélerait imposter_player_ids, lire `word_pairs` révélerait
-- le mot de l'imposteur : aucune policy anon volontairement.

-- Vue publique des joueurs d'une room, sans données sensibles.
drop view if exists players_public;
create view players_public
with (security_invoker = off) as
select
  p.id,
  p.room_id,
  p.pseudo,
  p.avatar_id,
  p.is_connected,
  p.is_ready,
  p.is_spectator,
  p.has_left,
  p.score,
  p.created_at
from players p;

grant select on players_public to anon, authenticated;

-- Nettoyage des vieilles rooms (à brancher sur pg_cron si besoin).
create or replace function purge_old_rooms(older_than interval default interval '12 hours')
returns void
language sql
security definer
set search_path = public
as $$
  delete from rooms where created_at < now() - older_than;
$$;
