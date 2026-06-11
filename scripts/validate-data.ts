/** Validates all JSON files under data/ against the zod schemas and checks
 *  referential integrity. Run with: pnpm validate-data */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { characterSchema, relationSchema, sourceSchema } from '../src/lib/schemas';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
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

// 4. Contradiction report (informational)
for (const [topic, entries] of topics) {
  if (entries.length > 1) info.push(`disputed topic "${topic}": ${entries.join(' vs ')}`);
}

console.log(`Sources: ${sourceIds.size} · Characters: ${charIds.size} · Disputed topics: ${info.length}`);
for (const line of info) console.log(`  ⚖ ${line}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\nAll data valid.');
