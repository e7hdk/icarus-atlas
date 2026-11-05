/** First, Chaos (docs/LIBRARY_PLAN.md §8): where the data ties a figure to the
 *  Theogony. One rule for the gate in `validate-library` and the proposals of
 *  `pnpm library:theogony-candidates`: a fact Hesiod tells, citing Theogony lines.
 *  A fact that opens on telling the figure apart ("Not to be confused with
 *  Steropes the Cyclops", Theog. 140) is no tie to the poem; one that only adds
 *  such a clause at its end (the river Ladon, Theog. 344) is. */

import { join } from 'node:path';
import type { createCitationResolver } from '../../src/features/library/cite';

export const READING_PATH = join(import.meta.dirname, '..', '..', 'data', 'library', 'readings', 'theogony.json');

export interface Beat {
  /** "116-122" */
  lines: string;
  title: string;
  ignite: string[];
}

export interface Reading {
  work: 'theogony';
  beats: Beat[];
}

interface Fact {
  text: string;
  sources: string[];
  citation?: string;
}

export const beatLines = (beat: Beat): [number, number] => beat.lines.split('-').map(Number) as [number, number];

const TELLS_APART = /not to be confused|distinct from|not the same/i;

/** The stretches of the Theogony that Hesiod-sourced facts about a figure cite. */
export function theogonyStretches(character: { summary: Fact[]; story: Fact[] }, resolver: ReturnType<typeof createCitationResolver>): [number, number][] {
  const stretches: [number, number][] = [];
  for (const fact of [...character.summary, ...character.story]) {
    if (!fact.citation || !fact.sources.includes('hesiod') || TELLS_APART.test(fact.text.slice(0, 80))) continue;
    for (const ref of resolver.resolve(fact.citation, { sources: fact.sources as never })) {
      if (ref.kind !== 'passage' || ref.work !== 'theogony' || ref.from.kind !== 'line') continue;
      const start = Number.parseInt(ref.from.line, 10);
      const end = ref.to.kind === 'line' ? Number.parseInt(ref.to.line, 10) : start;
      stretches.push([start, end]);
    }
  }
  return stretches;
}
