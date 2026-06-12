/** Searches the normalized ancient-source corpus without network access.
 *
 * Usage:
 *   pnpm corpus:search aphrodite
 *   pnpm corpus:search "daughter of Zeus" --source homer --language en
 */

import { readFile } from 'node:fs/promises';
import { INDEX_PATH, normalizeWhitespace, type CorpusPassage } from './lib/corpus';

interface SearchOptions {
  source?: string;
  work?: string;
  language?: string;
  limit: number;
}

function parseArguments(args: string[]): { query: string; options: SearchOptions } {
  const queryParts: string[] = [];
  const options: SearchOptions = { limit: 20 };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--source') options.source = args[++index];
    else if (arg === '--work') options.work = args[++index];
    else if (arg === '--language') options.language = args[++index];
    else if (arg === '--limit') options.limit = Number(args[++index]);
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else queryParts.push(arg);
  }

  const query = normalizeWhitespace(queryParts.join(' '));
  if (!query) throw new Error('A search query is required.');
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 200) {
    throw new Error('--limit must be an integer between 1 and 200.');
  }
  return { query, options };
}

function searchable(value: string): string {
  return value.normalize('NFKD').toLocaleLowerCase('en');
}

function excerpt(text: string, query: string): string {
  const normalizedText = searchable(text);
  const index = normalizedText.indexOf(searchable(query));
  if (index < 0 || text.length <= 420) return text;
  const start = Math.max(0, index - 150);
  const end = Math.min(text.length, index + query.length + 240);
  return `${start > 0 ? '...' : ''}${text.slice(start, end)}${end < text.length ? '...' : ''}`;
}

async function main(): Promise<void> {
  const { query, options } = parseArguments(process.argv.slice(2));
  let content: string;
  try {
    content = await readFile(INDEX_PATH, 'utf8');
  } catch {
    throw new Error('The local corpus is not ready. Run `pnpm corpus:sync` first.');
  }

  const needle = searchable(query);
  const matches = content
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CorpusPassage)
    .filter((item) => !options.source || item.sourceId === options.source)
    .filter((item) => !options.work || searchable(item.work).includes(searchable(options.work)))
    .filter((item) => !options.language || item.language === options.language)
    .filter((item) => searchable(item.text).includes(needle))
    .slice(0, options.limit);

  if (matches.length === 0) {
    console.log(`No passages found for "${query}".`);
    return;
  }

  console.log(`${matches.length} passage(s) found for "${query}":\n`);
  for (const item of matches) {
    console.log(`[${item.sourceId} | ${item.language}] ${item.citationLabel} ${item.citation}`);
    console.log(excerpt(item.text, query));
    console.log(`${item.urn}\n`);
  }
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
