import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Mascot } from "@/components/Mascot";
import { IconArrowRight, IconTimer, IconUsers } from "@/components/icons";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <AppHeader />

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-24 pt-10 text-center sm:pt-16">
        <div className="animate-[--animate-float]">
          <Mascot
            def={{ body: "#7C3AED", accent: "#EC4899", accessory: "mask" }}
            size={116}
            eyes="sneaky"
          />
        </div>

        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
          <span className="brand-text">IMPOSTEUR</span>
        </h1>

        <p className="mt-3 max-w-md text-balance text-[15px] leading-relaxed text-muted">
          Tout le monde reçoit le même mot d&apos;anime. Sauf un. Donne des indices,
          repère le menteur — ou fais-toi passer pour l&apos;un des leurs.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/creer"
            className="brand-gradient inline-flex h-14 items-center justify-center gap-2 rounded-full font-display text-lg font-bold text-white shadow-[0_10px_30px_-12px_rgba(124,58,237,0.9)] transition active:scale-[0.97]"
          >
            Créer une partie
            <IconArrowRight size={20} />
          </Link>
          <Link
            href="/rejoindre"
            className="inline-flex h-14 items-center justify-center rounded-full border border-line bg-surface font-display text-lg font-bold text-ink transition hover:border-inku-300 active:scale-[0.97] dark:hover:border-inku-700"
          >
            Rejoindre avec un code
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconUsers size={15} /> 3 à 12 joueurs
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconTimer size={15} /> ~5 min par manche
          </span>
          <span>Sur ton téléphone, sans installer</span>
        </div>

        <div className="mt-14 grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            { n: "1", t: "Un mot pour tous", d: "Sauf l'imposteur, qui en reçoit un très proche." },
            { n: "2", t: "Un indice chacun", d: "Assez précis pour convaincre, assez flou pour survivre." },
            { n: "3", t: "Le vote", d: "Tout le monde vote en même temps. Puis on révèle." },
          ].map((s) => (
            <div key={s.n} className="rounded-[--radius-card] border border-line bg-surface p-4">
              <span className="brand-gradient inline-grid h-7 w-7 place-items-center rounded-full font-display text-sm font-bold text-white">
                {s.n}
              </span>
              <h2 className="mt-3 font-display text-base font-bold">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>

        <Link
          href="/regles"
          className="mt-8 text-sm font-semibold text-inku-600 underline-offset-4 hover:underline dark:text-inku-300"
        >
          Voir les règles en détail
        </Link>
      </section>
    </main>
  );
}
