import type { LensId } from '@/types/character';
import type { Story, StoryCrossing } from '@/types/story';
import { resolveSaga, SAGA_ACCENT, SAGA_ORDER, type SagaId } from './sagas';
import { storiesById } from './shelves';
import { AGE_BANDS, buildTimeAxis } from './timeAxis';

/** The River of Myth (docs/MYTHS_RIVER_PLAN.md) — the myths as a storyline of
 *  streams. Each saga is one stream and its stories are stars on it, in the
 *  order they happen; streams run side by side where sagas are concurrent,
 *  touch where a sourced crossing says the myths meet, and split only where
 *  the story splits (`forkChildren`). A single story that meets a saga flows
 *  into it as a tributary; myths too far apart in time to touch are tied by a
 *  thread of fate instead. Nothing bends without a cause: no helix, no random
 *  meander — a stream moves only to make room, to meet, or to fork.
 *
 *  The layout runs in stages: streams → meetings → their moments → lane order
 *  (one permutation per epoch) → lane positions (a projected relaxation) →
 *  output. Pure and deterministic: the same roster, in any order, always
 *  yields the same river. Coordinates are abstract: `t` runs 0 → 1 down time
 *  (the timeless divine source first), `y` is the lane offset in lane units. */

/* ------------------------------ tuning ------------------------------ */

/** Samples down the axis; every constraint is held at each of them. */
const SLICES = 480;
/** How far (axis t) a stream runs on past its last star, a return voyage past
 *  its fork, and an open myth before it dissolves. */
const TAIL = 0.012;
const DISTRIBUTARY_TAIL = 0.03;
const OPEN_TAIL = 0.05;
/** Width: the thinnest stream, and the swell per √(stories near in time) — a
 *  stream widens where its episodes crowd; DENSITY_SPAN (axis t) is "near". */
const MIN_WIDTH = 0.6;
const WIDTH = 0.9;
const DENSITY_SPAN = 0.025;
const TRICKLE_WIDTH = 0.3;
/** Slices over which a stream swells from its spring. */
const SPRING_SLICES = 6;
/** Clear water between neighbouring streams, beyond their half-widths. */
const MARGIN = 1.1;
/** Touching streams overlap a little, so a meeting reads as one current: their
 *  centres come to CONTACT × their half-widths, but a kiss never sinks deeper
 *  than KISS_DEPTH of the thinner stream — so a stream kissing both neighbours
 *  at once never lets those two touch each other. */
const CONTACT = 0.6;
const KISS_DEPTH = 0.45;
/** A fork's mouth: slices over which the distributaries open, how far along
 *  the opening their stars sit, and the water between sibling returns. */
const DELTA_SLICES = 32;
const FORK_STAR_SLICES = 24;
const SIBLING_MARGIN = 0.8;
/** A meeting is a kiss: the two streams draw together over this many slices,
 *  touch at the moment and part. Two meetings on one stream keep MEET_GAP
 *  slices apart, drifting up to MEET_DRIFT (axis t) to find the room. */
const KISS_SLICES = 14;
const MEET_GAP = 18;
const MEET_DRIFT = 0.03;
/** Longest gap (axis t) a stream crosses as a trickle to keep a meeting;
 *  further apart, the myths are tied by a thread of fate instead. */
const MAX_TRICKLE = 0.035;
/** A lone story meeting a longer myth flows into it this far (axis t)
 *  downstream of its own star. */
const TRIBUTARY_RUN: readonly [number, number] = [0.02, 0.06];
/** Slices before a change of lane order in which the two streams may pass
 *  through each other, so a pass is a long soft diagonal, not a step. */
const SWAP_WINDOW = 24;
/** Lane order search: what one stream standing between two meeting streams
 *  costs (a tributary's merge a little more, a fork's mouth far more), against
 *  one pass — two streams changing places between epochs; sweeps of the
 *  local searches. */
const MEET_WEIGHT = 3;
const MERGE_WEIGHT = 4;
const FORK_WEIGHT = 20;
const PASS_WEIGHT = 1;
/** Two returns of one fork trading places tangle the delta: far costlier. */
const SIBLING_PASS_WEIGHT = 4;
const ORDER_SWEEPS = 60;
const EPOCH_SWEEPS = 40;
/** Relaxation: passes that settle the lanes (tension only), then passes that
 *  round every bend (tension + stiffness); share of the way a sample moves. */
const SETTLE_PASSES = 300;
const ROUND_PASSES = 900;
const STIFFNESS = 5;
const SMOOTH = 0.5;

/* ------------------------------ output ------------------------------ */

export type StreamKind = 'saga' | 'distributary' | 'lone';

export interface RiverPoint {
  t: number;
  y: number;
  /** Width of the stream at this sample (lane units). */
  width: number;
  /** A faint stretch a stream runs only to keep a sourced meeting. */
  trickle: boolean;
}

export interface RiverStream {
  /** The story heading the stream. */
  id: string;
  saga: SagaId;
  color: string;
  kind: StreamKind;
  /** The stream a distributary leaves, and the story it forks at. */
  parentStream: string | null;
  forkAt: string | null;
  /** The fork a myth rises at, beside its distributaries (kept by a sourced
   *  meeting with the stream that ends there). */
  riseAt: string | null;
  /** The stream a tributary flows into and ends in. */
  mergeInto: string | null;
  open: boolean;
  /** Stories on the stream, in time order. */
  stars: string[];
  points: RiverPoint[];
}

export interface RiverStar {
  id: string;
  stream: string;
  t: number;
  y: number;
  /** The story that heads its stream (a saga's root, a distributary's return). */
  head: boolean;
  sources: LensId[];
}

/** Where two myths meet: a kiss between two streams, a tributary ending inside
 *  its partner, or a knot where a fork's mouth already joins them. */
export interface RiverConfluence {
  a: string;
  b: string;
  streams: [string, string];
  kind: 'kiss' | 'tributary' | 'knot';
  /** The moment the two streams touch, where its knot sits, and the stretch
   *  they draw together over (a single moment for a knot). */
  t: number;
  y: number;
  t1: number;
  t2: number;
  note: string;
  place?: string;
  sources: LensId[];
}

/** A crossing between myths that cannot touch: a thread of fate from one star
 *  to the other that bends no stream. */
