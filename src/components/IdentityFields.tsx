"use client";

import { AvatarPicker } from "./Avatar";
import { Input } from "./ui";

export function IdentityFields({
  pseudo,
  avatarId,
  onPseudo,
  onAvatar,
}: {
  pseudo: string;
  avatarId: string;
  onPseudo: (v: string) => void;
  onAvatar: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="pseudo" className="mb-2 block font-display text-sm font-bold">
          Ton pseudo
        </label>
        <Input
          id="pseudo"
          value={pseudo}
          onChange={(e) => onPseudo(e.target.value)}
          placeholder="Ex : Kagura"
          maxLength={15}
          autoComplete="nickname"
          enterKeyHint="done"
        />
        <p className="mt-1.5 text-xs text-muted">3 à 15 caractères.</p>
      </div>

      <div>
        <span className="mb-2 block font-display text-sm font-bold">Ton avatar</span>
        <AvatarPicker value={avatarId} onChange={onAvatar} />
      </div>
    </div>
  );
}
