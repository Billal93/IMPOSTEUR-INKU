"use client";

import { forwardRef } from "react";
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
      "brand-gradient text-white shadow-[0_6px_20px_-8px_rgba(124,58,237,0.85)] hover:brightness-[1.06]",
    secondary:
      "border border-line bg-surface text-ink hover:border-inku-300 dark:hover:border-inku-700",
    ghost: "text-muted hover:bg-inku-50 hover:text-inku-700 dark:hover:bg-white/5 dark:hover:text-inku-200",
    danger: "bg-[--color-imposteur] text-white hover:brightness-110",
  }[variant];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-display font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
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

/* -------------------------------- Carte -------------------------------- */

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <As
      className={cx(
        "rounded-[--radius-card] border border-line bg-surface p-5",
        className,
      )}
    >
      {children}
    </As>
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
                "h-10 min-w-11 rounded-full px-4 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed",
                active
                  ? "brand-gradient text-white"
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
    <div className={cx("animate-[--animate-fade-in] rounded-2xl border px-4 py-3 text-sm", tones)}>
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
