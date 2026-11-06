import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load, type Cheerio, type CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { z } from 'zod';
import { SOURCE_IDS } from '../../src/types/character';

const entrySchema = z.object({
  id: z.string().min(1),
  sourceId: z.enum(SOURCE_IDS),
  author: z.string().min(1),
  work: z.string().min(1),
  citationLabel: z.string().min(1),
  language: z.enum(['en', 'grc', 'lat']),
  format: z.enum(['perseus-tei', 'topostext-html', 'gutenberg-txt', 'latinlibrary-html']),
  urnBase: z.string().startsWith('urn:cts:'),
  edition: z.string().min(1),
  license: z.string().min(1),
  url: z.string().url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  file: z.string().regex(/^[a-z0-9-]+\.(xml|html|txt)$/),
  /** The file's encoding where it is not UTF-8: Project Gutenberg's 8-bit texts are Latin-1. */
  encoding: z.enum(['utf8', 'latin1']).optional(),
  /** A translation printed without line numbers takes them from another pinned
   *  copy of the same translation, by this id (docs/LIBRARY_PLAN.md §4.4). */
  anchors: z.string().min(1).optional(),
  /** A page printed without its sections reads them from this file in
   *  research/corpus/sections/: where each opens, and the page's typing slips. */
  sections: z.string().regex(/^[a-z0-9-]+\.json$/).optional(),
});

const manifestSchema = z.object({
  version: z.literal(1),
  description: z.string().min(1),
  entries: z.array(entrySchema).min(1),
});

export const CORPUS_DIR = join(import.meta.dirname, '..', '..', 'research', 'corpus');
export const RAW_DIR = join(CORPUS_DIR, 'raw');
export const NORMALIZED_DIR = join(CORPUS_DIR, 'normalized');
export const INDEX_PATH = join(NORMALIZED_DIR, 'index.jsonl');
export const MANIFEST_PATH = join(CORPUS_DIR, 'manifest.json');
export const SECTIONS_DIR = join(CORPUS_DIR, 'sections');

export type CorpusEntry = z.infer<typeof entrySchema>;
export type CorpusManifest = z.infer<typeof manifestSchema>;

export interface CorpusPassage {
  id: string;
  sourceId: CorpusEntry['sourceId'];
  author: string;
  work: string;
  citation: string;
  citationLabel: string;
  language: CorpusEntry['language'];
  text: string;
  urn: string;
  edition: string;
  sourceUrl: string;
}

