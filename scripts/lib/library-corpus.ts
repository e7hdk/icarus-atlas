/** The pinned corpus read for the Library (docs/LIBRARY_PLAN.md §4.4): which
 *  edition sets a work's numbering, and how far each work runs. The research
 *  normalizer (./corpus.ts) is built for search and keeps some works as one
 *  passage per book; the Library reads lines and sections. */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';
import type { Element } from 'domhandler';
import type { LibraryWork, LibraryWorksFile, WorkExtent } from '../../src/types/library';
import { RAW_DIR, normalizeEntry, sha256, type CorpusEntry, type CorpusManifest } from './corpus';

export const LIBRARY_WORKS_PATH = join(import.meta.dirname, '..', '..', 'data', 'library', 'works.json');
export const LIBRARY_EXTENTS_PATH = join(import.meta.dirname, '..', '..', 'data', 'generated', 'library-extents.json');

/** The edition whose numbering the atlas cites: the original where the corpus has one. */
export function numberingEntry(work: LibraryWork, manifest: CorpusManifest): CorpusEntry {
  const id = work.original?.corpusId ?? work.translation.corpusId;
  const entry = manifest.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`${work.id}: corpus entry ${id} is not in research/corpus/manifest.json`);
  return entry;
}

/** Changes whenever an edition that sets a work's numbering changes. */
export function extentsSignature(registry: LibraryWorksFile, manifest: CorpusManifest): string {
  const pinned = registry.works
    .map((work) => {
      const entry = numberingEntry(work, manifest);
      return `${work.id}:${entry.id}:${entry.sha256}:${work.structure}`;
    })
    .sort();
  return sha256(pinned.join('\n'));
}

export function readRaw(entry: CorpusEntry): string {
  const path = join(RAW_DIR, entry.file);
  if (!existsSync(path)) throw new Error(`${entry.id}: ${entry.file} is missing — run pnpm corpus:sync`);
  return readFileSync(path, 'utf8');
}

type Run = { last: number; extra: string[] };

function runOf(numbers: string[]): Run {
  const plain = numbers.filter((n) => /^\d+$/.test(n)).map(Number);
  return { last: Math.max(0, ...plain), extra: numbers.filter((n) => /^\d+[a-z]+$/i.test(n)) };
}

/** Lines are numbered on `<l n>` in every verse edition of the corpus; books are
 *  `div[subtype=book]` (the Iliad spells it "Book"). */
function verseExtent(work: LibraryWork, content: string): WorkExtent {
  const $ = load(content, { xmlMode: true });
  const numbersIn = (scope: ReturnType<typeof $>) =>
    scope.find('l[n]').map((_, line) => $(line).attr('n') ?? '').get().filter(Boolean);
  if (work.structure === 'lines') return { lines: runOf(numbersIn($('body'))) };
  const books: Record<string, Run> = {};
  $('body div[type="textpart"]')
    .filter((_, div: Element) => /^book$/i.test($(div).attr('subtype') ?? ''))
    .each((_, div: Element) => {
      books[$(div).attr('n') ?? '?'] = runOf(numbersIn($(div)));
    });
  return { books };
}

/** Sections and tales are the ids the research normalizer already cuts the
 *  prose editions into (Perseus book.chapter.section, ToposText's paragraph ids). */
function idExtent(entry: CorpusEntry, content: string): WorkExtent {
  const ids = [...new Set(normalizeEntry(entry, content).map((passage) => passage.citation))];
  return { ids };
}

export function workExtent(work: LibraryWork, manifest: CorpusManifest): WorkExtent {
  const entry = numberingEntry(work, manifest);
  const content = readRaw(entry);
  const extent = work.structure === 'lines' || work.structure === 'books-of-lines' ? verseExtent(work, content) : idExtent(entry, content);
  // how long the work is, in the words of the edition that numbers it (the shelf's spines)
  const words = normalizeEntry(entry, content).reduce((sum, passage) => sum + passage.text.split(/\s+/).filter(Boolean).length, 0);
  return { ...extent, words };
}
