import type {
  Artifact,
  CultureData,
  MusicWork,
  PopCultureItem,
  ScreenWork,
} from '@/types/character';
import { ArtworkImage } from '@/components/ui/ArtworkImage';

/** The M8 Legacy shelves (docs/CULTURE_PLAN.md §5), shared by the character
 *  Legacy page and the story "How the centuries saw it" section. Renders
 *  everything except the artworks gallery, which each page owns.
 *
 *  Design language: an exhibition catalogue, not a card grid. Artifacts sit
 *  in double-framed "vitrines" with museum labels; the modern-media shelves
 *  are image-free catalogue entries — engraved kind-glyph, small-caps rubric,
 *  hairline rules — linking out for one-click verification (license rule). */

/** True when any Legacy shelf (including the gallery) has content. */
export function cultureHasAnything(culture: CultureData | null | undefined): boolean {
  if (!culture) return false;
  return Boolean(
    culture.artworks.length ||
      culture.artifacts?.length ||
      culture.films?.length ||
      culture.music?.length ||
      culture.popCulture?.length,
  );
}

/** Anchor ids + labels of the shelves present, gallery first — feeds the
 *  live contents index on the character Legacy marquee. */
export function cultureShelfAnchors(
  culture: CultureData | null | undefined,
): { id: string; label: string }[] {
  if (!culture) return [];
  const anchors: { id: string; label: string }[] = [];
  if (culture.artworks.length) anchors.push({ id: 'shelf-gallery', label: 'The gallery' });
  if (culture.artifacts?.length)
    anchors.push({ id: 'shelf-artifacts', label: 'Surviving stone & clay' });
  if (culture.films?.length) anchors.push({ id: 'shelf-screen', label: 'On screen' });
  if (culture.music?.length) anchors.push({ id: 'shelf-music', label: 'In music & on stage' });
  if (culture.popCulture?.length) anchors.push({ id: 'shelf-play', label: 'In play' });
  return anchors;
}

/** Centered shelf heading with the codex rule: hairline — gold star — hairline. */
export function ShelfHeading({ children }: { children: React.ReactNode }) {
  return (
    <header>
      <h2 className="text-center font-display text-[12px] uppercase tracking-[0.3em] text-aether-faint">
        {children}
      </h2>
      <div className="mx-auto mt-3.5 flex max-w-[300px] items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-aether/25" />
        <span className="h-[5px] w-[5px] rounded-full bg-star-olympian shadow-[0_0_8px_2px_rgba(252,211,77,.5)]" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-aether/25" />
      </div>
    </header>
  );
}

/** Engraved kind-glyphs: a theatre mask for the screen, a lyre for music and
 *  the stage, an astragalus die for play. Stroke-only, gold-dimmed. */
function ShelfGlyph({ shelf }: { shelf: 'screen' | 'music' | 'play' }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (shelf === 'screen') {
    // theatre mask
    return (
      <svg {...common}>
        <path d="M4 3.5h12v6.5a6 6 0 0 1-12 0V3.5Z" />
        <path d="M7 7.5h2M11 7.5h2" />
        <path d="M7.5 12c.7.9 1.6 1.4 2.5 1.4s1.8-.5 2.5-1.4" />
      </svg>
    );
  }
  if (shelf === 'music') {
    // lyre
    return (
      <svg {...common}>
        <path d="M5 3c0 4 .5 6.5 2.6 8.4M15 3c0 4-.5 6.5-2.6 8.4" />
        <path d="M7 12.5h6M8.5 5.5v7M11.5 5.5v7" />
        <path d="M10 12.5v3M7.5 17h5" />
      </svg>
    );
  }
  // astragalus die
  return (
    <svg {...common}>
      <rect x="4" y="4" width="12" height="12" rx="2.5" />
      <circle cx="8" cy="8" r="0.4" fill="currentColor" />
      <circle cx="12" cy="12" r="0.4" fill="currentColor" />
      <circle cx="12" cy="8" r="0.4" fill="currentColor" />
    </svg>
  );
}

const KIND_LABELS: Record<string, string> = {
  film: 'FILM',
  tv: 'TELEVISION',
  animation: 'ANIMATION',
  opera: 'OPERA',
  ballet: 'BALLET',
  song: 'SONG',
  album: 'ALBUM',
  orchestral: 'ORCHESTRAL',
  stage: 'STAGE',
  videogame: 'VIDEO GAME',
  comic: 'COMIC',
  novel: 'NOVEL',
  brand: 'BRAND',
  language: 'LANGUAGE',
  other: 'WORK',
};

interface CatalogueRow {
  key: string;
  title: string;
  year: string;
  kind: string;
  byline?: string;
  description: string;
  externalUrl: string;
}

/** One catalogue entry: rubric row (glyph · kind · year ⋯ read more ↗),
 *  illuminated title, byline, caption. A museum wall label, not a box. */
