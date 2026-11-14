import { Link } from '@/components/ui/Link';
import { Shelf, type ShelfSaga, type ShelfWork } from '@/components/library/Shelf';
import { ShelfRows } from '@/components/library/ShelfRows';
import { loadAtlasData } from '@/features/characters/load';
import { LIBRARY_REGISTRY, otherCredits, workHref } from '@/features/library/links';
import { TELLER_ORDER, shortTeller } from '@/features/library/paths';
import { QUARRELS, claimsInTime, musesLine } from '@/features/library/quarrels';
import { libraryShelf } from '@/features/library/shelf';
import { SAGA_ACCENT, SAGA_LABEL, SAGA_ORDER } from '@/features/stories/sagas';
import type { SourceId } from '@/types/character';

/** The Library, the fifth door (docs/LIBRARY_PLAN.md §5): the seven tellers' works
 *  on one shelf in time, the sagas they tell running beneath; then the tellers and
 *  what the atlas owes them, and the way into the Quarrels. */

const DESCRIPTION = 'The seven tellers of the atlas, readable: the Iliad, the Odyssey, the Theogony and the rest, in the original and in English, line by line — every footnote of the atlas opens its passage.';

export const metadata = {
  title: 'The Library — Icarus Atlas',
  description: DESCRIPTION,
  openGraph: { siteName: 'Icarus Atlas', type: 'website', title: 'The Library', description: DESCRIPTION },
};

/** Spine lettering a short spine can hold. */
const SPINE: Record<string, string> = { 'works-and-days': 'WORKS & DAYS' };

const fmt = (n: number) => n.toLocaleString('en-US');

