import "server-only";
import { db } from "./db";
import { shuffle } from "./repo";
import type { PlayerRow, WordPairRow, WordRow } from "@/lib/types";
import { CATEGORIES, resolveImposterCount, type Category, type RoomSettings } from "@/lib/constants";

export type Draw = {
  pair: WordPairRow;
  civilWord: WordRow;
  imposterWord: WordRow;
  /** Vrai si on a dû ignorer l'anti-répétition (pool épuisé). */
  poolRecycled: boolean;
  /** Vrai si aucune catégorie active n'avait de paire dispo. */
  categoryFallback: boolean;
};

/**
 * Tire une catégorie active puis une paire dedans.
 *
 * - anti-répétition : les paires déjà jouées dans la room sont exclues ;
 * - fallback catégorie : si une catégorie active n'a aucune paire dispo, on
 *   passe à la suivante — transparent pour les joueurs ;
 * - dernier recours : si tout le pool est épuisé, on le réautorise.
 */
export async function drawPair(
  settings: RoomSettings,
  usedPairIds: string[],
): Promise<Draw | null> {
  const active: Category[] =
    settings.categories?.length > 0 ? settings.categories : [...CATEGORIES];

  const attempts: { cats: Category[]; exclude: boolean; fallback: boolean }[] = [
    // 1. catégories actives, hors paires déjà jouées
    ...shuffle(active).map((c) => ({ cats: [c], exclude: true, fallback: false })),
    // 2. toutes les catégories actives confondues, hors paires déjà jouées
    { cats: active, exclude: true, fallback: false },
    // 3. catégories actives, pool réautorisé
    { cats: active, exclude: false, fallback: false },
    // 4. dernier recours : toutes catégories, pool réautorisé
    { cats: [...CATEGORIES], exclude: false, fallback: true },
  ];

  for (const attempt of attempts) {
    let q = db().from("word_pairs").select("*").in("category", attempt.cats);
    if (attempt.exclude && usedPairIds.length > 0) {
      q = q.not("id", "in", `(${usedPairIds.join(",")})`);
    }
    const { data } = await q.limit(400);
    const pairs = (data ?? []) as WordPairRow[];
    if (pairs.length === 0) continue;

    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const { data: words } = await db()
      .from("words")
      .select("*")
      .in("id", [pair.word_civil_id, pair.word_imposter_id]);

    const civilWord = (words ?? []).find((w) => w.id === pair.word_civil_id) as WordRow | undefined;
    const imposterWord = (words ?? []).find((w) => w.id === pair.word_imposter_id) as
      | WordRow
      | undefined;
    if (!civilWord || !imposterWord) continue;

    return {
      pair,
      civilWord,
      imposterWord,
      poolRecycled: !attempt.exclude,
      categoryFallback: attempt.fallback,
    };
  }

  return null;
}

/**
 * Choisit les imposteurs en évitant, si possible, ceux des 1–2 manches
 * précédentes (pool tournant). On relâche la contrainte si l'effectif est
 * trop faible pour la respecter.
 */
export function pickImposters(
  eligible: PlayerRow[],
  settings: RoomSettings,
  recentImposterIds: string[],
): string[] {
  const count = resolveImposterCount(eligible.length, settings);
  const recent = new Set(recentImposterIds);

  const fresh = eligible.filter((p) => !recent.has(p.id));
  const pool = fresh.length >= count ? fresh : eligible;

  return shuffle(pool)
    .slice(0, count)
    .map((p) => p.id);
}

/**
 * Ordre de passage : aléatoire à la manche 1, décalé d'un cran ensuite.
 * Les nouveaux arrivants sont ajoutés en fin d'ordre.
 */
export function buildTurnOrder(eligible: PlayerRow[], previousOrder: string[] | null): string[] {
  const ids = eligible.map((p) => p.id);
  if (!previousOrder || previousOrder.length === 0) return shuffle(ids);

  const kept = previousOrder.filter((id) => ids.includes(id));
  const rotated = kept.length > 1 ? [...kept.slice(1), kept[0]] : kept;
  const newcomers = ids.filter((id) => !kept.includes(id));
  return [...rotated, ...shuffle(newcomers)];
}
