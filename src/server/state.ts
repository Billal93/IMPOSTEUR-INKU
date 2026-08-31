import "server-only";
import { db } from "./db";
import { activePlayers, alivePlayers } from "./repo";
import { getClues, lobbyDeadline, scoreDeltasForRound, type Ctx } from "./engine";
import type { PlayerRow, PublicClue, PublicPlayer, RoomState, WordPairRow, WordRow } from "@/lib/types";
import { DEFAULT_AVATAR } from "@/lib/constants";

/**
 * Construit la vue de l'état destinée à UN joueur.
 * C'est le seul endroit où le mot et le rôle transitent — filtrés pour ce
 * joueur uniquement. Rien de sensible ne passe par le canal Realtime.
 */
export async function buildState(ctx: Ctx, me: PlayerRow): Promise<RoomState> {
  const { room, game, round } = ctx;

  const players: PublicPlayer[] = ctx.players
    .filter((p) => !p.has_left || room.status !== "lobby")
    .map((p) => toPublic(p, room.host_player_id));

  const base: RoomState = {
    code: room.code,
    status: room.status,
    settings: room.settings,
    hostPlayerId: room.host_player_id,
    players,
    me: {
      id: me.id,
      pseudo: me.pseudo,
      avatarId: me.avatar_id ?? DEFAULT_AVATAR,
      isHost: room.host_player_id === me.id,
      isSpectator: me.is_spectator,
      score: me.score,
    },
    pausedAt: room.paused_at,
    lobbyDeadline: room.status === "lobby" ? lobbyDeadline(room) : null,
    serverTime: new Date().toISOString(),
    game: game
      ? {
          id: game.id,
          roundNumber: game.current_round,
          totalRounds: room.settings.rounds,
          status: game.status,
        }
      : null,
    round: null,
    leaderboard:
      room.status === "terminee"
        ? [...ctx.players]
            .filter((p) => !p.is_spectator)
            .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at))
            .map((p) => ({
              playerId: p.id,
              pseudo: p.pseudo,
              avatarId: p.avatar_id ?? DEFAULT_AVATAR,
              score: p.score,
            }))
        : null,
  };

  if (!round || !game || game.status !== "en_cours") return base;

  const iAmImposter = round.imposter_player_ids.includes(me.id);
  const revealed = round.status === "resultat";
  const words = await loadWords(round.word_pair_id);

  const clues = await getClues(round.id);
  const publicClues: PublicClue[] = clues.map((c) => ({
    playerId: c.player_id,
    turnNumber: c.turn_number,
    content: c.content,
    passed: c.passed,
    reported: c.reported_by.includes(me.id),
  }));

  const { data: voteRows } = await db()
    .from("votes")
    .select("voter_player_id, target_player_id")
    .eq("round_id", round.id)
    .eq("vote_round", round.vote_round);

  const votes = voteRows ?? [];
  const myVote = votes.find((v) => v.voter_player_id === me.id)?.target_player_id ?? null;

  const alive = alivePlayers(ctx.players, round).map((p) => p.id);

  base.round = {
    id: round.id,
    status: round.status,
    turnNumber: Math.min(round.turn_number, round.total_turns),
    totalTurns: round.total_turns,
    turnOrder: round.turn_order,
    currentPlayerId: round.status === "indices" ? round.turn_order[round.turn_index] ?? null : null,
    deadline: round.deadline,
    myWord: me.is_spectator ? null : iAmImposter ? words?.imposter ?? null : words?.civil ?? null,
    category: words?.category ?? "personnages",
    clues: publicClues,
    // On ne révèle QUE la liste de ceux qui ont voté, jamais pour qui :
    // le vote reste caché jusqu'au dépouillement groupé.
    votedPlayerIds: votes.map((v) => v.voter_player_id),
    myVote,
    revoteCandidateIds: round.revote_candidate_ids,
    eliminatedPlayerId: revealed || round.status === "devinette" ? round.eliminated_player_id : null,
    alivePlayerIds: alive,
    result: revealed
      ? {
          eliminatedPlayerId: round.eliminated_player_id,
          eliminatedWasImposter: !!round.eliminated_player_id &&
            round.imposter_player_ids.includes(round.eliminated_player_id),
          imposterPlayerIds: round.imposter_player_ids,
          civilWord: words?.civil ?? "?",
          imposterWord: words?.imposter ?? "?",
          proximityType: words?.proximityType ?? "meme_univers",
          category: words?.category ?? "personnages",
          imposterGuess: round.imposter_guess,
          imposterGuessCorrect: round.imposter_guess_correct,
          winner: round.winner,
          tie: round.eliminated_player_id === null,
          scoreDeltas: scoreDeltasForRound(round, ctx.players, clues),
        }
      : null,
  };

  return base;
}

function toPublic(p: PlayerRow, hostId: string | null): PublicPlayer {
  return {
    id: p.id,
    pseudo: p.pseudo,
    avatarId: p.avatar_id ?? DEFAULT_AVATAR,
    isConnected: p.is_connected,
    isReady: p.is_ready,
    isSpectator: p.is_spectator,
    hasLeft: p.has_left,
    score: p.score,
    isHost: p.id === hostId,
  };
}

type LoadedWords = {
  civil: string;
  imposter: string;
  category: WordPairRow["category"];
  proximityType: WordPairRow["proximity_type"];
};

async function loadWords(pairId: string | null): Promise<LoadedWords | null> {
  if (!pairId) return null;
  const { data: pair } = await db().from("word_pairs").select("*").eq("id", pairId).maybeSingle();
  if (!pair) return null;
  const p = pair as WordPairRow;

  const { data } = await db()
    .from("words")
    .select("*")
    .in("id", [p.word_civil_id, p.word_imposter_id]);
  const words = (data ?? []) as WordRow[];
  const civil = words.find((w) => w.id === p.word_civil_id);
  const imposter = words.find((w) => w.id === p.word_imposter_id);
  if (!civil || !imposter) return null;

  return {
    civil: civil.label,
    imposter: imposter.label,
    category: p.category,
    proximityType: p.proximity_type,
  };
}

export { activePlayers };