export interface RiverBridge {
  a: string;
  b: string;
  /** Too far apart in time to touch, or kept apart by the streams between. */
  reason: 'far' | 'apart';
  note: string;
  place?: string;
  sources: LensId[];
}

/** Two streams changing places: they pass through each other over [t1, t2]. */
export interface RiverPass {
  a: string;
  b: string;
  t1: number;
  t2: number;
}

/** A fork's mouth: the stream that ends in it and the ones leaving it — its
 *  distributaries and any myth rising there — at the fork story's moment `t`;
 *  they leave one point at `t1` and are fully apart by `t2`. */
export interface RiverFork {
  at: string;
  stream: string;
  streams: string[];
  t: number;
  t1: number;
  t2: number;
}

export interface RiverAge {
  t: number;
  label: string;
}

export interface RiverLayout {
  streams: RiverStream[];
  stars: RiverStar[];
  byId: Map<string, RiverStar>;
  confluences: RiverConfluence[];
  bridges: RiverBridge[];
  passes: RiverPass[];
  forks: RiverFork[];
  /** Crossings between two stories of one stream: the stream already joins them. */
  unmet: StoryCrossing[];
  ages: RiverAge[];
  /** Lane extent, for framing. */
  yMin: number;
  yMax: number;
}

/* ------------------------------ helpers ------------------------------ */

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const smoothstep = (x: number) => {
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
};
const sliceOf = (t: number) => Math.round(clamp(t, 0, 1) * (SLICES - 1));
/** The slices a stretch of time covers, outward, so a stream's run always
 *  holds its stars. */
const sliceBelow = (t: number) => Math.floor(clamp(t, 0, 1) * (SLICES - 1) + 1e-9);
const sliceAbove = (t: number) => Math.ceil(clamp(t, 0, 1) * (SLICES - 1) - 1e-9);
const tAt = (k: number) => k / (SLICES - 1);
const byPair = (x: { a: string; b: string }, y: { a: string; b: string }) =>
  x.a.localeCompare(y.a) || x.b.localeCompare(y.b);

/** One slice's constraints between neighbouring lanes. `gaps[i]` is the least
 *  gap between lanes i and i+1 — exact where `tied[i]` (a kiss or a fork's
 *  mouth); `free[i]` marks two lanes passing each other, bound by the lanes
 *  around them (whose gaps to them `skip(i, j)` gives, i < j) and by `pass[i]`:
 *  how far lane i must already have crossed below lane i+1, ramping up to the
 *  full gap as the change of order comes. */
interface SliceGaps {
  gaps: Float64Array;
  tied: Uint8Array;
  free: Uint8Array;
  pass: Float64Array;
  skip: ((i: number, j: number) => number) | null;
}

/** Scratch buffers for the projection, sized for the busiest slice. */
interface Scratch {
  offset: Float64Array;
  unitStart: Int32Array;
  unitEnd: Int32Array;
  unitGap: Float64Array;
  unitTied: Uint8Array;
  cumulative: Float64Array;
  start: Int32Array;
  end: Int32Array;
  value: Float64Array;
  weight: Float64Array;
}

const scratchFor = (n: number): Scratch => ({
  offset: new Float64Array(n),
  unitStart: new Int32Array(n),
  unitEnd: new Int32Array(n),
  unitGap: new Float64Array(n),
  unitTied: new Uint8Array(n),
  cumulative: new Float64Array(n),
  start: new Int32Array(n),
  end: new Int32Array(n),
  value: new Float64Array(n),
  weight: new Float64Array(n),
});

/** Projects one slice in place onto the nearest positions (least squares) that
 *  keep its order and gaps. Lanes passing through each other form one rigid
 *  unit — free of each other, bound together by the lanes around them — so a
 *  pass never spills into a third stream; where a unit's lane is kissing the
 *  lane beyond, the other lanes of the unit wait outside the kiss. Pool-
 *  adjacent-violators over the units on position − cumulative gap, with tied
 *  runs pre-pooled so they move as one. */
function projectSlice(y: Float64Array, n: number, slice: SliceGaps, scratch: Scratch): void {
  const { gaps, tied, free, pass, skip } = slice;
  const { offset, unitStart, unitEnd, unitGap, unitTied, cumulative, start, end, value, weight } = scratch;
  let units = 0;
  for (let i = 0; i < n; ) {
    let j = i + 1;
    while (j < n && free[j - 1]) j += 1;
    unitStart[units] = i;
    unitEnd[units] = j;
    for (let m = i; m < j; m += 1) offset[m] = y[m] - y[i];
    // Passing lanes cross over as far as the pass has come.
    for (let m = i; m < j - 1; m += 1) {
      const short = pass[m] - (offset[m] - offset[m + 1]);
      if (short <= 0) continue;
      offset[m] += short / 2;
      offset[m + 1] -= short / 2;
    }
    units += 1;
    i = j;
  }
  for (let u = 0; u < units - 1; u += 1) {
    const a = unitEnd[u] - 1;
    const b = unitStart[u + 1];
    unitTied[u] = tied[a];
    if (tied[a]) {
      // A kiss across the boundary holds exactly; the unit's other lanes keep
      // clear of the kissing lane beyond it.
      if (skip) {
        for (let p = unitStart[u]; p < a; p += 1) {
          offset[p] = Math.min(offset[p], offset[a] + gaps[a] - skip(p, b));
        }
        for (let q = b + 1; q < unitEnd[u + 1]; q += 1) {
          offset[q] = Math.max(offset[q], offset[b] + skip(a, q) - gaps[a]);
        }
      }
      unitGap[u] = gaps[a] + offset[a] - offset[b];
      continue;
    }
    let gap = gaps[a] + offset[a] - offset[b];
    if (skip) {
      for (let p = unitStart[u]; p < unitEnd[u]; p += 1) {
        for (let q = b; q < unitEnd[u + 1]; q += 1) {
          if (p !== a || q !== b) gap = Math.max(gap, skip(p, q) + offset[p] - offset[q]);
        }
      }
    }
    unitGap[u] = gap;
  }
  cumulative[0] = 0;
  for (let u = 1; u < units; u += 1) cumulative[u] = cumulative[u - 1] + unitGap[u - 1];
  let blocks = 0;
  for (let u = 0; u < units; ) {
    let v = u + 1;
    while (v < units && unitTied[v - 1]) v += 1;
    let sum = 0;
    let members = 0;
    for (let w = u; w < v; w += 1) {
      for (let m = unitStart[w]; m < unitEnd[w]; m += 1) sum += y[m] - offset[m] - cumulative[w];
      members += unitEnd[w] - unitStart[w];
    }
    start[blocks] = u;
    end[blocks] = v;
    value[blocks] = sum / members;
    weight[blocks] = members;
    blocks += 1;
    // Pool backwards while the order is violated.
    while (blocks > 1 && value[blocks - 2] > value[blocks - 1]) {
      const p = blocks - 2;
      const q = blocks - 1;
      const w = weight[p] + weight[q];
      value[p] = (value[p] * weight[p] + value[q] * weight[q]) / w;
      weight[p] = w;
      end[p] = end[q];
      blocks -= 1;
    }
    u = v;
  }
  for (let k = 0; k < blocks; k += 1) {
    for (let u = start[k]; u < end[k]; u += 1) {
      const at = value[k] + cumulative[u];
      for (let m = unitStart[u]; m < unitEnd[u]; m += 1) y[m] = at + offset[m];
    }
  }
}

