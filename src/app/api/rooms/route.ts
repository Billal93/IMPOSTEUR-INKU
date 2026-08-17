import { db } from "@/server/db";
import { fail, json, readJson } from "@/server/http";
import { sanitizeSettings } from "@/server/settings";
import { checkPseudo, generateRoomCode, generateSessionToken } from "@/lib/text";
import { AVATARS, DEFAULT_AVATAR, type RoomSettings } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Body = { pseudo?: string; avatarId?: string; settings?: Partial<RoomSettings> };

/** Crée une room et son host. */
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const check = checkPseudo(body?.pseudo ?? "");
  if (!check.ok) return fail(check.reason);

  const avatarId = AVATARS.some((a) => a.id === body?.avatarId) ? body!.avatarId! : DEFAULT_AVATAR;
  const settings = sanitizeSettings(body?.settings);

  // Code unique : on retente quelques fois en cas de collision.
  let code = "";
  let roomId = "";
  for (let i = 0; i < 8; i++) {
    code = generateRoomCode();
    const { data, error } = await db()
      .from("rooms")
      .insert({ code, status: "lobby", settings })
      .select("id")
      .single();
    if (data) {
      roomId = data.id;
      break;
    }
    if (error && !/duplicate key/i.test(error.message)) {
      return fail("Impossible de créer la room pour le moment.", 500);
    }
  }
  if (!roomId) return fail("Impossible de générer un code de room.", 500);

  const token = generateSessionToken();
  const { data: player } = await db()
    .from("players")
    .insert({
      room_id: roomId,
      pseudo: check.value,
      avatar_id: avatarId,
      session_token: token,
      is_connected: true,
      is_ready: true,
    })
    .select("id")
    .single();

  if (!player) return fail("Impossible de te créer dans la room.", 500);

  await db().from("rooms").update({ host_player_id: player.id }).eq("id", roomId);

  return json({ code, playerId: player.id, sessionToken: token });
}
