import type { Chronology, ChronographerId, Story } from '@/types/story';
import { resolveSaga, type SagaId } from './spindle';
import { storiesById } from './shelves';

/** The Eratosthenes-anchored spine: when an anchor carries several chronographers'
 *  dates, the layout reads the spine's year first (Eratosthenes → Parian → Eusebius).
 *  The other dates survive in the data as the dispute, but the geometry is one
 *  consistent spine so the tube doesn't shimmer between authorities. */
const SPINE_ORDER: ChronographerId[] = ['eratosthenes', 'marmor-parium', 'eusebius'];

/** Within a one-anchor saga, episodes fan a few years around the anchor by era
 *  order so they don't collapse to a single point (a lifetime's worth of spread). */
const SINGLE_ANCHOR_SLOPE = 18;

function pickYear(dates: { year: number; source: ChronographerId }[]): number {
  for (const src of SPINE_ORDER) {
    const hit = dates.find((d) => d.source === src);
    if (hit) return hit.year;
  }
  return dates[0].year;
}

/** Piecewise-linear era→year inside one saga's anchored control points, with
 *  gentle extrapolation past the ends so an unanchored episode still lands in a
 *  plausible decade rather than snapping onto the nearest anchor. */
function interpolate(era: number, cps: { era: number; year: number }[]): number {
  if (cps.length === 1) return cps[0].year + (era - cps[0].era) * SINGLE_ANCHOR_SLOPE;
  if (era <= cps[0].era) {
    const [a, b] = [cps[0], cps[1]];
    return a.year + (era - a.era) * ((b.year - a.year) / (b.era - a.era || 1));
  }
  const last = cps[cps.length - 1];
  if (era >= last.era) {
    const a = cps[cps.length - 2];
    return last.year + (era - last.era) * ((last.year - a.year) / (last.era - a.era || 1));
  }
  for (let i = 0; i < cps.length - 1; i += 1) {
    const a = cps[i];
    const b = cps[i + 1];
    if (era >= a.era && era <= b.era) {
      const t = (era - a.era) / (b.era - a.era || 1);
      return a.year + (b.year - a.year) * t;
    }
  }
  return last.year;
}

/** Maps every story to a BC year (negative) for the Spindle's chronology axis, or
 *  `null` for the timeless divine prologue — the cosmogony subtree, which no Greek
 *  chronographer dates (see docs/CHRONOLOGY.md). The mapping is per-saga: each
 *  cycle is a coherent lineage whose era order IS its chronological order, so its
 *  unanchored episodes interpolate between that saga's own dated anchors. (A global
 *  era→year curve would be meaningless — sagas overlap in era but not in year.) */
export function buildChronologyYears(
  stories: Story[],
  chronology: Chronology | null,
): Map<string, number | null> {
  const out = new Map<string, number | null>();
  if (!chronology) return out;
  const byId = storiesById(stories);

  // 1. The year each anchor pins to its stories (spine-first).
  const anchorYear = new Map<string, number>();
  for (const a of chronology.anchors) {
    if (a.dates.length === 0) continue;
    const year = pickYear(a.dates);
    for (const sid of a.stories) anchorYear.set(sid, year);
  }

  // 2. The timeless set = cosmogony and all its descendants (the divine prologue).
  const childrenOf = new Map<string, Story[]>();
  for (const s of stories) {
    if (!s.parent) continue;
    const list = childrenOf.get(s.parent) ?? [];
    list.push(s);
    childrenOf.set(s.parent, list);
  }
  const timeless = new Set<string>();
  const markTimeless = (id: string) => {
    if (timeless.has(id)) return;
    timeless.add(id);
    for (const kid of childrenOf.get(id) ?? []) markTimeless(kid.id);
  };
  if (byId.has('cosmogony')) markTimeless('cosmogony');

  // 3. Group by saga and interpolate each story from that saga's anchors.
  const bySaga = new Map<SagaId, Story[]>();
  for (const s of stories) {
    const saga = resolveSaga(s, byId);
    const list = bySaga.get(saga) ?? [];
    list.push(s);
    bySaga.set(saga, list);
  }

  for (const list of bySaga.values()) {
    const cps = list
      .filter((s) => anchorYear.has(s.id) && !timeless.has(s.id))
      .map((s) => ({ era: s.era, year: anchorYear.get(s.id)! }))
      .sort((a, b) => a.era - b.era);

    for (const s of list) {
      if (timeless.has(s.id)) out.set(s.id, null);
      else if (anchorYear.has(s.id)) out.set(s.id, anchorYear.get(s.id)!);
      else if (cps.length === 0) out.set(s.id, null);
      else out.set(s.id, Math.round(interpolate(s.era, cps)));
    }
  }

  return out;
}
