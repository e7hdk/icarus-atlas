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