export function loadManifest(): CorpusManifest {
  return manifestSchema.parse(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')));
}

export function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/** A pinned file's text, in the encoding its entry names. */
export function decode(entry: CorpusEntry, bytes: Buffer): string {
  return bytes.toString(entry.encoding ?? 'utf8');
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText($: CheerioAPI, selection: Cheerio<AnyNode>): string {
  const clone = selection.clone();
  // A note or a page mark sits between words ("call Meliae<note>…</note>all"):
  // it leaves a space behind, or the words around it run together.
  clone.find('fw, figure, figDesc').remove();
  clone.find('note, pb, milestone, lb').replaceWith(' ');
  return normalizeWhitespace(clone.text()).replace(/\s+([,.;:!?)\]])/g, '$1').replace(/([(\[])\s+/g, '$1');
}

function numberedAncestors($: CheerioAPI, element: Element): Array<{ subtype: string; n: string }> {
  const result: Array<{ subtype: string; n: string }> = [];
  const chain = $(element).parents('div[type="textpart"]').get().reverse().concat(element);
  for (const node of chain) {
    const current = $(node);
    const n = current.attr('n');
    if (!n || n.startsWith('urn:cts:')) continue;
    result.push({ subtype: current.attr('subtype') ?? '', n });
  }
  return result;
}

function numericValues(values: string[]): number[] {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function lineRange($: CheerioAPI, element: Element): string | null {
  const selection = $(element);
  const lineNumbers = numericValues(selection.find('l[n]').map((_, line) => $(line).attr('n') ?? '').get());
  const milestoneNumbers = numericValues(
    selection.find('milestone[unit="line"][n]').map((_, milestone) => $(milestone).attr('n') ?? '').get(),
  );
  const values = lineNumbers.length > 0 ? lineNumbers : milestoneNumbers;
  if (values.length > 0) return values.length === 1 ? String(values[0]) : `${values[0]}-${values.at(-1)}`;

  const start = Number(selection.attr('n'));
  const next = Number(selection.nextAll('div[type="textpart"][subtype="card"][n]').first().attr('n'));
  if (Number.isFinite(start) && Number.isFinite(next)) return `${start}-${next - 1}`;
  return Number.isFinite(start) ? String(start) : null;
}

function textpartCitation($: CheerioAPI, element: Element): string {
  const parts = numberedAncestors($, element);
  const book = parts.find((part) => part.subtype === 'book')?.n;
  const subtype = $(element).attr('subtype') ?? '';

  if (subtype === 'card') {
    const range = lineRange($, element) ?? $(element).attr('n') ?? '?';
    return book ? `${book}.${range}` : range;
  }

  const structural = parts
    .filter((part) => ['book', 'chapter', 'section'].includes(part.subtype))
    .map((part) => part.n);
  return structural.length > 0 ? structural.join('.') : ($(element).attr('n') ?? '?');
}

function passage(entry: CorpusEntry, citation: string, text: string, index: number): CorpusPassage {
  return {
    id: `${entry.id}:${citation}:${index}`,
    sourceId: entry.sourceId,
    author: entry.author,
    work: entry.work,
    citation,
    citationLabel: entry.citationLabel,
    language: entry.language,
    text,
    urn: `${entry.urnBase}:${citation}`,
    edition: entry.edition,
    sourceUrl: entry.url,
  };
}

function normalizeTei(entry: CorpusEntry, content: string): CorpusPassage[] {
  const $ = load(content, { xmlMode: true });
  const textparts = $('body div[type="textpart"]').filter((_, element) => $(element).find('div[type="textpart"]').length === 0);
  const passages: CorpusPassage[] = [];

  textparts.each((_, element) => {
    const lines = $(element).find('l[n]');
    const text = lines.length > 0
      ? normalizeWhitespace(lines.map((__, line) => cleanText($, $(line))).get().join(' '))
      : cleanText($, $(element));
    if (text.length < 2) return;
    const citation = textpartCitation($, element);
    passages.push(passage(entry, citation, text, passages.length));
  });

  if (passages.length > 0) return passages;

  const lines = $('body l[n]').get();
  for (let offset = 0; offset < lines.length; offset += 5) {
    const group = lines.slice(offset, offset + 5);
    const first = $(group[0]).attr('n') ?? '?';
    const last = $(group.at(-1)!).attr('n') ?? first;
    const citation = first === last ? first : `${first}-${last}`;
    const text = normalizeWhitespace(group.map((line) => cleanText($, $(line))).join(' '));
    if (text.length >= 2) passages.push(passage(entry, citation, text, passages.length));
  }

  return passages;
}

/** ToposText's paragraph ids name the line of the original each paragraph opens
 *  at. Three in its Argonautica are misprinted, two out of order and one ten
 *  lines late; Mooney's Greek shows where each paragraph opens. A key `id#n`
 *  names the n-th paragraph printed with that id. */
const ANCHOR_CORRECTIONS: Record<string, Record<string, string>> = {
  'apollonius-argonautica-en': {
    '1.221': '1.211', // "Next came Zetes and Calais": Ζήτης αὖ Κάλαΐς τε, 1.211
    '3.383': '3.484', // "He spake with goodwill": Ἴσκεν ἐυφρονέων, 3.484
    '3.388': '3.887', // "But when she had left the city's well paved streets": αὐτὰρ ἐπεὶ πόλιος μὲν ἐυδμήτους λίπʼ ἀγυιάς, 3.887
  },
  'hyginus-astronomica-en': {
    '2.3.1#2': '2.3.2', // "Some also say this dragon was thrown at Minerva": Nonnulli etiam dixerunt hunc draconem
  },
};

export interface ToposTextParagraph {
  /** The paragraph's id on ToposText's page, which a link out needs. */
  anchor: string;
  /** Where it opens in the original's numbering, corrected where the id is misprinted. */
  citation: string;
  text: string;
}

/** ToposText's paragraphs in their order. */
export function toposTextParagraphs(entry: CorpusEntry, content: string): ToposTextParagraph[] {
  const $ = load(content);
  const corrections = ANCHOR_CORRECTIONS[entry.id] ?? {};
  const printings = new Map<string, number>();
  return $('p[id^="urn:cts:"]').get().flatMap((element) => {
    const anchor = $(element).attr('id');
    if (!anchor) return [];
    const printed = anchor.slice(anchor.lastIndexOf(':') + 1);
    const nth = (printings.get(printed) ?? 0) + 1;
    printings.set(printed, nth);
    const clone = $(element).clone();
    clone.find('b').first().remove();
    return [{ anchor, citation: corrections[`${printed}#${nth}`] ?? corrections[printed] ?? printed, text: normalizeWhitespace(clone.text()) }];
  });
}

function normalizeToposText(entry: CorpusEntry, content: string): CorpusPassage[] {
  return toposTextParagraphs(entry, content)
    .filter(({ text }) => text.length >= 2)
    .map(({ citation, text }, index) => passage(entry, citation, text, index));
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };

const romanValue = (numeral: string) =>
  [...numeral].reduce((sum, letter, index, letters) => {
    const value = ROMAN[letter] ?? 0;
    return sum + (value < (ROMAN[letters[index + 1]] ?? 0) ? -value : value);
  }, 0);

/** Project Gutenberg's plain text of a work in books: each book's paragraphs,
 *  from the heading that follows the book's summary to the next heading, with
 *  the footnotes and their marks left out and its double hyphens set as dashes. */
function gutenbergBooks(content: string): Map<string, string[]> {
  const text = content.replace(/\r\n/g, '\n');
  const blocks = text
    .slice(text.indexOf('*** START OF'), text.indexOf('*** END OF'))
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const books = new Map<string, string[]>();
  const summarized = new Set<string>();
  let book: string | null = null;
  for (const block of blocks) {
    const heading = block.length < 60 && /^[A-Z][A-Z .,'-]*$/.test(block) ? block : null;
    if (heading) {
      const summary = /^SUMMARY OF BOOK ([IVXL]+)$/.exec(heading);
      const opening = /^BOOK ([IVXL]+)$/.exec(heading);
      if (summary) summarized.add(summary[1]);
      book = opening && summarized.has(opening[1]) ? String(romanValue(opening[1])) : null;
      continue;
    }
    if (!book || block.startsWith('[Footnote')) continue;
    const paragraph = normalizeWhitespace(block.replace(/\[\d+\]/g, '').replace(/--/g, '—'));
    books.set(book, [...(books.get(book) ?? []), paragraph]);
  }
  return books;
}

/** The pinned copy a translation takes its line numbers from. */
function anchorsOf(entry: CorpusEntry): { entry: CorpusEntry; content: string } {
  const anchors = loadManifest().entries.find((candidate) => candidate.id === entry.anchors);
  if (!anchors) throw new Error(`${entry.id}: its anchors entry ${entry.anchors ?? '(none)'} is not pinned`);
  const path = join(RAW_DIR, anchors.file);
  if (!existsSync(path)) throw new Error(`${entry.id}: ${anchors.file} is missing — run pnpm corpus:sync`);
  const bytes = readFileSync(path);
  if (sha256(bytes) !== anchors.sha256) throw new Error(`${entry.id}: ${anchors.file} does not match its pin — run pnpm corpus:sync`);
  return { entry: anchors, content: decode(anchors, bytes) };
}

interface Token { word: string; para: number; offset: number }

const WORD = /[A-Za-z]+/g;
const wordsOf = (text: string) => (text.match(WORD) ?? []).map((word) => word.toLowerCase());

/** Where a paragraph opens: its first five words, or five a few words in, since
 *  the anchoring copy respells some names ("Oiagrus" for Seaton's "Oeagrus"). */
function findOpening(words: string[], opening: string[], from: number): number | null {
  for (let skip = 0; skip < 9; skip++) {
    const gram = opening.slice(skip, skip + 5);
    if (gram.length < 5) return null;
    for (let at = from + skip; at + 5 <= words.length; at++) {
      if (gram.every((word, k) => words[at + k] === word)) return at - skip;
    }
  }
  return null;
}

/** A cut backs up over the quotation mark a speech opens with. */
function openingAt(text: string, offset: number): number {
  let at = offset;
  while (at > 0 && /["'“‘(\[]/.test(text[at - 1])) at--;
  return at;
}

/** The text from one token to the next one's paragraph opening, as paragraphs. */
function cut(paras: string[], from: Token, to: Token | undefined): string[] {
  const startOffset = openingAt(paras[from.para], from.offset);
  const endPara = to ? to.para : paras.length - 1;
  const endOffset = to ? openingAt(paras[to.para], to.offset) : paras[endPara].length;
  const pieces: string[] = [];
  for (let para = from.para; para <= endPara; para++) {
    const text = paras[para];
    const piece = text.slice(para === from.para ? startOffset : 0, para === endPara ? endOffset : text.length).trim();
    if (piece) pieces.push(piece);
  }
  return pieces;
}

export interface AnchoredText {
  /** book.line, the original line the text opens at */
  citation: string;
  paras: string[];
}

/** Seaton's English was printed without line numbers (the Loeb set them beside
 *  the Greek only), so it takes them from the anchors entry, another copy of the
 *  same translation: each of its paragraphs is found in these words, and the text
 *  is cut where it opens (docs/LIBRARY_PLAN.md §4.4). The anchors are facts about
 *  where a paragraph starts; the words are this copy's. A book whose opening is
 *  not an anchor, an anchor that opens nowhere, or a piece that runs a tenth
 *  longer or shorter than the paragraph it matches fails the reading. */
export function anchoredText(entry: CorpusEntry, content: string): AnchoredText[] {
  const anchors = anchorsOf(entry);
  const paragraphsByBook = new Map<string, { citation: string; words: string[] }[]>();
  for (const { citation, text } of toposTextParagraphs(anchors.entry, anchors.content)) {
    const book = citation.split('.')[0];
    paragraphsByBook.set(book, [...(paragraphsByBook.get(book) ?? []), { citation, words: wordsOf(text) }]);
  }
  return [...gutenbergBooks(content)].flatMap(([book, paras]) => {
    const tokens: Token[] = paras.flatMap((text, para) =>
      [...text.matchAll(WORD)].map((match) => ({ word: match[0].toLowerCase(), para, offset: match.index ?? 0 })),
    );
    const words = tokens.map((token) => token.word);
    const paragraphs = paragraphsByBook.get(book) ?? [];
    const starts: number[] = [];
    for (const paragraph of paragraphs) {
      const start = findOpening(words, paragraph.words, (starts.at(-1) ?? -1) + 1);
      if (start === null) throw new Error(`${entry.id}: ${paragraph.citation} opens nowhere in book ${book}`);
      starts.push(start);
    }
    if (starts[0] !== 0) throw new Error(`${entry.id}: book ${book} opens before its first anchor`);
    return paragraphs.map((paragraph, index) => {
      const end = starts[index + 1] ?? tokens.length;
      const ratio = (end - starts[index]) / paragraph.words.length;
      if (ratio < 0.9 || ratio > 1.1) {
        throw new Error(`${entry.id}: ${paragraph.citation} runs ${end - starts[index]} words against ${paragraph.words.length}`);
      }
      return { citation: paragraph.citation, paras: cut(paras, tokens[starts[index]], tokens[end]) };
    });
  });
}

function normalizeGutenberg(entry: CorpusEntry, content: string): CorpusPassage[] {
  return anchoredText(entry, content).map(({ citation, paras }, index) => passage(entry, citation, paras.join(' '), index));
}

const sectionsSchema = z.object({
  note: z.string().min(1),
  /** The book the page holds. */
  book: z.string().regex(/^\d+$/),
  /** The page's typing slips, each set right to the printed edition's reading. */
  corrections: z.array(z.object({ at: z.string().min(1), from: z.string().min(1), to: z.string() })),
  /** book.chapter.section → the words it opens with. */
  sections: z.record(z.string().regex(/^\d+\.\d+\.\d+$/), z.string().min(1)),
});

function sectionsOf(entry: CorpusEntry): z.infer<typeof sectionsSchema> {
  if (!entry.sections) throw new Error(`${entry.id}: a ${entry.format} entry needs its sections file`);
  return sectionsSchema.parse(JSON.parse(readFileSync(join(SECTIONS_DIR, entry.sections), 'utf8')));
}

/** The Latin Library prints a book's chapters, each opening with its numeral
 *  ("XIV. OPHIUCHUS, qui …"), but not their sections. The entry's sections file
 *  sets the page's slips right, each found once, and names the words each later
 *  section opens with; a chapter's first section opens at the chapter, and what
 *  comes before the first chapter is the book's preface, `book.pr`. A chapter out
 *  of order, or an opening found nowhere or twice, fails the reading. */
function normalizeLatinLibrary(entry: CorpusEntry, content: string): CorpusPassage[] {
  const reading = sectionsOf(entry);
  const $ = load(content);
  let text = $('p')
    .get()
    .filter((element) => !$(element).is('.pagehead, .border'))
    .map((element) => normalizeWhitespace($(element).text()))
    .filter(Boolean)
    .join('\n');
  for (const { from, to } of reading.corrections) {
    const found = text.split(from).length - 1;
    if (found !== 1) throw new Error(`${entry.id}: the slip "${from}" is on the page ${found} times`);
    text = text.replace(from, to);
  }

  const preface: string[] = [];
  const chapters: string[][] = [];
  for (const paragraph of text.split('\n')) {
    const head = /^([IVXL]+)\.\s+/.exec(paragraph);
    if (head) {
      if (romanValue(head[1]) !== chapters.length + 1) throw new Error(`${entry.id}: chapter ${head[1]} follows chapter ${chapters.length}`);
      chapters.push([paragraph.slice(head[0].length)]);
      continue;
    }
    const chapter = chapters.at(-1);
    if (chapter) chapter.push(paragraph);
    else preface.push(paragraph);
  }

  const passages: CorpusPassage[] = [];
  const add = (citation: string, body: string) => passages.push(passage(entry, citation, body.trim(), passages.length));
  if (preface.length > 0) add(`${reading.book}.pr`, preface.join(' '));
  chapters.forEach((paragraphs, index) => {
    const chapter = `${reading.book}.${index + 1}`;
    const body = paragraphs.join(' ');
    const opens = Object.entries(reading.sections)
      .filter(([id]) => id.startsWith(`${chapter}.`))
      .sort(([a], [b]) => Number(a.split('.')[2]) - Number(b.split('.')[2]));
    let start = 0;
    let id = `${chapter}.1`;
    for (const [next, words] of opens) {
      const at = body.indexOf(words, start + 1);
      if (at < 0 || body.split(words).length !== 2) throw new Error(`${entry.id}: ${next} must open once in chapter ${index + 1}, after ${id}: "${words}"`);
      add(id, body.slice(start, at));
      [start, id] = [at, next];
    }
    add(id, body.slice(start));
  });
  const cut = new Set(passages.map(({ citation }) => citation));
  const lost = Object.keys(reading.sections).filter((id) => !cut.has(id));
  if (lost.length > 0) throw new Error(`${entry.id}: ${lost.join(', ')} open in no chapter of the page`);
  return passages;
}

export function normalizeEntry(entry: CorpusEntry, content: string): CorpusPassage[] {
  const passages =
    entry.format === 'perseus-tei'
      ? normalizeTei(entry, content)
      : entry.format === 'topostext-html'
        ? normalizeToposText(entry, content)
        : entry.format === 'latinlibrary-html'
          ? normalizeLatinLibrary(entry, content)
          : normalizeGutenberg(entry, content);
  if (passages.length === 0) throw new Error(`${entry.id}: no citation-bearing passages found`);
  return passages;
}
