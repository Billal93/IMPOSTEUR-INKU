"use client";

import Link from "next/link";
import { iconButtonClass } from "./ui";
import { IconArrowLeft, IconHelp } from "./icons";

/**
 * En-tête commun. Le titre affiché est « IMPOSTEUR », jamais préfixé INKU —
 * et jamais accolé au monogramme K non plus : INKU signe le produit via le
 * watermark, il ne co-signe pas le jeu en en-tête.
 *
 * Un fin trait dégradé en haut de la page casse le noir plat avant même que
 * le header n'apparaisse ; une lueur discrète derrière le mot-symbole évite
 * qu'il ne flotte, seul, sur un fond vide.
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
      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-2">
          {back && (
            <Link href={back} aria-label="Retour" className={iconButtonClass}>
              <IconArrowLeft size={18} />
            </Link>
          )}
          <Link href="/" className="relative font-display text-xl font-bold tracking-tight active:scale-95">
            <span
              aria-hidden="true"
              className="absolute -inset-x-4 -inset-y-3 -z-10 rounded-full bg-inku-500/20 blur-xl"
            />
            <span className="brand-text">IMPOSTEUR</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
