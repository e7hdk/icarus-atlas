import { SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type { ArtWork } from '@/types/art';

/** The Loom's layout (docs/LOOM_PLAN.md §3, §5): every work one tile in a single
 *  cloth. Across, the sagas in Spindle order; down, the years the works were made,
 *  in rank time, so every row holds the same number of cells. A saga's width in a
 *  row is that moment's share of attention. Pure and deterministic. */

export const LOOM_WIDTH = { desktop: 58, phone: 26 } as const;

/** Between these years the collection thins to almost nothing: the tear. */
export const TEAR_FROM = 500;
export const TEAR_TO = 1400;
const TEAR_MIN_ROWS = 2;

/** A saga's density is smoothed across rows by this much, so one print series
 *  dated to a single year widens its band gently instead of striping a row. */
const DENSITY_SIGMA = 1.8;
const DENSITY_REACH = 6;

/** Rows either side of an anchor's moment that count as its neighbourhood when
 *  finding the band it belongs to. */
const ANCHOR_WINDOW = 2;

export const LOOM_ERAS: { label: string; sub: string; from: number }[] = [
  { label: 'Archaic', sub: 'before 480 BC', from: -Infinity },
  { label: 'Classical', sub: '480–323 BC', from: -480 },
  { label: 'Hellenistic', sub: '323–31 BC', from: -323 },
  { label: 'Roman', sub: '31 BC – AD 500', from: -31 },
  { label: 'The tear', sub: 'AD 500–1400', from: TEAR_FROM },
  { label: '1400s', sub: '', from: TEAR_TO },
  { label: '1500s', sub: '', from: 1500 },
  { label: '1600s', sub: '', from: 1600 },
  { label: '1700s', sub: '', from: 1700 },
  { label: '1800s', sub: '', from: 1800 },
  { label: '1900s', sub: '', from: 1900 },
];

/** One work's place on the cloth, in cells. */
export interface LoomTile {
  id: string;
  x: number;
  row: number;
  w: number;
  h: number;
}

export interface LoomEra {
  label: string;
  sub: string;
  row: number;
}

export interface LoomLayout {
  width: number;
  height: number;
  tearTop: number;
  tearRows: number;
  /** In reading order: by row, then across. */
  tiles: LoomTile[];
  eras: LoomEra[];
}

const SAGA_RANK = new Map<SagaId, number>(SAGA_ORDER.map((saga, index) => [saga, index]));
const rankOf = (work: ArtWork) => SAGA_RANK.get(work.saga) ?? SAGA_ORDER.length;
const spanOf = (work: ArtWork): [number, number] => work.span ?? [1, 1];
const areaOf = (works: ArtWork[]) =>
  works.reduce((sum, work) => sum + spanOf(work)[0] * spanOf(work)[1], 0);

function byTime(a: ArtWork, b: ArtWork): number {
  return a.sortYear - b.sortYear || rankOf(a) - rankOf(b) || a.id.localeCompare(b.id);
}

function bySaga(a: ArtWork, b: ArtWork): number {
  return rankOf(a) - rankOf(b) || byTime(a, b);
}

/** Where each work would sit if time alone decided: its cumulative area in rows.
 *  Takes the works of one block in time order. */
export function idealRows(works: ArtWork[], width: number): Map<string, number> {
  const rows = new Map<string, number>();
  let covered = 0;
  for (const work of works) {
    rows.set(work.id, Math.floor(covered / width));
    covered += areaOf([work]);
  }
  return rows;
}

/** The nearest spot to an anchor's moment and band, one clear cell from any other
 *  anchor so no two ever read as one image. */
function findAnchorSpot(
  anchor: ArtWork,
  block: { works: ArtWork[]; ideal: Map<string, number>; top: number; rows: number; width: number },
  anchorCells: Set<number>,
): { x: number; row: number } | null {
  const { works, ideal, top, rows, width } = block;
  const [w, h] = spanOf(anchor);
  if (h > rows || w > width) return null;

  const moment = ideal.get(anchor.id) ?? 0;
  const near = works.filter((work) => Math.abs((ideal.get(work.id) ?? 0) - moment) <= ANCHOR_WINDOW);
  const before = areaOf(near.filter((work) => rankOf(work) < rankOf(anchor)));
  const same = areaOf(near.filter((work) => rankOf(work) === rankOf(anchor)));
  const homeX = Math.round(((before + same / 2) / areaOf(near)) * width - w / 2);
  const homeRow = top + Math.min(moment, rows - h);

  const isClear = (x: number, row: number) => {
    for (let dy = -1; dy <= h; dy++) {
      for (let dx = -1; dx <= w; dx++) {
        const cx = x + dx;
        if (cx >= 0 && cx < width && anchorCells.has((row + dy) * width + cx)) return false;
      }
    }
    return true;
  };

  let best: { x: number; row: number } | null = null;
  let bestCost = Infinity;
  for (let row = top; row <= top + rows - h; row++) {
    for (let x = 0; x <= width - w; x++) {
      // A row away from its moment costs more than a cell away from its band.
      const cost = Math.abs(x - homeX) + Math.abs(row - homeRow) * 3;
      if (cost < bestCost && isClear(x, row)) {
        bestCost = cost;
        best = { x, row };
      }
    }
  }
  return best;
}

/** Each saga's smoothed share of each row: how many works it holds near that row. */
function sagaDensity(works: ArtWork[], ideal: Map<string, number>, rows: number): Map<SagaId, number[]> {
  const density = new Map<SagaId, number[]>(SAGA_ORDER.map((saga) => [saga, new Array<number>(rows).fill(0)]));
  for (const work of works) {
    const moment = Math.min(rows - 1, ideal.get(work.id) ?? 0);
    const line = density.get(work.saga);
    if (!line) continue;
    const last = Math.min(rows - 1, moment + DENSITY_REACH);
    for (let row = Math.max(0, moment - DENSITY_REACH); row <= last; row++) {
      line[row] += Math.exp(-((row - moment) ** 2) / (2 * DENSITY_SIGMA * DENSITY_SIGMA));
    }
  }
  return density;
}

/** Weave one block of the cloth from `top` down and return its rows. Anchors go
 *  first; singles then fill every free cell from per-saga quotas, each saga keeping
 *  its own chronological queue. The quotas chase a cumulative target, so a saga
 *  that falls behind in one row catches up and the drift never accumulates. */
function weaveBlock(
  works: ArtWork[],
  top: number,
  width: number,
  taken: Set<number>,
  tiles: LoomTile[],
): number {
  if (works.length === 0) return 0;
  const rows = Math.ceil(areaOf(works) / width);
  const ideal = idealRows(works, width);

  const place = (work: ArtWork, x: number, row: number, w: number, h: number) => {
    tiles.push({ id: work.id, x, row, w, h });
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) taken.add((row + dy) * width + x + dx);
  };

  const anchorCells = new Set<number>();
  const singles: ArtWork[] = [];
  for (const work of works) {
    const spot = work.span ? findAnchorSpot(work, { works, ideal, top, rows, width }, anchorCells) : null;
    if (!spot) {
      singles.push(work);
      continue;
    }
    const [w, h] = spanOf(work);
    place(work, spot.x, spot.row, w, h);
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) anchorCells.add((spot.row + dy) * width + spot.x + dx);
  }

  const queues = new Map<SagaId, ArtWork[]>(
    SAGA_ORDER.map((saga) => [saga, singles.filter((work) => work.saga === saga)]),
  );
  const density = sagaDensity(singles, ideal, rows);
  const target = new Map<SagaId, number>(SAGA_ORDER.map((saga) => [saga, 0]));
  const woven = new Map<SagaId, number>(SAGA_ORDER.map((saga) => [saga, 0]));

  for (let index = 0; index < rows; index++) {
    const row = top + index;
    const free: number[] = [];
    for (let x = 0; x < width; x++) if (!taken.has(row * width + x)) free.push(x);
    if (free.length === 0) continue;

    const rowDensity = SAGA_ORDER.reduce((sum, saga) => sum + density.get(saga)![index], 0) || 1;
    const claims = SAGA_ORDER.map((saga) => {
      const reached = target.get(saga)! + (density.get(saga)![index] / rowDensity) * free.length;
      target.set(saga, reached);
      const left = queues.get(saga)!.length;
      const want = reached - woven.get(saga)!;
      return { saga, want, left, count: Math.max(0, Math.min(left, Math.floor(want))) };
    });
    let used = claims.reduce((sum, claim) => sum + claim.count, 0);
    const behind = (claim: { want: number; count: number }) => claim.want - claim.count;

    while (used < free.length) {
      const open = claims.filter((claim) => claim.count < claim.left);
      if (open.length === 0) break;
      const next = open.reduce((a, b) => (behind(b) > behind(a) ? b : a));
      next.count++;
      used++;
    }
    while (used > free.length) {
      const held = claims.filter((claim) => claim.count > 0);
      const next = held.reduce((a, b) => (behind(b) < behind(a) ? b : a));
      next.count--;
      used--;
    }

    const take: ArtWork[] = [];
    for (const claim of claims) {
      take.push(...queues.get(claim.saga)!.splice(0, claim.count));
      woven.set(claim.saga, woven.get(claim.saga)! + claim.count);
    }
    take.sort(bySaga);
    // A short last row spreads out, so the block frays instead of stopping dead.
    take.forEach((work, n) => place(work, free[Math.floor((n * free.length) / take.length)], row, 1, 1));
  }
  return rows;
}