/* ------------------------------ streams ------------------------------ */

interface Draft {
  id: string;
  saga: SagaId;
  kind: StreamKind;
  parentStream: string | null;
  forkAt: string | null;
  open: boolean;
  members: Story[];
  /** Where the stream truly runs, and where it is drawn (trickles included). */
  start: number;
  end: number;
  reachStart: number;
  reachEnd: number;
  /** Its last star forks: the stream ends there, its water in the distributaries. */
  forkEnd: boolean;
  /** A myth rising where another stream forks (kept by a sourced meeting with
   *  it): it leaves the fork's mouth beside the distributaries. */
  riseAt: string | null;
  /** A tributary ends inside this stream. */
  mergeInto: string | null;
  /** Lane order key: legend order, then time. */
  key: number;
}

/** The stream each story flows on: a root heads one; a fork's child heads a
 *  distributary; every other story flows on its parent's stream — a
 *  sequential reach, not a branch. */
function streamResolver(byId: Map<string, Story>): (story: Story) => string {
  const streamOf = new Map<string, string>();
  const resolve = (s: Story): string => {
    const hit = streamOf.get(s.id);
    if (hit) return hit;
    const parent = s.parent ? byId.get(s.parent) : undefined;
    const id = !parent || parent.forkChildren ? s.id : resolve(parent);
    streamOf.set(s.id, id);
    return id;
  };
  return resolve;
}

/** A fork's children leave it at once: none may precede the fork (on the rank
 *  scale a same-year return can sort ahead of it), and each star is carried
 *  to where the delta has opened, so the returns share one moment. */
function carryForks(roster: Story[], childrenOf: Map<string, Story[]>, tOf: Map<string, number>): void {
  const lead = FORK_STAR_SLICES / (SLICES - 1);
  const carry = (s: Story, floor: number) => {
    const t = Math.max(tOf.get(s.id)!, floor);
    tOf.set(s.id, t);
    for (const kid of childrenOf.get(s.id) ?? []) carry(kid, t);
  };
  for (const parent of roster) {
    if (!parent.forkChildren) continue;
    for (const kid of childrenOf.get(parent.id) ?? []) carry(kid, tOf.get(parent.id)! + lead);
  }
}

/** Gathers the stories into streams and sets where each truly runs. */
function buildDrafts(
  roster: Story[],
  byId: Map<string, Story>,
  childrenOf: Map<string, Story[]>,
  tOf: Map<string, number>,
  resolveStream: (story: Story) => string,
): Map<string, Draft> {
  const drafts = new Map<string, Draft>();
  for (const s of roster) {
    const id = resolveStream(s);
    let draft = drafts.get(id);
    if (!draft) {
      const head = byId.get(id)!;
      const fork = head.parent ? byId.get(head.parent) ?? null : null;
      draft = {
        id,
        saga: resolveSaga(head, byId),
        kind: fork ? 'distributary' : 'saga',
        parentStream: fork ? resolveStream(fork) : null,
        forkAt: fork ? fork.id : null,
        open: head.open === true,
        members: [],
        start: 0,
        end: 0,
        reachStart: 0,
        reachEnd: 0,
        forkEnd: false,
        riseAt: null,
        mergeInto: null,
        key: 0,
      };
      drafts.set(id, draft);
    }
    draft.members.push(s);
  }
  for (const d of drafts.values()) {
    d.members.sort((a, b) => tOf.get(a.id)! - tOf.get(b.id)! || a.id.localeCompare(b.id));
    const first = tOf.get(d.members[0].id)!;
    const lastStory = d.members[d.members.length - 1];
    const last = tOf.get(lastStory.id)!;
    d.forkEnd = lastStory.forkChildren === true && childrenOf.has(lastStory.id);
    d.start = d.forkAt ? tOf.get(d.forkAt)! : first;
    d.end = d.forkEnd ? last : last + (d.open ? OPEN_TAIL : d.forkAt ? DISTRIBUTARY_TAIL : TAIL);
    if (d.kind === 'saga' && d.members.length === 1 && !childrenOf.has(d.id)) d.kind = 'lone';
    d.reachStart = d.start;
    d.reachEnd = d.end;
  }
  return drafts;
}

/* ------------------------------ meetings ------------------------------ */

interface Meeting {
  crossing: StoryCrossing;
  a: string;
  b: string;
  /** Preferred moment and the range it may drift in (axis t). */
  pref: number;
  lo: number;
  hi: number;
  /** The lone story flowing into the other stream, if this is a tributary. */
  tributary: string | null;
  /** The meeting slice, and the kiss window around it. */
  k: number;
  k1: number;
  k2: number;
  /** The tributary ends here. */
  merge: boolean;
  /** A fork's mouth already joins the two streams: a knot, no kiss. */
  knotOnly: boolean;
}

const bridgeOf = (crossing: StoryCrossing, reason: RiverBridge['reason']): RiverBridge => ({
  a: crossing.a,
  b: crossing.b,
  reason,
  note: crossing.note,
  ...(crossing.place ? { place: crossing.place } : {}),
  sources: crossing.sources as LensId[],
});

/** Turns each sourced crossing into a meeting — a kiss between myths running
 *  at the same time, a tributary for a lone story, a trickle across a short
 *  gap in time — or else a thread of fate; a crossing within one stream is
 *  left unmet, the stream already joins its two stories. */
