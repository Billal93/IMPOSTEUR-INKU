"use client";

import { useState } from "react";
import { Avatar } from "../Avatar";
import { Badge, Button, Card, Stamp, cx } from "../ui";
import { ClueFeed } from "./ClueFeed";
import { TimerBar, useCountdown } from "./Timer";
import { PROXIMITY_LABELS } from "@/lib/constants";
import type { PublicClue, RoomState } from "@/lib/types";
import type { RoomApi } from "@/lib/useRoom";

export function ResultView({ state, api, skew }: { state: RoomState; api: RoomApi; skew: number }) {
  const round = state.round!;
  const result = round.result!;
  const left = useCountdown(round.deadline, skew);
  const [busy, setBusy] = useState(false);

  const eliminated = state.players.find((p) => p.id === result.eliminatedPlayerId);
  const imposters = state.players.filter((p) => result.imposterPlayerIds.includes(p.id));
  const civilsWin = result.winner === "civils";
  const lastRound = state.settings.rounds > 0 && (state.game?.roundNumber ?? 0) >= state.settings.rounds;

  async function report(clue: PublicClue) {
    await api.post("report", { clue: { playerId: clue.playerId, turnNumber: clue.turnNumber } });
  }

  const stampTone = result.tie ? "neutral" : civilsWin ? "civil" : "imposteur";
  const stampText = result.tie ? (
    <>
      PERSONNE
      <br />
      D&apos;ÉLIMINÉ
    </>
  ) : civilsWin ? (
    <>
      IMPOSTEUR
      <br />
      DÉMASQUÉ
    </>
  ) : (
    <>
      IL VOUS
      <br />A EU
    </>
  );

  return (
    <div className="space-y-4 pb-32">
      <div className="pt-2 text-center">
        <Stamp tone={stampTone}>{stampText}</Stamp>

        {eliminated && (
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
            <Avatar
              avatarId={eliminated.avatarId}
              size={26}
              ring={result.eliminatedWasImposter ? "imposteur" : "civil"}
            />
            <span className="font-display text-sm font-bold">{eliminated.pseudo}</span>
            <Badge tone={result.eliminatedWasImposter ? "imposteur" : "civil"}>
              {result.eliminatedWasImposter ? "imposteur" : "civil"}
            </Badge>
          </div>
        )}

        {result.imposterGuess !== null && (
          <p className="mt-3 text-sm text-muted">
            Sa réponse : <span className="font-display font-bold text-ink">« {result.imposterGuess} »</span>{" "}
            {result.imposterGuessCorrect ? "— trouvé, il vole la manche." : "— raté."}
          </p>
        )}

        {round.deadline && (
          <div className="mx-auto mt-4 max-w-xs">
            <TimerBar seconds={left} total={state.settings.resultSeconds} />
          </div>
        )}
      </div>

      <Card>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="radius-blob-a border border-line bg-sunken p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Mot des civils</p>
            <p className="mt-1 font-display text-lg font-bold">{result.civilWord}</p>
          </div>
          <div className="radius-blob-b border border-line bg-sunken p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Mot de l&apos;imposteur</p>
            <p className="mt-1 font-display text-lg font-bold">{result.imposterWord}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Proximité : {PROXIMITY_LABELS[result.proximityType]}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">
            Imposteur{imposters.length > 1 ? "s" : ""} :
          </span>
          {imposters.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 dark:bg-rose-950"
            >
              <Avatar avatarId={p.avatarId} size={20} />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-200">{p.pseudo}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* Scores de la manche */}
      <Card>
        <h3 className="mb-3 font-display text-base font-bold">Scores</h3>
        <ul className="space-y-1.5">
          {[...state.players]
            .filter((p) => !p.isSpectator)
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              const delta = result.scoreDeltas[p.id] ?? 0;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
                  <Avatar avatarId={p.avatarId} size={28} />
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-bold">
                    {p.pseudo}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={cx(
                        "text-xs font-bold",
                        delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500",
                      )}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                  <span className="w-8 text-right font-display text-sm font-bold tabular-nums">
                    {p.score}
                  </span>
                </li>
              );
            })}
        </ul>
      </Card>

      <Card>
        <h3 className="mb-1 font-display text-base font-bold">Les indices de la manche</h3>
        <p className="mb-3 text-xs text-muted">
          Un indice trop évident t&apos;a gêné ? Signale-le, ça n&apos;influence plus le vote.
        </p>
        <ClueFeed
          clues={round.clues}
          players={state.players}
          meId={state.me.id}
          totalTurns={round.totalTurns}
          onReport={report}
        />
      </Card>

      {!state.me.isHost && !round.deadline && (
        <p className="pb-4 text-center text-sm text-muted">
          {lastRound ? "L'hôte va afficher le classement." : "L'hôte lance la manche suivante."}
        </p>
      )}

      {state.me.isHost && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Button
              full
              size="lg"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await api.post("next-round");
                setBusy(false);
              }}
            >
              {lastRound ? "Voir le classement" : "Manche suivante"}
            </Button>
            {state.settings.rounds === 0 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={async () => {
                  setBusy(true);
                  await api.post("end");
                  setBusy(false);
                }}
              >
                Arrêter
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
