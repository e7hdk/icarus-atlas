import type { LensId } from '@/types/character';
import type { Story } from '@/types/story';
import {
  storiesById,
  isArgonauticaStory,
  isPrimordialStory,
  isTitanCycleStory,
  isOlympianCycleStory,
  isHeraclesCycleStory,
  isMetamorphosesStory,
  isPerseusCycleStory,
  isReturnsStory,
  isTheseusCycleStory,
  isThebanCycleStory,
  isDionysusCycleStory,
  isTrojanCycleStory,
  PRIMORDIAL_CYCLE_ROOT_IDS,
  TITAN_CYCLE_ROOT_IDS,
  OLYMPIAN_CYCLE_ROOT_IDS,
  ARGONAUTICA_ROOT_IDS,
  THEBAN_CYCLE_ROOT_IDS,
  DIONYSUS_CYCLE_ROOT_IDS,
  PERSEUS_CYCLE_ROOT_IDS,
  HERACLES_CYCLE_ROOT_IDS,
  THESEUS_CYCLE_ROOT_IDS,
  TROJAN_CYCLE_ROOT_IDS,
  RETURNS_ROOT_IDS,
  METAMORPHOSES_ROOT_IDS,
} from './shelves';

export type Vec3 = [number, number, number];

/** A saga arm of the spindle — one color, one angular band. */
export type SagaId =
  | 'primordial'
  | 'titan'
  | 'olympian'
  | 'argonaut'
  | 'theban'
  | 'dionysus'
  | 'perseus'
  | 'heracles'
  | 'theseus'
  | 'trojan'
  | 'returns'
  | 'metamorphoses'
  | 'heroic';

/** Saga accent colors — the single source of truth for the Myths palette. */
export const SAGA_ACCENT: Record<SagaId, string> = {
  primordial: '#a78bfa',
  titan: '#e3b341',
  olympian: '#7dd3fc',
  argonaut: '#38bdf8',
  theban: '#fb7185',
  dionysus: '#c026d3',
  perseus: '#eab308',
  heracles: '#f97316',
  theseus: '#2dd4bf',
  trojan: '#fbbf24',
  returns: '#34d399',
  metamorphoses: '#e879f9',
  heroic: '#aab4c8',
};

export const SAGA_LABEL: Record<SagaId, string> = {
  primordial: 'The Primordials',
  titan: 'The Titans',
  olympian: 'The Olympians',
  argonaut: 'The Argonautica',
  theban: 'The Theban Cycle',
  dionysus: 'The Dionysus Cycle',
  perseus: 'The Perseus Cycle',
  heracles: 'The Labours of Heracles',
  theseus: 'The Attic Cycle',
  trojan: 'The Trojan Cycle',
  returns: 'The Returns',
  metamorphoses: 'The Metamorphoses',
  heroic: 'Heroic Ages',
};

/** Angular order of the saga arms around the spindle (also the legend order). */
export const SAGA_ORDER: SagaId[] = [
  'primordial',
  'titan',
  'olympian',
  'metamorphoses',
  'theban',
  'dionysus',
  'perseus',
  'argonaut',
  'heracles',
  'theseus',
  'trojan',
  'returns',
  'heroic',
];

const SHELF_ROOT_IDS = new Set<string>([
  ...PRIMORDIAL_CYCLE_ROOT_IDS,
  ...TITAN_CYCLE_ROOT_IDS,
  ...OLYMPIAN_CYCLE_ROOT_IDS,
  ...ARGONAUTICA_ROOT_IDS,
  ...THEBAN_CYCLE_ROOT_IDS,
  ...DIONYSUS_CYCLE_ROOT_IDS,
  ...PERSEUS_CYCLE_ROOT_IDS,
  ...HERACLES_CYCLE_ROOT_IDS,
  ...THESEUS_CYCLE_ROOT_IDS,
  ...TROJAN_CYCLE_ROOT_IDS,
  ...RETURNS_ROOT_IDS,
  ...METAMORPHOSES_ROOT_IDS,
]);

