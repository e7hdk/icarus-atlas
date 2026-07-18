import { notFound } from 'next/navigation';
import { loadAtlasData, loadCulture, loadFlagshipCharacterIds } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { loadStories } from '@/features/stories/load';
import { storiesFeaturingCharacter } from '@/features/stories/appearances';
import { CharacterTabs } from '@/components/character/CharacterTabs';
import { CharacterCodexPanel } from '@/components/character/CharacterCodexPanel';
import { ArtworkImage } from '@/components/ui/ArtworkImage';
import {
  CultureShelves,
  ShelfHeading,
  cultureHasAnything,
  cultureShelfAnchors,
} from '@/components/culture/CultureShelves';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { TYPE_GLOW } from '@/types/character';

/** Prerender the flagship stars; the long tail renders on demand and caches
 *  at the CDN (docs/NOSTOS_PLAN.md D16 — Netlify's build window). */
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await loadFlagshipCharacterIds();
  return ids.map((id) => ({ id }));
}

export default async function CharacterLegacyPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [{ characters, relations }, cities, stories] = await Promise.all([
    loadAtlasData(),
    loadCities(),
    loadStories(),
  ]);
  const character = characters.find((c) => c.id === id);
  if (!character) notFound();

  const culture = await loadCulture(id);
  const artworks = culture?.artworks ?? [];
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const storyAppearances = storiesFeaturingCharacter(stories, character.id);
  const glow = TYPE_GLOW[character.type].color;

  const codexRelations = relations.filter(
    (relation) => relation.from === character.id || relation.to === character.id,
  );
  const codexCharacterIds = new Set(
    codexRelations.flatMap((relation) => [relation.from, relation.to]),
  );
  const codexCharacters = characters
    .filter((candidate) => codexCharacterIds.has(candidate.id))
    .map(({ id: candidateId, name, type }) => ({ id: candidateId, name, type }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl touch-manipulation overflow-x-clip px-5 pb-24 pt-20 sm:px-6">
      <CrumbBar
        back={{ href: '/', label: 'Back to the galaxy' }}
        trail={[{ href: '/', label: 'Galaxy' }]}
        current={`The codex of ${character.name}`}
        laurelCharacterId={character.id}
      />

      <nav className="mt-4 flex justify-center">
        <CharacterTabs characterId={character.id} active="legacy" />
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[322px_minmax(0,1fr)] lg:gap-x-14">
        <CharacterCodexPanel
          character={character}
          characters={codexCharacters}
          relations={codexRelations}
          contentsHeading="THE SHELVES"
          contents={cultureShelfAnchors(culture)}
          residences={(character.residences ?? []).map((residence) => ({
            city: residence.city,
            label: citiesById.get(residence.city)?.name ?? residence.city,
          }))}
          appearances={storyAppearances.map((story) => ({ id: story.id, title: story.title }))}
        />

        <div className="max-w-[680px]">
          <p
            className="border-l-2 pl-6 font-body text-xl italic leading-relaxed text-aether-muted"
            style={{ borderColor: `${glow}80` }}
          >
            Unchanged by any teller — how the centuries since have seen {character.name}.
          </p>

          {artworks.length > 0 && (
            <section id="shelf-gallery" className="mt-14 scroll-mt-6">
              <ShelfHeading>The gallery</ShelfHeading>
              <div className="mt-9 flex flex-col gap-14">
                {artworks.map((artwork, index) => (
                  <figure
                    key={artwork.imageUrl}
                    className={`flex flex-col gap-6 md:items-center md:gap-10 ${
                      index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    <ArtworkImage
                      src={artwork.imageUrl}
                      title={artwork.title}
                      meta={`${artwork.artist}, ${artwork.year}`}
                      className="h-72 w-full shrink-0 md:h-80 md:w-[46%]"
                    />
                    <figcaption className="min-w-0 flex-1">
                      <h3 className="font-display text-lg tracking-[0.06em] text-aether">
                        {artwork.title}
                      </h3>
                      <p className="mt-1.5 font-body text-[15px] italic text-aether-muted">
                        {artwork.artist}, {artwork.year}
                      </p>
                      <span
                        className="mt-4 block h-px w-14 bg-gradient-to-r from-nebula-soft/70 to-transparent"
                        aria-hidden
                      />
                      <p className="mt-4 font-body text-[16.5px] leading-relaxed text-aether/90">
                        {artwork.description}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {culture && <CultureShelves culture={culture} />}

          {!cultureHasAnything(culture) && (
            <p className="mt-14 font-body text-lg italic text-aether-faint">
              The gallery for this figure is still being curated — the galaxy grows one star at a
              time.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
