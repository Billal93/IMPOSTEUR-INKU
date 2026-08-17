import type { AvatarDef } from "@/lib/constants";

/**
 * Mascotte INKU : pieuvre pourpre stylisée, ligne arrondie.
 * `accessory` produit les variantes de la galerie d'avatars, dont la
 * variante « déguisée » (masque / cape) utilisée sur les écrans imposteur.
 */
export function Mascot({
  def,
  size = 64,
  className = "",
  eyes = "normal",
}: {
  def: Pick<AvatarDef, "body" | "accent" | "accessory">;
  size?: number;
  className?: string;
  eyes?: "normal" | "sneaky" | "happy";
}) {
  const { body, accent, accessory } = def;
  const dark = shade(body, -0.18);
  const light = shade(body, 0.16);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      {accessory === "cape" && (
        <path
          d="M20 40c-8 12-10 30-6 44 12-6 22-8 36-8s24 2 36 8c4-14 2-32-6-44-8 10-40 10-60 0z"
          fill={accent}
          opacity="0.85"
        />
      )}

      {/* Tentacules */}
      <path
        d="M18 62c0 0-6 14-2 22 3 6 10 4 11-2 1-5-1-11-1-11zM34 70c0 0-5 15 0 21 4 5 10 2 10-4 0-5-3-12-3-12zM66 70c0 0 5 15 0 21-4 5-10 2-10-4 0-5 3-12 3-12zM82 62c0 0 6 14 2 22-3 6-10 4-11-2-1-5 1-11 1-11z"
        fill={dark}
      />
      <path
        d="M50 72c0 0-4 15 0 21 3 4 8 2 8-4 0-5-3-13-3-13z"
        fill={dark}
        opacity="0.85"
      />

      {/* Tête / corps */}
      <path
        d="M50 10c-20 0-34 14-34 33 0 12 5 21 12 26 6 4 14 6 22 6s16-2 22-6c7-5 12-14 12-26 0-19-14-33-34-33z"
        fill={body}
      />
      <ellipse cx="36" cy="30" rx="10" ry="7" fill={light} opacity="0.5" />

      {/* Yeux */}
      {eyes === "sneaky" ? (
        <>
          <path d="M31 46c4-4 11-4 15 0" stroke="#1b1226" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M54 46c4-4 11-4 15 0" stroke="#1b1226" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : eyes === "happy" ? (
        <>
          <path d="M31 48c4 5 11 5 15 0" stroke="#1b1226" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M54 48c4 5 11 5 15 0" stroke="#1b1226" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="38" cy="47" rx="6.5" ry="7.5" fill="#fff" />
          <ellipse cx="62" cy="47" rx="6.5" ry="7.5" fill="#fff" />
          <circle cx="39.5" cy="48.5" r="3.4" fill="#1b1226" />
          <circle cx="63.5" cy="48.5" r="3.4" fill="#1b1226" />
        </>
      )}

      {/* Petite bouche */}
      <path d="M46 60c2 2.5 6 2.5 8 0" stroke="#1b1226" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />

      {/* Accessoires */}
      {accessory === "mask" && (
        <>
          <path
            d="M24 42c8-4 16-5 26-5s18 1 26 5c1 6-1 11-4 13-5 3-11-1-14-4-3 3-5 4-8 4s-5-1-8-4c-3 3-9 7-14 4-3-2-5-7-4-13z"
            fill={accent}
            opacity="0.95"
          />
          <ellipse cx="38" cy="47" rx="6" ry="5" fill="#0e0d12" opacity="0.85" />
          <ellipse cx="62" cy="47" rx="6" ry="5" fill="#0e0d12" opacity="0.85" />
        </>
      )}
      {accessory === "cap" && (
        <>
          <path d="M18 30c2-13 15-21 32-21s30 8 32 21z" fill={accent} />
          <path d="M18 30c-6 1-10 3-12 6 12 3 24 4 44 4s32-1 44-4c-2-3-6-5-12-6z" fill={shade(accent, -0.2)} />
        </>
      )}
      {accessory === "glasses" && (
        <>
          <circle cx="38" cy="47" r="10" fill="none" stroke={accent} strokeWidth="3.5" />
          <circle cx="62" cy="47" r="10" fill="none" stroke={accent} strokeWidth="3.5" />
          <path d="M48 47h4" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {accessory === "bow" && (
        <path
          d="M50 14c-6-8-18-9-18-1s12 7 18 1c6 6 18 7 18-1s-12-7-18 1z"
          fill={accent}
        />
      )}
      {accessory === "headband" && (
        <>
          <rect x="16" y="30" width="68" height="9" rx="4.5" fill={accent} />
          <path d="M84 34l14 5-14 6z" fill={accent} opacity="0.8" />
        </>
      )}
      {accessory === "horns" && (
        <>
          <path d="M26 18c-4-7-3-12 1-14 3 6 7 9 10 10z" fill={accent} />
          <path d="M74 18c4-7 3-12-1-14-3 6-7 9-10 10z" fill={accent} />
        </>
      )}
    </svg>
  );
}

/** Icône compacte INKU : juste le tentacule, sans wordmark. */
export function InkuTentacle({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M50 8c-19 0-32 13-32 31 0 9 3 16 8 21-2 8-1 17 3 24 4 7 12 10 18 7 6-3 8-11 5-18-2-5-5-8-5-13 0-4 3-6 3-11h1c0 5 3 7 3 11 0 5-3 8-5 13-3 7-1 15 5 18 6 3 14 0 18-7 4-7 5-16 3-24 5-5 8-12 8-21 0-18-13-31-33-31z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Éclaircit (t > 0) ou assombrit (t < 0) une couleur hex. */
function shade(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}
