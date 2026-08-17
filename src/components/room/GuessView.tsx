"use client";

import { useState } from "react";
import { Avatar } from "../Avatar";
import { Mascot } from "../Mascot";
import { Button, Card, Input, Notice } from "../ui";
import { TimerBar, useCountdown } from "./Timer";
import type { RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

/** L'imposteur démasqué joue sa dernière carte : deviner le mot des civils. */
export function GuessView({ state, api, skew }: { state: RoomState; api: RoomApi; skew: number }) {
  const round = state.round!;
  const left = useCountdown(round.deadline, skew);
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const caught = state.players.find((p) => p.id === round.eliminatedPlayerId);
  const isMe = round.eliminatedPlayerId === state.me.id;

  async function send() {
    if (!guess.trim()) return;
    setBusy(true);
    setError(null);
    const res = await api.post("guess", { guess: guess.trim() });
    if (!res.ok) setError(res.error ?? "Réponse refusée.");
    setBusy(false);
  }

  return (
    <div className="space-y-4 pb-24">
      <Card className="animate-[--animate-pop] border-rose-300 bg-gradient-to-br from-rose-50 to-inku-50 text-center dark:border-rose-900 dark:from-rose-950/50 dark:to-inku-950/50">
        <div className="mx-auto w-fit animate-[--animate-float]">
          <Mascot
            def={{ body: "#6B21D6", accent: "#F43F5E", accessory: "mask" }}
            size={80}
            eyes="sneaky"
          />
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold">Imposteur démasqué !</h2>
        <div className="mt-2 flex items-center justify-center gap-2">
          {caught && <Avatar avatarId={caught.avatarId} size={30} ring="imposteur" />}
          <span className="font-display font-bold">{caught?.pseudo}</span>
        </div>
        <p className="mt-3 text-sm text-muted">
          {isMe
            ? "Dernière chance : devine le mot des civils et tu voles la victoire."
            : "Il a une seule tentative pour deviner votre mot. Croisez les doigts."}
        </p>
        {round.deadline && (
          <div className="mt-4">
            <TimerBar seconds={left} total={state.settings.guessSeconds} />
          </div>
        )}
      </Card>

      {isMe ? (
        <Card>
          <label htmlFor="guess" className="mb-2 block font-display text-sm font-bold">
            Le mot des civils, c&apos;était…
          </label>
          <div className="flex gap-2">
            <Input
              id="guess"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Écris le mot exact"
              maxLength={60}
              autoFocus
              enterKeyHint="send"
            />
            <Button onClick={send} loading={busy} disabled={!guess.trim()}>
              Valider
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Une petite faute de frappe passe. Un mot à côté, non.
          </p>
          {error && (
            <div className="mt-3">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </Card>
      ) : (
        <Card className="text-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-inku-200 border-t-inku-600" />
          <p className="mt-3 text-sm text-muted">Il réfléchit…</p>
        </Card>
      )}
    </div>
  );
}
