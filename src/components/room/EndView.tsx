"use client";

import Link from "next/link";
import { Avatar } from "../Avatar";
import { Mascot } from "../Mascot";
import { Button, Card, cx } from "../ui";
import { IconTrophy } from "../icons";
import type { RoomState } from "@/lib/types";

export function EndView({ state }: { state: RoomState }) {
  const board = state.leaderboard ?? [];
  const top = board[0];
  const meRank = board.findIndex((b) => b.playerId === state.me.id) + 1;

  return (
    <div className="space-y-4 pb-28">
      <Card className="animate-[--animate-pop] text-center">
        <div className="mx-auto w-fit animate-[--animate-float]">
          <Mascot
            def={{ body: "#7C3AED", accent: "#EC4899", accessory: "cape" }}
            size={92}
            eyes="happy"
          />
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold">Partie terminée</h2>
        {top && (
          <p className="mt-1 text-sm text-muted">
            <span className="font-display font-bold text-ink">{top.pseudo}</span> rafle la mise avec{" "}
            {top.score} pt{top.score > 1 ? "s" : ""}.
          </p>
        )}
        {meRank > 0 && (
          <p className="mt-1 text-sm text-muted">
            Toi, tu finis {meRank}
            {meRank === 1 ? "er" : "e"}.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <IconTrophy size={18} /> Classement
        </h3>
        <ol className="space-y-2">
          {board.map((row, i) => (
            <li
              key={row.playerId}
              className={cx(
                "flex items-center gap-3 rounded-2xl border p-3",
                i === 0
                  ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                  : "border-line bg-surface",
                row.playerId === state.me.id && "ring-2 ring-inku-400",
              )}
            >
              <span
                className={cx(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-extrabold",
                  i === 0 ? "bg-amber-400 text-white" : "bg-black/5 text-muted dark:bg-white/10",
                )}
              >
                {i + 1}
              </span>
              <Avatar avatarId={row.avatarId} size={34} />
              <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold">
                {row.pseudo}
              </span>
              <span className="font-display text-lg font-extrabold tabular-nums">{row.score}</span>
            </li>
          ))}
        </ol>
      </Card>

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
