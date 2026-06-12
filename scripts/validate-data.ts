/** Validates all JSON files under data/ against the zod schemas and checks
 *  referential integrity. Run with: pnpm validate-data */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  characterSchema,
  cultureSchema,
  geoCitySchema,
  geoRegionSchema,
  lineageSchema,
  referenceSchema,
  relationSchema,
  sourceSchema,
  storySchema,
} from '../src/lib/schemas';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const CONTRADICTIONS_PATH = join(import.meta.dirname, '..', 'docs', 'CONTRADICTIONS.md');
const errors: string[] = [];
const info: string[] = [];

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
const citiesRaw = loadJson(join(DATA_DIR, 'geo', 'cities.json'));
if (Array.isArray(citiesRaw)) {
  for (const c of citiesRaw) {
    const parsed = geoCitySchema.safeParse(c);
    if (!parsed.success) {
      errors.push(`geo/cities.json: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
      continue;
    }
    if (cityIds.has(parsed.data.id)) errors.push(`geo/cities.json: duplicate id "${parsed.data.id}"`);
    cityIds.add(parsed.data.id);
    if (parsed.data.region !== null && !regionIds.has(parsed.data.region)) {
      errors.push(`geo/cities.json [${parsed.data.id}]: unknown region "${parsed.data.region}"`);
    }
  }
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
      if (reign.characterId && !charIds.has(reign.characterId)) {
        errors.push(`lineages/${file}: unknown characterId "${reign.characterId}"`);
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
      if (place.id && !cityIds.has(place.id)) {
        errors.push(`stories/${story.id}.json: place "${place.name}" points at unknown city "${place.id}"`);
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
  `Sources: ${sourceIds.size} · Characters: ${charIds.size} · Reference: ${referenceCount} · Culture: ${cultureCount} · Regions: ${regionIds.size} · Cities: ${cityIds.size} · Lineages: ${lineageCount} · Stories: ${storyCount} · Disputed topics: ${info.length}`,
);
for (const line of info) console.log(`  ⚖ ${line}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nAll data valid.');
