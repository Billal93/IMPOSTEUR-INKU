#!/usr/bin/env node
/**
 * Importe supabase/seed/word_pairs.json dans les tables `words` et `word_pairs`.
 * Idempotent : relancer le script ne crée pas de doublons.
 *
 *   npm run seed
 *
 * Nécessite NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Charge .env.local sans dépendance externe.
for (const file of [".env.local", ".env"]) {
  try {
    const raw = readFileSync(join(root, file), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fichier absent : on compte sur l'environnement */
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("✖ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const seed = JSON.parse(readFileSync(join(root, "supabase/seed/word_pairs.json"), "utf8"));
const pairs = seed.pairs;
console.log(`→ ${pairs.length} paires à importer`);

// 1. Mots uniques (category + label).
const wordMap = new Map();
for (const p of pairs) {
  for (const label of [p.civil, p.imposter]) {
    const k = `${p.category}::${label.toLowerCase()}`;
    if (!wordMap.has(k)) {
      wordMap.set(k, { category: p.category, label, difficulty: p.difficulty ?? "normal" });
    }
  }
}

const words = [...wordMap.values()];
const { error: wordsError } = await supabase
  .from("words")
  .upsert(words, { onConflict: "category,label", ignoreDuplicates: true });

// L'index unique porte sur lower(label) : on retombe sur un insert tolérant si
// l'upsert nommé n'est pas supporté par l'index fonctionnel.
if (wordsError) {
  for (const w of words) {
    const { error } = await supabase.from("words").insert(w);
    if (error && !/duplicate key/i.test(error.message)) {
      console.error("✖ insertion mot :", w.label, error.message);
      process.exit(1);
    }
  }
}
console.log(`✓ ${words.length} mots en base`);

// 2. Relecture des ids.
const idByKey = new Map();
let from = 0;
for (;;) {
  const { data, error } = await supabase
    .from("words")
    .select("id, category, label")
    .range(from, from + 999);
  if (error) {
    console.error("✖ lecture des mots :", error.message);
    process.exit(1);
  }
  for (const w of data) idByKey.set(`${w.category}::${w.label.toLowerCase()}`, w.id);
  if (data.length < 1000) break;
  from += 1000;
}

// 3. Paires.
const rows = [];
for (const p of pairs) {
  const civilId = idByKey.get(`${p.category}::${p.civil.toLowerCase()}`);
  const imposterId = idByKey.get(`${p.category}::${p.imposter.toLowerCase()}`);
  if (!civilId || !imposterId) {
    console.warn(`! paire ignorée (mot introuvable) : ${p.civil} / ${p.imposter}`);
    continue;
  }
  rows.push({
    category: p.category,
    word_civil_id: civilId,
    word_imposter_id: imposterId,
    proximity_type: p.proximity_type,
    difficulty: p.difficulty ?? "normal",
  });
}

const { error: pairsError } = await supabase
  .from("word_pairs")
  .upsert(rows, { onConflict: "word_civil_id,word_imposter_id", ignoreDuplicates: true });

if (pairsError) {
  console.error("✖ insertion des paires :", pairsError.message);
  process.exit(1);
}

const { count } = await supabase.from("word_pairs").select("id", { count: "exact", head: true });
console.log(`✓ ${rows.length} paires importées — ${count} paires en base au total`);
