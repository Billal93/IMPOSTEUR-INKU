import "server-only";
import { NextResponse } from "next/server";
import { loadCtx, type Ctx } from "./engine";
import type { PlayerRow } from "@/lib/types";
import { isValidRoomCode } from "@/lib/text";

export const SESSION_HEADER = "x-session-token";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

export function sessionToken(req: Request): string | null {
  return req.headers.get(SESSION_HEADER);
}

type Resolved =
  | { ok: true; ctx: Ctx; player: PlayerRow }
  | { ok: false; response: NextResponse };

/** Résout la room + le joueur à partir du token de session. */
export async function resolvePlayer(req: Request, rawCode: string): Promise<Resolved> {
  const code = rawCode.toUpperCase();
  if (!isValidRoomCode(code)) return { ok: false, response: fail("Code de room invalide.", 400) };

  const token = sessionToken(req);
  if (!token) return { ok: false, response: fail("Session manquante.", 401) };

  const ctx = await loadCtx(code);
  if (!ctx) return { ok: false, response: fail("Cette room n'existe pas (ou plus).", 404) };

  const player = ctx.players.find((p) => p.session_token === token);
  if (!player) return { ok: false, response: fail("Tu n'es pas dans cette room.", 403) };

  return { ok: true, ctx, player };
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
