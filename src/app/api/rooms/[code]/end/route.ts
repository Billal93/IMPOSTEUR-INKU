import { fail, json, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { endGame } from "@/server/engine";
import { buildState } from "@/server/state";

export const dynamic = "force-dynamic";

/** Arrêt manuel de la partie (mode manches illimitées) — host uniquement. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;
  if (r.ctx.room.host_player_id !== r.player.id) return fail("Seul l'hôte peut arrêter.", 403);

  await endGame(r.ctx);
  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
