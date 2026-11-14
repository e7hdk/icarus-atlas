import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { LIBRARY_REGISTRY } from './links';
import type { LibraryText, LibraryWork, WorkId } from '@/types/library';

/** The Library's baked texts, read at build time only (docs/LIBRARY_PLAN.md §4.8):
 *  a reading page renders its text on the server, so the words are in the HTML and
 *  never travel as a prop. 14 MB in all, one file per work. */

const TEXTS_DIR = join(process.cwd(), 'data', 'generated', 'library');
const cache = new Map<WorkId, Promise<LibraryText>>();

export function loadLibraryText(id: WorkId): Promise<LibraryText> {
  const cached = cache.get(id);
  if (cached) return cached;
  const text = readFile(join(TEXTS_DIR, `${id}.json`), 'utf8').then((raw) => JSON.parse(raw) as LibraryText);
  cache.set(id, text);
  return text;
}

/** Every work's address, for generateStaticParams. */
export function libraryWorks(): LibraryWork[] {
  return LIBRARY_REGISTRY.works;
}

export function findLibraryWork(author: string, work: string): LibraryWork | null {
  return LIBRARY_REGISTRY.works.find((candidate) => candidate.author === author && candidate.id === work) ?? null;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV'];
export const romanBook = (unit: string) => ROMAN[Number(unit)] ?? unit;
