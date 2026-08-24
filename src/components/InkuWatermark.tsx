import { InkuMark } from "./Mascot";

/**
 * Signature éditeur, façon watermark « Minecraft Java Edition » :
 * en permanence, coin bas-droit, petit et semi-transparent.
 * INKU signe le produit — le titre du jeu reste IMPOSTEUR, jamais un lockup.
 */
export function InkuWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 right-3 z-50 flex select-none items-center gap-1.5 opacity-25"
    >
      <InkuMark variant="violet" size={18} className="dark:hidden" />
      <InkuMark variant="blanc" size={18} className="hidden dark:block" />
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-inku-700 dark:text-inku-200">
        INKU
      </span>
    </div>
  );
}
