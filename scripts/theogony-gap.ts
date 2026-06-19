/** Theogony gap report — compares curated Hesiod roster against Icarus Atlas characters.
 *
 * v1 uses data/reference/theogony-roster.json (Tier A/B/C, Th. 116–1022 major figures).
 * Optional --corpus-check validates roster names appear in the pinned English Theogony index.
 *
 * Usage:
 *   pnpm theogony:gap
 *   pnpm theogony:gap --tier A
 *   pnpm theogony:gap --greece-only
 *   pnpm theogony:gap --missing-only
 *   pnpm theogony:gap --corpus-check
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { INDEX_PATH, normalizeWhitespace, type CorpusPassage } from './lib/corpus';

const ROOT = join(import.meta.dirname, '..');
const CHARACTERS_DIR = join(ROOT, 'data', 'characters');
const ROSTER_PATH = join(ROOT, 'data', 'reference', 'theogony-roster.json');

const rosterEntrySchema = z.object({
  key: z.string(),
  name: z.string(),
  tier: z.enum(['A', 'B', 'C']),
  lines: z.string(),
  greeceScope: z.enum(['core', 'peripheral', 'far']),
  atlasId: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  collective: z.boolean().optional(),
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
}

interface MatchResult {
  rosterKey: string;
  matchedId: string | null;
  matchMethod: 'atlasId' | 'id-slug' | 'name' | 'alias' | 'greek' | 'none';
}

interface CliOptions {
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
  console.log(`Theogony gap report

Usage:
  pnpm theogony:gap [options]

Options:
  --tier A|B|C       Filter to one roster tier
  --greece-only      Exclude far-myth figures (Colchis, etc.)
  --missing-only     List only figures not yet in the atlas
  --corpus-check     Verify roster names against pinned Theogony corpus
  --verbose, -v      Show match method for each entry
  --help, -h         Show this help

Tiers:
  A  Major mythic roles (Titans, Olympians, key offspring)
  B  Genealogical names with relations in Theogony
  C  Intentional collectives (Oceanids, Nereids, Ourea, etc.)
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

function slugFromName(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-');
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

  const slug = slugFromName(entry.name);
  const slugMatches = indexes.bySlugPrefix.get(slug) ?? [];
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

function loadTheogonyCorpus(): CorpusPassage[] {
  if (!existsSync(INDEX_PATH)) return [];
  return readFileSync(INDEX_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CorpusPassage)
    .filter((passage) => passage.sourceId === 'hesiod' && passage.work === 'Theogony' && passage.language === 'en');
}

function corpusContainsName(passages: CorpusPassage[], name: string): boolean {
  const needle = normalizeName(name);
  return passages.some((passage) => normalizeName(passage.text).includes(needle));
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const roster = rosterSchema.parse(JSON.parse(readFileSync(ROSTER_PATH, 'utf8')));
  const characters = loadCharacters();
  const indexes = buildIndexes(characters);

  let entries = roster.entries;
  if (options.tier) entries = entries.filter((entry) => entry.tier === options.tier);
  if (options.greeceOnly) entries = entries.filter((entry) => entry.greeceScope !== 'far');

  const results = entries.map((entry) => ({
    entry,
    match: matchEntry(entry, indexes),
  }));

  const collectives = results.filter(({ entry }) => entry.tier === 'C' || entry.collective);
  const individuals = results.filter(({ entry }) => entry.tier !== 'C' && !entry.collective);
  const present = individuals.filter(({ match }) => match.matchedId !== null);
  const missing = individuals.filter(({ match }) => match.matchedId === null);

  const tierA = results.filter(({ entry }) => entry.tier === 'A');
  const tierAPresent = tierA.filter(({ match }) => match.matchedId !== null);
  const tierAMissing = tierA.filter(({ match }) => match.matchedId === null);

  const hesiodTagged = characters.filter((character) => {
    const raw = readFileSync(join(CHARACTERS_DIR, `${character.id}.json`), 'utf8');
    return raw.includes('"hesiod"');
  });

  console.log('=== Theogony Gap Report ===\n');
  console.log(`Atlas characters total:     ${characters.length}`);
  console.log(`Atlas with hesiod source:   ${hesiodTagged.length}`);
  console.log(`Roster entries (filtered):  ${results.length}`);
  console.log(`  Tier A (major roles):     ${tierA.length}`);
  console.log(`  Tier B (genealogical):    ${results.filter(({ entry }) => entry.tier === 'B').length}`);
  console.log(`  Tier C (collectives):     ${results.filter(({ entry }) => entry.tier === 'C').length}`);
  console.log('');
  console.log(`Individuals in roster:      ${individuals.length}`);
  console.log(`  Already in atlas:         ${present.length}`);
  console.log(`  Missing:                  ${missing.length}`);
  console.log(`Tier A coverage:            ${tierAPresent.length}/${tierA.length}${tierA.length > 0 ? ` (${Math.round((tierAPresent.length / tierA.length) * 100)}%)` : ''}`);
  console.log(`Collective/skip entries:    ${collectives.length}`);

  if (options.greeceOnly) {
    const far = roster.entries.filter((entry) => entry.greeceScope === 'far');
    console.log(`\nFar-myth entries excluded:  ${far.length} (${far.map((entry) => entry.name).join(', ')})`);
  }

  if (options.corpusCheck) {
    const passages = loadTheogonyCorpus();
    if (passages.length === 0) {
      console.log('\nCorpus check skipped: run `pnpm corpus:sync` first.');
    } else {
      const notInCorpus = individuals.filter(({ entry }) => !corpusContainsName(passages, entry.name));
      console.log(`\nCorpus check (en Theogony): ${passages.length} passages loaded`);
      console.log(`Roster names not found in corpus text: ${notInCorpus.length}`);
      if (options.verbose && notInCorpus.length > 0) {
        for (const { entry } of notInCorpus) console.log(`  ? ${entry.name} (Th. ${entry.lines})`);
      }
    }
  }

  const show = options.missingOnly ? missing : results.filter(({ entry }) => !options.missingOnly || entry.tier !== 'C');

  if (missing.length > 0) {
    console.log('\n--- Missing (individuals) ---');
    for (const { entry } of missing) {
      const scope = entry.greeceScope === 'far' ? ' [far]' : '';
      const note = entry.note ? ` — ${entry.note}` : '';
      console.log(`  [${entry.tier}] ${entry.name} (Th. ${entry.lines})${scope}${note}`);
    }
  }

  if (!options.missingOnly && collectives.length > 0) {
    console.log('\n--- Collectives / intentional skips (Tier C) ---');
    for (const { entry, match } of collectives) {
      const status = match.matchedId ? `atlas: ${match.matchedId}` : 'no collective node yet';
      console.log(`  [C] ${entry.name} (Th. ${entry.lines}) — ${status}`);
    }
  }

  if (options.verbose && !options.missingOnly) {
    console.log('\n--- All matches ---');
    for (const { entry, match } of results) {
      const target = match.matchedId ?? 'MISSING';
      console.log(`  [${entry.tier}] ${entry.name} → ${target} (${match.matchMethod})`);
    }
  }

  if (tierAMissing.length > 0) {
    console.log('\n--- Suggested next Tier-A batch ---');
    const coreMissing = tierAMissing.filter(({ entry }) => entry.greeceScope === 'core');
    for (const { entry } of coreMissing.slice(0, 8)) {
      console.log(`  • ${entry.name} (Th. ${entry.lines})`);
    }
    if (coreMissing.length > 8) console.log(`  … and ${coreMissing.length - 8} more core Tier-A gaps`);
  }

  console.log('');
}

main();
