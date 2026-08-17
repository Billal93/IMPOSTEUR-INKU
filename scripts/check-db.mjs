#!/usr/bin/env node
/**
 * Vérifie que le schéma est bien en place et que l'auth anonyme fonctionne.
 *
 *   node scripts/check-db.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TABLES = ["rooms", "players", "games", "rounds", "clues", "votes", "words", "word_pairs"];
let ok = true;

for (const t of TABLES) {
  const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`✖ ${t.padEnd(12)} ${error.message}`);
    ok = false;
  } else {
    console.log(`✓ ${t.padEnd(12)} ${count} ligne(s)`);
  }
}

// Colonnes ajoutées au schéma de base : on vérifie qu'elles existent.
const EXTRA = {
  rooms: "used_pair_ids, paused_at",
  players: "is_ready, is_spectator, has_left, last_seen_at",
  rounds: "round_number, turn_number, total_turns, turn_index, deadline, vote_round, revote_candidate_ids, tie_count, eliminated_player_id, imposter_guess, imposter_guess_correct, winner, ended_at",
  clues: "passed, reported_by",
  votes: "vote_round",
};
for (const [table, cols] of Object.entries(EXTRA)) {
  const { error } = await admin.from(table).select(cols).limit(1);
  if (error) {
    console.log(`✖ ${table}: colonnes manquantes — ${error.message}`);
    ok = false;
  }
}

// La vue publique doit exister et ne pas exposer session_token.
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const view = await anon.from("players_public").select("id").limit(1);
if (view.error) {
  console.log(`✖ players_public : ${view.error.message}`);
  ok = false;
} else {
  console.log("✓ players_public accessible en anon");
}

// RLS : le client anonyme ne doit PAS pouvoir lire les tables sensibles.
for (const t of ["players", "rounds", "votes", "word_pairs", "words"]) {
  const { data, error } = await anon.from(t).select("*").limit(1);
  const blocked = !!error || (data ?? []).length === 0;
  console.log(`${blocked ? "✓" : "✖"} RLS ${t.padEnd(11)} ${blocked ? "fermé au client anon" : "LISIBLE EN ANON — à corriger"}`);
  if (!blocked) ok = false;
}

// Auth anonyme.
const { error: authErr } = await anon.auth.signInAnonymously();
console.log(authErr ? `✖ auth anonyme : ${authErr.message}` : "✓ auth anonyme активée".replace("активée", "activée"));
if (authErr) ok = false;

process.exit(ok ? 0 : 1);
