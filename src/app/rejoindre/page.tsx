"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { IdentityFields } from "@/components/IdentityFields";
import { Button, Card, Notice } from "@/components/ui";
import { saveProfile, saveSession, getSession, useProfile } from "@/lib/session";
import { checkPseudo, isValidRoomCode, normalizeRoomCode } from "@/lib/text";
import { DEFAULT_AVATAR } from "@/lib/constants";

type Peek = {
  code: string;
  status: "lobby" | "en_cours" | "terminee";
  playerCount: number;
  maxPlayers: number;
  full: boolean;
  players: { pseudo: string; avatarId: string | null }[];
};

function RejoindreInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(normalizeRoomCode(params.get("code") ?? ""));
  const profile = useProfile();
  const [pseudoInput, setPseudo] = useState<string | null>(null);
  const [avatarInput, setAvatarId] = useState<string | null>(null);
  const pseudo = pseudoInput ?? profile?.pseudo ?? "";
  const avatarId = avatarInput ?? profile?.avatarId ?? DEFAULT_AVATAR;

  const [fetchedPeek, setPeek] = useState<Peek | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // L'aperçu n'a de sens que pour le code affiché en ce moment.
  const peek = fetchedPeek?.code === code ? fetchedPeek : null;

  // Aperçu de la room dès que le code est complet.
  useEffect(() => {
    if (!isValidRoomCode(code)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/rooms/${code}/peek`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setPeek(null);
          setError(data?.error ?? null);
        } else {
          setPeek(data as Peek);
          setError(null);
        }
      } catch {
        /* on laissera l'erreur remonter au moment de rejoindre */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function submit() {
    if (!isValidRoomCode(code)) {
      setError("Un code, c'est 6 caractères.");
      return;
    }
    const check = checkPseudo(pseudo);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const existing = getSession(code);
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(existing ? { "x-session-token": existing.token } : {}),
        },
        body: JSON.stringify({ pseudo: check.value, avatarId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Impossible de rejoindre.");
        return;
      }
      saveSession(code, {
        token: data.sessionToken,
        playerId: data.playerId,
        pseudo: check.value,
        avatarId,
      });
      saveProfile(check.value, avatarId);
      router.push(`/room/${code}`);
    } catch {
      setError("Réseau indisponible. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh pb-28">
      <AppHeader back="/" />

      <div className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Rejoindre</h1>
          <p className="mt-1 text-sm text-muted">Demande le code à celui qui a créé la partie.</p>
        </div>

        <Card>
          <label htmlFor="code" className="mb-2 block font-display text-sm font-bold">
            Code de la room
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            placeholder="ABC234"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            className="h-16 w-full rounded-2xl border border-line bg-bg text-center font-display text-3xl font-extrabold uppercase tracking-[0.4em] text-ink placeholder:text-muted/40 focus:border-inku-400 focus:outline-none focus:ring-4 focus:ring-inku-500/15"
          />

          {peek && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-inku-50 px-3 py-2.5 dark:bg-inku-950/60">
              <div className="flex -space-x-2">
                {peek.players.slice(0, 6).map((p, i) => (
                  <Avatar key={i} avatarId={p.avatarId} size={28} className="ring-2 ring-surface" />
                ))}
              </div>
              <span className="text-xs font-semibold text-inku-700 dark:text-inku-200">
                {peek.playerCount}/{peek.maxPlayers} joueurs
                {peek.status === "en_cours" && " · partie en cours"}
              </span>
            </div>
          )}
        </Card>

        <Card>
          <IdentityFields
            pseudo={pseudo}
            avatarId={avatarId}
            onPseudo={setPseudo}
            onAvatar={setAvatarId}
          />
        </Card>

        {peek?.status === "en_cours" && (
          <Notice tone="warn">
            La manche est déjà lancée : tu regardes, et tu joues à partir de la prochaine.
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Button full size="lg" onClick={submit} loading={loading} disabled={!isValidRoomCode(code)}>
            Rejoindre
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function RejoindrePage() {
  return (
    <Suspense fallback={null}>
      <RejoindreInner />
    </Suspense>
  );
}
