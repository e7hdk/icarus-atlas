/** Maintenance utility for the reference/culture data layer.
 *
 *  Usage:
 *    pnpm tsx scripts/fetch-cultural-legacy.ts summaries   # refresh data/reference summaries from Wikipedia
 *    pnpm tsx scripts/fetch-cultural-legacy.ts check       # verify every culture imageUrl still resolves
 *
 *  Method notes (learned the hard way):
 *  - NEVER hand-build Wikimedia thumb URLs — only certain widths exist and the rest return 400.
 *    Always resolve through the APIs (REST summary, prop=pageimages, prop=imageinfo&iiurlwidth).
 *  - Always send a User-Agent and pace requests (~500ms); bursts get rate-limited with 429.
 *  - Artwork curation itself stays manual: a search hit on an artist's page returns their portrait,
 *    not the painting. Every new gallery entry must be audited by filename before it ships.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const UA = { 'User-Agent': 'IcarusAtlas/0.1 (data maintenance; low volume)' };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wikipedia page per character id, disambiguated where the plain title is a planet, moon or dwarf planet. */
const WIKI_TITLES: Record<string, string> = {
  chaos: 'Chaos (cosmogony)', uranus: 'Uranus (mythology)', rhea: 'Rhea (mythology)',
  tethys: 'Tethys (mythology)', iapetus: 'Iapetus (mythology)', atlas: 'Atlas (mythology)',
  aether: 'Aether (mythology)', nemesis: 'Nemesis (mythology)', eris: 'Eris (mythology)',
};

async function fetchRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: UA });
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        await sleep(2500 * (attempt + 1));
        continue;
      }
      return res;
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

function characterIds(): string[] {
  return readdirSync(join(DATA_DIR, 'reference'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

async function refreshSummaries() {
  let updated = 0;
  const misses: string[] = [];
  for (const id of characterIds()) {
    const title = WIKI_TITLES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
    const res = await fetchRetry(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    await sleep(500);
    if (!res || !res.ok) {
      misses.push(`${id} (${title})`);
      continue;
    }
    const json = await res.json();
    if (json.type === 'disambiguation' || !json.extract || json.extract.length < 60) {
      misses.push(`${id} (${title}): unusable extract`);
      continue;
    }
    const file = join(DATA_DIR, 'reference', `${id}.json`);
    const ref = JSON.parse(readFileSync(file, 'utf-8'));
    if (ref.summary !== json.extract) {
      ref.summary = json.extract;
      writeFileSync(file, JSON.stringify(ref, null, 2) + '\n');
      updated++;
    }
  }
  console.log(`Summaries refreshed: ${updated} updated, ${misses.length} misses`);
  for (const miss of misses) console.log(`  ✗ ${miss}`);
}

async function checkGalleries() {
  const broken: string[] = [];
  let checked = 0;
  for (const id of characterIds()) {
    const culture = JSON.parse(readFileSync(join(DATA_DIR, 'culture', `${id}.json`), 'utf-8'));
    for (const artwork of culture.artworks ?? []) {
      const res = await fetchRetry(artwork.imageUrl);
      await sleep(500);
      checked++;
      if (!res || !res.ok) broken.push(`${id}: "${artwork.title}" → ${artwork.imageUrl}`);
    }
  }
  console.log(`Gallery URLs checked: ${checked}, broken: ${broken.length}`);
  for (const url of broken) console.log(`  ✗ ${url}`);
  if (broken.length > 0) process.exit(1);
}

const mode = process.argv[2];
if (mode === 'summaries') await refreshSummaries();
else if (mode === 'check') await checkGalleries();
else {
  console.log('Usage: tsx scripts/fetch-cultural-legacy.ts <summaries|check>');
  process.exit(1);
}
