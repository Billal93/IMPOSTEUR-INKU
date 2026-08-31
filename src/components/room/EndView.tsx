"use client";

import Link from "next/link";
import { Avatar } from "../Avatar";
import { Mascot } from "../Mascot";
import { Button, cx } from "../ui";
import { IconTrophy } from "../icons";
import type { RoomState } from "@/lib/types";

export function EndView({ state }: { state: RoomState }) {
  const board = state.leaderboard ?? [];
  const top = board[0];
  const meRank = board.findIndex((b) => b.playerId === state.me.id) + 1;

  return (
    <div className="space-y-4 pb-28">
      <div className="ink-card radius-blob-a relative animate-pop overflow-hidden p-6 text-center">
        <div aria-hidden="true" className="ink-blob -left-8 -top-6 h-28 w-32" />
        <div className="relative mx-auto w-fit animate-float">
          <Mascot expression="content" size={108} />
        </div>
        <h2 className="relative mt-2 font-display text-2xl font-bold">Partie terminée</h2>
        {top && (
          <p className="relative mt-1 text-sm font-semibold text-paper-muted">
            <span className="font-display font-bold text-paper-ink">{top.pseudo}</span> rafle la mise
            avec {top.score} pt{top.score > 1 ? "s" : ""}.
          </p>
        )}
        {meRank > 0 && (
          <p className="relative mt-1 text-sm font-semibold text-paper-muted">
            Toi, tu finis {meRank}
            {meRank === 1 ? "er" : "e"}.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <IconTrophy size={18} /> Classement
        </h3>
        <ol className="space-y-2">
          {board.map((row, i) => (
            <li
              key={row.playerId}
              className={cx(
                "radius-blob-d flex items-center gap-3 border p-3 transition-transform",
                i === 0
                  ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                  : "border-line bg-surface",
                row.playerId === state.me.id && "ring-2 ring-inku-400",
              )}
            >
              <span
                className={cx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold",
                  i === 0 ? "bg-amber-400 text-white" : "bg-black/5 text-muted dark:bg-white/10",
                )}
              >
                {i + 1}
              </span>
              <Avatar avatarId={row.avatarId} size={34} />
              <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold">
                {row.pseudo}
              </span>
              <span className="font-display text-lg font-bold tabular-nums">{row.score}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Link href="/creer" className="flex-1">
            <Button full size="lg">
              Nouvelle partie
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="lg">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
