import "server-only";

/**
 * Pousse un événement sur le canal Realtime de la room.
 *
 * On ne diffuse jamais de contenu sensible : l'événement est un simple signal
 * (« l'état a changé »), chaque client va ensuite chercher sa propre vue de
 * l'état via /api/rooms/[code]/state, filtrée selon son rôle. Impossible donc
 * de lire le mot ou l'identité de l'imposteur en écoutant le canal.
 */
export type RoomEvent =
  | "state"      // l'état a changé, refetch
  | "chat";      // réservé (discussion libre)

export function roomTopic(code: string): string {
  return `imposteur:room:${code.toUpperCase()}`;
}

export async function broadcastRoom(
  code: string,
  event: RoomEvent = "state",
  payload: Record<string, unknown> = {},
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: roomTopic(code),
            event,
            payload: { ...payload, at: Date.now() },
          },
        ],
      }),
      // Un échec de broadcast ne doit jamais casser une action de jeu :
      // les clients repassent de toute façon par un polling de secours.
      cache: "no-store",
    });
    if (!res.ok && process.env.NODE_ENV !== "production") {
      console.warn("[broadcast] échec", res.status, await res.text());
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[broadcast] erreur", err);
  }
}