/** Walks the parent chain to the shelf root that owns this story → its saga arm. */
export function resolveSaga(story: Story, byId: Map<string, Story>): SagaId {
  if (isPrimordialStory(story, byId)) return 'primordial';
  if (isTitanCycleStory(story, byId)) return 'titan';
  if (isOlympianCycleStory(story, byId)) return 'olympian';
  if (isReturnsStory(story, byId)) return 'returns';
  if (isTrojanCycleStory(story, byId)) return 'trojan';
  if (isArgonauticaStory(story, byId)) return 'argonaut';
  if (isThebanCycleStory(story, byId)) return 'theban';
  if (isDionysusCycleStory(story, byId)) return 'dionysus';
  if (isPerseusCycleStory(story, byId)) return 'perseus';
  if (isHeraclesCycleStory(story, byId)) return 'heracles';
  if (isTheseusCycleStory(story, byId)) return 'theseus';
  if (isMetamorphosesStory(story, byId)) return 'metamorphoses';
  return 'heroic';
}

/** A story rendered as a world-line on the spindle: a star where it begins,
 *  then a thread spanning era → eraEnd, branching out of its parent's line. */
export interface SpindleNode {
  id: string;
  title: string;
  greekTitle?: string;
  kind: Story['kind'];
  era: number;
  eraEnd: number;
  parentId: string | null;
  sagaId: SagaId;
  color: string;
  /** Star/line thickness — shelf roots largest, episodes smallest. */
  size: number;
  isSagaRoot: boolean;
  /** Where the star sits (start of the line / branch point). */
  pos: Vec3;
  /** Polyline along the cylinder from the start (top) to eraEnd (bottom). */
  points: Vec3[];
  /** Sources attesting the summary — the lens gate. */
  sources: LensId[];
}

export interface SpindleAge {
  y: number;
  era: number;
  label: string;
}

export interface SpindleLayout {
  nodes: SpindleNode[];
  byId: Map<string, SpindleNode>;
  ages: SpindleAge[];
  minEra: number;
  maxEra: number;
  yTop: number;
  yBottom: number;
  radius: number;
}

/* ------------------------------ tuning ------------------------------ */

/** The myths live on the inner wall of the cylinder — a big radius, because we
 *  stand inside the tube and look outward at the wall, never at a thin core.
 *  Generous, so the wall sits far from the axis and the cosmos feels vast. */
const RADIUS = 30;
/** World units per era — the SOLE driver of depth down the tunnel. Every star sits
 *  at its own era height, so the spindle is one true chronological corridor: the real
 *  time between two myths is the distance between them, and any two events that fall
 *  at the same moment share a cross-section (where they may cross). */
const ERA_RISE = 900;
/** Minimum drop between a node and its parent / previous sibling, so near-simultaneous
 *  events sit very close (as they should) without landing on the exact same point. */
const MIN_TIE_GAP = 14;
/** Base spiral: radians of twist per world-unit down the tunnel. Stronger now, so the
 *  arm's parallel strands wind around each other into a braided helix instead of
 *  reading as a flat comb of straight rods. (Whole-arm rotation — no bound impact.) */
const TWIST_PER_UNIT = 0.0072;
/** A childless leaf's own forward stub length (world units), jittered per id. */
const LEAF_LEN = 76;
/** Per-thread meander amplitude (radians ≈ ×30 units). Bold, because it is now a
 *  COSMETIC ride on top of the spine (children attach to the wander-free spine, so
 *  it costs no angular budget) and is enveloped to fade out near the wedge wall —
 *  this is what gives long straight trunks a graceful curve instead of a dead rod. */
const WANDER = 0.06;
/** Per-generation decay of the meander amplitude, so a child's star never sits too
 *  far off its waving parent tube (the attach gap is ≤ this generation's wAmp). */
const WANDER_DECAY = 0.5;
/** Base angular frequency of the meander (radians of phase per world-unit). Low →
 *  long, graceful bows over a trunk's length, not a tight nervous wiggle. Each
 *  thread also scales this by a per-id factor so neighbours weave and cross. */
const WANDER_RATE = 0.003;
/** Open ("unfinished") stories run on this far (world units) past their last
 *  child, then dissolve into the dark. */
