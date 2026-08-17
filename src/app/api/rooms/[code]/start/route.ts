import { fail, json, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { startGame } from "@/server/engine";
import { buildState } from "@/server/state";

export const dynamic = "force-dynamic";

/** Lancement de la partie — host uniquement. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;
  if (r.ctx.room.host_player_id !== r.player.id) return fail("Seul l'hôte peut lancer.", 403);

  const res = await startGame(r.ctx);
  if (res.error) return fail(res.error, 409);

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
