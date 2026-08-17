import { db } from "@/server/db";
import { fail, json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";

export const dynamic = "force-dynamic";

type Body = { clue?: { playerId: string; turnNumber: number } };

/**
 * Signalement d'un indice trop évident. Disponible seulement une fois la
 * manche finie, pour ne pas influencer le vote en cours.
 */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  const round = r.ctx.round;
  if (!round) return fail("Aucune manche.", 409);
  if (round.status !== "resultat") return fail("Tu pourras signaler après la manche.", 409);

  const body = await readJson<Body>(req);
  if (!body?.clue) return fail("Indice manquant.");

  const { data: clue } = await db()
    .from("clues")
    .select("id, reported_by")
    .eq("round_id", round.id)
    .eq("player_id", body.clue.playerId)
    .eq("turn_number", body.clue.turnNumber)
    .maybeSingle();

  if (!clue) return fail("Indice introuvable.", 404);

  const reporters: string[] = clue.reported_by ?? [];
  const next = reporters.includes(r.player.id)
    ? reporters.filter((id) => id !== r.player.id)
    : [...reporters, r.player.id];

  await db().from("clues").update({ reported_by: next }).eq("id", clue.id);
  await broadcastRoom(code.toUpperCase());

  return json({ ok: true, reported: next.includes(r.player.id), count: next.length });
}
