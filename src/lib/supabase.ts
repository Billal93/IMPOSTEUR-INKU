"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Client navigateur : sert uniquement au Realtime et à la session anonyme. */
export function supabaseBrowser(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "imposteur:auth" },
    realtime: { params: { eventsPerSecond: 12 } },
  });
  return client;
}

/**
 * Session Supabase anonyme : zéro friction (pas de compte à créer) mais
 * chaque joueur a bien une identité côté Supabase.
 */
export async function ensureAnonSession(): Promise<void> {
  const sb = supabaseBrowser();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    if (!data.session) await sb.auth.signInAnonymously();
  } catch {
    // Auth anonyme désactivée : le Realtime fonctionne quand même avec la clé anon.
  }
}

export function roomTopic(code: string): string {
  return `imposteur:room:${code.toUpperCase()}`;
}