function buildMeetings(
  crossings: StoryCrossing[],
  byId: Map<string, Story>,
  drafts: Map<string, Draft>,
  tOf: Map<string, number>,
  resolveStream: (story: Story) => string,
): { meetings: Meeting[]; bridges: RiverBridge[]; unmet: StoryCrossing[] } {
  const meetings: Meeting[] = [];
  const bridges: RiverBridge[] = [];
  const unmet: StoryCrossing[] = [];
  for (const crossing of crossings) {
    const sa = byId.get(crossing.a);
    const sb = byId.get(crossing.b);
    if (!sa || !sb) continue;
    const a = resolveStream(sa);
    const b = resolveStream(sb);
    if (a === b) {
      unmet.push(crossing);
      continue;
    }
    const da = drafts.get(a)!;
    const db = drafts.get(b)!;
    const pref = (tOf.get(sa.id)! + tOf.get(sb.id)!) / 2;
    const meeting = (lo: number, hi: number, tributary: string | null): Meeting => ({
      crossing,
      a,
      b,
      pref: clamp(pref, lo, hi),
      lo,
      hi,
      tributary,
      k: 0,
      k1: 0,
      k2: 0,
      merge: false,
      knotOnly: da.parentStream === b || db.parentStream === a,
    });
    const lone = da.kind === 'lone' && db.kind !== 'lone' ? da : db.kind === 'lone' && da.kind !== 'lone' ? db : null;
    if (lone) {
      const other = lone === da ? db : da;
      const star = tOf.get(lone.id)!;
      const lo = Math.max(star + TRIBUTARY_RUN[0], other.start);
      const hi = Math.min(star + TRIBUTARY_RUN[1], other.end);
      if (lo <= hi) {
        meetings.push(meeting(lo, hi, lone.id));
        continue;
      }
    }
    const from = Math.max(da.start, db.start);
    const to = Math.min(da.end, db.end);
    if (from <= to) {
      const at = clamp(pref, from, to);
      meetings.push(meeting(Math.max(from, at - MEET_DRIFT), Math.min(to, at + MEET_DRIFT), null));
      continue;
    }
    const [early, late] = da.end < db.start ? [da, db] : [db, da];
    if (late.start - early.end > MAX_TRICKLE) {
      bridges.push(bridgeOf(crossing, 'far'));
      continue;
    }
    // The later stream rises early as a trickle — or, since a distributary
    // cannot exist before its fork, the earlier one runs on. Rising where the
    // earlier stream forks, it leaves the fork's mouth with the distributaries.
    const at = late.forkAt ? late.start : early.end;
    if (late.forkAt) early.reachEnd = Math.max(early.reachEnd, at);
    else late.reachStart = Math.min(late.reachStart, at);
    const rise = meeting(at, at, null);
    if (!late.forkAt && early.forkEnd && !late.riseAt) {
      late.riseAt = early.members[early.members.length - 1].id;
      rise.knotOnly = true;
    }
    meetings.push(rise);
  }
  return { meetings, bridges, unmet };
}

/** Sets each meeting's slice: the most constrained first, each at the slice
 *  nearest its moment that keeps MEET_GAP from the other meetings of both
 *  streams. */
