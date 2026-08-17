"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Token de session stocké côté client : c'est lui qui permet de retrouver sa
 * place après un refresh ou une coupure réseau (fenêtre de reconnexion).
 */
const KEY = "imposteur:sessions";
const PROFILE_KEY = "imposteur:profile";

export type StoredSession = {
  token: string;
  playerId: string;
  pseudo: string;
  avatarId: string;
};

type Store = Record<string, StoredSession>;

/* --- abonnement local, pour que React voie les changements sans effet --- */

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function rawItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/* ------------------------------ Sessions ------------------------------ */

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(rawItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* stockage plein ou bloqué : on continue sans persistance */
  }
  emit();
}

export function saveSession(code: string, data: StoredSession) {
  const store = read();
  store[code.toUpperCase()] = data;
  write(store);
}

export function getSession(code: string): StoredSession | null {
  return read()[code.toUpperCase()] ?? null;
}

export function clearSession(code: string) {
  const store = read();
  delete store[code.toUpperCase()];
  write(store);
}

/** Lecture réactive, sans effet (évite les cascades de rendu). */
export function useSession(code: string): StoredSession | null | undefined {
  const raw = useSyncExternalStore(
    subscribe,
    () => rawItem(KEY),
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined; // rendu serveur : on ne sait pas encore
    try {
      return (JSON.parse(raw ?? "{}") as Store)[code.toUpperCase()] ?? null;
    } catch {
      return null;
    }
  }, [raw, code]);
}

/* ------------------------------- Profil ------------------------------- */

export function saveProfile(pseudo: string, avatarId: string) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ pseudo, avatarId }));
  } catch {
    /* ignore */
  }
  emit();
}

export function getProfile(): { pseudo: string; avatarId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = rawItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as { pseudo: string; avatarId: string }) : null;
  } catch {
    return null;
  }
}

/** Dernier profil utilisé, pour pré-remplir pseudo/avatar. */
export function useProfile(): { pseudo: string; avatarId: string } | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => rawItem(PROFILE_KEY),
    () => null,
  );
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { pseudo: string; avatarId: string };
    } catch {
      return null;
    }
  }, [raw]);
}
