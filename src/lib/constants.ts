/** Constantes partagées client + serveur. */

export const CATEGORIES = [
  "personnages",
  "lieux",
  "techniques",
  "objets",
  "creatures",
  "oeuvres",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  personnages: "Personnages",
  lieux: "Lieux / univers",
  techniques: "Techniques / pouvoirs",
  objets: "Objets emblématiques",
  creatures: "Créatures / compagnons",
  oeuvres: "Titres d'œuvres",
};

export const CATEGORY_HINTS: Record<Category, string> = {
  personnages: "Les héros et les vilains que tout le monde connaît.",
  lieux: "Villes, écoles, royaumes, planètes.",
  techniques: "Attaques signature et pouvoirs.",
  objets: "Armes, artefacts, gadgets cultes.",
  creatures: "Compagnons, bestioles et invocations.",
  oeuvres: "Mode expert : les titres eux-mêmes.",
};

export const PROXIMITY_TYPES = [
  "meme_univers",
  "meme_archetype",
  "pouvoir_similaire",
  "visuellement_proche",
] as const;

export type ProximityType = (typeof PROXIMITY_TYPES)[number];

export const PROXIMITY_LABELS: Record<ProximityType, string> = {
  meme_univers: "Même univers",
  meme_archetype: "Même archétype",
  pouvoir_similaire: "Pouvoir similaire",
  visuellement_proche: "Visuellement proche",
};

/* --------------------------- Réglages room --------------------------- */

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export const ROUNDS_OPTIONS = [1, 3, 5, 7, 0] as const; // 0 = illimité

/**
 * Toutes les durées sont exprimées en secondes, et **0 veut dire « sans
 * limite »**. Par défaut, aucune phase n'est chronométrée : les joueurs
 * prennent le temps qu'ils veulent. Les timers restent branchés partout, il
 * suffit de mettre une valeur non nulle pour les activer.
 */
export const NO_LIMIT = 0;

export const TIMER_OPTIONS = [NO_LIMIT, 15, 20, 30, 45] as const;
export const VOTE_OPTIONS = [NO_LIMIT, 30, 45, 60] as const;
export const GUESS_OPTIONS = [NO_LIMIT, 20, 30, 45] as const;
export const RESULT_OPTIONS = [NO_LIMIT, 15, 20, 30] as const;
export const LOBBY_OPTIONS = [NO_LIMIT, 60, 120, 300] as const;
export const CLUE_TURNS_OPTIONS = [1, 2, 3] as const;
export const DISCUSSION_OPTIONS = [0, 30, 45, 60] as const; // 0 = pas de discussion

/** Une partie minimale : un mot, une phase d'indices, un vote, sans chrono. */
export const DEFAULT_ROUNDS = 1;
export const DEFAULT_CLUE_TURNS = 1;
export const DEFAULT_TIMER = NO_LIMIT;
export const DEFAULT_VOTE = NO_LIMIT;
export const DEFAULT_GUESS = NO_LIMIT;
export const DEFAULT_RESULT = NO_LIMIT;
export const DEFAULT_LOBBY = NO_LIMIT;
export const DEFAULT_DISCUSSION = 0;
export const DEFAULT_MAX_PLAYERS = 8;

/** Fenêtre de reconnexion avant d'être marqué « parti ». */
export const DISCONNECT_GRACE_MS = 75_000;
/** Sans heartbeat depuis ce délai, le joueur est considéré hors ligne. */
export const HEARTBEAT_STALE_MS = 20_000;
/** Room sous le quorum : annulation de la partie au bout de ce délai. */
export const PAUSE_CANCEL_MS = 120_000;

export type RoomSettings = {
  maxPlayers: number;
  rounds: number; // 0 = illimité
  clueTurns: number;
  categories: Category[];
  imposterOverride: number | null; // null = auto
  /* Durées, en secondes. 0 = sans limite. */
  lobbySeconds: number; // lancement auto du lobby
  timerSeconds: number; // un tour d'indice
  discussionSeconds: number; // 0 = pas de phase de discussion
  voteSeconds: number;
  guessSeconds: number;
  resultSeconds: number; // 0 = l'hôte enchaîne à la main
};

