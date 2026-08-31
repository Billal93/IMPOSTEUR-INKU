"use client";

import { useState } from "react";
import { Avatar } from "../Avatar";
import { Card, Notice, cx } from "../ui";
import { TimerBar, TimerRing, useCountdown } from "./Timer";
import { ClueFeed } from "./ClueFeed";
import { WordCard } from "./WordCard";
import { IconCheck } from "../icons";
import type { RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

export function VoteView({ state, api, skew }: { state: RoomState; api: RoomApi; skew: number }) {
  const round = state.round!;
  const left = useCountdown(round.deadline, skew);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRevote = round.status === "revote";
  const total = state.settings.voteSeconds;

  const candidates = state.players.filter((p) => {
    if (!round.alivePlayerIds.includes(p.id)) return false;
    if (p.id === state.me.id) return false;
    if (isRevote && round.revoteCandidateIds.length > 0) {
      return round.revoteCandidateIds.includes(p.id);
    }
    return true;
  });

  const voters = state.players.filter((p) => round.alivePlayerIds.includes(p.id));
  const canVote = round.alivePlayerIds.includes(state.me.id) && !state.me.isSpectator;

  async function vote(targetId: string) {
    setBusy(targetId);
    setError(null);
    const res = await api.post("vote", { targetId });
    if (!res.ok) setError(res.error ?? "Vote refusé.");
    setBusy(null);
  }

  return (
    <div className="space-y-4 pb-24">
      <Card className="animate-[--animate-pop]">
        <div className="flex items-center gap-3">
          {round.deadline && <TimerRing seconds={left} total={total} />}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold">
              {isRevote ? "Revote : égalité !" : "Qui est l'imposteur ?"}
            </h2>
            <p className="text-sm text-muted">
              {isRevote
                ? "On départage entre les ex æquo."
                : "Tout le monde vote en même temps. Personne ne voit rien avant la révélation."}
            </p>
          </div>
        </div>
        {round.deadline && (
          <div className="mt-3">
            <TimerBar seconds={left} total={total} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">Ont voté :</span>
          {voters.map((p) => (
            <span key={p.id} className="relative">
              <Avatar
                avatarId={p.avatarId}
                size={28}
                className={round.votedPlayerIds.includes(p.id) ? "" : "opacity-30"}
              />
              {round.votedPlayerIds.includes(p.id) && (
                <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500 text-white">
                  <IconCheck size={9} />
                </span>
              )}
            </span>
          ))}
          <span className="ml-auto text-xs font-bold text-muted">
            {round.votedPlayerIds.length}/{voters.length}
          </span>
        </div>
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      {canVote ? (
        <div>
          <h3 className="mb-3 font-display text-base font-bold">
            {round.myVote ? "Ton vote est enregistré" : "Choisis"}
          </h3>
          <div className="space-y-2.5">
            {candidates.map((p, i) => {
              const selected = round.myVote === p.id;
              const clue = round.clues.find((c) => c.playerId === p.id && !c.passed)?.content;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => vote(p.id)}
                  disabled={busy !== null && busy !== p.id}
                  className={cx(
                    i % 2 === 0 ? "radius-blob-a" : "radius-blob-b",
                    "flex w-full items-center gap-3 border p-3.5 text-left transition-all duration-200 active:scale-[0.98] disabled:opacity-40",
                    selected
                      ? "rotate-[-0.4deg] border-encre-500 bg-encre-500/[0.06] shadow-[0_10px_26px_-14px_rgba(236,72,153,0.55)]"
                      : "border-line bg-surface hover:border-inku-300 dark:hover:border-inku-700",
                  )}
                >
                  <Avatar avatarId={p.avatarId} size={44} ring={selected ? "imposteur" : "none"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] font-bold">{p.pseudo}</div>
                    <div className="truncate text-xs text-muted">{clue ?? "n'a rien dit"}</div>
                  </div>
                  <span
                    className={cx(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      selected ? "border-encre-500" : "border-line",
                    )}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-encre-500" />}
                  </span>
                </button>
              );
            })}
          </div>
          {round.myVote && (
            <p className="mt-3 text-center text-xs text-muted">
              Tu peux encore changer d&apos;avis jusqu&apos;à la fin du temps.
            </p>
          )}
        </div>
      ) : (
        <Notice tone="info">
          Tu ne participes pas à ce vote. Regarde le carnage tranquillement.
        </Notice>
      )}

      <Card>
        <h3 className="mb-3 font-display text-base font-bold">Rappel des indices</h3>
        <ClueFeed
          clues={round.clues}
          players={state.players}
          meId={state.me.id}
          totalTurns={round.totalTurns}
        />
      </Card>

      <WordCard
        word={round.myWord}
        category={round.category}
        spectator={state.me.isSpectator}
      />
    </div>
  );
}
