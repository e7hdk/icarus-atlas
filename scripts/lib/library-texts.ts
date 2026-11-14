/** The Library's texts, read from the pinned corpus and aligned (docs/LIBRARY_PLAN.md §4.4).
 *
 *  Verse: the original line by line; the English by Perseus card. A card opens at
 *  the original line it translates from — a `div[subtype=card]` in Homer and Ovid,
 *  an `<l n>` chunk in Hesiod, a paragraph of Seaton's Argonautica cut where its
 *  anchor opens — so a block holds an English card and the original lines from
 *  its line to the next card's. Prose: section beside section.
 *
 *  The licence gate (`display`): a work shown as `excerpt` contributes its original
 *  only or, with no original (the Fabulae), only its passage ids and a link out.
 *
 *  The reader's other languages: a verse translation set line for line against the
 *  original (TextGrid's German) is laid beside it line by line (./lineation.ts), and
 *  each block carries the translated lines beside its own original lines. The
 *  atlas's own translation (data/library/translations/) is made line for line and
 *  keyed by the original's line ids, so it needs no laying: each line goes beside
 *  the line it renders, and every line of the original must have one. */

export const OWN_TRANSLATIONS_DIR = join(import.meta.dirname, '..', '..', 'data', 'library', 'translations');

/** The atlas's own translation, read and checked against the work it renders. */
export function readOwnTranslation(work: LibraryWork, file: string, language: OtherLanguage): { text: OwnTranslation; raw: string } {
  const raw = readFileSync(join(OWN_TRANSLATIONS_DIR, file), 'utf8');
  const text = ownTranslationSchema.parse(JSON.parse(raw));
  if (text.work !== work.id || text.language !== language) throw new Error(`${file}: it renders ${text.work} in ${text.language}, but the registry reads it as ${work.id} in ${language}`);
  if (text.from !== work.original?.corpusId) throw new Error(`${file}: made from ${text.from}, but ${work.id}'s original is ${work.original?.corpusId}`);
  return { text, raw };
}

/** A line's key in an own translation: `929a` in a poem without books, `5.370` in a book. */
const lineKey = (unit: string, n: string) => (unit === 'whole' ? n : `${unit}.${n}`);

import { load, type CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ownTranslationSchema } from '../../src/lib/schemas';
import { OTHER_LANGUAGES, isOwnEdition, type LibraryBlock, type LibraryText, type LibraryUnit, type LibraryWork, type OtherLanguage, type OwnTranslation } from '../../src/types/library';
import { anchoredText, normalizeEntry, sha256, toposTextParagraphs, type CorpusEntry, type CorpusManifest } from './corpus';
import { readRaw } from './library-corpus';
import { alignBooks, textGridBooks } from './lineation';

/** Bump when the reading of the corpus changes, so the baked texts rebake. */
const PARSER_VERSION = 2;
/** Bump when the laying of a translation's lines beside the original changes
 *  (./lineation.ts): it signs only the works that carry another language. */
const LINEATION_VERSION = 1;

