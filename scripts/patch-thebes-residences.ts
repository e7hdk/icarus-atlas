/**
 * Backfill thebes residence on Cadmean figures in places.json → thebes characterIds.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PATCHES: Record<string, { sources: string[] }> = {
  sphinx: { sources: ['apollodorus', 'hyginus'] },
  'eurydice-thebes': { sources: ['apollodorus', 'hyginus'] },
  dionysus: { sources: ['apollodorus', 'hesiod'] },
  learchus: { sources: ['apollodorus'] },
  melicertes: { sources: ['apollodorus'] },
};

for (const [id, { sources }] of Object.entries(PATCHES)) {
  const path = join('data', 'characters', `${id}.json`);
  const char = JSON.parse(readFileSync(path, 'utf8')) as {
    residences?: { city: string; sources: string[] }[];
  };

  char.residences ??= [];
  const existing = char.residences.find((r) => r.city === 'thebes');
  if (existing) {
    const merged = new Set([...existing.sources, ...sources]);
    existing.sources = [...merged].sort();
  } else {
    char.residences.unshift({ city: 'thebes', sources: [...sources].sort() });
  }

  writeFileSync(path, JSON.stringify(char, null, 2) + '\n');
  console.log(`patched: ${id}`);
}

console.log('done');
