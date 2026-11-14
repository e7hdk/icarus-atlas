import { notFound } from 'next/navigation';
import { ClampList } from '@/components/ui/ClampList';
import { Link } from '@/components/ui/Link';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { ReadingRoom } from '@/components/library/ReadingRoom';
import { loadAtlasData } from '@/features/characters/load';
import { otherCredits, unitHref } from '@/features/library/links';
import { findLibraryWork, libraryWorks, loadLibraryText, romanBook } from '@/features/library/load';
import { libraryMarginData } from '@/features/library/margin-files';
import { quarrelHref } from '@/features/library/paths';
import { findQuarrel } from '@/features/library/quarrels';
import { libraryShelf } from '@/features/library/shelf';
import { loadStories } from '@/features/stories/load';
import { resolveSaga, SAGA_ACCENT } from '@/features/stories/sagas';
import type { LibraryUnit } from '@/types/library';

/** A work of the Library: /library/homer/iliad (docs/LIBRARY_PLAN.md §5). A short
 *  work is read here whole; a long one lists its books, each with a strip of
 *  where the atlas's citations fall in it, then the stories the work tells and the
 *  quarrels it takes a side in. Prerendered whole. */
export const dynamicParams = false;

export function generateStaticParams() {
  return libraryWorks().map((work) => ({ author: work.author, work: work.id }));
}

type Params = { params: Promise<{ author: string; work: string }> };

export async function generateMetadata({ params }: Params) {
  const { author, work: id } = await params;
  const work = findLibraryWork(author, id);
  if (!work) return { title: 'The Library — Icarus Atlas' };
  const description = `The ${work.title}, in the original and in English — the passages the atlas cites, every name a star.`;
  return {
    title: `${work.title} — The Library — Icarus Atlas`,
    description,
    openGraph: { siteName: 'Icarus Atlas', type: 'article', title: `${work.title} — The Library`, description },
  };
}

export default async function LibraryWorkPage({ params }: Params) {
  const { author, work: id } = await params;
  const work = findLibraryWork(author, id);
  if (!work) notFound();
  const [text, { sources }] = await Promise.all([loadLibraryText(work.id), loadAtlasData()]);
  const tellerName = sources.find((source) => source.id === work.author)?.name ?? work.author;
  if (work.units === 'whole') return <ReadingRoom work={work} unit={text.units[0]} units={['whole']} tellerName={tellerName} />;

  const [{ margins }, shelf, stories] = await Promise.all([libraryMarginData(), libraryShelf(), loadStories()]);
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const stats = shelf.works[work.id];
  const told = shelf.lists[work.id].stories
    .map((storyId) => storyById.get(storyId))
    .filter((story) => story !== undefined)
    .sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));
  const quarrels = shelf.lists[work.id].quarrels.map((topic) => findQuarrel(topic)).filter((quarrel) => quarrel !== null);
  /** Facts on each block of a book, for its strip. */
  const factsOf = (unit: LibraryUnit) => unit.blocks.map((block) => margins.get(`${work.id}/${unit.id}`)?.blocks[block.from]?.facts ?? 0);
  const most = Math.max(1, ...text.units.flatMap(factsOf));
  const fmt = (n: number) => n.toLocaleString('en-US');

  const incipit = (unit: (typeof text.units)[number]) => {
    const first = unit.blocks[0];
    if (!first) return '';
    return Array.isArray(first.orig) ? (first.orig[0]?.[1] ?? '') : first.orig.slice(0, 110);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-20 sm:px-6">
      <CrumbBar back={{ href: '/library', label: 'Back to the Library' }} trail={[{ href: '/library', label: 'Library' }]} current={work.title} />
      <header className="mt-8 max-w-3xl">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          {tellerName} · {work.composed.label}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.12em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.25)]">
          {work.title.toUpperCase()}
          {work.greekTitle && <span className="mt-1 block font-greek text-2xl italic tracking-normal text-star-olympian/75 sm:ml-4 sm:inline">{work.greekTitle}</span>}
        </h1>
        <p className="mt-4 font-body text-[14px] italic leading-relaxed text-aether-faint">
          {[work.original?.credit, work.display === 'full' ? work.translation.credit : null, ...otherCredits(work)].filter(Boolean).join('. ')}.
        </p>
      </header>
      <p className="mt-4 font-body text-[15px] italic text-aether-muted">
        <span className="not-italic text-star-olympian">{(stats.cited * 100).toFixed(0)}%</span> of it cited by some fact of the atlas · {fmt(stats.citations)} citations · {fmt(stats.figures)} figures · ⚖ {stats.quarrels}
      </p>
      <ol className="mt-8 grid gap-x-8 sm:grid-cols-2">
        {text.units.map((unit) => {
          const facts = factsOf(unit);
          return (
            <li key={unit.id} className="border-t border-glass-border">
              <Link href={unitHref(work, unit.id)} className="group block py-3.5">
                <span className="flex items-baseline gap-4">
                  <span className="w-12 shrink-0 font-display text-[13px] tracking-[0.12em] text-aether-muted transition-colors group-hover:text-star-olympian">
                    {romanBook(unit.id)}
                  </span>
                  <span lang={work.author === 'ovid' ? 'la' : 'grc'} className="min-w-0 truncate font-greek text-[16px] text-aether/80 transition-colors group-hover:text-aether">
                    {incipit(unit)}
                  </span>
                </span>
                {/* where the atlas cites the book: one bar a block, taller where more facts rest on it */}
                <svg viewBox={`0 0 ${facts.length} 10`} preserveAspectRatio="none" aria-hidden className="ml-16 mt-2 block h-3 w-[calc(100%-4rem)]">
                  {facts.map((count, index) => {
                    const h = count ? 1.5 + 8.5 * Math.sqrt(count / most) : 0.6;
                    return <rect key={index} x={index + 0.1} y={10 - h} width={0.8} height={h} fill={count ? 'rgba(252,211,77,0.55)' : 'rgba(255,255,255,0.12)'} />;
                  })}
                </svg>
              </Link>
            </li>
          );
        })}
      </ol>

      {told.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">THE STORIES IT TELLS · {told.length}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <ClampList max={24} as="span" noun="STORIES">
              {told.map((story) => (
                <Link key={story.id} href={`/story/${story.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-2.5 py-1 font-body text-[14px] text-aether-muted transition-colors hover:text-aether">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SAGA_ACCENT[resolveSaga(story, storyById)] }} />
                  {story.title}
                </Link>
              ))}
            </ClampList>
          </div>
        </section>
      )}

      {quarrels.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">⚖ THE QUARRELS IT TAKES A SIDE IN · {quarrels.length}</h2>
          <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
            <ClampList max={12} noun="QUARRELS">
              {quarrels.map((quarrel) => (
                <li key={quarrel.topic}>
                  <Link href={quarrelHref(quarrel.topic)} className="block border-t border-glass-border py-2.5 font-body text-[16px] text-aether transition-colors hover:text-star-olympian">
                    {quarrel.title}
                  </Link>
                </li>
              ))}
            </ClampList>
          </ul>
        </section>
      )}
    </main>
  );
}
