import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { loadAtlasData, loadCulture, loadFlagshipCharacterIds } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { loadStories } from '@/features/stories/load';
import { storiesFeaturingCharacter } from '@/features/stories/appearances';
import { CharacterTabs } from '@/components/character/CharacterTabs';
import { CharacterTheatre } from '@/components/character/CharacterTheatre';
import { CrumbBar } from '@/components/hud/CrumbBar';

/** Prerender the flagship stars; the long tail renders on demand and caches
 *  at the CDN (docs/NOSTOS_PLAN.md D16 — Netlify's build window). */
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await loadFlagshipCharacterIds();
  return ids.map((id) => ({ id }));
}

export default async function CharacterPoetsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [{ characters, relations, sources }, cities, stories] = await Promise.all([
    loadAtlasData(),
    loadCities(),
    loadStories(),
  ]);
  const character = characters.find((c) => c.id === id);
  if (!character) notFound();

  const culture = await loadCulture(id);
  const teaser = culture?.artworks.slice(0, 3) ?? [];
  const storyAppearances = storiesFeaturingCharacter(stories, character.id);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const orreryRelations = relations.filter(
    (relation) => relation.from === character.id || relation.to === character.id,
  );
  const orreryCharacterIds = new Set(
    orreryRelations.flatMap((relation) => [relation.from, relation.to]),
  );
  const orreryCharacters = characters
    .filter((candidate) => orreryCharacterIds.has(candidate.id))
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
        <CharacterTabs characterId={character.id} active="poets" />
      </nav>

      <CharacterTheatre
        character={character}
        characters={orreryCharacters}
        relations={orreryRelations}
        sources={sources}
        residences={(character.residences ?? []).map((residence) => ({
          city: residence.city,
          label: citiesById.get(residence.city)?.name ?? residence.city,
        }))}
        appearances={storyAppearances.map((story) => ({ id: story.id, title: story.title }))}
      />

      <div className="mt-16 border-t border-glass-border pt-6">
        <Link
          href={`/character/${character.id}/legacy`}
          className="group flex flex-wrap items-center gap-5 rounded-2xl border border-glass-border bg-glass px-6 py-5 backdrop-blur-xl transition-colors hover:border-nebula-soft/40"
        >
          <div className="min-w-52 flex-1">
            <div className="font-display text-[12px] tracking-[0.26em] text-aether-faint">
              BEYOND THE POETS
            </div>
            <p className="mt-1.5 font-body text-lg italic text-aether-muted">
              How the centuries since have seen {character.name} — art, artifacts and echoes.
            </p>
          </div>
          {teaser.map((artwork) => (
            <div
              key={artwork.imageUrl}
              className="relative h-16 w-24 overflow-hidden rounded-lg border border-glass-border"
            >
              <Image
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ))}
          <span className="font-display text-[12px] tracking-[0.14em] text-nebula-soft transition-transform group-hover:translate-x-1">
            ENTER →
          </span>
        </Link>
      </div>
    </main>
  );
}
