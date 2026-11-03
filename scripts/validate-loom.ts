/** Validates the Loom's layout. Run with: pnpm validate-loom
 *
 * Contract (src/features/art/loom.ts, docs/LOOM_PLAN.md §3, §5), at both widths:
 *   every catalogue work is exactly one tile, in bounds, on no other tile
 *   every cell is woven, except each block's frayed last row and the tear
 *   within a saga, rows follow the years; no work strays far from its moment
 *   nothing crosses the tear
 *   a saga is one band in a row, and its edges ease from row to row
 *   every saga appears
 *   deterministic, and blind to the order of its input
 *   a Pattern's gold thread only ever falls
 * And of the catalogue feeding it: few works unplaced, few anchors, all dated
 * and all under a free license. Rerun `pnpm bake-art` first after a data edit.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isFreeLicense } from '../src/features/art/commons';
import { buildLoomLayout, LOOM_WIDTH, TEAR_FROM, TEAR_TO, type LoomLayout } from '../src/features/art/loom';
import { SAGA_ORDER } from '../src/features/stories/sagas';
import type { ArtCatalogue, ArtWork } from '../src/types/art';
import { ART_CATALOGUE_PATH, readArtPatterns } from './lib/art-sources';
import { measureCatalogue, measureLoom } from './lib/loom-metrics';

/** Set over the measured cloth: 3 rows of drift, and 95% of band edges moving 6
 *  cells or fewer. A phone row is short, so the same years can span more rows. Band
 *  edges are gated at the 95th percentile because a row where several anchors begin
 *  pushes its singles aside: one such row says nothing about how the bands flow. */
const LIMITS = {
  [LOOM_WIDTH.desktop]: { drift: 3, anchorDrift: 4, bandEdgeP95: 8 },
  [LOOM_WIDTH.phone]: { drift: 6, anchorDrift: 8, bandEdgeP95: 8 },
};
const MAX_OTHER_TALES_PERCENT = 8;
const MAX_UNPLACED_PERCENT = 1.5;
const MAX_ANCHORS = 40;

const fingerprint = (layout: LoomLayout) => createHash('sha1').update(JSON.stringify(layout)).digest('hex');

