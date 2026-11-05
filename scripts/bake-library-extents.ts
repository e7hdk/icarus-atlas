/** Bakes how far each work of the Library runs — the last line of every book,
 *  the lettered lines, the section and tale ids — from the pinned corpus into
 *  data/generated/library-extents.json, so `pnpm validate-library` can check every
 *  citation's locus offline (docs/LIBRARY_PLAN.md §4.3, rule 3).
 *
 *  Needs the synced corpus (`pnpm corpus:sync`); rerun only when the manifest changes.
 *  Run with: pnpm bake-library-extents */

import { readFileSync, writeFileSync } from 'node:fs';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import type { LibraryExtents, WorkExtent, WorkId } from '../src/types/library';
import { loadManifest } from './lib/corpus';
import { LIBRARY_EXTENTS_PATH, LIBRARY_WORKS_PATH, extentsSignature, workExtent } from './lib/library-corpus';

const registry = libraryWorksFileSchema.parse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
const manifest = loadManifest();

const works = {} as Record<WorkId, WorkExtent>;
for (const work of registry.works) {
  const extent = workExtent(work, manifest);
  works[work.id] = extent;
  const size = extent.books
    ? `${Object.keys(extent.books).length} books, ${Object.values(extent.books).reduce((sum, book) => sum + book.last, 0)} lines`
    : extent.lines
      ? `${extent.lines.last} lines${extent.lines.extra.length ? ` (+${extent.lines.extra.length} lettered)` : ''}`
      : `${extent.ids?.length ?? 0} ids`;
  console.log(`  ${work.id.padEnd(22)} ${size}`);
}

const extents: LibraryExtents = { signature: extentsSignature(registry, manifest), works };
writeFileSync(LIBRARY_EXTENTS_PATH, `${JSON.stringify(extents)}\n`);
console.log(`\nWrote ${LIBRARY_EXTENTS_PATH.replace(/^.*?data\//, 'data/')}`);
