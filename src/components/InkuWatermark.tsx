import { InkuTentacle } from "./Mascot";

/**
 * Signature éditeur, façon watermark « Minecraft Java Edition » :
 * en permanence, coin bas-droit, petit et semi-transparent.
 * Jamais dans le titre du jeu, jamais cliquable pour ne pas gêner le jeu.
 */
export function InkuWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 right-3 z-50 flex select-none items-center gap-1.5 opacity-25 mix-blend-luminosity"
    >
      <InkuTentacle size={16} className="text-inku-600 dark:text-inku-300" />
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-inku-700 dark:text-inku-200">
        INKU
      </span>
    </div>
  );
}
