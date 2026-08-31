"use client";

import { Card } from "../ui";
import { ClueFeed } from "./ClueFeed";
import { TimerBar, TimerRing, useCountdown } from "./Timer";
import { WordCard } from "./WordCard";
import type { RoomState } from "@/lib/types";

export function DiscussionView({ state, skew }: { state: RoomState; skew: number }) {
  const round = state.round!;
  const left = useCountdown(round.deadline, skew);

  return (
    <div className="space-y-4 pb-24">
      <div className="ink-card radius-blob-c relative animate-[--animate-pop] overflow-hidden p-5">
        <div aria-hidden="true" className="ink-blob -right-7 -top-5 h-20 w-24" />
        <div className="relative flex items-center gap-3">
          <TimerRing seconds={left} total={state.settings.discussionSeconds || 30} />
          <div>
            <h2 className="font-display text-xl font-bold">Discussion libre</h2>
            <p className="text-sm font-semibold text-paper-muted">
              Parlez-vous en vrai. Accusez, défendez-vous, mentez. Le vote arrive.
            </p>
          </div>
        </div>
        <div className="relative mt-3">
          <TimerBar seconds={left} total={state.settings.discussionSeconds || 30} />
        </div>
      </div>

      <Card>
        <h3 className="mb-3 font-display text-base font-bold">Les indices</h3>
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
