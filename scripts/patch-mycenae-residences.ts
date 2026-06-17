/**
 * Backfill mycenae residence on Mycenaean figures in places.json → mycenae characterIds.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PATCHES: Record<string, { sources: string[] }> = {
  andromeda: { sources: ['apollodorus', 'ovid'] },
  'alcaeus-perseid': { sources: ['apollodorus'] },
  'mestor-perseid': { sources: ['apollodorus'] },
  licymnius: { sources: ['apollodorus', 'pausanias'] },
  amphitryon: { sources: ['apollodorus'] },
  alcmene: { sources: ['apollodorus'] },
  heracles: { sources: ['apollodorus', 'homer'] },
  thyestes: { sources: ['apollodorus', 'hyginus'] },
  aerope: { sources: ['apollodorus', 'hyginus'] },
  'tantalus-clytemnestra-husband': { sources: ['apollodorus'] },
  iphigenia: { sources: ['apollodorus', 'homer'] },
  electra: { sources: ['apollodorus', 'pausanias', 'hyginus'] },
  chrysothemis: { sources: ['homer', 'apollodorus'] },
  cassandra: { sources: ['apollodorus', 'hyginus', 'homer'] },
};

for (const [id, { sources }] of Object.entries(PATCHES)) {
  const path = join('data', 'characters', `${id}.json`);
  const char = JSON.parse(readFileSync(path, 'utf8')) as {
    residences?: { city: string; sources: string[] }[];
  };

  char.residences ??= [];
  const existing = char.residences.find((r) => r.city === 'mycenae');
  if (existing) {
    const merged = new Set([...existing.sources, ...sources]);
    existing.sources = [...merged].sort();
  } else {
    char.residences.unshift({ city: 'mycenae', sources: [...sources].sort() });
  }

  writeFileSync(path, JSON.stringify(char, null, 2) + '\n');
  console.log(`patched: ${id}`);
}

console.log('done');
