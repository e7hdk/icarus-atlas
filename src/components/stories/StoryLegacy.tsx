import Image from 'next/image';
import type { Artwork } from '@/types/character';

/** Visual legacy gallery for a saga (data/story-culture/*.json). */
export function StoryLegacy({ artworks }: { artworks: Artwork[] }) {
  if (artworks.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
        How the centuries saw it
      </h2>
      <div className="mt-10 flex flex-col gap-16">
        {artworks.map((artwork, index) => (
          <figure
            key={artwork.imageUrl}
            className={`flex flex-col gap-6 md:items-center md:gap-12 ${
              index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
            }`}
          >
            <div className="group relative h-72 w-full shrink-0 overflow-hidden rounded-2xl border border-glass-border md:h-80 md:w-[44%]">
              <Image
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>
            <figcaption className="min-w-0 flex-1">
              <h3 className="font-display text-lg tracking-[0.06em] text-aether">{artwork.title}</h3>
              <p className="mt-1.5 font-body text-[15px] italic text-aether-muted">
                {artwork.artist}, {artwork.year}
              </p>
              <span
                className="mt-4 block h-px w-14 bg-gradient-to-r from-nebula-soft/70 to-transparent"
                aria-hidden
              />
              <p className="mt-4 font-body text-[17px] leading-relaxed text-aether/90">
                {artwork.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
