import "server-only";
import { db } from "./db";
import { broadcastRoom } from "./broadcast";
import { drawPair } from "./draw";
import { buildTurnOrder, computeScoreDeltas, pickImposters, tallyTop } from "@/lib/rules";
import {
  activePlayers,
  alivePlayers,
  ensureHost,
  getCurrentGame,
  getCurrentRound,
  getPlayers,
  getRecentImposterIds,
  getRoomByCode,
  isDue,
  patchRound,
  deadlineIn,
  syncPresence,
} from "./repo";
import type { ClueRow, GameRow, PlayerRow, RoomRow, RoundRow, VoteRow } from "@/lib/types";
import {
  MIN_PLAYERS,
  phaseDurationSeconds,
  PAUSE_CANCEL_MS,
} from "@/lib/constants";
import { isCloseEnough } from "@/lib/text";

export type Ctx = {
  room: RoomRow;
  players: PlayerRow[];
  game: GameRow | null;
  round: RoundRow | null;
};

/** Charge le contexte complet d'une room et rafraîchit la présence. */
export async function loadCtx(code: string): Promise<Ctx | null> {
  const room = await getRoomByCode(code);
  if (!room) return null;

  let players = await getPlayers(room.id);
  players = await syncPresence(players);
  await ensureHost(room, players);

  const game = room.status === "lobby" ? null : await getCurrentGame(room.id);
  const round = game && game.status === "en_cours" ? await getCurrentRound(game.id) : null;

  return { room, players, game, round };
}

/* ---------------------------------------------------------------- */
/* Démarrage                                                         */
/* ---------------------------------------------------------------- */

export async function startGame(ctx: Ctx): Promise<{ error?: string }> {
  const eligible = activePlayers(ctx.players).filter((p) => p.is_connected || !p.has_left);
  if (eligible.length < MIN_PLAYERS) {
    return { error: `Il faut au moins ${MIN_PLAYERS} joueurs pour lancer.` };
  }
  if (ctx.room.status !== "lobby") return { error: "La partie est déjà lancée." };

  const { data: game } = await db()
    .from("games")
    .insert({ room_id: ctx.room.id, current_round: 0, status: "en_cours" })
    .select("*")
    .single();
  if (!game) return { error: "Impossible de démarrer la partie." };

  await db().from("rooms").update({ status: "en_cours", used_pair_ids: [] }).eq("id", ctx.room.id);
  ctx.room.status = "en_cours";
  ctx.room.used_pair_ids = [];
  ctx.game = game as GameRow;

  const res = await startRound(ctx, 1, null);
  return res;
}

/** Crée une nouvelle manche : tirage, rôles, ordre de passage. */
export async function startRound(
  ctx: Ctx,
  roundNumber: number,
  previousOrder: string[] | null,
): Promise<{ error?: string }> {
  if (!ctx.game) return { error: "Aucune partie en cours." };

  // Les spectateurs (arrivés en cours de manche) entrent maintenant en jeu.
  await db()
    .from("players")
    .update({ is_spectator: false })
    .eq("room_id", ctx.room.id)
    .eq("is_spectator", true);
  ctx.players = ctx.players.map((p) => ({ ...p, is_spectator: false }));

  const eligible = activePlayers(ctx.players);
  if (eligible.length < MIN_PLAYERS) return { error: "Pas assez de joueurs." };

  const settings = ctx.room.settings;
  const draw = await drawPair(settings, ctx.room.used_pair_ids ?? []);
  if (!draw) return { error: "Aucune paire de mots disponible. Vérifie le seed de la base." };

  const recent = await getRecentImposterIds(ctx.game.id, 2);
  const eligibleIds = eligible.map((p) => p.id);
  const imposters = pickImposters(eligibleIds, settings, recent);
  const turnOrder = buildTurnOrder(eligibleIds, previousOrder);

  const { data: round } = await db()
    .from("rounds")
    .insert({
      game_id: ctx.game.id,
      round_number: roundNumber,
      word_pair_id: draw.pair.id,
      imposter_player_ids: imposters,
      turn_order: turnOrder,
      status: "indices",
      turn_number: 1,
      total_turns: settings.clueTurns,
      turn_index: 0,
      vote_round: 1,
      deadline: deadlineIn(settings.timerSeconds),
    })
    .select("*")
    .single();

  if (!round) return { error: "Impossible de créer la manche." };

  const used = draw.poolRecycled ? [draw.pair.id] : [...(ctx.room.used_pair_ids ?? []), draw.pair.id];
  await db()
    .from("rooms")
    .update({ used_pair_ids: used })
    .eq("id", ctx.room.id);
  ctx.room.used_pair_ids = used;

  await db()
    .from("games")
    .update({ current_round: roundNumber })
    .eq("id", ctx.game.id);
  ctx.game.current_round = roundNumber;
  ctx.round = round as RoundRow;

  // Si le premier de l'ordre n'est plus jouable, on avance tout de suite.
  await skipUnplayable(ctx);
  return {};
}

