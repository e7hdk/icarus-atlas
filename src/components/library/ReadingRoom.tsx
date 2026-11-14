import type { CSSProperties } from 'react';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { BookReader } from './BookReader';
import { MarginPanel } from './MarginPanel';
import { loadAtlasData } from '@/features/characters/load';
import { englishLinker, type EnglishLinker } from '@/features/library/link-english';
import { romanBook } from '@/features/library/load';
import { libraryMarginData } from '@/features/library/margin-files';
import { marginBase } from '@/features/library/margin-paths';
import { scopeOf, type UnitMargin } from '@/features/library/margins';
import { unitHref, workHref } from '@/features/library/links';
import type { ProseSegment } from '@/features/linking/parse-prose';
import { TYPE_GLOW } from '@/types/character';
import { OTHER_LANGUAGES, isOwnEdition, type LibraryBlock, type LibraryUnit, type LibraryWork, type OtherLanguage, type ReaderLanguage, type ReaderEdition } from '@/types/library';

/** One reading page of the Library (docs/LIBRARY_PLAN.md §6): a book, or a whole
 *  short work, bound as a book of night sky. The original is the left page and
 *  the translation the right, as in a Loeb: the English, or the German where the
 *  work has one and the reader chose it; line numbers every five in the original's
 *  lineation, the one the atlas cites. Rendered on the server, every translation
 *  in the HTML: the client only cuts the chosen one into pages (`BookReader`). */

const ORIGINAL_LANGUAGE: Record<string, { lang: string; label: string }> = {
  ovid: { lang: 'la', label: 'Latine' },
  hyginus: { lang: 'la', label: 'Latine' },
};
const GREEK = { lang: 'grc', label: 'Ἑλληνικά' };

const isVerse = (work: LibraryWork) => work.structure === 'books-of-lines' || work.structure === 'lines';

