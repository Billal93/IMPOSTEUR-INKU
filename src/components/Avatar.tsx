"use client";

import Image from "next/image";
import { AVATARS, avatarById } from "@/lib/constants";
import { cx } from "./ui";

/**
 * L'avatar d'un joueur : la mascotte peinte, une expression par joueur.
 * Ce n'est pas une forme générique — on reconnaît quelqu'un à sa tête.
 */
export function Avatar({
  avatarId,
  size = 44,
  className = "",
  ring,
}: {
  avatarId: string | null | undefined;
  size?: number;
  className?: string;
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
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-inku-50 dark:bg-white/5",
        rings,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/avatars/${def.id}.png`}
        alt={def.name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
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
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onChange(a.id)}
          title={a.name}
          aria-label={a.name}
          aria-pressed={value === a.id}
          className={cx(
            "grid aspect-square place-items-center overflow-hidden rounded-2xl border p-1 transition-all duration-200 active:scale-90",
            value === a.id
              ? "animate-[--animate-pop] border-inku-500 bg-inku-50 shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)] dark:bg-inku-950"
              : "border-line bg-bg hover:-translate-y-0.5 hover:border-inku-300 dark:hover:border-inku-700",
          )}
        >
          <Image src={`/avatars/${a.id}.png`} alt={a.name} width={72} height={72} className="h-full w-full object-contain" />
        </button>
      ))}
    </div>
  );
}
