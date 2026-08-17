"use client";

import { useState } from "react";
import { OptionGroup, cx } from "./ui";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CLUE_TURNS_OPTIONS,
  DISCUSSION_OPTIONS,
  GUESS_OPTIONS,
  LOBBY_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  RESULT_OPTIONS,
  ROUNDS_OPTIONS,
  TIMER_OPTIONS,
  VOTE_OPTIONS,
  durationLabel,
  type Category,
  type RoomSettings,
} from "@/lib/constants";

/**
 * Réglages de partie. Volontairement rangés hors du chemin principal :
 * créer une room ne demande qu'un pseudo, tout le reste a une valeur par
 * défaut qui marche.
 */
export function GameSettingsForm({
  settings,
  onChange,
  disabled = false,
}: {
  settings: RoomSettings;
  onChange: (patch: Partial<RoomSettings>) => void;
  disabled?: boolean;
}) {
  function toggleCategory(c: Category) {
    const has = settings.categories.includes(c);
    const next = has ? settings.categories.filter((x) => x !== c) : [...settings.categories, c];
    if (next.length === 0) return; // il en faut toujours au moins une
    onChange({ categories: next });
  }

  return (
    <div className={cx("space-y-6", disabled && "pointer-events-none opacity-70")}>
      <Section title="La partie">
        <OptionGroup
          label="Manches"
          hint="1 mot par manche"
          value={settings.rounds}
          options={ROUNDS_OPTIONS.map((r) => ({
            value: r,
            label: r === 0 ? "Illimité" : String(r),
          }))}
          onChange={(v) => onChange({ rounds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Tours d'indices"
          hint="avant le vote"
          value={settings.clueTurns}
          options={CLUE_TURNS_OPTIONS.map((t) => ({ value: t, label: String(t) }))}
          onChange={(v) => onChange({ clueTurns: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Joueurs max"
          value={settings.maxPlayers}
          options={Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
            const v = MIN_PLAYERS + i;
            return { value: v, label: String(v) };
          })}
          onChange={(v) => onChange({ maxPlayers: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Imposteurs"
          hint="auto : 1 jusqu'à 6 joueurs, 2 au-delà"
          value={settings.imposterOverride ?? 0}
          options={[
            { value: 0, label: "Auto" },
            { value: 1, label: "1" },
            { value: 2, label: "2" },
            { value: 3, label: "3" },
          ]}
          onChange={(v) => onChange({ imposterOverride: v === 0 ? null : v })}
          disabled={disabled}
        />
      </Section>

      <Section
        title="Chronos"
        note="Par défaut, rien n'est chronométré : chacun prend le temps qu'il veut."
      >
        <OptionGroup
          label="Un tour d'indice"
          value={settings.timerSeconds}
          options={TIMER_OPTIONS.map((t) => ({ value: t, label: durationLabel(t) }))}
          onChange={(v) => onChange({ timerSeconds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Le vote"
          value={settings.voteSeconds}
          options={VOTE_OPTIONS.map((t) => ({ value: t, label: durationLabel(t) }))}
          onChange={(v) => onChange({ voteSeconds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="La devinette de l'imposteur"
          value={settings.guessSeconds}
          options={GUESS_OPTIONS.map((t) => ({ value: t, label: durationLabel(t) }))}
          onChange={(v) => onChange({ guessSeconds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="L'écran de résultat"
          hint={settings.resultSeconds === 0 ? "l'hôte enchaîne" : undefined}
          value={settings.resultSeconds}
          options={RESULT_OPTIONS.map((t) => ({ value: t, label: durationLabel(t) }))}
          onChange={(v) => onChange({ resultSeconds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Discussion libre"
          hint="après les indices"
          value={settings.discussionSeconds}
          options={DISCUSSION_OPTIONS.map((d) => ({ value: d, label: d === 0 ? "Non" : `${d}s` }))}
          onChange={(v) => onChange({ discussionSeconds: v })}
          disabled={disabled}
        />
        <OptionGroup
          label="Lancement auto du lobby"
          hint={settings.lobbySeconds === 0 ? "l'hôte lance" : undefined}
          value={settings.lobbySeconds}
          options={LOBBY_OPTIONS.map((t) => ({ value: t, label: durationLabel(t) }))}
          onChange={(v) => onChange({ lobbySeconds: v })}
          disabled={disabled}
        />
      </Section>

      <Section title="Ce qu'on fait deviner">
        <div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = settings.categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  onClick={() => toggleCategory(c)}
                  className={cx(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95",
                    on
                      ? "brand-gradient text-white"
                      : "border border-line bg-bg text-muted hover:text-ink",
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            Les mots viennent d&apos;une sélection d&apos;animes grand public. Pas besoin d&apos;être
            expert.
          </p>
        </div>
      </Section>
    </div>
  );
}

/** Résumé d'une ligne des réglages, pour l'en-tête du bloc replié. */
export function settingsSummary(s: RoomSettings): string {
  const manches = s.rounds === 0 ? "Manches illimitées" : `${s.rounds} manche${s.rounds > 1 ? "s" : ""}`;
  const tours = `${s.clueTurns} tour${s.clueTurns > 1 ? "s" : ""} d'indices`;
  const chrono =
    s.timerSeconds === 0 && s.voteSeconds === 0 && s.guessSeconds === 0
      ? "sans chrono"
      : "avec chrono";
  return `${manches} · ${tours} · ${chrono}`;
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-muted">
          {title}
        </h3>
        {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      </div>
      {children}
    </div>
  );
}

/** Bloc repliable, fermé par défaut. */
export function Collapsible({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="font-display text-base font-bold">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-muted">{subtitle}</span>}
        </span>
        <span
          aria-hidden="true"
          className={cx(
            "shrink-0 text-lg leading-none text-muted transition-transform",
            open && "rotate-180",
          )}
        >
          ⌄
        </span>
      </button>
      {open && <div className="mt-5 animate-[--animate-fade-up]">{children}</div>}
    </div>
  );
}
