/** The Library's texts, read from the pinned corpus and aligned (docs/LIBRARY_PLAN.md §4.4).
 *
 *  Verse: the original line by line; the English by Perseus card. A card opens at
 *  the original line it translates from — a `div[subtype=card]` in Homer and Ovid,
 *  an `<l n>` chunk in Hesiod, a paragraph of Seaton's Argonautica cut where its
 *  anchor opens — so a block holds an English card and the original lines from
 *  its line to the next card's. Prose: section beside section.
 *
 *  The licence gate (`display`): a work shown as `excerpt` contributes its original
 *  only or, with no original (the Fabulae), only its passage ids and a link out. */

import { load, type CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import type { LibraryBlock, LibraryText, LibraryUnit, LibraryWork } from '../../src/types/library';
import { anchoredText, normalizeEntry, sha256, toposTextParagraphs, type CorpusEntry, type CorpusManifest } from './corpus';
import { readRaw } from './library-corpus';

/** Bump when the reading of the corpus changes, so the baked texts rebake. */
const PARSER_VERSION = 2;

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

function verseBlocks(lines: [string, string][], chunks: Chunk[]): LibraryBlock[] {
  const sorted = [...chunks].filter((chunk) => Number.isFinite(chunk.start)).sort((a, b) => a.start - b.start);
  const blocks: LibraryBlock[] = [];
  const before = sorted.length ? lines.filter(([n]) => lineNumber(n) < sorted[0].start) : lines;
  if (before.length) blocks.push({ from: before[0][0], to: before.at(-1)?.[0] ?? before[0][0], orig: before, trans: [] });
  sorted.forEach((chunk, index) => {
    const end = sorted[index + 1] ? sorted[index + 1].start - 1 : Infinity;
    const mine = lines.filter(([n]) => lineNumber(n) >= chunk.start && lineNumber(n) <= end);
    const from = mine[0]?.[0] ?? String(chunk.start);
    const to = mine.at(-1)?.[0] ?? from;
    blocks.push({ from, to, orig: mine, trans: chunk.paras, ...(chunk.link ? { link: chunk.link } : {}) });
  });
  return blocks;
}

function verseText(work: LibraryWork, manifest: CorpusManifest): LibraryUnit[] {
  const original = entryFor(work.original?.corpusId, manifest);
  if (!original) throw new Error(`${work.id}: verse without an original`);
  const translation = entryFor(work.translation.corpusId, manifest);
  const books = originalLines(work, readRaw(original));
  const chunks = translation ? translationChunks(work, translation, readRaw(translation)) : new Map<string, Chunk[]>();
  const keepEnglish = work.display === 'full';
  return [...books].map(([id, lines]) => ({
    id,
    blocks: verseBlocks(lines, (chunks.get(id) ?? []).map((chunk) => (keepEnglish ? chunk : { ...chunk, paras: [] }))),
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

export function textSignature(work: LibraryWork, manifest: CorpusManifest): string {
  const pinned = [work.original?.corpusId, work.translation.corpusId]
    .map((id) => entryFor(id, manifest))
    .filter((entry): entry is CorpusEntry => entry !== null)
    .map((entry) => `${entry.id}:${entry.sha256}`);
  return sha256([`v${PARSER_VERSION}`, work.id, work.structure, work.units, work.display, ...pinned].join('\n'));
}

export function bakeText(work: LibraryWork, manifest: CorpusManifest): LibraryText {
  const verse = work.structure === 'books-of-lines' || work.structure === 'lines';
  return { work: work.id, signature: textSignature(work, manifest), verse, units: verse ? verseText(work, manifest) : proseText(work, manifest) };
}

/** The characters a unit carries, the budget the gate holds it to. */
export function unitSize(unit: LibraryUnit): number {
  return unit.blocks.reduce((sum, block) => sum + (typeof block.orig === 'string' ? block.orig.length : block.orig.reduce((lines, [, text]) => lines + text.length, 0)) + block.trans.reduce((paras, para) => paras + para.length, 0), 0);
}
