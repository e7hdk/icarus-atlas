import { fold, matchIn } from './match';

/** The Library in ⌘K (docs/LIBRARY_PLAN.md §9): its works, its tellers and its
 *  quarrels by name, baked by `pnpm bake-atlas-data`; a typed citation ("Il. 5.370",
 *  "Met. 1") is read by the Library's own resolver in the overlay. */

export type LibrarySearchKind = 'door' | 'work' | 'teller' | 'quarrel' | 'passage';

export interface LibrarySearchEntry {
  kind: Exclude<LibrarySearchKind, 'passage'>;
  title: string;
  /** Other names it answers to: a Greek title, the registry's spellings, a topic. */
  also: string[];
  /** The line under the title: a teller and date, the tellers who quarrel. */
  detail: string;
  href: string;
}

export interface LibraryHit {
  kind: LibrarySearchKind;
  title: string;
  detail: string;
  href: string;
  /** The text the match was found in, with its [start, end), when it is not the title. */
  value: string;
  start: number;
  end: number;
}

/** A work or a door outranks a teller, which outranks one quarrel among many. */
const KIND_WEIGHT: Record<LibrarySearchEntry['kind'], number> = { door: 3, work: 3, teller: 2, quarrel: 1 };

export function searchLibrary(entries: LibrarySearchEntry[], rawQuery: string, limit = 5): LibraryHit[] {
  const query = fold(rawQuery.trim());
  if (!query) return [];
  const hits: (LibraryHit & { score: number })[] = [];
  for (const entry of entries) {
    let best: (LibraryHit & { score: number }) | null = null;
    for (const [value, weight] of [[entry.title, 2], ...entry.also.map((name) => [name, 1] as const)] as const) {
      const match = matchIn(value, query);
      if (!match) continue;
      const score = match.score + weight * 20 + KIND_WEIGHT[entry.kind] * 15;
      if (!best || score > best.score) best = { kind: entry.kind, title: entry.title, detail: entry.detail, href: entry.href, value, start: match.start, end: match.end, score };
    }
    if (best) hits.push(best);
  }
  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ kind, title, detail, href, value, start, end }) => ({ kind, title, detail, href, value, start, end }));
}
