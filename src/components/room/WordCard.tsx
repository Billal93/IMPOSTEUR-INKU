"use client";

import { useState } from "react";
import { Mascot } from "../Mascot";
import { Badge, cx } from "../ui";
import { IconEye } from "../icons";
import { CATEGORY_LABELS, type Category } from "@/lib/constants";

/**
 * Le mot du joueur. Volontairement masquable d'un tap : on joue souvent
 * côte à côte, il faut pouvoir cacher son écran vite fait.
 */
export function WordCard({
  word,
  isImposter,
  category,
  spectator,
}: {
  word: string | null;
  isImposter: boolean;
  category: Category;
  spectator?: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  if (spectator || !word) {
    return (
      <div className="rounded-[--radius-card] border border-dashed border-line bg-surface p-5 text-center">
        <IconEye size={20} className="mx-auto text-muted" />
        <p className="mt-2 font-display text-base font-bold">Tu regardes cette manche</p>
        <p className="mt-1 text-sm text-muted">Tu joues à partir de la prochaine.</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setHidden((h) => !h)}
      className={cx(
        "relative w-full overflow-hidden rounded-[--radius-card] border p-5 text-left transition active:scale-[0.99]",
        isImposter
          ? "border-rose-300 bg-gradient-to-br from-rose-50 to-inku-50 dark:border-rose-900 dark:from-rose-950/50 dark:to-inku-950/50"
          : "border-inku-200 bg-gradient-to-br from-inku-50 to-white dark:border-inku-900 dark:from-inku-950/60 dark:to-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={isImposter ? "imposteur" : "inku"}>
            {isImposter ? "Tu es l'imposteur" : "Ton mot"}
          </Badge>
          <p
            className={cx(
              "mt-3 font-display text-3xl font-extrabold leading-tight transition",
              hidden && "select-none blur-md",
            )}
          >
            {word}
          </p>
          <p className="mt-2 text-xs text-muted">
            {CATEGORY_LABELS[category]} · appuie pour {hidden ? "révéler" : "masquer"}
          </p>
        </div>
        <Mascot
          def={{
            body: isImposter ? "#6B21D6" : "#7C3AED",
            accent: isImposter ? "#F43F5E" : "#EC4899",
            accessory: isImposter ? "mask" : "none",
          }}
          size={58}
          eyes={isImposter ? "sneaky" : "happy"}
          className="shrink-0"
        />
      </div>

      {isImposter && (
        <p className="mt-3 rounded-2xl bg-rose-100/70 px-3 py-2 text-xs leading-relaxed text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
          Les autres ont un mot proche du tien, mais pas le même. Fonds-toi dans la masse.
        </p>
      )}
    </button>
  );
}
