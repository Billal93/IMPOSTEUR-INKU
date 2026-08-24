"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { IdentityFields } from "@/components/IdentityFields";
import { Collapsible, GameSettingsForm, settingsSummary } from "@/components/GameSettingsForm";
import { Button, Card, Notice } from "@/components/ui";
import { saveProfile, saveSession, useProfile } from "@/lib/session";
import { checkPseudo } from "@/lib/text";
import { DEFAULT_AVATAR, DEFAULT_SETTINGS, type RoomSettings } from "@/lib/constants";

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

      <div className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Créer une partie</h1>
          <p className="mt-1 text-sm text-muted">
            Choisis un pseudo, on te donne un code à partager. C&apos;est tout.
          </p>
        </div>

        <Card>
          <IdentityFields
            pseudo={pseudo}
            avatarId={avatarId}
            onPseudo={setPseudo}
            onAvatar={setAvatarId}
          />
        </Card>

        {/* Tout le reste a un défaut qui marche : replié, et optionnel. */}
        <Card>
          <Collapsible
            title="Paramètres avancés"
            subtitle={settingsSummary(settings)}
          >
            <GameSettingsForm settings={settings} onChange={patch} />
          </Collapsible>
        </Card>

        {error && <Notice tone="error">{error}</Notice>}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/85 p-4 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Button full size="lg" onClick={submit} loading={loading}>
            Créer la room
          </Button>
        </div>
      </div>
    </main>
  );
}
