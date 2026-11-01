import { idealRows, TEAR_FROM, TEAR_TO, type LoomLayout } from '../../src/features/art/loom';
import { SAGA_ORDER, type SagaId } from '../../src/features/stories/sagas';
import type { ArtWork } from '../../src/types/art';

/** The numbers behind the Loom (docs/LOOM_PLAN.md §2, §5): what the catalogue
 *  holds, how much of it rests on heuristics, and how connected its web is. */

const ERA_BANDS = [
  { label: 'before AD 500', from: -Infinity, to: 500 },
  { label: 'AD 500–1400', from: 500, to: 1400 },
  { label: '1400s', from: 1400, to: 1500 },
  { label: '1500s–1600s', from: 1500, to: 1700 },
  { label: '1700s–1800s', from: 1700, to: 1900 },
  { label: '1900 on', from: 1900, to: Infinity },
];

function tally<T extends string>(values: T[]): Record<T, number> {
  const counts = {} as Record<T, number>;
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 0;
}

export function measureCatalogue(works: ArtWork[]) {
  const byFigure = new Map<string, number[]>();
  works.forEach((work, index) => {
    for (const { id } of work.figures) byFigure.set(id, [...(byFigure.get(id) ?? []), index]);
  });
  const threads = [...byFigure].filter(([, members]) => members.length >= 2);

  const parent = works.map((_, index) => index);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const [, members] of threads) {
    for (const member of members.slice(1)) parent[find(member)] = find(members[0]);
  }
  const sets = Object.values(tally(works.map((_, index) => String(find(index))))).sort((a, b) => b - a);

  const crossingTear = [...byFigure.values()].filter(
    (members) =>
      members.some((i) => works[i].sortYear < 500) && members.some((i) => works[i].sortYear >= 1400),
  );

  const shares = ERA_BANDS.map((band) => {
    const inBand = works.filter((work) => work.sortYear >= band.from && work.sortYear < band.to);
    const bySaga = tally(inBand.map((work) => work.saga));
    return {
      label: band.label,
      works: inBand.length,
      percent: Object.fromEntries(
        SAGA_ORDER.map((saga) => [saga, inBand.length ? Math.round((1000 * (bySaga[saga] ?? 0)) / inBand.length) / 10 : 0]),
      ) as Record<SagaId, number>,
    };
  });

  return {
    works: works.length,
    media: tally(works.map((work) => work.medium)),
    mediumVia: tally(works.map((work) => work.mediumVia)),
    sagas: tally(works.map((work) => work.saga)),
    sagaVia: tally(works.map((work) => work.sagaVia)),
    catchAllPercent: Math.round((1000 * works.filter((work) => work.saga === 'heroic').length) / works.length) / 10,
    figureVia: tally(works.flatMap((work) => work.figures.map((figure) => figure.via))),
    figuresPerWork: median(works.map((work) => work.figures.length)),
    worksWithoutFigure: works.filter((work) => work.figures.length === 0).length,
    threads: threads.length,
    stitches: threads.reduce((sum, [, members]) => sum + members.length - 1, 0),
    connectedSets: sets.length,
    largestSet: sets[0] ?? 0,
    largestSetPercent: Math.round((1000 * (sets[0] ?? 0)) / works.length) / 10,
    longestThreads: threads
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([id, members]) => ({ id, works: members.length })),
    figuresCrossingTear: crossingTear.length,
    licenses: tally(
      works.map((work) => {
        if (/^(public domain|pd\b|cc0|no restrictions)/i.test(work.license)) return 'public domain or CC0';
        return /sa/i.test(work.license) ? 'CC BY-SA' : 'CC BY';
      }),
    ),
    shares,
  };
}

function percentile(values: number[], share: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0;
}

