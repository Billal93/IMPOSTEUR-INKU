"use client";

import { useState } from "react";
import { Button, Card, Notice, iconButtonClass, cx } from "../ui";
import { PlayerTile, ReadyDot } from "./PlayerTile";
import { useCountdown } from "./Timer";
import { Collapsible, GameSettingsForm, settingsSummary } from "../GameSettingsForm";
import { IconCheck, IconCopy, IconUsers } from "../icons";
import {
  CATEGORY_LABELS,
  MIN_PLAYERS,
  autoImposterCount,
  durationLabel,
  type RoomSettings,
} from "@/lib/constants";
import type { RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

export function LobbyView({
  state,
  api,
  skew,
}: {
  state: RoomState;
  api: RoomApi;
  skew: number;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStart = useCountdown(state.lobbyDeadline, skew);

  const isHost = state.me.isHost;
  const present = state.players.filter((p) => !p.hasLeft);
  const enough = present.length >= MIN_PLAYERS;
  const me = present.find((p) => p.id === state.me.id);

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
      <div className="ink-card radius-blob-a relative animate-pop overflow-hidden p-5 text-center">
        <div aria-hidden="true" className="ink-blob -right-9 -top-7 h-28 w-32" />
        <p className="relative text-xs font-bold uppercase tracking-widest text-paper-muted">
          Code de la room
        </p>
        <div className="relative mt-2 flex items-center justify-center gap-3">
          <span className="font-display text-4xl font-bold tracking-[0.24em]">{state.code}</span>
          <button
            type="button"
            onClick={copyCode}
            aria-label="Copier le code"
            className={cx(iconButtonClass, "border-paper-line/20 bg-black/5 text-paper-ink hover:text-inku-600")}
          >
            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
          </button>
        </div>
        <Button variant="secondary" size="sm" className="relative mt-3 bg-white/70 dark:bg-white/70" onClick={share}>
          Partager le lien
        </Button>
        {state.lobbyDeadline && (
          <p className="relative mt-3 text-xs font-bold text-paper-muted">
            Lancement auto dans {Math.ceil(autoStart)}s
          </p>
        )}
      </div>

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

      {/* Réglages — repliés, comme à la création */}
      <Card>
        <Collapsible
          title={isHost ? "Paramètres avancés" : "Réglages de la partie"}
          subtitle={settingsSummary(state.settings)}
        >
          {!isHost && (
            <p className="mb-4 text-xs text-muted">Seul l&apos;hôte peut les changer.</p>
          )}
          <GameSettingsForm
            settings={state.settings}
            onChange={patchSettings}
            disabled={!isHost}
          />
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
            <Row label="Imposteurs" value={imposters} />
            <Row label="Catégories" value={state.settings.categories.map((c) => CATEGORY_LABELS[c]).length} />
            <Row label="Chrono indice" value={durationLabel(state.settings.timerSeconds)} />
            <Row label="Chrono vote" value={durationLabel(state.settings.voteSeconds)} />
          </dl>
        </Collapsible>
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
              variant={me?.isReady ? "secondary" : "primary"}
              onClick={() => api.post("ready")}
            >
              {me?.isReady ? "Je ne suis plus prêt" : "Je suis prêt"}
            </Button>
          )}
          {isHost && enough && (
            <p className="mt-2 text-center text-xs text-muted">
              Tu lances quand tu veux, personne n&apos;est chronométré.
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