/* ---------------------------------------------------------------- */
/* Tour d'indices                                                    */
/* ---------------------------------------------------------------- */

function playableIds(ctx: Ctx): Set<string> {
  return new Set(alivePlayers(ctx.players, ctx.round).map((p) => p.id));
}

/** Position suivante jouable dans l'ordre de passage. */
function nextPosition(
  ctx: Ctx,
  fromIndex: number,
  fromTurn: number,
): { index: number; turn: number } | null {
  const round = ctx.round!;
  const ok = playableIds(ctx);
  let idx = fromIndex;
  let turn = fromTurn;
  const maxSteps = round.turn_order.length * (round.total_turns + 2) + 2;

  for (let step = 0; step < maxSteps; step++) {
    idx += 1;
    if (idx >= round.turn_order.length) {
      idx = 0;
      turn += 1;
      if (turn > round.total_turns) return null;
    }
    if (ok.has(round.turn_order[idx])) return { index: idx, turn };
  }
  return null;
}

/** Si le joueur courant a quitté la partie, on passe au suivant. */
async function skipUnplayable(ctx: Ctx): Promise<void> {
  const round = ctx.round;
  if (!round || round.status !== "indices") return;
  const ok = playableIds(ctx);
  if (ok.has(round.turn_order[round.turn_index])) return;

  const next = nextPosition(ctx, round.turn_index, round.turn_number);
  if (!next) {
    await endCluePhase(ctx);
    return;
  }
  const patch = {
    turn_index: next.index,
    turn_number: next.turn,
    deadline: deadlineIn(ctx.room.settings.timerSeconds),
  };
  await patchRound(round.id, { status: "indices", turn_index: round.turn_index }, patch);
  Object.assign(round, patch);
}

/** Fin des tours d'indices : discussion libre si activée, sinon vote. */
async function endCluePhase(ctx: Ctx): Promise<void> {
  const round = ctx.round!;
  const settings = ctx.room.settings;
  const goDiscussion = settings.discussionSeconds > 0;
  const patch = {
    status: goDiscussion ? ("discussion" as const) : ("vote" as const),
    deadline: deadlineIn(goDiscussion ? settings.discussionSeconds : settings.voteSeconds),
  };
  if (await patchRound(round.id, { status: round.status }, patch)) Object.assign(round, patch);
}

export async function submitClue(
  ctx: Ctx,
  player: PlayerRow,
  content: string,
): Promise<{ error?: string }> {
  const round = ctx.round;
  if (!round || round.status !== "indices") return { error: "Ce n'est pas le moment des indices." };
  if (round.turn_order[round.turn_index] !== player.id) return { error: "Ce n'est pas ton tour." };

  const { error } = await db().from("clues").insert({
    round_id: round.id,
    player_id: player.id,
    turn_number: round.turn_number,
    content: content.trim(),
    passed: false,
  });
  if (error && !/duplicate key/i.test(error.message)) {
    return { error: "Ton indice n'est pas passé, réessaie." };
  }

  await moveToNextTurn(ctx);
  return {};
}

