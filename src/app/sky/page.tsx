import Link from 'next/link';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { FigureChart } from '@/components/sky/FigureChart';
import { loadSky } from '@/features/sky/load';

export const metadata = {
  title: 'The Greek Sky — Icarus Atlas',
  description:
    "Ptolemy's forty-eight constellations, and what the ancients set among the stars.",
};

export default async function SkyPage() {
  const sky = await loadSky();
  const told = sky.constellations.filter((figure) => figure.catasterism);
  const rest = sky.constellations.filter((figure) => !figure.catasterism);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-20">
      <CrumbBar back={{ href: '/', label: 'Back to the galaxy' }} current="The sky" />

      <header className="mt-8 max-w-2xl">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          The firmament the galaxy hangs in
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.12em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.12)]">
          THE GREEK SKY
        </h1>
        <p className="mt-4 font-body text-[16px] leading-relaxed text-aether-muted">
          Ptolemy set down forty-eight figures, and nearly every one of them is a Greek story: a
          bear that was a girl, a ship that sailed for the fleece, a scorpion set opposite the
          hunter it killed. The ancients tell of whole figures placed among the stars — not, as
          the modern eye expects, of one character per star. Where they do go star by star, the
          atlas follows them there.
        </p>
      </header>

      <section className="mt-14 border-t border-star-olympian/15 pt-8">
        <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-star-olympian/75">
          Figures the ancients tell of
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {told.map((figure) => (
            <Link
              key={figure.id}
              href={`/constellation/${figure.id}`}
              className="group flex items-center gap-4 rounded-xl border border-star-olympian/15 bg-star-olympian/[0.035] px-4 py-3.5 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08]"
            >
              <FigureChart figure={figure} className="h-16 w-16 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-display text-[14px] uppercase tracking-[0.12em] text-aether transition-colors group-hover:text-star-olympian">
                  {figure.name}
                </span>
                {figure.greekName && (
                  <span className="block truncate font-body text-[13px] italic text-star-olympian/70">
                    {figure.greekName}
                  </span>
                )}
                <span className="block truncate font-body text-[12px] italic text-aether-faint">
                  {figure.figure}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-star-olympian/15 pt-8">
        <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-aether-faint">
          The rest of the sky
        </h2>
        <p className="mt-2 max-w-2xl font-body text-[14px] italic leading-relaxed text-aether-faint">
          No catasterism is recorded for these in the sources the atlas keeps. They are charted
          all the same — the sky is not only the part of it that carries a story.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {rest.map((figure) => (
            <Link
              key={figure.id}
              href={`/constellation/${figure.id}`}
              className="rounded-lg border border-glass-border bg-glass px-3.5 py-1.5 font-body text-[13px] text-aether-muted transition-colors hover:border-star-olympian/40 hover:text-aether"
            >
              {figure.name}
              <span className="ml-1.5 text-aether-faint">{figure.figure}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-14 border-t border-glass-border pt-6 font-body text-[12px] leading-relaxed text-aether-faint">
        Star positions from the {sky.attribution.positions.work} ({sky.attribution.positions.licence}).
        Figure lines from{' '}
        <a
          href={sky.attribution.lines.url}
          className="underline-offset-2 hover:text-aether-muted hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          {sky.attribution.lines.work}
        </a>{' '}
        by {sky.attribution.lines.author} ({sky.attribution.lines.licence}).
      </p>
    </main>
  );
}
