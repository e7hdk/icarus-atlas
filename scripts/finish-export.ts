/** Finishes the static export in out/ for Cloudflare Workers Static Assets
 *  (docs/HOSTING.md). It drops Next's per-segment prefetch files, which would not
 *  fit the host's 20,000-file cap and which nothing asks for (Link prefetching is
 *  off), writes the response headers a static host cannot take from next.config,
 *  and fails when the export would not deploy. Chained into `cf:build`.
 *
 *  Run with: pnpm cf:build   (after `next build` has written out/) */

import { existsSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { ATLAS_FILES } from '../src/features/atlas/files';

const OUT = 'out';

/** Workers Static Assets limits per deployed version. */
const MAX_FILES = 20_000;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_HEADER_RULES = 100;

/** Next's per-segment prefetch payloads in a static export: `__next.<segment path>.txt`. */
const isSegmentPrefetch = (name: string) => name.startsWith('__next.') && name.endsWith('.txt');

/** A door's data starts with its HTML. An HTTP header, not a preload in the page,
 *  so a browser acts on it only when it loads that page itself. */
const preload = (url: string) => [`  Link: <${url}>; rel=preload; as=fetch; crossorigin`];

/** Route handlers export as files without an extension, which the host would type
 *  as bytes; every Ephemeris card shares one rule, anything else gets its own. */
const EPHEMERIS_DIR = join('api', 'ephemeris');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Removes the directories a pruning left empty, deepest first. */
function removeEmptyDirs(dir: string): boolean {
  const entries = readdirSync(dir, { withFileTypes: true });
  let empty = true;
  for (const entry of entries) {
    if (!entry.isDirectory() || !removeEmptyDirs(join(dir, entry.name))) empty = false;
  }
  if (empty && dir !== OUT) rmdirSync(dir);
  return empty;
}

function sniffType(path: string): string {
  const head = readFileSync(path).subarray(0, 8);
  if (head.toString('hex').startsWith('89504e470d0a1a0a')) return 'image/png';
  const first = head.toString('utf-8').trimStart()[0];
  if (first === '{' || first === '[') return 'application/json';
  throw new Error(`${path}: a file without an extension of unknown type; add a Content-Type rule`);
}

function fail(message: string): never {
  console.error(`finish-export: ${message}`);
  process.exit(1);
}

if (!existsSync(join(OUT, 'index.html'))) fail('out/index.html is missing; run `next build` with `output: "export"` first.');
if (!existsSync(join(OUT, '404.html'))) fail('out/404.html is missing; the host serves it for unknown paths.');

const localOnly = ['dem.pmtiles', 'dem-terrain.pmtiles'].map((name) => join(OUT, 'geo', name)).filter(existsSync);
const reliefTiles = existsSync(join(OUT, 'geo', 'relief'))
  ? readdirSync(join(OUT, 'geo', 'relief'), { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];
if (localOnly.length || reliefTiles.length) {
  fail(
    'the export carries the gitignored geo archives, and the map style points at them. ' +
      'Build from a clean tree (docs/HOSTING.md).',
  );
}

let pruned = 0;
for (const path of walk(OUT)) {
  if (!isSegmentPrefetch(path.split(sep).at(-1) ?? '')) continue;
  rmSync(path);
  pruned++;
}
removeEmptyDirs(OUT);

const files = walk(OUT);
const bare = files.filter((path) => !extname(path) && !path.split(sep).at(-1)?.startsWith('_'));
const ephemeris = bare.filter((path) => relative(OUT, path).startsWith(EPHEMERIS_DIR + sep));
const others = bare.filter((path) => !ephemeris.includes(path));

const rules: string[][] = [
  ['/_next/static/*', '  Cache-Control: public, max-age=31536000, immutable'],
  ['/', ...preload(ATLAS_FILES.galaxy)],
  ['/stories', ...preload(ATLAS_FILES.myths)],
  ['/areas', ...preload(ATLAS_FILES.lands)],
  ['/art', ...preload(ATLAS_FILES.loom), ...preload(ATLAS_FILES.loomPreview)],
  ['/art/:id', ...preload(ATLAS_FILES.loom), ...preload(ATLAS_FILES.loomPreview)],
  ['/art/list', '  ! Link'],
  ...(ephemeris.length ? [['/api/ephemeris/:id', '  Content-Type: application/json']] : []),
  ...others.map((path) => ['/' + relative(OUT, path).split(sep).join('/'), `  Content-Type: ${sniffType(path)}`]),
];
if (rules.length > MAX_HEADER_RULES) fail(`${rules.length} header rules, over the host's ${MAX_HEADER_RULES}.`);
writeFileSync(join(OUT, '_headers'), rules.map((rule) => rule.join('\n')).join('\n') + '\n');

let bytes = 0;
let largest = { path: '', size: 0 };
for (const path of files) {
  const { size } = statSync(path);
  bytes += size;
  if (size > largest.size) largest = { path, size };
}
const assets = files.length + (files.includes(join(OUT, '_headers')) ? 0 : 1);
if (assets > MAX_FILES) fail(`${assets} files, over the host's ${MAX_FILES} per version.`);
if (largest.size > MAX_FILE_BYTES) fail(`${largest.path} is ${largest.size} bytes, over the host's 25 MiB per file.`);

const pages = files.filter((path) => path.endsWith('.html')).length;
console.log(
  `Finished the export → out/ (${pages} pages, ${assets} files of ${MAX_FILES}, ${(bytes / 1024 / 1024).toFixed(0)} MB; ` +
    `pruned ${pruned} prefetch files; largest ${relative(OUT, largest.path)} ${(largest.size / 1024 / 1024).toFixed(1)} MB; ` +
    `${rules.length} header rules)`,
);
