"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cx } from "../ui";

/**
 * Le téléphone de la landing : une maquette qui fait défiler les trois temps
 * d'une manche (mot secret → indices → vote). C'est une vitrine, pas le vrai
 * jeu — d'où des composants dédiés, dimensionnés pour un écran de 270 px et
 * volontairement découplés des écrans de partie.
 *
 * L'écran est toujours sombre, quel que soit le thème du site : c'est un
 * téléphone posé dans la page, pas une zone de l'interface.
 */

const SLIDE_MS = 3000;

/** Les trois joueurs figurants, avec leurs avatars réels. */
const CAST = [
  { name: "Yuki", avatar: "fier", clue: "« Hokage »" },
  { name: "Sam", avatar: "sournois", clue: "« Bandeau »" },
  { name: "Noa", avatar: "content", clue: "« Orange »" },
];

const SLIDES = ["Ton mot secret", "Les indices tombent", "Qui ment ?"] as const;

export function PhonePreview() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Défilement automatique, sauf si l'utilisateur préfère moins d'animation
  // ou vient de prendre la main sur les puces.
  useEffect(() => {
    if (paused || reduced.current) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="relative grid min-h-[430px] place-items-end justify-center pt-6 md:min-h-[600px]">
      {/* La tache d'encre derrière l'appareil */}
      <div
        aria-hidden="true"
        className="absolute h-[260px] w-[320px] rotate-[-9deg] translate-x-4 translate-y-4 rounded-[44%_56%_37%_63%/57%_42%_58%_43%] bg-gradient-to-br from-encre-500/85 to-inku-800/90 shadow-[0_34px_70px_rgba(37,5,80,0.38)] sm:h-[350px] sm:w-[440px]"
      />

      <div className="relative z-10 h-[520px] w-[256px] translate-y-14 rotate-[2.4deg] overflow-hidden rounded-[42px] border-[9px] border-[#0b0710] bg-[#08070d] shadow-[0_30px_55px_rgba(0,0,0,0.4),inset_0_0_0_1px_#413449] md:h-[580px] md:w-[288px] md:translate-y-20 md:rotate-[3deg]">
        {/* L'encoche */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-20 h-6 w-[86px] -translate-x-1/2 rounded-b-[14px] bg-[#050408]"
        />

        <div className="absolute inset-0 overflow-hidden bg-[#0d0b12] text-[#f7f3fb]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:9px_9px] [mask-image:linear-gradient(180deg,#000,transparent_70%)]"
          />

          {/* Barre du haut, comme dans le vrai jeu */}
          <div className="relative z-10 flex items-center justify-between px-[18px] pb-3 pt-10">
            <span className="font-display text-[15px] font-bold tracking-[-0.02em]">IMPOSTEUR</span>
            <span className="rounded-full border border-[#322d3c] bg-[#1c1823] px-2.5 py-1.5 text-[10px] font-bold text-[#bdb4c8]">
              Manche 2/5
            </span>
          </div>

          {/* Les écrans qui défilent */}
          <div className="relative h-[420px] md:h-[478px]">
            {SLIDES.map((label, i) => (
              <div
                key={label}
                aria-hidden={i !== index}
                className={cx(
                  "absolute inset-0 px-[18px] pb-4 pt-5 transition-all duration-500 ease-out",
                  i === index
                    ? "translate-x-0 scale-100 opacity-100"
                    : "pointer-events-none translate-x-4 scale-[0.985] opacity-0",
                )}
              >
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#aaa1b6]">
                  {label}
                </p>
                {i === 0 && <SlideWord />}
                {i === 1 && <SlideClues />}
                {i === 2 && <SlideVote />}
              </div>
            ))}
          </div>

          {/* Puces d'écran — cliquables, on peut reprendre la main */}
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
            {SLIDES.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-current={i === index}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                className={cx(
                  "h-[5px] rounded-full transition-all duration-300",
                  i === index ? "w-[17px] bg-encre-500" : "w-[5px] bg-[#4b4453] hover:bg-[#6b6377]",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Écran 1 : le mot ------------------------------ */

function SlideWord() {
  return (
    <>
      <div className="ink-card radius-blob-a mt-4 rotate-[-1deg] px-3.5 py-6 text-center">
        <small className="block text-[10px] font-bold uppercase tracking-[0.1em] text-paper-muted">
          Techniques / pouvoirs
        </small>
        <strong className="mt-1.5 block font-display text-[34px] leading-none tracking-[-0.035em]">
          NARUTO
        </strong>
      </div>
      <p className="mx-auto mt-3.5 max-w-[190px] text-center text-[12px] leading-snug text-[#c6bdcf]">
        Donne un indice assez clair pour tes alliés, mais pas trop évident pour l&apos;imposteur.
      </p>
      <div className="brand-gradient mt-5 grid h-11 place-items-center rounded-[15px_11px_18px_13px] font-display text-sm font-bold text-white">
        J&apos;ai mémorisé
      </div>
    </>
  );
}

/* ---------------------------- Écran 2 : les indices ---------------------------- */

function SlideClues() {
  return (
    <>
      <div className="mt-4 grid gap-2.5">
        {CAST.map((p, i) => (
          <div
            key={p.name}
            className={cx(
              "flex items-center gap-2.5 border border-[#302a39] bg-[#19151f] px-3 py-2.5",
              i % 2 === 0 ? "radius-blob-a" : "radius-blob-b",
            )}
          >
            <MiniAvatar id={p.avatar} name={p.name} />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#9d94a8]">{p.name}</div>
              <div className="truncate font-display text-[14px] font-bold">{p.clue}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 rounded-[18px_10px_16px_12px] border border-dashed border-[#665b73] px-3 py-3 text-center text-[12px] font-bold text-[#f5d7e8]">
        À toi : choisis bien ton indice.
      </div>
    </>
  );
}

/* ------------------------------ Écran 3 : le vote ------------------------------ */

function SlideVote() {
  return (
    <>
      <div className="mt-4 grid gap-2.5">
        {CAST.slice(0, 2).map((p, i) => {
          const selected = p.name === "Sam";
          return (
            <div
              key={p.name}
              className={cx(
                "flex items-center gap-2.5 border px-3 py-2.5",
                i % 2 === 0 ? "radius-blob-a" : "radius-blob-b",
                selected
                  ? "rotate-[-0.4deg] border-encre-500 bg-encre-500/10"
                  : "border-[#302a39] bg-[#19151f]",
              )}
            >
              <MiniAvatar id={p.avatar} name={p.name} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-[13px] font-bold">{p.name}</div>
                <div className="truncate text-[11px] text-[#9d94a8]">{p.clue}</div>
              </div>
              <span
                className={cx(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  selected ? "border-encre-500" : "border-[#655c70]",
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-encre-500" />}
              </span>
            </div>
          );
        })}
      </div>
      <div className="brand-gradient mt-4 grid h-11 place-items-center rounded-[15px_11px_18px_13px] font-display text-sm font-bold text-white">
        Voter pour Sam
      </div>
      <p className="mt-3 text-center text-[11px] leading-snug text-[#9d94a8]">
        Personne ne voit ton vote avant la révélation.
      </p>
    </>
  );
}

function MiniAvatar({ id, name }: { id: string; name: string }) {
  return (
    <Image
      src={`/avatars/${id}.png`}
      alt={name}
      width={30}
      height={30}
      className="h-[30px] w-[30px] shrink-0 rounded-full bg-[#2f2250] object-cover"
    />
  );
}
