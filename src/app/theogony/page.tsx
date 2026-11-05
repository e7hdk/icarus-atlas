import readingJson from '../../../data/library/readings/theogony.json';
import { ClampList } from '@/components/ui/ClampList';
import { Link } from '@/components/ui/Link';
import { FinaleLens } from '@/components/library/FinaleLens';
import { TheogonySky, type SkyBeat } from '@/components/library/TheogonySky';
import { loadAtlasData } from '@/features/characters/load';
import { loadLibraryText } from '@/features/library/load';
import { quarrelHref } from '@/features/library/paths';
import { TYPE_GLOW } from '@/types/character';
import type { LibraryBlock } from '@/types/library';

/** First, Chaos (docs/LIBRARY_PLAN.md §8): the Theogony read with the sky, a
 *  satellite of the Library as the Odyssey is of the Myths. The poem is here
 *  whole, in Hesiod's Greek and Evelyn-White's English, beat by beat; the sky
 *  beside it lights each figure as it is sung. At the end, Homer tells it
 *  otherwise. */

const DESCRIPTION = "Hesiod's Theogony, read with the sky: as the poem is scrolled, the galaxy lights each figure Hesiod names, in his order, and draws the lines of descent he gives. At the end, Homer tells Aphrodite's birth otherwise.";

export const metadata = {
  title: 'First, Chaos — the Theogony read with the sky — Icarus Atlas',
  description: DESCRIPTION,
  openGraph: { siteName: 'Icarus Atlas', type: 'article', title: 'First, Chaos — the Theogony read with the sky', description: DESCRIPTION },
};

interface Beat {
  lines: string;
  title: string;
  ignite: string[];
}

const lineOf = (n: string) => Number.parseInt(n, 10);
const fmt = (n: number) => n.toLocaleString('en-US');

/** Each English card goes to the beat that holds most of its lines, ties to the
 *  earlier; a beat left with none reads the card its first line stands in. */
function englishByBeat(beats: { from: number; to: number }[], blocks: LibraryBlock[]): string[][] {
  const out = beats.map(() => [] as string[]);
  for (const block of blocks) {
    const from = lineOf(block.from);
    const to = lineOf(block.to);
    let best = -1;
    let most = 0;
    beats.forEach((beat, index) => {
      const shared = Math.min(to, beat.to) - Math.max(from, beat.from) + 1;
      if (shared > most) {
        most = shared;
        best = index;
      }
    });
    if (best >= 0) out[best].push(...block.trans);
  }
  beats.forEach((beat, index) => {
    if (out[index].length > 0) return;
    const opening = blocks.find((block) => lineOf(block.from) <= beat.from && lineOf(block.to) >= beat.from);
    if (opening) out[index].push(...opening.trans);
  });
  return out;
}

