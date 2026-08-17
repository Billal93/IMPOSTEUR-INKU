import { fail, json } from "@/server/http";
import { getPlayers, getRoomByCode } from "@/server/repo";
import { isValidRoomCode } from "@/lib/text";

export const dynamic = "force-dynamic";

/** Infos publiques d'une room, pour l'écran « rejoindre » (sans session). */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!isValidRoomCode(code.toUpperCase())) return fail("Code invalide.", 400);

  const room = await getRoomByCode(code);
  if (!room) return fail("Aucune room avec ce code.", 404);

  const players = await getPlayers(room.id);
  const present = players.filter((p) => !p.has_left);

  return json({
    code: room.code,
    status: room.status,
    playerCount: present.length,
    maxPlayers: room.settings.maxPlayers,
    settings: room.settings,
    players: present.map((p) => ({ pseudo: p.pseudo, avatarId: p.avatar_id })),
    full: present.length >= room.settings.maxPlayers,
    createdAt: room.created_at,
  });
}
