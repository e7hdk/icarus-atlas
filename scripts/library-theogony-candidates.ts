/** Proposes the beats of First, Chaos from the data (docs/LIBRARY_PLAN.md §8): every
 *  figure a Hesiod-sourced fact ties to the Theogony, at its narrowest cited
 *  stretch. A list for an eye — the beats in data/library/readings/theogony.json
 *  are authored, because a first-line rule misplaces figures whose facts cite
 *  several stretches (Aphrodite carries one for Eros at 116–122).
 *  Run with: pnpm library:theogony-candidates [--all] */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCitationResolver } from '../src/features/library/cite';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import { LIBRARY_WORKS_PATH } from './lib/library-corpus';
import { READING_PATH, beatLines, theogonyStretches, type Reading } from './lib/library-readings';

const DATA = join(import.meta.dirname, '..', 'data');
const registry = libraryWorksFileSchema.parse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
const resolver = createCitationResolver(registry);
const reading = JSON.parse(readFileSync(READING_PATH, 'utf8')) as Reading;
const beatOf = (line: number) => reading.beats.find((beat) => {
  const [from, to] = beatLines(beat);
  return line >= from && line <= to;
});
const litIn = new Map(reading.beats.flatMap((beat) => beat.ignite.map((id) => [id, beat] as const)));

const unlit: string[] = [];
const elsewhere: string[] = [];
const lines = new Set<number>();
let tied = 0;
for (const name of readdirSync(join(DATA, 'characters')).sort()) {
  const character = JSON.parse(readFileSync(join(DATA, 'characters', name), 'utf8'));
  const stretches = theogonyStretches(character, resolver);
  if (stretches.length === 0) continue;
  tied += 1;
  for (const [start, end] of stretches) for (let line = start; line <= end; line++) lines.add(line);
  const [start, end] = [...stretches].sort((a, b) => a[1] - a[0] - (b[1] - b[0]) || a[0] - b[0])[0];
  const proposed = beatOf(start);
  const authored = litIn.get(character.id);
  if (!authored) unlit.push(`${character.id} — narrowest at ${start}–${end}, in "${proposed?.title ?? '?'}"`);
  else if (proposed && authored !== proposed) elsewhere.push(`${character.id} — lit in "${authored.title}", narrowest at ${start}–${end} ("${proposed.title}")`);
}

const all = process.argv.includes('--all');
const show = (list: string[]) => (all ? list : list.slice(0, 30));
console.log(`${tied} figures are tied to the Theogony by a fact Hesiod tells, citing ${lines.size} of its lines; ${litIn.size} are lit in ${reading.beats.length} beats.`);
console.log(`\n${unlit.length} tied but not lit:`);
for (const line of show(unlit)) console.log(`  ${line}`);
console.log(`\n${elsewhere.length} lit in another beat than their narrowest citation (often by design):`);
for (const line of show(elsewhere)) console.log(`  ${line}`);
