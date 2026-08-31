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
      className="relative w-full overflow-hidden rounded-[--radius-card] border border-inku-200 bg-gradient-to-br from-inku-50 to-white p-5 text-left transition active:scale-[0.99] dark:border-inku-900 dark:from-inku-950/60 dark:to-surface"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="inku">Ton mot</Badge>
          <p
            className={cx(
              "mt-3 font-display text-3xl font-bold leading-tight transition",
              hidden && "select-none blur-md",
            )}
          >
            {word}
          </p>
          <p className="mt-2 text-xs text-muted">
            {CATEGORY_LABELS[category]} · appuie pour {hidden ? "révéler" : "masquer"}
          </p>
        </div>
        <Mascot expression="determined" size={64} className="shrink-0" />
      </div>
    </button>
  );
}
