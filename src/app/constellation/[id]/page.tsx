import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { FigureChart } from '@/components/sky/FigureChart';
import { loadAtlasData } from '@/features/characters/load';
import { loadSky } from '@/features/sky/load';
import { loadStories } from '@/features/stories/load';

export async function generateStaticParams() {
  const sky = await loadSky();
  return sky.constellations.map((figure) => ({ id: figure.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const sky = await loadSky();
  const figure = sky.constellations.find((entry) => entry.id === id);
  return {
    title: figure ? `${figure.name} — Icarus Atlas` : 'Constellation — Icarus Atlas',
    description: figure ? `${figure.figure}: what the ancients set among the stars.` : undefined,
  };
}

export default async function ConstellationPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [sky, atlas, stories] = await Promise.all([loadSky(), loadAtlasData(), loadStories()]);
  const figure = sky.constellations.find((entry) => entry.id === id);
  if (!figure) notFound();

  const characterById = new Map(atlas.characters.map((character) => [character.id, character]));
  const sourceNames = new Map(atlas.sources.map((source) => [source.id, source.name]));
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const isFigure = (figure.catasterism?.characters ?? []).flatMap(
    (character) => characterById.get(character) ?? [],
  );
  const namedIn = (figure.namedIn ?? []).flatMap((named) => {
    const story = storyById.get(named.story);
    return story ? [{ story, testimonia: named.testimonia }] : [];
  });
  const starCast = figure.stars.flatMap((star) => {
    const character = star.character ? characterById.get(star.character) : undefined;
    return character ? [{ star, character }] : [];
  });
  const brightest = figure.stars.reduce((best, star) => (star.mag < best.mag ? star : best));
  const neighbours = sky.constellations.filter(
    (entry) => entry.id !== figure.id && entry.catasterism,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-20">
      <CrumbBar
        back={{ href: '/sky', label: 'Back to the sky' }}
        trail={[{ href: '/sky', label: 'The sky' }]}
        current={figure.name}
      />

      <header className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* The plate, as an atlas would engrave it. */}
        <div className="relative rounded-2xl border border-star-olympian/20 bg-cosmos-deep/40 p-6">
          <div className="pointer-events-none absolute inset-3 border border-star-olympian/[0.07]" />
          <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r border-t border-star-olympian/35" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b border-l border-star-olympian/20" />
          <FigureChart figure={figure} className="relative mx-auto h-64 w-64" labelled />
        </div>

        <div className="min-w-0">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
            {figure.asterism ? `An asterism within ${figure.asterism}` : 'A figure in the Greek sky'}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[0.12em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.12)]">
            {figure.name.toUpperCase()}
          </h1>
          {figure.greekName && (
            <p className="mt-1.5 font-body text-2xl italic text-star-olympian/75">
              {figure.greekName}
            </p>
          )}
          <p className="mt-2 font-body text-lg italic text-aether-muted">{figure.figure}</p>
          <p className="mt-4 font-body text-[13px] text-aether-faint">
            {figure.iau.join(' · ')} — {figure.stars.length} stars charted, brightest{' '}
            {brightest.name} at magnitude {brightest.mag.toFixed(2)}
          </p>

          {isFigure.length > 0 && (
            <div className="mt-6">
              <p className="font-display text-[10px] uppercase tracking-[0.22em] text-star-olympian/75">
                Set among the stars as
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {isFigure.map((character) => (
                  <Link
                    key={character.id}
                    href={`/character/${character.id}`}
                    className="border border-star-olympian/35 bg-star-olympian/[0.06] px-4 py-2 font-display text-[12px] uppercase tracking-[0.16em] text-star-olympian transition-all hover:border-star-olympian/60 hover:bg-star-olympian/[0.12] hover:text-aether"
                  >
                    {character.name}
                    <span className="ml-2 font-body normal-case tracking-normal text-aether-faint">
                      {character.greekName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {figure.origin && figure.origin.length > 0 && (
        <section className="mt-14 border-t border-star-olympian/15 pt-8">
          <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-star-olympian/75">
            How it came to the sky
          </h2>
          <div className="mt-5 max-w-3xl space-y-5">
            {figure.origin.map((paragraph) => (
              <div key={paragraph.text}>
                <p className="font-body text-[17px] leading-relaxed text-aether/90">
                  {paragraph.text}
                </p>
                <p className="mt-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">
                  {paragraph.sources.map((id) => sourceNames.get(id) ?? id).join(' · ')}
                  {paragraph.citation && (
                    <span className="ml-2 font-body normal-case tracking-normal italic">
                      {paragraph.citation}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {namedIn.length > 0 && (
        <section className="mt-14 border-t border-star-olympian/15 pt-8">
          <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-star-olympian/75">
            The myths that look up at it
          </h2>
          <p className="mt-2 max-w-2xl font-body text-[14px] italic leading-relaxed text-aether-faint">
            Told at length elsewhere in the atlas — here only because they raise their eyes to
            this figure.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {namedIn.map(({ story, testimonia }) => (
              <Link
                key={story.id}
                href={`/story/${story.id}`}
                className="group block rounded-xl border border-star-olympian/15 bg-star-olympian/[0.035] px-5 py-4 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08]"
              >
                <p className="font-display text-[14px] uppercase tracking-[0.12em] text-aether transition-colors group-hover:text-star-olympian">
                  {story.title}
                </p>
                {testimonia.map((line) => (
                  <p key={line} className="mt-1.5 font-body text-[13px] italic text-aether-faint">
                    {line}
                  </p>
                ))}
              </Link>
            ))}
          </div>
        </section>
      )}

      {starCast.length > 0 && (
        <section className="mt-14 border-t border-star-olympian/15 pt-8">
          <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-star-olympian/75">
            Star by star
          </h2>
          <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-aether-muted">
            The ancients rarely name a constellation star by star — the familiar star names are
            Arabic and astronomical, not mythological. Here they do.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {starCast.map(({ star, character }) => (
              <Link
                key={character.id}
                href={`/character/${character.id}`}
                className="flex items-baseline gap-2 rounded-lg border border-star-olympian/15 bg-star-olympian/[0.03] px-4 py-2.5 transition-all hover:border-star-olympian/40 hover:bg-star-olympian/[0.08]"
              >
                {star.bayer && (
                  <span className="font-body text-[15px] text-star-olympian/80">{star.bayer}</span>
                )}
                <span className="font-body text-[15px] text-aether/90">{star.name}</span>
                <span className="ml-auto font-body text-[12px] italic text-aether-faint">
                  {character.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 border-t border-star-olympian/15 pt-8">
        <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-star-olympian/75">
          Told by
        </h2>
        <ul className="mt-4 space-y-2.5">
          {[
            ...(figure.catasterism?.testimonia ?? []),
            ...(figure.namedIn ?? []).flatMap((named) => named.testimonia),
          ].map((line) => (
            <li
              key={line}
              className="border border-star-olympian/15 bg-star-olympian/[0.03] px-5 py-3 font-body text-[15px] italic leading-relaxed text-aether-muted"
            >
              {line}
            </li>
          ))}
        </ul>
        {!figure.catasterism && (
          <p className="mt-3 font-body text-[14px] italic text-aether-faint">
            No catasterism is recorded for this figure in the sources the atlas keeps — it is simply
            part of the sky.
          </p>
        )}
      </section>

      <section className="mt-14 border-t border-star-olympian/15 pt-8">
        <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-aether-faint">
          The whole chart
        </h2>
        <ul className="mt-4 columns-2 gap-4 sm:columns-3 lg:columns-4">
          {[...figure.stars]
            .sort((a, b) => a.mag - b.mag)
            .map((star, index) => (
              <li
                key={`${star.name}-${index}`}
                className="break-inside-avoid py-1 font-body text-[13px] text-aether-muted"
              >
                {star.bayer && <span className="text-star-olympian/70">{star.bayer} </span>}
                {star.name}
                <span className="text-aether-faint"> · {star.mag.toFixed(2)}</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-star-olympian/15 pt-8">
        <h2 className="font-display text-[11px] uppercase tracking-[0.26em] text-aether-faint">
          Other figures the ancients named
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {neighbours.map((entry) => (
            <Link
              key={entry.id}
              href={`/constellation/${entry.id}`}
              className="rounded-lg border border-glass-border bg-glass px-3.5 py-1.5 font-body text-[13px] text-aether-muted transition-colors hover:border-star-olympian/40 hover:text-aether"
            >
              {entry.name}
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
