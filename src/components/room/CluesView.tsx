"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import { Button, Card, Input, Notice, cx } from "../ui";
import { TimerBar, TimerRing, useCountdown } from "./Timer";
import { WordCard } from "./WordCard";
import { ClueFeed } from "./ClueFeed";
import { IconArrowRight } from "../icons";
import type { RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

export function CluesView({
  state,
  api,
  skew,
}: {
  state: RoomState;
  api: RoomApi;
  skew: number;
}) {
  const round = state.round!;
  const left = useCountdown(round.deadline, skew);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const myTurn = round.currentPlayerId === state.me.id;
  const current = state.players.find((p) => p.id === round.currentPlayerId);
  const currentIndex = round.turnOrder.indexOf(round.currentPlayerId ?? "");

  // Changement de tour : on repart d'un champ vierge dès ce rendu.
  const turnKey = `${round.turnNumber}:${round.currentPlayerId}`;
  const [trackedTurn, setTrackedTurn] = useState(turnKey);
  if (trackedTurn !== turnKey) {
    setTrackedTurn(turnKey);
    setValue("");
    setError(null);
  }

  useEffect(() => {
    if (myTurn) inputRef.current?.focus();
  }, [turnKey, myTurn]);

  async function send() {
    const content = value.trim();
    if (!content) return;
    setBusy(true);
    setError(null);
    const res = await api.post("clue", { content });
    if (!res.ok) setError(res.error ?? "Indice refusé.");
    else setValue("");
    setBusy(false);
  }

  return (
    <div className="space-y-4 pb-40">
      <WordCard word={round.myWord} category={round.category} spectator={state.me.isSpectator} />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-xs font-bold uppercase tracking-widest text-muted">
            Tour d&apos;indices
          </span>
          <span className="shrink-0 rounded-full bg-inku-50 px-2.5 py-1 text-xs font-bold text-inku-700 dark:bg-inku-950 dark:text-inku-200">
            {round.turnNumber}/{round.totalTurns}
          </span>
        </div>

        {round.deadline && (
          <div className="mt-3">
            <TimerBar seconds={left} total={state.settings.timerSeconds} />
          </div>
        )}

        {/* Ordre de passage, avec le statut de chacun */}
        <div className="mt-4 space-y-1.5">
          {round.turnOrder.map((id, i) => {
            const p = state.players.find((x) => x.id === id);
            if (!p) return null;
            const isCurrent = id === round.currentPlayerId;
            const isDone = currentIndex >= 0 && i < currentIndex;
            const isMe = id === state.me.id;
            return (
              <div
                key={id}
                className={cx(
                  "relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 transition-all duration-300",
                  isCurrent
                    ? "border-encre-500/50 bg-gradient-to-r from-encre-500/10 to-transparent"
                    : "border-line bg-transparent",
                  isDone && "opacity-55",
                )}
              >
                <span
                  className={cx(
                    "font-display text-sm font-bold tabular-nums",
                    isCurrent ? "text-encre-500" : "text-muted",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Avatar avatarId={p.avatarId} size={34} ring={isCurrent ? "inku" : "none"} />
                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold">
                  {p.pseudo}
                  {isMe && <span className="ml-1 font-sans text-xs font-semibold text-muted">(toi)</span>}
                </span>
                {isCurrent ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-encre-500/40 bg-encre-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-encre-600 dark:text-encre-400">
                    <span className="h-1.5 w-1.5 animate-[--animate-turn-pulse] rounded-full bg-encre-500" />
                    à {isMe ? "toi" : "lui"}
                  </span>
                ) : isDone ? (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    fait
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted">
                    attend
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grand rappel visuel de qui parle en ce moment */}
      <div className="ink-card radius-blob-c relative overflow-hidden p-4">
        <div aria-hidden="true" className="ink-blob -right-6 -top-4 h-16 w-24" />
        <div className="relative flex items-center gap-3">
          {myTurn ? (
            <TimerRing seconds={left} total={state.settings.timerSeconds} size={48} />
          ) : (
            current && <Avatar avatarId={current.avatarId} size={44} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-encre-500">Maintenant</p>
            <p className="truncate font-display text-lg font-bold leading-tight">
              {myTurn ? "À toi de jouer" : current?.pseudo ?? "…"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-paper-muted">
              {myTurn ? "Un indice, une ligne. Ni trop, ni trop peu." : "réfléchit à son indice…"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <h2 className="mb-3 font-display text-lg font-bold">Les indices</h2>
        <ClueFeed clues={round.clues} players={state.players} meId={state.me.id} totalTurns={round.totalTurns} />
      </Card>

      {myTurn && !state.me.isSpectator && (
        <div className="fixed inset-x-0 bottom-0 space-y-2 border-t border-line bg-bg/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-2xl space-y-2">
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                placeholder="Ton indice…"
                maxLength={60}
                enterKeyHint="send"
                autoComplete="off"
              />
              <Button onClick={send} loading={busy} disabled={!value.trim()} className="shrink-0 px-4">
                <IconArrowRight size={18} />
                <span className="hidden sm:inline">Envoyer</span>
              </Button>
            </div>
            <p className="text-center text-xs text-muted">
              Interdit d&apos;écrire le mot lui-même — le serveur refuse.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