const OPEN_TAIL = 720;
/** Angular gap between adjacent saga arms (≈ 2π / arm count). */
const ARM_GAP = (Math.PI * 2) / SAGA_ORDER.length;
/** Half the angular span a fork burst fills, regardless of sibling count (radians).
 *  The returns spread EVENLY across [−span, +span] inside the arm — not a fixed step
 *  per sibling, which overflowed the wedge for a big fan (the 13 Returns) and threw
 *  outer siblings across neighbouring arms. Derived from ARM_GAP so it auto-fits the
 *  wedge (and stays < SLOT_CLAMP) no matter how many arms there are. */
const FORK_HALF_SPAN = ARM_GAP * 0.42;

/* --- Organic branching. A child does NOT snap to a fixed lane and then run parallel
 *  to its siblings (the old "comb"); it leaves the parent and KEEPS diverging along a
 *  decaying-heading curve, so limbs splay like a tree bough or a river delta. Siblings
 *  straddle BOTH sides of the parent (a symmetric rank), each generation's spread
 *  halves (a convergent geometric series that stays inside the arm slot), and a hard
 *  clamp guarantees a thread never bleeds into a neighbouring saga arm. */
/** Gen-0 outermost-sibling divergence asymptote from the parent lane (radians).
 *  Tune knob #1 — spread width. Keep ≤ ~0.115 so the geometric sum stays in-wedge. */
const BRANCH_FAN = 0.1;
/** Each generation's asymptote halves → Σ = BRANCH_FAN / (1 − decay) stays bounded. */
const BRANCH_DECAY = 0.5;
/** e-folding length (world-units) of the divergence creep, off(d) = A·(1 − e^(−d/τ)).
 *  Short, so even a ~76u leaf opens up. Tune knob #2 — openness (range 90–240). */
const BRANCH_TAU = 140;
/** Magnitude-only sibling jitter (fraction of A), enveloped by (1 − |s|) so it never
 *  flips a side or overshoots an outer child. Tune knob #3 — de-comb (range 0–0.25). */
const BRANCH_JITTER = 0.14;
/** Short ease (world-units) gluing a child onto its parent's true attach angle; the
 *  divergence itself is carried by the exp creep above, not by this. */
const CONNECT_IN = 40;
/** Hard backstop on |angle − sagaAxis|: every thread stays strictly inside its wedge
 *  no matter the pathology. Inactive for all real envelopes (proven in verification). */
const SLOT_CLAMP = ARM_GAP / 2 - 0.004;

const AGE_BANDS: { era: number; label: string }[] = [
  { era: 0, label: 'Before the gods' },
  { era: 1, label: 'The war in heaven' },
  { era: 2, label: 'The first mortals' },
  { era: 4, label: "Ovid's changing forms" },
  { era: 5.5, label: 'The age of heroes' },
  { era: 7, label: 'The voyage and the quests' },
  { era: 8, label: 'The fall of Troy' },
  { era: 9, label: 'The long homecoming' },
];

function sizeFor(story: Story): number {
  if (SHELF_ROOT_IDS.has(story.id)) return 1.15;
  if (story.kind === 'episode') return 0.6;
  return 0.85;
}

/** Deterministic [0,1) hash of a string — the layout's seeded randomness, so an
 *  unchanged roster always lays out identically (no flicker across reloads). */
