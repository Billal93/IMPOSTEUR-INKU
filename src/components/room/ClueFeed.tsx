"use client";

import { Avatar } from "../Avatar";
import { Badge, cx } from "../ui";
import { IconFlag } from "../icons";
import type { PublicClue, PublicPlayer } from "@/lib/types";

export function ClueFeed({
  clues,
  players,
  meId,
  totalTurns,
  onReport,
}: {
  clues: PublicClue[];
  players: PublicPlayer[];
  meId: string;
  totalTurns: number;
  onReport?: (clue: PublicClue) => void;
}) {
  if (clues.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
        Aucun indice pour l&apos;instant. Ça commence.
      </p>
    );
  }

  const byTurn = new Map<number, PublicClue[]>();
  for (const c of clues) {
    const list = byTurn.get(c.turnNumber) ?? [];
    list.push(c);
    byTurn.set(c.turnNumber, list);
  }

  return (
    <div className="space-y-4">
      {[...byTurn.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([turn, list]) => (
          <div key={turn}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                Tour {turn}
                {totalTurns > 1 ? ` / ${totalTurns}` : ""}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <ul className="space-y-2.5">
              {list.map((c, i) => {
                const p = players.find((x) => x.id === c.playerId);
                if (!p) return null;
                const rightTail = i % 2 === 1;
                return (
                  <li
                    key={`${c.playerId}-${c.turnNumber}`}
                    className="flex animate-[--animate-fade-up] items-start gap-2.5"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {!rightTail && <Avatar avatarId={p.avatarId} size={30} className="mt-0.5 shrink-0" />}
                    <div
                      className={cx(
                        "ink-card relative min-w-0 flex-1 px-3.5 py-2.5",
                        rightTail ? "radius-blob-b bubble-tail-right" : "radius-blob-a bubble-tail-left",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[11px] font-bold uppercase tracking-wide text-paper-muted">
                          {p.pseudo}
                        </span>
                        {c.playerId === meId && <Badge tone="inku">toi</Badge>}
                        {onReport && !c.passed && c.playerId !== meId && (
                          <button
                            type="button"
                            onClick={() => onReport(c)}
                            aria-label="Signaler cet indice"
                            className={cx(
                              "ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full transition active:scale-90",
                              c.reported ? "text-rose-600" : "text-paper-muted/60 hover:text-rose-500",
                            )}
                          >
                            <IconFlag size={12} />
                          </button>
                        )}
                      </div>
                      <div
                        className={cx(
                          "mt-0.5 truncate font-display text-base font-bold",
                          c.passed && "italic text-paper-muted",
                        )}
                      >
                        {c.passed ? "a passé son tour" : c.content}
                      </div>
                    </div>
                    {rightTail && <Avatar avatarId={p.avatarId} size={30} className="mt-0.5 shrink-0" />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );
}
