import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadStories, loadStoryCulture } from '@/features/stories/load';
import { loadAtlasData } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import { BackArrow } from '@/components/ui/BackArrow';
import { MainNav } from '@/components/hud/MainNav';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { StoryLegacy } from '@/components/stories/StoryLegacy';

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.map((story) => ({ id: story.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const stories = await loadStories();
  const story = stories.find((s) => s.id === id);
  return { title: story ? `${story.title} — Icarus Atlas` : 'Story — Icarus Atlas' };
}

export default async function StoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [stories, atlas, cities, culture] = await Promise.all([
    loadStories(),
    loadAtlasData(),
    loadCities(),
    loadStoryCulture(id),
  ]);
  const story = stories.find((s) => s.id === id);
  if (!story) notFound();

  const parent = story.parent ? stories.find((s) => s.id === story.parent) : undefined;
  const subStories = stories.filter((s) => s.parent === story.id);
  const sourceNames = new Map(atlas.sources.map((source) => [source.id, source.name]));
  const characterById = new Map(atlas.characters.map((character) => [character.id, character]));
  const cityById = new Map(cities.map((city) => [city.id, city]));

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 pb-24 pt-6">
      {/* Mobile: back arrow to the left of the centered nav, all on the top row. */}
      <div className="relative mb-4 flex items-center sm:hidden">
        <BackArrow href="/stories" label="Back to the myths" />
        <div className="absolute left-1/2 -translate-x-1/2">
          <MainNav active="stories" />
        </div>
      </div>
      <div className="flex flex-col items-start gap-2.5">
        <IcarusBrand compact />
        {/* Desktop keeps the back arrow tucked under the brand. */}
        <div className="hidden sm:block">
          <BackArrow href="/stories" label="Back to the myths" />
        </div>
      </div>

      <header className="mt-8 text-center">
        {parent && (
          <Link
            href={`/story/${parent.id}`}
            className="font-display text-[11px] uppercase tracking-[0.22em] text-nebula-soft transition-colors hover:text-aether"
          >
            An episode of {parent.title} ↗
          </Link>
        )}
        <h1 className="mt-2 font-display text-4xl tracking-[0.16em] text-aether [text-shadow:0_0_46px_rgba(192,132,252,.4)] sm:text-5xl">
          {story.title.toUpperCase()}
        </h1>
        {story.greekTitle && (
          <p className="mt-2 font-body text-xl italic text-aether-muted">{story.greekTitle}</p>
        )}
        <p className="mx-auto mt-5 max-w-xl font-body text-lg italic leading-relaxed text-aether-muted">
          {story.summary.text}
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
          The tale
        </h2>
        <div className="mt-7 flex flex-col gap-8">
          {story.chapters.map((chapter, index) => (
            <article key={chapter.title} title={chapter.citation}>
              <h3 className="font-display text-xl tracking-[0.08em] text-aether">
                <span className="mr-3 text-aether-faint">{String(index + 1).padStart(2, '0')}</span>
                {chapter.title}
                {chapter.topic && (
                  <span
                    className="ml-2 text-sm text-nebula-soft"
                    title="The sources disagree here."
                    aria-label="Disputed episode"
                  >
                    ⚖
                  </span>
                )}
              </h3>
              <p className="mt-2 font-body text-[17px] leading-relaxed text-aether/90">
                {chapter.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {subStories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
            Episodes
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {subStories.map((sub) => (
              <Link
                key={sub.id}
                href={`/story/${sub.id}`}
                className="rounded-full border border-glass-border bg-glass px-4 py-1.5 font-body text-[15px] text-aether/85 transition-colors hover:border-nebula-soft/50 hover:text-aether"
              >
                {sub.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
          Cast
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {story.cast.map((member) => {
            const linked = member.id && characterById.has(member.id);
            const chip = (
              <span
                className={`block rounded-xl border px-4 py-2 text-center transition-colors ${
                  linked
                    ? 'border-nebula-soft/40 bg-nebula-violet/15 hover:border-nebula-soft hover:bg-nebula-violet/25'
                    : 'border-glass-border bg-glass'
                }`}
              >
                <span className={`block font-display text-[14px] tracking-[0.08em] ${linked ? 'text-aether' : 'text-aether-muted'}`}>
                  {member.name}
                </span>
                <span className="block font-body text-[12.5px] italic text-aether-faint">
                  {member.role}
                </span>
              </span>
            );
            return linked ? (
              <Link key={member.name} href={`/character/${member.id}`}>
                {chip}
              </Link>
            ) : (
              <span key={member.name} title="Not yet a star in the galaxy">
                {chip}
              </span>
            );
          })}
        </div>
      </section>

      {story.places.length > 0 && (
        <section className="mt-12">
          <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
            Places
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {story.places.map((place) => {
              const linked = place.id && cityById.has(place.id);
              const chip = (
                <span
                  className={`block rounded-xl border px-4 py-2 text-center transition-colors ${
                    linked
                      ? 'border-star-olympian/40 bg-star-olympian/10 hover:border-star-olympian hover:bg-star-olympian/20'
                      : 'border-glass-border bg-glass'
                  }`}
                >
                  <span className={`block font-display text-[14px] tracking-[0.08em] ${linked ? 'text-star-olympian' : 'text-aether-muted'}`}>
                    {place.name}
                  </span>
                  {place.role && (
                    <span className="block font-body text-[12.5px] italic text-aether-faint">
                      {place.role}
                    </span>
                  )}
                </span>
              );
              return linked ? (
                <Link key={place.name} href={`/city/${place.id}`}>
                  {chip}
                </Link>
              ) : (
                <span key={place.name}>{chip}</span>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
          Told in
        </h2>
        <GlassPanel className="mx-auto mt-4 max-w-md px-5 py-4">
          <ul className="flex flex-col gap-2">
            {story.attestations.map((attestation, index) => (
              <li key={index} className="flex items-baseline justify-between gap-4">
                <span className="font-body text-[15px] text-aether/90">
                  <span className="font-display text-[13px] tracking-[0.06em] text-aether">
                    {sourceNames.get(attestation.source) ?? attestation.source}
                  </span>
                  <span className="italic text-aether-muted"> — {attestation.work}</span>
                </span>
                {attestation.citation && (
                  <span className="shrink-0 font-body text-[13px] italic text-aether-faint">
                    {attestation.citation}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      {culture?.artworks.length ? <StoryLegacy artworks={culture.artworks} /> : null}
    </main>
  );
}