function scheduleMeetings(meetings: Meeting[]): void {
  const taken = new Map<string, number[]>();
  const schedule = [...meetings].sort(
    (m, n) =>
      m.hi - m.lo - (n.hi - n.lo) ||
      m.pref - n.pref ||
      m.crossing.a.localeCompare(n.crossing.a) ||
      m.crossing.b.localeCompare(n.crossing.b),
  );
  for (const m of schedule) {
    const want = sliceOf(m.pref);
    const from = Math.min(want, Math.ceil(m.lo * (SLICES - 1) - 1e-6));
    const to = Math.max(want, Math.floor(m.hi * (SLICES - 1) + 1e-6));
    const busy = m.knotOnly ? [] : [...(taken.get(m.a) ?? []), ...(taken.get(m.b) ?? [])];
    let best = want;
    let bestScore = -Infinity;
    for (let k = from; k <= to; k += 1) {
      const room = busy.reduce((r, o) => Math.min(r, Math.abs(o - k)), MEET_GAP);
      const score = room * 1000 - Math.abs(k - want);
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
    m.k = best;
    if (m.knotOnly) continue;
    for (const id of [m.a, m.b]) taken.set(id, [...(taken.get(id) ?? []), best]);
  }
}

/** A tributary ends at its last meeting, inside that partner. */
function endTributaries(drafts: Map<string, Draft>, meetings: Meeting[]): void {
  for (const d of drafts.values()) {
    if (d.kind !== 'lone') continue;
    const own = meetings.filter((m) => m.tributary === d.id).sort((m, n) => n.k - m.k);
    if (own.length === 0) continue;
    const last = own[0];
    last.merge = true;
    d.mergeInto = last.a === d.id ? last.b : last.a;
    d.end = tAt(last.k);
    d.reachEnd = d.end;
  }
}

/** The slices each stream is drawn over, trickles included. */
interface Spans {
  first: Map<string, number>;
  last: Map<string, number>;
}

function streamSpans(drafts: Map<string, Draft>): Spans {
  const first = new Map<string, number>();
  const last = new Map<string, number>();
  for (const d of drafts.values()) {
    d.reachStart = Math.min(d.reachStart, d.start);
    d.reachEnd = Math.max(d.reachEnd, d.end);
    first.set(d.id, sliceBelow(d.reachStart));
    last.set(d.id, sliceAbove(d.reachEnd));
  }
  return { first, last };
}

/** Whether a stream truly runs at a slice — outside it only trickles. */
const runs = (d: Draft, k: number) => k >= sliceBelow(d.start) && k <= sliceAbove(d.end);

/** Kiss windows, split midway where two meetings share a stream's approach. */
function setKissWindows(ties: Meeting[], drafts: Map<string, Draft>, spans: Spans): void {
  for (const m of ties) {
    const lo = Math.max(spans.first.get(m.a)!, spans.first.get(m.b)!);
    const hi = Math.min(spans.last.get(m.a)!, spans.last.get(m.b)!);
    m.k = clamp(m.k, lo, hi);
    m.k1 = Math.max(lo, m.k - KISS_SLICES);
    m.k2 = m.merge ? m.k : Math.min(hi, m.k + KISS_SLICES);
  }
  for (const d of drafts.values()) {
    const own = ties
      .filter((m) => m.a === d.id || m.b === d.id)
      .sort((m, n) => m.k - n.k || byPair(m.crossing, n.crossing));
    for (let i = 1; i < own.length; i += 1) {
      const p = own[i - 1];
      const q = own[i];
      if (p.k === q.k || p.k2 < q.k1) continue;
      const mid = Math.floor((p.k + q.k) / 2);
      p.k2 = Math.min(p.k2, mid);
      q.k1 = Math.max(q.k1, mid + 1);
    }
  }
}

/** Widths: a stream swells where its episodes crowd, rises thin at its spring
 *  (or its fork's mouth) and thins into its end. */
function streamWidths(drafts: Map<string, Draft>, tOf: Map<string, number>, spans: Spans): Map<string, Float64Array> {
  const widths = new Map<string, Float64Array>();
  for (const d of drafts.values()) {
    const w = new Float64Array(SLICES).fill(Number.NaN);
    const ks = sliceBelow(d.start);
    const ke = sliceAbove(d.end);
    const rise = d.forkAt ? DELTA_SLICES : SPRING_SLICES;
    const fade = d.forkEnd
      ? 0
      : d.mergeInto
        ? KISS_SLICES
        : Math.max(3, ke - sliceOf(tOf.get(d.members[d.members.length - 1].id)!));
    for (let k = spans.first.get(d.id)!; k <= spans.last.get(d.id)!; k += 1) {
      if (!runs(d, k)) {
        w[k] = TRICKLE_WIDTH;
        continue;
      }
      const t = tAt(k);
      let density = 0;
      for (const s of d.members) {
        const dt = (t - tOf.get(s.id)!) / DENSITY_SPAN;
        density += Math.exp(-0.5 * dt * dt);
      }
      let width = MIN_WIDTH + WIDTH * Math.sqrt(density);
      width *= 0.35 + 0.65 * smoothstep((k - ks) / rise);
      if (fade > 0) width *= 0.25 + 0.75 * smoothstep((ke - k) / fade);
      w[k] = width;
    }
    widths.set(d.id, w);
  }
  return widths;
}

/* ------------------------------ lane order ------------------------------ */

/** A fork's mouth: the stream ending there and the ones leaving it. */
interface Mouth {
  fork: string;
  parent: string;
  members: string[];
  k: number;
}

interface LaneOrder {
  /** Per slice, the running streams top to bottom (indices into the streams). */
  orders: Int32Array[];
  /** Meetings whose two streams are neighbours at their moment. */
  reached: Set<Meeting>;
  /** Pairs of streams changing places from slice `tau` to `tau + 1`. */
  passes: { a: number; b: number; tau: number }[];
}

/** One stream standing between members of a group: what the order searches
 *  count and weigh. */
interface Want {
  group: Set<number>;
  weight: number;
  active: number[];
}

function apart(pos: Int32Array, want: Want): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of want.group) {
    const p = pos[s];
    if (p < 0) continue;
    lo = Math.min(lo, p);
    hi = Math.max(hi, p);
  }
  let n = 0;
  for (const s of want.active) {
    if (want.group.has(s)) continue;
    const p = pos[s];
    if (p >= 0 && p > lo && p < hi) n += 1;
  }
  return n;
}

const fillPositions = (pos: Int32Array, perm: number[]) => {
  pos.fill(-1);
  perm.forEach((s, i) => (pos[s] = i));
};

/** Orders the lanes. One permutation of every stream is searched first, so
 *  that as few streams as possible stand between two that meet and none
 *  inside a fork's mouth, legend order breaking ties. It seeds a permutation
 *  per epoch — the stretch of time around each meeting or mouth — and the
 *  epochs are searched together: a stream in the way of a meeting costs its
 *  weight, two streams changing places between epochs cost a pass. Each slice
 *  shows its epoch's permutation filtered to the streams running there. */
