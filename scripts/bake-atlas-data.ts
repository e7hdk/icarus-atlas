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
import { libraryMarginData } from '../src/features/library/margin-files';
import { LIBRARY_REGISTRY, workHref } from '../src/features/library/links';
import { TELLER_ORDER, quarrelHref, shortTeller } from '../src/features/library/paths';
import type { LibrarySearchEntry } from '../src/features/search/library-match';
import type { Source } from '../src/types/character';
import type { QuarrelsFile } from '../src/types/quarrel';

const LINKED_PROSE = join('data', 'generated', 'linked-prose.json');
const ART_CATALOGUE = join('data', 'generated', 'art-catalogue.json');

/** How many works on the Loom tell each story, for the Spindle's way onto it. */
function loomStoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  try {
    const { works } = JSON.parse(readFileSync(ART_CATALOGUE, 'utf-8')) as { works: { stories: string[] }[] };
    for (const work of works) for (const story of work.stories) counts[story] = (counts[story] ?? 0) + 1;
  } catch {
    // Before the first art bake there is no Loom to count.
  }
  return counts;
}

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

/** The Library in ⌘K: its doors, works, tellers and quarrels by name. */
function librarySearchEntries(sources: Source[]): LibrarySearchEntry[] {
  const name = (id: string) => shortTeller(sources.find((source) => source.id === id)?.name ?? id);
  const { quarrels } = JSON.parse(readFileSync(join('data', 'quarrels.json'), 'utf8')) as QuarrelsFile;
  return [
    { kind: 'door', title: 'The Library', also: ['Library', 'Bibliotheke', 'texts'], detail: 'The seven tellers, in the original and in English', href: '/library' },
    { kind: 'door', title: 'The Quarrels', also: ['Quarrels', 'disputes', 'contradictions'], detail: `Where the tellers disagree: ${quarrels.length} quarrels`, href: '/library/quarrels' },
    ...LIBRARY_REGISTRY.works.map((work): LibrarySearchEntry => ({
      kind: 'work',
      title: work.title,
      also: [work.greekTitle ?? '', ...work.aliases].filter(Boolean),
      detail: `${name(work.author)} · ${work.composed.label}`,
      href: workHref(work),
    })),
    ...TELLER_ORDER.map((id): LibrarySearchEntry => {
      const source = sources.find((candidate) => candidate.id === id);
      return { kind: 'teller', title: name(id), also: source && source.name !== name(id) ? [source.name] : [], detail: `A teller · ${source?.period ?? ''}`, href: `/library/${id}` };
    }),
    ...quarrels.map((quarrel): LibrarySearchEntry => ({
      kind: 'quarrel',
      title: quarrel.title,
      also: [],
      detail: [...new Set(quarrel.claims.flatMap((claim) => claim.sources))].map(name).join(' · '),
      href: quarrelHref(quarrel.topic),
    })),
  ];
}

async function main() {
  const [{ characters, relations, sources }, bakedLayout, ephemeris, stories, crossings, chronology] = await Promise.all([
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
  write(ATLAS_FILES.librarySearch, librarySearchEntries(sources));
  write(ATLAS_FILES.ephemeris, ephemeris);
  write(ATLAS_FILES.galaxy, { characters: characters.map(toSkyCharacter), relations, bakedLayout });
  write(ATLAS_FILES.myths, {
    stories: stories.map((story) => ({ ...story, chapters: [] })),
    crossings,
    river,
    loom: loomStoryCounts(),
  });
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
  // The Library's margins: per reading page an index and its notes in chunks,
  // written in place like the stars; then whatever no page has any more goes.
  const { files: margins } = await libraryMarginData();
  const marginsDir = join('public', 'atlas', 'library');
  for (const [path, file] of margins) write(`/atlas/library/${path}`, file);
  for (const work of readdirSync(marginsDir, { withFileTypes: true })) {
    if (!work.isDirectory()) {
      rmSync(join(marginsDir, work.name));
      continue;
    }
    for (const name of readdirSync(join(marginsDir, work.name))) {
      if (!margins.has(`${work.name}/${name}`)) rmSync(join(marginsDir, work.name, name), { recursive: true });
    }
  }
  const marginPages = [...margins.keys()].filter((path) => !/-\d+\.json$/.test(path)).length;

  console.log(`Baked the atlas data → public/atlas/ (${characters.length} stars, ${stories.length} stories, ${marginPages} Library margins in ${margins.size - marginPages} chunks)`);
}

main();
