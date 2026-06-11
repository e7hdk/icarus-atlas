import Image from 'next/image';
import { notFound } from 'next/navigation';
import { loadAtlasData, loadCulture } from '@/features/characters/load';
import { CharacterShell } from '@/components/character/CharacterShell';

export async function generateStaticParams() {
  const { characters } = await loadAtlasData();
  return characters.map((character) => ({ id: character.id }));
}

export default async function CharacterLegacyPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { characters } = await loadAtlasData();
  const character = characters.find((c) => c.id === id);
  if (!character) notFound();

  const culture = await loadCulture(id);
  const artworks = culture?.artworks ?? [];

  return (
    <CharacterShell character={character} active="legacy">
      <div className="mx-auto mt-9 max-w-5xl">
        <p className="text-center font-body text-lg italic text-aether-muted">
          Unchanged by any teller — how the centuries since have seen {character.name}.
        </p>

        {artworks.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {artworks.map((artwork) => (
              <figure
                key={artwork.imageUrl}
                className="group relative h-80 overflow-hidden rounded-2xl border border-glass-border"
              >
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cosmos-deep/95 via-cosmos-deep/40 to-transparent px-5 pb-4 pt-10">
                  <div className="font-display text-base tracking-[0.06em] text-aether">
                    {artwork.title}
                  </div>
                  <div className="font-body text-[15px] italic text-aether-muted">
                    {artwork.artist}, {artwork.year}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-14 text-center font-body text-lg italic text-aether-faint">
            The gallery for this figure is still being curated — the galaxy grows one star at a time.
          </p>
        )}
      </div>
    </CharacterShell>
  );
}