function orderLanes(streams: Draft[], ties: Meeting[], mouths: Mouth[], spans: Spans, sibling: (x: number, y: number) => boolean): LaneOrder {
  const index = new Map(streams.map((d, i) => [d.id, i]));
  const first = Int32Array.from(streams, (d) => spans.first.get(d.id)!);
  const last = Int32Array.from(streams, (d) => spans.last.get(d.id)!);
  const isActive = (s: number, k: number) => first[s] <= k && k <= last[s];
  const activeAt = (k: number) => streams.map((_, s) => s).filter((s) => isActive(s, k));
  const pairOf = (m: Meeting) => new Set([index.get(m.a)!, index.get(m.b)!]);

  // The seed: one permutation of every stream.
  const requests: Want[] = [];
  for (const m of ties) {
    requests.push({ group: pairOf(m), weight: m.merge ? MERGE_WEIGHT : MEET_WEIGHT, active: activeAt(m.k) });
  }
  for (const mouth of mouths) {
    const group = new Set([mouth.parent, ...mouth.members].map((id) => index.get(id)!));
    requests.push({ group, weight: FORK_WEIGHT, active: activeAt(mouth.k) });
  }
  const byKey = streams
    .map((_, s) => s)
    .sort((x, y) => streams[x].key - streams[y].key || streams[x].id.localeCompare(streams[y].id));
  const concurrent: [number, number][] = [];
  for (let i = 0; i < byKey.length; i += 1) {
    for (let j = i + 1; j < byKey.length; j += 1) {
      const [x, y] = [byKey[i], byKey[j]];
      if (first[x] <= last[y] && first[y] <= last[x]) concurrent.push([x, y]);
    }
  }
  const seedPos = new Int32Array(streams.length);
  const seedCost = (perm: number[]): number => {
    fillPositions(seedPos, perm);
    let cost = 0;
    for (const r of requests) cost += r.weight * apart(seedPos, r);
    let inversions = 0;
    for (const [x, y] of concurrent) if (seedPos[x] > seedPos[y]) inversions += 1;
    return cost + inversions * 1e-3;
  };
  const perm = [...byKey];
  let permCost = seedCost(perm);
  for (let sweep = 0; sweep < ORDER_SWEEPS; sweep += 1) {
    let moved = false;
    for (const s of [...perm]) {
      const from = perm.indexOf(s);
      perm.splice(from, 1);
      let best = from;
      for (let at = 0; at <= perm.length; at += 1) {
        if (at === from) continue;
        perm.splice(at, 0, s);
        const cost = seedCost(perm);
        perm.splice(at, 1);
        if (cost < permCost - 1e-9) {
          permCost = cost;
          best = at;
        }
      }
      perm.splice(best, 0, s);
      if (best !== from) moved = true;
    }
    if (!moved) break;
  }

  // The epochs, bounded midway between consecutive meetings and mouths.
  const decisions = [...new Set([...ties.map((m) => m.k), ...mouths.map((mouth) => mouth.k)])].sort((a, b) => a - b);
  const bounds = decisions.slice(1).map((k, i) => Math.floor((decisions[i] + k) / 2));
  bounds.push(SLICES - 1);
  const epochAt = new Int32Array(SLICES);
  for (let k = 0, j = 0; k < SLICES; k += 1) {
    while (k > bounds[j]) j += 1;
    epochAt[k] = j;
  }
  const perms = bounds.map((end, j) => {
    const begin = j === 0 ? 0 : bounds[j - 1] + 1;
    return perm.filter((s) => first[s] <= end && last[s] >= begin);
  });
  // What each epoch must satisfy: the meeting slice and the edges of its kiss,
  // and every fork's mouth.
  const wants: Want[][] = bounds.map(() => []);
  for (const m of ties) {
    const weight = m.merge ? MERGE_WEIGHT : MEET_WEIGHT;
    const at = new Map<number, number>([
      [m.k1, 0.5],
      [m.k2, 0.5],
      [m.k, 1],
    ]);
    for (const [k, share] of at) wants[epochAt[k]].push({ group: pairOf(m), weight: weight * share, active: activeAt(k) });
  }
  for (const mouth of mouths) {
    const group = new Set([mouth.parent, ...mouth.members].map((id) => index.get(id)!));
    wants[epochAt[mouth.k]].push({ group, weight: FORK_WEIGHT, active: activeAt(mouth.k) });
  }
  const pos = perms.map((p) => {
    const at = new Int32Array(streams.length);
    fillPositions(at, p);
    return at;
  });
  const passesAt = (j: number): number => {
    const tau = bounds[j];
    const next = pos[j + 1];
    const both = perms[j].filter((s) => isActive(s, tau) && isActive(s, tau + 1) && next[s] >= 0);
    let cost = 0;
    for (let x = 0; x < both.length; x += 1) {
      for (let y = x + 1; y < both.length; y += 1) {
        if (next[both[x]] < next[both[y]]) continue;
        cost += sibling(both[x], both[y]) ? SIBLING_PASS_WEIGHT : 1;
      }
    }
    return cost;
  };
  const localCost = (j: number): number => {
    let cost = 0;
    for (const want of wants[j]) cost += want.weight * apart(pos[j], want);
    if (j > 0) cost += PASS_WEIGHT * passesAt(j - 1);
    if (j < perms.length - 1) cost += PASS_WEIGHT * passesAt(j);
    return cost;
  };
  for (let sweep = 0; sweep < EPOCH_SWEEPS; sweep += 1) {
    let moved = false;
    for (let j = 0; j < perms.length; j += 1) {
      const p = perms[j];
      for (const s of [...p]) {
        const from = p.indexOf(s);
        let best = from;
        let bestCost = localCost(j);
        p.splice(from, 1);
        for (let at = 0; at <= p.length; at += 1) {
          if (at === from) continue;
          p.splice(at, 0, s);
          fillPositions(pos[j], p);
          const cost = localCost(j);
          p.splice(at, 1);
          if (cost < bestCost - 1e-9) {
            bestCost = cost;
            best = at;
          }
        }
        p.splice(best, 0, s);
        fillPositions(pos[j], p);
        if (best !== from) moved = true;
      }
    }
    if (!moved) break;
  }

  const orders = Array.from({ length: SLICES }, (_, k) =>
    Int32Array.from(perms[epochAt[k]].filter((s) => isActive(s, k))),
  );
  const reached = new Set(
    ties.filter((m) => {
      const order = orders[m.k];
      return Math.abs(order.indexOf(index.get(m.a)!) - order.indexOf(index.get(m.b)!)) === 1;
    }),
  );
  const passes: LaneOrder['passes'] = [];
  for (let j = 0; j < perms.length - 1; j += 1) {
    const tau = bounds[j];
    const next = pos[j + 1];
    const both = perms[j].filter((s) => isActive(s, tau) && isActive(s, tau + 1) && next[s] >= 0);
    for (let x = 0; x < both.length; x += 1) {
      for (let y = x + 1; y < both.length; y += 1) {
        if (next[both[x]] > next[both[y]]) passes.push({ a: both[x], b: both[y], tau });
      }
    }
  }
  return { orders, reached, passes };
}

/* ------------------------------ lane positions ------------------------------ */

/** Positions: each pass smooths every stream along time — tension first, then
 *  stiffness to round the bends — and projects each slice back onto its order
 *  and gaps. Returns y per stream and slice, `NaN` where a stream is not
 *  drawn. */
function relaxLanes(first: Int32Array, last: Int32Array, orders: Int32Array[], gaps: SliceGaps[]): Float64Array[] {
  const ys = Array.from(first, () => new Float64Array(SLICES).fill(Number.NaN));
  orders.forEach((order, k) => {
    let at = 0;
    const raw = Array.from(order, (_, i) => (i === 0 ? 0 : (at += gaps[k].gaps[i - 1])));
    const mid = raw.length ? (raw[0] + raw[raw.length - 1]) / 2 : 0;
    order.forEach((s, i) => (ys[s][k] = raw[i] - mid));
  });
  const busiest = orders.reduce((n, order) => Math.max(n, order.length), 1);
  const scratch = scratchFor(busiest);
  const slice = new Float64Array(busiest);

  const relax = (passes: number, stiffness: number) => {
    for (let pass = 0; pass < passes; pass += 1) {
      for (let s = 0; s < ys.length; s += 1) {
        const y = ys[s];
        const from = first[s];
        const to = last[s];
        for (let k = from; k <= to; k += 1) {
          const l1 = k > from ? y[k - 1] : Number.NaN;
          const r1 = k < to ? y[k + 1] : Number.NaN;
          let target: number;
          if (Number.isNaN(l1) && Number.isNaN(r1)) continue;
          if (Number.isNaN(l1)) target = r1;
          else if (Number.isNaN(r1)) target = l1;
          else if (stiffness > 0 && k - 2 >= from && k + 2 <= to) {
            target = (l1 + r1 + stiffness * (4 * (l1 + r1) - y[k - 2] - y[k + 2])) / (2 + 6 * stiffness);
          } else {
            target = (l1 + r1) / 2;
          }
          y[k] += SMOOTH * (target - y[k]);
        }
      }
      let total = 0;
      let count = 0;
      for (let k = 0; k < SLICES; k += 1) {
        const order = orders[k];
        const n = order.length;
        for (let i = 0; i < n; i += 1) slice[i] = ys[order[i]][k];
        projectSlice(slice, n, gaps[k], scratch);
        for (let i = 0; i < n; i += 1) {
          ys[order[i]][k] = slice[i];
          total += slice[i];
          count += 1;
        }
      }
      // Hold the whole river centred on the axis.
      const mean = count ? total / count : 0;
      for (const y of ys) for (let k = 0; k < SLICES; k += 1) if (!Number.isNaN(y[k])) y[k] -= mean;
    }
  };
  relax(SETTLE_PASSES, 0);
  relax(ROUND_PASSES, STIFFNESS);
  return ys;
}

