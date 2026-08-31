import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Mascot } from "@/components/Mascot";
import { Reveal } from "@/components/ui";
import { IconArrowRight, IconTimer, IconUsers } from "@/components/icons";

export default function Home() {
  return (
    <main className="min-h-dvh overflow-x-clip">
      <AppHeader />

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-20 pt-8 text-center sm:pb-28 sm:pt-16">
        <div aria-hidden="true" className="halftone left-[-70px] top-10 h-44 w-44" />

        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          <span className="h-[2px] w-6 -rotate-6 bg-encre-500" />
          Le jeu social anime par INKU
        </p>

        <div className="relative isolate mx-auto grid w-fit place-items-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 400 160"
            className="absolute -inset-x-[18%] -inset-y-[38%] -z-10 animate-[--animate-ink-spread] text-transparent"
          >
            <defs>
              <linearGradient id="heroInk" x1="0" y1="0" x2="1" y2="0.4">
                <stop stopColor="var(--color-encre-500)" />
                <stop offset="0.5" stopColor="var(--color-inku-600)" />
                <stop offset="1" stopColor="var(--color-inku-400)" />
              </linearGradient>
            </defs>
            <path
              fill="url(#heroInk)"
              opacity="0.9"
              d="M22 88C46 62 70 46 104 46c22 0 30 14 54 12 30-2 44-24 78-20 26 3 34 20 62 18 32-2 42-22 76-16 27 5 32 22 60 20 30-2 42-18 66-8 18 8 20 22 8 34-10 10-26 10-34 22-9 13 4 24-10 34-12 9-28 2-36 14-8 11 6 22-8 32-13 9-30 0-40 11-9 10 3 22-12 30-14 8-30-2-42 8-11 10 0 22-16 28-15 6-30-4-44 4-13 8-8 20-24 24-15 4-28-6-40 0-11 6-6 18-20 20-13 2-24-8-34-4-9 4-6 14-18 14-11 0-16-10-26-10-9 0-14 10-24 8-9-2-10-12-18-16-9-4-18 2-24-6-6-8 2-16-4-24-6-8-16-6-20-14-4-8 4-16-2-24-6-8-16-6-18-16-2-8 6-16 0-24-6-8-16-6-16-16 0-8 8-14 4-22-4-8-14-8-14-18 0-9 10-14 8-22-2-9-12-12-10-22 2-9 12-12 12-22 0-9-8-14-4-22Z"
            />
          </svg>
          <h1 className="brand-text animate-[--animate-title-reveal] font-display text-6xl font-bold tracking-tight sm:text-8xl">
            IMPOSTEUR
          </h1>
        </div>

        <p className="mt-5 max-w-md text-balance text-[15px] leading-relaxed text-muted">
          Tout le monde reçoit le même mot d&apos;anime. <strong className="text-ink">Sauf un.</strong>{" "}
          Donne des indices, repère le menteur — ou fais-toi passer pour l&apos;un des leurs.
        </p>

        <div className="relative mt-8 grid w-fit place-items-center">
          <div
            aria-hidden="true"
            className="absolute h-40 w-40 animate-[--animate-blob-drift] rounded-full bg-gradient-to-br from-encre-500/25 to-inku-500/10 blur-2xl"
          />
          <Mascot expression="sneaky" size={132} priority className="relative animate-[--animate-float]" />
        </div>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/creer"
            className="shine-sweep brand-gradient inline-flex h-14 items-center justify-center gap-2 rounded-full font-display text-lg font-bold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.9)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96]"
          >
            Créer une partie
            <IconArrowRight size={20} />
          </Link>
          <Link
            href="/rejoindre"
            className="inline-flex h-14 items-center justify-center rounded-full border border-line bg-surface font-display text-lg font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-inku-300 active:scale-[0.96] dark:hover:border-inku-700"
          >
            Rejoindre avec un code
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconUsers size={15} /> 3 à 12 joueurs
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-encre-500/70" />
          <span className="inline-flex items-center gap-1.5">
            <IconTimer size={15} /> ~5 min par manche
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-encre-500/70" />
          <span>Sur ton téléphone, sans installer</span>
        </div>
      </section>

      {/* --------------------------- Comment jouer --------------------------- */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div aria-hidden="true" className="halftone right-[-90px] top-16 h-56 w-56 opacity-25" />
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-encre-500">
              3 étapes. Un seul menteur.
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Comment jouer
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-4">
            {[
              {
                n: "01",
                sfx: "TAP !",
                t: "Crée ou rejoins.",
                d: "Un joueur ouvre le lobby, partage le code. Tout le monde entre depuis son navigateur — pas d'appli.",
              },
              {
                n: "02",
                sfx: "CHUT…",
                t: "Le même mot. Sauf un.",
                d: "Tout le monde voit le même mot d'anime. L'imposteur voit un mot proche, sans savoir lequel des deux est le bon.",
              },
              {
                n: "03",
                sfx: "VOTE !",
                t: "Indice, puis accuse.",
                d: "Chacun lâche un indice à son tour. Observez les hésitations, puis votez pour démasquer le menteur.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div
                  className={cxRadius(i)}
                >
                  <span className="absolute right-4 top-[-14px] rotate-[-8deg] font-display text-base font-bold uppercase tracking-wide text-encre-500 [text-shadow:2px_2px_0_var(--paper-line)]">
                    {s.sfx}
                  </span>
                  <span className="inline-grid h-9 w-9 rotate-[-8deg] place-items-center rounded-[50%_44%_55%_45%] bg-paper-line font-display text-base font-bold text-paper shadow-[3px_3px_0_var(--color-encre-500)]">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold leading-tight">{s.t}</h3>
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-paper-muted">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA finale ----------------------------- */}
      <section className="px-4 pb-24 pt-4 sm:pb-32">
        <Reveal className="mx-auto max-w-2xl">
          <div className="relative overflow-visible rounded-[18px_44px_17px_34px] border border-line bg-surface p-8 text-center shadow-[0_24px_60px_-20px_rgba(42,15,64,0.35)] sm:p-14">
            <div
              aria-hidden="true"
              className="absolute -left-6 -top-6 h-16 w-24 -rotate-[18deg] rounded-[60%_40%_72%_28%/48%_65%_35%_52%] bg-gradient-to-br from-encre-500 to-inku-500"
            />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-encre-500">
              Tu crois savoir mentir ?
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Prouve-le à tes potes.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Crée le lobby, balance le code dans le groupe et découvre qui craque le premier.
            </p>
            <Link
              href="/creer"
              className="shine-sweep brand-gradient mx-auto mt-6 inline-flex h-14 w-full max-w-xs items-center justify-center gap-2 rounded-full font-display text-lg font-bold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.9)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96]"
            >
              Créer une partie
              <IconArrowRight size={20} />
            </Link>
            <Link
              href="/regles"
              className="mt-4 inline-block text-sm font-semibold text-inku-600 underline-offset-4 hover:underline dark:text-inku-300"
            >
              Voir les règles en détail
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 border-t border-line px-4 py-6 text-xs font-semibold text-muted">
        <span>
          <span className="text-ink">INKU</span> — anime, manga &amp; jeux entre potes.
        </span>
        <span>© 2026</span>
      </footer>
    </main>
  );
}

/** Alterne les coins asymétriques des bulles "Comment jouer" pour qu'aucune ne se ressemble. */
function cxRadius(i: number) {
  const shapes = ["radius-blob-a", "radius-blob-b", "radius-blob-c"];
  return `ink-card ${shapes[i % shapes.length]} relative p-6`;
}
