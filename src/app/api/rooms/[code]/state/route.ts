import { db } from "@/server/db";
import { fail, json, sessionToken } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { loadCtx, tick } from "@/server/engine";
import { buildState } from "@/server/state";
import { isValidRoomCode } from "@/lib/text";

export const dynamic = "force-dynamic";

/**
 * Snapshot de l'état, filtré pour le joueur qui demande.
 * Sert aussi de heartbeat (last_seen_at) et fait tourner le moteur si une
 * échéance est dépassée — l'autorité reste côté serveur.
 */
export async function GET(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params.params;
  const code = raw.toUpperCase();
  if (!isValidRoomCode(code)) return fail("Code de room invalide.", 400);

  const token = sessionToken(req);
  if (!token) return fail("Session manquante.", 401);

  const ctx = await loadCtx(code);
  if (!ctx) return fail("Cette room n'existe pas (ou plus).", 404);

  let me = ctx.players.find((p) => p.session_token === token);
  if (!me) return fail("Tu n'es pas dans cette room.", 403);

  // Heartbeat : marque le joueur comme présent.
  const now = new Date().toISOString();
  const wasAway = !me.is_connected || me.has_left;
  await db()
    .from("players")
    .update({ last_seen_at: now, is_connected: true, has_left: false })
    .eq("id", me.id);
  me = { ...me, last_seen_at: now, is_connected: true, has_left: false };
  ctx.players = ctx.players.map((p) => (p.id === me!.id ? me! : p));

  const before = ctx.round?.status;
  await tick(ctx);
  const changed = wasAway || before !== ctx.round?.status;

  // Le joueur revient d'une déconnexion : les autres doivent le revoir.
  if (changed) await broadcastRoom(code);

  const state = await buildState(ctx, me);
  return json(state);
}
