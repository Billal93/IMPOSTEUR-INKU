import "server-only";
import {
  CATEGORIES,
  CLUE_TURNS_OPTIONS,
  DEFAULT_SETTINGS,
  DISCUSSION_OPTIONS,
  GUESS_OPTIONS,
  LOBBY_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  RESULT_OPTIONS,
  ROUNDS_OPTIONS,
  TIMER_OPTIONS,
  VOTE_OPTIONS,
  type Category,
  type RoomSettings,
} from "@/lib/constants";

/** Sanitize les réglages host : on ne fait jamais confiance au client. */
export function sanitizeSettings(input: Partial<RoomSettings> | undefined): RoomSettings {
  const s = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const pick = <T extends number>(v: unknown, allowed: readonly T[], dflt: T): T =>
    allowed.includes(v as T) ? (v as T) : dflt;

  const categories = (Array.isArray(s.categories) ? s.categories : []).filter(
    (c): c is Category => (CATEGORIES as readonly string[]).includes(c),
  );

  return {
    maxPlayers: Math.min(
      MAX_PLAYERS,
      Math.max(MIN_PLAYERS, Number(s.maxPlayers) || DEFAULT_SETTINGS.maxPlayers),
    ),
    rounds: pick(Number(s.rounds), ROUNDS_OPTIONS, DEFAULT_SETTINGS.rounds),
    clueTurns: pick(Number(s.clueTurns), CLUE_TURNS_OPTIONS, DEFAULT_SETTINGS.clueTurns),
    categories: categories.length > 0 ? categories : DEFAULT_SETTINGS.categories,
    imposterOverride:
      s.imposterOverride === null || s.imposterOverride === undefined
        ? null
        : Math.min(3, Math.max(1, Number(s.imposterOverride))),

    lobbySeconds: pick(Number(s.lobbySeconds), LOBBY_OPTIONS, DEFAULT_SETTINGS.lobbySeconds),
    timerSeconds: pick(Number(s.timerSeconds), TIMER_OPTIONS, DEFAULT_SETTINGS.timerSeconds),
    discussionSeconds: pick(
      Number(s.discussionSeconds),
      DISCUSSION_OPTIONS,
      DEFAULT_SETTINGS.discussionSeconds,
    ),
    voteSeconds: pick(Number(s.voteSeconds), VOTE_OPTIONS, DEFAULT_SETTINGS.voteSeconds),
    guessSeconds: pick(Number(s.guessSeconds), GUESS_OPTIONS, DEFAULT_SETTINGS.guessSeconds),
    resultSeconds: pick(Number(s.resultSeconds), RESULT_OPTIONS, DEFAULT_SETTINGS.resultSeconds),
  };
}
