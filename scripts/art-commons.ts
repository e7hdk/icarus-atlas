/** The Loom's Commons metadata (docs/LOOM_PLAN.md §4.1): size, license, author and
 *  categories of every culture image, written to data/generated/art-commons.json so
 *  the build stays offline. A manual network step, like verify:culture; run it after
 *  a culture batch.
 *
 *  Usage: pnpm art:commons         fetch the files not recorded yet
 *         pnpm art:commons --all   refetch every file
 */

import { writeFileSync } from 'node:fs';
import { commonsFileName } from '../src/features/art/commons';
import type { CommonsFileMeta } from '../src/types/art';
import { ART_COMMONS_PATH, readArtCommons, readShelfEntries } from './lib/art-sources';

const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  'IcarusAtlas-art-commons/1.0 (https://github.com/e7hdk/icarus-atlas; research tooling)';
const BATCH = 40;
const DELAY_MS = 1100;
const FIELDS = 'LicenseShortName|LicenseUrl|Categories|Artist|AttributionRequired';

interface ApiPage {
  title: string;
  missing?: boolean;
  imageinfo?: {
    width: number;
    height: number;
    mime: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

interface ApiResponse {
  query?: { pages?: ApiPage[]; normalized?: { from: string; to: string }[] };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const titleOf = (file: string) => `File:${file.replace(/_/g, ' ')}`;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#039': "'" };

function plainText(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#?\w+);/g, (whole, name: string) => ENTITIES[name] ?? whole)
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}

async function fetchBatch(files: string[]): Promise<ApiResponse> {
  const body = new URLSearchParams({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'size|mime|extmetadata',
    iiextmetadatafilter: FIELDS,
    titles: files.map(titleOf).join('|'),
    format: 'json',
    formatversion: '2',
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'user-agent': USER_AGENT, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (response.ok) return (await response.json()) as ApiResponse;
    if (attempt === 3) throw new Error(`Commons answered ${response.status}`);
    await sleep(5000 * (attempt + 1));
  }
}

function toMeta(page: ApiPage): CommonsFileMeta | null {
  const info = page.imageinfo?.[0];
  if (page.missing || !info) return null;
  const meta = info.extmetadata ?? {};
  const author = plainText(meta.Artist?.value);
  const licenseUrl = meta.LicenseUrl?.value;
  return {
    width: info.width,
    height: info.height,
    mime: info.mime,
    license: meta.LicenseShortName?.value ?? null,
    attributionRequired: meta.AttributionRequired?.value === 'true',
    categories: (meta.Categories?.value ?? '').split('|').filter(Boolean),
    ...(author ? { author } : {}),
    ...(licenseUrl ? { licenseUrl } : {}),
  };
}

async function main() {
  const all = process.argv.includes('--all');
  const known = all ? {} : readArtCommons().files;
  const wanted = new Set<string>();
  for (const entry of readShelfEntries()) {
    const file = commonsFileName(entry.imageUrl);
    if (file) wanted.add(file);
  }
  const files: Record<string, CommonsFileMeta> = {};
  for (const file of wanted) if (known[file]) files[file] = known[file];
  const pending = [...wanted].filter((file) => !files[file]).sort();
  console.log(`${wanted.size} Commons files, ${pending.length} to fetch.`);

  const missing: string[] = [];
  for (let start = 0; start < pending.length; start += BATCH) {
    const batch = pending.slice(start, start + BATCH);
    const answer = await fetchBatch(batch);
    const pages = new Map((answer.query?.pages ?? []).map((page) => [page.title, page]));
    const normalized = new Map((answer.query?.normalized ?? []).map((n) => [n.from, n.to]));
    for (const file of batch) {
      const title = titleOf(file);
      const page = pages.get(normalized.get(title) ?? title);
      const meta = page ? toMeta(page) : null;
      if (meta) files[file] = meta;
      else missing.push(file);
    }
    console.log(`  ${Math.min(start + BATCH, pending.length)}/${pending.length}`);
    await sleep(DELAY_MS);
  }

  // One file per line, sorted, so a later fetch diffs cleanly.
  const lines = Object.keys(files)
    .sort()
    .map((file) => `${JSON.stringify(file)}:${JSON.stringify(files[file])}`);
  writeFileSync(ART_COMMONS_PATH, `{"files":{\n${lines.join(',\n')}\n}}\n`);
  console.log(`Wrote ${lines.length} records → data/generated/art-commons.json`);
  if (missing.length) {
    console.log(`✗ ${missing.length} file(s) not found on Commons:`);
    missing.forEach((file) => console.log(`  ${file}`));
    process.exit(1);
  }
}

main();