/** Deterministic Fisher-Yates, so a failure reproduces. */
function shuffled(works: ArtWork[]): ArtWork[] {
  const list = [...works];
  let seed = 7;
  for (let i = list.length - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const { works } = JSON.parse(readFileSync(ART_CATALOGUE_PATH, 'utf-8')) as ArtCatalogue;
const patterns = readArtPatterns();
const errors: string[] = [];

function checkWidth(width: keyof typeof LIMITS) {
  const where = `width ${width}`;
  const limits = LIMITS[width];
  const layout = buildLoomLayout(works, width);
  const metrics = measureLoom(layout, works);
  const modernTop = layout.tearTop + layout.tearRows;

  /* 1. Every work is one tile, in bounds, on no other tile. */
  const seen = new Set<string>();
  for (const tile of layout.tiles) {
    if (seen.has(tile.id)) errors.push(`${where}: ${tile.id} placed more than once`);
    seen.add(tile.id);
  }
  for (const work of works) if (!seen.has(work.id)) errors.push(`${where}: ${work.id} not placed`);
  if (metrics.overlaps) errors.push(`${where}: ${metrics.overlaps} cell(s) hold two tiles`);
  if (metrics.outOfBounds) errors.push(`${where}: ${metrics.outOfBounds} tile(s) leave the cloth`);

  /* 2. The cloth has no holes. */
  if (metrics.holes) errors.push(`${where}: ${metrics.holes} empty cell(s) in woven rows`);

  /* 3. Time runs down the cloth. */
  if (metrics.timeBreaks) errors.push(`${where}: ${metrics.timeBreaks} work(s) out of time order within a saga`);
  if (metrics.drift.max > limits.drift) errors.push(`${where}: a work strays ${metrics.drift.max} rows from its moment`);
  if (metrics.anchorDrift.max > limits.anchorDrift) {
    errors.push(`${where}: an anchor strays ${metrics.anchorDrift.max} rows from its moment`);
  }

  /* 4. Nothing crosses the tear. */
  const yearOf = new Map(works.map((work) => [work.id, work.sortYear]));
  for (const tile of layout.tiles) {
    const year = yearOf.get(tile.id) ?? 0;
    const inTear = tile.row >= layout.tearTop && tile.row < modernTop;
    const above = tile.row + tile.h <= layout.tearTop;
    const below = tile.row >= modernTop;
    const belongs = year < TEAR_FROM ? above : year < TEAR_TO ? inTear : below;
    if (!belongs) errors.push(`${where}: ${tile.id} (${year}) sits on the wrong side of the tear`);
  }

  /* 5. A saga is one band, and its edges ease. */
  if (metrics.bandBreaks) errors.push(`${where}: ${metrics.bandBreaks} row(s) break the saga order`);
  if (metrics.bandEdge.p95 > limits.bandEdgeP95) {
    errors.push(`${where}: band edges jump ${metrics.bandEdge.p95} cells between rows at the 95th percentile`);
  }

  /* 6. Every saga appears. */
  if (metrics.sagas < SAGA_ORDER.length) errors.push(`${where}: only ${metrics.sagas} sagas on the cloth`);

  /* 7. Deterministic, and blind to the order of its input. */
  const hash = fingerprint(layout);
  if (fingerprint(buildLoomLayout(works, width)) !== hash) errors.push(`${where}: two runs differ`);
  if (fingerprint(buildLoomLayout(shuffled(works), width)) !== hash) {
    errors.push(`${where}: the cloth depends on the order of its input`);
  }

  /* 8. A Pattern's gold thread only ever falls: each stop sits no higher than the last. */
  const tileOf = new Map(layout.tiles.map((tile) => [tile.id, tile]));
  for (const pattern of patterns) {
    const centres = pattern.stops.flatMap(({ work }) => {
      const tile = tileOf.get(work);
      return tile ? [{ work, y: tile.row + tile.h / 2 }] : [];
    });
    for (let index = 1; index < centres.length; index++) {
      const [from, to] = [centres[index - 1], centres[index]];
      if (to.y < from.y) errors.push(`${where}: the ${pattern.id} thread rises from ${from.work} to ${to.work}`);
    }
  }

  console.log(
    `${String(width).padStart(2)} wide, ${metrics.height} rows · ${metrics.tiles} tiles, ${metrics.anchors} anchors · drift ${metrics.drift.max} (p95 ${metrics.drift.p95}) · band edge ${metrics.bandEdge.max} (p95 ${metrics.bandEdge.p95})`,
  );
}

for (const width of Object.values(LOOM_WIDTH)) checkWidth(width);

/* 9. The catalogue feeding the cloth. */
const catalogue = measureCatalogue(works);
const unplacedPercent = ((catalogue.sagaVia.none ?? 0) * 100) / works.length;
if (catalogue.catchAllPercent > MAX_OTHER_TALES_PERCENT) {
  errors.push(`Other tales holds ${catalogue.catchAllPercent}% of the works`);
}
if (unplacedPercent > MAX_UNPLACED_PERCENT) errors.push(`${unplacedPercent.toFixed(1)}% of the works have no saga`);
const anchors = works.filter((work) => work.span).length;
if (anchors > MAX_ANCHORS) errors.push(`${anchors} anchors: the eye needs few`);
for (const work of works) {
  if (!Number.isFinite(work.sortYear)) errors.push(`${work.id}: no date`);
  if (!isFreeLicense(work.license)) errors.push(`${work.id}: not under a free license (${work.license})`);
}

/* 10. Every work has a sprite, once the atlas exists (M14.3). */
const manifestPath = join(import.meta.dirname, '..', 'public', 'art', 'manifest.json');
if (existsSync(manifestPath)) {
  const { sprites } = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { sprites: Record<string, number> };
  const missing = works.filter((work) => sprites[work.id] === undefined).length;
  if (missing) console.warn(`  ⚠ ${missing} work(s) have no sprite yet: run pnpm bake-loom-atlas`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} Loom error(s):`);
  for (const error of errors.slice(0, 40)) console.error(`  ✗ ${error}`);
  process.exit(1);
}
console.log('\nLoom layout valid.');
