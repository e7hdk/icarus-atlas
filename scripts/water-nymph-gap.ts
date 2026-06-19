/** Water-nymph gap report — compares curated Nereid / Oceanid / Potamos roster against the atlas.
 *
 * Uses data/reference/water-nymph-roster.json. Optional --corpus-check validates names in the pinned corpus.
 *
 * Usage:
 *   pnpm water-nymph:gap
 *   pnpm water-nymph:gap --category nereid
 *   pnpm water-nymph:gap --category oceanid
 *   pnpm water-nymph:gap --category potamos
 *   pnpm water-nymph:gap --tier A
 *   pnpm water-nymph:gap --greece-only
 *   pnpm water-nymph:gap --missing-only
 *   pnpm water-nymph:gap --corpus-check
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { INDEX_PATH, normalizeWhitespace, type CorpusPassage } from './lib/corpus';

const ROOT = join(import.meta.dirname, '..');
const CHARACTERS_DIR = join(ROOT, 'data', 'characters');
const ROSTER_PATH = join(ROOT, 'data', 'reference', 'water-nymph-roster.json');

const categorySchema = z.enum(['nereid', 'oceanid', 'potamos']);

const rosterEntrySchema = z.object({
  key: z.string(),
  name: z.string(),
  category: categorySchema,
  tier: z.enum(['A', 'B', 'C']),
  citation: z.string(),
  greeceScope: z.enum(['core', 'peripheral', 'far']),
  atlasId: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  note: z.string().optional(),
});

const rosterSchema = z.object({
  version: z.literal(1),
  description: z.string(),
  entries: z.array(rosterEntrySchema),
});

interface AtlasCharacter {
  id: string;
  name: string;
  greekName?: string;
  romanName?: string;
  kinds?: string[];
}

interface MatchResult {
  rosterKey: string;
  matchedId: string | null;
  matchMethod: 'atlasId' | 'id-slug' | 'name' | 'none';
}

interface CliOptions {
  category?: z.infer<typeof categorySchema>;
  tier?: 'A' | 'B' | 'C';
  greeceOnly: boolean;
  missingOnly: boolean;
  corpusCheck: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    greeceOnly: false,
    missingOnly: false,
    corpusCheck: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--category') {
      const value = args[++i];
      const parsed = categorySchema.safeParse(value);
      if (!parsed.success) throw new Error('--category must be nereid, oceanid, or potamos');
      options.category = parsed.data;
    } else if (arg === '--tier') {
      const value = args[++i] as 'A' | 'B' | 'C';
      if (!['A', 'B', 'C'].includes(value)) throw new Error('--tier must be A, B, or C');
      options.tier = value;
    } else if (arg === '--greece-only') {
      options.greeceOnly = true;
    } else if (arg === '--missing-only') {
      options.missingOnly = true;
    } else if (arg === '--corpus-check') {
      options.corpusCheck = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`Water-nymph gap report

Usage:
  pnpm water-nymph:gap [options]

Options:
  --category nereid|oceanid|potamos   Filter to one water family
  --tier A|B|C                        Filter to one roster tier
  --greece-only                       Exclude far-myth entries (Nilus, etc.)
  --missing-only                      List only figures not yet in the atlas
  --corpus-check                      Verify roster names against pinned corpus
  --verbose, -v                       Show match method for each entry
  --help, -h                          Show this help

Tiers:
  A  Major mythic roles (Thetis, Peneus, Metis, …)
  B  Key genealogical nodes (Telesto, Eridanus, …)
  C  Catalogue-only / intentional deferrals
`);
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function loadCharacters(): AtlasCharacter[] {
  return readdirSync(CHARACTERS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(join(CHARACTERS_DIR, file), 'utf8')) as AtlasCharacter);
}

function buildIndexes(characters: AtlasCharacter[]) {
  const byId = new Map<string, AtlasCharacter>();
  const byNormalizedName = new Map<string, string[]>();
  const bySlugPrefix = new Map<string, string[]>();

  for (const character of characters) {
    byId.set(character.id, character);

    const names = [character.name, character.greekName ?? '', character.romanName ?? ''].filter(Boolean);
    for (const raw of names) {
      const normalized = normalizeName(raw);
      if (!normalized) continue;
      const bucket = byNormalizedName.get(normalized) ?? [];
      if (!bucket.includes(character.id)) bucket.push(character.id);
      byNormalizedName.set(normalized, bucket);
    }

    const slug = character.id.split('-')[0] ?? character.id;
    const prefixBucket = bySlugPrefix.get(slug) ?? [];
    if (!prefixBucket.includes(character.id)) prefixBucket.push(character.id);
    bySlugPrefix.set(slug, prefixBucket);
  }

  return { byId, byNormalizedName, bySlugPrefix };
}

function matchEntry(
  entry: z.infer<typeof rosterEntrySchema>,
  indexes: ReturnType<typeof buildIndexes>,
): MatchResult {
  const names = [entry.name, ...(entry.aliases ?? [])];

  if (entry.atlasId && indexes.byId.has(entry.atlasId)) {
    return { rosterKey: entry.key, matchedId: entry.atlasId, matchMethod: 'atlasId' };
  }

  const slug = normalizeName(entry.name).replace(/\s+/g, '-');
  const slugMatches = indexes.bySlugPrefix.get(slug.split('-')[0] ?? slug) ?? [];
  if (slugMatches.length === 1) {
    return { rosterKey: entry.key, matchedId: slugMatches[0]!, matchMethod: 'id-slug' };
  }
  if (slugMatches.length > 1 && entry.atlasId && slugMatches.includes(entry.atlasId)) {
    return { rosterKey: entry.key, matchedId: entry.atlasId, matchMethod: 'id-slug' };
  }

  for (const name of names) {
    const normalized = normalizeName(name);
    const nameMatches = indexes.byNormalizedName.get(normalized) ?? [];
    if (nameMatches.length === 1) {
      return { rosterKey: entry.key, matchedId: nameMatches[0]!, matchMethod: 'name' };
    }
    if (nameMatches.length > 1 && entry.atlasId && nameMatches.includes(entry.atlasId)) {
      return { rosterKey: entry.key, matchedId: entry.atlasId, matchMethod: 'name' };
    }
  }

  return { rosterKey: entry.key, matchedId: null, matchMethod: 'none' };
}

function loadCorpus(): CorpusPassage[] {
  if (!existsSync(INDEX_PATH)) return [];
  return readFileSync(INDEX_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CorpusPassage)
    .filter((passage) => passage.language === 'en');
}

function corpusContainsName(passages: CorpusPassage[], name: string): boolean {
  const needle = normalizeName(name);
  return passages.some((passage) => normalizeName(passage.text).includes(needle));
}

function categoryLabel(category: z.infer<typeof categorySchema>): string {
  switch (category) {
    case 'nereid':
      return 'Nereids';
    case 'oceanid':
      return 'Oceanids';
    case 'potamos':
      return 'Potamoi (rivers)';
  }
}

function printCategoryBlock(
  category: z.infer<typeof categorySchema>,
  results: Array<{ entry: z.infer<typeof rosterEntrySchema>; match: MatchResult }>,
  options: CliOptions,
): void {
  const actionable = results.filter(({ entry }) => entry.tier !== 'C');
  const deferred = results.filter(({ entry }) => entry.tier === 'C');
  const present = actionable.filter(({ match }) => match.matchedId !== null);
  const missing = actionable.filter(({ match }) => match.matchedId === null);
  const tierA = actionable.filter(({ entry }) => entry.tier === 'A');
  const tierAPresent = tierA.filter(({ match }) => match.matchedId !== null);
  const deferredPresent = deferred.filter(({ match }) => match.matchedId !== null);
  const deferredMissing = deferred.filter(({ match }) => match.matchedId === null);

  console.log(`--- ${categoryLabel(category)} ---`);
  console.log(`  Roster total:        ${results.length}`);
  console.log(`  Actionable (A+B):    ${actionable.length}`);
  console.log(`    In atlas:          ${present.length}`);
  console.log(`    Missing:           ${missing.length}`);
  console.log(`  Tier A coverage:     ${tierAPresent.length}/${tierA.length}`);
  console.log(`  Deferred (Tier C):   ${deferred.length}`);
  if (deferred.length > 0) {
    console.log(`    In atlas:          ${deferredPresent.length}`);
    console.log(`    Not in atlas:      ${deferredMissing.length}`);
  }

  const showMissing = options.missingOnly ? missing : missing;
  if (showMissing.length > 0) {
    console.log(`  Missing:`);
    for (const { entry } of showMissing) {
      const scope = entry.greeceScope === 'far' ? ' [far]' : entry.greeceScope === 'peripheral' ? ' [periph]' : '';
      const note = entry.note ? ` — ${entry.note}` : '';
      console.log(`    [${entry.tier}] ${entry.name} (${entry.citation})${scope}${note}`);
    }
  }

  if (options.verbose) {
    for (const { entry, match } of results) {
      const target = match.matchedId ?? 'MISSING';
      console.log(`    [${entry.tier}] ${entry.name} → ${target} (${match.matchMethod})`);
    }
  }

  console.log('');
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const roster = rosterSchema.parse(JSON.parse(readFileSync(ROSTER_PATH, 'utf8')));
  const characters = loadCharacters();
  const indexes = buildIndexes(characters);

  let entries = roster.entries;
  if (options.category) entries = entries.filter((entry) => entry.category === options.category);
  if (options.tier) entries = entries.filter((entry) => entry.tier === options.tier);
  if (options.greeceOnly) entries = entries.filter((entry) => entry.greeceScope !== 'far');

  const results = entries.map((entry) => ({
    entry,
    match: matchEntry(entry, indexes),
  }));

  const homonymWarnings = results.filter(({ entry, match }) => {
    if (!match.matchedId) return false;
    if (entry.atlasId && match.matchedId !== entry.atlasId) return true;
    if (entry.key === 'ladon-river' && match.matchedId === 'ladon') return true;
    return false;
  });

  console.log('=== Water-Nymph Gap Report ===\n');
  console.log(`Atlas characters total:     ${characters.length}`);
  console.log(`Roster entries (filtered):  ${results.length}`);

  const categories = options.category
    ? [options.category]
    : (['nereid', 'oceanid', 'potamos'] as const);

  for (const category of categories) {
    const block = results.filter(({ entry }) => entry.category === category);
    if (block.length > 0) printCategoryBlock(category, block, options);
  }

  if (homonymWarnings.length > 0) {
    console.log('--- Homonym warnings ---');
    for (const { entry, match } of homonymWarnings) {
      console.log(`  ${entry.name} roster expects ${entry.atlasId ?? entry.key} but matched ${match.matchedId}`);
    }
    console.log('');
  }

  if (options.corpusCheck) {
    const passages = loadCorpus();
    if (passages.length === 0) {
      console.log('Corpus check skipped: run `pnpm corpus:sync` first.\n');
    } else {
      const missingFromCorpus = results.filter(
        ({ entry }) => entry.tier !== 'C' && !corpusContainsName(passages, entry.name),
      );
      console.log(`Corpus check (en): ${passages.length} passages`);
      console.log(`Actionable names not found in corpus: ${missingFromCorpus.length}`);
      if (options.verbose && missingFromCorpus.length > 0) {
        for (const { entry } of missingFromCorpus) {
          console.log(`  ? ${entry.name} (${entry.citation})`);
        }
      }
      console.log('');
    }
  }

  const tierAMissing = results.filter(
    ({ entry, match }) => entry.tier === 'A' && entry.greeceScope === 'core' && match.matchedId === null,
  );
  if (tierAMissing.length > 0) {
    console.log('--- Suggested next Tier-A batch (core) ---');
    for (const { entry } of tierAMissing.slice(0, 10)) {
      console.log(`  • [${entry.category}] ${entry.name} (${entry.citation})`);
    }
    if (tierAMissing.length > 10) console.log(`  … and ${tierAMissing.length - 10} more`);
    console.log('');
  }
}

main();
