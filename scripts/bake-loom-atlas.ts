/** The Loom's atlas (docs/LOOM_PLAN.md §6): every work's thumbnail, cropped to its
 *  cell and baked into a few image sheets under public/art/, so the door opens
 *  without a request per work. A manual network step: run it at batch boundaries,
 *  not after every edit, since the sheets are binary and live in git.
 *
 *  Thumbnails are cached in gitignored research/loom/thumbs/, so a run resumes
 *  where it stopped and a recompose costs no requests.
 *
 *  Usage: pnpm bake-loom-atlas           fetch what is missing, then compose
 *         pnpm bake-loom-atlas --fetch   only fetch
 *         pnpm bake-loom-atlas --compose only compose, from the cache
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { commonsOriginalUrl, commonsThumbSteps, commonsThumbUrl } from '../src/features/art/commons';
import type { ArtCatalogue, ArtWork } from '../src/types/art';
import { ART_CATALOGUE_PATH } from './lib/art-sources';

const ROOT = join(import.meta.dirname, '..');
const THUMBS = join(ROOT, 'research', 'loom', 'thumbs');
const OUT = join(ROOT, 'public', 'art');

const USER_AGENT =
  'IcarusAtlas-loom-atlas/1.0 (https://github.com/e7hdk/icarus-atlas; research tooling)';
/** One request at a time, a few a second: well under what Commons asks of a bot. */
const DELAY_MS = 220;
/** Past this an original is too heavy to fetch whole when no thumbnail exists. */
const MAX_ORIGINAL_WIDTH = 2000;

const SINGLE_SOURCE = 250;
const ANCHOR_SOURCE = 500;

/** Pixels per cell of the cloth, on the full sheet and the low-quality first paint. */
const CELL = 64;
const LQ_CELL = 24;
const COLUMNS = 64;
/** An anchor keeps a slot this big on its own sheet, at the same pixels per cell. */
const ANCHOR_SLOT = 256;
const ANCHOR_COLUMNS = 8;

const QUALITY = 72;
const LQ_QUALITY = 58;
/** LOOM_PLAN §6, in kilobytes. */
const BUDGET = { 'sheet-lq.webp': 300, 'sheet.webp': 4000, total: 6000 };

const BACKGROUND = '#0b0718';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const thumbPath = (work: ArtWork) => {
  const key = createHash('sha1').update(work.file).digest('hex').slice(0, 20);
  return join(THUMBS, `${key}-${work.span ? ANCHOR_SOURCE : SINGLE_SOURCE}.img`);
};