export default async function LibraryPage() {
  const [{ sources }, shelf, muses] = await Promise.all([loadAtlasData(), libraryShelf(), musesLine()]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const tellerName = (id: SourceId) => shortTeller(sourceById.get(id)?.name ?? id);

  const works: ShelfWork[] = LIBRARY_REGISTRY.works.map((work) => ({
    id: work.id,
    title: work.title,
    spine: SPINE[work.id] ?? work.title.toUpperCase(),
    greekTitle: work.greekTitle,
    teller: work.author,
    tellerName: tellerName(work.author),
    from: work.composed.from,
    to: work.composed.to,
    label: work.composed.label,
    credit: [work.original?.credit, work.display === 'full' ? work.translation.credit : 'The English is read at ToposText while its licence is checked', ...otherCredits(work)].filter(Boolean).join('. ') + '.',
    href: workHref(work),
    stats: shelf.works[work.id],
  }));
  const sagas: ShelfSaga[] = SAGA_ORDER.map((id) => ({ id, label: SAGA_LABEL[id], color: SAGA_ACCENT[id] }));
  const tellers = TELLER_ORDER.map((id) => ({ id, name: tellerName(id), period: sourceById.get(id)?.period ?? '', href: `/library/${id}` }));
  const citations = Object.values(shelf.works).reduce((sum, stats) => sum + stats.citations, 0);
  const aphrodite = QUARRELS.find((quarrel) => quarrel.topic === 'aphrodite-parentage');
  const short = (text: string) => (text.length > 92 ? `${text.slice(0, text.lastIndexOf(' ', 90))}…` : text);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 pb-24 pt-24 sm:px-7">
      <header className="grid gap-9 xl:grid-cols-[minmax(0,1fr)_minmax(0,470px)] xl:items-end xl:gap-16">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">The fifth door · the tellers</p>
          <h1 className="mt-2.5 font-display text-4xl font-bold tracking-[0.14em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.35)] sm:text-[54px] sm:tracking-[0.16em]">THE LIBRARY</h1>
          <p className="mt-1 font-greek text-[19px] italic text-star-olympian/70 sm:text-[22px]">Βιβλιοθήκη</p>
          <p className="mt-5 max-w-[600px] font-body text-[18px] leading-relaxed text-aether-muted sm:text-[20px]">
            Seven tellers, {LIBRARY_REGISTRY.works.length} works, <b className="font-medium text-aether">{fmt(citations)} cited passages</b>. Every fact in the atlas rests on a passage of one of these books. Here the passages are read, in the original and in English, and each one leads back to the stars, stories and quarrels that rest on it.
          </p>
        </div>
        {muses.greek.length > 0 && (
          <figure className="max-w-[560px] border border-star-olympian/20 bg-[rgba(20,12,48,0.45)] px-[18px] pb-[18px] pt-[22px] backdrop-blur-md sm:px-[26px]">
            <p lang="grc" className="font-greek text-[16px] leading-[1.55] text-[#fde68a] sm:text-[17px]">
              {muses.greek.map((line, index) => (
                <span key={index} className="block">
                  <i className="inline-block w-[26px] font-display text-[10px] not-italic tracking-[0.08em] text-star-olympian/45">{27 + index}</i>
                  {line}
                </span>
              ))}
            </p>
            {muses.english && <p className="mt-2.5 font-body text-[17px] italic leading-normal text-aether/90">“{muses.english}”</p>}
            <p className="mt-2.5 font-display text-[9.5px] tracking-[0.24em] text-aether-faint">
              THE MUSES TO HESIOD ·{' '}
              <Link href="/library/hesiod/theogony#l27-28" className="whitespace-nowrap text-star-olympian/70 hover:text-star-olympian">
                THEOGONY 27–28
              </Link>
            </p>
          </figure>
        )}
      </header>

      <section className="mt-14">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-baseline md:justify-between md:gap-6">
          <h2 className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">The shelf · {LIBRARY_REGISTRY.works.length} works, oldest at the left</h2>
          <p className="hidden font-body text-[15px] italic text-aether-faint md:block">
            Hover a spine for the work, a thread for its saga, a name for the teller. <b className="font-medium not-italic text-aether-muted">Click a spine</b> to open it.
          </p>
        </div>
        <div className="mt-2.5 hidden md:block">
          <Shelf works={works} sagas={sagas} tellerHref={Object.fromEntries(tellers.map((teller) => [teller.id, teller.href]))} />
          <div className="mt-2 flex flex-wrap gap-x-[22px] gap-y-2 font-body text-[14px] italic text-aether-faint">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2 w-4 border-t-2 border-star-olympian bg-star-olympian/15" />
              gilt level: the share of the work some fact of the atlas cites
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-[9px] w-[9px] rounded-full bg-[#fbbf24] shadow-[0_0_6px_#fbbf24]" />
              knot: a saga told in that work, larger with more of its stories
            </span>
            <span>⚖ the quarrels the work takes a side in</span>
            <span>spine height: the work&apos;s length</span>
          </div>
        </div>
        <div className="mt-4 md:hidden">
          <ShelfRows works={works} sagas={sagas} tellers={tellers} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-[11px] tracking-[0.32em] text-aether-faint">THE SEVEN TELLERS · WHAT THE ATLAS OWES THEM</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {tellers.map((teller) => {
            const stats = shelf.tellers[teller.id];
            return (
              <Link key={teller.id} href={teller.href} className="rounded border border-glass-border bg-glass px-4 pb-3.5 pt-4 transition-colors hover:border-star-olympian/40 hover:bg-star-olympian/[0.05]">
                <h3 className="font-display text-[14px] font-semibold tracking-[0.14em] text-[#fde68a]">{teller.name.toUpperCase()}</h3>
                <p className="mt-0.5 font-body text-[13.5px] italic text-aether-faint">{teller.period}</p>
                <ul className="mt-2.5 grid gap-[3px] font-body text-[14.5px] text-aether-muted">
                  <li className="flex justify-between gap-2">
                    facts <b className="font-medium text-aether">{fmt(stats.facts)}</b>
                  </li>
                  <li className="flex justify-between gap-2">
                    figures <b className="font-medium text-aether">{fmt(stats.figures)}</b>
                  </li>
                  <li className="flex justify-between gap-2">
                    quarrels <b className="font-medium text-aether">⚖ {stats.quarrels}</b>
                  </li>
                </ul>
                <p className="mt-2 border-t border-white/[0.07] pt-2 font-body text-[13px] italic leading-snug text-aether-faint">
                  <b className="font-medium not-italic text-[#fde68a]">{fmt(stats.only.length)}</b> figure{stats.only.length === 1 ? '' : 's'} theirs alone
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-[11px] tracking-[0.32em] text-aether-faint">TWO WAYS IN</h2>
        <div className="mt-4 grid gap-[22px] lg:grid-cols-2">
        <Link
          href="/library/quarrels"
          className="group block border border-star-olympian/25 bg-[rgba(20,12,48,0.42)] px-5 pb-6 pt-6 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-star-olympian/55 hover:shadow-[0_0_40px_rgba(252,211,77,0.08)] sm:px-7"
        >
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-nebula-soft">The Quarrels</p>
          <h3 className="mt-2 font-display text-[26px] font-semibold tracking-[0.1em] text-aether">{QUARRELS.length} QUARRELS</h3>
          <p className="mt-2 max-w-[520px] font-body text-[17px] leading-relaxed text-aether-muted">Where the tellers disagree, read them against each other: each claim in its teller&apos;s own words, the passage under it.</p>
          {aphrodite && (
            <div className="mt-4 grid gap-2">
              <h4 className="font-display text-[13px] font-semibold tracking-[0.14em] text-aether">
                <i className="mr-1.5 not-italic text-nebula-soft">⚖</i>
                {aphrodite.title}
              </h4>
              {claimsInTime(aphrodite).map((claim) => (
                <div key={claim.who} className="grid gap-x-2.5 font-body text-[15px] leading-snug sm:grid-cols-[112px_1fr] sm:items-baseline">
                  <b className="font-display text-[9.5px] font-normal tracking-[0.2em] text-nebula-soft">{shortTeller(claim.who).toUpperCase()}</b>
                  <span className="text-aether/85">
                    {short(claim.claim)} <em className="text-[13.5px] text-aether-faint">{claim.citation}</em>
                  </span>
                </div>
              ))}
            </div>
          )}
          <span className="mt-4 inline-block font-display text-[10px] tracking-[0.24em] text-star-olympian">ENTER THE QUARRELS →</span>
        </Link>
        <Link
          href="/theogony"
          className="group block border border-star-olympian/25 bg-[rgba(20,12,48,0.42)] px-5 pb-6 pt-6 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-star-olympian/55 hover:shadow-[0_0_40px_rgba(252,211,77,0.08)] sm:px-7"
        >
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-nebula-soft">First, Chaos</p>
          <h3 className="mt-2 font-display text-[26px] font-semibold tracking-[0.1em] text-aether">THE THEOGONY, READ WITH THE SKY</h3>
          <p className="mt-2 max-w-[520px] font-body text-[17px] leading-relaxed text-aether-muted">
            Scroll Hesiod&apos;s poem and the galaxy lights as he sings: each figure in the order he names it, each line of descent as he gives it. At the end, Homer tells it otherwise.
          </p>
          <p className="mt-3.5 font-greek text-[17px] leading-normal text-[#fde68a]">ἦ τοι μὲν πρώτιστα Χάος γένετʼ</p>
          <p className="font-body text-[15px] italic text-aether-muted">“In truth at first Chaos came to be” — Theogony 116</p>
          <span className="mt-4 inline-block font-display text-[10px] tracking-[0.24em] text-star-olympian">BEGIN WITH THE MUSES →</span>
        </Link>
        </div>
      </section>

      <footer className="mt-16 text-center font-body text-[14px] italic leading-relaxed text-aether-faint">
        Dates are the conventional ones, no more precise than their labels. A thread says that these works tell a saga, never that one teller read another.
        <br />
        From the pinned corpus of the atlas; each work credits its editions.
      </footer>
    </main>
  );
}
