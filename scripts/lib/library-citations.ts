/** Every citation in data/, found and resolved (docs/LIBRARY_PLAN.md §4.3, §10).
 *  Shared by `pnpm validate-library` and `pnpm library:metrics`. */

import type { CitationResolver } from '../../src/features/library/cite';
import type { CitationSite } from '../../src/features/library/sites';
import { passageProblem } from '../../src/features/library/extents';
import type { CiteRef, LibraryExtents } from '../../src/types/library';

export { collectCitationSites, type CitationSite } from '../../src/features/library/sites';

export interface ResolvedRef {
  site: CitationSite;
  ref: Exclude<CiteRef, { kind: 'unresolved' }>;
}

export interface CitationFailure {
  site: CitationSite;
  text: string;
  reason: string;
}

export function resolveSites(sites: CitationSite[], resolver: CitationResolver, extents: LibraryExtents) {
  const resolved: ResolvedRef[] = [];
  const failures: CitationFailure[] = [];
  for (const site of sites) {
    for (const ref of resolver.resolve(site.raw, site.context)) {
      if (ref.kind === 'unresolved') {
        failures.push({ site, text: ref.text, reason: ref.reason });
        continue;
      }
      const problem = ref.kind === 'passage' ? passageProblem(ref, extents) : null;
      if (problem) {
        failures.push({ site, text: describeRef(ref), reason: problem });
        continue;
      }
      resolved.push({ site, ref });
    }
  }
  return { resolved, failures };
}

export function describeRef(ref: CiteRef): string {
  if (ref.kind !== 'passage') return ref.kind === 'external' ? ref.label : ref.kind === 'work' ? ref.work : ref.text;
  const place = (locus: Extract<CiteRef, { kind: 'passage' }>['from']) => {
    if (locus.kind === 'book') return `book ${locus.book}`;
    if (locus.kind === 'line') return locus.book === undefined ? locus.line : `${locus.book}.${locus.line}`;
    return locus.kind === 'section' ? locus.path : locus.tale;
  };
  const from = place(ref.from);
  const to = place(ref.to);
  return `${ref.work} ${from}${to === from ? '' : `–${to}`}`;
}

/** "line 1163 is past the end of book 10 (739 lines)" → "past the end": failures grouped for reading. */
export function reasonClass(reason: string): string {
  if (reason.startsWith('unknown work')) return 'unknown work';
  if (reason.includes('past the end')) return 'past the end of its book';
  if (reason.includes('does not exist') || reason.includes('is not in')) return 'no such passage';
  if (reason.includes('backwards')) return 'range runs backwards';
  if (reason === 'no work named') return 'no work named';
  return 'unreadable locus';
}
