/** Validates the Library's citation spine. Run with: pnpm validate-library
 *
 * Contract (docs/LIBRARY_PLAN.md §4.2, §4.3, §10):
 *   the works registry parses; no alias names two works; every edition is pinned
 *     in the corpus manifest, belongs to the work's teller, and a translation is in
 *     the language the registry reads it as
 *   the baked extents were baked from the editions pinned now
 *   every citation in data/ resolves — to a passage that exists in the pinned
 *     edition, a whole work, an allowlisted external work, or, in the chronology,
 *     a note — and no range runs backwards
 *   the baked texts match the pinned editions, no reading page carries more than
 *     400 KB of text, and every cited passage lands on a page that exists
 *   the translators' names in aliases.json point at figures, in pinned editions
 *   no margin file weighs more than 30 KB gzipped, and every block with notes is
 *     in the chunk its page's index names (§4.8)
 *   First, Chaos: the beats run through the Theogony in order, and every figure
 *     lit in a beat has a fact Hesiod tells that cites lines inside it (§8)
 * `--all` lists every failure instead of the first 40.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createCitationResolver, foldWorkName } from '../src/features/library/cite';
import { libraryMarginData } from '../src/features/library/margin-files';
import { libraryWorksFileSchema } from '../src/lib/schemas';
import { libraryWork, unitOf } from '../src/features/library/links';
import { isOwnEdition, type LibraryExtents, type LibraryText, type OtherLanguage } from '../src/types/library';
import { loadManifest } from './lib/corpus';
import { collectCitationSites, reasonClass, resolveSites } from './lib/library-citations';
import { LIBRARY_EXTENTS_PATH, LIBRARY_WORKS_PATH, extentsSignature } from './lib/library-corpus';
import { readOwnTranslation, textSignature, unitSize } from './lib/library-texts';
import { READING_PATH, beatLines, theogonyStretches, type Reading } from './lib/library-readings';

const LIBRARY_TEXTS_DIR = join(import.meta.dirname, '..', 'data', 'generated', 'library');

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const SHOW = process.argv.includes('--all') ? Infinity : 40;
const errors: string[] = [];

/* 1. The registry. */
const parsed = libraryWorksFileSchema.safeParse(JSON.parse(readFileSync(LIBRARY_WORKS_PATH, 'utf8')));
if (!parsed.success) {
  console.error(`data/library/works.json: ${parsed.error.message}`);
  process.exit(1);
}
const registry = parsed.data;
const manifest = loadManifest();
const owners = new Map<string, string>();
for (const [owner, aliases] of [...registry.works.map((work) => [work.id, work.aliases] as const), ...registry.external.map((work) => [work.label, work.aliases] as const)]) {
  for (const alias of aliases) {
    const key = foldWorkName(alias);
    const previous = owners.get(key);
    if (previous && previous !== owner) errors.push(`works.json: the alias "${alias}" names both ${previous} and ${owner}`);
    owners.set(key, owner);
  }
}
for (const work of registry.works) {
  const editions = [
    { edition: work.original, language: null },
    { edition: work.translation, language: 'en' },
    ...Object.entries(work.translations ?? {}).map(([language, edition]) => ({ edition, language })),
  ];
  for (const { edition, language } of editions) {
    if (!edition) continue;
    if (isOwnEdition(edition)) {
      // the atlas's own: its file parses and renders this work in this language from its original
      try {
        readOwnTranslation(work, edition.file, language as OtherLanguage);
      } catch (error) {
        errors.push(`works.json: ${work.id}'s ${language} translation: ${(error as Error).message}`);
      }
      continue;
    }
    const entry = manifest.entries.find((candidate) => candidate.id === edition.corpusId);
    if (!entry) errors.push(`works.json: ${work.id} cites corpus entry ${edition.corpusId}, which is not pinned`);
    else if (entry.sourceId !== work.author) errors.push(`works.json: ${work.id} is by ${work.author}, but ${edition.corpusId} is ${entry.sourceId}'s`);
    else if (language && entry.language !== language) errors.push(`works.json: ${work.id} reads ${edition.corpusId} as its ${language} translation, but it is in ${entry.language}`);
  }
}

/* 2. The extents. */
if (!existsSync(LIBRARY_EXTENTS_PATH)) {
  console.error('data/generated/library-extents.json is missing: run pnpm bake-library-extents');
  process.exit(1);
}
const extents = JSON.parse(readFileSync(LIBRARY_EXTENTS_PATH, 'utf8')) as LibraryExtents;
if (extents.signature !== extentsSignature(registry, manifest)) {
  errors.push('data/generated/library-extents.json was baked from other editions: run pnpm bake-library-extents');
}

/* 3. Every citation. */
const sites = collectCitationSites(DATA_DIR);
const { resolved, failures } = resolveSites(sites, createCitationResolver(registry), extents);
const kinds = { passage: 0, work: 0, external: 0, note: 0 };
for (const { ref } of resolved) kinds[ref.kind] += 1;
const classes = new Map<string, number>();
for (const failure of failures) classes.set(reasonClass(failure.reason), (classes.get(reasonClass(failure.reason)) ?? 0) + 1);

/* 4. The texts: baked from the editions pinned now, each reading page within budget. */
const MAX_PAGE_CHARS = 400_000;
const MAX_MARGIN_GZIP = 30_000;
const pages = new Map<string, Set<string>>();
for (const work of registry.works) {
  const path = join(LIBRARY_TEXTS_DIR, `${work.id}.json`);
  if (!existsSync(path)) {
    errors.push(`data/generated/library/${work.id}.json is missing: run pnpm bake-library-texts`);
    continue;
  }
  const text = JSON.parse(readFileSync(path, 'utf8')) as LibraryText;
  if (text.signature !== textSignature(work, manifest)) errors.push(`data/generated/library/${work.id}.json was baked from other editions or another reading: run pnpm bake-library-texts`);
  for (const unit of text.units) {
    const size = unitSize(unit);
    if (size > MAX_PAGE_CHARS) errors.push(`${work.id} ${unit.id}: ${Math.round(size / 1024)} KB of text, over the ${MAX_PAGE_CHARS / 1000} KB a reading page may carry`);
  }
  pages.set(work.id, new Set(text.units.map((unit) => unit.id)));
}