function hash01(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/** Signed deterministic noise in (−1, 1). */
const signed = (seed: string): number => hash01(seed) * 2 - 1;

/** Builds the world-line layout. Each saga is grown as one organic tree down a
 *  long corridor of time: a child's star is planted on its parent's path at the
 *  branch height, then its own thread peels off into a randomised lane and
 *  meanders — irregular gaps, lanes and curves make limbs feel grown, not
 *  combed, while a uniform base twist keeps the whole field a clear spiral and
 *  each saga stays inside its own angular slot. */
export function buildSpindleLayout(
  stories: Story[],
  years: Map<string, number | null> | null = null,
): SpindleLayout {
  const byIdStory = storiesById(stories);

  const minEra = stories.length ? Math.min(...stories.map((s) => s.era)) : 0;
  // The bottom of the spindle reaches the latest END, not just the latest start.
  const rawMaxEnd = stories.reduce((max, s) => Math.max(max, s.eraEnd ?? s.era), minEra + 1);
  const midEra = (minEra + rawMaxEnd) / 2;
  const yForEra = (era: number) => (midEra - era) * ERA_RISE;

  // children index (parent → children, era-sorted).
  const childrenOfId = new Map<string, Story[]>();
  for (const s of stories) {
    if (!s.parent) continue;
    const list = childrenOfId.get(s.parent) ?? [];
    list.push(s);
    childrenOfId.set(s.parent, list);
  }
  for (const list of childrenOfId.values())
    list.sort((a, b) => a.era - b.era || a.id.localeCompare(b.id));

  // --- Depth = real chronographic year (data/chronology.json), so the corridor is
  // true time: the gap between two myths is the actual elapsed years the ancient
  // chronographers reckoned, and any two events at the same moment share a cross-
  // section. The timeless divine prologue (the cosmogony subtree, which no
  // chronographer dates) floats above the dated corridor; an undatable frame-saga
  // tale (Ovid) with no lineage anchor falls back to a global era→year curve so it
  // still lands near its narrated moment. With no chronology we degrade to era. ---
  const timeless = new Set<string>();
  if (years) {
    const mark = (id: string) => {
      if (timeless.has(id)) return;
      timeless.add(id);
      for (const k of childrenOfId.get(id) ?? []) mark(k.id);
    };
    // The whole divine prologue is timeless — all three reigns (primordial, Titan,
    // Olympian), not just the cosmogony, since no chronographer dates the gods.
    for (const root of ['cosmogony', 'reign-of-cronus', 'titanomachy']) {
      if (byIdStory.has(root)) mark(root);
    }
    for (const id of [...timeless]) if (years.get(id) != null) timeless.delete(id);
  }
  const datedPairs = years
    ? stories
        .filter((s) => years.get(s.id) != null)
        .map((s) => ({ era: s.era, year: years.get(s.id)! }))
        .sort((a, b) => a.era - b.era)
    : [];
  const eraToYear = (era: number): number => {
    if (datedPairs.length === 0) return 0;
    if (era <= datedPairs[0].era) return datedPairs[0].year;
    const last = datedPairs[datedPairs.length - 1];
    if (era >= last.era) return last.year;
    for (let i = 0; i < datedPairs.length - 1; i += 1) {
      const a = datedPairs[i];
      const b = datedPairs[i + 1];
      if (era >= a.era && era <= b.era) {
        const t = (era - a.era) / (b.era - a.era || 1);
        return a.year + (b.year - a.year) * t;
      }
    }
    return last.year;
  };
  const datedYears = datedPairs.map((p) => p.year);
  const minYear = datedYears.length ? Math.min(...datedYears) : -2000;
  const maxYear = datedYears.length ? Math.max(...datedYears) : -800;
  const midYear = (minYear + maxYear) / 2;
  const YEAR_SCALE = 8000 / Math.max(1, maxYear - minYear);
  const yForYear = (year: number) => (midYear - year) * YEAR_SCALE;
  const maxTimelessEra = timeless.size
    ? Math.max(...[...timeless].map((id) => byIdStory.get(id)!.era))
    : 0;
  const topDatedY = yForYear(minYear);
  const TIMELESS_RISE = 600;
  const TIMELESS_GAP = 500;
  const timelessY = (era: number) =>
    topDatedY + TIMELESS_GAP + (maxTimelessEra - era) * TIMELESS_RISE;

  // BLENDED time axis: pure proportional years crush 68% of the myths into the
  // ~200-year heroic age (a dense knot) while millennia of deep past sit empty, so we
  // blend real-year position with even chronological-rank position. ALPHA dials the
  // feel: 1 = strict years (uneven), 0 = even spacing (rank). 0.4 keeps order and a
  // real sense of elapsed time while evening the density so nothing overlaps.
  const ALPHA = 0.4;
  const effYearOf = (s: Story): number => {
    const yr = years ? years.get(s.id) : null;
    return yr != null ? yr : eraToYear(s.era);
  };
  const ordered = years
    ? stories
        .filter((s) => !timeless.has(s.id))
        .sort((a, b) => effYearOf(a) - effYearOf(b) || a.era - b.era || a.id.localeCompare(b.id))
    : [];
  const ordinalOf = new Map<string, number>();
  ordered.forEach((s, i) => ordinalOf.set(s.id, i));
  const M = ordered.length;
  const topYearY = yForYear(minYear);
  const botYearY = yForYear(maxYear);
  const rankPos = (frac: number) => topYearY - frac * (topYearY - botYearY);
  const fracOfYear = (year: number): number => {
    if (M <= 1) return 0;
    let lo = 0;
    let hi = M;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (effYearOf(ordered[mid]) < year) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(1, Math.max(0, lo / (M - 1)));
  };
  const blendStory = (s: Story): number => {
    const frac = M > 1 ? (ordinalOf.get(s.id) ?? 0) / (M - 1) : 0;
    return ALPHA * yForYear(effYearOf(s)) + (1 - ALPHA) * rankPos(frac);
  };
  const blendYear = (year: number): number =>
    ALPHA * yForYear(year) + (1 - ALPHA) * rankPos(fracOfYear(year));

  const depthOf = (s: Story): number => {
    if (!years) return yForEra(s.era);
    if (timeless.has(s.id)) return timelessY(s.era);
    return blendStory(s);
  };
  // The earliest (highest) point in a story's subtree — a saga is anchored at its
  // FOUNDING so the whole lineage falls correctly below it, never the container
  // floating to a mid-span depth and shoving its founding episode down.
  const subtreeTopY = (s: Story): number => {
    let top = depthOf(s);
    for (const k of childrenOfId.get(s.id) ?? []) top = Math.max(top, subtreeTopY(k));
    return top;
  };
  const topRef = years ? timelessY(0) : yForEra(minEra);

  // Saga arm axis angles.
  const sagaAngle = new Map<SagaId, number>();
  SAGA_ORDER.forEach((id, i) => sagaAngle.set(id, i * ARM_GAP));

  const sagaOf = new Map<string, SagaId>();
  for (const s of stories) sagaOf.set(s.id, resolveSaga(s, byIdStory));

  const nodes: SpindleNode[] = [];
  const byId = new Map<string, SpindleNode>();
  let lowestY = years ? yForYear(maxYear) : yForEra(rawMaxEnd);

  // The saga arm axis at a given height, carrying the uniform base spiral — the
  // whole field winds like a barber-pole while each arm keeps its angular slot.
  const sagaAxisAt = (saga: SagaId, y: number): number =>
    (sagaAngle.get(saga) ?? 0) + TWIST_PER_UNIT * (topRef - y);

  // A laid-out path along the wall. Its star sits at startY/startAngle; it eases off
  // its parent's attach angle over CONNECT_IN units, then its branch offset keeps
  // diverging (off(d) = A·(1 − e^(−d/τ))) so siblings splay apart instead of running
  // parallel, while a gentle decaying meander keeps any two threads from coinciding.
  interface Path {
    saga: SagaId;
    startY: number;
    // Axis-relative offset the thread starts AT (the attach point, relative to the
    // arm axis). Kept axis-relative — not an absolute angle — so the base spiral is
    // carried entirely by sagaAxisAt and the connect-ease never drifts with the twist.
    attachOff: number;
    // Axis-relative offset inherited from the parent at the branch height — child
    // offsets compose down the tree, so a limb begins exactly on its parent's path.
    baseOffset: number;
    // Signed divergence asymptote of THIS branch from the parent lane (0 for saga
    // roots and fork siblings). Siblings' asymptotes are symmetric (±A), so they
    // straddle the parent and keep opening apart.
    A: number;
    wAmp: number;
    wRate: number;
    peelIn?: number;
  }
  // The branch SPINE: the thread's mean path with NO meander, eased off the parent's
  // attach offset and clamped into the arm wedge. Children attach HERE, so a parent's
  // cosmetic wander never eats a child's angular budget (the wander is decoupled).
  // Everything is computed as an offset FROM the (twisting) axis, so the helix lives
  // purely in sagaAxisAt and the ease/divergence never fight the spiral.
  const spineAngle = (p: Path, y: number): number => {
    const d = p.startY - y; // distance travelled forward (down the tunnel)
    const axis = sagaAxisAt(p.saga, y);
    // Persistent, ever-diverging branch offset — the integral of a decaying heading.
    // off(0)=0 (glued to the parent) and slope = (A/τ)·e^(−d/τ) > 0 for ALL finite d,
    // so a limb never settles into a parallel lane; it keeps opening toward asymptote A.
    const branchOff = d <= 0 ? 0 : p.A * (1 - Math.exp(-d / BRANCH_TAU));
    const targetOff = p.baseOffset + branchOff;
    // Short connect-ease from the attach offset out to the lane offset.
    const ci = p.peelIn ?? CONNECT_IN;
    const u = d <= 0 ? 0 : d >= ci ? 1 : d / ci;
    const t = u * u * (3 - 2 * u); // smoothstep: ease off the parent
    const off = p.attachOff + (targetOff - p.attachOff) * t;
    // Hard backstop: the spine never leaves the saga wedge, whatever happens.
    return axis + Math.max(-SLOT_CLAMP, Math.min(SLOT_CLAMP, off));
  };
  const pathAngle = (p: Path, y: number): number => {
    const sp = spineAngle(p, y);
    const axis = sagaAxisAt(p.saga, y);
    const d = p.startY - y;
    // Meander RIDES on the spine. It vanishes at the star (sin(0)=0, so the limb is
    // glued to its parent there) and fades to zero as the spine nears the wedge wall
    // (headroom envelope), so the visible thread always stays inside the arm. Per-thread
    // rate variation + each thread's own startY means neighbours weave and cross
    // instead of running parallel — even the long, straight trunks get a graceful bow.
    const head = 1 - Math.min(1, Math.abs(sp - axis) / SLOT_CLAMP);
    const wander = p.wAmp * head * Math.sin(p.wRate * d);
    return sp + wander;
  };
  const pointOn = (p: Path, y: number): Vec3 => {
    const a = pathAngle(p, y);
    return [RADIUS * Math.sin(a), y, RADIUS * Math.cos(a)];
  };

  // Recursively lay a story and its subtree.
  const place = (
    story: Story,
    startY: number,
    parentAngle: number | null,
    parentOffset: number,
    depth: number,
    forkSlot = false,
    // Marks a node inside a fork bundle (and its subtree); reserved for bundle-only
    // tuning so the burst siblings can be laid apart from ordinary branches.
    bundle = false,
    // Fork siblings all START at the same moment (their thread begins on the parent)
    // but peel fast (peelInOverride) and carry their STAR a little forward along the
    // thread (starOffset) — so the stars sit on ONE cross-section (simultaneous),
    // fanned by angle, each still tied to the parent by its own thread.
    peelInOverride?: number,
    starOffset = 0,
    // Signed divergence asymptote handed to this child by its parent's branch loop
    // (0 for saga roots and fork siblings); drives the exp creep in pathAngle.
    branchA = 0,
  ): number => {
    const saga = sagaOf.get(story.id)!;
    // parentOffset now carries the composed axis-relative baseOffset (for a fork
    // sibling it is the fork lane); the child's own divergence is branchA.
    const baseOffset = parentOffset;
    // Attach offset = where the thread starts, as an offset from the (twisting) axis.
    // For a child it is the parent's spine offset at the branch height (parentAngle −
    // axis there); for a saga root it is just its baseOffset on the axis.
    const attachOff =
      parentAngle !== null ? parentAngle - sagaAxisAt(saga, startY) : baseOffset;
    const p: Path = {
      saga,
      startY,
      attachOff,
      baseOffset,
      A: forkSlot ? 0 : branchA,
      wAmp: WANDER * Math.pow(WANDER_DECAY, depth) * signed(`${story.id}:wa`),
      wRate: WANDER_RATE * (0.6 + hash01(`${story.id}:wr`) * 0.9),
      peelIn: peelInOverride,
    };

    let cursorY = startY;
    const kids = childrenOfId.get(story.id) ?? [];

    if (story.forkChildren && kids.length > 0) {
      // The captains sailing home AT ONCE: a single moment from which many roads
      // burst forward. Every sibling's thread begins at the SAME cross-section (the
      // shared moment, on the parent), fans into its own lane, and runs forward —
      // and each star is carried a little forward to sit on that one ring, so the
      // returns read as simultaneous (one cross-section) and diverging, not as a
      // sequence down the tunnel and not as a closed ring.
      const forkKids = [...kids].sort((a, b) => a.era - b.era || a.id.localeCompare(b.id));
      // A clear run of trunk after the parent before the burst, so nostoi and its
      // returns are not crowded together.
      const top = startY - 118;
      const hubAngle = spineAngle(p, top);
      // How far forward the shared ring of stars sits. peelIn === sOff means the
      // fan eases the WHOLE way out to the star (smoothstep → tangent at both ends),
      // so the threads leave the trunk softly instead of kinking at a hard elbow.
      const sOff = 104;
      let deepest = top;
      for (let i = 0; i < forkKids.length; i += 1) {
        // Spread the whole burst EVENLY across a bounded half-span (not a fixed per-
        // sibling step, which overflowed the wedge for a big fan and splattered outer
        // returns across neighbouring arms) — every fork fills its own arm, no bleed.
        const frac =
          forkKids.length > 1 ? (i - (forkKids.length - 1) / 2) / ((forkKids.length - 1) / 2) : 0;
        const lane = parentOffset + frac * FORK_HALF_SPAN;
        const end = place(forkKids[i], top, hubAngle, lane, depth + 1, false, true, sOff, sOff);
        deepest = Math.min(deepest, end);
      }
      cursorY = deepest;
    } else {
      // Depth tracks ERA, not node count: each child's star sits at its own era
      // height, so the whole spindle reads as one chronological corridor and any two
      // events at the same moment share a cross-section. The floor only enforces a
      // tiny drop below the parent / previous sibling so ties never coincide exactly.
      let floor = startY;
      let deepest = startY;
      const n = kids.length;
      const hi = (n - 1) / 2;
      // This generation's outward asymptote, halving each level → a convergent series.
      const aGen = BRANCH_FAN * Math.pow(BRANCH_DECAY, depth);
      for (let i = 0; i < n; i += 1) {
        const kid = kids[i];
        const kidY = Math.min(depthOf(kid), floor - MIN_TIE_GAP);
        floor = kidY;
        // Symmetric two-sided rank: n ≥ 2 always yields both −1 and +1, so siblings
        // straddle the parent (no more same-side clustering); a lone child sits at 0.
        const s = n > 1 ? (i - hi) / hi : 0;
        // Magnitude-only jitter, zeroed at the outermost children (|s| = 1) so it can
        // never flip a side or breach the |A| bound — organic scatter, still in-bounds.
        const jit = BRANCH_JITTER * signed(`${kid.id}:lane`) * (1 - Math.abs(s));
        const kidA = aGen * (s + jit);
        // The child begins on the parent's SPINE (its wander-free mean path); kidBase
        // composes the parent's axis-relative offset so the limb is glued on, then
        // diverges. Attaching to the spine (not the waving tube) keeps the parent's
        // cosmetic meander out of the child's angular budget.
        const attach = spineAngle(p, kidY);
        const kidBase = attach - sagaAxisAt(saga, kidY);
        const kidEnd = place(
          kid, kidY, attach, kidBase, depth + 1, false, bundle, undefined, 0, kidA,
        );
        deepest = Math.min(deepest, kidEnd);
      }
      cursorY = deepest;
    }

    const leaf = LEAF_LEN * (0.55 + hash01(`${story.id}:leaf`));
    // The thread runs to whichever is deepest: its subtree or a minimum leaf stub.
    // (In the era-only fallback the eraEnd span also pulls it down; under real years
    // the subtree + leaf govern the length.)
    let endY = Math.min(cursorY, startY - leaf);
    if (!years) endY = Math.min(endY, yForEra(story.eraEnd ?? story.era));
    // A fork parent's trunk runs down to where the burst happens.
    if (story.forkChildren && kids.length > 0) endY = Math.min(endY, cursorY);
    // A fork sibling's thread must reach past where its star is carried, so the
    // star sits on the shared ring with a little voyage tail beyond it.
    if (starOffset > 0) endY = Math.min(endY, startY - starOffset - 16);
    if (story.open === true) endY -= OPEN_TAIL;

    const len = startY - endY;
    // Denser sampling → the tube (built from straight segments between points) reads as
    // a smooth curve rather than a faceted bend. The stronger spiral means a long thread
    // needs enough points to keep each step's twist below ~0.1 rad, so we also scale
    // samples by the total twist (TWIST·len) — capped, since most threads are short.
    const samples = Math.min(
      440,
      Math.max(14, Math.round(len / 10), Math.round((TWIST_PER_UNIT * len) / 0.1)),
    );
    const points: Vec3[] = [];
    for (let i = 0; i <= samples; i += 1) {
      points.push(pointOn(p, startY - (len * i) / samples));
    }
    // The star usually marks the thread's start; a fork sibling carries it forward
    // onto the shared simultaneous ring (its thread still begins back at the moment).
    const star = starOffset > 0 ? pointOn(p, startY - starOffset) : points[0];

    const node: SpindleNode = {
      id: story.id,
      title: story.title,
      greekTitle: story.greekTitle,
      kind: story.kind,
      era: story.era,
      eraEnd: story.eraEnd ?? story.era,
      parentId: story.parent,
      sagaId: saga,
      color: SAGA_ACCENT[saga],
      size: sizeFor(story),
      isSagaRoot: SHELF_ROOT_IDS.has(story.id),
      pos: star,
      points,
      sources: story.summary.sources as LensId[],
    };
    nodes.push(node);
    byId.set(node.id, node);
    if (endY < lowestY) lowestY = endY;
    return endY;
  };

  // Roots of each saga = stories with no parent (or whose parent is in another
  // saga). Grouped by saga and stacked by era: a saga begins at its first root's
  // era height and unfurls its whole tree forward (down the tunnel) from there.
  const rootsBySaga = new Map<SagaId, Story[]>();
  for (const s of stories) {
    if (s.parent && sagaOf.get(s.parent) === sagaOf.get(s.id)) continue;
    const saga = sagaOf.get(s.id)!;
    const list = rootsBySaga.get(saga) ?? [];
    list.push(s);
    rootsBySaga.set(saga, list);
  }

  // Each saga root is anchored to its own real year; chronology alone keeps a sequel
  // arm (the Returns, the Odyssey) below its predecessor (the war), with no manual
  // stacking — the Odyssey simply IS later in years than the fall of Troy.
  for (const saga of SAGA_ORDER) {
    const rs = rootsBySaga.get(saga);
    if (!rs || rs.length === 0) continue;
    rs.sort((a, b) => a.era - b.era);
    let floor = Infinity;
    for (const r of rs) {
      const desired = years ? subtreeTopY(r) : depthOf(r);
      const rootY = Math.min(desired, floor - MIN_TIE_GAP);
      floor = rootY;
      place(r, rootY, null, 0, 0);
    }
  }

  // Age-ring chapter markers down the corridor, each at the depth its era maps to —
  // the divine bands float in the timeless prologue, the rest at their real-year height.
  const topY = topRef;
  const ages: SpindleAge[] = AGE_BANDS.filter(
    (band) => band.era >= minEra - 0.5 && band.era <= rawMaxEnd + 0.5,
  ).map((band) => ({
    era: band.era,
    y: years
      ? band.era <= maxTimelessEra
        ? timelessY(band.era)
        : blendYear(eraToYear(band.era))
      : yForEra(band.era),
    label: band.label,
  }));

  return {
    nodes,
    byId,
    ages,
    minEra,
    maxEra: rawMaxEnd,
    yTop: topY,
    yBottom: lowestY,
    radius: RADIUS,
  };
}

/** A story is attested (bright) under lens L when its summary names that source. */
export function isStoryAttested(node: SpindleNode, lens: LensId): boolean {
  return lens === 'consensus' || node.sources.includes(lens);
}