/** Timeout : indice vide, le joueur « a passé son tour ». */
async function autoPass(ctx: Ctx): Promise<void> {
  const round = ctx.round!;
  const playerId = round.turn_order[round.turn_index];
  await db()
    .from("clues")
    .insert({
      round_id: round.id,
      player_id: playerId,
      turn_number: round.turn_number,
      content: null,
      passed: true,
    })
    .then(() => undefined, () => undefined);
  await moveToNextTurn(ctx);
}

async function moveToNextTurn(ctx: Ctx): Promise<void> {
  const round = ctx.round!;
  const next = nextPosition(ctx, round.turn_index, round.turn_number);
  if (!next) {
    await endCluePhase(ctx);
    return;
  }
  const patch = {
    turn_index: next.index,
    turn_number: next.turn,
    deadline: deadlineIn(ctx.room.settings.timerSeconds),
  };
  if (
    await patchRound(
      round.id,
      { status: "indices", turn_index: round.turn_index, turn_number: round.turn_number },
      patch,
    )
  ) {
    Object.assign(round, patch);
  }
}

/* ---------------------------------------------------------------- */
/* Vote                                                              */
/* ---------------------------------------------------------------- */

export async function submitVote(
  ctx: Ctx,
  player: PlayerRow,
  targetId: string,
): Promise<{ error?: string }> {
  const round = ctx.round;
  if (!round || (round.status !== "vote" && round.status !== "revote")) {
    return { error: "Ce n'est pas le moment de voter." };
  }
  if (player.id === targetId) return { error: "Tu ne peux pas voter pour toi." };

  const eligible = alivePlayers(ctx.players, round);
  if (!eligible.some((p) => p.id === player.id)) return { error: "Tu ne participes pas à ce vote." };
  if (!eligible.some((p) => p.id === targetId)) return { error: "Cible invalide." };
  if (
    round.status === "revote" &&
    round.revote_candidate_ids.length > 0 &&
    !round.revote_candidate_ids.includes(targetId)
  ) {
    return { error: "Au revote, tu choisis parmi les ex æquo." };
  }

  await db()
    .from("votes")
    .upsert(
      {
        round_id: round.id,
        voter_player_id: player.id,
        target_player_id: targetId,
        vote_round: round.vote_round,
      },
      { onConflict: "round_id,voter_player_id,vote_round" },
    );

  // Tout le monde a voté : on dépouille sans attendre le timer.
  const votes = await getVotes(round.id, round.vote_round);
  if (votes.length >= eligible.length) await tally(ctx);
  return {};
}

async function getVotes(roundId: string, voteRound: number): Promise<VoteRow[]> {
  const { data } = await db()
    .from("votes")
    .select("*")
    .eq("round_id", roundId)
    .eq("vote_round", voteRound);
  return (data ?? []) as VoteRow[];
}

/** Dépouillement : élimination, revote, ou tour d'indice supplémentaire. */
async function tally(ctx: Ctx): Promise<void> {
  const round = ctx.round!;
  const votes = await getVotes(round.id, round.vote_round);
  const { max, top } = tallyTop(votes);

  // Personne n'a voté : on relance directement un tour d'indice.
  if (max === 0 || top.length === 0) {
    await extraClueTurn(ctx);
    return;
  }

  if (top.length === 1) {
    await eliminate(ctx, top[0]);
    return;
  }

  // Égalité : premier round -> revote entre les ex æquo uniquement.
  if (round.tie_count === 0) {
    const patch = {
      status: "revote" as const,
      vote_round: round.vote_round + 1,
      revote_candidate_ids: top,
      tie_count: 1,
      deadline: deadlineIn(ctx.room.settings.voteSeconds),
    };
    if (await patchRound(round.id, { status: round.status, vote_round: round.vote_round }, patch)) {
      Object.assign(round, patch);
    }
    return;
  }

  // Nouvelle égalité : personne n'est éliminé, tour d'indice supplémentaire.
  await extraClueTurn(ctx);
}

