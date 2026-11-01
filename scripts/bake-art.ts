/** Derive the Loom's catalogue and write it to data/generated/art-catalogue.json
 *  (docs/LOOM_PLAN.md §4). Offline: it reads the culture shelves, the committed
 *  Commons metadata and data/art/overrides.json. A content signature skips an
 *  unchanged bake. Run via `pnpm bake-art` (also chained into `pnpm dev` and
 *  `pnpm build`). */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogue, CATALOGUE_VERSION } from '../src/features/art/catalogue';
import type { Character, Relation } from '../src/types/character';
import type { Story } from '../src/types/story';
import { ART_CATALOGUE_PATH, readArtCommons, readArtOverrides, readShelfEntries } from './lib/art-sources';

const DATA = join(import.meta.dirname, '..', 'data');
const readDir = <T>(dir: string): T[] =>
  readdirSync(join(DATA, dir))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(DATA, dir, file), 'utf-8')) as T);

const entries = readShelfEntries();
const commons = readArtCommons().files;
const overrides = readArtOverrides();
const stories = readDir<Story>('stories');
const characters = readDir<Character>('characters');
const relations = JSON.parse(readFileSync(join(DATA, 'relations.json'), 'utf-8')) as Relation[];

const signature = createHash('sha1')
  .update(
    JSON.stringify({
      version: CATALOGUE_VERSION,
      entries,
      commons,
      overrides,
      stories: stories.map((story) => [story.id, story.parent, story.cast.map((member) => member.id)]),
      characters: characters.map((c) => [c.id, c.name, c.romanName, c.type]),
      relations: relations.map((relation) => [relation.from, relation.to]),
    }),
  )
  .digest('hex');

if (existsSync(ART_CATALOGUE_PATH) && !process.argv.includes('--force')) {
  try {
    const previous = JSON.parse(readFileSync(ART_CATALOGUE_PATH, 'utf-8')) as { signature?: string; count?: number };
    if (previous.signature === signature) {
      console.log(`Art catalogue already baked & current (${previous.count} works) — skipping.`);
      process.exit(0);
    }
  } catch {
    // fall through and rebake
  }
}

const started = performance.now();
const { works, captions, held } = buildCatalogue({ entries, stories, characters, relations, commons, overrides });

// One work per line, so a culture batch diffs as the works it touched.
const lines = works.map((work) => JSON.stringify(work));
writeFileSync(
  ART_CATALOGUE_PATH,
  `{"signature":${JSON.stringify(signature)},"count":${works.length},"works":[\n${lines.join(',\n')}\n],"captions":${JSON.stringify(captions)}}\n`,
);
console.log(
  `Baked ${works.length} works in ${Math.round(performance.now() - started)}ms → data/generated/art-catalogue.json`,
);
if (held.length) {
  console.log(`⚠ ${held.length} held back (validate-data gates these):`);
  held.forEach((work) => console.log(`  ${work.title} — ${work.reason}`));
}
