import Image from "next/image";
import { EXPRESSIONS, type Expression } from "@/lib/constants";

/**
 * La mascotte INKU : la pieuvre pourpre au pinceau, dessinée à la main.
 * 11 expressions peintes vivent dans `public/mascots/` — c'est la seule
 * imagerie de la marque, il n'y a ni photo ni illustration générique.
 */
export function Mascot({
  expression = "determined",
  size = 96,
  className = "",
  priority = false,
}: {
  expression?: Expression;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const safe: Expression = EXPRESSIONS.includes(expression) ? expression : "determined";
  return (
    <Image
      src={`/mascots/inku-${safe}.png`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}

/** Variantes du monogramme K, la signature de l'éditeur. */
export type MarkVariant = "violet" | "rose" | "blanc" | "noir" | "badge";

const MARK_SRC: Record<MarkVariant, string> = {
  violet: "/brand/inku-k-violet.png",
  rose: "/brand/inku-k-rose.png",
  blanc: "/brand/inku-k-blanc.png",
  noir: "/brand/inku-k-noir.png",
  badge: "/brand/inku-badge-gradient.png",
};

/**
 * Le monogramme INKU : un « K » enlacé par un tentacule à ventouses.
 * Ne jamais le recolorer, le détourer ni le poser en lockup à côté du titre
 * IMPOSTEUR — INKU signe le produit, il ne co-signe pas le jeu.
 */
export function InkuMark({
  variant = "violet",
  size = 20,
  className = "",
}: {
  variant?: MarkVariant;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={MARK_SRC[variant]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}