function layTear(works: ArtWork[], top: number, rows: number, width: number, tiles: LoomTile[]) {
  [...works].sort(bySaga).forEach((work, index) => {
    const x = Math.round(((index + 0.5) / works.length) * (width - 1));
    tiles.push({ id: work.id, x, row: top + (index % rows), w: 1, h: 1 });
  });
}

function eraRows(tiles: LoomTile[], works: ArtWork[], height: number, tearTop: number): LoomEra[] {
  const yearOf = new Map(works.map((work) => [work.id, work.sortYear]));
  const yearsByRow = new Map<number, number[]>();
  for (const tile of tiles) {
    const years = yearsByRow.get(tile.row) ?? [];
    years.push(yearOf.get(tile.id) ?? 0);
    yearsByRow.set(tile.row, years);
  }
  return LOOM_ERAS.map((era) => {
    if (era.from === TEAR_FROM) return { label: era.label, sub: era.sub, row: tearTop };
    // An era begins where it has taken over the row, not at its first stray tile.
    let row = 0;
    while (row < height) {
      const years = yearsByRow.get(row) ?? [];
      if (years.length > 0 && years.filter((year) => year >= era.from).length * 2 >= years.length) break;
      row++;
    }
    return { label: era.label, sub: era.sub, row };
  });
}

export function buildLoomLayout(works: ArtWork[], width: number): LoomLayout {
  const ordered = [...works].sort(byTime);
  const before = ordered.filter((work) => work.sortYear < TEAR_FROM);
  const within = ordered.filter((work) => work.sortYear >= TEAR_FROM && work.sortYear < TEAR_TO);
  const after = ordered.filter((work) => work.sortYear >= TEAR_TO);

  const taken = new Set<number>();
  const tiles: LoomTile[] = [];
  const tearTop = weaveBlock(before, 0, width, taken, tiles);
  const tearRows = Math.max(TEAR_MIN_ROWS, Math.ceil((within.length * 3) / width));
  layTear(within, tearTop, tearRows, width, tiles);
  const modernTop = tearTop + tearRows;
  const height = modernTop + weaveBlock(after, modernTop, width, taken, tiles);

  tiles.sort((a, b) => a.row - b.row || a.x - b.x);
  return { width, height, tearTop, tearRows, tiles, eras: eraRows(tiles, works, height, tearTop) };
}
