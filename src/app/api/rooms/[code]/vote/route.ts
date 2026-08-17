import { fail, json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { submitVote } from "@/server/engine";
import { buildState } from "@/server/state";

export const dynamic = "force-dynamic";

type Body = { targetId?: string };

/** Vote caché : le serveur ne renvoie jamais les cibles avant dépouillement. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  const body = await readJson<Body>(req);
  if (!body?.targetId) return fail("Choisis quelqu'un.");

  const res = await submitVote(r.ctx, r.player, body.targetId);
  if (res.error) return fail(res.error, 409);

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
