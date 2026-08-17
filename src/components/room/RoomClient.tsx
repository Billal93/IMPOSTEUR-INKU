"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../AppHeader";
import { Badge, Button, Card, Notice, Spinner, cx } from "../ui";
import { LobbyView } from "./LobbyView";
import { CluesView } from "./CluesView";
import { DiscussionView } from "./DiscussionView";
import { VoteView } from "./VoteView";
import { GuessView } from "./GuessView";
import { ResultView } from "./ResultView";
import { EndView } from "./EndView";
import { useRoomStore } from "@/lib/store";
import { useDeadlineTick, useRoom } from "@/lib/useRoom";
import { clearSession, useSession } from "@/lib/session";
import { MIN_PLAYERS, PAUSE_CANCEL_MS } from "@/lib/constants";

export function RoomClient({ code }: { code: string }) {
  const router = useRouter();
  const session = useSession(code);
  const state = useRoomStore((s) => s.state);
  const connection = useRoomStore((s) => s.connection);
  const error = useRoomStore((s) => s.error);
  const skew = useRoomStore((s) => s.clockSkew);
  const reset = useRoomStore((s) => s.reset);

  useEffect(() => reset, [code, reset]);

  const api = useRoom(code);
  useDeadlineTick(code, state?.round?.deadline ?? null, skew);

  // Pas de session pour cette room : on renvoie vers l'écran « rejoindre ».
  useEffect(() => {
    if (session === null) router.replace(`/rejoindre?code=${code}`);
  }, [session, code, router]);

  if (session === null) return null;

  if (!state) {
    return (
      <main className="min-h-dvh">
        <AppHeader back="/" compact />
        <div className="mx-auto max-w-2xl px-4">
          {error ? (
            <div className="space-y-3 pt-10">
              <Notice tone="error">{error}</Notice>
              <Button
                full
                variant="secondary"
                onClick={() => {
                  clearSession(code);
                  router.replace(`/rejoindre?code=${code}`);
                }}
              >
                Rejoindre à nouveau
              </Button>
            </div>
          ) : (
            <Spinner label="On rejoint la room…" />
          )}
        </div>
      </main>
    );
  }

  const round = state.round;
  const paused = !!state.pausedAt && state.status === "en_cours";

  return (
    <main className="min-h-dvh">
      <AppHeader
        back="/"
        compact
        right={
          <span
            className={cx(
              "hidden h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-bold sm:inline-flex",
              connection === "live" ? "text-emerald-600" : "text-amber-500",
            )}
          >
            <span
              className={cx(
                "h-1.5 w-1.5 rounded-full",
                connection === "live" ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            {connection === "live" ? "en direct" : "reconnexion…"}
          </span>
        }
      />

      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        {/* Bandeau room */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge tone="inku">{state.code}</Badge>
            {state.game && state.status === "en_cours" && (
              <span className="text-xs font-semibold text-muted">
                Manche {state.game.roundNumber}
                {state.settings.rounds > 0 ? ` / ${state.settings.rounds}` : ""}
              </span>
            )}
            {state.me.isSpectator && <Badge tone="warn">spectateur</Badge>}
          </div>
          <LeaveButton
            onLeave={async () => {
              await api.post("leave");
              clearSession(code);
              router.replace("/");
            }}
          />
        </div>

        {paused && <PauseBanner pausedAt={state.pausedAt!} />}

        {state.status === "terminee" ? (
          <EndView state={state} />
        ) : state.status === "lobby" || !round ? (
          <LobbyView state={state} api={api} />
        ) : paused ? null : round.status === "indices" ? (
          <CluesView state={state} api={api} skew={skew} />
        ) : round.status === "discussion" ? (
          <DiscussionView state={state} skew={skew} />
        ) : round.status === "vote" || round.status === "revote" ? (
          <VoteView state={state} api={api} skew={skew} />
        ) : round.status === "devinette" ? (
          <GuessView state={state} api={api} skew={skew} />
        ) : (
          <ResultView state={state} api={api} skew={skew} />
        )}
      </div>
    </main>
  );
}

function PauseBanner({ pausedAt }: { pausedAt: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      const ms = PAUSE_CANCEL_MS - (Date.now() - new Date(pausedAt).getTime());
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
    }, 500);
    return () => clearInterval(id);
  }, [pausedAt]);

  return (
    <Card className="mb-4 animate-[--animate-pop] border-amber-300 bg-amber-50 text-center dark:border-amber-900 dark:bg-amber-950/40">
      <h2 className="font-display text-lg font-bold">Partie en pause</h2>
      <p className="mt-1 text-sm text-muted">
        Il faut au moins {MIN_PLAYERS} joueurs connectés pour continuer. On attend le retour des
        absents.
      </p>
      <p className="mt-2 font-display text-sm font-bold tabular-nums">
        Annulation dans {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </p>
    </Card>
  );
}

function LeaveButton({ onLeave }: { onLeave: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs font-semibold text-muted underline-offset-4 hover:text-rose-500 hover:underline"
      >
        Quitter
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={onLeave}
        className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white active:scale-95"
      >
        Confirmer
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-xs font-semibold text-muted"
      >
        Annuler
      </button>
    </span>
  );
}
