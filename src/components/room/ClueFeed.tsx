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
            <ul className="space-y-2">
              {list.map((c) => {
                const p = players.find((x) => x.id === c.playerId);
                if (!p) return null;
                return (
                  <li
                    key={`${c.playerId}-${c.turnNumber}`}
                    className="flex animate-[--animate-fade-up] items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5"
                  >
                    <Avatar avatarId={p.avatarId} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-muted">{p.pseudo}</div>
                      <div
                        className={cx(
                          "truncate font-display text-[15px] font-bold",
                          c.passed && "italic text-muted",
                        )}
                      >
                        {c.passed ? "a passé son tour" : c.content}
                      </div>
                    </div>
                    {c.playerId === meId && <Badge>toi</Badge>}
                    {onReport && !c.passed && c.playerId !== meId && (
                      <button
                        type="button"
                        onClick={() => onReport(c)}
                        aria-label="Signaler cet indice"
                        className={cx(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition active:scale-95",
                          c.reported
                            ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950"
                            : "border-line text-muted hover:text-rose-500",
                        )}
                      >
                        <IconFlag size={14} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </div>
  );
}
