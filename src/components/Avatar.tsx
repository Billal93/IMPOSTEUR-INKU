"use client";

import { Mascot } from "./Mascot";
import { AVATARS, avatarById } from "@/lib/constants";
import { cx } from "./ui";

export function Avatar({
  avatarId,
  size = 44,
  className = "",
  eyes = "normal",
  ring,
}: {
  avatarId: string | null | undefined;
  size?: number;
  className?: string;
  eyes?: "normal" | "sneaky" | "happy";
  ring?: "none" | "inku" | "civil" | "imposteur" | "muted";
}) {
  const def = avatarById(avatarId);
  const rings = {
    none: "",
    inku: "ring-2 ring-inku-500",
    civil: "ring-2 ring-emerald-500",
    imposteur: "ring-2 ring-rose-500",
    muted: "ring-2 ring-line",
  }[ring ?? "none"];

  return (
    <span
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full bg-inku-50 dark:bg-white/5",
        rings,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Mascot def={def} size={Math.round(size * 0.84)} eyes={eyes} />
    </span>
  );
}

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-6">
      {AVATARS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onChange(a.id)}
          aria-label={a.name}
          aria-pressed={value === a.id}
          className={cx(
            "grid aspect-square place-items-center rounded-2xl border transition active:scale-95",
            value === a.id
              ? "border-inku-500 bg-inku-50 dark:bg-inku-950"
              : "border-line bg-bg hover:border-inku-300 dark:hover:border-inku-700",
          )}
        >
          <Mascot def={a} size={38} />
        </button>
      ))}
    </div>
  );
}
