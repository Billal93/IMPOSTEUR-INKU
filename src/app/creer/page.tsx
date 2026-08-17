"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { IdentityFields } from "@/components/IdentityFields";
import { Button, Card, Notice, OptionGroup, cx } from "@/components/ui";
import { saveProfile, saveSession, useProfile } from "@/lib/session";
import { checkPseudo } from "@/lib/text";
import {
  CATEGORIES,
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  CLUE_TURNS_OPTIONS,
  DEFAULT_AVATAR,
  DEFAULT_SETTINGS,
  DISCUSSION_OPTIONS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUNDS_OPTIONS,
  TIMER_OPTIONS,
  type Category,
  type RoomSettings,
} from "@/lib/constants";

export default function CreerPage() {
  const router = useRouter();
  // Le dernier profil utilisé sert de valeur par défaut, sans effet ni flash.
  const profile = useProfile();
  const [pseudoInput, setPseudo] = useState<string | null>(null);
  const [avatarInput, setAvatarId] = useState<string | null>(null);
  const pseudo = pseudoInput ?? profile?.pseudo ?? "";
  const avatarId = avatarInput ?? profile?.avatarId ?? DEFAULT_AVATAR;

  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function patch(p: Partial<RoomSettings>) {
    setSettings((s) => ({ ...s, ...p }));
  }

  function toggleCategory(c: Category) {
    setSettings((s) => {
      const has = s.categories.includes(c);
      const next = has ? s.categories.filter((x) => x !== c) : [...s.categories, c];
      return { ...s, categories: next.length === 0 ? s.categories : next };
    });
  }

  async function submit() {
    const check = checkPseudo(pseudo);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: check.value, avatarId, settings }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Impossible de créer la partie.");
        return;
      }
      saveSession(data.code, {
        token: data.sessionToken,
        playerId: data.playerId,
        pseudo: check.value,
        avatarId,
      });
      saveProfile(check.value, avatarId);
      router.push(`/room/${data.code}`);
    } catch {
      setError("Réseau indisponible. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh pb-28">
      <AppHeader back="/" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Créer une partie</h1>
          <p className="mt-1 text-sm text-muted">
            Tu règles, tu lances. Tes potes rejoignent avec le code.
          </p>
        </div>

        <Card className="animate-[--animate-fade-up]">
          <IdentityFields
            pseudo={pseudo}
            avatarId={avatarId}
            onPseudo={setPseudo}
            onAvatar={setAvatarId}
          />
        </Card>

        <Card className="animate-[--animate-fade-up] space-y-5">
          <h2 className="font-display text-lg font-bold">Réglages</h2>

          <OptionGroup
            label="Joueurs max"
            value={settings.maxPlayers}
            options={Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
              const v = MIN_PLAYERS + i;
              return { value: v, label: String(v) };
            })}
            onChange={(v) => patch({ maxPlayers: v })}
          />

          <OptionGroup
            label="Manches"
            value={settings.rounds}
            options={ROUNDS_OPTIONS.map((r) => ({ value: r, label: r === 0 ? "Illimité" : String(r) }))}
            onChange={(v) => patch({ rounds: v })}
            hint={settings.rounds === 0 ? "Tu arrêtes quand tu veux" : undefined}
          />

          <OptionGroup
            label="Temps par indice"
            value={settings.timerSeconds}
            options={TIMER_OPTIONS.map((t) => ({ value: t, label: `${t}s` }))}
            onChange={(v) => patch({ timerSeconds: v })}
          />

          <OptionGroup
            label="Tours d'indices"
            hint="avant le vote"
            value={settings.clueTurns}
            options={CLUE_TURNS_OPTIONS.map((t) => ({ value: t, label: String(t) }))}
            onChange={(v) => patch({ clueTurns: v })}
          />

          <OptionGroup
            label="Discussion libre"
            hint="après les indices"
            value={settings.discussionSeconds}
            options={DISCUSSION_OPTIONS.map((d) => ({
              value: d,
              label: d === 0 ? "Non" : `${d}s`,
            }))}
            onChange={(v) => patch({ discussionSeconds: v })}
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
            onChange={(v) => patch({ imposterOverride: v === 0 ? null : v })}
          />

          <div>
            <div className="mb-2 font-display text-sm font-bold">Catégories</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const on = settings.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    aria-pressed={on}
                    className={cx(
                      "rounded-2xl border p-3 text-left transition active:scale-[0.98]",
                      on
                        ? "border-inku-400 bg-inku-50 dark:border-inku-700 dark:bg-inku-950/60"
                        : "border-line bg-bg hover:border-inku-200 dark:hover:border-inku-800",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold">{CATEGORY_LABELS[c]}</span>
                      {c === "oeuvres" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Expert
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{CATEGORY_HINTS[c]}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button full size="lg" onClick={submit} loading={loading}>
            Créer la room
          </Button>
        </div>
      </div>
    </main>
  );
}
