"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import { Button, Card, Input, Notice } from "../ui";
import { TimerBar, TimerRing, useCountdown } from "./Timer";
import { WordCard } from "./WordCard";
import { ClueFeed } from "./ClueFeed";
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
      <WordCard
        word={round.myWord}
        isImposter={round.iAmImposter}
        category={round.category}
        spectator={state.me.isSpectator}
      />

      <Card>
        <div className="flex items-center gap-3">
          {round.deadline && <TimerRing seconds={left} total={state.settings.timerSeconds} />}
          <div className="min-w-0 flex-1">
            {myTurn ? (
              <>
                <p className="font-display text-lg font-bold">À toi de jouer</p>
                <p className="text-sm text-muted">Un indice, une ligne. Ni trop, ni trop peu.</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 font-display text-lg font-bold">
                  {current && <Avatar avatarId={current.avatarId} size={26} />}
                  <span className="truncate">{current?.pseudo ?? "…"}</span>
                </p>
                <p className="text-sm text-muted">réfléchit à son indice…</p>
              </>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-inku-50 px-2.5 py-1 text-xs font-bold text-inku-700 dark:bg-inku-950 dark:text-inku-200">
            Tour {round.turnNumber}/{round.totalTurns}
          </span>
        </div>

        {round.deadline && (
          <div className="mt-3">
            <TimerBar seconds={left} total={state.settings.timerSeconds} />
          </div>
        )}

        {/* Ordre de passage */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {round.turnOrder.map((id, i) => {
            const p = state.players.find((x) => x.id === id);
            if (!p) return null;
            const done = i < round.turnOrder.indexOf(round.currentPlayerId ?? "");
            const isCurrent = id === round.currentPlayerId;
            return (
              <Avatar
                key={id}
                avatarId={p.avatarId}
                size={30}
                ring={isCurrent ? "inku" : "none"}
                className={done ? "opacity-40" : isCurrent ? "" : "opacity-70"}
              />
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg font-bold">Les indices</h2>
        <ClueFeed
          clues={round.clues}
          players={state.players}
          meId={state.me.id}
          totalTurns={round.totalTurns}
        />
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
              <Button onClick={send} loading={busy} disabled={!value.trim()}>
                Envoyer
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
