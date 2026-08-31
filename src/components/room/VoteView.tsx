"use client";

import { useState } from "react";
import { Avatar } from "../Avatar";
import { Badge, Card, Notice } from "../ui";
import { PlayerTile } from "./PlayerTile";
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
        <Card>
          <h3 className="mb-3 font-display text-base font-bold">
            {round.myVote ? "Ton vote est enregistré" : "Choisis"}
          </h3>
          <div className="space-y-2">
            {candidates.map((p) => (
              <PlayerTile
                key={p.id}
                player={p}
                selected={round.myVote === p.id}
                onClick={() => vote(p.id)}
                dimmed={busy !== null && busy !== p.id}
                right={
                  round.myVote === p.id ? (
                    <Badge tone="inku">ton vote</Badge>
                  ) : undefined
                }
                subtitle={
                  round.clues
                    .filter((c) => c.playerId === p.id && !c.passed)
                    .map((c) => c.content)
                    .join(" · ") || "n'a rien dit"
                }
              />
            ))}
          </div>
          {round.myVote && (
            <p className="mt-3 text-center text-xs text-muted">
              Tu peux encore changer d&apos;avis jusqu&apos;à la fin du temps.
            </p>
          )}
        </Card>
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
