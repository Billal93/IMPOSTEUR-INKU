"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRoomStore } from "./store";
import { getSession } from "./session";
import { ensureAnonSession, roomTopic, supabaseBrowser } from "./supabase";
import type { RoomState } from "./types";

const POLL_ACTIVE_MS = 2500;
const POLL_IDLE_MS = 6000;
/** Onglet en arrière-plan : juste assez pour rester dans la fenêtre de grâce. */
const POLL_HIDDEN_MS = 15000;

export type RoomApi = {
  refresh: () => Promise<RoomState | null>;
  post: (path: string, body?: unknown) => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Branche le client sur une room :
 * - canal Supabase Realtime (broadcast + presence) pour être réveillé
 *   dès qu'un autre joueur agit,
 * - polling de secours qui sert aussi de heartbeat et fait tourner le
 *   moteur serveur quand un timer arrive à échéance.
 *
 * Le canal ne transporte jamais de données de jeu : à chaque signal, on
 * refetch /state, qui renvoie une vue filtrée selon notre rôle.
 */
export function useRoom(code: string): RoomApi {
  const setState = useRoomStore((s) => s.setState);
  const setConnection = useRoomStore((s) => s.setConnection);
  const setError = useRoomStore((s) => s.setError);
  const inflight = useRef(false);
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<RoomState | null> => {
    const session = getSession(code);
    if (!session) {
      setError("Session introuvable. Rejoins la room à nouveau.");
      return null;
    }
    if (inflight.current) return null;
    inflight.current = true;
    try {
      const res = await fetch(`/api/rooms/${code}/state`, {
        headers: { "x-session-token": session.token },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Connexion perdue.");
        setConnection("offline");
        return null;
      }
      if (mounted.current) {
        setState(data as RoomState);
        setConnection("live");
      }
      return data as RoomState;
    } catch {
      setConnection("offline");
      return null;
    } finally {
      inflight.current = false;
    }
  }, [code, setState, setConnection, setError]);

  const post = useCallback(
    async (path: string, body?: unknown) => {
      const session = getSession(code);
      if (!session) return { ok: false, error: "Session introuvable." };
      try {
        const res = await fetch(`/api/rooms/${code}/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-session-token": session.token },
          body: JSON.stringify(body ?? {}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data?.error ?? "Action refusée." };
        if (data && typeof data === "object" && "code" in data) setState(data as RoomState);
        return { ok: true };
      } catch {
        return { ok: false, error: "Réseau indisponible." };
      }
    },
    [code, setState],
  );

  // Realtime + polling
  useEffect(() => {
    mounted.current = true;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    void ensureAnonSession();
    void refresh();

    const sb = supabaseBrowser();
    if (sb) {
      const session = getSession(code);
      channel = sb.channel(roomTopic(code), {
        config: { presence: { key: session?.playerId ?? crypto.randomUUID() } },
      });
      channel
        .on("broadcast", { event: "state" }, () => void refresh())
        .on("presence", { event: "sync" }, () => void refresh())
        .on("presence", { event: "join" }, () => void refresh())
        .on("presence", { event: "leave" }, () => void refresh())
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void channel?.track({ playerId: session?.playerId, at: Date.now() });
          }
        });
    }

    // Boucle de secours : heartbeat + réveil du moteur pour les timers.
    // Même onglet en arrière-plan, on continue à se signaler : c'est ce qui
    // évite d'être considéré parti après quelques secondes sur mobile.
    const loop = () => {
      const st = useRoomStore.getState().state;
      const visible = document.visibilityState === "visible";
      const playing = st?.status === "en_cours" && !!st.round?.deadline;
      const delay = !visible ? POLL_HIDDEN_MS : playing ? POLL_ACTIVE_MS : POLL_IDLE_MS;
      timer = setTimeout(async () => {
        await refresh();
        loop();
      }, delay);
    };
    loop();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      mounted.current = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      if (channel) void supabaseBrowser()?.removeChannel(channel);
    };
  }, [code, refresh]);

  return { refresh, post };
}

/** Déclenche le moteur serveur quand un timer local arrive à zéro. */
export function useDeadlineTick(code: string, deadline: string | null, skew: number) {
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const ms = new Date(deadline).getTime() - (Date.now() + skew);
    // Petit délai aléatoire : évite que tous les clients tapent en même temps.
    const jitter = 250 + Math.random() * 600;
    const id = setTimeout(() => {
      if (fired.current === deadline) return;
      fired.current = deadline;
      void fetch(`/api/rooms/${code}/tick`, { method: "POST" });
    }, Math.max(0, ms) + jitter);
    return () => clearTimeout(id);
  }, [code, deadline, skew]);
}
