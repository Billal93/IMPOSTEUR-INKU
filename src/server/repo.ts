import "server-only";
import { db } from "./db";
import type { GameRow, PlayerRow, RoomRow, RoundRow } from "@/lib/types";
import { DEFAULT_SETTINGS, HEARTBEAT_STALE_MS, DISCONNECT_GRACE_MS } from "@/lib/constants";
import type { RoomSettings } from "@/lib/constants";

/* ------------------------------ Lectures ------------------------------ */

export async function getRoomByCode(code: string): Promise<RoomRow | null> {
  const { data } = await db()
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!data) return null;
  return { ...data, settings: withDefaults(data.settings) } as RoomRow;
}

export function withDefaults(settings: Partial<RoomSettings> | null): RoomSettings {
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}

export async function getPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data } = await db()
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  return (data ?? []) as PlayerRow[];
}

export async function getCurrentGame(roomId: string): Promise<GameRow | null> {
  const { data } = await db()
    .from("games")
    .select("*")
    .eq("room_id", roomId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as GameRow) ?? null;
}

export async function getCurrentRound(gameId: string): Promise<RoundRow | null> {
  const { data } = await db()
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as RoundRow) ?? null;
}

export async function getRecentImposterIds(gameId: string, lastN = 2): Promise<string[]> {
  const { data } = await db()
    .from("rounds")
    .select("imposter_player_ids")
    .eq("game_id", gameId)
    .order("round_number", { ascending: false })
    .limit(lastN);
  return (data ?? []).flatMap((r) => (r.imposter_player_ids ?? []) as string[]);
}

/* --------------------------- Filtres joueurs --------------------------- */

/** Joueurs qui comptent pour la partie : présents, pas spectateurs. */
export function activePlayers(players: PlayerRow[]): PlayerRow[] {
  return players.filter((p) => !p.has_left && !p.is_spectator);
}

/** Joueurs en lice dans la manche : actifs et pas encore éliminés. */
export function alivePlayers(players: PlayerRow[], round: RoundRow | null): PlayerRow[] {
  const active = activePlayers(players);
  if (!round?.eliminated_player_id) return active;
  return active.filter((p) => p.id !== round.eliminated_player_id);
}

export function isOnline(p: PlayerRow, now = Date.now()): boolean {
  return !p.has_left && now - new Date(p.last_seen_at).getTime() < HEARTBEAT_STALE_MS;
}

/**
 * Met à jour is_connected / has_left à partir des heartbeats.
 * Renvoie la liste rafraîchie (sans relire la base).
 */
export async function syncPresence(players: PlayerRow[]): Promise<PlayerRow[]> {
  const now = Date.now();
  const updates: { id: string; is_connected: boolean; has_left: boolean }[] = [];

  const next = players.map((p) => {
    const age = now - new Date(p.last_seen_at).getTime();
    const connected = !p.has_left && age < HEARTBEAT_STALE_MS;
    const left = p.has_left || age > DISCONNECT_GRACE_MS;
    if (connected !== p.is_connected || left !== p.has_left) {
      updates.push({ id: p.id, is_connected: connected && !left, has_left: left });
      return { ...p, is_connected: connected && !left, has_left: left };
    }
    return p;
  });

  await Promise.all(
    updates.map((u) =>
      db()
        .from("players")
        .update({ is_connected: u.is_connected, has_left: u.has_left })
        .eq("id", u.id),
    ),
  );

  return next;
}

/**
 * Le host a quitté ? On migre vers le joueur suivant par ordre d'arrivée.
 * Renvoie l'id du host courant.
 */
export async function ensureHost(room: RoomRow, players: PlayerRow[]): Promise<string | null> {
  const present = players.filter((p) => !p.has_left);
  const current = present.find((p) => p.id === room.host_player_id);
  if (current) return current.id;

  const next = present[0] ?? null;
  await db()
    .from("rooms")
    .update({ host_player_id: next?.id ?? null })
    .eq("id", room.id);
  room.host_player_id = next?.id ?? null;
  return next?.id ?? null;
}

/* --------------------------- Écritures utiles --------------------------- */

/**
 * Update conditionnel sur une manche : n'applique le patch que si la manche
 * est toujours dans l'état attendu. Protège des doubles avancements quand
 * plusieurs clients déclenchent le tick en même temps.
 */
export async function patchRound(
  roundId: string,
  expect: Partial<Pick<RoundRow, "status" | "turn_index" | "turn_number" | "vote_round">>,
  patch: Partial<RoundRow>,
): Promise<boolean> {
  let q = db().from("rounds").update(patch).eq("id", roundId);
  for (const [k, v] of Object.entries(expect)) q = q.eq(k, v as never);
  const { data } = await q.select("id");
  return (data?.length ?? 0) > 0;
}

export function secondsFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function isDue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() <= Date.now();
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