/* 5. Every passage lands on a reading page that exists. */
for (const { site, ref } of resolved) {
  if (ref.kind !== 'passage') continue;
  const unit = unitOf(libraryWork(ref.work), ref.from);
  if (!pages.get(ref.work)?.has(unit)) errors.push(`${site.file} ${site.at}: "${site.raw}" lands on ${ref.work} page "${unit}", which the baked text does not have`);
}

/* 6. The translators' own names point at figures of the atlas, in pinned editions. */
const aliasFile = JSON.parse(readFileSync(join(DATA_DIR, 'library', 'aliases.json'), 'utf8')) as { editions: Record<string, Record<string, string | string[] | { id: string; scoped: boolean }>> };
const figureIds = new Set(readdirSync(join(DATA_DIR, 'characters')).map((name) => name.replace(/\.json$/, '')));
for (const [edition, forms] of Object.entries(aliasFile.editions)) {
  if (!manifest.entries.some((entry) => entry.id === edition)) errors.push(`aliases.json: ${edition} is not a pinned edition`);
  for (const [form, target] of Object.entries(forms)) {
    const ids = typeof target === 'string' ? [target] : Array.isArray(target) ? target : [target.id];
    for (const id of ids) if (!figureIds.has(id)) errors.push(`aliases.json: ${edition} "${form}" names ${id}, which is not a figure of the atlas`);
  }
}

console.log(`${sites.length} citations in data/ → ${resolved.length + failures.length} cited stretches`);
console.log(`  ${kinds.passage} passages · ${kinds.work} whole works · ${kinds.external} external · ${kinds.note} notes · ${failures.length} unresolved`);
for (const [name, count] of [...classes].sort((a, b) => b[1] - a[1])) console.log(`    ${String(count).padStart(5)}  ${name}`);
for (const failure of failures.slice(0, SHOW)) {
  const told = failure.site.context.work ? ` [work: ${failure.site.context.work}]` : "";
  errors.push(`${failure.site.file} ${failure.site.at}: "${failure.site.raw}"${told} → ${failure.text}: ${failure.reason}`);
}
if (failures.length > SHOW) errors.push(`… and ${failures.length - SHOW} more (pnpm validate-library --all)`);

/* 8. First, Chaos (§8): the beats run through the Theogony in order, and every
 *    figure lit in a beat has a fact Hesiod tells that cites lines inside it
 *    (scripts/lib/library-readings.ts holds the rule). */
{
  const reading = JSON.parse(readFileSync(READING_PATH, 'utf8')) as Reading;
  const resolve = createCitationResolver(registry);
  const last = extents.works.theogony.lines?.last ?? 0;
  const lit = new Set<string>();
  let expected = 1;
  for (const beat of reading.beats) {
    const [from, to] = beatLines(beat);
    if (from !== expected || !(to >= from)) errors.push(`readings/theogony.json "${beat.title}": lines ${beat.lines} do not follow on from line ${expected - 1}`);
    expected = to + 1;
    for (const id of beat.ignite) {
      if (lit.has(id)) errors.push(`readings/theogony.json "${beat.title}": ${id} is lit twice`);
      lit.add(id);
      const path = join(DATA_DIR, 'characters', `${id}.json`);
      if (!existsSync(path)) {
        errors.push(`readings/theogony.json "${beat.title}": ${id} is not a figure of the atlas`);
        continue;
      }
      const stretches = theogonyStretches(JSON.parse(readFileSync(path, 'utf8')), resolve);
      if (!stretches.some(([start, end]) => start <= to && end >= from)) errors.push(`readings/theogony.json "${beat.title}" (${beat.lines}): ${id} has no fact Hesiod tells that cites these lines`);
    }
  }
  if (expected - 1 !== last) errors.push(`readings/theogony.json: the beats end at line ${expected - 1}, the Theogony at ${last}`);
}

/* 7. The margins (§4.8): every file within its weight, and every block with
 *    notes in the chunk its index names. */
async function checkMargins() {
  const { files } = await libraryMarginData();
  let largest = 0;
  for (const [path, file] of files) {
    const size = gzipSync(JSON.stringify(file)).length;
    largest = Math.max(largest, size);
    if (size > MAX_MARGIN_GZIP) errors.push(`public/atlas/library/${path}: ${(size / 1024).toFixed(1)} KB gzipped, over the ${MAX_MARGIN_GZIP / 1000} KB a margin file may weigh`);
    if (!('chunk' in file)) continue;
    const base = path.replace(/\.json$/, '');
    for (const [from, n] of Object.entries(file.chunk)) {
      const chunk = files.get(`${base}-${n}.json`);
      if (!chunk || !('blocks' in chunk) || !chunk.blocks[from]) errors.push(`public/atlas/library/${path}: block ${from} is not in chunk ${n}`);
    }
  }
  console.log(`  ${files.size} margin files, the largest ${(largest / 1024).toFixed(1)} KB gzipped`);
}

void checkMargins().then(() => {
  if (errors.length > 0) {
    console.error(`\n${failures.length} unresolved citation(s), ${errors.length - Math.min(failures.length, SHOW) - (failures.length > SHOW ? 1 : 0)} registry error(s):`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
  console.log('\nLibrary citations valid.');
});
