"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { IconArrowLeft, IconHelp } from "./icons";

/** En-tête commun. Le titre affiché est « IMPOSTEUR », jamais préfixé INKU. */
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
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-4">
      <div className="flex items-center gap-2">
        {back && (
          <Link
            href={back}
            aria-label="Retour"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-inku-600"
          >
            <IconArrowLeft size={18} />
          </Link>
        )}
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          <span className="brand-text">IMPOSTEUR</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {right}
        {!compact && (
          <Link
            href="/regles"
            aria-label="Les règles"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-inku-600"
          >
            <IconHelp size={18} />
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
