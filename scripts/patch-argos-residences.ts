/**
 * Backfill argos residence on Argive figures in places.json → argos characterIds.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PATCHES: Record<string, { sources: string[] }> = {
  phoroneus: { sources: ['pausanias', 'apollodorus', 'hyginus'] },
  inachus: { sources: ['apollodorus', 'pausanias', 'ovid'] },
  io: { sources: ['apollodorus', 'ovid'] },
  danaus: { sources: ['apollodorus', 'hyginus', 'pausanias'] },
  hypermnestra: { sources: ['apollodorus', 'hyginus', 'pausanias'] },
  lynceus: { sources: ['apollodorus'] },
  abas: { sources: ['apollodorus', 'pausanias'] },
  acrisius: { sources: ['apollodorus', 'hyginus', 'pausanias'] },
  proetus: { sources: ['apollodorus', 'pausanias'] },
  perseus: { sources: ['apollodorus', 'pausanias'] },
  'megapenthes-proetid': { sources: ['apollodorus', 'pausanias', 'hyginus'] },
  gorgophone: { sources: ['pausanias', 'apollodorus'] },
  'alcaeus-perseid': { sources: ['apollodorus'] },
  'sthenelus-perseid': { sources: ['homer', 'apollodorus'] },
  'mestor-perseid': { sources: ['apollodorus'] },
  melampus: { sources: ['homer', 'apollodorus'] },
  'bias-aeolid': { sources: ['apollodorus', 'homer'] },
  tydeus: { sources: ['homer', 'apollodorus', 'hyginus'] },
  diomedes: { sources: ['homer', 'apollodorus', 'pausanias'] },
  temenus: { sources: ['apollodorus', 'pausanias'] },
  hyrnetho: { sources: ['apollodorus', 'pausanias'] },
  deiphontes: { sources: ['apollodorus', 'pausanias'] },
  orestes: { sources: ['pausanias', 'apollodorus'] },
  tisamenus: { sources: ['pausanias', 'apollodorus'] },
};

for (const [id, { sources }] of Object.entries(PATCHES)) {
  const path = join('data', 'characters', `${id}.json`);
  const char = JSON.parse(readFileSync(path, 'utf8')) as {
    residences?: { city: string; sources: string[] }[];
  };

  char.residences ??= [];
  const existing = char.residences.find((r) => r.city === 'argos');
  if (existing) {
    const merged = new Set([...existing.sources, ...sources]);
    existing.sources = [...merged].sort();
  } else {
    char.residences.unshift({ city: 'argos', sources: [...sources].sort() });
  }

  writeFileSync(path, JSON.stringify(char, null, 2) + '\n');
  console.log(`patched: ${id}`);
}

console.log('done');
