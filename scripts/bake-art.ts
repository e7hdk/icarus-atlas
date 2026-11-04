/** Derive the Loom's catalogue and write it to data/generated/art-catalogue.json
 *  (docs/LOOM_PLAN.md §4). Offline: it reads the culture shelves, the committed
 *  Commons metadata, data/art/overrides.json and the Patterns in data/art/patterns/.
 *  A content signature skips an unchanged bake. Run via `pnpm bake-art` (also
 *  chained into `pnpm dev` and `pnpm build`). */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogue, CATALOGUE_VERSION } from '../src/features/art/catalogue';
import { buildDoorData, buildDoorDetails, DOOR_VERSION, type AtlasManifest } from '../src/features/art/door';
import { LOOM_ENGINE_VERSION, LOOM_WIDTH } from '../src/features/art/loom';
import type { Character, Relation } from '../src/types/character';
import type { Story } from '../src/types/story';
import { ART_CATALOGUE_PATH, readArtCommons, readArtOverrides, readArtPatterns, readShelfEntries } from './lib/art-sources';

const DATA = join(import.meta.dirname, '..', 'data');
const readDir = <T>(dir: string): T[] =>
  readdirSync(join(DATA, dir))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(DATA, dir, file), 'utf-8')) as T);

const entries = readShelfEntries();
const commons = readArtCommons().files;
const overrides = readArtOverrides();
const patterns = readArtPatterns();
const sourceNames = Object.fromEntries(
  (JSON.parse(readFileSync(join(DATA, 'sources.json'), 'utf-8')) as { id: string; name: string }[]).map((source) => [
    source.id,
    source.name,
  ]),
);
const stories = readDir<Story>('stories');
const characters = readDir<Character>('characters');
const relations = JSON.parse(readFileSync(join(DATA, 'relations.json'), 'utf-8')) as Relation[];

const MANIFEST_PATH = join(import.meta.dirname, '..', 'public', 'art', 'manifest.json');
const DOOR_PATH = join(import.meta.dirname, '..', 'public', 'art', 'loom.json');
const DETAILS_PATH = join(import.meta.dirname, '..', 'public', 'art', 'details.json');
const manifest = existsSync(MANIFEST_PATH)
  ? (JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as AtlasManifest)
  : null;

const signature = createHash('sha1')
  .update(
    JSON.stringify({
      version: CATALOGUE_VERSION,
      door: DOOR_VERSION,
      // the weave itself, so a new width or engine rule rebakes the door's cloth
      loom: { widths: LOOM_WIDTH, engine: LOOM_ENGINE_VERSION },
      manifest,
      entries,
      commons,
      overrides,
      patterns,
      sourceNames,
      stories: stories.map((story) => [story.id, story.title, story.parent, story.cast.map((member) => member.id)]),
      characters: characters.map((c) => [c.id, c.name, c.romanName, c.type]),
      relations: relations.map((relation) => [relation.from, relation.to]),
    }),
  )
  .digest('hex');

if (existsSync(ART_CATALOGUE_PATH) && existsSync(DOOR_PATH) && !process.argv.includes('--force')) {
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
// The door shows only works the atlas holds: a culture batch waits for the next
// atlas bake, and the cloth never has a hole (LOOM_PLAN §6).
if (manifest) {
  writeFileSync(DOOR_PATH, JSON.stringify(buildDoorData(works, manifest, characters, stories, patterns, sourceNames)));
  writeFileSync(DETAILS_PATH, JSON.stringify(buildDoorDetails(works, captions, commons, characters, stories)));
  console.log('Wrote the door data → public/art/loom.json, public/art/details.json');
}
if (held.length) {
  console.log(`⚠ ${held.length} held back (validate-data gates these):`);
  held.forEach((work) => console.log(`  ${work.title} — ${work.reason}`));
}
