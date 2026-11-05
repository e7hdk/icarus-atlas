import type { CiteRef, LibraryExtents, Locus, WorkExtent } from '@/types/library';

/** Does a resolved passage exist in the pinned edition? Pure, so the gate, the
 *  metrics and the UI read the same answer (docs/LIBRARY_PLAN.md §4.3, rule 3). */

type Passage = Extract<CiteRef, { kind: 'passage' }>;

const lineNumber = (line: string) => Number.parseInt(line, 10);

function lineProblem(line: string, run: { last: number; extra: string[] } | undefined, where: string): string | null {
  if (!run) return `${where} does not exist`;
  if (/^\d+$/.test(line)) return lineNumber(line) <= run.last && lineNumber(line) >= 1 ? null : `line ${line} is past the end of ${where} (${run.last} lines)`;
  return run.extra.includes(line) ? null : `line ${line} is not in ${where}`;
}

/** An edition may cut coarser than the numbering it keeps: ToposText's Astronomica
 *  2.21 runs 2.21.1, 2.21.4, 2.21.5, 2.21.6, so 2.21.3 lies inside the paragraph
 *  that 2.21.1 opens. A section between two the edition cuts exists; one past the
 *  last does not. */
function insideCutParagraph(id: string, ids: string[]): boolean {
  const cut = id.lastIndexOf('.');
  if (cut < 0) return false;
  const parent = id.slice(0, cut);
  const n = Number(id.slice(cut + 1));
  if (!Number.isFinite(n)) return false;
  const siblings = ids
    .filter((known) => known.lastIndexOf('.') === cut && known.startsWith(`${parent}.`))
    .map((known) => Number(known.slice(cut + 1)))
    .filter(Number.isFinite);
  return siblings.length > 0 && Math.min(...siblings) <= n && n <= Math.max(...siblings);
}

function idProblem(id: string, ids: string[] | undefined, what: string): string | null {
  if (!ids) return `no ${what}s are known`;
  if (ids.includes(id) || ids.some((known) => known.startsWith(`${id}.`))) return null;
  if (insideCutParagraph(id, ids)) return null;
  return `${what} ${id} does not exist`;
}

export function locusProblem(locus: Locus, extent: WorkExtent): string | null {
  if (locus.kind === 'book') return extent.books?.[String(locus.book)] ? null : `book ${locus.book} does not exist`;
  if (locus.kind === 'line' && locus.book !== undefined) return lineProblem(locus.line, extent.books?.[String(locus.book)], `book ${locus.book}`);
  if (locus.kind === 'line') return lineProblem(locus.line, extent.lines, 'the poem');
  if (locus.kind === 'section') return idProblem(locus.path, extent.ids, 'section');
  if (locus.tale === 'preface') return extent.ids?.some((id) => /^(?:p\.|0\.)/.test(id)) ? null : 'the preface is not in this edition';
  return idProblem(locus.tale, extent.ids, 'tale');
}

/** Numbers first, then the letter a lettered line carries: 929 < 929a < 930. */
export function compareIds(a: string, b: string): number {
  const left = a.split('.');
  const right = b.split('.');
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const delta = lineNumber(left[i]) - lineNumber(right[i]);
    if (delta !== 0) return delta;
    const letter = left[i].replace(/^\d+/, '').localeCompare(right[i].replace(/^\d+/, ''));
    if (letter !== 0) return letter;
  }
  return left.length - right.length;
}

function sortKey(locus: Locus): string {
  if (locus.kind === 'book') return `${locus.book}`;
  if (locus.kind === 'line') return locus.book === undefined ? locus.line : `${locus.book}.${locus.line}`;
  if (locus.kind === 'section') return locus.path;
  return locus.tale;
}

export function passageProblem(ref: Passage, extents: LibraryExtents): string | null {
  const extent = extents.works[ref.work];
  if (!extent) return `no extents for ${ref.work}: run pnpm bake-library-extents`;
  const problem = locusProblem(ref.from, extent) ?? locusProblem(ref.to, extent);
  if (problem) return problem;
  if (ref.from.kind === 'tale' && (ref.from.tale === 'preface' || ref.from.tale.startsWith('p.'))) return null;
  return compareIds(sortKey(ref.from), sortKey(ref.to)) > 0 ? 'the range runs backwards' : null;
}