/* ------------------------------ the river ------------------------------ */

export function buildRiverLayout(
  stories: Story[],
  years: Map<string, number | null>,
  crossings: StoryCrossing[],
): RiverLayout {
  // One canonical order in, so any order of the same roster gives one river
  // (stories sharing an era keep their title order, as the loader gives them).
  const roster = [...stories].sort(
    (a, b) => a.era - b.era || a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
  );
  const links = [...crossings].sort(byPair);
  const byId = storiesById(roster);
  const childrenOf = new Map<string, Story[]>();
  for (const s of roster) {
    if (!s.parent || !byId.has(s.parent)) continue;
    const list = childrenOf.get(s.parent) ?? [];
    list.push(s);
    childrenOf.set(s.parent, list);
  }
  const resolveStream = streamResolver(byId);
  const between = links.filter((c) => {
    const a = byId.get(c.a);
    const b = byId.get(c.b);
    return a && b && resolveStream(a) !== resolveStream(b);
  });
  const { tOf, tOfEra } = buildTimeAxis(roster, years, between);
  carryForks(roster, childrenOf, tOf);

  const drafts = buildDrafts(roster, byId, childrenOf, tOf, resolveStream);
  const { meetings, bridges, unmet } = buildMeetings(links, byId, drafts, tOf, resolveStream);
  scheduleMeetings(meetings);
  endTributaries(drafts, meetings);
  const spans = streamSpans(drafts);
  const ties = meetings.filter((m) => !m.knotOnly);
  setKissWindows(ties, drafts, spans);
  const widths = streamWidths(drafts, tOf, spans);

  // Lane order keys: legend order, then time; a fork's mouth — its parent, the
  // distributaries and any myth rising there — keeps together behind its parent.
  const streams = [...drafts.values()].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  for (const d of streams) d.key = SAGA_ORDER.indexOf(d.saga) * 10 + d.start;
  const bornAt = (d: Draft) => d.forkAt ?? d.riseAt;
  const parentOfFork = (fork: string) => resolveStream(byId.get(fork)!);
  const forkGroups = new Map<string, Draft[]>();
  for (const d of streams) {
    const fork = bornAt(d);
    if (!fork) continue;
    const list = forkGroups.get(fork) ?? [];
    list.push(d);
    forkGroups.set(fork, list);
  }
  const mouths: Mouth[] = [];
  for (const [fork, siblings] of forkGroups) {
    siblings.sort((a, b) => a.id.localeCompare(b.id));
    const parent = parentOfFork(fork);
    const parentKey = drafts.get(parent)!.key;
    siblings.forEach((d, i) => (d.key = parentKey + (i + 1) * 1e-4));
    mouths.push({ fork, parent, members: siblings.map((d) => d.id), k: sliceOf(tOf.get(fork)!) });
  }
  const sibling = (x: number, y: number) => {
    const fx = bornAt(streams[x]);
    return fx !== null && fx === bornAt(streams[y]);
  };
  const { orders, reached, passes } = orderLanes(streams, ties, mouths, spans, sibling);
  for (const m of ties) {
    if (reached.has(m)) continue;
    bridges.push(bridgeOf(m.crossing, 'apart'));
    // An unreached tributary keeps its own short course.
    if (m.merge) drafts.get(m.tributary!)!.mergeInto = null;
  }

  // Gaps between neighbours: a kiss while two streams meet, a fork's mouth
  // opening from one point, clear water otherwise; before a change of order the
  // two streams changing places may pass through each other.
  const index = new Map(streams.map((d, i) => [d.id, i]));
  const pairKey = (x: number, y: number) => (x < y ? x * streams.length + y : y * streams.length + x);
  const tieAt = Array.from({ length: SLICES }, () => new Map<number, Meeting>());
  for (const m of reached) {
    for (let k = m.k1; k <= m.k2; k += 1) tieAt[k].set(pairKey(index.get(m.a)!, index.get(m.b)!), m);
  }
  // A pass begins once the pair's own last kiss before it has ended.
  const passing = Array.from({ length: SLICES }, () => new Map<number, { from: number; to: number }>());
  const passWindows = passes.map(({ a, b, tau }) => {
    let from = Math.max(0, tau + 1 - SWAP_WINDOW);
    for (const m of reached) {
      const pair = [index.get(m.a)!, index.get(m.b)!];
      if (pair.includes(a) && pair.includes(b) && m.k2 <= tau) from = Math.max(from, m.k2 + 1);
    }
    for (let w = from; w <= tau; w += 1) passing[w].set(pairKey(a, b), { from, to: tau + 1 });
    return { a, b, from, to: tau + 1 };
  });
  const mouthOf = (x: Draft, y: Draft): number | null => {
    const fx = bornAt(x);
    const fy = bornAt(y);
    const fork = fx && (fx === fy || parentOfFork(fx) === y.id) ? fx : fy && parentOfFork(fy) === x.id ? fy : null;
    return fork ? sliceOf(tOf.get(fork)!) : null;
  };
  const gapFor = (upper: number, lower: number, k: number): { gap: number; tied: boolean } => {
    const du = streams[upper];
    const dl = streams[lower];
    const half = (widths.get(du.id)![k] + widths.get(dl.id)![k]) / 2;
    const normal = half + MARGIN;
    const tie = tieAt[k].get(pairKey(upper, lower));
    if (tie) {
      if (tie.merge) {
        const span = Math.max(1, tie.k - tie.k1);
        return { gap: normal * (1 - smoothstep((k - tie.k1) / span)), tied: true };
      }
      const span = k <= tie.k ? tie.k - tie.k1 : tie.k2 - tie.k;
      const x = span > 0 ? Math.abs(k - tie.k) / span : 0;
      const thinner = Math.min(widths.get(du.id)![k], widths.get(dl.id)![k]);
      const contact = half - Math.min(half * (1 - CONTACT), thinner * KISS_DEPTH);
      return { gap: contact + (normal - contact) * smoothstep(x), tied: true };
    }
    const mouth = mouthOf(du, dl);
    if (mouth !== null) {
      const open = smoothstep((k - mouth) / DELTA_SLICES);
      if (open <= 0) return { gap: 0, tied: true };
      return { gap: (half + SIBLING_MARGIN) * open, tied: false };
    }
    return { gap: normal, tied: false };
  };
  const gaps: SliceGaps[] = orders.map((order, k) => {
    const n = Math.max(0, order.length - 1);
    const out: SliceGaps = {
      gaps: new Float64Array(n),
      tied: new Uint8Array(n),
      free: new Uint8Array(n),
      pass: new Float64Array(n).fill(-Infinity),
      skip: null,
    };
    for (let i = 0; i < n; i += 1) {
      const { gap, tied } = gapFor(order[i], order[i + 1], k);
      out.gaps[i] = gap;
      out.tied[i] = tied ? 1 : 0;
      const window = passing[k].get(pairKey(order[i], order[i + 1]));
      if (tied || window === undefined) continue;
      // From a full gap on one side to a full gap on the other.
      out.free[i] = 1;
      out.pass[i] = gap * (2 * smoothstep((k - window.from) / (window.to - window.from)) - 1);
    }
    if (out.free.includes(1)) out.skip = (i, j) => gapFor(order[i], order[j], k).gap;
    return out;
  });
  const first = Int32Array.from(streams, (d) => spans.first.get(d.id)!);
  const last = Int32Array.from(streams, (d) => spans.last.get(d.id)!);
  const ys = relaxLanes(first, last, orders, gaps);

  /* --- Output. */
  const yAt = (id: string, t: number): number => {
    const s = index.get(id)!;
    const y = ys[s];
    const exact = clamp(t, 0, 1) * (SLICES - 1);
    const k0 = clamp(Math.floor(exact), first[s], last[s]);
    const k1 = clamp(k0 + 1, first[s], last[s]);
    const f = clamp(exact - k0, 0, 1);
    return y[k0] + (y[k1] - y[k0]) * f;
  };

  let yMin = Infinity;
  let yMax = -Infinity;
  const riverStreams: RiverStream[] = streams.map((d, s) => {
    const y = ys[s];
    const w = widths.get(d.id)!;
    const points: RiverPoint[] = [];
    for (let k = first[s]; k <= last[s]; k += 1) {
      const t = tAt(k);
      points.push({ t, y: y[k], width: w[k], trickle: !runs(d, k) });
      yMin = Math.min(yMin, y[k] - w[k] / 2);
      yMax = Math.max(yMax, y[k] + w[k] / 2);
    }
    return {
      id: d.id,
      saga: d.saga,
      color: SAGA_ACCENT[d.saga],
      kind: d.kind,
      parentStream: d.parentStream,
      forkAt: d.forkAt,
      riseAt: d.riseAt,
      mergeInto: d.mergeInto,
      open: d.open,
      stars: d.members.map((story) => story.id),
      points,
    };
  });

  const riverStars: RiverStar[] = [];
  for (const d of streams) {
    for (const story of d.members) {
      const t = tOf.get(story.id)!;
      riverStars.push({
        id: story.id,
        stream: d.id,
        t,
        y: yAt(d.id, t),
        head: story.id === d.id,
        sources: story.summary.sources as LensId[],
      });
    }
  }

  const confluences: RiverConfluence[] = meetings
    .filter((m) => m.knotOnly || reached.has(m))
    .map((m): RiverConfluence => {
      const t = tAt(m.k);
      const into = m.merge ? drafts.get(m.tributary!)!.mergeInto : null;
      return {
        a: m.crossing.a,
        b: m.crossing.b,
        streams: [m.a, m.b],
        kind: m.knotOnly ? 'knot' : m.merge ? 'tributary' : 'kiss',
        t,
        y: into ? yAt(into, t) : (yAt(m.a, t) + yAt(m.b, t)) / 2,
        t1: m.knotOnly ? t : tAt(m.k1),
        t2: m.knotOnly ? t : tAt(m.k2),
        note: m.crossing.note,
        ...(m.crossing.place ? { place: m.crossing.place } : {}),
        sources: m.crossing.sources as LensId[],
      };
    })
    .sort((x, y) => x.t - y.t || byPair(x, y));

  const riverPasses: RiverPass[] = passWindows
    .map(({ a, b, from, to }) => {
      const [x, y] = [streams[a].id, streams[b].id].sort();
      return { a: x, b: y, t1: tAt(from), t2: tAt(to) };
    })
    .sort((x, y) => x.t1 - y.t1 || byPair(x, y));

  const forks: RiverFork[] = mouths
    .map((mouth) => ({
      at: mouth.fork,
      stream: mouth.parent,
      streams: mouth.members,
      t: tOf.get(mouth.fork)!,
      t1: tAt(Math.min(mouth.k, ...mouth.members.map((id) => first[index.get(id)!]))),
      t2: tAt(Math.min(SLICES - 1, mouth.k + DELTA_SLICES)),
    }))
    .sort((x, y) => x.t - y.t || x.at.localeCompare(y.at));

  return {
    streams: riverStreams,
    stars: riverStars,
    byId: new Map(riverStars.map((star) => [star.id, star])),
    confluences,
    bridges: bridges.sort(byPair),
    passes: riverPasses,
    forks,
    unmet: unmet.sort(byPair),
    ages: AGE_BANDS.map((band) => ({ t: tOfEra(band.era), label: band.label })),
    yMin,
    yMax,
  };
}
