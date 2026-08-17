"use client";

import { create } from "zustand";
import type { RoomState } from "./types";

type Connection = "connecting" | "live" | "offline";

type RoomStore = {
  state: RoomState | null;
  connection: Connection;
  error: string | null;
  /** Décalage horloge client/serveur (ms) pour un timer fiable. */
  clockSkew: number;
  /** Dernier événement local à afficher (toast). */
  toast: { message: string; tone: "info" | "error" | "success" } | null;

  setState: (s: RoomState) => void;
  setConnection: (c: Connection) => void;
  setError: (e: string | null) => void;
  showToast: (message: string, tone?: "info" | "error" | "success") => void;
  clearToast: () => void;
  reset: () => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  state: null,
  connection: "connecting",
  error: null,
  clockSkew: 0,
  toast: null,

  setState: (s) =>
    set({
      state: s,
      error: null,
      clockSkew: new Date(s.serverTime).getTime() - Date.now(),
    }),
  setConnection: (connection) => set({ connection }),
  setError: (error) => set({ error }),
  showToast: (message, tone = "info") => set({ toast: { message, tone } }),
  clearToast: () => set({ toast: null }),
  reset: () => set({ state: null, connection: "connecting", error: null, toast: null }),
}));

/** Sélecteurs pratiques. */
export const selectMe = (s: RoomStore) => s.state?.me ?? null;
export const selectRound = (s: RoomStore) => s.state?.round ?? null;