export default async function TheogonyPage() {
  const [{ characters }, theogony, iliad] = await Promise.all([loadAtlasData(), loadLibraryText('theogony'), loadLibraryText('iliad')]);
  const byId = new Map(characters.map((character) => [character.id, character]));
  const beats = (readingJson as { beats: Beat[] }).beats.map((beat) => {
    const [from, to] = beat.lines.split('-').map(Number);
    return { ...beat, from, to };
  });
  const blocks = theogony.units[0].blocks;
  const greek = blocks.flatMap((block) => (Array.isArray(block.orig) ? block.orig : []));
  const english = englishByBeat(beats, blocks);
  const sky: SkyBeat[] = beats.map(({ from, to, ignite }) => ({ from, to, ignite }));
  const figures = beats.reduce((sum, beat) => sum + beat.ignite.length, 0);
  // the poem's length in its own numbering: 1,022, the lettered lines (929a–t) aside
  const lastLine = Math.max(...greek.map(([n]) => lineOf(n)));

  // the finale's two passages, from the pinned texts
  const foam = greek.filter(([n]) => lineOf(n) >= 190 && lineOf(n) <= 191).map(([, line]) => line).join(' ');
  const foamEnglish = /a white foam spread[^.]*\./.exec(blocks.map((block) => block.trans.join(' ')).join(' '))?.[0] ?? null;
  const book5 = iliad.units.find((unit) => unit.id === '5');
  const knees = (book5?.blocks ?? [])
    .flatMap((block) => (Array.isArray(block.orig) ? block.orig : []))
    .filter(([n]) => n === '370' || n === '371')
    .map(([, line]) => line)
    .join(' ');
  const kneesEnglish = /[^.;:]*Aphrodite flung herself upon the knees of her mother Dione\./.exec((book5?.blocks ?? []).map((block) => block.trans.join(' ')).join(' '))?.[0]?.trim() ?? null;

  return (
    <>
      <div className="theogony-veil" aria-hidden />
      <TheogonySky beats={sky} />
      <main className="theogony-column" data-reading-pane>
        <section className="flex min-h-screen flex-col justify-center pt-10 max-md:min-h-0 max-md:justify-start max-md:pb-8 max-md:pt-6">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">The Library · a reading with the sky</p>
          <h1 className="mt-3 whitespace-nowrap font-display text-[36px] font-bold tracking-[0.12em] text-aether drop-shadow-[0_0_18px_rgba(192,132,252,0.4)] max-md:text-[30px]">FIRST, CHAOS</h1>
          <p className="mt-1.5 font-body text-[20px] italic text-aether-muted max-md:text-[17px]">The Theogony of Hesiod, read with the sky</p>
          <div className="mt-7 border border-star-olympian/20 bg-[rgba(20,12,48,0.4)] px-[22px] pb-4 pt-5">
            <p lang="grc" className="font-greek text-[19px] leading-[1.55] text-[#fde68a]">
              {greek.find(([n]) => n === '116')?.[1]}
            </p>
            <p className="mt-1.5 font-body text-[17px] italic text-aether/85">“In truth at first Chaos came to be…”</p>
            <p className="mt-2 font-display text-[9px] tracking-[0.24em] text-aether-faint">THEOGONY 116 · EVELYN-WHITE</p>
          </div>
          <dl className="mt-6 flex gap-7">
            {(
              [
                ['LINES', fmt(lastLine)],
                ['FIGURES', fmt(figures)],
                ['BEATS', String(beats.length)],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-display text-[8.5px] tracking-[0.22em] text-aether-faint">{label}</dt>
                <dd className="mt-0.5 font-body text-[21px] font-medium text-aether">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="theogony-begin mt-9 font-display text-[10px] tracking-[0.3em] text-star-olympian max-md:mt-5">SCROLL, AND BEGIN WITH THE MUSES ↓</p>
        </section>

        {beats.map((beat, index) => {
          const lines = greek.filter(([n]) => lineOf(n) >= beat.from && lineOf(n) <= beat.to);
          const named = beat.ignite.map((id) => byId.get(id)).filter((figure) => figure !== undefined);
          return (
            <section key={beat.lines} data-beat={index} className="theogony-beat border-t border-white/[0.06] py-12 first-of-type:border-t-0 max-md:py-7">
              <p className="theogony-lines font-display text-[9.5px] tracking-[0.26em] text-aether-faint">
                LINES {beat.from}–{beat.to}
              </p>
              <h2 className="mt-1.5 font-display text-[23px] font-semibold leading-tight tracking-[0.08em] text-aether max-md:text-[20px]">{beat.title}</h2>
              <div lang="grc" className="mt-4 font-greek text-[16.5px] leading-[1.62] text-[#fde68a]/90">
                {lines.map(([n, line]) => (
                  <div key={n} className="grid grid-cols-[30px_1fr]">
                    <i className="font-display text-[9.5px] not-italic leading-[2.6] text-star-olympian/40">{lineOf(n) % 5 === 0 || n === lines[0][0] ? n : ''}</i>
                    <span className="pl-4 -indent-4">{line}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3 font-body text-[18px] leading-[1.7] text-aether/85 max-md:text-[17px]">
                {english[index].map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-[18px] flex flex-wrap items-center gap-1.5">
                <span className="mr-1 font-display text-[8.5px] tracking-[0.24em] text-aether-faint">{named.length > 0 ? 'IGNITES' : 'NO NEW STAR'}</span>
                <ClampList max={14} as="span" noun="NAMED">
                  {named.map((figure) => {
                    const { color } = TYPE_GLOW[figure.type];
                    return (
                      <Link key={figure.id} href={`/character/${figure.id}`} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-body text-[14px] text-aether" style={{ borderColor: `${color}66`, background: `${color}1a` }}>
                        <i className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        {figure.name}
                      </Link>
                    );
                  })}
                </ClampList>
              </div>
            </section>
          );
        })}

        <section data-finale className="pb-[40vh] pt-16 max-md:pb-[30svh] max-md:pt-10">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-nebula-soft">The first quarrel</p>
          <div className="mt-5 border border-star-olympian/30 bg-[rgba(20,12,48,0.55)] px-[22px] pb-[18px] pt-[22px]">
            <h2 className="font-display text-[22px] font-semibold tracking-[0.1em] text-star-olympian drop-shadow-[0_0_14px_rgba(252,211,77,0.4)]">NOW AS HOMER TELLS IT</h2>
            <div className="mt-3.5 grid gap-3.5">
              <div>
                <p className="font-display text-[9px] tracking-[0.24em] text-nebula-soft">HESIOD · THEOGONY 190–191</p>
                <p lang="grc" className="mt-1 font-greek text-[16px] leading-[1.55] text-[#fde68a]">{foam}</p>
                {foamEnglish && <p className="mt-0.5 font-body text-[16.5px] italic leading-normal text-aether/85">“…{foamEnglish}”</p>}
              </div>
              <div>
                <p className="font-display text-[9px] tracking-[0.24em] text-nebula-soft">HOMER · ILIAD 5.370–371</p>
                <p lang="grc" className="mt-1 font-greek text-[16px] leading-[1.55] text-[#fde68a]">{knees}</p>
                {kneesEnglish && <p className="mt-0.5 font-body text-[16.5px] italic leading-normal text-aether/85">“…{kneesEnglish.replace(/^but\s+/, '')}”</p>}
              </div>
            </div>
            <FinaleLens />
          </div>
          <p className="mt-[22px] font-body text-[17px] leading-relaxed text-aether-muted">
            Under Homer the stars he never names sink back, and Aphrodite&apos;s line leaves the foam of Uranus for her father Zeus and her mother Dione. The atlas keeps both: the quarrel is the subject.
          </p>
          <div className="mt-[18px] flex flex-wrap gap-3">
            {(
              [
                [quarrelHref('aphrodite-parentage'), "⚖ THE QUARREL: APHRODITE'S BIRTH"],
                ['/library/homer/iliad/5#l370-371', 'READ ILIAD 5 →'],
                ['/library/hesiod/theogony', 'READ THE THEOGONY →'],
              ] as const
            ).map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-star-olympian/35 px-3.5 py-[9px] font-display text-[10px] tracking-[0.22em] text-star-olympian transition-colors hover:border-star-olympian/70">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
