import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Mascot } from "@/components/Mascot";
import { InkBurst } from "@/components/InkBurst";
import { Reveal } from "@/components/ui";
import { IconArrowRight, IconTimer, IconUsers } from "@/components/icons";

/** Les trois étapes de la section « Comment jouer ». */
const STEPS = [
  {
    n: "01",
    sfx: "TAP !",
    title: "Crée ou rejoins.",
    body: "Un joueur ouvre le lobby et partage le code. Tout le monde entre depuis son navigateur — pas d'appli, pas de compte.",
    shape: "radius-blob-a",
    tilt: "sm:-rotate-1",
  },
  {
    n: "02",
    sfx: "CHUT…",
    title: "Le même mot. Sauf un.",
    body: "Tout le monde voit le même mot d'anime. L'imposteur en reçoit un proche — sans savoir lequel des deux est le bon.",
    shape: "radius-blob-b",
    tilt: "sm:rotate-1",
  },
  {
    n: "03",
    sfx: "VOTE !",
    title: "Un indice, puis accuse.",
    body: "Chacun lâche son indice à son tour. Observez les hésitations, puis votez pour démasquer le menteur.",
    shape: "radius-blob-c",
    tilt: "sm:-rotate-[0.5deg]",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh overflow-x-clip">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
        <AppHeader />
      </div>

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative">
        <div aria-hidden="true" className="halftone left-[-80px] top-8 h-52 w-52" />

        <div className="mx-auto grid w-full max-w-[1160px] items-center gap-2 px-4 pb-16 pt-6 sm:px-8 sm:pb-24 lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)] lg:gap-6 lg:pt-4">
          {/* La mascotte passe au-dessus du texte sur mobile, à droite sur desktop. */}
          <div className="relative order-1 mx-auto grid w-[min(330px,72vw)] place-items-center lg:order-2 lg:-mr-10 lg:w-[min(500px,42vw)] lg:justify-self-end">
            <div
              aria-hidden="true"
              className="absolute aspect-square w-[82%] animate-blob-drift rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),rgba(242,64,155,0.06)_46%,transparent_70%)] blur-sm"
            />
            <Mascot
              expression="sneaky"
              size={500}
              priority
              className="relative w-full animate-float drop-shadow-[0_30px_34px_rgba(16,2,38,0.34)]"
            />
          </div>

          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              <span className="h-[2px] w-6 -rotate-6 bg-encre-500" />
              Le jeu social anime par INKU
            </p>

            {/* L'éclaboussure est derrière ; le titre passe en blanc par-dessus. */}
            <div className="relative isolate mx-auto grid w-fit max-w-full place-items-center lg:mx-0">
              <InkBurst className="absolute left-[-20%] top-[-27%] -z-10 h-[154%] w-[136%] origin-[22%_56%] animate-ink-spread drop-shadow-[0_22px_36px_rgba(72,12,123,0.27)]" />
              {/* nowrap : le titre est un bloc, jamais coupé. La taille est
                  calée pour tenir dans la gouttière même avec la police de
                  repli, plus large que Clash Display. */}
              <h1 className="animate-title-reveal whitespace-nowrap font-display text-[clamp(46px,15vw,98px)] font-bold leading-[0.86] tracking-[-0.07em] text-white [text-shadow:0_3px_0_rgba(31,5,72,0.8),0_12px_26px_rgba(38,7,70,0.28)] md:text-[clamp(64px,7vw,108px)] lg:text-[clamp(78px,6vw,116px)]">
                IMPOSTEUR
              </h1>
            </div>

            <p className="mx-auto mt-6 max-w-[620px] text-balance text-[17px] font-medium leading-relaxed text-muted sm:text-[19px] lg:mx-0">
              Tout le monde reçoit le même mot d&apos;anime.{" "}
              <strong className="font-bold text-ink">Sauf un.</strong> Donne des indices, repère le
              menteur — ou fais-toi passer pour l&apos;un des leurs.
            </p>

            <div className="mx-auto mt-7 grid w-full max-w-[430px] gap-3 sm:grid-cols-2 lg:mx-0 lg:max-w-[560px]">
              <Link
                href="/creer"
                className="shine-sweep brand-gradient inline-flex h-14 items-center justify-center gap-2 rounded-full font-display text-lg font-bold text-white shadow-[0_13px_30px_-10px_rgba(116,55,208,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.96]"
              >
                Créer une partie
                <IconArrowRight size={20} />
              </Link>
              <Link
                href="/rejoindre"
                className="inline-flex h-14 items-center justify-center rounded-full border border-line bg-surface font-display text-lg font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-inku-300 active:scale-[0.96] dark:hover:border-inku-700"
              >
                Rejoindre
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-xs font-bold text-muted lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <IconUsers size={15} /> 3 à 12 joueurs
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-encre-500/70" />
              <span className="inline-flex items-center gap-1.5">
                <IconTimer size={15} /> ~5 min par manche
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-encre-500/70" />
              <span>Sans installation</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto h-px w-full max-w-[1400px] bg-gradient-to-r from-transparent via-line to-transparent"
        />
      </section>

      {/* --------------------------- Comment jouer --------------------------- */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div aria-hidden="true" className="halftone right-[-90px] top-20 h-56 w-56 opacity-25" />

        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
          <Reveal className="sm:flex sm:items-end sm:justify-between sm:gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-encre-500">
                3 étapes. Un seul menteur.
              </p>
              <h2 className="mt-2 font-display text-[clamp(38px,10vw,58px)] font-bold leading-[0.95] tracking-[-0.045em]">
                Comment jouer
              </h2>
            </div>
            <p className="mt-4 max-w-[520px] leading-relaxed text-muted sm:mt-0">
              Pas de règles à apprendre pendant vingt minutes. Tout le monde prend son téléphone, la
              partie démarre, et les soupçons aussi.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <article className={`ink-card ${s.shape} ${s.tilt} relative h-full p-6 sm:p-7`}>
                  <span className="absolute right-4 top-[-15px] rotate-[-9deg] font-display text-lg font-bold uppercase tracking-[0.08em] text-encre-500 [text-shadow:2px_2px_0_var(--paper-line)]">
                    {s.sfx}
                  </span>
                  <span className="inline-grid h-10 w-10 rotate-[-8deg] place-items-center rounded-[50%_44%_55%_45%] bg-paper-line font-display text-base font-bold text-white shadow-[3px_3px_0_var(--color-encre-500)]">
                    {s.n}
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-bold leading-[1.03] tracking-[-0.02em]">
                    {s.title}
                  </h3>
                  <p className="mt-2 font-semibold leading-relaxed text-paper-muted">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA finale ----------------------------- */}
      <section className="px-4 pb-24 pt-4 sm:px-8 sm:pb-32">
        <Reveal className="mx-auto max-w-[880px]">
          <div className="relative rounded-[18px_44px_17px_34px] border border-line bg-surface p-8 text-center shadow-[0_24px_60px_-20px_rgba(42,15,64,0.35)] sm:p-14">
            <div
              aria-hidden="true"
              className="absolute -left-6 -top-6 -z-10 h-16 w-24 -rotate-[18deg] rounded-[60%_40%_72%_28%/48%_65%_35%_52%] bg-gradient-to-br from-encre-500 to-inku-500"
            />
            <Mascot
              expression="smug"
              size={170}
              className="absolute -top-20 right-2 w-[100px] rotate-[8deg] drop-shadow-[0_14px_20px_rgba(0,0,0,0.25)] sm:-top-28 sm:right-[4%] sm:w-[150px]"
            />
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-encre-500">
              Tu crois savoir mentir ?
            </p>
            <h2 className="mt-2 font-display text-[clamp(38px,11vw,64px)] font-bold leading-[0.95] tracking-[-0.045em]">
              Prouve-le à tes potes.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] leading-relaxed text-muted">
              Crée le lobby, balance le code dans le groupe et découvre qui craque le premier.
            </p>
            <Link
              href="/creer"
              className="shine-sweep brand-gradient mx-auto mt-7 inline-flex h-14 w-full max-w-[340px] items-center justify-center gap-2 rounded-full font-display text-lg font-bold text-white shadow-[0_13px_30px_-10px_rgba(116,55,208,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.96]"
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

      <footer className="mx-auto w-full max-w-[1160px] px-4 pb-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs font-semibold text-muted">
          <span>
            <span className="text-ink">INKU</span> — anime, manga &amp; jeux entre potes.
          </span>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  );
}