function CatalogueEntry({
  glyph,
  row,
}: {
  glyph: 'screen' | 'music' | 'play';
  row: CatalogueRow;
}) {
  return (
    <a
      href={row.externalUrl}
      target="_blank"
      rel="noreferrer"
      className="group block border-t border-glass-border py-5 transition-colors hover:border-star-olympian/45"
    >
      <div className="flex items-center gap-2 font-display text-[9.5px] tracking-[0.24em] text-star-olympian/65">
        <span className="text-star-olympian/55 transition-colors group-hover:text-star-olympian">
          <ShelfGlyph shelf={glyph} />
        </span>
        <span>
          {KIND_LABELS[row.kind] ?? ''} · {row.year}
        </span>
        <span className="ml-auto font-display text-[9px] tracking-[0.2em] text-aether-faint opacity-70 transition-all group-hover:text-star-olympian group-hover:opacity-100">
          READ MORE ↗
        </span>
      </div>
      <h3 className="mt-2.5 font-display text-[19px] leading-snug tracking-[0.04em] text-aether transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_24px_rgba(252,211,77,.45)]">
        {row.title}
      </h3>
      {row.byline && (
        <p className="mt-1 font-body text-[15px] italic text-aether-muted">{row.byline}</p>
      )}
      <p className="mt-2 font-body text-[15.5px] leading-relaxed text-aether/85">
        {row.description}
      </p>
    </a>
  );
}

function CatalogueShelf({
  id,
  heading,
  glyph,
  rows,
}: {
  id: string;
  heading: string;
  glyph: 'screen' | 'music' | 'play';
  rows: CatalogueRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <section id={id} className="mt-16 scroll-mt-6">
      <ShelfHeading>{heading}</ShelfHeading>
      <div className="mt-8 grid gap-x-12 sm:grid-cols-2">
        {rows.map((row) => (
          <CatalogueEntry key={row.key} glyph={glyph} row={row} />
        ))}
      </div>
    </section>
  );
}

/** Museum vitrines: double-framed Commons imagery with an exhibition label. */
function ArtifactShelf({ artifacts }: { artifacts: Artifact[] }) {
  if (artifacts.length === 0) return null;
  return (
    <section id="shelf-artifacts" className="mt-16 scroll-mt-6">
      <ShelfHeading>Surviving stone & clay</ShelfHeading>
      <div
        className={`mt-9 grid gap-12 ${artifacts.length > 1 ? 'sm:grid-cols-2' : 'sm:justify-center sm:[grid-template-columns:minmax(0,560px)]'}`}
      >
        {artifacts.map((artifact) => (
          <figure key={artifact.title} className="group">
            <div className="rounded-2xl border border-glass-border p-1.5 transition-colors duration-300 group-hover:border-star-olympian/35">
              <ArtworkImage
                src={artifact.imageUrl}
                title={artifact.title}
                meta={`${artifact.museum} · ${artifact.period}`}
                className="h-72 w-full"
              />
            </div>
            <figcaption className="mt-5 px-1">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg tracking-[0.05em] text-aether">
                  {artifact.title}
                </h3>
                {artifact.externalUrl && (
                  <a
                    href={artifact.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 font-display text-[9px] tracking-[0.2em] text-aether-faint transition-colors hover:text-star-olympian"
                  >
                    SOURCE ↗
                  </a>
                )}
              </div>
              <p className="mt-1 font-display text-[10px] uppercase tracking-[0.22em] text-star-olympian/60">
                {artifact.museum}
              </p>
              <p className="mt-0.5 font-body text-[14.5px] italic text-aether-muted">
                {artifact.period}
              </p>
              <p className="mt-2.5 font-body text-[15.5px] leading-relaxed text-aether/85">
                {artifact.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function CultureShelves({ culture }: { culture: CultureData }) {
  const toRow = (
    item: ScreenWork | MusicWork | PopCultureItem,
    kind: string,
    byline?: string,
  ): CatalogueRow => ({
    key: item.title + item.year,
    title: item.title,
    year: item.year,
    kind,
    byline,
    description: item.description,
    externalUrl: item.externalUrl,
  });
  return (
    <>
      <ArtifactShelf artifacts={culture.artifacts ?? []} />
      <CatalogueShelf
        id="shelf-screen"
        heading="On screen"
        glyph="screen"
        rows={(culture.films ?? []).map((work) => toRow(work, work.medium, work.director))}
      />
      <CatalogueShelf
        id="shelf-music"
        heading="In music & on stage"
        glyph="music"
        rows={(culture.music ?? []).map((work) => toRow(work, work.kind, work.composer))}
      />
      <CatalogueShelf
        id="shelf-play"
        heading="In play"
        glyph="play"
        rows={(culture.popCulture ?? []).map((item) => toRow(item, item.kind, item.creator))}
      />
    </>
  );
}