async function extraClueTurn(ctx: Ctx): Promise<void> {
  const round = ctx.round!;

  // Garde-fou : au bout de deux tours supplémentaires, la manche s'arrête
  // sans élimination pour ne pas boucler indéfiniment.
  if (round.total_turns >= ctx.room.settings.clueTurns + 2) {
    await finishRound(ctx, null, null);
    return;
  }

  const ok = playableIds(ctx);
  const firstIdx = round.turn_order.findIndex((id) => ok.has(id));
  const patch = {
    status: "indices" as const,
    total_turns: round.total_turns + 1,
    turn_number: round.total_turns + 1,
    turn_index: Math.max(0, firstIdx),
    vote_round: round.vote_round + 1,
    revote_candidate_ids: [],
    tie_count: 0,
    deadline: deadlineIn(ctx.room.settings.timerSeconds),
  };
  if (await patchRound(round.id, { status: round.status, vote_round: round.vote_round }, patch)) {
    Object.assign(round, patch);
  }
}

/* ---------------------------------------------------------------- */
/* Élimination, devinette, fin de manche                             */
/* ---------------------------------------------------------------- */

async function eliminate(ctx: Ctx, playerId: string): Promise<void> {
  const round = ctx.round!;
  const wasImposter = round.imposter_player_ids.includes(playerId);

  if (wasImposter) {
    // L'imposteur démasqué tente de voler la victoire en devinant le mot.
    const patch = {
      status: "devinette" as const,
      eliminated_player_id: playerId,
      deadline: deadlineIn(ctx.room.settings.guessSeconds),
    };
    if (await patchRound(round.id, { status: round.status }, patch)) Object.assign(round, patch);
    return;
  }

  await finishRound(ctx, playerId, "imposteur");
}

export async function submitGuess(
  ctx: Ctx,
  player: PlayerRow,
  guess: string,
): Promise<{ error?: string }> {
  const round = ctx.round;
  if (!round || round.status !== "devinette") return { error: "Ce n'est pas le moment." };
  if (round.eliminated_player_id !== player.id) return { error: "Ce n'est pas à toi de deviner." };

  const civil = await getCivilWord(round.word_pair_id);
  const correct = !!civil && isCloseEnough(guess, civil);
  await finishRound(ctx, player.id, correct ? "imposteur" : "civils", guess.trim(), correct);
  return {};
}

export async function getCivilWord(pairId: string | null): Promise<string | null> {
  if (!pairId) return null;
  const { data: pair } = await db()
    .from("word_pairs")
    .select("word_civil_id")
    .eq("id", pairId)
    .maybeSingle();
  if (!pair) return null;
  const { data: word } = await db()
    .from("words")
    .select("label")
    .eq("id", pair.word_civil_id)
    .maybeSingle();
  return word?.label ?? null;
}

/** Clôt la manche, applique les scores, passe en écran résultat. */
async function finishRound(
  ctx: Ctx,
  eliminatedId: string | null,
  winner: "civils" | "imposteur" | null,
  guess?: string,
  guessCorrect?: boolean,
): Promise<void> {
  const round = ctx.round!;
  const patch: Partial<RoundRow> = {
    status: "resultat",
    eliminated_player_id: eliminatedId,
    winner,
    imposter_guess: guess ?? null,
    imposter_guess_correct: guessCorrect ?? null,
    deadline: deadlineIn(ctx.room.settings.resultSeconds),
    ended_at: new Date().toISOString(),
  };

  // patchRound conditionne sur le statut : un seul appel gagne la course,
  // donc les scores ne sont appliqués qu'une fois.
  const won = await patchRound(round.id, { status: round.status }, patch);
  if (!won) return;
  Object.assign(round, patch);

  const clues = await getClues(round.id);
  const deltas = scoreDeltasForRound(round, ctx.players, clues);

  await Promise.all(
    ctx.players
      .filter((p) => (deltas[p.id] ?? 0) !== 0)
      .map((p) =>
        db()
          .from("players")
          .update({ score: p.score + deltas[p.id] })
          .eq("id", p.id),
      ),
  );
  ctx.players = ctx.players.map((p) => ({ ...p, score: p.score + (deltas[p.id] ?? 0) }));
}

