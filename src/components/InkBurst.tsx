/**
 * L'éclaboussure d'encre derrière le titre — l'art vient de la maquette de
 * référence INKU. `preserveAspectRatio="none"` : la forme s'étire pour
 * épouser le bloc de titre quelle que soit sa largeur.
 *
 * Important : le conteneur qui reçoit ce composant doit garder un ratio
 * proche de celui du viewBox (1000×260, soit ~3.85:1). Si le conteneur est
 * beaucoup plus large/étroit que ça, l'étirement non uniforme déforme les
 * courbes et peut faire apparaître un angle presque droit (vu une fois en
 * bas à gauche) là où le tracé n'en a pourtant aucun. D'où l'usage de
 * `aspect-[1000/260]` côté appelant plutôt que des hauteur/largeur
 * indépendantes.
 *
 * Se place en `absolute` derrière un titre : le parent doit être `relative
 * isolate`, et le titre passe au-dessus en blanc.
 */
export function InkBurst({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 260"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="inkBurstGradient" x1="0" y1="0" x2="1" y2=".35">
          <stop stopColor="#F2409B" />
          <stop offset=".48" stopColor="#A23CF0" />
          <stop offset="1" stopColor="#5E43DB" />
        </linearGradient>
      </defs>
      <g fill="url(#inkBurstGradient)">
        <path d="M18 134C54 126 77 112 103 92c15-12 25-13 39-4 11 7 14 18 32 12 29-10 42-34 80-28 22 4 35 18 61 11 31-8 46-29 82-23 27 4 38 22 69 16 34-7 48-25 86-18 31 6 39 23 72 19 39-5 54-20 90-12 28 6 41 22 72 17 35-6 57-21 89-12 28 8 34 26 66 24 25-2 49-12 67 2 18 14 5 28 28 37 20 8 41 2 51 15 11 15-6 26-25 29-20 4-14 18-37 21-30 4-38-14-64-5-28 10-23 28-53 31-31 4-38-16-69-6-27 8-22 25-52 27-29 2-36-14-63-4-30 12-25 31-58 32-27 1-34-15-61-4-27 11-20 27-50 28-28 2-33-12-59-3-29 10-25 28-55 28-25 0-33-13-57-4-24 9-19 24-45 25-28 1-39-15-63-6-24 8-22 23-48 25-27 2-39-11-61-4-27 9-28 20-55 17-20-2-31-13-49-9-19 4-31 17-50 14-19-4-28-18-45-15-18 2-31 15-48 11-17-4-17-17-34-19-22-2-35 14-54 4-15-8-6-22-26-29-16-6-35-4-42-16-6-11 5-19-4-31-10-13-25-7-33-21-9-11-2-21-15-31-10-8-20-7-26-17-8-11 3-22-11-28-13-5-29 0-34-12-4-10 8-18-2-28-10-10-28-8-35-17-5-7 5-17-4-25-10-10-28-7-33-18-4-7 5-18-5-24-11-7-24-3-29-14-4-8 6-18-4-27-8-8-21-5-27-15-4-7 5-17-3-23-9-7-24-6-30-16-4-8 7-17-4-25-7-6-20-2-27-14-5-9 5-21-6-28-10-8-24-4-30-16-5-9 5-19-4-27-8-8-25-5-31-17-5-11 8-22-4-32-12-10-31-8-39-21-6-12 11-23 0-36Z" />
        <path d="M43 74c15-20 33-28 47-19 10 7 4 17-8 28-12 10-29 14-39 8-7-5-6-10 0-17Z" />
        <path d="M107 48c7-11 18-14 25-7 6 6 0 15-8 21-8 6-17 7-21 1-3-4-1-9 4-15Z" />
        <path d="M78 198c12-8 25-8 31 1 5 8-4 17-16 21-13 4-25 1-27-7-2-6 3-11 12-15Z" />
        <path d="M943 63c13-8 28-8 36 1 7 8-1 17-14 20-14 4-28 1-32-6-4-6 1-11 10-15Z" />
      </g>
    </svg>
  );
}
