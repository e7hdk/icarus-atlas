import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { loadAtlasData, loadCulture } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { loadStories } from '@/features/stories/load';
import { storiesById, storiesFeaturingCharacter } from '@/features/stories/appearances';
import { CharacterShell } from '@/components/character/CharacterShell';
import { PoetsView } from '@/components/character/PoetsView';

export async function generateStaticParams() {
  const { characters } = await loadAtlasData();
  return characters.map((character) => ({ id: character.id }));
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
  const storyIndex = storiesById(stories);
  const storyAppearances = storiesFeaturingCharacter(stories, character.id);

  return (
    <CharacterShell
      character={character}
      active="poets"
      cities={cities}
      storyAppearances={storyAppearances}
      storiesById={storyIndex}
    >
      <PoetsView
        character={character}
        characters={characters}
        relations={relations}
        sources={sources}
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
    </CharacterShell>
  );
}
