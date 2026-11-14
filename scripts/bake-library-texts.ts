/** Bakes the Library's texts — every work of the registry, aligned original and
 *  English, one reading page per book — from the pinned corpus into the committed
 *  data/generated/library/<work>.json (docs/LIBRARY_PLAN.md §4.1, §4.4). A work
 *  whose signature already matches is skipped; `--force` rebakes all.
 *
 *  Needs the synced corpus (`pnpm corpus:sync`); rerun only when the manifest or
 *  the reading of it changes. Run with: pnpm bake-library-texts */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import type { LibraryText } from '../src/types/library';
import { loadManifest } from './lib/corpus';
import { LIBRARY_WORKS_PATH } from './lib/library-corpus';
import { bakeText, textSignature, unitSize } from './lib/library-texts';

export const LIBRARY_TEXTS_DIR = join(import.meta.dirname, '..', 'data', 'generated', 'library');

const registry = libraryWorksFileSchema.parse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
const manifest = loadManifest();
const force = process.argv.includes('--force');
mkdirSync(LIBRARY_TEXTS_DIR, { recursive: true });

for (const work of registry.works) {
  const path = join(LIBRARY_TEXTS_DIR, `${work.id}.json`);
  if (!force && existsSync(path)) {
    const baked = JSON.parse(readFileSync(path, 'utf8')) as LibraryText;
    if (baked.signature === textSignature(work, manifest)) {
      console.log(`  ${work.id.padEnd(22)} current`);
      continue;
    }
  }
  const text = bakeText(work, manifest);
  // one block per line keeps a rebake's diff readable
  const body = text.units.map((unit) => `{"id":${JSON.stringify(unit.id)},"blocks":[\n${unit.blocks.map((block) => JSON.stringify(block)).join(',\n')}\n]}`).join(',\n');
  const languages = text.translations ? `"translations":${JSON.stringify(text.translations)},` : '';
  writeFileSync(path, `{"work":${JSON.stringify(text.work)},"signature":${JSON.stringify(text.signature)},"verse":${text.verse},${languages}"units":[\n${body}\n]}\n`);
  JSON.parse(readFileSync(path, 'utf8'));
  const largest = Math.max(...text.units.map(unitSize));
  console.log(`  ${work.id.padEnd(22)} ${text.units.length} page(s), ${text.units.reduce((sum, unit) => sum + unit.blocks.length, 0)} blocks, largest page ${Math.round(largest / 1024)} KB`);
}
