import type { Story } from '@/types/story';
import { storiesById } from './shelves';

/** The Myths time axis (docs/MYTHS_RIVER_PLAN.md §4): which myths are
 *  timeless, where an undated myth falls, and how real years blend with
 *  chronological rank — shared by the chronology and the River of Myth. */

/** The three divine reigns no Greek chronographer dates (docs/CHRONOLOGY.md). */
export const TIMELESS_ROOTS = ['cosmogony', 'reign-of-cronus', 'titanomachy'];

/** Blend of real chronographic years (1) and chronological rank (0): pure years
 *  crush the heroic age into a knot while millennia of deep past sit empty; rank
 *  alone forgets elapsed time. */
export const YEAR_BLEND = 0.4;

/** The ages the axis is divided into, each at the era it begins. */
export const AGE_BANDS: { era: number; label: string }[] = [
  { era: 0, label: 'Before the gods' },
  { era: 1, label: 'The war in heaven' },
  { era: 2, label: 'The first mortals' },
  { era: 4, label: "Ovid's changing forms" },
  { era: 5.5, label: 'The age of heroes' },
  { era: 7, label: 'The voyage and the quests' },
  { era: 8, label: 'The fall of Troy' },
  { era: 9, label: 'The long homecoming' },
];

/** The timeless divine prologue: the three reigns and every story under them. */
export function timelessStoryIds(stories: Story[]): Set<string> {
  const byId = storiesById(stories);
  const childrenOf = new Map<string, Story[]>();
  for (const s of stories) {
    if (!s.parent) continue;
    const list = childrenOf.get(s.parent) ?? [];
    list.push(s);
    childrenOf.set(s.parent, list);
  }
  const timeless = new Set<string>();
  const mark = (id: string) => {
    if (timeless.has(id)) return;
    timeless.add(id);
    for (const kid of childrenOf.get(id) ?? []) mark(kid.id);
  };
  for (const root of TIMELESS_ROOTS) if (byId.has(root)) mark(root);
  return timeless;
}

/** A global era → year curve drawn through the dated stories, so an undated
 *  myth still lands near its narrated moment: piecewise linear, flat past either
 *  end. Dated stories sharing an era keep the order they are given in. */
export function eraToYearCurve(
  stories: Story[],
  years: Map<string, number | null>,
): (era: number) => number {
  const dated = stories
    .filter((s) => years.get(s.id) != null)
    .map((s) => ({ era: s.era, year: years.get(s.id)! }))
    .sort((a, b) => a.era - b.era);
  return (era: number): number => {
    if (dated.length === 0) return 0;
    if (era <= dated[0].era) return dated[0].year;
    const last = dated[dated.length - 1];
    if (era >= last.era) return last.year;
    for (let i = 0; i < dated.length - 1; i += 1) {
      const a = dated[i];
      const b = dated[i + 1];
      if (era >= a.era && era <= b.era) {
        return a.year + ((b.year - a.year) * (era - a.era)) / (b.era - a.era || 1);
      }
    }
    return last.year;
  };
}

/* ------------------------- the River's normalized axis ------------------------- */

/** Share of the axis the timeless divine prologue — the source — takes. */
const SOURCE_SHARE = 0.1;
/** Clear axis between the source and the dated plain. */
const SOURCE_GAP = 0.02;
/** Axis left after the last dated star, for tails and open mouths. */
const END_ROOM = 0.06;
/** Room a meeting takes on the rank scale, in stories, when its two myths are
 *  near enough in the telling (a share of the roster) to touch: the crowded
 *  crossroads of the heroic age get room to draw together and part. */
const MEET_ROOM = 8;
const MEET_NEAR = 0.08;

export interface TimeAxis {
  /** Each story's place on the axis, 0 → 1 down time. */
  tOf: Map<string, number>;
  /** Where an era begins on the axis (for the age bands). */
  tOfEra: (era: number) => number;
}

/** The River's time axis, `t` running 0 → 1: the timeless prologue spread by era
 *  over the source share, the dated myths over the plain on the blended
 *  year/rank scale, with room on the rank scale for every meeting between myths
 *  near in the telling. `meetings` are sourced crossings between two streams. */
export function buildTimeAxis(
  stories: Story[],
  years: Map<string, number | null>,
  meetings: { a: string; b: string }[],
): TimeAxis {
  const timeless = timelessStoryIds(stories);
  for (const id of [...timeless]) if (years.get(id) != null) timeless.delete(id);
  const eraToYear = eraToYearCurve(stories, years);
  const yearOf = (s: Story) => years.get(s.id) ?? eraToYear(s.era);

  const plain = stories
    .filter((s) => !timeless.has(s.id))
    .sort((a, b) => yearOf(a) - yearOf(b) || a.era - b.era || a.id.localeCompare(b.id));
  const plainYears = plain.map(yearOf);
  const minYear = plainYears.length ? plainYears[0] : 0;
  const maxYear = plainYears.length ? plainYears[plainYears.length - 1] : 1;
  const plainStart = SOURCE_SHARE + SOURCE_GAP;
  const plainSpan = 1 - plainStart - END_ROOM;

  // The rank scale: every story is one step; a meeting between two myths near
  // in the telling adds MEET_ROOM steps between them.
  const index = new Map(plain.map((s, i) => [s.id, i]));
  const room = new Float64Array(plain.length + 1);
  for (const m of meetings) {
    const ia = index.get(m.a);
    const ib = index.get(m.b);
    if (ia === undefined || ib === undefined || Math.abs(ia - ib) > MEET_NEAR * plain.length) continue;
    room[Math.ceil((ia + ib) / 2)] += MEET_ROOM;
  }
  const steps = new Float64Array(plain.length);
  for (let i = 1; i < plain.length; i += 1) steps[i] = steps[i - 1] + 1 + room[i];
  const total = plain.length > 1 ? steps[plain.length - 1] : 1;
  const rankAt = (i: number) => steps[Math.min(plain.length - 1, Math.max(0, i))] / total;
  const rankOfYear = (year: number): number => {
    if (plain.length <= 1) return 0;
    let lo = 0;
    let hi = plain.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (plainYears[mid] < year) lo = mid + 1;
      else hi = mid;
    }
    return rankAt(lo);
  };
  const tOfYear = (year: number, rank: number) =>
    plainStart +
    plainSpan *
      (YEAR_BLEND * ((year - minYear) / (maxYear - minYear || 1)) + (1 - YEAR_BLEND) * rank);

  const tOf = new Map<string, number>();
  plain.forEach((s, i) => tOf.set(s.id, tOfYear(yearOf(s), rankAt(i))));

  const source = stories
    .filter((s) => timeless.has(s.id))
    .sort((a, b) => a.era - b.era || a.id.localeCompare(b.id));
  source.forEach((s, i) =>
    tOf.set(s.id, source.length > 1 ? (SOURCE_SHARE * i) / (source.length - 1) : 0),
  );
  const sourceEras = source.map((s) => s.era);
  const maxSourceEra = sourceEras.length ? Math.max(...sourceEras) : -Infinity;
  const minSourceEra = sourceEras.length ? Math.min(...sourceEras) : 0;

  const tOfEra = (era: number): number => {
    if (era <= maxSourceEra) {
      return (SOURCE_SHARE * (era - minSourceEra)) / (maxSourceEra - minSourceEra || 1);
    }
    const year = eraToYear(era);
    return tOfYear(year, rankOfYear(year));
  };
  return { tOf, tOfEra };
}