async function download(url: string): Promise<Buffer | null> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (response.status !== 429 && response.status < 500) return null;
    const wait = Number(response.headers.get('retry-after')) * 1000 || 5000 * 2 ** attempt;
    console.log(`  ${response.status}, waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
  throw new Error(`Commons kept refusing ${url}: rerun later, the cache resumes`);
}

async function fetchThumb(work: ArtWork): Promise<boolean> {
  const wanted = work.span ? ANCHOR_SOURCE : SINGLE_SOURCE;
  const urls = commonsThumbSteps(work.width, wanted).map((step) => commonsThumbUrl(work.path, work.file, step));
  if (work.width <= MAX_ORIGINAL_WIDTH) urls.push(commonsOriginalUrl(work.path, work.file));
  for (const url of urls) {
    await sleep(DELAY_MS);
    const data = await download(url);
    if (!data) continue;
    const path = thumbPath(work);
    writeFileSync(`${path}.tmp`, data);
    renameSync(`${path}.tmp`, path);
    return true;
  }
  return false;
}

async function fetchAll(works: ArtWork[]) {
  mkdirSync(THUMBS, { recursive: true });
  const missing = works.filter((work) => !existsSync(thumbPath(work)));
  console.log(`${works.length} works, ${missing.length} thumbnails to fetch.`);
  const failed: string[] = [];
  for (const [index, work] of missing.entries()) {
    if (!(await fetchThumb(work))) failed.push(work.file);
    if ((index + 1) % 100 === 0) console.log(`  ${index + 1}/${missing.length}`);
  }
  if (failed.length) {
    console.log(`✗ ${failed.length} file(s) gave no thumbnail:`);
    failed.forEach((file) => console.log(`  ${file}`));
    process.exit(1);
  }
}

/** RGB pixels of a work cropped to its cell: the override's focus if it has one,
 *  otherwise where sharp's attention finds the subject. */
async function cropped(work: ArtWork, width: number, height: number): Promise<Buffer> {
  const image = sharp(readFileSync(thumbPath(work)), { failOn: 'none' }).flatten({ background: BACKGROUND });
  if (!work.focus) {
    image.resize(width, height, { fit: 'cover', position: sharp.strategy.attention });
  } else {
    const meta = await sharp(readFileSync(thumbPath(work)), { failOn: 'none' }).metadata();
    const scale = Math.max(width / meta.width, height / meta.height);
    const [cropW, cropH] = [Math.round(width / scale), Math.round(height / scale)];
    image
      .extract({
        left: Math.max(0, Math.min(meta.width - cropW, Math.round(work.focus[0] * meta.width - cropW / 2))),
        top: Math.max(0, Math.min(meta.height - cropH, Math.round(work.focus[1] * meta.height - cropH / 2))),
        width: cropW,
        height: cropH,
      })
      .resize(width, height);
  }
  const { data, info } = await image.toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 3) return data;
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = data[i * info.channels + (info.channels >= 3 ? c : 0)];
  }
  return rgb;
}

function blit(sheet: Buffer, sheetWidth: number, tile: Buffer, x: number, y: number, width: number, height: number) {
  for (let row = 0; row < height; row++) {
    tile.copy(sheet, (y + row) * sheetWidth * 3 + x * 3, row * width * 3, (row + 1) * width * 3);
  }
}

/** A 64-bit difference hash: survives a rescan, not a new composition. */
async function differenceHash(work: ArtWork): Promise<Uint8Array> {
  const data = await sharp(readFileSync(thumbPath(work)), { failOn: 'none' })
    .flatten({ background: '#808080' })
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer();
  const hash = new Uint8Array(64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) hash[y * 8 + x] = data[y * 9 + x] > data[y * 9 + x + 1] ? 1 : 0;
  }
  return hash;
}

function hammingDistance(a: Uint8Array, b: Uint8Array): number {
  let distance = 0;
  for (let bit = 0; bit < a.length; bit++) if (a[bit] !== b[bit]) distance++;
  return distance;
}

async function compose(works: ArtWork[]) {
  const absent = works.filter((work) => !existsSync(thumbPath(work)));
  if (absent.length) throw new Error(`${absent.length} thumbnails missing: run without --compose`);
  mkdirSync(OUT, { recursive: true });

  const singles = [...works].sort((a, b) => a.id.localeCompare(b.id));
  const rows = Math.ceil(singles.length / COLUMNS);
  const [sheetWidth, sheetHeight] = [COLUMNS * CELL, rows * CELL];
  const sheet = Buffer.alloc(sheetWidth * sheetHeight * 3);
  const sprites: Record<string, number> = {};
  for (const [index, work] of singles.entries()) {
    const tile = await cropped(work, CELL, CELL);
    blit(sheet, sheetWidth, tile, (index % COLUMNS) * CELL, Math.floor(index / COLUMNS) * CELL, CELL, CELL);
    sprites[work.id] = index;
    if ((index + 1) % 400 === 0) console.log(`  ${index + 1}/${singles.length} cropped`);
  }

  const anchors = singles.filter((work) => work.span);
  const anchorRows = Math.ceil(anchors.length / ANCHOR_COLUMNS);
  const [anchorWidth, anchorHeight] = [ANCHOR_COLUMNS * ANCHOR_SLOT, anchorRows * ANCHOR_SLOT];
  const anchorSheet = Buffer.alloc(anchorWidth * anchorHeight * 3);
  const anchorSlots: Record<string, number> = {};
  for (const [index, work] of anchors.entries()) {
    const [w, h] = [work.span![0] * CELL, work.span![1] * CELL];
    const tile = await cropped(work, w, h);
    const slotX = (index % ANCHOR_COLUMNS) * ANCHOR_SLOT;
    const slotY = Math.floor(index / ANCHOR_COLUMNS) * ANCHOR_SLOT;
    blit(anchorSheet, anchorWidth, tile, slotX, slotY, w, h);
    anchorSlots[work.id] = index;
  }

  const raw = (width: number, height: number) => ({ raw: { width, height, channels: 3 as const } });
  await sharp(sheet, raw(sheetWidth, sheetHeight)).webp({ quality: QUALITY, effort: 6 }).toFile(join(OUT, 'sheet.webp'));
  await sharp(sheet, raw(sheetWidth, sheetHeight))
    .resize(COLUMNS * LQ_CELL, rows * LQ_CELL, { kernel: 'cubic' })
    .webp({ quality: LQ_QUALITY, effort: 6 })
    .toFile(join(OUT, 'sheet-lq.webp'));
  await sharp(anchorSheet, raw(anchorWidth, anchorHeight)).webp({ quality: QUALITY + 6, effort: 6 }).toFile(join(OUT, 'anchors.webp'));

  writeFileSync(
    join(OUT, 'manifest.json'),
    `${JSON.stringify({
      columns: COLUMNS,
      cell: CELL,
      lqCell: LQ_CELL,
      anchorColumns: ANCHOR_COLUMNS,
      anchorSlot: ANCHOR_SLOT,
      count: singles.length,
      sprites,
      anchors: anchorSlots,
    })}\n`,
  );

  const sizes = Object.fromEntries(
    ['sheet.webp', 'sheet-lq.webp', 'anchors.webp', 'manifest.json'].map((name) => [
      name,
      Math.round(statSync(join(OUT, name)).size / 1024),
    ]),
  );
  const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
  console.log(`Sheets (KB): ${JSON.stringify(sizes)}, total ${total}`);
  if (sizes['sheet.webp'] > BUDGET['sheet.webp']) console.log(`✗ sheet.webp over its ${BUDGET['sheet.webp']} KB budget`);
  if (sizes['sheet-lq.webp'] > BUDGET['sheet-lq.webp']) console.log(`✗ sheet-lq.webp over its ${BUDGET['sheet-lq.webp']} KB budget`);
  if (total > BUDGET.total) console.log(`✗ total over its ${BUDGET.total} KB budget`);

  // Near-identical images under different names: candidates only. A title or a hash
  // never merges works on its own; see LOOM_PLAN §4.4.
  const hashes = await Promise.all(singles.map(differenceHash));
  const pairs: { a: string; b: string; distance: number }[] = [];
  for (let i = 0; i < singles.length; i++) {
    for (let j = i + 1; j < singles.length; j++) {
      const distance = hammingDistance(hashes[i], hashes[j]);
      if (distance <= 8) pairs.push({ a: singles[i].id, b: singles[j].id, distance });
    }
  }
  pairs.sort((x, y) => x.distance - y.distance);
  mkdirSync(join(ROOT, 'research', 'loom'), { recursive: true });
  writeFileSync(join(ROOT, 'research', 'loom', 'duplicates.json'), JSON.stringify(pairs, null, 1));
  console.log(`${pairs.length} near-identical pair(s) → research/loom/duplicates.json`);
}

async function main() {
  const { works } = JSON.parse(readFileSync(ART_CATALOGUE_PATH, 'utf-8')) as ArtCatalogue;
  if (!process.argv.includes('--compose')) await fetchAll(works);
  if (!process.argv.includes('--fetch')) await compose(works);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
