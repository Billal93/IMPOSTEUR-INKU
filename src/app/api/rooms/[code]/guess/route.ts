import { fail, json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { submitGuess } from "@/server/engine";
import { buildState } from "@/server/state";

export const dynamic = "force-dynamic";

type Body = { guess?: string };

/** Dernière chance de l'imposteur démasqué : deviner le mot des civils. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  const body = await readJson<Body>(req);
  const guess = (body?.guess ?? "").toString().trim();
  if (!guess) return fail("Écris ta réponse.");
  if (guess.length > 60) return fail("Trop long.");

  const res = await submitGuess(r.ctx, r.player, guess);
  if (res.error) return fail(res.error, 409);

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
