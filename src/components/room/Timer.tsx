"use client";

import { useEffect, useState } from "react";
import { cx } from "../ui";

/** Compte à rebours calé sur l'horloge serveur (via clockSkew). */
export function useCountdown(deadline: string | null, skew: number) {
  const [left, setLeft] = useState(() => remaining(deadline, skew));
  const [tracked, setTracked] = useState(deadline);

  // Nouvelle échéance : on repart de la bonne valeur dès ce rendu, sans
  // attendre le premier tick de l'intervalle.
  if (tracked !== deadline) {
    setTracked(deadline);
    setLeft(remaining(deadline, skew));
  }

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setLeft(remaining(deadline, skew)), 200);
    return () => clearInterval(id);
  }, [deadline, skew]);

  return left;
}

function remaining(deadline: string | null, skew: number): number {
  if (!deadline) return 0;
  return Math.max(0, (new Date(deadline).getTime() - (Date.now() + skew)) / 1000);
}

export function TimerRing({
  seconds,
  total,
  size = 56,
  label,
}: {
  seconds: number;
  total: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 0;
  const urgent = seconds <= 5;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          className="stroke-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cx(
            "transition-[stroke-dashoffset] duration-200 ease-linear",
            urgent ? "stroke-rose-500" : "stroke-inku-500",
          )}
        />
      </svg>
      <span
        className={cx(
          "absolute font-display text-sm font-extrabold tabular-nums",
          urgent ? "text-rose-500" : "text-ink",
        )}
      >
        {Math.ceil(seconds)}
      </span>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (seconds / total) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-200 ease-linear",
          seconds <= 5 ? "bg-rose-500" : "brand-gradient",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
