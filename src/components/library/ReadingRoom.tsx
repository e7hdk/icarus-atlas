import { Link } from '@/components/ui/Link';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { CitationStrip } from './CitationStrip';
import { MarginPanel } from './MarginPanel';
import { ReadingLens } from './ReadingLens';
import { loadAtlasData } from '@/features/characters/load';
import { englishLinker, type EnglishLinker } from '@/features/library/link-english';
import { romanBook } from '@/features/library/load';
import { libraryMarginData } from '@/features/library/margin-files';
import { marginBase } from '@/features/library/margin-paths';
import { scopeOf, type UnitMargin } from '@/features/library/margins';
import { unitHref, workHref } from '@/features/library/links';
import type { ProseSegment } from '@/features/linking/parse-prose';
import { TYPE_GLOW } from '@/types/character';
import type { LibraryBlock, LibraryUnit, LibraryWork } from '@/types/library';

/** One reading page of the Library (docs/LIBRARY_PLAN.md §6): a book, or a whole
 *  short work. The original line by line beside the English card it translates;
 *  line numbers every five in the original's lineation, the one the atlas cites.
 *  Rendered on the server, so the text is in the HTML. */

const ORIGINAL_LANGUAGE: Record<string, { lang: string; label: string }> = {
  ovid: { lang: 'la', label: 'Latine' },
  hyginus: { lang: 'la', label: 'Latine' },
};
const GREEK = { lang: 'grc', label: 'Ἑλληνικά' };

const isVerse = (work: LibraryWork) => work.structure === 'books-of-lines' || work.structure === 'lines';

/** A name in the English, linked to its codex: a plain anchor, since a book holds a
 *  thousand of them and none needs the client. */
function Paragraph({ segments }: { segments: ProseSegment[] }) {
  return (
    <p>
      {segments.map((segment, index) =>
        segment.kind === 'link' ? (
          <a key={index} href={`/character/${segment.id}`} className="lib-name" style={{ color: TYPE_GLOW[segment.type].color }}>
            {segment.text}
          </a>
        ) : (
          segment.text
        ),
      )}
    </p>
  );
}

