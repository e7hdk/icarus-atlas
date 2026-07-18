/** M8 discovery pipeline, stage 3 (docs/CULTURE_PLAN.md §9): verify the
 *  culture shelves' outward claims.
 *
 *  Usage: pnpm verify:culture [ids…]   (no ids = every culture file)
 *
 *  Network gate, deliberately separate from the offline validate-data:
 *  - every externalUrl / imageUrl in data/culture + data/story-culture must
 *    answer 2xx (rate-limited, UA-identified, one retry on 429/5xx);
 *  - every Commons image must carry a free license (extmetadata) — PD/CC
 *    only, per the licensing rule; unknown metadata is a warning, an
 *    explicitly non-free license is a failure. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cultureSchema } from '../src/lib/schemas';

const ROOT = join(import.meta.dirname, '..');
const DIRS = ['culture', 'story-culture'] as const;
const USER_AGENT =
  'IcarusAtlas-culture-verify/1.0 (https://github.com/e7hdk/icarus-atlas; research tooling)';
const DELAY_MS = 400;

const FREE_LICENSE_PREFIXES = [
  'cc0',
  'cc ',
  'cc-',
  'public domain',
  'pd',
  'no restrictions',
  'attribution',
];

interface Target {
  refs: string[];
  kind: 'link' | 'image';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { method, headers: { 'user-agent': USER_AGENT } });
    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      await sleep(6000);
      continue;
    }
    return response;
  }
}

/** HEAD first; some hosts refuse it — fall back to GET (body discarded). */
async function checkUrl(url: string): Promise<number> {
  try {
    const head = await request(url, 'HEAD');
    if (head.ok) return head.status;
    if ([403, 405, 501].includes(head.status)) {
      const get = await request(url, 'GET');
      return get.status;
    }
    return head.status;
  } catch {
    return 0;
  }
}

/** Commons file name from an upload.wikimedia.org URL (original or thumb). */
function commonsFileName(url: string): string | null {
  if (!url.startsWith('https://upload.wikimedia.org/')) return null;
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const thumbIndex = parts.indexOf('thumb');
  const name = thumbIndex >= 0 ? parts[thumbIndex + 3] : parts[parts.length - 1];
  return name ? decodeURIComponent(name) : null;
}

async function licenseFor(fileName: string): Promise<string | null> {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&titles=${encodeURIComponent(`File:${fileName}`)}`;
  try {
    const response = await request(api, 'GET');
    if (!response.ok) return null;
    const body = (await response.json()) as {
      query?: {
        pages?: Record<
          string,
          { imageinfo?: { extmetadata?: { LicenseShortName?: { value?: string } } }[] }
        >;
      };
    };
    const pages = Object.values(body.query?.pages ?? {});
    return pages[0]?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value ?? null;
  } catch {
    return null;
  }
}

function collect(ids: string[]): Map<string, Target> {
  const targets = new Map<string, Target>();
  const add = (url: string, ref: string, kind: Target['kind']) => {
    const existing = targets.get(url);
    if (existing) existing.refs.push(ref);
    else targets.set(url, { refs: [ref], kind });
  };
  for (const dir of DIRS) {
    const full = join(ROOT, 'data', dir);
    if (!existsSync(full)) continue;
    for (const file of readdirSync(full).filter((f) => f.endsWith('.json'))) {
      const id = file.replace(/\.json$/, '');
      if (ids.length > 0 && !ids.includes(id)) continue;
      const parsed = cultureSchema.safeParse(JSON.parse(readFileSync(join(full, file), 'utf-8')));
      if (!parsed.success) {
        console.error(`✗ ${dir}/${file}: fails cultureSchema — run pnpm validate-data`);
        continue;
      }
      const culture = parsed.data;
      const ref = `${dir}/${id}`;
      for (const artwork of culture.artworks) add(artwork.imageUrl, `${ref} · ${artwork.title}`, 'image');
      for (const artifact of culture.artifacts ?? []) {
        add(artifact.imageUrl, `${ref} · ${artifact.title}`, 'image');
        if (artifact.externalUrl) add(artifact.externalUrl, `${ref} · ${artifact.title}`, 'link');
      }
      for (const work of [...(culture.films ?? []), ...(culture.music ?? []), ...(culture.popCulture ?? [])]) {
        add(work.externalUrl, `${ref} · ${work.title}`, 'link');
      }
    }
  }
  return targets;
}

async function main() {
  const ids = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const targets = collect(ids);
  if (targets.size === 0) {
    console.log('Nothing to verify.');
    return;
  }
  console.log(
    `Verifying ${targets.size} unique URL(s)${ids.length ? ` across ${ids.join(', ')}` : ''} …\n`,
  );

  const broken: string[] = [];
  const nonFree: string[] = [];
  const unknownLicense: string[] = [];
  let index = 0;

  for (const [url, target] of targets) {
    index++;
    await sleep(DELAY_MS);
    const status = await checkUrl(url);
    const shortUrl = url.length > 86 ? `${url.slice(0, 83)}…` : url;
    if (status < 200 || status >= 400) {
      broken.push(`${status || 'ERR'} ${url}\n      ← ${target.refs.join('; ')}`);
      console.log(`  ${index}/${targets.size} ✗ ${status || 'ERR'} ${shortUrl}`);
      continue;
    }

    let licenseNote = '';
    if (target.kind === 'image') {
      const fileName = commonsFileName(url);
      if (fileName) {
        await sleep(DELAY_MS);
        const license = await licenseFor(fileName);
        if (!license) {
          unknownLicense.push(`${url}\n      ← ${target.refs.join('; ')}`);
          licenseNote = ' · license: unknown ⚠';
        } else if (
          !FREE_LICENSE_PREFIXES.some((prefix) => license.toLowerCase().startsWith(prefix))
        ) {
          nonFree.push(`"${license}" ${url}\n      ← ${target.refs.join('; ')}`);
          licenseNote = ` · license: ${license} ✗`;
        } else {
          licenseNote = ` · ${license}`;
        }
      } else {
        unknownLicense.push(`${url} (not a Commons URL)\n      ← ${target.refs.join('; ')}`);
        licenseNote = ' · not Commons ⚠';
      }
    }
    console.log(`  ${index}/${targets.size} ✓ ${status} ${shortUrl}${licenseNote}`);
  }

  console.log('');
  if (unknownLicense.length) {
    console.log(`⚠ ${unknownLicense.length} image(s) with unverifiable license:`);
    unknownLicense.forEach((entry) => console.log(`  ${entry}`));
  }
  if (broken.length) {
    console.log(`✗ ${broken.length} broken URL(s):`);
    broken.forEach((entry) => console.log(`  ${entry}`));
  }
  if (nonFree.length) {
    console.log(`✗ ${nonFree.length} image(s) with a non-free license:`);
    nonFree.forEach((entry) => console.log(`  ${entry}`));
  }
  if (!broken.length && !nonFree.length) {
    console.log(`All ${targets.size} URL(s) alive${unknownLicense.length ? '' : ', all image licenses free'}.`);
  }
  process.exit(broken.length || nonFree.length ? 1 : 0);
}

main();
