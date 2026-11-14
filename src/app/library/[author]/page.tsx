import { notFound } from 'next/navigation';
import { ClampList } from '@/components/ui/ClampList';
import { Link } from '@/components/ui/Link';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { loadAtlasData } from '@/features/characters/load';
import { LIBRARY_REGISTRY, otherCredits, workHref } from '@/features/library/links';
import { TELLER_ORDER, quarrelHref, shortTeller } from '@/features/library/paths';
import { QUARRELS } from '@/features/library/quarrels';
import { libraryShelf } from '@/features/library/shelf';
import { TYPE_GLOW, type SourceId } from '@/types/character';

/** A teller of the Library (docs/LIBRARY_PLAN.md §5): dates and works with their
 *  editions; what the atlas owes them, counted from the reverse index; the figures
 *  only they tell of; and the sides they take in the quarrels. */
export const dynamicParams = false;

export function generateStaticParams() {
  return TELLER_ORDER.map((author) => ({ author }));
}

type Params = { params: Promise<{ author: string }> };

const isTeller = (id: string): id is SourceId => (TELLER_ORDER as string[]).includes(id);
const fmt = (n: number) => n.toLocaleString('en-US');
/** A teller's long lists open on a few rows (Homer alone tells of 165 figures). */
const FIGURES_SHOWN = 24;
const SIDES_SHOWN = 12;

export async function generateMetadata({ params }: Params) {
  const { author } = await params;
  const { sources } = await loadAtlasData();
  const source = sources.find((candidate) => candidate.id === author);
  if (!source) return { title: 'The Library — Icarus Atlas' };
  const description = `${source.name}, ${source.period}: the works the atlas reads, what it owes them, the figures only ${shortTeller(source.name)} tells of, and the sides taken in the quarrels.`;
  return {
    title: `${source.name} — The Library — Icarus Atlas`,
    description,
    openGraph: { siteName: 'Icarus Atlas', type: 'website', title: `${source.name} — The Library`, description },
  };
}

export default async function TellerPage({ params }: Params) {
  const { author } = await params;
  if (!isTeller(author)) notFound();
  const [{ sources, characters }, shelf] = await Promise.all([loadAtlasData(), libraryShelf()]);
  const source = sources.find((candidate) => candidate.id === author);
  if (!source) notFound();
  const name = shortTeller(source.name);
  const stats = shelf.tellers[author];
  const works = LIBRARY_REGISTRY.works.filter((work) => work.author === author);
  const byId = new Map(characters.map((character) => [character.id, character]));
  const only = stats.only.map((id) => byId.get(id)).filter((character) => character !== undefined).sort((a, b) => a.name.localeCompare(b.name));
  const sides = QUARRELS.flatMap((quarrel) => quarrel.claims.filter((claim) => claim.sources.includes(author)).map((claim) => ({ quarrel, claim })));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-20 sm:px-6">
      <CrumbBar back={{ href: '/library', label: 'Back to the Library' }} trail={[{ href: '/library', label: 'Library' }]} current={source.name} />
      <header className="mt-8 max-w-3xl">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
          A teller · {source.language} · {source.period}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.14em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.3)]">{source.name.toUpperCase()}</h1>
        <p className="mt-5 font-body text-[18px] leading-relaxed text-aether-muted">{source.description}</p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">WHAT THE ATLAS OWES {name.toUpperCase()}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['FACTS', fmt(stats.facts)],
              ['FIGURES', fmt(stats.figures)],
              ['STORIES', fmt(stats.stories)],
              ['QUARRELS', `⚖ ${stats.quarrels}`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded border border-glass-border bg-glass px-4 py-3">
              <dt className="font-display text-[9px] tracking-[0.22em] text-aether-faint">{label}</dt>
              <dd className="mt-1 font-body text-[26px] font-medium text-aether">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-body text-[13.5px] italic text-aether-faint">Counted from every citation in the atlas that lands in {name}&apos;s works.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">THE WORKS</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {works.map((work) => {
            const workStats = shelf.works[work.id];
            return (
              <li key={work.id}>
                <Link href={workHref(work)} className="group block rounded border border-glass-border bg-glass px-5 py-4 transition-colors hover:border-star-olympian/40">
                  <p className="font-display text-[18px] tracking-[0.08em] text-aether transition-colors group-hover:text-star-olympian">
                    {work.title}
                    {work.greekTitle && <span className="ml-2.5 font-greek text-[15px] italic tracking-normal text-star-olympian/70">{work.greekTitle}</span>}
                  </p>
                  <p className="mt-0.5 font-body text-[13.5px] italic text-aether-faint">
                    {work.composed.label} · {workStats.lines ? `${fmt(workStats.lines)} lines` : `≈ ${fmt(Math.round(workStats.words / 100) * 100)} words`}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <i className="block h-full bg-gradient-to-r from-star-olympian/35 to-star-olympian" style={{ width: `${(workStats.cited * 100).toFixed(0)}%` }} />
                  </div>
                  <p className="mt-1.5 font-body text-[13.5px] italic text-aether-muted">
                    {(workStats.cited * 100).toFixed(0)}% of it cited · {fmt(workStats.citations)} citations · ⚖ {workStats.quarrels}
                  </p>
                  <p className="mt-2 font-body text-[13px] italic leading-snug text-aether-faint">
                    {[work.original?.credit, work.display === 'full' ? work.translation.credit : 'The English is read at ToposText while its licence is checked', ...otherCredits(work)].filter(Boolean).join('. ')}.
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {only.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">
            {only.length} FIGURE{only.length === 1 ? '' : 'S'} ONLY {name.toUpperCase()} TELLS OF
          </h2>
          <p className="mt-1 font-body text-[13.5px] italic text-aether-faint">Every sourced line the atlas holds about them names {name} alone.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <ClampList max={FIGURES_SHOWN} as="span" noun="FIGURES">
              {only.map((figure) => {
                const { color } = TYPE_GLOW[figure.type];
                return (
                  <Link key={figure.id} href={`/character/${figure.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-2.5 py-1 font-body text-[14px] text-aether-muted transition-colors hover:text-aether">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    {figure.name}
                  </Link>
                );
              })}
            </ClampList>
          </div>
        </section>
      )}

      {sides.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">
            ⚖ THE SIDES {name.toUpperCase()} TAKES · {stats.quarrels} QUARREL{stats.quarrels === 1 ? '' : 'S'}
          </h2>
          <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
            <ClampList max={SIDES_SHOWN} noun="SIDES">
              {sides.map(({ quarrel, claim }, index) => (
                <li key={`${quarrel.topic}-${index}`}>
                  <Link href={quarrelHref(quarrel.topic)} className="group block border-t border-glass-border py-3">
                    <span className="block font-body text-[16.5px] leading-snug text-aether transition-colors group-hover:text-star-olympian">{quarrel.title}</span>
                    <span className="mt-1 line-clamp-2 block font-body text-[14.5px] italic leading-snug text-aether-muted">{claim.claim}</span>
                    {claim.citation && <span className="mt-0.5 block font-body text-[12.5px] text-aether-faint">{claim.citation}</span>}
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