export const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: DEFAULT_MAX_PLAYERS,
  rounds: DEFAULT_ROUNDS,
  clueTurns: DEFAULT_CLUE_TURNS,
  categories: ["personnages", "lieux", "techniques", "objets", "creatures"],
  imposterOverride: null,
  lobbySeconds: DEFAULT_LOBBY,
  timerSeconds: DEFAULT_TIMER,
  discussionSeconds: DEFAULT_DISCUSSION,
  voteSeconds: DEFAULT_VOTE,
  guessSeconds: DEFAULT_GUESS,
  resultSeconds: DEFAULT_RESULT,
};

/** Durée de la phase courante, d'après les réglages de la room. */
export function phaseDurationSeconds(
  status: "indices" | "discussion" | "vote" | "revote" | "devinette" | "resultat",
  settings: RoomSettings,
): number {
  switch (status) {
    case "indices":
      return settings.timerSeconds;
    case "discussion":
      return settings.discussionSeconds;
    case "vote":
    case "revote":
      return settings.voteSeconds;
    case "devinette":
      return settings.guessSeconds;
    case "resultat":
      return settings.resultSeconds;
  }
}

/** Libellé d'une durée pour l'UI. */
export function durationLabel(seconds: number): string {
  return seconds === NO_LIMIT ? "Sans limite" : `${seconds}s`;
}

/** 1 imposteur jusqu'à 6 joueurs, 2 à partir de 7. */
export function autoImposterCount(playerCount: number): number {
  return playerCount >= 7 ? 2 : 1;
}

export function resolveImposterCount(playerCount: number, settings: RoomSettings): number {
  const wanted = settings.imposterOverride ?? autoImposterCount(playerCount);
  // Toujours au moins 1 imposteur, et au moins 2 civils en face.
  return Math.max(1, Math.min(wanted, Math.max(1, playerCount - 2)));
}

/* ------------------------------ Scores ------------------------------ */

export const SCORE_CIVIL_WIN = 1;
export const SCORE_IMPOSTER_WIN = 3;
export const SCORE_PASS_PENALTY = -1;

/* ------------------------------ Avatars ------------------------------ */

export type AvatarDef = {
  id: string;
  name: string;
  body: string; // couleur principale de la pieuvre
  accent: string; // couleur de l'accessoire
  accessory: "none" | "mask" | "cape" | "cap" | "glasses" | "bow" | "headband" | "horns";
};

/** Galerie de variantes de la mascotte INKU (pieuvre pourpre). */
export const AVATARS: AvatarDef[] = [
  { id: "inku", name: "Inku", body: "#7C3AED", accent: "#EC4899", accessory: "none" },
  { id: "masque", name: "Masqué", body: "#6B21D6", accent: "#F43F5E", accessory: "mask" },
  { id: "cape", name: "Caped", body: "#8B5CF6", accent: "#EC4899", accessory: "cape" },
  { id: "casquette", name: "Casquette", body: "#A37DFF", accent: "#10B981", accessory: "cap" },
  { id: "lunettes", name: "Lunettes", body: "#571BAA", accent: "#38BDF8", accessory: "glasses" },
  { id: "noeud", name: "Nœud", body: "#F472B6", accent: "#7C3AED", accessory: "bow" },
  { id: "bandeau", name: "Bandeau", body: "#4F46E5", accent: "#F59E0B", accessory: "headband" },
  { id: "cornes", name: "Cornes", body: "#DB2777", accent: "#FDE68A", accessory: "horns" },
  { id: "menthe", name: "Menthe", body: "#10B981", accent: "#7C3AED", accessory: "none" },
  { id: "azur", name: "Azur", body: "#0EA5E9", accent: "#EC4899", accessory: "glasses" },
  { id: "sable", name: "Sable", body: "#F59E0B", accent: "#7C3AED", accessory: "cap" },
  { id: "encre", name: "Encre", body: "#2C0D5C", accent: "#EC4899", accessory: "mask" },
];

export const DEFAULT_AVATAR = AVATARS[0].id;

export function avatarById(id: string | null | undefined): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
