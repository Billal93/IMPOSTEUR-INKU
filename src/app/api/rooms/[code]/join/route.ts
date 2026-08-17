import { db } from "@/server/db";
import { fail, json, readJson, sessionToken } from "@/server/http";
import { broadcastRoom } from "@/server/broadcast";
import { loadCtx } from "@/server/engine";
import { checkPseudo, generateSessionToken, isValidRoomCode, normalize } from "@/lib/text";
import { AVATARS, DEFAULT_AVATAR } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Body = { pseudo?: string; avatarId?: string };

/** Rejoint une room. Si la partie est lancée, on entre en spectateur. */
export async function POST(req: Request, params: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params.params;
  const code = raw.toUpperCase();
  if (!isValidRoomCode(code)) return fail("Code de room invalide.");

  const body = await readJson<Body>(req);

  const ctx = await loadCtx(code);
  if (!ctx) return fail("Aucune room avec ce code.", 404);
  if (ctx.room.status === "terminee") return fail("Cette partie est déjà terminée.", 409);

  // Reconnexion : même token de session, on récupère sa place.
  const existing = sessionToken(req);
  if (existing) {
    const mine = ctx.players.find((p) => p.session_token === existing);
    if (mine) {
      await db()
        .from("players")
        .update({ is_connected: true, has_left: false, last_seen_at: new Date().toISOString() })
        .eq("id", mine.id);
      await broadcastRoom(code);
      // On renvoie l'identité que le serveur connaît : le client ne doit pas
      // garder en mémoire un pseudo qui ne correspond plus à sa place.
      return json({
        code,
        playerId: mine.id,
        sessionToken: existing,
        pseudo: mine.pseudo,
        avatarId: mine.avatar_id,
        reconnected: true,
      });
    }
  }

  const check = checkPseudo(body?.pseudo ?? "");
  if (!check.ok) return fail(check.reason);

  const present = ctx.players.filter((p) => !p.has_left);
  if (present.length >= ctx.room.settings.maxPlayers) return fail("La room est pleine.", 409);
  if (present.some((p) => normalize(p.pseudo) === normalize(check.value))) {
    return fail("Ce pseudo est déjà pris ici. Trouve une variante.");
  }

  const avatarId = AVATARS.some((a) => a.id === body?.avatarId) ? body!.avatarId! : DEFAULT_AVATAR;
  const token = generateSessionToken();
  // Partie déjà lancée : on regarde la manche en cours, on joue la suivante.
  const spectator = ctx.room.status === "en_cours";

  const { data: player, error } = await db()
    .from("players")
    .insert({
      room_id: ctx.room.id,
      pseudo: check.value,
      avatar_id: avatarId,
      session_token: token,
      is_connected: true,
      is_spectator: spectator,
    })
    .select("id")
    .single();

  if (error || !player) return fail("Impossible de rejoindre pour le moment.", 500);

  if (!ctx.room.host_player_id) {
    await db().from("rooms").update({ host_player_id: player.id }).eq("id", ctx.room.id);
  }

  await broadcastRoom(code);
  return json({
    code,
    playerId: player.id,
    sessionToken: token,
    pseudo: check.value,
    avatarId,
    spectator,
  });
}
