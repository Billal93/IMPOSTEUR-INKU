"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------- Bouton ------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, full, className, children, disabled, ...rest },
  ref,
) {
  const sizes = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[15px]",
    lg: "h-13 px-6 text-base",
  }[size];

  const variants = {
    primary:
      "shine-sweep brand-gradient text-white shadow-[0_6px_20px_-8px_rgba(124,58,237,0.85)] hover:brightness-[1.06] hover:-translate-y-0.5",
    secondary:
      "border border-line bg-surface text-ink hover:border-inku-300 hover:-translate-y-0.5 dark:hover:border-inku-700",
    ghost: "text-muted hover:bg-inku-50 hover:text-inku-700 dark:hover:bg-white/5 dark:hover:text-inku-200",
    danger: "shine-sweep bg-[--color-imposteur] text-white hover:brightness-110 hover:-translate-y-0.5",
  }[variant];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-display font-bold transition-all duration-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:active:scale-100",
        sizes,
        variants,
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});

/* ------------------------------ Bouton icône ----------------------------- */

/** Classes du bouton rond à icône — réutilisées sur `<button>` et `<Link>`. */
export const iconButtonClass =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition-all duration-200 hover:-translate-y-0.5 hover:rotate-[-4deg] hover:border-inku-300 hover:text-inku-600 active:scale-90 dark:hover:border-inku-700 dark:hover:text-inku-300";

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, children, ...rest }, ref) {
    return (
      <button ref={ref} type="button" className={cx(iconButtonClass, className)} {...rest}>
        {children}
      </button>
    );
  },
);

/* -------------------------------- Carte -------------------------------- */

export function Card({
  children,
  className = "",
  as: As = "div",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  /** `paper` : la case BD (fond papier, contour d'encre, ombre dure) — pour les moments à fort enjeu. */
  tone?: "default" | "paper";
}) {
  return (
    <As
      className={cx(
        tone === "paper"
          ? "ink-card radius-blob-a p-5"
          : "rounded-[--radius-card] border border-line bg-surface p-5",
        className,
      )}
    >
      {children}
    </As>
  );
}

/* ------------------------------- Bulle BD -------------------------------- */

/** Encart type bulle de dialogue — pour un conseil, un rappel de règle. */
export function Bubble({
  children,
  className = "",
  tail = "left",
}: {
  children: ReactNode;
  className?: string;
  tail?: "left" | "right" | "none";
}) {
  return (
    <div
      className={cx(
        "ink-card radius-blob-b relative p-4 text-sm font-semibold leading-relaxed",
        tail === "left" && "bubble-tail-left",
        tail === "right" && "bubble-tail-right",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------- Input -------------------------------- */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cx(
          "h-12 w-full rounded-2xl border border-line bg-bg px-4 text-[16px] text-ink placeholder:text-muted/70 transition focus:border-inku-400 focus:outline-none focus:ring-4 focus:ring-inku-500/15 disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);

/* ---------------------- Groupe d'options (segmenté) ---------------------- */

export function OptionGroup<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-60" : undefined}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-display text-sm font-bold text-ink">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={cx(
                "h-10 min-w-11 rounded-full px-4 text-sm font-semibold transition-all duration-150 active:scale-90 disabled:cursor-not-allowed",
                active
                  ? "brand-gradient text-white shadow-[0_4px_14px_-4px_rgba(124,58,237,0.7)]"
                  : "border border-line bg-bg text-muted hover:border-inku-300 hover:text-ink dark:hover:border-inku-700",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------- Badge -------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "inku" | "civil" | "imposteur" | "warn";
  className?: string;
}) {
  const tones = {
    neutral: "bg-black/5 text-muted dark:bg-white/8",
    inku: "bg-inku-100 text-inku-700 dark:bg-inku-950 dark:text-inku-200",
    civil: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    imposteur: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Message ------------------------------- */

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "warn" | "success";
}) {
  const tones = {
    info: "border-inku-200 bg-inku-50 text-inku-800 dark:border-inku-900 dark:bg-inku-950/60 dark:text-inku-200",
    error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
    warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  }[tone];
  return (
    <div className={cx("animate-fade-in rounded-2xl border px-4 py-3 text-sm", tones)}>
      {children}
    </div>
  );
}

/* -------------------------------- Skeleton ------------------------------ */

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-inku-200 border-t-inku-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/* ------------------------------- Points d'attente ------------------------ */

/** Trois points qui rebondissent — "il réfléchit…". */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <div className={cx("flex items-center justify-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-dot-bounce rounded-full bg-encre-500"
          style={{ animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Tampon (stamp) ---------------------------- */

/**
 * Le grand tampon d'issue de manche — remplace un simple titre par un vrai
 * moment. Claque à l'écran puis se stabilise légèrement de travers.
 */
export function Stamp({
  children,
  tone = "civil",
}: {
  children: ReactNode;
  tone?: "civil" | "imposteur" | "neutral";
}) {
  const gradients = {
    civil: "from-emerald-500 to-inku-500",
    imposteur: "from-encre-500 to-inku-700",
    neutral: "from-inku-400 to-inku-700",
  }[tone];
  return (
    <div className="relative mx-auto w-full max-w-[320px] animate-stamp-in">
      <div
        className={cx(
          "relative aspect-[3/2] rotate-[-4deg] rounded-[58%_42%_61%_39%/43%_58%_42%_57%] bg-gradient-to-br shadow-[0_20px_46px_-12px_rgba(84,33,142,0.45)]",
          gradients,
        )}
      >
        <div className="absolute inset-0 grid place-items-center px-4 text-center">
          <strong className="rotate-[1deg] font-display text-3xl font-bold leading-[0.9] text-white [text-shadow:0_3px_0_rgba(43,8,101,0.8)] sm:text-4xl">
            {children}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Toast --------------------------------- */

export function Toast({
  message,
  tone = "info",
  onDismiss,
}: {
  message: string | null;
  tone?: "info" | "error" | "success";
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nouveau message : on repart visible dès ce rendu, sans attendre l'effet.
  const [tracked, setTracked] = useState(message);
  if (tracked !== message) {
    setTracked(message);
    if (message) setVisible(true);
  }

  // Programme la sortie automatique — pur effet de bord (timer), pas de sync d'état.
  useEffect(() => {
    if (!message) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [message]);

  // Laisse le temps à la transition de sortie de jouer avant de vider l'état.
  useEffect(() => {
    if (visible || !message) return;
    const id = setTimeout(onDismiss, 220);
    return () => clearTimeout(id);
  }, [visible, message, onDismiss]);

  if (!message) return null;

  const dot = { info: "bg-inku-500", error: "bg-rose-500", success: "bg-emerald-500" }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "ink-card radius-blob-c fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-w-[420px] items-center gap-2.5 px-4 py-3.5 text-sm font-bold transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      <span className={cx("h-2 w-2 shrink-0 rounded-full", dot)} />
      <span className="text-left">{message}</span>
    </div>
  );
}

/* ------------------------ Apparition au défilement ------------------------ */

/**
 * Fait apparaître son contenu (fondu + léger déplacement) quand il entre
 * dans le viewport. Purement décoratif : n'affecte jamais la mise en page
 * avant l'apparition (pas de layout shift, juste opacité + translate).
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.14 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cx(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
