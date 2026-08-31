"use client";

import { Avatar } from "../Avatar";
import { Badge, cx } from "../ui";
import { IconCheck, IconCrown, IconEye, IconPlug } from "../icons";
import type { PublicPlayer } from "@/lib/types";

export function PlayerTile({
  player,
  me,
  subtitle,
  active,
  dimmed,
  right,
  onClick,
  selected,
}: {
  player: PublicPlayer;
  me?: boolean;
  subtitle?: React.ReactNode;
  active?: boolean;
  dimmed?: boolean;
  right?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cx(
        "radius-blob-d flex w-full items-center gap-3 border p-3 text-left transition-all duration-200",
        selected
          ? "border-inku-500 bg-inku-50 dark:bg-inku-950/70"
          : "border-line bg-surface",
        active && !selected && "animate-pulse-ring border-inku-400",
        dimmed && "opacity-45",
        onClick && "hover:-translate-y-0.5 hover:border-inku-300 active:scale-[0.98] dark:hover:border-inku-700",
      )}
    >
      <Avatar
        avatarId={player.avatarId}
        size={40}
        ring={selected || active ? "inku" : "none"}
        className={player.hasLeft ? "grayscale" : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-[15px] font-bold">{player.pseudo}</span>
          {me && <span className="text-xs text-muted">(toi)</span>}
          {player.isHost && <IconCrown size={14} className="shrink-0 text-amber-500" />}
          {player.isSpectator && <IconEye size={14} className="shrink-0 text-muted" />}
          {!player.isConnected && !player.hasLeft && (
            <IconPlug size={14} className="shrink-0 text-amber-500" />
          )}
        </div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-muted">{subtitle}</div>}
      </div>
      {right}
    </Tag>
  );
}

export function ReadyDot({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
      <IconCheck size={14} />
    </span>
  ) : (
    <Badge>en attente</Badge>
  );
}
