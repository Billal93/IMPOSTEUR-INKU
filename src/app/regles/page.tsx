import { AppHeader } from "@/components/AppHeader";
import { Mascot } from "@/components/Mascot";
import { CATEGORIES, CATEGORY_LABELS, PROXIMITY_LABELS, PROXIMITY_TYPES } from "@/lib/constants";

export const metadata = { title: "Les règles — IMPOSTEUR" };

export default function ReglesPage() {
  return (
    <main className="min-h-dvh pb-24">
      <AppHeader back="/" compact />

      <article className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-6">
        <header className="text-center">
          <div className="mx-auto w-fit">
            <Mascot
              def={{ body: "#7C3AED", accent: "#EC4899", accessory: "mask" }}
              size={72}
              eyes="sneaky"
            />
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Les règles</h1>
          <p className="mt-1 text-sm text-muted">
            Tu peux apprendre en jouant, mais voilà le détail.
          </p>
        </header>

        <Section title="Le format">
          <p>
            Une partie, c&apos;est au minimum <b>un mot, un tour d&apos;indices et un vote</b>. Ça se
            joue en quelques minutes. Si tu veux enchaîner, l&apos;hôte règle le nombre de manches
            dans les paramètres avancés — chaque manche apporte un nouveau mot.
          </p>
        </Section>

        <Section title="Le principe">
          <p>
            Tout le monde reçoit le même mot tiré d&apos;un anime ou d&apos;un manga. Tout le monde,
            sauf le ou les <b>imposteurs</b> : eux reçoivent un mot <b>proche mais différent</b>.
            Personne ne sait qui est qui.
          </p>
          <p>
            Chacun donne un indice à son tour. Trop précis, tu grilles les imposteurs — et
            toi-même. Trop vague, on va te suspecter.
          </p>
        </Section>

        <Section title="Le déroulé d'une manche">
          <Steps
            items={[
              "Tu reçois ton mot. Personne ne sait si c'est le même que le sien.",
              "Chacun donne un indice, dans l'ordre. Par défaut il n'y a aucun chrono : tu prends le temps qu'il te faut.",
              "L'hôte peut activer des chronos dans les paramètres avancés. Dans ce cas, ne pas répondre à temps te fait passer ton tour (et te coûte un point).",
              "Selon les réglages, un ou plusieurs tours d'indices s'enchaînent, éventuellement suivis d'une discussion libre.",
              "Vote simultané : personne ne voit les votes des autres avant la révélation groupée.",
              "Le plus voté est éliminé et son rôle est révélé.",
            ]}
          />
        </Section>

        <Section title="Qui gagne">
          <ul className="space-y-2">
            <li>
              <b>Les civils</b> gagnent si l&apos;imposteur est éliminé et qu&apos;il ne devine pas
              le mot.
            </li>
            <li>
              <b>L&apos;imposteur</b> gagne s&apos;il n&apos;est jamais démasqué, s&apos;il devine le
              mot des civils au moment d&apos;être éliminé, ou s&apos;il ne reste que deux joueurs en
              lice dont lui.
            </li>
          </ul>
          <p className="rounded-2xl bg-inku-50 px-4 py-3 text-sm dark:bg-inku-950/60">
            <b>Points :</b> +1 par manche pour chaque civil survivant, +3 pour l&apos;imposteur qui
            s&apos;en sort, 0 pour l&apos;imposteur démasqué qui rate sa devinette, −1 quand tu
            passes ton tour.
          </p>
        </Section>

        <Section title="Les cas particuliers">
          <Definition term="Égalité au vote">
            On revote entre les ex æquo uniquement. Si ça reste à égalité, personne n&apos;est
            éliminé et un tour d&apos;indice supplémentaire est joué.
          </Definition>
          <Definition term="Personne ne joue">
            Sans chrono, la partie attend. L&apos;hôte peut activer des durées par phase dans les
            paramètres avancés si ton groupe a tendance à s&apos;éterniser.
          </Definition>
          <Definition term="Tu perds la connexion">
            Tu as un peu plus d&apos;une minute pour revenir : ta place est gardée. Passé ce délai,
            tu es marqué « parti », ton tour est passé automatiquement et tu ne comptes plus dans le
            vote.
          </Definition>
          <Definition term="L'hôte s'en va">
            Le rôle d&apos;hôte passe automatiquement au joueur suivant, par ordre d&apos;arrivée.
          </Definition>
          <Definition term="Tu rejoins en pleine manche">
            Tu regardes la fin de la manche en cours, et tu entres en jeu à la suivante.
          </Definition>
          <Definition term="Moins de 3 joueurs connectés">
            La partie se met en pause. Si le quorum n&apos;est pas rétabli en 2 minutes, elle est
            annulée.
          </Definition>
          <Definition term="Un indice qui contient le mot">
            Le serveur le refuse et te le redemande. Pour les cas plus subtils, un bouton
            « signaler » apparaît après la manche.
          </Definition>
        </Section>

        <Section title="Les catégories">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold"
              >
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
          <p className="mt-3">
            Les paires sont choisies à la main, jamais générées au hasard. Chacune a un type de
            proximité :
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROXIMITY_TYPES.map((p) => (
              <span
                key={p}
                className="rounded-full bg-inku-100 px-3 py-1.5 text-sm font-semibold text-inku-700 dark:bg-inku-950 dark:text-inku-200"
              >
                {PROXIMITY_LABELS[p]}
              </span>
            ))}
          </div>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[--radius-card] border border-line bg-surface p-5">
      <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted [&_b]:text-ink">
        {children}
      </div>
    </section>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="brand-gradient mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-display text-xs font-bold text-white">
            {i + 1}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

function Definition({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-3">
      <p className="font-display text-sm font-bold text-ink">{term}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}
