import { db } from "@/server/db";
import { json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { buildState } from "@/server/state";

export const dynamic = "force-dynamic";

/** Bascule le statut « prêt » dans le lobby. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  const body = await readJson<{ ready?: boolean }>(req);
  const ready = body?.ready ?? !r.player.is_ready;

  await db().from("players").update({ is_ready: ready }).eq("id", r.player.id);
  r.player.is_ready = ready;
  r.ctx.players = r.ctx.players.map((p) => (p.id === r.player.id ? { ...p, is_ready: ready } : p));

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