export async function getClues(roundId: string): Promise<ClueRow[]> {
  const { data } = await db()
    .from("clues")
    .select("*")
    .eq("round_id", roundId)
    .order("turn_number", { ascending: true })
    .order("submitted_at", { ascending: true });
  return (data ?? []) as ClueRow[];
}

/** Adapte les lignes de la base au barème pur de `@/lib/rules`. */
export function scoreDeltasForRound(
  round: RoundRow,
  players: PlayerRow[],
  clues: ClueRow[],
): Record<string, number> {
  return computeScoreDeltas({
    winner: round.winner,
    imposterIds: round.imposter_player_ids,
    eliminatedId: round.eliminated_player_id,
    participantIds: players.filter((p) => !p.is_spectator).map((p) => p.id),
    passedByPlayerId: clues.filter((c) => c.passed).map((c) => c.player_id),
  });
}

/* ---------------------------------------------------------------- */
/* Manche suivante / fin de partie                                   */
/* ---------------------------------------------------------------- */

export async function nextRoundOrEnd(ctx: Ctx): Promise<{ error?: string }> {
  const { game, room, round } = ctx;
  if (!game) return { error: "Aucune partie en cours." };

  const total = room.settings.rounds;
  if (total > 0 && game.current_round >= total) return endGame(ctx);

  if (activePlayers(ctx.players).length < MIN_PLAYERS) {
    // Quorum insuffisant : on ne relance pas, le tick gère la pause.
    return {};
  }
  return startRound(ctx, game.current_round + 1, round?.turn_order ?? null);
}

export async function endGame(ctx: Ctx): Promise<{ error?: string }> {
  if (ctx.game) {
    await db()
      .from("games")
      .update({ status: "terminee", ended_at: new Date().toISOString() })
      .eq("id", ctx.game.id);
    ctx.game.status = "terminee";
  }
  await db().from("rooms").update({ status: "terminee", paused_at: null }).eq("id", ctx.room.id);
  ctx.room.status = "terminee";
  return {};
}

async function cancelGame(ctx: Ctx): Promise<void> {
  if (ctx.game) {
    await db()
      .from("games")
      .update({ status: "annulee", ended_at: new Date().toISOString() })
      .eq("id", ctx.game.id);
    ctx.game.status = "annulee";
  }
  await db().from("rooms").update({ status: "terminee", paused_at: null }).eq("id", ctx.room.id);
  ctx.room.status = "terminee";
}

/* ---------------------------------------------------------------- */
/* Tick : fait avancer l'état quand une échéance est dépassée         */
/* ---------------------------------------------------------------- */

/**
 * Échéance du lobby : `settings.lobbySeconds` à partir de la création de la
 * room. Vaut `null` par défaut (sans limite) — on attend alors que l'hôte
 * lance la partie lui-même.
 */
export function lobbyDeadline(room: RoomRow): string | null {
  const secs = room.settings.lobbySeconds;
  if (!secs || secs <= 0) return null;
  return new Date(new Date(room.created_at).getTime() + secs * 1000).toISOString();
}

