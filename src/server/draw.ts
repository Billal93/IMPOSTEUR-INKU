import "server-only";
import { db } from "./db";
import { shuffle } from "@/lib/rules";
import type { WordPairRow, WordRow } from "@/lib/types";
import { CATEGORIES, type Category, type RoomSettings } from "@/lib/constants";

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
    // 1. catégories actives, une par une, hors paires déjà jouées
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
