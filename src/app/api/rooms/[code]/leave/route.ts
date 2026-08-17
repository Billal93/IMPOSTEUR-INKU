import { db } from "@/server/db";
import { json, resolvePlayer } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { ensureHost } from "@/server/repo";

export const dynamic = "force-dynamic";

/**
 * Départ volontaire. Avant lancement, le joueur est simplement retiré ;
 * en cours de partie il est marqué « parti » (son tour sera auto-passé et il
 * sort du quorum de vote). Si c'était l'hôte, le rôle migre au suivant.
 */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code } = await params.params;
  const r = await resolvePlayer(req, code);
  if (!r.ok) return r.response;

  if (r.ctx.room.status === "lobby") {
    await db().from("players").delete().eq("id", r.player.id);
    r.ctx.players = r.ctx.players.filter((p) => p.id !== r.player.id);
  } else {
    await db()
      .from("players")
      .update({ has_left: true, is_connected: false })
      .eq("id", r.player.id);
    r.ctx.players = r.ctx.players.map((p) =>
      p.id === r.player.id ? { ...p, has_left: true, is_connected: false } : p,
    );
  }

  await ensureHost(r.ctx.room, r.ctx.players);
  await broadcastRoom(code.toUpperCase());
  return json({ ok: true });
}
