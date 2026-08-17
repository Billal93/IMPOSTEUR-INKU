import { db } from "@/server/db";
import { fail, json, readJson, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { buildState } from "@/server/state";
import { sanitizeSettings } from "@/server/settings";
import type { RoomSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Réglages modifiables par l'hôte, uniquement avant le lancement. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  if (r.ctx.room.host_player_id !== r.player.id) return fail("Seul l'hôte règle la partie.", 403);
  if (r.ctx.room.status !== "lobby") return fail("Trop tard, la partie est lancée.", 409);

  const body = await readJson<{ settings?: Partial<RoomSettings> }>(req);
  const settings = sanitizeSettings({ ...r.ctx.room.settings, ...(body?.settings ?? {}) });

  await db().from("rooms").update({ settings }).eq("id", r.ctx.room.id);
  r.ctx.room.settings = settings;

  await broadcastRoom(code.toUpperCase());
  return json(await buildState(r.ctx, r.player));
}