/** The translator a credit names: "English translation by A. T. Murray (Loeb, …)" → A. T. Murray. */
const translatorOf = (credit: string) => /translation(?: of Book \d+)? by (.+?) \(/.exec(credit)?.[1] ?? credit;

/** The translator as the menu names them: the atlas's own translation says when it is still a draft. */
const translatorLabel = (edition: ReaderEdition) => `${translatorOf(edition.credit)}${isOwnEdition(edition) && edition.status === 'draft' ? ' · draft' : ''}`;

const LANGUAGE_IN_ENGLISH: Record<OtherLanguage, string> = { de: 'German', tr: 'Turkish' };

/** A name in the English, linked to its codex: a plain anchor, since a book holds a
 *  thousand of them and none needs the client. A paragraph after the first says so
 *  itself (`lib-next`): a page copies paragraphs singly, so none may lean on its
 *  neighbour for its indent. */
function Paragraph({ segments, next }: { segments: ProseSegment[]; next: boolean }) {
  return (
    <p className={next ? 'lib-next' : undefined}>
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

/** One aligned block: the original's share and the English's, each a cell the book
 *  can set on its own page. Prose carries its section number in both; verse is
 *  numbered by its lines, so only the English says which lines it renders. */
function Block({ block, work, lang, linker, scope }: { block: LibraryBlock; work: LibraryWork; lang: string; linker: EnglishLinker; scope: string[] }) {
  const verse = isVerse(work);
  const hasOriginal = Array.isArray(block.orig) ? block.orig.length > 0 : block.orig !== '';
  const range = verse ? (block.from === block.to ? `LINE ${block.from}` : `LINES ${block.from}–${block.to}`) : work.structure === 'tales' && /^\d/.test(block.from) ? `TALE ${block.from}` : block.from.toUpperCase();
  return (
    <section className="lib-block" data-from={block.from} data-to={block.to}>
      {work.original && (
        <div className="lib-orig" lang={lang}>
          {hasOriginal && !verse && <p className="lib-range">{range}</p>}
          {Array.isArray(block.orig) ? (
            block.orig.map(([n, text], at) => (
              // an edition may print a line number twice
              <div key={`${n}:${at}`} className="lib-line" data-n={n}>
                <i aria-hidden>{Number.parseInt(n, 10) % 5 === 0 || /[a-z]/.test(n) ? n : ''}</i>
                <span>{text}</span>
              </div>
            ))
          ) : (
            hasOriginal && <p>{block.orig}</p>
          )}
        </div>
      )}
      <div className="lib-trans" data-tl="en">
        <p className="lib-range">{range}</p>
        {block.trans.map((paragraph, index) => (
          <Paragraph key={index} segments={linker.link(paragraph, scope)} next={index > 0} />
        ))}
        {block.trans.length === 0 && block.link && (
          <a href={block.link} target="_blank" rel="noreferrer" className="lib-out">
            {hasOriginal ? 'Read the English at ToposText' : 'Read it at ToposText'} ↗
          </a>
        )}
      </div>
      {/* the reader's other languages: a verse translation keeps its lines, each its own;
          lines the translator did not render leave the block empty in that language */}
      {OTHER_LANGUAGES.map((language) => {
        const lines = block.translations?.[language];
        if (!lines) return null;
        return (
          <div key={language} className="lib-trans" data-tl={language} data-form="verse" lang={language}>
            {lines.length > 0 && <p className="lib-range">{range}</p>}
            {lines.map((line, index) => (
              <p key={index} className="lib-vl">
                {line}
              </p>
            ))}
          </div>
        );
      })}
    </section>
  );
}

/** The device on the boards: an armillary of two orbits round a star. */
function Device() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="bk-device">
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="52" strokeWidth="0.9" opacity="0.55" />
        <circle cx="60" cy="60" r="47" strokeWidth="0.5" strokeDasharray="1 4" opacity="0.5" />
        <ellipse cx="60" cy="60" rx="52" ry="19" strokeWidth="0.8" opacity="0.5" transform="rotate(-32 60 60)" />
        <ellipse cx="60" cy="60" rx="52" ry="19" strokeWidth="0.8" opacity="0.5" transform="rotate(32 60 60)" />
      </g>
      <g fill="currentColor">
        <path d="M60 41 L63.4 56.6 L79 60 L63.4 63.4 L60 79 L56.6 63.4 L41 60 L56.6 56.6 Z" />
        <path d="M60 49 L62 58 L71 60 L62 62 L60 71 L58 62 L49 60 L58 58 Z" opacity="0.55" transform="rotate(45 60 60)" />
        <circle cx="104.1" cy="32.4" r="2" />
        <circle cx="15.9" cy="32.4" r="1.5" opacity="0.8" />
        <circle cx="26" cy="99" r="1.3" opacity="0.7" />
        <circle cx="92" cy="101" r="1.7" opacity="0.85" />
        <circle cx="60" cy="8" r="1.2" opacity="0.7" />
      </g>
    </svg>
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
  const others = OTHER_LANGUAGES.flatMap((language) => {
    const edition = work.translations?.[language];
    return edition ? [{ language, edition }] : [];
  });
  const translators: Partial<Record<ReaderLanguage, string>> = Object.fromEntries([
    ...(showsTranslation ? [['en', translatorOf(work.translation.credit)]] : []),
    ...others.map(({ language, edition }) => [language, translatorLabel(edition)]),
  ]);
  const credits = [work.original?.credit, showsTranslation ? work.translation.credit : null, ...others.map(({ edition }) => edition.credit)].filter(Boolean).join('. ');
  const book = whole ? null : `Book ${romanBook(unit.id)}`;
  // the title is cut in gold across the board: its longest word sets the size of the letters
  const longest = Math.max(...work.title.split(' ').map((word) => word.length));
  const fit = { '--bk-title-fit': Math.min(0.118, 0.7 / (0.86 * longest)).toFixed(4) } as CSSProperties;

  const cover = (
    <>
      <div className="bk-cover-front" style={fit}>
        <div className="bk-cover-frame">
          <p className="bk-cover-teller">{tellerName}</p>
          <p className="bk-cover-title">{work.title.toUpperCase()}</p>
          {work.greekTitle && (
            <p className="bk-cover-greek" lang={original.lang}>
              {work.greekTitle}
            </p>
          )}
          <Device />
          <p className="bk-cover-unit">{book ?? work.composed.label}</p>
        </div>
        <i className="bk-shade" />
      </div>
      <div className="bk-cover-back" aria-hidden>
        <p className="bk-hint">
          <span className="bk-hint-hand">Swipe to turn the page.</span>
          <span className="bk-hint-keys">Turn the page with the arrow keys, a click on its edge, or a drag.</span>
        </p>
        <i className="bk-shade" />
      </div>
    </>
  );

  const title = (
    <div className="bk-plate bk-plate-title" style={fit}>
      <p className="bk-plate-teller">{tellerName}</p>
      <p className="bk-plate-name">{work.title.toUpperCase()}</p>
      {work.greekTitle && (
        <p className="bk-plate-greek" lang={original.lang}>
          {work.greekTitle}
        </p>
      )}
      <p className="bk-plate-unit">{book ? `${book} · ${work.composed.label}` : work.composed.label}</p>
      <span className="bk-rule" aria-hidden />
      {credits && <p className="bk-plate-credits">{credits}.</p>}
      {!showsTranslation && (
        <p className="bk-plate-credits">
          {hasOriginal
            ? 'The English shown beside this text waits on its licence: the pinned copy comes from a CC BY-NC page, so each block links to it instead.'
            : 'Mary Grant’s English is very likely in the US public domain but not yet confirmed, and the corpus holds no Latin, so each passage links to its English at ToposText for now.'}
        </p>
      )}
      {work.id === 'theogony' && (
        <a href="/theogony" className="bk-plate-link">
          First, Chaos: read it with the sky →
        </a>
      )}
      {!whole && (
        <nav aria-label={`Books of the ${work.title}`} className="bk-plate-books">
          {units.map((id) => (
            <a key={id} href={unitHref(work, id)} aria-current={id === unit.id ? 'page' : undefined}>
              {romanBook(id)}
            </a>
          ))}
        </nav>
      )}
      <p className="bk-plate-hint">Swipe to turn the page.</p>
    </div>
  );

  const colophon = (
    <div className="bk-plate bk-plate-end">
      <Device />
      <p className="bk-plate-teller">{book ? `Here ends ${book} of the ${work.title}` : `Here ends the ${work.title}`}</p>
      {next && (
        <a href={unitHref(work, next)} className="bk-plate-next">
          Book {romanBook(next)} →
        </a>
      )}
      <p className="bk-plate-ways">
        {previous && <a href={unitHref(work, previous)}>← Book {romanBook(previous)}</a>}
        <a href={whole ? '/library' : workHref(work)}>{whole ? 'Back to the Library' : `All books of the ${work.title}`}</a>
      </p>
      <p className="bk-plate-credits">
        From the pinned corpus of the atlas, research/corpus/manifest.json. {work.original?.licence === 'CC BY-SA 4.0' ? 'Perseus Digital Library texts are shared under CC BY-SA 4.0, as the atlas’s own data is. ' : ''}
        {others.some(({ edition }) => edition.credit.includes('TextGrid')) ? 'TextGrid’s German texts are shared under CC BY 3.0 DE; the translations themselves are public domain. ' : ''}
        {others
          .filter(({ edition }) => isOwnEdition(edition))
          .map(({ language, edition }) => `The ${LANGUAGE_IN_ENGLISH[language]} is the atlas’s own translation from the original${isOwnEdition(edition) && edition.status === 'draft' ? ', a draft until the editor has read it through' : ''}, shared under ${edition.licence} like its data. `)
          .join('')}
        Translators’ notes are left out; the line numbers are the original’s.
      </p>
    </div>
  );

  return (
    <main className="book-room">
      {/* the cover carries the title for the eye; it turns away, so the heading stands here */}
      <h1 className="sr-only">{book ? `${work.title}, ${book}` : work.title}</h1>
      <BookReader
        key={`${work.id}/${unit.id}`}
        storageKey={`${work.id}/${unit.id}`}
        workId={work.id}
        headWork={work.title}
        headUnit={book ?? tellerName}
        structure={verse ? 'verse' : work.structure === 'tales' ? 'tales' : 'sections'}
        hasOriginal={hasOriginal}
        showsTranslation={showsTranslation}
        translators={translators}
        originalLabel={original.label}
        blocks={unit.blocks.map((block) => block.from)}
        marginBase={marginAt}
        crumb={
          <CrumbBar
            back={whole ? { href: '/library', label: 'Back to the Library' } : { href: workHref(work), label: `Back to the ${work.title}` }}
            trail={[{ href: '/library', label: 'Library' }, ...(whole ? [] : [{ href: workHref(work), label: work.title }])]}
            current={whole ? work.title : `Book ${romanBook(unit.id)}`}
            compact
          />
        }
        cover={cover}
        title={title}
        colophon={colophon}
        margin={<MarginPanel base={marginAt} ranges={ranges} tellers={tellers} unitLabel={whole ? work.title : `Book ${romanBook(unit.id)}`} />}
      >
        {unit.blocks.map((block) => (
          <Block key={`${block.from}-${block.to}`} block={block} work={work} lang={original.lang} linker={linker} scope={scopeOf(margin?.blocks[block.from], relationEnds)} />
        ))}
      </BookReader>
    </main>
  );
}
