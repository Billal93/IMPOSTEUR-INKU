"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "./icons";

const KEY = "imposteur:theme";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // La classe est posée avant le premier paint par le script du layout ;
  // on la lit directement plutôt que de la dupliquer dans un state.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* stockage indisponible : le thème reste actif pour cette session */
    }
    for (const l of listeners) l();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-inku-600 active:scale-95 dark:hover:text-inku-300 ${className}`}
    >
      {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}
