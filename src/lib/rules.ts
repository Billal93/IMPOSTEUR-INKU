/**
 * Règles pures du jeu : aucune dépendance à la base ni au réseau.
 * Isolé du moteur pour rester testable et relisible.
 */
import {
  SCORE_CIVIL_WIN,
  SCORE_IMPOSTER_WIN,
  SCORE_PASS_PENALTY,
  resolveImposterCount,
  type RoomSettings,
} from "./constants";

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Choisit les imposteurs en évitant, si possible, ceux des 1–2 manches
 * précédentes (pool tournant). La contrainte est relâchée si l'effectif est
 * trop faible pour la respecter.
 */
export function pickImposters(
  eligibleIds: string[],
  settings: RoomSettings,
  recentImposterIds: string[],
): string[] {
  const count = resolveImposterCount(eligibleIds.length, settings);
  const recent = new Set(recentImposterIds);

  const fresh = eligibleIds.filter((id) => !recent.has(id));
  const pool = fresh.length >= count ? fresh : eligibleIds;

  return shuffle(pool).slice(0, count);
}

/**
 * Ordre de passage : aléatoire à la manche 1, décalé d'un cran ensuite.
 * Les joueurs partis sortent de l'ordre, les nouveaux sont ajoutés à la fin.
 */
export function buildTurnOrder(eligibleIds: string[], previousOrder: string[] | null): string[] {
  if (!previousOrder || previousOrder.length === 0) return shuffle(eligibleIds);

  const kept = previousOrder.filter((id) => eligibleIds.includes(id));
  const rotated = kept.length > 1 ? [...kept.slice(1), kept[0]] : kept;
  const newcomers = eligibleIds.filter((id) => !kept.includes(id));
  return [...rotated, ...shuffle(newcomers)];
}

/** Dépouillement brut : qui arrive en tête, et sont-ils plusieurs ? */
export function tallyTop(votes: { target_player_id: string }[]): {
  max: number;
  top: string[];
} {
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.target_player_id, (counts.get(v.target_player_id) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  const top = max === 0 ? [] : [...counts.entries()].filter(([, n]) => n === max).map(([id]) => id);
  return { max, top };
}

export type ScoreInput = {
  winner: "civils" | "imposteur" | null;
  imposterIds: string[];
  eliminatedId: string | null;
  /** Joueurs qui participaient à la manche (spectateurs exclus). */
  participantIds: string[];
  /** Un par tour passé, pour la pénalité. */
  passedByPlayerId: string[];
};

/**
 * Barème : civils survivants +1, imposteur vainqueur +3, imposteur démasqué
 * sans deviner 0. Chaque tour passé coûte 1 point.
 */
export function computeScoreDeltas(input: ScoreInput): Record<string, number> {
  const deltas: Record<string, number> = {};
  const bump = (id: string, n: number) => {
    deltas[id] = (deltas[id] ?? 0) + n;
  };

  const imposters = new Set(input.imposterIds);

  if (input.winner === "civils") {
    for (const id of input.participantIds) {
      if (!imposters.has(id) && id !== input.eliminatedId) bump(id, SCORE_CIVIL_WIN);
    }
  } else if (input.winner === "imposteur") {
    for (const id of input.imposterIds) bump(id, SCORE_IMPOSTER_WIN);
  }

  for (const id of input.passedByPlayerId) bump(id, SCORE_PASS_PENALTY);

  for (const k of Object.keys(deltas)) if (deltas[k] === 0) delete deltas[k];
  return deltas;
}
