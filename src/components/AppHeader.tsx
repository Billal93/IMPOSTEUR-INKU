"use client";

import Link from "next/link";
import { cx, iconButtonClass } from "./ui";
import { InkuMark } from "./Mascot";
import { IconArrowLeft, IconHelp } from "./icons";

/**
 * En-tête commun.
 *
 * Écart assumé au brief d'origine : le nom du jeu ne devait jamais être
 * préfixé par INKU. À la demande explicite de Billal (deux allers-retours,
 * capture de référence à l'appui), l'en-tête reprend le lockup « icône +
 * INKU / IMPOSTEUR » — mais avec le vrai monogramme K (badge dégradé, même
 * asset que le watermark), jamais l'icône abstraite inventée de la maquette.
 * Le grand titre de la landing, lui, reste IMPOSTEUR seul.
 */
export function AppHeader({
  back,
  compact = false,
  right,
}: {
  back?: string;
  compact?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-encre-500/50 to-inku-500/50"
      />
      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {back && (
            <Link href={back} aria-label="Retour" className={cx(iconButtonClass, "shrink-0")}>
              <IconArrowLeft size={18} />
            </Link>
          )}
          <Link href="/" className="flex min-w-0 items-center gap-2.5 active:scale-95">
            <InkuMark
              variant="badge"
              size={36}
              className="shrink-0 drop-shadow-[0_4px_10px_rgba(124,58,237,0.45)]"
            />
            <span className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
              <span className="font-display text-[17px] font-bold leading-none">INKU</span>
              <span className="truncate font-display text-[11px] font-bold uppercase leading-none tracking-[0.1em] text-muted">
                / Imposteur
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {right}
          {!compact && (
            <Link href="/regles" aria-label="Les règles" className={iconButtonClass}>
              <IconHelp size={18} />
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
