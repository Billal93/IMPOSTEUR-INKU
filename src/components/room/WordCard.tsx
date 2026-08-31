"use client";

import { useState } from "react";
import { Mascot } from "../Mascot";
import { Badge, cx } from "../ui";
import { IconEye } from "../icons";
import { CATEGORY_LABELS, type Category } from "@/lib/constants";

/**
 * Le mot du joueur. Volontairement masquable d'un tap : on joue souvent
 * côte à côte, il faut pouvoir cacher son écran vite fait.
 *
 * Important : cette carte ne prend jamais de prop de rôle. Dans Undercover,
 * personne ne sait s'il tient le mot majoritaire ou le mot proche — l'UI ne
 * doit donc afficher aucun indice visuel différent selon le rôle (même
 * badge, même mascotte, même style, pour tout le monde). Le serveur choisit
 * déjà le bon mot ; ne réintroduis jamais ici un signal de rôle.
 */
export function WordCard({
  word,
  category,
  spectator,
}: {
  word: string | null;
  category: Category;
  spectator?: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  if (spectator || !word) {
    return (
      <div className="radius-blob-b border border-dashed border-line bg-surface p-5 text-center">
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
      className="ink-card radius-blob-a relative w-full overflow-hidden p-5 text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <div aria-hidden="true" className="ink-blob -right-8 -top-6 h-24 w-28" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="inku" className="bg-inku-100 text-inku-700">
            Ton mot
          </Badge>
          <p
            className={cx(
              "mt-3 font-display text-3xl font-bold leading-[0.95] transition sm:text-4xl",
              hidden && "select-none blur-md",
            )}
          >
            {word}
          </p>
          <p className="mt-2.5 text-xs font-semibold text-paper-muted">
            {CATEGORY_LABELS[category]} · appuie pour {hidden ? "révéler" : "masquer"}
          </p>
        </div>
        <Mascot expression="determined" size={62} className="shrink-0 drop-shadow-[0_10px_14px_rgba(43,8,101,0.28)]" />
      </div>
    </button>
  );
}
