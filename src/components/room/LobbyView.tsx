"use client";

import { useState } from "react";
import { Button, Card, Notice, OptionGroup, cx } from "../ui";
import { PlayerTile, ReadyDot } from "./PlayerTile";
import { IconCheck, IconCopy, IconUsers } from "../icons";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CLUE_TURNS_OPTIONS,
  DISCUSSION_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUNDS_OPTIONS,
  TIMER_OPTIONS,
  autoImposterCount,
  type Category,
  type RoomSettings,
} from "@/lib/constants";
import type { RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

export function LobbyView({ state, api }: { state: RoomState; api: RoomApi }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const isHost = state.me.isHost;
  const present = state.players.filter((p) => !p.hasLeft);
  const enough = present.length >= MIN_PLAYERS;
  const allReady = present.every((p) => p.isReady || p.isHost);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard refusé : le code reste lisible à l'écran */
    }
  }

  async function share() {
    const url = `${window.location.origin}/rejoindre?code=${state.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "IMPOSTEUR", text: `Rejoins ma partie : ${state.code}`, url });
        return;
      } catch {
        /* partage annulé */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* rien à faire */
    }
  }

  async function patchSettings(p: Partial<RoomSettings>) {
    setError(null);
    const res = await api.post("settings", { settings: p });
    if (!res.ok) setError(res.error ?? null);
  }

  function toggleCategory(c: Category) {
    const has = state.settings.categories.includes(c);
    const next = has
      ? state.settings.categories.filter((x) => x !== c)
      : [...state.settings.categories, c];
    if (next.length === 0) return;
    void patchSettings({ categories: next });
  }

  async function start() {
    setBusy(true);
    setError(null);
    const res = await api.post("start");
    if (!res.ok) setError(res.error ?? null);
    setBusy(false);
  }

  const imposters =
    state.settings.imposterOverride ?? autoImposterCount(Math.max(present.length, MIN_PLAYERS));

  return (
    <div className="space-y-4 pb-32">
      {/* Code de la room */}
      <Card className="animate-[--animate-pop] text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Code de la room</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-display text-4xl font-extrabold tracking-[0.3em] text-ink">
            {state.code}
          </span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Copier le code"
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted transition hover:text-inku-600 active:scale-95"
          >
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
          </button>
        </div>
        <Button variant="secondary" size="sm" className="mt-3" onClick={share}>
          Partager le lien
        </Button>
      </Card>

      {/* Joueurs */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <IconUsers size={18} /> Joueurs
          </h2>
          <span className="text-sm font-semibold text-muted">
            {present.length}/{state.settings.maxPlayers}
          </span>
        </div>

        <div className="space-y-2">
          {present.map((p) => (
            <PlayerTile
              key={p.id}
              player={p}
              me={p.id === state.me.id}
              subtitle={p.isHost ? "Hôte de la partie" : undefined}
              right={<ReadyDot ready={p.isReady || p.isHost} />}
            />
          ))}
        </div>

        {!enough && (
          <p className="mt-3 text-center text-sm text-muted">
            Il manque {MIN_PLAYERS - present.length} joueur
            {MIN_PLAYERS - present.length > 1 ? "s" : ""} pour lancer.
          </p>
        )}
      </Card>

      {/* Réglages */}
      <Card>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="font-display text-lg font-bold">Réglages</h2>
          <span className="text-sm font-semibold text-inku-600 dark:text-inku-300">
            {showSettings ? "Replier" : isHost ? "Modifier" : "Voir"}
          </span>
        </button>

        {!showSettings && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Row label="Manches" value={state.settings.rounds === 0 ? "Illimité" : state.settings.rounds} />
            <Row label="Temps / indice" value={`${state.settings.timerSeconds}s`} />
            <Row label="Tours d'indices" value={state.settings.clueTurns} />
            <Row
              label="Discussion"
              value={state.settings.discussionSeconds === 0 ? "Non" : `${state.settings.discussionSeconds}s`}
            />
            <Row label="Imposteurs" value={imposters} />
            <Row label="Catégories" value={state.settings.categories.length} />
          </dl>
        )}

        {showSettings && (
          <div className={cx("mt-4 space-y-5", !isHost && "pointer-events-none opacity-70")}>
            {!isHost && (
              <p className="text-xs text-muted">Seul l&apos;hôte peut changer les réglages.</p>
            )}

            <OptionGroup
              label="Joueurs max"
              value={state.settings.maxPlayers}
              options={Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
                const v = MIN_PLAYERS + i;
                return { value: v, label: String(v) };
              })}
              onChange={(v) => patchSettings({ maxPlayers: v })}
              disabled={!isHost}
            />
            <OptionGroup
              label="Manches"
              value={state.settings.rounds}
              options={ROUNDS_OPTIONS.map((r) => ({
                value: r,
                label: r === 0 ? "Illimité" : String(r),
              }))}
              onChange={(v) => patchSettings({ rounds: v })}
              disabled={!isHost}
            />
            <OptionGroup
              label="Temps par indice"
              value={state.settings.timerSeconds}
              options={TIMER_OPTIONS.map((t) => ({ value: t, label: `${t}s` }))}
              onChange={(v) => patchSettings({ timerSeconds: v })}
              disabled={!isHost}
            />
            <OptionGroup
              label="Tours d'indices"
              value={state.settings.clueTurns}
              options={CLUE_TURNS_OPTIONS.map((t) => ({ value: t, label: String(t) }))}
              onChange={(v) => patchSettings({ clueTurns: v })}
              disabled={!isHost}
            />
            <OptionGroup
              label="Discussion libre"
              value={state.settings.discussionSeconds}
              options={DISCUSSION_OPTIONS.map((d) => ({ value: d, label: d === 0 ? "Non" : `${d}s` }))}
              onChange={(v) => patchSettings({ discussionSeconds: v })}
              disabled={!isHost}
            />
            <OptionGroup
              label="Imposteurs"
              hint="auto : 1 jusqu'à 6, 2 au-delà"
              value={state.settings.imposterOverride ?? 0}
              options={[
                { value: 0, label: "Auto" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
              ]}
              onChange={(v) => patchSettings({ imposterOverride: v === 0 ? null : v })}
              disabled={!isHost}
            />

            <div>
              <div className="mb-2 font-display text-sm font-bold">Catégories</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = state.settings.categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!isHost}
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
            </div>
          </div>
        )}
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      {/* Barre d'action */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          {isHost ? (
            <Button full size="lg" onClick={start} loading={busy} disabled={!enough}>
              {enough ? "Lancer la partie" : `Attends ${MIN_PLAYERS} joueurs`}
            </Button>
          ) : (
            <Button
              full
              size="lg"
              variant={state.players.find((p) => p.id === state.me.id)?.isReady ? "secondary" : "primary"}
              onClick={() => api.post("ready")}
            >
              {state.players.find((p) => p.id === state.me.id)?.isReady
                ? "Je ne suis plus prêt"
                : "Je suis prêt"}
            </Button>
          )}
          {isHost && enough && !allReady && (
            <p className="mt-2 text-center text-xs text-muted">
              Tout le monde n&apos;est pas prêt, mais tu peux lancer quand tu veux.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </>
  );
}
