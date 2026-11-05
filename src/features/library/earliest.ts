import { createCitationResolver } from './cite';
import { LIBRARY_REGISTRY, libraryWork, passageLink } from './links';
import type { Character } from '@/types/character';
import type { CiteRef } from '@/types/library';

/** The earliest of our tellers to tell of a figure (docs/LIBRARY_PLAN.md §9): the
 *  oldest work among the passages its facts cite. It is the oldest of the seven,
 *  never the myth's origin; tellers whose dates overlap it are named with it, as
 *  Homer's and Hesiod's do. */

export interface EarliestTeller {
  teller: string;
  work: string;
  /** "c. 8th century BC" */
  date: string;
  /** The first passage of that work the figure's facts cite. */
  href: string;
  label: string;
}

type Passage = Extract<CiteRef, { kind: 'passage' }>;

const resolver = createCitationResolver(LIBRARY_REGISTRY);

export function earliestTellers(character: Pick<Character, 'summary' | 'story'>, tellerName: (id: string) => string): EarliestTeller[] {
  const cited: Passage[] = [];
  for (const fact of [...character.summary, ...character.story]) {
    if (!fact.citation) continue;
    for (const ref of resolver.resolve(fact.citation, { sources: fact.sources })) if (ref.kind === 'passage') cited.push(ref);
  }
  if (cited.length === 0) return [];
  const span = (ref: Passage) => libraryWork(ref.work).composed;
  const first = [...cited].sort((a, b) => span(a).from - span(b).from || span(a).to - span(b).to)[0];
  const { from, to } = span(first);
  // one entry per teller whose work overlaps the earliest's dates, the earliest first
  const seen = new Set<string>();
  return [first, ...cited]
    .filter((ref) => span(ref).from <= to && span(ref).to >= from)
    .flatMap((ref) => {
      const work = libraryWork(ref.work);
      if (seen.has(work.author)) return [];
      seen.add(work.author);
      const link = passageLink(ref);
      return [{ teller: tellerName(work.author), work: work.title, date: work.composed.label, href: link.href, label: link.label }];
    });
}
