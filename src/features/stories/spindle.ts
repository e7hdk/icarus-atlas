import type { LensId } from '@/types/character';
import type { Story } from '@/types/story';
import {
  storiesById,
  isArgonauticaStory,
  isCosmicCycleStory,
  isHeraclesCycleStory,
  isMetamorphosesStory,
  isPerseusCycleStory,
  isReturnsStory,
  isTheseusCycleStory,
  isThebanCycleStory,
  isTrojanCycleStory,
  COSMIC_CYCLE_ROOT_IDS,
  ARGONAUTICA_ROOT_IDS,
  THEBAN_CYCLE_ROOT_IDS,
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
  | 'cosmic'
  | 'argonaut'
  | 'theban'
  | 'perseus'
  | 'heracles'
  | 'theseus'
  | 'trojan'
  | 'returns'
  | 'metamorphoses'
  | 'heroic';

/** Saga accent colors — the single source of truth for the Myths palette. */
export const SAGA_ACCENT: Record<SagaId, string> = {
  cosmic: '#c084fc',
  argonaut: '#38bdf8',
  theban: '#fb7185',
  perseus: '#eab308',
  heracles: '#f97316',
  theseus: '#2dd4bf',
  trojan: '#fbbf24',
  returns: '#34d399',
  metamorphoses: '#e879f9',
  heroic: '#aab4c8',
};

export const SAGA_LABEL: Record<SagaId, string> = {
  cosmic: 'The Cosmic Cycle',
  argonaut: 'The Argonautica',
  theban: 'The Theban Cycle',
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
  'cosmic',
  'metamorphoses',
  'theban',
  'perseus',
  'argonaut',
  'heracles',
  'theseus',
  'trojan',
  'returns',
  'heroic',
];

const SHELF_ROOT_IDS = new Set<string>([
  ...COSMIC_CYCLE_ROOT_IDS,
  ...ARGONAUTICA_ROOT_IDS,
  ...THEBAN_CYCLE_ROOT_IDS,
  ...PERSEUS_CYCLE_ROOT_IDS,
  ...HERACLES_CYCLE_ROOT_IDS,
  ...THESEUS_CYCLE_ROOT_IDS,
  ...TROJAN_CYCLE_ROOT_IDS,
  ...RETURNS_ROOT_IDS,
  ...METAMORPHOSES_ROOT_IDS,
]);

/** Walks the parent chain to the shelf root that owns this story → its saga arm. */
export function resolveSaga(story: Story, byId: Map<string, Story>): SagaId {
  if (isCosmicCycleStory(story, byId)) return 'cosmic';
  if (isReturnsStory(story, byId)) return 'returns';
  if (isTrojanCycleStory(story, byId)) return 'trojan';
  if (isArgonauticaStory(story, byId)) return 'argonaut';
  if (isThebanCycleStory(story, byId)) return 'theban';
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
/** World units per era for ROOT start heights and the age rings — the coarse
 *  time gradient (within a saga the tree packs by its own spacing below). */
const ERA_RISE = 120;
/** Base spiral: radians of twist per world-unit down the tunnel. Gentle, but
 *  over the long corridor it still winds every thread into a clear helix. */
const TWIST_PER_UNIT = 0.0046;
/** Spacing between consecutive stars as the tree packs down the tunnel. Large,
 *  so the corridor of time is long — each myth is its own waypoint and reaching
 *  the next is a real voyage. (~10× the old spindle's pitch.) */
const NODE_GAP = 92;
/** Each gap is randomly scaled within ±this fraction, so branches never sit at
 *  a fixed pitch — the source of the "real branch" irregularity along a limb. */
const GAP_JITTER = 0.55;
/** A childless leaf's own forward stub length (world units), jittered per id. */
const LEAF_LEN = 76;
/** Angular spread the FIRST generation may fan around its parent (radians). */
const FAN0 = 0.08;
/** Each generation fans half as wide — the geometric sum stays well inside the
 *  arm's slot, so saga limbs fan organically yet never bleed into a neighbour. */
const FAN_DECAY = 0.5;
/** Over how many world-units a child peels off its parent into its own lane. */
const PEEL_IN = 230;
/** Gentle per-thread meander (radians) so no two threads ever run parallel. */
const WANDER = 0.03;
/** Base angular frequency of that meander (radians of phase per world-unit). */
const WANDER_RATE = 0.006;
/** Open ("unfinished") stories run on this far (world units) past their last
 *  child, then dissolve into the dark. */
const OPEN_TAIL = 720;
/** Angular gap between adjacent saga arms (≈ 2π / arm count). */
const ARM_GAP = (Math.PI * 2) / SAGA_ORDER.length;
/** Lane fan per fork sibling (radians) — each return peels this much further to
 *  the side than its neighbour, so the stars spread well apart on the shared ring
 *  (a wide open fan, still short of wrapping into a full ring). */
const FORK_BUNDLE_FAN = 0.22;

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
export function buildSpindleLayout(stories: Story[]): SpindleLayout {
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
  for (const list of childrenOfId.values()) list.sort((a, b) => a.era - b.era);

  // Saga arm axis angles.
  const sagaAngle = new Map<SagaId, number>();
  SAGA_ORDER.forEach((id, i) => sagaAngle.set(id, i * ARM_GAP));

  const sagaOf = new Map<string, SagaId>();
  for (const s of stories) sagaOf.set(s.id, resolveSaga(s, byIdStory));

  const nodes: SpindleNode[] = [];
  const byId = new Map<string, SpindleNode>();
  let lowestY = yForEra(rawMaxEnd);

  // The saga arm axis at a given height, carrying the uniform base spiral — the
  // whole field winds like a barber-pole while each arm keeps its angular slot.
  const sagaAxisAt = (saga: SagaId, y: number): number =>
    (sagaAngle.get(saga) ?? 0) + TWIST_PER_UNIT * (yForEra(minEra) - y);

  // A laid-out path along the wall. Its star sits at startY/startAngle; over the
  // first PEEL_IN units it peels from that attach angle into its own lane, then
  // meanders gently so no two threads ever run parallel.
  interface Path {
    saga: SagaId;
    startY: number;
    startAngle: number;
    offset: number;
    wAmp: number;
    wRate: number;
    peelIn?: number;
  }
  const pathAngle = (p: Path, y: number): number => {
    const d = p.startY - y; // distance travelled forward (down the tunnel)
    const peelIn = p.peelIn ?? PEEL_IN;
    const u = d <= 0 ? 0 : d >= peelIn ? 1 : d / peelIn;
    const t = u * u * (3 - 2 * u); // smoothstep: ease off the parent
    const lane = sagaAxisAt(p.saga, y) + p.offset;
    const base = p.startAngle + (lane - p.startAngle) * t;
    // Meander vanishes at the star (d=0, so it stays on its parent) and stays
    // bounded by |wAmp| ≤ WANDER, keeping the limb inside its saga's slot.
    const wander = p.wAmp * Math.sin(p.wRate * d);
    return base + wander;
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
  ): number => {
    const saga = sagaOf.get(story.id)!;
    const fan = FAN0 * Math.pow(FAN_DECAY, depth);
    const offset = forkSlot
      ? parentOffset
      : parentOffset + signed(`${story.id}:lane`) * fan;
    const startAngle =
      forkSlot && parentAngle !== null
        ? parentAngle
        : (parentAngle ?? sagaAxisAt(saga, startY) + offset);
    const p: Path = {
      saga,
      startY,
      startAngle,
      offset,
      wAmp: WANDER * signed(`${story.id}:wa`),
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
      const hubAngle = pathAngle(p, top);
      // How far forward the shared ring of stars sits. peelIn === sOff means the
      // fan eases the WHOLE way out to the star (smoothstep → tangent at both ends),
      // so the threads leave the trunk softly instead of kinking at a hard elbow.
      const sOff = 104;
      let deepest = top;
      for (let i = 0; i < forkKids.length; i += 1) {
        const lane = parentOffset + (i - (forkKids.length - 1) / 2) * FORK_BUNDLE_FAN;
        const end = place(forkKids[i], top, hubAngle, lane, depth + 1, false, true, sOff, sOff);
        deepest = Math.min(deepest, end);
      }
      cursorY = deepest;
    } else {
      for (const kid of kids) {
        const gap = NODE_GAP * (1 + signed(`${kid.id}:gap`) * GAP_JITTER);
        cursorY -= Math.max(NODE_GAP * 0.4, gap);
        cursorY = place(kid, cursorY, pathAngle(p, cursorY), offset, depth + 1, false, bundle);
      }
    }

    const leaf = LEAF_LEN * (0.55 + hash01(`${story.id}:leaf`));
    let endY = Math.min(cursorY, startY - leaf);
    // A fork parent's trunk runs down to where the burst happens.
    if (story.forkChildren && kids.length > 0) endY = Math.min(endY, cursorY);
    // A fork sibling's thread must reach past where its star is carried, so the
    // star sits on the shared ring with a little voyage tail beyond it.
    if (starOffset > 0) endY = Math.min(endY, startY - starOffset - 16);
    if (story.open === true) endY -= OPEN_TAIL;

    const len = startY - endY;
    // Denser sampling → the tube (built from straight segments between points)
    // reads as a smooth curve through the peel rather than a faceted, sharp bend.
    const samples = Math.min(160, Math.max(14, Math.round(len / 10)));
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

  // A handful of arms are strict sequels: they must begin AFTER another arm has
  // run its full course, not merely at their own era height. Node-count packing
  // makes a long arm (the Trojan Cycle — dozens of episodes) reach far deeper
  // than a short, later arm's era-start, which would otherwise float the lone
  // Odyssey up alongside the very war it follows. The Odyssey IS Troy's long
  // homecoming, so the Returns begin below the Trojan Cycle's deepest thread.
  const FOLLOWS: Partial<Record<SagaId, SagaId>> = { returns: 'trojan' };
  const sagaBottom = new Map<SagaId, number>();

  // Place arms in saga order so a sequel's predecessor is always laid first.
  for (const saga of SAGA_ORDER) {
    const rs = rootsBySaga.get(saga);
    if (!rs || rs.length === 0) continue;
    rs.sort((a, b) => a.era - b.era);
    let cursorY = yForEra(rs[0].era);
    const after = FOLLOWS[saga];
    if (after !== undefined) {
      const prevBottom = sagaBottom.get(after);
      if (prevBottom !== undefined) cursorY = Math.min(cursorY, prevBottom - NODE_GAP);
    }
    let bottom = cursorY;
    for (const r of rs) {
      const end = place(r, cursorY, null, 0, 0);
      bottom = Math.min(bottom, end);
      cursorY = end - NODE_GAP;
    }
    sagaBottom.set(saga, bottom);
  }

  // Age rings as evenly-spread chapter markers across the WHOLE tunnel, ordered by
  // era — qualitative labels read in order down the corridor.
  const topY = yForEra(minEra);
  const eraSpan = rawMaxEnd - minEra || 1;
  const ages: SpindleAge[] = AGE_BANDS.filter(
    (band) => band.era >= minEra - 0.5 && band.era <= rawMaxEnd + 0.5,
  ).map((band) => ({
    era: band.era,
    y: topY + (lowestY - topY) * ((band.era - minEra) / eraSpan),
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
