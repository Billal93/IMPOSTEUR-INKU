import { fail, json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { getCivilWord, submitClue } from "@/server/engine";
import { buildState } from "@/server/state";
import { checkClue } from "@/lib/text";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

type Body = { content?: string };

/**
 * Dépose l'indice du joueur dont c'est le tour.
 * La validation anti-triche est faite ici, côté serveur : le client ne
 * connaît pas le mot des autres et ne peut pas contourner le filtre.
 */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  const body = await readJson<Body>(req);
  const content = (body?.content ?? "").toString();

  const round = r.ctx.round;
  if (!round) return fail("Aucune manche en cours.", 409);

  // Le mot à protéger est celui que ce joueur a reçu.
  const isImposter = round.imposter_player_ids.includes(r.player.id);
  const secret = isImposter
    ? await getImposterWord(round.word_pair_id)
    : await getCivilWord(round.word_pair_id);

  const check = checkClue(content, secret ?? "");
  if (!check.ok) return fail(check.reason, 422);

  const res = await submitClue(r.ctx, r.player, content);
  if (res.error) return fail(res.error, 409);

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}

async function getImposterWord(pairId: string | null): Promise<string | null> {
  if (!pairId) return null;
  const { data: pair } = await db()
    .from("word_pairs")
    .select("word_imposter_id")
    .eq("id", pairId)
    .maybeSingle();
  if (!pair) return null;
  const { data: word } = await db()
    .from("words")
    .select("label")
    .eq("id", pair.word_imposter_id)
    .maybeSingle();
  return word?.label ?? null;
}
