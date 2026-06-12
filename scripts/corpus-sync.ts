/** Downloads, verifies, and normalizes the local ancient-source research corpus.
 *
 * Usage:
 *   pnpm corpus:sync
 *   pnpm corpus:verify
 */

import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  INDEX_PATH,
  NORMALIZED_DIR,
  RAW_DIR,
  loadManifest,
  normalizeEntry,
  sha256,
  type CorpusEntry,
  type CorpusPassage,
} from './lib/corpus';

const USER_AGENT = 'IcarusAtlas/0.1 (source corpus research; low volume)';

async function readVerified(entry: CorpusEntry): Promise<string | null> {
  try {
    const content = await readFile(join(RAW_DIR, entry.file));
    return sha256(content) === entry.sha256 ? content.toString('utf8') : null;
  } catch {
    return null;
  }
}

async function download(entry: CorpusEntry): Promise<string> {
  const existing = await readVerified(entry);
  if (existing !== null) {
    console.log(`  cached  ${entry.id}`);
    return existing;
  }

  const response = await fetch(entry.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${entry.id}: download failed with HTTP ${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  const actualHash = sha256(content);
  if (actualHash !== entry.sha256) {
    throw new Error(`${entry.id}: checksum mismatch (expected ${entry.sha256}, received ${actualHash})`);
  }

  const target = join(RAW_DIR, entry.file);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, content);
  await rename(temporary, target);
  console.log(`  fetched ${entry.id}`);
  return content.toString('utf8');
}

async function sync(): Promise<void> {
  const manifest = loadManifest();
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(NORMALIZED_DIR, { recursive: true });

  const allPassages: CorpusPassage[] = [];
  for (const entry of manifest.entries) {
    const content = await download(entry);
    const passages = normalizeEntry(entry, content);
    allPassages.push(...passages);
    await writeFile(
      join(NORMALIZED_DIR, `${entry.id}.jsonl`),
      passages.map((item) => JSON.stringify(item)).join('\n') + '\n',
    );
  }

  await writeFile(INDEX_PATH, allPassages.map((item) => JSON.stringify(item)).join('\n') + '\n');
  console.log(`Corpus ready: ${manifest.entries.length} editions, ${allPassages.length} passages.`);
}

async function verify(): Promise<void> {
  const manifest = loadManifest();
  const failures: string[] = [];
  let passageCount = 0;
  const expectedIndex: CorpusPassage[] = [];

  for (const entry of manifest.entries) {
    const content = await readVerified(entry);
    if (content === null) {
      failures.push(`${entry.id}: missing or checksum mismatch`);
      continue;
    }
    const normalizedPath = join(NORMALIZED_DIR, `${entry.id}.jsonl`);
    try {
      const passages = normalizeEntry(entry, content);
      const expected = passages.map((item) => JSON.stringify(item)).join('\n') + '\n';
      const actual = await readFile(normalizedPath, 'utf8');
      if (actual !== expected) throw new Error('file is stale or does not match the raw source');
      passageCount += passages.length;
      expectedIndex.push(...passages);
    } catch (error) {
      failures.push(`${entry.id}: invalid normalized file (${(error as Error).message})`);
    }
  }

  try {
    await stat(INDEX_PATH);
    const expected = expectedIndex.map((item) => JSON.stringify(item)).join('\n') + '\n';
    const actual = await readFile(INDEX_PATH, 'utf8');
    if (actual !== expected) failures.push('combined index is stale or incomplete');
  } catch (error) {
    failures.push(`combined index is invalid (${(error as Error).message})`);
  }

  if (failures.length > 0) {
    console.error(`${failures.length} corpus verification error(s):`);
    for (const failure of failures) console.error(`  x ${failure}`);
    process.exit(1);
  }
  console.log(`Corpus verified: ${manifest.entries.length} editions, ${passageCount} passages.`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'sync';
  if (command === 'sync') await sync();
  else if (command === 'verify') await verify();
  else throw new Error('Usage: tsx scripts/corpus-sync.ts <sync|verify>');
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