const clean = (text: string) => text.replace(/ /g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?)\]])/g, '$1').replace(/([(\[])\s+/g, '$1').trim();

function textOf($: CheerioAPI, node: AnyNode, paragraphMark = false): string {
  const clone = $(node).clone();
  clone.find('fw, figure, figDesc').remove();
  if (paragraphMark) clone.find('milestone[unit="para"]').replaceWith(' ¶ ');
  clone.find('note, pb, milestone, lb').replaceWith(' ');
  return clean(clone.text());
}

function entryFor(id: string | undefined, manifest: CorpusManifest): CorpusEntry | null {
  if (!id) return null;
  const entry = manifest.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`corpus entry ${id} is not pinned`);
  return entry;
}

const isBook = ($: CheerioAPI) => (_: number, div: Element) => /^book$/i.test($(div).attr('subtype') ?? '');
const lineNumber = (n: string) => Number.parseInt(n, 10);

/** book → its original lines, in order. `whole` for a poem without books. */
function originalLines(work: LibraryWork, content: string): Map<string, [string, string][]> {
  const $ = load(content, { xmlMode: true });
  const lines = (scope: ReturnType<typeof $>) => scope.find('l[n]').map((_, line) => [[$(line).attr('n') ?? '', textOf($, line)]]).get() as [string, string][];
  if (work.structure === 'lines') return new Map([['whole', lines($('body'))]]);
  const books = new Map<string, [string, string][]>();
  $('body div[type="textpart"]').filter(isBook($)).each((_, div) => { books.set($(div).attr('n') ?? '?', lines($(div))); });
  return books;
}

interface Chunk { start: number; paras: string[]; link?: string }

/** book → the translation's chunks, each opening at an original line. */
function translationChunks(work: LibraryWork, entry: CorpusEntry, content: string): Map<string, Chunk[]> {
  if (entry.format === 'gutenberg-txt') {
    // Project Gutenberg's words, cut at the anchors of another copy (corpus.ts)
    const chunks = new Map<string, Chunk[]>();
    for (const { citation, paras } of anchoredText(entry, content)) {
      const [book, line] = citation.split('.');
      chunks.set(book, [...(chunks.get(book) ?? []), { start: Number(line), paras }]);
    }
    return chunks;
  }
  if (entry.format === 'topostext-html') {
    // the anchors only: ToposText's paragraph ids, the original line each opens at
    const chunks = new Map<string, Chunk[]>();
    for (const { anchor, citation } of toposTextParagraphs(entry, content)) {
      const [book, line] = citation.split('.');
      const start = Number(line);
      if (!Number.isFinite(start)) continue;
      chunks.set(book, [...(chunks.get(book) ?? []), { start, paras: [], link: `${entry.url}#${anchor}` }]);
    }
    return chunks;
  }
  const $ = load(content, { xmlMode: true });
  const chunksIn = (scope: ReturnType<typeof $>): Chunk[] => {
    const cards = scope.find('div[subtype="card"]').get();
    if (cards.length > 0) {
      return cards.map((card) => ({
        start: Number($(card).attr('n')),
        paras: textOf($, card, true).split('¶').map(clean).filter(Boolean),
      }));
    }
    // Hesiod: each <l n> chunk opens at the Greek line it translates from
    return scope.find('l[n]').get().map((line) => ({ start: Number($(line).attr('n')), paras: [textOf($, line)] }));
  };
  if (work.structure === 'lines') return new Map([['whole', chunksIn($('body'))]]);
  const books = new Map<string, Chunk[]>();
  $('body div[type="textpart"]').filter(isBook($)).each((_, div) => { books.set($(div).attr('n') ?? '?', chunksIn($(div))); });
  return books;
}

/** Per language, for each original line of a book, the translated lines laid beside it. */
type Beside = Partial<Record<OtherLanguage, string[][]>>;

function verseBlocks(lines: [string, string][], chunks: Chunk[], beside: Beside = {}): LibraryBlock[] {
  const sorted = [...chunks].filter((chunk) => Number.isFinite(chunk.start)).sort((a, b) => a.start - b.start);
  const indexed = lines.map((line, index) => ({ line, index }));
  const blocks: LibraryBlock[] = [];
  const block = (mine: typeof indexed, base: Omit<LibraryBlock, 'orig'>): LibraryBlock => {
    const translations: LibraryBlock['translations'] = {};
    for (const language of OTHER_LANGUAGES) {
      const per = beside[language];
      if (per) translations[language] = mine.flatMap(({ index }) => per[index]);
    }
    return { ...base, orig: mine.map(({ line }) => line), ...(Object.keys(translations).length ? { translations } : {}) };
  };
  const before = sorted.length ? indexed.filter(({ line: [n] }) => lineNumber(n) < sorted[0].start) : indexed;
  if (before.length) blocks.push(block(before, { from: before[0].line[0], to: before.at(-1)?.line[0] ?? before[0].line[0], trans: [] }));
  sorted.forEach((chunk, index) => {
    const end = sorted[index + 1] ? sorted[index + 1].start - 1 : Infinity;
    const mine = indexed.filter(({ line: [n] }) => lineNumber(n) >= chunk.start && lineNumber(n) <= end);
    const from = mine[0]?.line[0] ?? String(chunk.start);
    const to = mine.at(-1)?.line[0] ?? from;
    blocks.push(block(mine, { from, to, trans: chunk.paras, ...(chunk.link ? { link: chunk.link } : {}) }));
  });
  return blocks;
}

/** The work's other languages, each laid beside the original's lines, book by book.
 *  Only a verse translation set line for line (TextGrid's German) can be read so far. */
function besideOriginal(work: LibraryWork, manifest: CorpusManifest, books: Map<string, [string, string][]>): Map<string, Beside> {
  const perBook = new Map<string, Beside>([...books.keys()].map((id) => [id, {}]));
  for (const language of OTHER_LANGUAGES) {
    const edition = work.translations?.[language];
    if (!edition) continue;
    if (isOwnEdition(edition)) {
      const { lines } = readOwnTranslation(work, edition.file, language).text;
      const keys = new Set<string>();
      for (const [id, original] of books) {
        const beside = perBook.get(id);
        const missing = original.filter(([n]) => !lines[lineKey(id, n)]).map(([n]) => lineKey(id, n));
        if (missing.length > 0) throw new Error(`${edition.file}: no line for ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ` and ${missing.length - 12} more` : ''}`);
        for (const [n] of original) keys.add(lineKey(id, n));
        if (beside) beside[language] = original.map(([n]) => [lines[lineKey(id, n)]]);
      }
      const strays = Object.keys(lines).filter((key) => !keys.has(key));
      if (strays.length > 0) throw new Error(`${edition.file}: ${strays.join(', ')} are no lines of the original`);
      continue;
    }
    const entry = entryFor(edition.corpusId, manifest);
    if (!entry) continue;
    if (entry.format !== 'textgrid-tei' || entry.lineation !== work.original?.corpusId) {
      throw new Error(`${work.id}: ${entry.id} is not a translation laid line for line beside ${work.original?.corpusId}`);
    }
    const translation = textGridBooks(readRaw(entry));
    for (const [id, alignment] of alignBooks(entry.id, books, translation)) {
      const beside = perBook.get(id);
      if (beside) beside[language] = alignment.beside;
    }
  }
  return perBook;
}

function verseText(work: LibraryWork, manifest: CorpusManifest): LibraryUnit[] {
  const original = entryFor(work.original?.corpusId, manifest);
  if (!original) throw new Error(`${work.id}: verse without an original`);
  const translation = entryFor(work.translation.corpusId, manifest);
  const books = originalLines(work, readRaw(original));
  const chunks = translation ? translationChunks(work, translation, readRaw(translation)) : new Map<string, Chunk[]>();
  const keepEnglish = work.display === 'full';
  const beside = besideOriginal(work, manifest, books);
  return [...books].map(([id, lines]) => ({
    id,
    blocks: verseBlocks(lines, (chunks.get(id) ?? []).map((chunk) => (keepEnglish ? chunk : { ...chunk, paras: [] })), beside.get(id)),
  }));
}

/** The sections an edition is cut into, by id. An id printed twice would drop
 *  one of its texts, so it fails the reading. */
function sectionsOf(entry: CorpusEntry | null): Map<string, string> {
  const sections = new Map<string, string>();
  for (const { citation, text } of entry ? normalizeEntry(entry, readRaw(entry)) : []) {
    if (sections.has(citation)) throw new Error(`${entry?.id}: section ${citation} is cut twice`);
    sections.set(citation, text);
  }
  return sections;
}

/** Prose: the sections the research normalizer cuts, joined across the two editions. */
function proseText(work: LibraryWork, manifest: CorpusManifest): LibraryUnit[] {
  if (work.translations && Object.keys(work.translations).length > 0) throw new Error(`${work.id}: a prose work cannot carry another language yet`);
  const original = entryFor(work.original?.corpusId, manifest);
  const translation = entryFor(work.translation.corpusId, manifest);
  const originalSections = sectionsOf(original);
  const translated = sectionsOf(translation);
  const english = work.display === 'full' ? translated : new Map<string, string>();
  // the original's sections set the order, so a translated section without one would vanish
  const orphans = original ? [...english.keys()].filter((id) => !originalSections.has(id)) : [];
  if (orphans.length > 0) throw new Error(`${work.id}: the translation's ${orphans.join(', ')} have no section in the original`);
  // the Fabulae, with no original, take ToposText's ids
  const ids = [...(original ? originalSections : translated).keys()];
  const units = new Map<string, LibraryBlock[]>();
  for (const id of ids) {
    const unit = work.units === 'whole' ? 'whole' : id.split('.')[0];
    const block: LibraryBlock = { from: id, to: id, orig: originalSections.get(id) ?? '', trans: english.has(id) ? [english.get(id) ?? ''] : [] };
    if (!original && translation?.format === 'topostext-html') block.link = `${translation.url}#${translation.urnBase}:${id}`;
    units.set(unit, [...(units.get(unit) ?? []), block]);
  }
  return [...units].map(([id, blocks]) => ({ id, blocks }));
}

const otherLanguages = (work: LibraryWork) => OTHER_LANGUAGES.filter((language) => work.translations?.[language]);

export function textSignature(work: LibraryWork, manifest: CorpusManifest): string {
  const others = otherLanguages(work);
  const editions = others.map((language) => work.translations?.[language]).filter((edition) => edition !== undefined);
  const pinned = [work.original?.corpusId, work.translation.corpusId, ...editions.map((edition) => (isOwnEdition(edition) ? undefined : edition.corpusId))]
    .map((id) => entryFor(id, manifest))
    .filter((entry): entry is CorpusEntry => entry !== null)
    .map((entry) => `${entry.id}:${entry.sha256}`);
  // the atlas's own translations are signed by their words: an edit wants a rebake
  const own = editions.flatMap((edition) => (isOwnEdition(edition) ? [`${edition.file}:${sha256(readFileSync(join(OWN_TRANSLATIONS_DIR, edition.file)))}`] : []));
  // a work in English alone keeps the signature it had before the reader's other languages
  const lineation = others.length > 0 ? [`lineation v${LINEATION_VERSION}`, ...others] : [];
  return sha256([`v${PARSER_VERSION}`, work.id, work.structure, work.units, work.display, ...pinned, ...own, ...lineation].join('\n'));
}

export function bakeText(work: LibraryWork, manifest: CorpusManifest): LibraryText {
  const verse = work.structure === 'books-of-lines' || work.structure === 'lines';
  const units = verse ? verseText(work, manifest) : proseText(work, manifest);
  const others = otherLanguages(work);
  // every translated line lands in one block, once
  for (const language of others) {
    const edition = work.translations?.[language];
    if (!edition) continue;
    const entry = isOwnEdition(edition) ? null : entryFor(edition.corpusId, manifest);
    const expected = isOwnEdition(edition) ? Object.keys(readOwnTranslation(work, edition.file, language).text.lines).length : entry ? textGridBooks(readRaw(entry)).flat().length : 0;
    const baked = units.reduce((sum, unit) => sum + unit.blocks.reduce((lines, block) => lines + (block.translations?.[language]?.length ?? 0), 0), 0);
    if (baked !== expected) throw new Error(`${work.id}: ${baked} ${language} lines baked of the ${expected} the translation has`);
  }
  const translations = Object.fromEntries(others.map((language) => [language, 'verse' as const]));
  return { work: work.id, signature: textSignature(work, manifest), verse, ...(others.length > 0 ? { translations } : {}), units };
}

/** The characters a unit carries, the budget the gate holds it to. */
export function unitSize(unit: LibraryUnit): number {
  const chars = (texts: string[]) => texts.reduce((sum, text) => sum + text.length, 0);
  return unit.blocks.reduce(
    (sum, block) =>
      sum +
      (typeof block.orig === 'string' ? block.orig.length : chars(block.orig.map(([, text]) => text))) +
      chars(block.trans) +
      Object.values(block.translations ?? {}).reduce((others, lines) => others + chars(lines), 0),
    0,
  );
}
