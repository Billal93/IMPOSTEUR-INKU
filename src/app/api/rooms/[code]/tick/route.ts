import { fail, json } from "@/server/http";
import { tickAndBroadcast } from "@/server/engine";
import { isValidRoomCode } from "@/lib/text";

export const dynamic = "force-dynamic";

/**
 * Fait avancer l'état si une échéance est dépassée.
 * Vercel étant serverless (pas de process long), ce sont les clients qui
 * réveillent le moteur — mais toutes les décisions restent serveur, et les
 * transitions sont conditionnées sur l'état attendu pour rester idempotentes.
 */
export async function POST(_req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  if (!isValidRoomCode(code.toUpperCase())) return fail("Code invalide.", 400);

  const ctx = await tickAndBroadcast(code.toUpperCase());
  if (!ctx) return fail("Room introuvable.", 404);
  return json({ ok: true, status: ctx.round?.status ?? ctx.room.status });
}
