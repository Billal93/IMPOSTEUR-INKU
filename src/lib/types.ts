import type { Category, ProximityType, RoomSettings } from "./constants";

/* ------------------------- Lignes de la base ------------------------- */

export type RoomRow = {
  id: string;
  code: string;
  host_player_id: string | null;
  status: "lobby" | "en_cours" | "terminee";
  settings: RoomSettings;
  used_pair_ids: string[];
  paused_at: string | null;
  created_at: string;
};

export type PlayerRow = {
  id: string;
  room_id: string;
  pseudo: string;
  avatar_id: string | null;
  session_token: string;
  is_connected: boolean;
  is_ready: boolean;
  is_spectator: boolean;
  has_left: boolean;
  last_seen_at: string;
  score: number;
  created_at: string;
};

export type GameRow = {
  id: string;
  room_id: string;
  current_round: number;
  status: "en_cours" | "terminee" | "annulee";
  started_at: string;
  ended_at: string | null;
};

export type RoundStatus =
  | "indices"
  | "discussion"
  | "vote"
  | "revote"
  | "devinette"
  | "resultat";

export type RoundRow = {
  id: string;
  game_id: string;
  round_number: number;
  word_pair_id: string | null;
  imposter_player_ids: string[];
  turn_order: string[];
  status: RoundStatus;
  turn_number: number;
  total_turns: number;
  turn_index: number;
  deadline: string | null;
  vote_round: number;
  revote_candidate_ids: string[];
  tie_count: number;
  eliminated_player_id: string | null;
  imposter_guess: string | null;
  imposter_guess_correct: boolean | null;
  winner: "civils" | "imposteur" | null;
  started_at: string;
  ended_at: string | null;
};

export type ClueRow = {
  id: string;
  round_id: string;
  player_id: string;
  turn_number: number;
  content: string | null;
  passed: boolean;
  reported_by: string[];
  submitted_at: string;
};

export type VoteRow = {
  id: string;
  round_id: string;
  voter_player_id: string;
  target_player_id: string;
  vote_round: number;
  created_at: string;
};

export type WordRow = {
  id: string;
  category: Category;
  label: string;
  difficulty: "normal" | "expert";
};

export type WordPairRow = {
  id: string;
  category: Category;
  word_civil_id: string;
  word_imposter_id: string;
  proximity_type: ProximityType;
  difficulty: "normal" | "expert";
};

/* ---------------- Vue client (renvoyée par /api/.../state) ---------------- */

export type PublicPlayer = {
  id: string;
  pseudo: string;
  avatarId: string;
  isConnected: boolean;
  isReady: boolean;
  isSpectator: boolean;
  hasLeft: boolean;
  score: number;
  isHost: boolean;
};

export type PublicClue = {
  playerId: string;
  turnNumber: number;
  content: string | null;
  passed: boolean;
  reported: boolean;
};

export type RoundResult = {
  eliminatedPlayerId: string | null;
  eliminatedWasImposter: boolean;
  imposterPlayerIds: string[];
  civilWord: string;
  imposterWord: string;
  proximityType: ProximityType;
  category: Category;
  imposterGuess: string | null;
  imposterGuessCorrect: boolean | null;
  winner: "civils" | "imposteur" | null;
  tie: boolean;
  scoreDeltas: Record<string, number>;
};

export type RoomState = {
  code: string;
  status: RoomRow["status"];
  settings: RoomSettings;
  hostPlayerId: string | null;
  players: PublicPlayer[];
  me: {
    id: string;
    pseudo: string;
    avatarId: string;
    isHost: boolean;
    isSpectator: boolean;
    score: number;
  };
  pausedAt: string | null;
  /** Lancement automatique du lobby — null quand il n'y a pas de limite. */
  lobbyDeadline: string | null;
  serverTime: string;
  game: {
    id: string;
    roundNumber: number;
    totalRounds: number; // 0 = illimité
    status: GameRow["status"];
  } | null;
  round: {
    id: string;
    status: RoundStatus;
    turnNumber: number;
    totalTurns: number;
    turnOrder: string[];
    currentPlayerId: string | null;
    deadline: string | null;
    /** Mon mot — le mot civil, ou le mot proche si je suis imposteur. */
    myWord: string | null;
    category: Category;
    clues: PublicClue[];
    /** Ids de ceux qui ont déjà voté (jamais la cible avant révélation). */
    votedPlayerIds: string[];
    myVote: string | null;
    revoteCandidateIds: string[];
    eliminatedPlayerId: string | null;
    result: RoundResult | null;
    alivePlayerIds: string[];
  } | null;
  leaderboard: { playerId: string; pseudo: string; avatarId: string; score: number }[] | null;
};
