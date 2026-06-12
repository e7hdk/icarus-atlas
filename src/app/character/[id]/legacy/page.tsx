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
          <div className="mt-12 flex flex-col gap-16">
            {artworks.map((artwork, index) => (
              <figure
                key={artwork.imageUrl}
                className={`flex flex-col gap-6 md:items-center md:gap-12 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <div className="group relative h-80 w-full shrink-0 overflow-hidden rounded-2xl border border-glass-border md:h-96 md:w-[46%]">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <figcaption className="min-w-0 flex-1">
                  <h3 className="font-display text-xl tracking-[0.06em] text-aether">
                    {artwork.title}
                  </h3>
                  <p className="mt-1.5 font-body text-[15px] italic text-aether-muted">
                    {artwork.artist}, {artwork.year}
                  </p>
                  <span
                    className="mt-4 block h-px w-14 bg-gradient-to-r from-nebula-soft/70 to-transparent"
                    aria-hidden
                  />
                  <p className="mt-4 font-body text-lg leading-relaxed text-aether/90">
                    {artwork.description}
                  </p>
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