export async function tick(ctx: Ctx): Promise<void> {
  // Lobby : lancement automatique seulement si une durée a été configurée.
  if (ctx.room.status === "lobby") {
    if (
      isDue(lobbyDeadline(ctx.room)) &&
      activePlayers(ctx.players).length >= MIN_PLAYERS
    ) {
      await startGame(ctx);
    }
    return;
  }

  if (ctx.room.status !== "en_cours" || !ctx.game || ctx.game.status !== "en_cours") return;

  // Le quorum se juge sur les joueurs encore dans la fenêtre de reconnexion,
  // pas sur le dernier heartbeat : sinon, poser son téléphone dix secondes
  // suffirait à mettre la partie en pause.
  const active = activePlayers(ctx.players);

  /* --- Quorum : pause sous 3 joueurs, annulation au bout de 2 min --- */
  if (active.length < MIN_PLAYERS) {
    if (!ctx.room.paused_at) {
      const now = new Date().toISOString();
      await db().from("rooms").update({ paused_at: now }).eq("id", ctx.room.id);
      ctx.room.paused_at = now;
    } else if (Date.now() - new Date(ctx.room.paused_at).getTime() > PAUSE_CANCEL_MS) {
      await cancelGame(ctx);
    }
    return; // partie gelée tant que le quorum n'est pas rétabli
  }

  if (ctx.room.paused_at) {
    // Reprise : on redonne du temps à la phase en cours.
    await db().from("rooms").update({ paused_at: null }).eq("id", ctx.room.id);
    ctx.room.paused_at = null;
    if (ctx.round && ctx.round.status !== "resultat") {
      const secs = phaseDurationSeconds(ctx.round.status, ctx.room.settings);
      const patch = { deadline: deadlineIn(secs) };
      await patchRound(ctx.round.id, { status: ctx.round.status }, patch);
      Object.assign(ctx.round, patch);
    }
  }

  const round = ctx.round;
  if (!round) return;

  // Sans chrono sur la devinette, la manche resterait bloquée si l'imposteur
  // démasqué s'en va sans répondre : on tranche à sa place.
  if (round.status === "devinette" && round.eliminated_player_id) {
    const caught = ctx.players.find((p) => p.id === round.eliminated_player_id);
    if (!caught || caught.has_left) {
      await finishRound(ctx, round.eliminated_player_id, "civils", undefined, false);
      return;
    }
  }

  // Victoire imposteur s'il ne reste que 2 joueurs en lice dont lui.
  if (round.status !== "resultat") {
    const alive = alivePlayers(ctx.players, round);
    if (alive.length <= 2 && alive.some((p) => round.imposter_player_ids.includes(p.id))) {
      await finishRound(ctx, round.eliminated_player_id, "imposteur");
      return;
    }
  }

  await skipUnplayable(ctx);

  if (!isDue(round.deadline)) return;

  switch (round.status) {
    case "indices":
      await autoPass(ctx);
      break;
    case "discussion": {
      const patch = { status: "vote" as const, deadline: deadlineIn(ctx.room.settings.voteSeconds) };
      if (await patchRound(round.id, { status: "discussion" }, patch)) Object.assign(round, patch);
      break;
    }
    case "vote":
    case "revote":
      await tally(ctx);
      break;
    case "devinette":
      // Pas de réponse à temps : la devinette est ratée.
      await finishRound(ctx, round.eliminated_player_id, "civils", undefined, false);
      break;
    case "resultat":
      await nextRoundOrEnd(ctx);
      break;
  }
}

/** Recharge le contexte, fait tourner le moteur, prévient les clients. */
export async function tickAndBroadcast(code: string): Promise<Ctx | null> {
  const ctx = await loadCtx(code);
  if (!ctx) return null;
  const before = snapshot(ctx);
  await tick(ctx);
  if (snapshot(ctx) !== before) await broadcastRoom(code);
  return ctx;
}

function snapshot(ctx: Ctx): string {
  const r = ctx.round;
  return [
    ctx.room.status,
    ctx.room.paused_at ?? "",
    ctx.game?.current_round ?? "",
    r?.id ?? "",
    r?.status ?? "",
    r?.turn_index ?? "",
    r?.turn_number ?? "",
    r?.vote_round ?? "",
    r?.eliminated_player_id ?? "",
    r?.winner ?? "",
  ].join("|");
}