function Block({ block, work, lang, linker, scope }: { block: LibraryBlock; work: LibraryWork; lang: string; linker: EnglishLinker; scope: string[] }) {
  const verse = isVerse(work);
  const id = work.structure === 'tales' ? `t${block.from}` : verse ? undefined : `s${block.from}`;
  const hasOriginal = Array.isArray(block.orig) ? block.orig.length > 0 : block.orig !== '';
  const range = verse ? (block.from === block.to ? `LINE ${block.from}` : `LINES ${block.from}–${block.to}`) : work.structure === 'tales' && /^\d/.test(block.from) ? `TALE ${block.from}` : block.from.toUpperCase();
  return (
    <section className="lib-block" id={id} data-from={block.from} data-to={block.to}>
      <p className="lib-range">{range}</p>
      <div className="lib-cols">
        {hasOriginal && (
          <div className="lib-orig" lang={lang}>
            {Array.isArray(block.orig) ? (
              block.orig.map(([n, text]) => (
                <div key={n} id={`l${n}`} className="lib-line" data-n={n}>
                  <i aria-hidden>{Number.parseInt(n, 10) % 5 === 0 || /[a-z]/.test(n) ? n : ''}</i>
                  <span>{text}</span>
                </div>
              ))
            ) : (
              <p>{block.orig}</p>
            )}
          </div>
        )}
        <div className="lib-trans">
          {block.trans.map((paragraph, index) => (
            <Paragraph key={index} segments={linker.link(paragraph, scope)} />
          ))}
          {block.trans.length === 0 && block.link && (
            <a href={block.link} target="_blank" rel="noreferrer" className="lib-out">
              {hasOriginal ? 'Read the English at ToposText' : 'Read it at ToposText'} ↗
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export async function ReadingRoom({ work, unit, units, tellerName }: { work: LibraryWork; unit: LibraryUnit; units: string[]; tellerName: string }) {
  const [{ characters, sources }, { margins, relationEnds }] = await Promise.all([loadAtlasData(), libraryMarginData()]);
  const margin: UnitMargin | undefined = margins.get(`${work.id}/${unit.id}`);
  const linker = englishLinker(work.translation.corpusId, characters);
  const tellers = Object.fromEntries(sources.map((source) => [source.id, source.name]));
  const marginAt = marginBase(work.id, unit.id);
  const whole = unit.id === 'whole';
  const index = units.indexOf(unit.id);
  const previous = index > 0 ? units[index - 1] : null;
  const next = index >= 0 && index < units.length - 1 ? units[index + 1] : null;
  const original = ORIGINAL_LANGUAGE[work.author] ?? GREEK;
  const hasOriginal = Boolean(work.original);
  const showsTranslation = work.display === 'full';
  const verse = isVerse(work);
  const where = (block: LibraryBlock) => {
    const prefix = whole ? work.title : `${work.title} ${unit.id}`;
    if (!verse) return `${work.title} ${block.from}`;
    return `${prefix}.${block.from}${block.to !== block.from ? `–${block.to}` : ''}`.replace(`${work.title}.`, `${work.title} `);
  };
  const ranges = Object.fromEntries(unit.blocks.map((block) => [block.from, where(block)]));
  const credits = [work.original?.credit, showsTranslation ? work.translation.credit : null].filter(Boolean).join('. ');

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-24 pt-20 sm:px-6 xl:max-w-[1500px]">
      <CrumbBar
        back={whole ? { href: '/library', label: 'Back to the Library' } : { href: workHref(work), label: `Back to the ${work.title}` }}
        trail={[{ href: '/library', label: 'Library' }, ...(whole ? [] : [{ href: workHref(work), label: work.title }])]}
        current={whole ? work.title : `Book ${romanBook(unit.id)}`}
      />
      <div className="mt-8">
        <ReadingLens hasOriginal={hasOriginal} showsTranslation={showsTranslation} originalLabel={original.label} verse={verse}>
          <div className="grid gap-10 lg:grid-cols-[164px_minmax(0,1fr)] xl:grid-cols-[164px_minmax(0,1fr)_300px]">
            <nav aria-label={`Books of the ${work.title}`} className="hidden lg:block">
              <div className="sticky top-24">
                <p className="font-display text-[15px] tracking-[0.14em] text-aether">{work.title.toUpperCase()}</p>
                {work.greekTitle && <p className="mt-0.5 font-greek text-[15px] italic text-star-olympian/70">{work.greekTitle}</p>}
                <p className="mt-1 font-body text-[13px] italic text-aether-faint">{tellerName} · {work.composed.label}</p>
                {!whole && (
                  <ol className="mt-5 grid grid-cols-3 gap-1">
                    {units.map((id) => (
                      <li key={id}>
                        <Link
                          href={unitHref(work, id)}
                          aria-current={id === unit.id ? 'page' : undefined}
                          className={`block rounded px-1.5 py-1 text-center font-display text-[10px] tracking-[0.08em] transition-colors ${
                            id === unit.id ? 'bg-star-olympian/10 text-star-olympian' : 'text-aether-faint hover:text-aether'
                          }`}
                        >
                          {romanBook(id)}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
                <CitationStrip base={marginAt} blocks={unit.blocks.map((block) => block.from)} />
              </div>
            </nav>

            <article className="min-w-0">
              <header className="border-b border-star-olympian/20 pb-6">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-aether-faint">
                  {tellerName} · {work.title}
                </p>
                <h1 className="mt-2 font-display text-3xl tracking-[0.12em] text-aether drop-shadow-[0_0_18px_rgba(252,211,77,0.25)] sm:text-4xl">
                  {whole ? work.title.toUpperCase() : `BOOK ${romanBook(unit.id)}`}
                  {work.greekTitle && <span className="mt-1 block font-greek text-xl italic tracking-normal text-star-olympian/75 sm:ml-4 sm:mt-0 sm:inline">{work.greekTitle}</span>}
                </h1>
                {credits && <p className="mt-3 max-w-3xl font-body text-[14px] italic leading-relaxed text-aether-faint">{credits}.</p>}
                {work.id === 'theogony' && (
                  <Link href="/theogony" className="mt-4 inline-block rounded-full border border-star-olympian/35 px-3.5 py-2 font-display text-[10px] tracking-[0.22em] text-star-olympian transition-colors hover:border-star-olympian/70">
                    FIRST, CHAOS: READ IT WITH THE SKY →
                  </Link>
                )}
                {!showsTranslation && (
                  <p className="mt-3 max-w-3xl font-body text-[15px] leading-relaxed text-aether-muted">
                    {hasOriginal
                      ? 'The English shown beside this text waits on its licence: the pinned copy comes from a CC BY-NC page, so each block links to it instead.'
                      : 'Mary Grant’s English is very likely in the US public domain but not yet confirmed, and the corpus holds no Latin, so each passage links to its English at ToposText for now.'}
                  </p>
                )}
                {!whole && (
                  <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
                    {units.map((id) => (
                      <Link
                        key={id}
                        href={unitHref(work, id)}
                        aria-current={id === unit.id ? 'page' : undefined}
                        className={`shrink-0 rounded-full border px-2.5 py-1 font-display text-[10px] tracking-[0.08em] ${
                          id === unit.id ? 'border-star-olympian/50 bg-star-olympian/10 text-star-olympian' : 'border-glass-border text-aether-faint'
                        }`}
                      >
                        {romanBook(id)}
                      </Link>
                    ))}
                  </div>
                )}
              </header>

              {hasOriginal && showsTranslation && (
                <div className="lib-colheads" aria-hidden>
                  <span>{verse ? 'THE ' : ''}{original.lang === 'la' ? 'LATIN' : 'GREEK'}</span>
                  <span>THE ENGLISH</span>
                </div>
              )}

              <div className={work.structure === 'tales' ? 'lib-tales' : undefined}>
                {unit.blocks.map((block) => (
                  <Block key={`${block.from}-${block.to}`} block={block} work={work} lang={original.lang} linker={linker} scope={scopeOf(margin?.blocks[block.from], relationEnds)} />
                ))}
              </div>

              <nav className="mt-10 flex justify-between font-display text-[10px] tracking-[0.22em]">
                {previous ? <Link href={unitHref(work, previous)} className="text-aether-muted hover:text-aether">← BOOK {romanBook(previous)}</Link> : <span />}
                {next ? <Link href={unitHref(work, next)} className="text-aether-muted hover:text-aether">BOOK {romanBook(next)} →</Link> : <span />}
              </nav>
              <p className="mt-8 border-t border-glass-border pt-6 font-body text-[13px] leading-relaxed text-aether-faint">
                From the pinned corpus of the atlas, research/corpus/manifest.json. {work.original?.licence === 'CC BY-SA 4.0' ? 'Perseus Digital Library texts are shared under CC BY-SA 4.0, as the atlas’s own data is.' : ''} Translators’ notes are left out; the line numbers are the original’s.
              </p>
            </article>
            <MarginPanel base={marginAt} ranges={ranges} tellers={tellers} unitLabel={whole ? work.title : `Book ${romanBook(unit.id)}`} />
          </div>
        </ReadingLens>
      </div>
    </main>
  );
}
