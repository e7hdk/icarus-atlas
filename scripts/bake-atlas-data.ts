/** Bakes what would otherwise repeat inside page payloads into plain files under
 *  public/atlas: the ⌘K index and the Ephemeris for every page, one file per door, and
 *  each star's prose on its own. Plain files are fetched once, and the host compresses
 *  and revalidates them, which `next start` does not do for a route handler. Chained
 *  into `dev`, `build` and `validate-data`.
 *
 *  Run with: pnpm bake-atlas-data   (writes gitignored public/atlas/) */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ATLAS_FILES, starFile } from '../src/features/atlas/files';
import { buildCharacterIndex, loadAtlasData, loadBakedLayout } from '../src/features/characters/load';
import type { StarProse, LinkedText } from '../src/features/galaxy/useStarProse';
import { loadCities, loadFeatures, loadLineage, loadPlaces, loadRegions } from '../src/features/geo/load';
import type { ProseSegment } from '../src/features/linking/parse-prose';
import { toSearchable } from '../src/features/search/match';
import { buildEphemerisData } from '../src/features/spotlight/build';
import { buildChronologyYears } from '../src/features/stories/chronology';
import { loadChronology, loadStories, loadStoryCrossings } from '../src/features/stories/load';
import { buildRiverLayout, toRiverScene } from '../src/features/stories/river';
import { toSkyCharacter, type SourcedText } from '../src/types/character';

const LINKED_PROSE = join('data', 'generated', 'linked-prose.json');

type LinkedProseFile = { characters: Record<string, { summary: ProseSegment[][]; story: ProseSegment[][] }> };

function write(url: string, value: unknown) {
  const file = join('public', url);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}

/** Segments only stand if they still spell the passage: a paragraph edited since the
 *  last `bake-linked-prose` falls back to plain text rather than to stale words. */
function linked(entries: SourcedText[], segments: ProseSegment[][] | undefined): LinkedText[] {
  return entries.map((entry, index) => {
    const known = segments?.[index];
    const current = known?.map((segment) => segment.text).join('') === entry.text;
    return { ...entry, segments: current && known ? known : [{ kind: 'plain', text: entry.text }] };
  });
}

async function main() {
  const [{ characters, relations }, bakedLayout, ephemeris, stories, crossings, chronology] = await Promise.all([
    loadAtlasData(),
    loadBakedLayout(),
    buildEphemerisData(),
    loadStories(),
    loadStoryCrossings(),
    loadChronology(),
  ]);
  const [regions, cities, places, features] = await Promise.all([
    loadRegions(),
    loadCities(),
    loadPlaces(),
    loadFeatures(),
  ]);
  const lineages = Object.fromEntries(
    await Promise.all(cities.map(async (city) => [city.id, await loadLineage(city.id)])),
  );
  const prose = (JSON.parse(readFileSync(LINKED_PROSE, 'utf-8')) as LinkedProseFile).characters;
  const river = toRiverScene(buildRiverLayout(stories, buildChronologyYears(stories, chronology), crossings));

  write(ATLAS_FILES.searchIndex, characters.map(toSearchable));
  write(ATLAS_FILES.ephemeris, ephemeris);
  write(ATLAS_FILES.galaxy, { characters: characters.map(toSkyCharacter), relations, bakedLayout });
  write(ATLAS_FILES.myths, { stories: stories.map((story) => ({ ...story, chapters: [] })), crossings, river });
  write(ATLAS_FILES.lands, {
    regions,
    cities,
    places,
    features,
    lineages,
    characterIndex: buildCharacterIndex(characters),
  });
  for (const character of characters) {
    const star: StarProse = {
      summary: linked(character.summary, prose[character.id]?.summary),
      story: linked(character.story, prose[character.id]?.story),
    };
    write(starFile(character.id), star);
  }
  // Files are overwritten in place, never cleared first, so a running dev server
  // never sees the folder empty; only a removed star's file goes.
  const starsDir = join('public', dirname(starFile('_')));
  const current = new Set(characters.map((character) => `${character.id}.json`));
  for (const file of readdirSync(starsDir)) {
    if (!current.has(file)) rmSync(join(starsDir, file));
  }
  console.log(`Baked the atlas data → public/atlas/ (${characters.length} stars, ${stories.length} stories)`);
}

main();
