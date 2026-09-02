/**
 * L'éclaboussure d'encre derrière le titre.
 *
 * D'abord tentée en SVG (tracé emprunté à la maquette de référence), mais
 * `preserveAspectRatio="none"` étire la forme de façon non uniforme pour
 * épouser le bloc de titre — ça déforme les courbes et peut faire
 * apparaître un coin presque droit selon le ratio final. Un blob en CSS
 * (border-radius asymétrique) ne peut par construction jamais produire
 * d'angle dur : chaque coin reste une courbe, quelle que soit la taille.
 *
 * Se place en `absolute` derrière un titre : le parent doit être `relative
 * isolate`, et le titre passe au-dessus en blanc.
 */
export function InkBurst({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* La flaque principale, asymétrique — jamais deux coins pareils. */}
      <div
        className="absolute inset-0 rotate-[-1.5deg] rounded-[44%_56%_61%_39%/53%_44%_56%_47%]"
        style={{
          background: "linear-gradient(102deg, #F2409B 0%, #A23CF0 48%, #5E43DB 100%)",
        }}
      />
      {/* Deux éclaboussures satellites, comme des gouttes qui ont giclé. */}
      <div
        className="absolute -left-[4%] -top-[10%] h-[20%] w-[13%] rotate-[18deg] rounded-[60%_40%_55%_45%/50%_60%_40%_50%]"
        style={{ background: "linear-gradient(120deg, #F2409B, #A23CF0)" }}
      />
      <div
        className="absolute right-[2%] -top-[4%] h-[14%] w-[9%] rotate-[-12deg] rounded-[55%_45%_60%_40%/45%_55%_45%_55%]"
        style={{ background: "linear-gradient(120deg, #A23CF0, #5E43DB)" }}
      />
    </div>
  );
}