/** How far the cloth strays from its contract at one width. */
export function measureLoom(layout: LoomLayout, works: ArtWork[]) {
  const { width, height, tearTop, tearRows, tiles } = layout;
  const byId = new Map(works.map((work) => [work.id, work]));
  const tileOf = new Map(tiles.map((tile) => [tile.id, tile]));
  const rank = (id: string) => SAGA_ORDER.indexOf(byId.get(id)!.saga);
  const modernTop = tearTop + tearRows;

  const cells = new Set<number>();
  let overlaps = 0;
  let outOfBounds = 0;
  for (const tile of tiles) {
    if (tile.x < 0 || tile.row < 0 || tile.x + tile.w > width || tile.row + tile.h > height) outOfBounds++;
    for (let dy = 0; dy < tile.h; dy++) {
      for (let dx = 0; dx < tile.w; dx++) {
        const cell = (tile.row + dy) * width + tile.x + dx;
        if (cells.has(cell)) overlaps++;
        cells.add(cell);
      }
    }
  }

  // Every row is full except the frayed last row of each block and the tear.
  let holes = 0;
  const woven = (row: number) => row < tearTop - 1 || (row >= modernTop && row < height - 1);
  for (let row = 0; row < height; row++) {
    if (!woven(row)) continue;
    for (let x = 0; x < width; x++) if (!cells.has(row * width + x)) holes++;
  }

  const blocks = [
    works.filter((work) => work.sortYear < TEAR_FROM),
    works.filter((work) => work.sortYear >= TEAR_TO),
  ].map((block) => [...block].sort((a, b) => a.sortYear - b.sortYear || SAGA_ORDER.indexOf(a.saga) - SAGA_ORDER.indexOf(b.saga) || a.id.localeCompare(b.id)));
  const singleDrift: number[] = [];
  const anchorDrift: number[] = [];
  blocks.forEach((block, index) => {
    const top = index === 0 ? 0 : modernTop;
    const ideal = idealRows(block, width);
    for (const work of block) {
      const tile = tileOf.get(work.id);
      if (!tile) continue;
      (tile.w > 1 ? anchorDrift : singleDrift).push(Math.abs(tile.row - top - (ideal.get(work.id) ?? 0)));
    }
  });

  let timeBreaks = 0;
  for (const saga of SAGA_ORDER) {
    const inTear = (row: number) => row >= tearTop && row < modernTop;
    const line = tiles
      .filter((tile) => tile.w === 1 && !inTear(tile.row) && byId.get(tile.id)!.saga === saga)
      .sort((a, b) => a.row - b.row);
    let latest = -Infinity;
    let latestRow = -1;
    let carried = -Infinity;
    for (const tile of line) {
      if (tile.row !== latestRow) {
        carried = latest;
        latestRow = tile.row;
      }
      const year = byId.get(tile.id)!.sortYear;
      if (year < carried) timeBreaks++;
      latest = Math.max(latest, year);
    }
  }

  const rowsOfTiles = new Map<number, typeof tiles>();
  for (const tile of tiles) {
    if (tile.w > 1) continue;
    rowsOfTiles.set(tile.row, [...(rowsOfTiles.get(tile.row) ?? []), tile]);
  }
  let bandBreaks = 0;
  const edges = new Map<number, Map<number, [number, number]>>();
  for (const [row, line] of rowsOfTiles) {
    if (row >= tearTop && row < modernTop) continue;
    const ordered = [...line].sort((a, b) => a.x - b.x);
    const span = new Map<number, [number, number]>();
    ordered.forEach((tile, index) => {
      const saga = rank(tile.id);
      if (index > 0 && rank(ordered[index - 1].id) > saga) bandBreaks++;
      const seen = span.get(saga);
      span.set(saga, seen ? [seen[0], tile.x] : [tile.x, tile.x]);
    });
    edges.set(row, span);
  }
  const edgeMoves: number[] = [];
  for (const [row, span] of edges) {
    const next = edges.get(row + 1);
    if (!next) continue;
    for (const [saga, [start, end]] of span) {
      const after = next.get(saga);
      if (after) edgeMoves.push(Math.abs(after[0] - start), Math.abs(after[1] - end));
    }
  }

  return {
    width,
    height,
    tiles: tiles.length,
    overlaps,
    outOfBounds,
    holes,
    drift: { max: Math.max(0, ...singleDrift), p95: percentile(singleDrift, 0.95) },
    anchorDrift: { max: Math.max(0, ...anchorDrift) },
    timeBreaks,
    bandBreaks,
    bandEdge: { max: Math.max(0, ...edgeMoves), p95: percentile(edgeMoves, 0.95) },
    sagas: new Set(tiles.map((tile) => byId.get(tile.id)!.saga)).size,
    anchors: tiles.filter((tile) => tile.w > 1).length,
  };
}
