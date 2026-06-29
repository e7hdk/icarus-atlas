/** Validates all JSON files under data/ against the zod schemas and checks
 *  referential integrity. Run with: pnpm validate-data */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  characterSchema,
  cultureSchema,
  geoCitySchema,
  geoFeatureSchema,
  geoPlaceSchema,
  geoRegionSchema,
  lineageSchema,
  referenceSchema,
  relationSchema,
  sourceSchema,
  storySchema,
  storyCrossingsSchema,
  chronologySchema,
} from '../src/lib/schemas';
import { CREATURE_KINDS, NYMPH_KINDS } from '../src/types/character';
import { RIVER_ANCHORS, RIVER_SYNC_IDS } from './lib/river-geometry-recipes';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const CONTRADICTIONS_PATH = join(import.meta.dirname, '..', 'docs', 'CONTRADICTIONS.md');
/** Flagship city lineages — reign characterIds must carry matching residences. */
const FLAGSHIP_CITIES = new Set(['thebes', 'mycenae', 'argos', 'athens', 'sparta', 'troy']);
/** Lands map camera limits — docs/LANDS_PLAN.md §3.1. */
const MAP_BOUNDS = { west: -6, south: 22, east: 44, north: 47 };
/** Story place names that intentionally stay plain — sync with FORCE_PLAIN in scripts/wire-story-places.mjs */
function normStoryPlaceName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
const STORY_FORCE_PLAIN = new Set([
  normStoryPlaceName('Olympus'),
  normStoryPlaceName('Mount Olympus'),
  normStoryPlaceName('Parnassus'),
  normStoryPlaceName('Mount Parnassus'),
  normStoryPlaceName('Tartarus'),
  normStoryPlaceName('Hades'),
  normStoryPlaceName('Underworld'),
  normStoryPlaceName('Ocean'),
  normStoryPlaceName('Oceanus'),
  normStoryPlaceName('Elysium'),
  normStoryPlaceName('Elysian Fields'),
  normStoryPlaceName('Asphodel Meadows'),
  normStoryPlaceName('Styx'),
  normStoryPlaceName('Islands of the Blest'),
  normStoryPlaceName('The palace of the Sun'),
  normStoryPlaceName("The Gorgons' lair"),
  normStoryPlaceName('Ethiopia'),
  normStoryPlaceName('Rome'),
  normStoryPlaceName('Phoenicia'),
  normStoryPlaceName('Libya'),
  normStoryPlaceName('Babylon'),
  normStoryPlaceName('Panchaea'),
  normStoryPlaceName('India'),
  normStoryPlaceName('Arabia'),
  normStoryPlaceName('Scythia'),
  normStoryPlaceName('Thrace'),
  normStoryPlaceName('Thracian'),
  normStoryPlaceName('Caucasus'),
  normStoryPlaceName('Carthage'),
  normStoryPlaceName('Maeonia'),
  normStoryPlaceName('Paphlagonia'),
  normStoryPlaceName('Ciconia'),
  normStoryPlaceName('Cicones'),
  normStoryPlaceName('Aleian plain'),
  normStoryPlaceName('Phlegra'),
  normStoryPlaceName('Nysa'),
  normStoryPlaceName('Mount Ida'),
  normStoryPlaceName('Mount Pelion'),
  normStoryPlaceName('Mount Cithaeron'),
  normStoryPlaceName('Mount Oeta'),
  normStoryPlaceName('Mount Tmolus'),
  normStoryPlaceName('Mount Cyllene'),
  normStoryPlaceName('Mount Sipylus'),
  normStoryPlaceName('Mount Nysa'),
  normStoryPlaceName('Mount Etna'),
  normStoryPlaceName('Mount Dicte'),
  normStoryPlaceName('Mount Erymanthus'),
  normStoryPlaceName('Lake Tritonis'),
  normStoryPlaceName('Lake Pergus'),
  normStoryPlaceName('River Acis'),
  normStoryPlaceName('River Alpheus'),
  normStoryPlaceName('River Simois'),
  normStoryPlaceName('River Scamander'),
  normStoryPlaceName('River Spercheius'),
  normStoryPlaceName('River Eurotas'),
  normStoryPlaceName('River Asopus'),
  normStoryPlaceName('River Cephissus'),
  normStoryPlaceName('River Ilissus'),
  normStoryPlaceName('River Peneus'),
  normStoryPlaceName('River Strymon'),
  normStoryPlaceName('Scamander'),
  normStoryPlaceName('Simois'),
  normStoryPlaceName('Spercheius'),
  normStoryPlaceName('Straits of Messina'),
  normStoryPlaceName('Messina'),
  normStoryPlaceName('Malea'),
  normStoryPlaceName('Cape Malea'),
  normStoryPlaceName("Aeolus' isle"),
  normStoryPlaceName('The White Isle'),
  normStoryPlaceName('White Island'),
  normStoryPlaceName('Ismarus'),
  normStoryPlaceName('Zacynthus'),
  normStoryPlaceName('Olenus'),
  normStoryPlaceName("Ninus' tomb"),
  normStoryPlaceName('Enna'),
  normStoryPlaceName('Henna'),
  normStoryPlaceName("Hephaestus' forge"),
  normStoryPlaceName('Forge of Hephaestus'),
  normStoryPlaceName('Lemnos forge'),
]);
const errors: string[] = [];
const info: string[] = [];

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function coordsInBasin([lon, lat]: [number, number]): boolean {
  return lon >= MAP_BOUNDS.west && lon <= MAP_BOUNDS.east && lat >= MAP_BOUNDS.south && lat <= MAP_BOUNDS.north;
}

function loadJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    errors.push(`${path}: invalid JSON — ${(e as Error).message}`);
    return null;
  }
}

// 1. Sources
const sourcesRaw = loadJson(join(DATA_DIR, 'sources.json'));
const sourceIds = new Set<string>();
if (Array.isArray(sourcesRaw)) {
  for (const s of sourcesRaw) {
    const parsed = sourceSchema.safeParse(s);
    if (!parsed.success) {
      errors.push(`sources.json: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
    } else {
      sourceIds.add(parsed.data.id);
    }
  }
} else {
  errors.push('sources.json: expected a JSON array');
}

// 2. Characters
const charDir = join(DATA_DIR, 'characters');
const charIds = new Set<string>();
const charResidenceCities = new Map<string, Set<string>>();
const topics = new Map<string, string[]>();

if (existsSync(charDir)) {
  for (const file of readdirSync(charDir).filter((f) => f.endsWith('.json'))) {
    const raw = loadJson(join(charDir, file));
    if (raw === null) continue;
    const parsed = characterSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`characters/${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    const c = parsed.data;
    if (file !== `${c.id}.json`) errors.push(`characters/${file}: filename must match id "${c.id}"`);
    if (charIds.has(c.id)) errors.push(`characters/${file}: duplicate id "${c.id}"`);
    charIds.add(c.id);
    if (c.residences?.length) {
      charResidenceCities.set(c.id, new Set(c.residences.map((residence) => residence.city)));
    }
    if (c.kinds) {
      if (new Set(c.kinds).size !== c.kinds.length) {
        errors.push(`characters/${file}: duplicate entries in kinds`);
      }
      if (c.type === 'nymph' && !c.kinds.some((k) => (NYMPH_KINDS as readonly string[]).includes(k))) {
        errors.push(`characters/${file}: nymph kinds must include at least one nymph sub-class`);
      }
      if (c.type === 'creature' && !c.kinds.some((k) => (CREATURE_KINDS as readonly string[]).includes(k))) {
        errors.push(`characters/${file}: creature kinds must include at least one creature sub-class`);
      }
    }
    for (const t of [...c.summary, ...c.story]) {
      if (t.topic) topics.set(t.topic, [...(topics.get(t.topic) ?? []), `${c.id} (${t.sources.join(', ')})`]);
    }
  }
} else {
  errors.push('data/characters/ directory is missing');
}

// 3. Relations
const relationsRaw = loadJson(join(DATA_DIR, 'relations.json'));
if (Array.isArray(relationsRaw)) {
  const relIds = new Set<string>();
  for (const r of relationsRaw) {
    const parsed = relationSchema.safeParse(r);
    if (!parsed.success) {
      errors.push(`relations.json: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
      continue;
    }
    const rel = parsed.data;
    if (relIds.has(rel.id)) errors.push(`relations.json: duplicate id "${rel.id}"`);
    relIds.add(rel.id);
    for (const endpoint of [rel.from, rel.to]) {
      if (!charIds.has(endpoint)) errors.push(`relations.json [${rel.id}]: unknown character "${endpoint}"`);
    }
    if (rel.topic) topics.set(rel.topic, [...(topics.get(rel.topic) ?? []), `${rel.id} (${rel.sources.join(', ')})`]);
  }
} else {
  errors.push('relations.json: expected a JSON array');
}

// 4. Reference (Information tab) and culture (Legacy page) files: optional per
//    character, but when present they must validate and point at a real character.
let referenceCount = 0;
let cultureCount = 0;
for (const [dirName, schema] of [['reference', referenceSchema], ['culture', cultureSchema]] as const) {
  const dir = join(DATA_DIR, dirName);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    if (dirName === 'reference' && (file === 'theogony-roster.json' || file === 'water-nymph-roster.json')) continue;
    const raw = loadJson(join(dir, file));
    if (raw === null) continue;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`${dirName}/${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    if (file !== `${parsed.data.id}.json`) errors.push(`${dirName}/${file}: filename must match id "${parsed.data.id}"`);
    if (!charIds.has(parsed.data.id)) errors.push(`${dirName}/${file}: unknown character "${parsed.data.id}"`);
    if (dirName === 'reference') referenceCount++;
    else cultureCount++;
  }
}

// 5. Geo layer: regions, cities, lineages, residences — referential integrity.
const regionIds = new Set<string>();
const regionsRaw = loadJson(join(DATA_DIR, 'geo', 'regions.json'));
if (Array.isArray(regionsRaw)) {
  for (const r of regionsRaw) {
    const parsed = geoRegionSchema.safeParse(r);
    if (!parsed.success) {
      errors.push(`geo/regions.json: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
      continue;
    }
    if (regionIds.has(parsed.data.id)) errors.push(`geo/regions.json: duplicate id "${parsed.data.id}"`);
    regionIds.add(parsed.data.id);
  }
  for (const r of regionsRaw as { id?: string; parent?: string | null }[]) {
    if (r.parent && !regionIds.has(r.parent)) {
      errors.push(`geo/regions.json [${r.id}]: unknown parent region "${r.parent}"`);
    }
  }
}

const cityIds = new Set<string>();
const placeIds = new Set<string>();
const placesRaw = loadJson(join(DATA_DIR, 'geo', 'places.json'));
const parsedPlaces: z.infer<typeof geoPlaceSchema>[] = [];

if (Array.isArray(placesRaw)) {
  for (const p of placesRaw) {
    const parsed = geoPlaceSchema.safeParse(p);
    if (!parsed.success) {
      errors.push(`geo/places.json: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    if (placeIds.has(parsed.data.id)) errors.push(`geo/places.json: duplicate id "${parsed.data.id}"`);
    placeIds.add(parsed.data.id);
    parsedPlaces.push(parsed.data);
  }
} else {
  errors.push('geo/places.json: expected a JSON array');
}

for (const place of parsedPlaces) {
  if (place.region !== null && !regionIds.has(place.region)) {
    errors.push(`geo/places.json [${place.id}]: unknown region "${place.region}"`);
  }
  if (!coordsInBasin(place.coordinates)) {
    info.push(`geo/places.json [${place.id}]: coordinates outside §3.1 basin bounds`);
  }
  if (place.kind === 'city') {
    cityIds.add(place.cityId!);
  }
  for (const id of place.characterIds ?? []) {
    if (!charIds.has(id)) errors.push(`geo/places.json [${place.id}]: unknown characterId "${id}"`);
  }
  for (const id of place.deityIds ?? []) {
    if (!charIds.has(id)) errors.push(`geo/places.json [${place.id}]: unknown deityId "${id}"`);
  }
  if (place.cityId && place.cityId !== place.id && !placeIds.has(place.cityId)) {
    errors.push(`geo/places.json [${place.id}]: cityId "${place.cityId}" is not a place id`);
  }
  for (const t of [...place.summary, ...(place.story ?? [])]) {
    if (t.topic) topics.set(t.topic, [...(topics.get(t.topic) ?? []), `place:${place.id} (${t.sources.join(', ')})`]);
  }
}

// Homonym guard: same name + kind within 50 km triggers a review flag.
for (let i = 0; i < parsedPlaces.length; i++) {
  for (let j = i + 1; j < parsedPlaces.length; j++) {
    const a = parsedPlaces[i];
    const b = parsedPlaces[j];
    if (a.name === b.name && a.kind === b.kind && haversineKm(a.coordinates, b.coordinates) < 50) {
      info.push(
        `homonym review: "${a.name}" (${a.kind}) at ${a.id} and ${b.id} are within 50 km`,
      );
    }
  }
}

const featureIds = new Set<string>();
const featuresRaw = loadJson(join(DATA_DIR, 'geo', 'features.json'));
let featureCount = 0;
if (Array.isArray(featuresRaw)) {
  for (const f of featuresRaw) {
    const parsed = geoFeatureSchema.safeParse(f);
    if (!parsed.success) {
      errors.push(`geo/features.json: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    if (featureIds.has(parsed.data.id)) errors.push(`geo/features.json: duplicate id "${parsed.data.id}"`);
    featureIds.add(parsed.data.id);
    featureCount++;
    if (parsed.data.region !== null && !regionIds.has(parsed.data.region)) {
      errors.push(`geo/features.json [${parsed.data.id}]: unknown region "${parsed.data.region}"`);
    }
    if (parsed.data.characterId && !charIds.has(parsed.data.characterId)) {
      errors.push(`geo/features.json [${parsed.data.id}]: unknown characterId "${parsed.data.characterId}"`);
    }
    for (const id of parsed.data.placeIds ?? []) {
      if (!placeIds.has(id)) errors.push(`geo/features.json [${parsed.data.id}]: unknown placeId "${id}"`);
    }
    for (const t of parsed.data.summary) {
      if (t.topic) topics.set(t.topic, [...(topics.get(t.topic) ?? []), `feature:${parsed.data.id} (${t.sources.join(', ')})`]);
    }
    if (parsed.data.kind === 'river' || parsed.data.kind === 'strait') {
      if (!RIVER_SYNC_IDS.has(parsed.data.id)) {
        info.push(
          `geo/features.json [${parsed.data.id}]: no geometry sync recipe — extend sync-river-geometry.ts, then pnpm refresh:rivers`,
        );
      }
      if (!RIVER_ANCHORS[parsed.data.id] && !(parsed.data.placeIds?.length)) {
        info.push(`geo/features.json [${parsed.data.id}]: missing RIVER_ANCHORS (or placeIds anchor)`);
      }
    }
  }
} else {
  errors.push('geo/features.json: expected a JSON array');
}

/** DEPRECATED alias — must stay in sync with city entries in places.json (LANDS_PLAN §5.1). */
const citiesRaw = loadJson(join(DATA_DIR, 'geo', 'cities.json'));
if (Array.isArray(citiesRaw)) {
  for (const c of citiesRaw) {
    const parsed = geoCitySchema.safeParse(c);
    if (!parsed.success) {
      errors.push(`geo/cities.json: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
      continue;
    }
    const place = parsedPlaces.find((p) => p.kind === 'city' && p.cityId === parsed.data.id);
    if (!place) {
      errors.push(`geo/cities.json [${parsed.data.id}]: no matching city in places.json`);
      continue;
    }
    const fields = ['name', 'greekName', 'region', 'pleiadesId'] as const;
    for (const field of fields) {
      if (place[field] !== parsed.data[field]) {
        errors.push(`geo/cities.json [${parsed.data.id}]: ${field} out of sync with places.json`);
      }
    }
    if (
      place.coordinates[0] !== parsed.data.coordinates[0] ||
      place.coordinates[1] !== parsed.data.coordinates[1]
    ) {
      errors.push(`geo/cities.json [${parsed.data.id}]: coordinates out of sync with places.json`);
    }
  }
  for (const place of parsedPlaces.filter((p) => p.kind === 'city')) {
    const legacy = (citiesRaw as { id?: string }[]).find((c) => c.id === place.cityId);
    if (!legacy) errors.push(`geo/places.json [${place.id}]: missing deprecated cities.json entry`);
  }
} else {
  errors.push('geo/cities.json: expected a JSON array');
}

const lineageDir = join(DATA_DIR, 'lineages');
let lineageCount = 0;
if (existsSync(lineageDir)) {
  for (const file of readdirSync(lineageDir).filter((f) => f.endsWith('.json'))) {
    const raw = loadJson(join(lineageDir, file));
    if (raw === null) continue;
    const parsed = lineageSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`lineages/${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    if (file !== `${parsed.data.city}.json`) errors.push(`lineages/${file}: filename must match city "${parsed.data.city}"`);
    if (!cityIds.has(parsed.data.city)) errors.push(`lineages/${file}: unknown city "${parsed.data.city}"`);
    for (const reign of parsed.data.reigns) {
      const linkedIds = reign.characterIds?.length
        ? reign.characterIds
        : reign.characterId
          ? [reign.characterId]
          : [];
      for (const id of linkedIds) {
        if (!charIds.has(id)) {
          errors.push(`lineages/${file}: unknown characterId "${id}" (reign "${reign.ruler}")`);
        }
        if (
          FLAGSHIP_CITIES.has(parsed.data.city) &&
          !charResidenceCities.get(id)?.has(parsed.data.city)
        ) {
          errors.push(
            `lineages/${file}: reign "${reign.ruler}" (${id}) lacks residence in ${parsed.data.city}`,
          );
        }
      }
    }
    lineageCount++;
  }
}

if (existsSync(charDir)) {
  for (const file of readdirSync(charDir).filter((f) => f.endsWith('.json'))) {
    const raw = loadJson(join(charDir, file)) as { id?: string; residences?: { city: string }[] } | null;
    if (!raw?.residences) continue;
    for (const residence of raw.residences) {
      if (!cityIds.has(residence.city)) {
        errors.push(`characters/${file}: residence points at unknown city "${residence.city}"`);
      }
    }
  }
}

// 6. Stories: schema, parent nesting, cast/place references, story topics.
const storyDir = join(DATA_DIR, 'stories');
const storyIds = new Set<string>();
let storyCount = 0;
if (existsSync(storyDir)) {
  const parsedStories = [];
  for (const file of readdirSync(storyDir).filter((f) => f.endsWith('.json'))) {
    const raw = loadJson(join(storyDir, file));
    if (raw === null) continue;
    const parsed = storySchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`stories/${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
      continue;
    }
    if (file !== `${parsed.data.id}.json`) errors.push(`stories/${file}: filename must match id "${parsed.data.id}"`);
    if (storyIds.has(parsed.data.id)) errors.push(`stories/${file}: duplicate id "${parsed.data.id}"`);
    storyIds.add(parsed.data.id);
    parsedStories.push(parsed.data);
    storyCount++;
  }
  for (const story of parsedStories) {
    if (story.parent !== null && !storyIds.has(story.parent)) {
      errors.push(`stories/${story.id}.json: unknown parent story "${story.parent}"`);
    }
    for (const member of story.cast) {
      if (member.id && !charIds.has(member.id)) {
        errors.push(`stories/${story.id}.json: cast member "${member.name}" points at unknown character "${member.id}"`);
      }
    }
    for (const place of story.places) {
      if (place.id && !placeIds.has(place.id)) {
        errors.push(`stories/${story.id}.json: place "${place.name}" points at unknown place "${place.id}"`);
      }
      if (place.featureId && !featureIds.has(place.featureId)) {
        errors.push(`stories/${story.id}.json: place "${place.name}" points at unknown feature "${place.featureId}"`);
      }
    }
    for (const chapter of story.chapters) {
      if (chapter.topic) {
        topics.set(chapter.topic, [
          ...(topics.get(chapter.topic) ?? []),
          `story:${story.id} (${chapter.sources.join(', ')})`,
        ]);
      }
    }
  }

  const unwiredPlain: string[] = [];
  for (const story of parsedStories) {
    for (const place of story.places) {
      if (!place.id && !place.featureId && !STORY_FORCE_PLAIN.has(normStoryPlaceName(place.name))) {
        unwiredPlain.push(`${story.id}: "${place.name}"`);
      }
    }
  }
  if (unwiredPlain.length > 0) {
    info.push(`story places still plain (not in FORCE_PLAIN): ${unwiredPlain.join('; ')}`);
  }
}

// Resolve place → story links after stories are loaded.
for (const place of parsedPlaces) {
  for (const id of place.storyIds ?? []) {
    if (!storyIds.has(id)) errors.push(`geo/places.json [${place.id}]: unknown storyId "${id}"`);
  }
}

if (Array.isArray(featuresRaw)) {
  for (const f of featuresRaw) {
    const parsed = geoFeatureSchema.safeParse(f);
    if (!parsed.success) continue;
    for (const id of parsed.data.storyIds ?? []) {
      if (!storyIds.has(id)) {
        errors.push(`geo/features.json [${parsed.data.id}]: unknown storyId "${id}"`);
      }
    }
  }
}

// Optional saga artwork galleries (story pages).
let storyCultureCount = 0;
const storyCultureDir = join(DATA_DIR, 'story-culture');
if (existsSync(storyCultureDir)) {
  for (const file of readdirSync(storyCultureDir).filter((f) => f.endsWith('.json'))) {
    const raw = loadJson(join(storyCultureDir, file));
    if (raw === null) continue;
    const parsed = cultureSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(
        `story-culture/${file}: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      );
      continue;
    }
    if (file !== `${parsed.data.id}.json`) {
      errors.push(`story-culture/${file}: filename must match id "${parsed.data.id}"`);
    }
    if (!storyIds.has(parsed.data.id)) {
      errors.push(`story-culture/${file}: unknown story "${parsed.data.id}"`);
    }
    storyCultureCount++;
  }
}

// 6b. Story crossings: schema + referential integrity (both endpoints exist,
//     are distinct, and no pair is declared twice in either order).
let crossingCount = 0;
const crossingsPath = join(DATA_DIR, 'story-crossings.json');
if (existsSync(crossingsPath)) {
  const raw = loadJson(crossingsPath);
  const parsed = storyCrossingsSchema.safeParse(raw);
  if (!parsed.success) {
    errors.push(
      `story-crossings.json: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  } else {
    const seen = new Set<string>();
    for (const x of parsed.data) {
      if (!storyIds.has(x.a)) errors.push(`story-crossings.json: unknown story "${x.a}"`);
      if (!storyIds.has(x.b)) errors.push(`story-crossings.json: unknown story "${x.b}"`);
      if (x.a === x.b) errors.push(`story-crossings.json: crossing links "${x.a}" to itself`);
      const key = [x.a, x.b].sort().join('::');
      if (seen.has(key)) errors.push(`story-crossings.json: duplicate crossing ${x.a} ✕ ${x.b}`);
      seen.add(key);
    }
    crossingCount = parsed.data.length;
  }
}

// 6c. Chronology: schema, anchor → story references, declared chronographers.
//     (Chronographer date-disputes like the fall of Troy are deliberately kept
//     out of the literary-author dispute gate below — that gate is for the 7
//     source lenses, not the chronographers.)
let chronologyAnchorCount = 0;
const chronologyPath = join(DATA_DIR, 'chronology.json');
if (existsSync(chronologyPath)) {
  const raw = loadJson(chronologyPath);
  const parsed = chronologySchema.safeParse(raw);
  if (!parsed.success) {
    errors.push(
      `chronology.json: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  } else {
    const declared = new Set(parsed.data.chronographers.map((c) => c.id));
    const seenAnchors = new Set<string>();
    for (const anchor of parsed.data.anchors) {
      if (seenAnchors.has(anchor.id)) errors.push(`chronology.json: duplicate anchor id "${anchor.id}"`);
      seenAnchors.add(anchor.id);
      for (const sid of anchor.stories) {
        if (!storyIds.has(sid)) errors.push(`chronology.json [${anchor.id}]: unknown story "${sid}"`);
      }
      for (const d of anchor.dates) {
        if (!declared.has(d.source)) {
          errors.push(`chronology.json [${anchor.id}]: date source "${d.source}" not in chronographers list`);
        }
      }
    }
    chronologyAnchorCount = parsed.data.anchors.length;
  }
}

// 7. Every disputed topic must be documented before it can surface in the UI.
const contradictions = readFileSync(CONTRADICTIONS_PATH, 'utf-8');
const documentedTopics = new Set(
  [...contradictions.matchAll(/\*\*topic\*\*: `([^`]+)`/g)].map((match) => match[1]),
);

for (const [topic, entries] of topics) {
  if (entries.length > 1) {
    info.push(`disputed topic "${topic}": ${entries.join(' vs ')}`);
    if (!documentedTopics.has(topic)) {
      errors.push(`disputed topic "${topic}" is missing from docs/CONTRADICTIONS.md`);
    }
  }
}

console.log(
  `Sources: ${sourceIds.size} · Characters: ${charIds.size} · Reference: ${referenceCount} · Culture: ${cultureCount} · Story culture: ${storyCultureCount} · Regions: ${regionIds.size} · Places: ${placeIds.size} · Features: ${featureCount} · Cities: ${cityIds.size} · Lineages: ${lineageCount} · Stories: ${storyCount} · Crossings: ${crossingCount} · Chronology anchors: ${chronologyAnchorCount} · Disputed topics: ${info.length}`,
);
for (const line of info) console.log(`  ⚖ ${line}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nAll data valid.');
