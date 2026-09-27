import type { Character, Relation, RelationType } from '@/types/character';
import { hashString, mulberry32 } from '@/lib/prng';

export type Vec3 = [number, number, number];

/* ============================== Cosmos layout ==============================
 * Three meaning-bearing axes:
 *   radius = mythic generation (parents always inside their descendants)
 *   angle  = dynasty — a sunburst wedge sized by subtree, plus a constant-pitch
 *            spiral that turns each lineage into an arm
 *   height = cosmological realm: ouranic above the disc plane, the lesser
 *            divine band over it, the mortal plane at zero, chthonic below
 * Genealogy places a star whenever it can: a child sits in its placement
 * parent's wedge, and cohort patches (war hosts, foes, city catalogues) shelter
 * only figures with no known parent. A deterministic constrained relaxation
 * polishes spacing (children lean toward their placement parent, consort pairs
 * settle into close binaries, adversaries drift apart), then a resolution
 * pass enforces the hard separation floor. Stars are always projected back
 * inside their generation ring, dynasty wedge and realm band.
 * ========================================================================= */

/** Bumped when layout semantics change — invalidates baked galaxy-positions.json. */
export const LAYOUT_VERSION = '11-ordered-houses';

/** Galaxy regions for BACKGROUND sampling (nebula wisps, dust, filler stars).
 *  Bands mirror the realm heights so the haze follows the named stars. */
export const CLUSTERS: Record<
  string,
  { rMin: number; rMax: number; yBase: number; thickness: number; tilt: number }
> = {
  core: { rMin: 4, rMax: 13, yBase: 0, thickness: 5, tilt: 3 },
  'titan-ring': { rMin: 18, rMax: 32, yBase: 7, thickness: 5, tilt: -4 },
  'olympian-band': { rMin: 30, rMax: 46, yBase: 15, thickness: 6, tilt: 6 },
  chthonic: { rMin: 14, rMax: 26, yBase: -15, thickness: 5, tilt: -3 },
  'night-court': { rMin: 20, rMax: 40, yBase: -14, thickness: 6, tilt: -6 },
  'mortal-arm': { rMin: 46, rMax: 90, yBase: 0, thickness: 5, tilt: 4 },
};

export const FALLBACK_CLUSTER = { rMin: 52, rMax: 78, yBase: 0, thickness: 8, tilt: 5 };

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Baseline mythic age. Parent edges may push a character farther outward,
 * but a later cluster never pulls an ancient figure toward the rim. */
const CLUSTER_GENERATION: Record<string, number> = {
  core: 0,
  'titan-ring': 1,
  'night-court': 1.25,
  chthonic: 2,
  'olympian-band': 2,
  'mortal-arm': 3,
};

const FALLBACK_GENERATION = 3;
const GENERATION_GAP = 7.5;
const BASE_RADIUS = 6;
/** Outer rings compress: divine ages keep the full gap, the deep mortal
 *  king-list generations (the 12-step Argive chain behind Perseus, the
 *  Cadmeian line behind the Oedipids) advance in tighter steps so faithful
 *  chain depth stops hurling the rim into the void. Must stay above
 *  2.5 + 2·RADIUS_TOLERANCE so parent/child rings remain visibly apart. */
const COMPRESS_AFTER_GENERATION = 5;
const OUTER_GENERATION_GAP = 5.6;

export function ringRadiusOf(generation: number): number {
  const inner = Math.min(generation, COMPRESS_AFTER_GENERATION);
  const outer = Math.max(0, generation - COMPRESS_AFTER_GENERATION);
  return BASE_RADIUS + inner * GENERATION_GAP + outer * OUTER_GENERATION_GAP;
}

/** A ring is a band with height, not a line: its realm storey stacks this many
 *  layers of stars before the generation has to billow outward. Billowing is
 *  costly — every later ring is pushed out by the band, stretching each parent →
 *  child step that crosses it — so it is kept for generations that truly overflow. */
const RING_LAYERS = 2;
/** Each extra radial lane buys ~one ring's circumference of capacity. */
const RADIAL_BAND_PER_LANE = 1.5;
/** A single generation never billows wider than this, however crowded. */
const MAX_RADIAL_BAND = 30;

/** Population-aware radial schedule. A thin ring per generation cannot hold a
 *  populous age (the Trojan-War generation alone is 400+ contemporaries, ~5×
 *  one ring's circumference), so an over-capacity generation is allowed to
 *  billow OUTWARD into a thick band — and every later generation is pushed out
 *  by that band so a child's band always clears its parent's (chronology, hard
 *  rule 6, is preserved because generations are integers: parent and child
 *  never share a ring, and inward drift stays clamped to RADIUS_TOLERANCE).
 *  Comfortable generations get band 0 and keep their exact ringRadiusOf. */
export function radialScheduleOf(generations: ReadonlyMap<string, number>): {
  ringRadius: (generation: number) => number;
  bandWidth: (generation: number) => number;
} {
  const counts = new Map<number, number>();
  for (const generation of generations.values()) {
    const ring = Math.round(generation);
    counts.set(ring, (counts.get(ring) ?? 0) + 1);
  }
  const maxRing = counts.size > 0 ? Math.max(...counts.keys()) : 0;
  const band = new Map<number, number>();
  const pushBelow = new Map<number, number>();
  let accumulated = 0;
  for (let ring = 0; ring <= maxRing; ring++) {
    pushBelow.set(ring, accumulated);
    const innerRadius = ringRadiusOf(ring) + accumulated;
    const capacity =
      (RING_LAYERS * 2 * Math.PI * Math.max(innerRadius, BASE_RADIUS)) / MIN_STAR_DISTANCE;
    const population = counts.get(ring) ?? 0;
    const lanes = population > capacity ? Math.ceil(population / capacity) - 1 : 0;
    const width = Math.min(lanes * MIN_STAR_DISTANCE * RADIAL_BAND_PER_LANE, MAX_RADIAL_BAND);
    band.set(ring, width);
    accumulated += width;
  }
  return {
    ringRadius: (generation) => ringRadiusOf(generation) + (pushBelow.get(Math.round(generation)) ?? accumulated),
    bandWidth: (generation) => band.get(Math.round(generation)) ?? 0,
  };
}

/** Hard spacing floor between unrelated stars; consort binaries may sit closer. */
export const MIN_STAR_DISTANCE = 3.6;
export const MIN_CONSORT_DISTANCE = 2.1;

/** Constant-pitch (logarithmic) spiral: a ring's bearing advances with the
 *  logarithm of its radius, so lineages still read as arms while a parent → child
 *  step leans by the same small angle at every radius — about SPIRAL_PITCH · Δr
 *  of sideways travel. A fixed turn per generation cost 0.38 · r instead (38 units
 *  at radius 100) and carried a child charted several rings out to the far side
 *  of the galaxy. Still a pure rotation per ring: same-ring spacing is untouched. */
export const SPIRAL_PITCH = 0.35;

export function spiralTwistOf(generation: number): number {
  return SPIRAL_PITCH * Math.log(ringRadiusOf(generation) / BASE_RADIUS);
}

/** Stars may drift this far from their generation ring during relaxation. */
export const RADIUS_TOLERANCE = 1.5;
/** Minimum radial gap enforced between a parent and its child — kept in sync with
 *  validate-layout chronology check. Cohort patches widen radialTolerance, which
 *  can otherwise let adjacent-generation kin overlap after relaxation. */
export const MIN_PARENT_CHILD_RADIAL_GAP = 2.5;
/** Where the first dynasty wedge begins. */
const WEDGE_START = ((hashString('icarus-cosmos') % 360) * Math.PI) / 180;
/** Angular gap between top-level dynasty wedges. */
const WEDGE_GUTTER = 0.07;
/** Leaf-peer masses (suitors, sibling broods, co-resident catalogues) form cohort patches. */
const COHORT_MIN = 8;
/** Residents this many rings from a catalogue's era can head its patch. */
const CONTEMPORARY_RINGS = 1.5;
/** Room a patch allows per member, as a multiple of the bare separation cube:
 *  members are jittered, clamped, and share the patch with the anchor's kin. */
const PATCH_PACKING = 1.6;
const RELAX_ITERATIONS = 190;
/** Stars start pushing apart at this multiple of their separation floor. */
const REPULSION_MARGIN = 1.45;
const MAX_STEP = 0.8;
const CONSORT_TARGET = 2.6;
/** Rest length of the spring between a child and its placement parent. */
const PARENT_CHILD_TARGET = 6;
const RESOLUTION_SWEEPS = 220;
/** Separation and chronology passes alternate at most this many times. */
const SETTLE_ROUNDS = 6;

/* ------------------------------ realms ------------------------------ */

export type Realm = 'ouranic' | 'upper' | 'terrestrial' | 'chthonic';

export const REALM_BANDS: Record<Realm, { center: number; half: number }> = {
  ouranic: { center: 24, half: 7 },
  upper: { center: 13, half: 4 },
  terrestrial: { center: 0, half: 9 },
  chthonic: { center: -20, half: 8 },
};

/* Height is the cosmos' storey, never a relief valve: every star stays inside
 * its realm band, so no mortal drifts up among the Olympians and no god sinks to
 * the plane. A packed neighbourhood is relieved along the ring and the radius
 * (see the resolution pass), not by stretching a band. */

const OURANIC_KEYWORDS =
  /\b(sky|heaven|heavens|sun|moon|dawn|day(?:light)?|stars?|light|aether|upper air|thunder|lightning)\b/;
const CHTHONIC_KEYWORDS = /\b(underworld|death|the dead|night|darkness)\b/;

/** Which level of the three-storey Greek cosmos a figure inhabits. */
export function realmOf(character: Character): Realm {
  if (character.cluster === 'chthonic' || character.cluster === 'night-court') {
    return 'chthonic';
  }
  const domains = character.domains.join(' ').toLowerCase();
  if (CHTHONIC_KEYWORDS.test(domains)) return 'chthonic';
  if (OURANIC_KEYWORDS.test(domains)) return 'ouranic';
  switch (character.type) {
    case 'olympian':
      return 'ouranic';
    case 'titan':
    case 'god':
      return 'upper';
    default:
      return 'terrestrial';
  }
}

/* --------------------------- deterministic rng --------------------------- */

/** Lifted verbatim into src/lib/prng.ts (the Ephemeris shares them);
 *  re-exported here so the galaxy/spindle callers keep their import path. */
export { hashString, mulberry32 } from '@/lib/prng';

/** Random point inside a cluster's band volume — same elevation model as
 *  computePositions, so nebula wisps and dust stars share the stars' bands. */
export function sampleBandPoint(cluster: string, rng: () => number, jitter = 1): Vec3 {
  const cfg = CLUSTERS[cluster] ?? FALLBACK_CLUSTER;
  const clusterOffset = (hashString(cluster) % 3600) * (Math.PI / 1800);
  const angle = clusterOffset + rng() * Math.PI * 2;
  const radius = cfg.rMin + (cfg.rMax - cfg.rMin) * rng();
  const y =
    cfg.yBase +
    Math.sin(angle + clusterOffset * 0.7) * cfg.tilt +
    (rng() - 0.5) * 2 * cfg.thickness * jitter;
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

/* ----------------------------- generations ----------------------------- */

function baselineGeneration(character: Character): number {
  return CLUSTER_GENERATION[character.cluster] ?? FALLBACK_GENERATION;
}

/** Ignore parent variants that reverse the project's broad mythic chronology,
 * such as the later tradition that makes primordial Eros a child of Aphrodite. */
export function isChronologicalParentRelation(
  relation: Relation,
  charactersById: Map<string, Character>,
): boolean {
  if (relation.type !== 'parent') return false;
  const child = charactersById.get(relation.from);
  const parent = charactersById.get(relation.to);
  if (!child || !parent) return false;
  return baselineGeneration(child) + 0.25 >= baselineGeneration(parent);
}

/** Types that live inside mortal time. Everyone else — gods, titans,
 *  primordials, nymphs — is timeless: a divine parent anchors no era, because
 *  the god couples with every age of the world alike. */
export const TEMPORAL_TYPES = new Set<Character['type']>(['hero', 'mortal', 'creature']);

/** The shortest a mortal parent → child step may be charted, in rings. One ring
 *  is the norm; an over-charted house — the Argive king-list runs thirteen
 *  generations from Phoroneus to Heracles, the Trojan line seven to Hector — may
 *  be squeezed down to this so its members still meet their contemporaries.
 *  Half an outer ring is 2.8 units, just clear of MIN_PARENT_CHILD_RADIAL_GAP. */
export const MIN_STEP_RINGS = 0.5;

/** The mortal base rests on the BASE_SUPPORT-th deepest divine figure. */
const BASE_SUPPORT = 5;

/** How firmly each kind of evidence holds two figures to one era, relative to a
 *  parent step wanting to be exactly one ring (1). Spouses, lovers and siblings
 *  lived together; allies, adversaries, slayer and slain met, give or take a
 *  generation; co-residents share a city's era when nothing else dates them; and
 *  with no evidence at all a house leaves eternity at the base ring. A step
 *  shorter than MIN_STEP_RINGS is forbidden — a stiff penalty here, exact
 *  afterwards. The solution barely moves when these are halved or doubled. */
const CLOCK_WEIGHTS = {
  shortStep: 50,
  together: 2,
  met: 0.15,
  city: 0.02,
  base: 0.001,
};
const CLOCK_ROUNDS = 60;
const CLOCK_CG_ITERATIONS = 4000;
const CLOCK_TOLERANCE = 1e-6;
const TOGETHER_TYPES = new Set<RelationType>(['consort', 'lover', 'sibling']);
const MET_TYPES = new Set<RelationType>(['ally', 'adversary', 'slayer']);

/** The mortal clock as a least-squares problem, solved deterministically: every
 *  piece of evidence is a spring, and the clock is where they balance. Unknowns
 *  are the mortal-time figures, plus nymphs of no divine parentage who married or
 *  mothered mortals — a local naiad belongs to her family's era. Everyone else
 *  keeps the cosmic age passed in and only bounds the mortals from below: gods are
 *  timeless, so a divine parent or spouse dates nobody. Sourced synchronisms
 *  (PLAN.md M11) would enter as further terms. */
function solveMortalClock(
  characters: Character[],
  relations: Relation[],
  parentRelations: Relation[],
  initial: ReadonlyMap<string, number>,
  mortalBase: number,
): Map<string, number> {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const isTemporal = (id: string) => TEMPORAL_TYPES.has(charactersById.get(id)?.type ?? 'god');
  const hasDivineParent = new Set(
    parentRelations.filter((r) => !isTemporal(r.from) && !isTemporal(r.to)).map((r) => r.from),
  );
  // Timeless figures with a mortal child, spouse or lover.
  const mortalKin = new Set<string>();
  for (const relation of parentRelations) {
    if (isTemporal(relation.from)) mortalKin.add(relation.to);
  }
  for (const relation of relations) {
    if (relation.type !== 'consort' && relation.type !== 'lover') continue;
    if (isTemporal(relation.from)) mortalKin.add(relation.to);
    if (isTemporal(relation.to)) mortalKin.add(relation.from);
  }
  const isVariable = (id: string) => {
    const character = charactersById.get(id);
    if (!character || !initial.has(id)) return false;
    if (TEMPORAL_TYPES.has(character.type)) return true;
    return character.type === 'nymph' && !hasDivineParent.has(id) && mortalKin.has(id);
  };

  const ids = characters
    .map((character) => character.id)
    .filter(isVariable)
    .sort();
  const indexOf = new Map(ids.map((id, index) => [id, index]));
  const floors = ids.map((id) => (isTemporal(id) ? mortalBase : initial.get(id)!));

  // Every term is w · (t[a] − t[b] − rest)², with b = −1 for a term on one figure.
  // `oneSided` terms are stiff only while violated: a step shorter than
  // MIN_STEP_RINGS, a figure inside its floor. Cities are extra unknowns (their
  // era) after the ids. Every house has a founder held to the base, so the
  // system is positive definite.
  interface Term {
    a: number;
    b: number;
    rest: number;
    weight: number;
    oneSided: boolean;
  }
  const terms: Term[] = [];
  const hasMortalParent = new Set<number>();
  for (const relation of parentRelations) {
    const child = indexOf.get(relation.from);
    if (child === undefined) continue;
    const parent = indexOf.get(relation.to);
    if (parent === undefined) {
      // A timeless parent dates nobody; it only keeps the child outside itself.
      floors[child] = Math.max(floors[child], (initial.get(relation.to) ?? 0) + 1);
      continue;
    }
    hasMortalParent.add(child);
    terms.push({ a: child, b: parent, rest: 1, weight: 1, oneSided: false });
    terms.push({
      a: child,
      b: parent,
      rest: MIN_STEP_RINGS,
      weight: CLOCK_WEIGHTS.shortStep,
      oneSided: true,
    });
  }
  const seenTies = new Set<string>();
  for (const relation of relations) {
    const weight = TOGETHER_TYPES.has(relation.type)
      ? CLOCK_WEIGHTS.together
      : MET_TYPES.has(relation.type)
        ? CLOCK_WEIGHTS.met
        : 0;
    const a = indexOf.get(relation.from);
    const b = indexOf.get(relation.to);
    if (weight === 0 || a === undefined || b === undefined || a === b) continue;
    const key = `${Math.min(a, b)}|${Math.max(a, b)}|${weight}`;
    if (seenTies.has(key)) continue;
    seenTies.add(key);
    terms.push({ a, b, rest: 0, weight, oneSided: false });
  }
  const cityIndex = new Map<string, number>();
  ids.forEach((id, index) => {
    for (const city of [
      ...new Set((charactersById.get(id)!.residences ?? []).map((r) => r.city)),
    ].sort()) {
      if (!cityIndex.has(city)) cityIndex.set(city, ids.length + cityIndex.size);
      terms.push({
        a: index,
        b: cityIndex.get(city)!,
        rest: 0,
        weight: CLOCK_WEIGHTS.city,
        oneSided: false,
      });
    }
  });
  ids.forEach((_, index) => {
    if (!hasMortalParent.has(index)) {
      terms.push({
        a: index,
        b: -1,
        rest: mortalBase,
        weight: CLOCK_WEIGHTS.base,
        oneSided: false,
      });
    }
    terms.push({
      a: index,
      b: -1,
      rest: floors[index],
      weight: CLOCK_WEIGHTS.shortStep,
      oneSided: true,
    });
  });

  const size = ids.length + cityIndex.size;
  const residualOf = (t: Float64Array, term: Term) =>
    t[term.a] - (term.b < 0 ? 0 : t[term.b]) - term.rest;
  const isActive = (t: Float64Array, term: Term) => !term.oneSided || residualOf(t, term) < 0;
  const costOf = (t: Float64Array) =>
    terms.reduce(
      (sum, term) => sum + (isActive(t, term) ? term.weight * residualOf(t, term) ** 2 : 0),
      0,
    );

  // Semismooth Newton: freeze which one-sided terms are active, solve that
  // quadratic exactly (Jacobi-preconditioned conjugate gradients, matrix-free),
  // step towards it as far as the true cost keeps falling, and repeat until the
  // active set stops changing. Gauss–Seidel crawls here: whole houses move as
  // rigid blocks held by the stiff terms.
  let time = new Float64Array(size);
  ids.forEach((id, index) => (time[index] = initial.get(id)!));
  for (const [, index] of cityIndex) time[index] = mortalBase;

  for (let round = 0; round < CLOCK_ROUNDS; round++) {
    const active = terms.filter((term) => isActive(time, term));
    const multiply = (x: Float64Array): Float64Array => {
      const out = new Float64Array(size);
      for (const term of active) {
        const flow = term.weight * (x[term.a] - (term.b < 0 ? 0 : x[term.b]));
        out[term.a] += flow;
        if (term.b >= 0) out[term.b] -= flow;
      }
      return out;
    };
    const rhs = new Float64Array(size);
    const diagonal = new Float64Array(size).fill(1e-12);
    for (const term of active) {
      rhs[term.a] += term.weight * term.rest;
      diagonal[term.a] += term.weight;
      if (term.b >= 0) {
        rhs[term.b] -= term.weight * term.rest;
        diagonal[term.b] += term.weight;
      }
    }
    const solution = Float64Array.from(time);
    const applied = multiply(solution);
    const residual = rhs.map((value, index) => value - applied[index]);
    let direction = residual.map((value, index) => value / diagonal[index]);
    let energy = residual.reduce((sum, value, index) => sum + value * direction[index], 0);
    for (let iteration = 0; iteration < CLOCK_CG_ITERATIONS && energy > 1e-18; iteration++) {
      const image = multiply(direction);
      const curvature = direction.reduce((sum, value, index) => sum + value * image[index], 0);
      if (!(curvature > 0)) break;
      const step = energy / curvature;
      for (let index = 0; index < size; index++) {
        solution[index] += step * direction[index];
        residual[index] -= step * image[index];
      }
      const nextEnergy = residual.reduce(
        (sum, value, index) => sum + (value * value) / diagonal[index],
        0,
      );
      direction = residual.map(
        (value, index) => value / diagonal[index] + (nextEnergy / energy) * direction[index],
      );
      energy = nextEnergy;
    }

    // Backtrack along time → solution until the true (piecewise) cost falls.
    const before = costOf(time);
    let next = solution;
    for (let halving = 0; halving < 30 && costOf(next) > before; halving++) {
      next = next.map((value, index) => (value + time[index]) / 2);
    }
    const moved = next.reduce(
      (most, value, index) => Math.max(most, Math.abs(value - time[index])),
      0,
    );
    time = next;
    if (moved < CLOCK_TOLERANCE) break;
  }

  return new Map(ids.map((id, index) => [id, Math.max(floors[index], time[index])]));
}

/** Stable generation numbers — the "mortal clock" model:
 *  - Divine figures keep Hesiod's cosmic ages (longest path over divine→divine
 *    parent steps from their cluster baselines). Gods are timeless: no mortal
 *    spouse or child ever moves them.
 *  - Mortal time begins at one base ring just outside the populated divine ages,
 *    and only mortal→mortal steps advance the clock.
 *  - Where a house sits on that clock is solved, not counted: spouses, siblings
 *    and those who met are held to one era, so contemporaries share a ring
 *    however long or short their king-lists run. Values are fractional rings.
 *  The layout stays fixed while lenses rewire the visible relation lines. */
export function computeGenerations(
  characters: Character[],
  relations: Relation[],
): Map<string, number> {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const isTemporal = (id: string) => {
    const character = charactersById.get(id);
    return character !== undefined && TEMPORAL_TYPES.has(character.type);
  };
  const parentRelations = relations.filter((relation) =>
    isChronologicalParentRelation(relation, charactersById),
  );
  const propagate = (edges: Relation[], generations: Map<string, number>, step = 1) => {
    for (let pass = 0; pass < characters.length; pass++) {
      let changed = false;
      for (const relation of edges) {
        const parentGeneration = generations.get(relation.to);
        const childGeneration = generations.get(relation.from);
        if (parentGeneration === undefined || childGeneration === undefined) continue;
        if (parentGeneration + step > childGeneration + 0.001) {
          generations.set(relation.from, parentGeneration + step);
          changed = true;
        }
      }
      if (!changed) break;
    }
  };

  // Phase A — the divine ages.
  const generations = new Map<string, number>();
  for (const character of characters) {
    if (TEMPORAL_TYPES.has(character.type)) continue;
    generations.set(character.id, character.id === 'chaos' ? 0 : baselineGeneration(character));
  }
  propagate(
    parentRelations.filter((r) => !isTemporal(r.from) && !isTemporal(r.to)),
    generations,
  );

  // The mortal base: one ring outside the divine ages. It rests on a populated
  // divine generation — the BASE_SUPPORT-th deepest figure — so one long chain
  // (Gaia … Atlas → Maia → Hermes → Pan) cannot push every mortal outward.
  const divineAges = [...generations.values()].sort((a, b) => b - a);
  const supported =
    divineAges.length >= BASE_SUPPORT ? divineAges[BASE_SUPPORT - 1] : divineAges[0];
  const mortalBase = Math.ceil(supported ?? -1) + 1;

  // Phase B — the mortal clock. Every mortal-time figure starts at the base and
  // each mortal → mortal step advances it one ring (longest path): a feasible
  // starting point for the solve below.
  for (const character of characters) {
    if (TEMPORAL_TYPES.has(character.type)) generations.set(character.id, mortalBase);
  }
  propagate(
    parentRelations.filter((r) => isTemporal(r.from) && isTemporal(r.to)),
    generations,
  );

  // Phase C — synchronise the houses. Longest path alone charts a house by how
  // much of it survives: Clytemnestra sat seven rings outside her husband because
  // her line is charted deep and the Pelopid line shallow, and their son fell
  // eight rings from his father. solveMortalClock keeps every parent → child step
  // positive and lets the evidence of contemporaneity decide the rest.
  for (const [id, generation] of solveMortalClock(
    characters,
    relations,
    parentRelations,
    generations,
    mortalBase,
  )) {
    generations.set(id, generation);
  }

  // Final fixpoint over every chronological edge (covers the rare god born of a
  // mortal, and any step the solve left a hair short), so no child ever ends up
  // inside a parent.
  propagate(parentRelations, generations, MIN_STEP_RINGS);

  return generations;
}

/* ------------------------------ kinship ------------------------------ */

export interface Kinship {
  generations: Map<string, number>;
  primaryParent: Map<string, string>;
  /** Children by placement parent, in the angular order their wedges are laid out. */
  childrenOf: Map<string, string[]>;
  consortsOf: Map<string, string[]>;
  /** Dynasty roots in the order their wedges go round the disc. */
  rootOrder: string[];
}

/** One solve per dataset: the layout asks for the kinship several times over
 *  (positions, wedges, cohorts, metrics), and the mortal clock is not free.
 *  Keyed on array identity — callers never mutate the arrays or the result. */
const kinshipCache = new WeakMap<Relation[], WeakMap<Character[], Kinship>>();

export function buildKinship(characters: Character[], relations: Relation[]): Kinship {
  const cached = kinshipCache.get(relations)?.get(characters);
  if (cached) return cached;
  const kinship = computeKinship(characters, relations);
  if (!kinshipCache.has(relations)) kinshipCache.set(relations, new WeakMap());
  kinshipCache.get(relations)!.set(characters, kinship);
  return kinship;
}

function computeKinship(characters: Character[], relations: Relation[]): Kinship {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const generations = computeGenerations(characters, relations);
  const parentRelations = relations.filter((relation) =>
    isChronologicalParentRelation(relation, charactersById),
  );
  const relationDegree = new Map<string, number>();
  for (const relation of relations) {
    relationDegree.set(relation.from, (relationDegree.get(relation.from) ?? 0) + 1);
    relationDegree.set(relation.to, (relationDegree.get(relation.to) ?? 0) + 1);
  }

  const parentsByChild = new Map<string, string[]>();
  for (const relation of parentRelations) {
    if (!charactersById.has(relation.from) || !charactersById.has(relation.to)) continue;
    const parents = parentsByChild.get(relation.from) ?? [];
    if (!parents.includes(relation.to)) parents.push(relation.to);
    parentsByChild.set(relation.from, parents);
  }
  // The placement parent decides where a star goes; it never ranks the parents.
  // A mortal-time child is placed with its mortal-time house: a timeless parent
  // fathers every age alike, and would otherwise gather unrelated dynasties
  // under one star. Among the remaining candidates the better-connected wins —
  // without a gender field this is the nearest proxy for the patrilineal house.
  const isTemporal = (id: string) => TEMPORAL_TYPES.has(charactersById.get(id)!.type);
  const primaryParent = new Map<string, string>();
  for (const [childId, parentIds] of parentsByChild) {
    parentIds.sort((a, b) => {
      if (isTemporal(childId) && isTemporal(a) !== isTemporal(b)) return isTemporal(a) ? -1 : 1;
      const degreeDifference = (relationDegree.get(b) ?? 0) - (relationDegree.get(a) ?? 0);
      if (degreeDifference !== 0) return degreeDifference;
      const generationDifference = (generations.get(b) ?? 0) - (generations.get(a) ?? 0);
      return generationDifference || a.localeCompare(b);
    });
    primaryParent.set(childId, parentIds[0]);
  }

  const childrenOf = new Map<string, string[]>();
  for (const [childId, parentId] of primaryParent) {
    const children = childrenOf.get(parentId) ?? [];
    children.push(childId);
    childrenOf.set(parentId, children);
  }
  for (const children of childrenOf.values()) children.sort();

  const consortsOf = new Map<string, string[]>();
  for (const relation of relations) {
    if (relation.type !== 'consort') continue;
    if (!charactersById.has(relation.from) || !charactersById.has(relation.to)) continue;
    const fromList = consortsOf.get(relation.from) ?? [];
    if (!fromList.includes(relation.to)) fromList.push(relation.to);
    consortsOf.set(relation.from, fromList);
    const toList = consortsOf.get(relation.to) ?? [];
    if (!toList.includes(relation.from)) toList.push(relation.from);
    consortsOf.set(relation.to, toList);
  }
  for (const list of consortsOf.values()) {
    list.sort(
      (a, b) => (relationDegree.get(b) ?? 0) - (relationDegree.get(a) ?? 0) || a.localeCompare(b),
    );
  }

  const kinship: Kinship = { generations, primaryParent, childrenOf, consortsOf, rootOrder: [] };
  orderFamilies(characters, relations, kinship);
  return kinship;
}

/* ------------------------------ wedges ------------------------------ */

export interface Wedge {
  mid: number;
  half: number;
}

/** Who takes arc in the sunburst, and who merely shares someone else's: a lone
 *  spouse adopts a partner's wedge, and a cohort member sits in its anchor's. */
interface WedgeForest {
  roots: string[];
  adopted: Set<string>;
  patchAnchor: Map<string, string>;
  weightBonus: Map<string, number>;
  placedChildren: (id: string) => string[];
  subtreeWeight: (id: string) => number;
}

function wedgeForestOf(
  characters: Character[],
  kinship: Kinship,
  weightBonus: Map<string, number>,
  patchAnchor: ReadonlyMap<string, string>,
): WedgeForest {
  const { primaryParent, childrenOf, consortsOf } = kinship;
  const placedChildren = (id: string) =>
    (childrenOf.get(id) ?? []).filter((childId) => !patchAnchor.has(childId));
  const weight = new Map<string, number>();
  const subtreeWeight = (id: string): number => {
    const cached = weight.get(id);
    if (cached !== undefined) return cached;
    weight.set(id, 1); // cycle guard; chronological parent edges cannot cycle
    let total = 1 + (weightBonus.get(id) ?? 0);
    for (const childId of placedChildren(id)) total += subtreeWeight(childId);
    weight.set(id, total);
    return total;
  };
  const allRoots = characters.filter((character) => !primaryParent.has(character.id));
  const adopted = new Set<string>();
  for (const root of allRoots) {
    const isSingleton = (childrenOf.get(root.id)?.length ?? 0) === 0;
    if (isSingleton && (consortsOf.get(root.id)?.length ?? 0) > 0) adopted.add(root.id);
  }
  const roots = allRoots
    .filter((root) => !adopted.has(root.id) && !patchAnchor.has(root.id))
    .sort((a, b) => subtreeWeight(b.id) - subtreeWeight(a.id) || a.id.localeCompare(b.id))
    .map((root) => root.id);
  return {
    roots,
    adopted,
    patchAnchor: new Map(patchAnchor),
    weightBonus,
    placedChildren,
    subtreeWeight,
  };
}

/** Lay the forest round the disc in the given orders: a root's arc is its share of
 *  the subtree weight, children subdivide their parent's arc centred on it, and any
 *  arc a parent's cohort patch bought flanks them. */
function allocateWedges(
  forest: WedgeForest,
  roots: readonly string[],
  childrenInOrder: (id: string) => readonly string[],
): { wedges: Map<string, Wedge>; end: number } {
  const { subtreeWeight, weightBonus } = forest;
  const wedges = new Map<string, Wedge>();
  const totalWeight = roots.reduce((sum, id) => sum + subtreeWeight(id), 0) || 1;
  const totalGutter = Math.min(roots.length * WEDGE_GUTTER, Math.PI / 2);
  const usableArc = Math.PI * 2 - totalGutter;
  const gutter = totalGutter / Math.max(roots.length, 1);

  const assignWedge = (id: string, start: number, width: number): void => {
    wedges.set(id, { mid: start + width / 2, half: width / 2 });
    const children = childrenInOrder(id);
    if (children.length === 0) return;
    const childTotal = children.reduce((sum, childId) => sum + subtreeWeight(childId), 0);
    // Children share only the arc their own subtrees earned, centred on the
    // parent. The rest of the wedge was bought by the parent's cohort patch
    // (weightBonus) and flanks them: split among a hub's few real children it
    // scattered them across the whole patch, far from the parent at its middle.
    const childrenArc = (width * childTotal) / (childTotal + (weightBonus.get(id) ?? 0));
    let childCursor = start + (width - childrenArc) / 2;
    for (const childId of children) {
      const childWidth = (childrenArc * subtreeWeight(childId)) / childTotal;
      assignWedge(childId, childCursor, childWidth);
      childCursor += childWidth;
    }
  };

  let cursor = WEDGE_START;
  for (const id of roots) {
    const width = (usableArc * subtreeWeight(id)) / totalWeight;
    assignWedge(id, cursor, width);
    cursor += width + gutter;
  }
  return { wedges, end: cursor };
}

/** How hard each tie pulls two wedges together when the houses are ordered. */
const ORDER_TIE = { partners: 2, bridgeParent: 1 };
const ORDER_SWEEPS = 12;

/** Choose the angular order of the dynasties and of every parent's children.
 *  The sunburst fixes how *much* arc a house gets; which houses are neighbours is
 *  free, and alphabetical order throws a bride to the far side of the disc from
 *  her husband. Each sweep moves every subtree toward the weighted centre of the
 *  figures it is tied to outside itself — spouses, lovers, and the parents a child
 *  is not placed under — then tries swapping neighbours; a change is kept only if
 *  it shortens the total tie length. Deterministic; writes the orders into
 *  `kinship.childrenOf` and `kinship.rootOrder`. */
function orderFamilies(characters: Character[], relations: Relation[], kinship: Kinship): void {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const cohorts = detectCohorts(characters, relations, kinship);
  const patchAnchor = new Map(
    cohorts.flatMap((cohort) => cohort.members.map((member) => [member, cohort.anchor] as const)),
  );
  const weightBonus = new Map<string, number>();
  for (const cohort of cohorts) {
    weightBonus.set(cohort.anchor, (weightBonus.get(cohort.anchor) ?? 0) + cohort.members.length);
  }
  const forest = wedgeForestOf(characters, kinship, weightBonus, patchAnchor);

  // Mutable orders. SUPER is the virtual parent of the roots.
  const SUPER = '';
  const order = new Map<string, string[]>([[SUPER, [...forest.roots]]]);
  const up = new Map<string, string>();
  const visit = (id: string, parent: string) => {
    up.set(id, parent);
    const children = forest.placedChildren(id);
    if (children.length > 0) order.set(id, [...children]);
    for (const child of children) visit(child, id);
  };
  for (const root of forest.roots) visit(root, SUPER);
  const childrenInOrder = (id: string) => order.get(id) ?? [];

  // A figure is drawn in its own wedge, its anchor's, or its partner's.
  const homeOf = (id: string): string | undefined => {
    let current = id;
    for (let hop = 0; hop < 4 && !up.has(current); hop++) {
      const next =
        patchAnchor.get(current) ??
        (forest.adopted.has(current)
          ? (kinship.consortsOf.get(current) ?? []).find((partner) => partner !== id)
          : undefined);
      if (next === undefined) return undefined;
      current = next;
    }
    return up.has(current) ? current : undefined;
  };

  const ties: { a: string; b: string; pull: number }[] = [];
  const addTie = (from: string, to: string, weight: number) => {
    const a = homeOf(from);
    const b = homeOf(to);
    if (a === undefined || b === undefined || a === b) return;
    const radius =
      (ringRadiusOf(kinship.generations.get(from) ?? FALLBACK_GENERATION) +
        ringRadiusOf(kinship.generations.get(to) ?? FALLBACK_GENERATION)) /
      2;
    ties.push({ a, b, pull: weight * radius });
  };
  for (const relation of relations) {
    if (relation.type === 'consort' || relation.type === 'lover') {
      addTie(relation.from, relation.to, ORDER_TIE.partners);
    } else if (
      isChronologicalParentRelation(relation, charactersById) &&
      kinship.primaryParent.get(relation.from) !== relation.to
    ) {
      addTie(relation.from, relation.to, ORDER_TIE.bridgeParent);
    }
  }
  if (ties.length === 0) {
    kinship.rootOrder = forest.roots;
    return;
  }

  const lay = () => allocateWedges(forest, childrenInOrder(SUPER), childrenInOrder).wedges;
  const costOf = (wedges: Map<string, Wedge>) =>
    ties.reduce(
      (sum, tie) =>
        sum +
        tie.pull * Math.abs(normalizeSignedAngle(wedges.get(tie.b)!.mid - wedges.get(tie.a)!.mid)),
      0,
    );
  const chainOf = (id: string): string[] => {
    const chain = [id];
    while (up.get(chain[chain.length - 1]) !== SUPER) chain.push(up.get(chain[chain.length - 1])!);
    return chain;
  };
  const chains = new Map<string, string[]>();
  for (const tie of ties) {
    for (const id of [tie.a, tie.b]) if (!chains.has(id)) chains.set(id, chainOf(id));
  }

  let wedges = lay();
  let cost = costOf(wedges);
  const parents = [...order.keys()].sort();
  const keep = (parent: string, candidate: string[]): boolean => {
    const previous = order.get(parent)!;
    order.set(parent, candidate);
    const nextWedges = lay();
    const nextCost = costOf(nextWedges);
    if (nextCost < cost - 1e-9) {
      wedges = nextWedges;
      cost = nextCost;
      return true;
    }
    order.set(parent, previous);
    return false;
  };

  for (let sweep = 0; sweep < ORDER_SWEEPS; sweep++) {
    let improved = false;

    // Where each subtree is pulled: the weighted centre of what it is tied to outside.
    const pullX = new Map<string, number>();
    const pullY = new Map<string, number>();
    const pulled = new Map<string, number>();
    const tug = (subtree: string, towards: number, weight: number) => {
      pullX.set(subtree, (pullX.get(subtree) ?? 0) + Math.cos(towards) * weight);
      pullY.set(subtree, (pullY.get(subtree) ?? 0) + Math.sin(towards) * weight);
      pulled.set(subtree, (pulled.get(subtree) ?? 0) + weight);
    };
    for (const tie of ties) {
      const chainA = chains.get(tie.a)!;
      const chainB = chains.get(tie.b)!;
      for (const subtree of chainA) if (!chainB.includes(subtree)) tug(subtree, wedges.get(tie.b)!.mid, tie.pull);
      for (const subtree of chainB) if (!chainA.includes(subtree)) tug(subtree, wedges.get(tie.a)!.mid, tie.pull);
    }
    for (const parent of parents) {
      const children = order.get(parent)!;
      if (children.length < 2) continue;
      const reference = parent === SUPER ? WEDGE_START + Math.PI : wedges.get(parent)!.mid;
      const keyOf = (child: string) => {
        const bearing = pulled.has(child)
          ? Math.atan2(pullY.get(child)!, pullX.get(child)!)
          : wedges.get(child)!.mid;
        return normalizeSignedAngle(bearing - reference);
      };
      const keys = new Map(children.map((child) => [child, keyOf(child)]));
      const candidate = [...children].sort(
        (a, b) => keys.get(a)! - keys.get(b)! || a.localeCompare(b),
      );
      if (candidate.some((child, index) => child !== children[index]) && keep(parent, candidate)) {
        improved = true;
      }
    }

    for (const parent of parents) {
      for (let index = 0; index + 1 < order.get(parent)!.length; index++) {
        const swapped = [...order.get(parent)!];
        [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
        if (keep(parent, swapped)) improved = true;
      }
    }
    if (!improved) break;
  }

  // Patch members follow the placed children: they sit together in the patch.
  for (const [parent, children] of kinship.childrenOf) {
    const placed = order.get(parent) ?? [];
    const patched = children.filter((child) => !placed.includes(child));
    kinship.childrenOf.set(parent, [...placed, ...patched]);
  }
  kinship.rootOrder = order.get(SUPER)!;
}

/** Sunburst over the family forest: every dynasty root receives an angular
 *  wedge proportional to its subtree size; children recursively subdivide
 *  their parent's wedge. Lone spouses adopt their partner's wedge instead of
 *  consuming root arc. This is the "angle = dynasty" half of the contract.
 *  Optional weightBonus inflates anchor subtrees so cohort patches receive arc
 *  beside the anchor's children, never in place of them. A cohort member
 *  (`patchAnchor`: member → anchor) sits in its anchor's wedge, so it takes no
 *  arc of its own — that bonus already paid for it. */
export function computeDynastyWedges(
  characters: Character[],
  relations: Relation[],
  weightBonus: Map<string, number> = new Map(),
  patchAnchor: ReadonlyMap<string, string> = new Map(),
): Map<string, Wedge> {
  const kinship = buildKinship(characters, relations);
  const forest = wedgeForestOf(characters, kinship, weightBonus, patchAnchor);
  // The order orderFamilies chose, then any root it never saw (a caller's own patches).
  const ranked = new Map(kinship.rootOrder.map((id, index) => [id, index]));
  const rankOf = (id: string) => ranked.get(id) ?? Number.MAX_SAFE_INTEGER;
  const roots = [...forest.roots].sort((a, b) => rankOf(a) - rankOf(b));
  const { wedges, end } = allocateWedges(forest, roots, forest.placedChildren);

  // A lone spouse shares its partner's wedge — or, if the partner lives in a
  // cohort patch, the wedge of that patch's anchor.
  const homeOf = (id: string) => wedges.get(id) ?? wedges.get(patchAnchor.get(id) ?? '');
  let cursor = end;
  for (const id of forest.adopted) {
    const partnerId = (kinship.consortsOf.get(id) ?? []).find((candidate) => homeOf(candidate));
    const partnerWedge = partnerId ? homeOf(partnerId) : undefined;
    if (partnerWedge) {
      wedges.set(id, partnerWedge);
    } else {
      wedges.set(id, { mid: cursor + 0.2, half: 0.2 });
      cursor += 0.45;
    }
  }
  return wedges;
}

/* ------------------------------ cohorts ------------------------------ */

export interface Cohort {
  id: string;
  anchor: string;
  members: string[];
}

function isLeaf(id: string, childrenOf: Map<string, string[]>): boolean {
  return (childrenOf.get(id)?.length ?? 0) === 0;
}

/** Half-width (radians) of a cohort patch: the arc its members need to pack at
 *  the separation floor into the patch's radial depth and realm height — never
 *  less than the anchor's own wedge, which the cohort's weight already bought.
 *  (An earlier golden-angle "spread" was a length read as radians: it pinned
 *  every patch at the ±153° cap and smeared a king's children round the ring.) */
function cohortPatchHalf(
  memberCount: number,
  anchorHalf: number,
  ringRadius: number,
  bandHalf: number,
): number {
  const depth = RADIUS_TOLERANCE + cohortRadialTolerance(memberCount);
  const arc = (memberCount * MIN_STAR_DISTANCE ** 3 * PATCH_PACKING) / (depth * 2 * bandHalf);
  const neededHalf = arc / (2 * Math.max(ringRadius, BASE_RADIUS));
  return Math.max(anchorHalf, Math.min(neededHalf, Math.PI * 0.85));
}

/** Cohort patches may span several radial lanes so 3D separation can converge. */
function cohortRadialTolerance(memberCount: number): number {
  const lanes = Math.ceil(Math.sqrt(memberCount / COHORT_MIN));
  return Math.min(RADIUS_TOLERANCE + lanes * 0.45, 5);
}

function residenceGroupKeys(character: Character): string[] {
  const island = character.id.match(/-(ithaca|dulichium|zacynthus|same)$/)?.[1];
  if (island) return [`island:${island}`];
  const cities = [...new Set((character.residences ?? []).map((residence) => residence.city))].sort();
  return cities.map((city) => `residence:${city}`);
}

/** A city catalogue gathers round the head of the house it lived under: among the
 *  residents placed by genealogy and within a generation or so of the members'
 *  own era, the one with the largest family (Priam for Troy) — not the earliest
 *  resident, who tends to be a river god from the dawn of the world. */
function residenceCohortAnchor(
  members: string[],
  groupKey: string,
  characters: Character[],
  kinship: Kinship,
): string {
  const memberSet = new Set(members);
  const city = groupKey.startsWith('island:')
    ? undefined
    : groupKey.replace(/^residence:/, '');
  const island = groupKey.startsWith('island:') ? groupKey.replace(/^island:/, '') : undefined;
  const generationOf = (id: string) => kinship.generations.get(id) ?? FALLBACK_GENERATION;
  const eras = members.map(generationOf).sort((a, b) => a - b);
  const era = eras[Math.floor((eras.length - 1) / 2)];
  const familySize = (id: string) =>
    (kinship.childrenOf.get(id)?.length ?? 0) + (kinship.primaryParent.has(id) ? 1 : 0);
  const neighbours = characters
    .filter((character) => {
      if (memberSet.has(character.id) || familySize(character.id) === 0) return false;
      if (island) return character.id.endsWith(`-${island}`);
      return character.residences?.some((residence) => residence.city === city);
    })
    .sort(
      (a, b) =>
        Math.abs(generationOf(a.id) - era) - Math.abs(generationOf(b.id) - era) ||
        a.id.localeCompare(b.id),
    );
  const contemporaries = neighbours.filter(
    (character) => Math.abs(generationOf(character.id) - era) <= CONTEMPORARY_RINGS,
  );
  const head = [...contemporaries].sort(
    (a, b) => familySize(b.id) - familySize(a.id) || a.id.localeCompare(b.id),
  )[0];
  return head?.id ?? neighbours[0]?.id ?? members[0];
}

/** Detect leaf-peer masses (8+ leaves): sibling broods, and — for figures with
 *  no known parent — war hosts, a hero's foes, and co-resident catalogues. A
 *  known parent always outranks a host or a city: genealogy places a star
 *  whenever it can, and cohorts shelter only those genealogy cannot place. */
export function detectCohorts(
  characters: Character[],
  relations: Relation[],
  kinship: Kinship = buildKinship(characters, relations),
): Cohort[] {
  const { childrenOf, primaryParent } = kinship;
  const assigned = new Set<string>();
  const cohorts: Cohort[] = [];

  for (const [parentId, children] of childrenOf) {
    const leaves = children.filter((id) => isLeaf(id, childrenOf)).sort();
    if (leaves.length < COHORT_MIN) continue;
    cohorts.push({ id: `siblings:${parentId}`, anchor: parentId, members: leaves });
    for (const id of leaves) assigned.add(id);
  }

  // Hub-masses: leaf followers fanning into one leader — the war hosts (Hector's
  // 119 Trojan allies, Agamemnon's Achaeans), the Argonauts (allies of Jason), a
  // hero's enemies (the suitors as adversaries of Odysseus). These heroic-age
  // combatants share neither a parent nor (often) a residence, so without this
  // pass they scatter onto the war generation and jam it. Allies bind before
  // adversaries, so a warrior is filed under his own host, not his killer.
  const collectHubs = (types: ReadonlySet<RelationType>, prefix: string) => {
    const fan = new Map<string, Set<string>>();
    for (const relation of relations) {
      if (!types.has(relation.type) || relation.from === relation.to) continue;
      if (assigned.has(relation.from) || !isLeaf(relation.from, childrenOf)) continue;
      if (primaryParent.has(relation.from)) continue;
      if (!fan.has(relation.to)) fan.set(relation.to, new Set());
      fan.get(relation.to)!.add(relation.from);
    }
    for (const hub of [...fan.keys()].sort()) {
      const members = [...fan.get(hub)!].filter((id) => !assigned.has(id)).sort();
      if (members.length < COHORT_MIN) continue;
      cohorts.push({ id: `${prefix}:${hub}`, anchor: hub, members });
      for (const id of members) assigned.add(id);
    }
  };
  collectHubs(new Set<RelationType>(['ally']), 'host');
  collectHubs(new Set<RelationType>(['adversary', 'slayer']), 'foes');

  const byGroup = new Map<string, string[]>();
  for (const character of characters) {
    if (assigned.has(character.id) || !isLeaf(character.id, childrenOf)) continue;
    if (primaryParent.has(character.id)) continue;
    for (const groupKey of residenceGroupKeys(character)) {
      const list = byGroup.get(groupKey) ?? [];
      if (!list.includes(character.id)) list.push(character.id);
      byGroup.set(groupKey, list);
    }
  }
  // A figure with several residences joins one patch only: the largest catalogue
  // claims its members first, and a group left under the minimum dissolves.
  const groups = [...byGroup.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  for (const [groupKey, candidates] of groups) {
    const members = candidates.filter((id) => !assigned.has(id)).sort();
    if (members.length < COHORT_MIN) continue;
    cohorts.push({
      id: groupKey,
      anchor: residenceCohortAnchor(members, groupKey, characters, kinship),
      members,
    });
    for (const id of members) assigned.add(id);
  }

  cohorts.sort((a, b) => a.id.localeCompare(b.id));
  return cohorts;
}

function buildCohortOf(cohorts: Cohort[]): Map<string, Cohort> {
  const cohortOf = new Map<string, Cohort>();
  for (const cohort of cohorts) {
    for (const member of cohort.members) cohortOf.set(member, cohort);
  }
  return cohortOf;
}

/** Dynasty wedges with cohort patch widening and the spiral twist — the same
 *  angular bounds computePositions enforces. */
export function effectiveWedges(
  characters: Character[],
  relations: Relation[],
): Map<string, Wedge> {
  const kinship = buildKinship(characters, relations);
  const cohorts = detectCohorts(characters, relations, kinship);
  const cohortOf = buildCohortOf(cohorts);
  const weightBonus = new Map<string, number>();
  for (const cohort of cohorts) {
    weightBonus.set(cohort.anchor, (weightBonus.get(cohort.anchor) ?? 0) + cohort.members.length);
  }
  const patchAnchor = new Map(
    cohorts.flatMap((cohort) => cohort.members.map((member) => [member, cohort.anchor] as const)),
  );
  const dynastyWedges = computeDynastyWedges(characters, relations, weightBonus, patchAnchor);
  const wedges = new Map<string, Wedge>();
  for (const character of characters) {
    if (character.id === 'chaos') continue;
    const generation = kinship.generations.get(character.id) ?? FALLBACK_GENERATION;
    const cohort = cohortOf.get(character.id);
    if (cohort) {
      const anchorWedge = dynastyWedges.get(cohort.anchor) ?? { mid: 0, half: Math.PI };
      const ringRadius = ringRadiusOf(generation);
      wedges.set(character.id, {
        mid: anchorWedge.mid + spiralTwistOf(generation),
        half: cohortPatchHalf(
          cohort.members.length,
          anchorWedge.half,
          ringRadius,
          REALM_BANDS[realmOf(character)].half,
        ),
      });
    } else {
      const wedge = dynastyWedges.get(character.id) ?? { mid: 0, half: Math.PI };
      wedges.set(character.id, {
        mid: wedge.mid + spiralTwistOf(generation),
        // Never narrower than one star at this radius: a sliver thinner than the
        // separation floor leaves neighbouring leaves no way to make room, and
        // the inner rings, where an arc is short, knot.
        half: Math.max(wedge.half, MIN_STAR_DISTANCE / (2 * ringRadiusOf(generation))),
      });
    }
  }
  return wedges;
}

/* ------------------------------ near pairs ------------------------------ */

/** Uniform x/z grid over star indices. Cells are `reach` wide, so every star
 *  within `reach` of a point lies in the 3×3 block around that point's cell.
 *  Both solver passes only ever act on near pairs; asking the grid for them
 *  replaces the all-pairs sweep, and visiting them in ascending index order
 *  keeps the arithmetic — and therefore every coordinate — identical to it. */
function createPlanarGrid(reach: number) {
  const cells = new Map<number, number[]>();
  const cellOf = new Map<number, number>();
  const cellKey = (cx: number, cz: number) => (cx + 0x8000) * 0x10000 + (cz + 0x8000);

  return {
    /** Insert a star, or move it if it is already on the grid. */
    place(index: number, x: number, z: number): void {
      const key = cellKey(Math.floor(x / reach), Math.floor(z / reach));
      const previous = cellOf.get(index);
      if (previous === key) return;
      if (previous !== undefined) {
        const bucket = cells.get(previous)!;
        bucket.splice(bucket.indexOf(index), 1);
      }
      cellOf.set(index, key);
      const bucket = cells.get(key);
      if (bucket) bucket.push(index);
      else cells.set(key, [index]);
    },
    /** Star indices above `after` that may lie within `reach` of (x, z), ascending. */
    near(x: number, z: number, after: number): number[] {
      const cx = Math.floor(x / reach);
      const cz = Math.floor(z / reach);
      const found: number[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (const index of cells.get(cellKey(cx + dx, cz + dz)) ?? []) {
            if (index > after) found.push(index);
          }
        }
      }
      return found.sort((a, b) => a - b);
    },
  };
}

/* ---------------------------- computePositions ---------------------------- */

export interface LayoutOptions {
  /** Remap generations to start at zero — used by the per-city skies so a
   *  late-generation subset forms a compact cluster instead of a hollow ring. */
  compact?: boolean;
}

function normalizeSignedAngle(angle: number): number {
  const turn = Math.PI * 2;
  let a = ((angle % turn) + turn) % turn;
  if (a > Math.PI) a -= turn;
  return a;
}

interface StarState {
  theta: number;
  radius: number;
  y: number;
}

interface StarBounds {
  starAngular: number;
  radialHalf: number;
  radialTolerance: number;
  band: { center: number; half: number };
  ringRadius: number;
}

function phyllotaxisSeed(
  index: number,
  count: number,
  patchMid: number,
  patchHalf: number,
  ringRadius: number,
  bandCenter: number,
  bandHalf: number,
  radialTolerance: number,
  seed: string,
): StarState {
  const rng = mulberry32(hashString(seed));
  const t = index + 0.5;
  const rawOffset = (t - count / 2) * GOLDEN_ANGLE;
  const maxRaw = (count / 2) * GOLDEN_ANGLE;
  const scale = maxRaw > patchHalf * 0.98 ? (patchHalf * 0.98) / maxRaw : 1;
  const angleOffset = rawOffset * scale;
  const theta = patchMid + angleOffset + (rng() - 0.5) * Math.min(patchHalf * 0.02, 0.012);
  const rSpread = radialTolerance * 0.85;
  const rNorm = count > 1 ? (index / (count - 1)) * 2 - 1 : 0;
  const radius =
    ringRadius +
    Math.max(0, rNorm * rSpread) +
    (rng() - 0.5) * Math.min(radialTolerance, RADIUS_TOLERANCE) * 0.4;
  const yNorm = count > 1 ? index / (count - 1) : 0.5;
  const y =
    bandCenter +
    (yNorm - 0.5) * 2 * bandHalf * 0.92 +
    Math.sin(t * GOLDEN_ANGLE) * bandHalf * 0.08 +
    (rng() - 0.5) * bandHalf * 0.05;
  return { theta, radius, y };
}

/** Deterministic cosmos layout. See the header comment for the model. */
export function computePositions(
  characters: Character[],
  relations: Relation[],
  options: LayoutOptions = {},
): Map<string, Vec3> {
  const kinship = buildKinship(characters, relations);
  const generations = new Map(kinship.generations);
  if (options.compact) {
    const values = [...generations.values()];
    const minGeneration = values.length > 0 ? Math.min(...values) : 0;
    for (const [id, generation] of generations) generations.set(id, generation - minGeneration);
  }
  const cohorts = detectCohorts(characters, relations, kinship);
  const cohortOf = buildCohortOf(cohorts);
  const wedges = effectiveWedges(characters, relations);
  const schedule = radialScheduleOf(generations);

  /* ---- seed: generation ring, twisted wedge mid, realm band ---- */

  const order = [...characters].sort((a, b) => a.id.localeCompare(b.id));
  const state = new Map<string, StarState>();
  const bounds = new Map<string, StarBounds>();

  for (const character of order) {
    if (character.id === 'chaos') continue;
    const generation = generations.get(character.id) ?? FALLBACK_GENERATION;
    const wedge = wedges.get(character.id) ?? { mid: 0, half: Math.PI };
    const band = REALM_BANDS[realmOf(character)];
    const cohort = cohortOf.get(character.id);
    const ringRadius = schedule.ringRadius(generation);
    const generationBand = schedule.bandWidth(generation);
    const starAngular = wedge.mid;
    const radialHalf = wedge.half;
    // On a crowded ring the population band IS the radial room, and outward
    // billow must stay within the push the band gave the next ring (+1 of slack)
    // so a parent never reaches its child (chronology, hard rule 6). Comfortable
    // rings keep the original cohort-lane / RADIUS_TOLERANCE behaviour.
    const radialTolerance =
      generationBand > 0
        ? generationBand + 1
        : cohort
          ? cohortRadialTolerance(cohort.members.length)
          : RADIUS_TOLERANCE;
    let seeded: StarState;
    if (cohort) {
      const index = cohort.members.indexOf(character.id);
      seeded = phyllotaxisSeed(
        index,
        cohort.members.length,
        starAngular,
        radialHalf,
        ringRadius,
        band.center,
        band.half,
        radialTolerance,
        `${cohort.id}|${character.id}`,
      );
    } else {
      const rng = mulberry32(hashString(character.id));
      const theta = starAngular + (rng() - 0.5) * Math.min(radialHalf, 0.4);
      const radius = ringRadius + rng() * generationBand;
      const y =
        band.center +
        Math.sin(theta * 1.7 + rng() * Math.PI * 2) * band.half * 0.3 +
        (rng() - 0.5) * band.half;
      seeded = { theta, radius, y };
    }
    state.set(character.id, seeded);
    bounds.set(character.id, {
      starAngular,
      radialHalf,
      radialTolerance,
      band,
      ringRadius,
    });
  }

  const ids = order.map((c) => c.id).filter((id) => id !== 'chaos' && state.has(id));
  const toCartesian = (s: StarState): Vec3 => [
    Math.cos(s.theta) * s.radius,
    s.y,
    Math.sin(s.theta) * s.radius,
  ];
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  /* ---- relation-flavoured force sets ---- */

  const hostileTypes = new Set(['adversary', 'slayer']);
  const consortPairs: [string, string][] = [];
  const loverPairs: [string, string][] = [];
  const hostilePairs: [string, string][] = [];
  const seenPairs = new Set<string>();
  for (const relation of relations) {
    if (!state.has(relation.from) || !state.has(relation.to)) continue;
    const key = `${relation.type}:${pairKey(relation.from, relation.to)}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    if (relation.type === 'consort') consortPairs.push([relation.from, relation.to]);
    else if (relation.type === 'lover') loverPairs.push([relation.from, relation.to]);
    else if (hostileTypes.has(relation.type)) hostilePairs.push([relation.from, relation.to]);
  }
  const consortKeys = new Set(consortPairs.map(([a, b]) => pairKey(a, b)));
  const siblingPairs: [string, string][] = [];
  for (const children of kinship.childrenOf.values()) {
    const present = children.filter((id) => state.has(id));
    for (let i = 1; i < present.length; i++) siblingPairs.push([present[i - 1], present[i]]);
  }
  const scaffoldPairs = [...kinship.primaryParent]
    .filter(([childId, parentId]) => state.has(childId) && state.has(parentId))
    .sort(([a], [b]) => a.localeCompare(b));

  const clampState = (id: string, next: StarState): StarState => {
    const constraint = bounds.get(id)!;
    const inwardSlack = Math.min(constraint.radialTolerance, RADIUS_TOLERANCE);
    const radius = Math.min(
      Math.max(next.radius, constraint.ringRadius - inwardSlack),
      constraint.ringRadius + constraint.radialTolerance,
    );
    const delta = normalizeSignedAngle(next.theta - constraint.starAngular);
    const theta =
      constraint.starAngular +
      Math.max(-constraint.radialHalf, Math.min(constraint.radialHalf, delta));
    const y = Math.min(
      Math.max(next.y, constraint.band.center - constraint.band.half),
      constraint.band.center + constraint.band.half,
    );
    return { theta, radius, y };
  };
  const clampToBounds = (id: string, next: Vec3): StarState =>
    clampState(id, {
      theta: Math.atan2(next[2], next[0]),
      radius: Math.hypot(next[0], next[2]),
      y: next[1],
    });

  /* ---- constrained relaxation ---- */

  for (let iteration = 0; iteration < RELAX_ITERATIONS; iteration++) {
    const cartesian = new Map(ids.map((id) => [id, toCartesian(state.get(id)!)]));
    const force = new Map(ids.map((id) => [id, [0, 0, 0] as Vec3]));
    const apply = (a: string, b: string, target: number, k: number, repelOnly: boolean) => {
      const pa = cartesian.get(a);
      const pb = cartesian.get(b);
      if (!pa || !pb) return;
      const dx = pb[0] - pa[0];
      const dy = pb[1] - pa[1];
      const dz = pb[2] - pa[2];
      const d = Math.hypot(dx, dy, dz) || 0.001;
      if (repelOnly && d >= target) return;
      const magnitude = (k * (d - target)) / d;
      const fa = force.get(a)!;
      const fb = force.get(b)!;
      fa[0] += dx * magnitude;
      fa[1] += dy * magnitude;
      fa[2] += dz * magnitude;
      fb[0] -= dx * magnitude;
      fb[1] -= dy * magnitude;
      fb[2] -= dz * magnitude;
    };

    const grid = createPlanarGrid(MIN_STAR_DISTANCE * REPULSION_MARGIN);
    ids.forEach((id, index) => {
      const p = cartesian.get(id)!;
      grid.place(index, p[0], p[2]);
    });
    for (let i = 0; i < ids.length; i++) {
      const p = cartesian.get(ids[i])!;
      for (const j of grid.near(p[0], p[2], i)) {
        const minSeparation = consortKeys.has(pairKey(ids[i], ids[j]))
          ? MIN_CONSORT_DISTANCE
          : MIN_STAR_DISTANCE;
        apply(ids[i], ids[j], minSeparation * REPULSION_MARGIN, 0.55, true);
      }
    }
    for (const [a, b] of consortPairs) apply(a, b, CONSORT_TARGET, 0.2, false);
    for (const [a, b] of loverPairs) apply(a, b, 7, 0.04, false);
    for (const [a, b] of siblingPairs) apply(a, b, 6, 0.05, false);
    // Gentle, and always inside the ring and wedge clamps: it closes what slack
    // those bounds leave between a child and its placement parent, no more.
    for (const [a, b] of scaffoldPairs) apply(a, b, PARENT_CHILD_TARGET, 0.08, false);
    for (const [a, b] of hostilePairs) apply(a, b, 13, 0.05, true);
    for (const cohort of cohorts) {
      const present = cohort.members.filter((id) => state.has(id));
      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          apply(present[i], present[j], MIN_STAR_DISTANCE * 1.55, 0.75, true);
        }
      }
    }

    const damping = 1 - iteration / RELAX_ITERATIONS;
    for (const id of ids) {
      const f = force.get(id)!;
      const magnitude = Math.hypot(f[0], f[1], f[2]);
      if (magnitude < 0.001) continue;
      const step = Math.min(magnitude, MAX_STEP) * damping;
      const p = cartesian.get(id)!;
      const next: Vec3 = [
        p[0] + (f[0] / magnitude) * step,
        p[1] + (f[1] / magnitude) * step,
        p[2] + (f[2] / magnitude) * step,
      ];
      state.set(id, clampToBounds(id, next));
    }
  }

  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const parentEdges = relations
    .filter((relation) => isChronologicalParentRelation(relation, charactersById))
    .filter((relation) => state.has(relation.from) && state.has(relation.to))
    .sort(
      (a, b) =>
        (generations.get(a.to) ?? 0) - (generations.get(b.to) ?? 0) ||
        a.id.localeCompare(b.id),
    );
  const radialSlack = (id: string) => {
    const constraint = bounds.get(id)!;
    return {
      min: constraint.ringRadius - Math.min(constraint.radialTolerance, RADIUS_TOLERANCE),
      max: constraint.ringRadius + constraint.radialTolerance,
    };
  };
  // Chronology bounds a star's radius by its kin: outside every parent, inside
  // every child. The resolution pass holds to them, so making room never costs
  // the generation order.
  const parentsOfStar = new Map<string, string[]>();
  const childrenOfStar = new Map<string, string[]>();
  for (const relation of parentEdges) {
    parentsOfStar.set(relation.from, [...(parentsOfStar.get(relation.from) ?? []), relation.to]);
    childrenOfStar.set(relation.to, [...(childrenOfStar.get(relation.to) ?? []), relation.from]);
  }
  const KIN_GAP = MIN_PARENT_CHILD_RADIAL_GAP + 0.01;
  const holdChronology = (id: string, next: StarState): StarState => {
    let lower = -Infinity;
    let upper = Infinity;
    for (const parent of parentsOfStar.get(id) ?? []) {
      lower = Math.max(lower, state.get(parent)!.radius + KIN_GAP);
    }
    for (const child of childrenOfStar.get(id) ?? []) {
      upper = Math.min(upper, state.get(child)!.radius - KIN_GAP);
    }
    // Kin already out of order: leave the radius alone and let the nudge below sort it.
    if (lower > upper) return { ...next, radius: state.get(id)!.radius };
    return { ...next, radius: Math.min(Math.max(next.radius, lower), upper) };
  };

  /* ---- resolution pass: enforce the hard floor deterministically, inside every
   * star's ring, wedge and realm band — chronology and height survive even a
   * packed neighbourhood. */

  const gapBetween = (sa: StarState, sb: StarState) => {
    const pa = toCartesian(sa);
    const pb = toCartesian(sb);
    return Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]);
  };

  const resolveSeparation = (): void => {
    for (let sweep = 0; sweep < RESOLUTION_SWEEPS; sweep++) {
      let violations = 0;
      const located = ids.map((id) => toCartesian(state.get(id)!));
      const grid = createPlanarGrid(MIN_STAR_DISTANCE);
      located.forEach((p, index) => grid.place(index, p[0], p[2]));
      for (let i = 0; i < ids.length; i++) {
        // A shove moves `a`, so its later partners are re-read from where it now is.
        let partners = grid.near(located[i][0], located[i][2], i);
        for (let next = 0; next < partners.length; next++) {
          const j = partners[next];
          const a = ids[i];
          const b = ids[j];
          const floor = consortKeys.has(pairKey(a, b)) ? MIN_CONSORT_DISTANCE : MIN_STAR_DISTANCE;
          const pa = located[i];
          const pb = located[j];
          const dx = pb[0] - pa[0];
          const dy = pb[1] - pa[1];
          const dz = pb[2] - pa[2];
          let d = Math.hypot(dx, dy, dz);
          if (d >= floor) continue;
          violations++;
          let ux: number;
          let uy: number;
          let uz: number;
          if (d < 0.001) {
            const rng = mulberry32(hashString(`${a}|${b}|${sweep}`));
            const phi = rng() * Math.PI * 2;
            ux = Math.cos(phi) * 0.3;
            uy = rng() - 0.5;
            uz = Math.sin(phi) * 0.3;
            const m = Math.hypot(ux, uy, uz);
            ux /= m;
            uy /= m;
            uz /= m;
            d = 0.001;
          } else {
            ux = dx / d;
            uy = dy / d;
            uz = dz / d;
          }
          // Mostly-tangential pushes get eaten by the wedge clamp; bias the
          // split vertically so jammed neighbours separate in height instead.
          if (Math.abs(uy) < 0.35) {
            uy += 0.55;
            const m = Math.hypot(ux, uy, uz);
            ux /= m;
            uy /= m;
            uz /= m;
          }
          const shove = (floor - d) / 2 + 0.09;
          let sa = holdChronology(
            a,
            clampToBounds(a, [pa[0] - ux * shove, pa[1] - uy * shove, pa[2] - uz * shove]),
          );
          let sb = holdChronology(
            b,
            clampToBounds(b, [pb[0] + ux * shove, pb[1] + uy * shove, pb[2] + uz * shove]),
          );
          // Pinned along the push — a band edge above, a wedge edge beside — the pair
          // gains nothing and would deadlock. Try the other ways out: along the ring,
          // along the radius, and apart in height either way round (two realms that
          // meet at a band edge part only if the upper star rises and the lower
          // sinks). Whichever star has room in a direction takes it.
          if (gapBetween(sa, sb) < d + shove * 0.5) {
            const side = normalizeSignedAngle(sb.theta - sa.theta) < 0 ? -1 : 1;
            const inner = sa.radius <= sb.radius ? -1 : 1;
            const escapes: [StarState, StarState][] = [
              [
                { ...sa, theta: sa.theta - (side * shove) / sa.radius },
                { ...sb, theta: sb.theta + (side * shove) / sb.radius },
              ],
              [
                { ...sa, radius: sa.radius + inner * shove },
                { ...sb, radius: sb.radius - inner * shove },
              ],
              [
                { ...sa, y: sa.y + shove },
                { ...sb, y: sb.y - shove },
              ],
              [
                { ...sa, y: sa.y - shove },
                { ...sb, y: sb.y + shove },
              ],
            ];
            for (const [nextA, nextB] of escapes) {
              const movedA = holdChronology(a, clampState(a, nextA));
              const movedB = holdChronology(b, clampState(b, nextB));
              if (gapBetween(movedA, movedB) <= gapBetween(sa, sb)) continue;
              sa = movedA;
              sb = movedB;
            }
          }
          state.set(a, sa);
          state.set(b, sb);
          located[i] = toCartesian(state.get(a)!);
          located[j] = toCartesian(state.get(b)!);
          grid.place(i, located[i][0], located[i][2]);
          grid.place(j, located[j][0], located[j][2]);
          partners = grid.near(located[i][0], located[i][2], j);
          next = -1;
        }
      }
      if (violations === 0) break;
    }
  };

  /* ---- parent-child chronology on radius ----
   * Ring slack can leave a child star inside its parent's outer envelope. Nudge
   * the child outward first, then the parent inward, always staying inside each
   * star's ring slack. Returns whether anything moved. */

  const enforceChronology = (): boolean => {
    let moved = false;
    for (let pass = 0; pass < parentEdges.length; pass++) {
      let changed = false;
      for (const relation of parentEdges) {
        const childState = state.get(relation.from)!;
        const parentState = state.get(relation.to)!;
        const floor = parentState.radius + MIN_PARENT_CHILD_RADIAL_GAP + 0.01;
        if (childState.radius >= floor) continue;
        const childSlack = radialSlack(relation.from);
        const parentSlack = radialSlack(relation.to);
        if (floor <= childSlack.max) {
          childState.radius = floor;
          changed = true;
          continue;
        }
        const parentCeiling = childState.radius - MIN_PARENT_CHILD_RADIAL_GAP - 0.01;
        if (parentCeiling >= parentSlack.min) {
          parentState.radius = parentCeiling;
          changed = true;
          continue;
        }
        childState.radius = childSlack.max;
        parentState.radius = Math.max(
          parentSlack.min,
          childSlack.max - MIN_PARENT_CHILD_RADIAL_GAP - 0.01,
        );
        changed = true;
      }
      if (!changed) break;
      moved = true;
    }
    return moved;
  };

  // Order the generations first; the resolution pass then keeps that order while
  // it makes room. The loop is a safety net for kin the nudge could not order in
  // one go — it normally ends on its first check.
  enforceChronology();
  for (let round = 0; round < SETTLE_ROUNDS; round++) {
    resolveSeparation();
    if (!enforceChronology()) break;
  }

  /* ---- final invariant clamp ----
   * Cohort seeding can overshoot the realm band by a hair, and a star the solver
   * never had to move keeps its seed. Snap every star inside its band — exactly
   * the bound validate-layout enforces. A no-op for anything already in band. */
  for (const id of ids) {
    const s = state.get(id);
    if (!s) continue;
    const { band } = bounds.get(id)!;
    s.y = Math.min(Math.max(s.y, band.center - band.half), band.center + band.half);
  }

  const positions = new Map<string, Vec3>();
  for (const character of characters) {
    if (character.id === 'chaos') {
      positions.set('chaos', [0, 0, 0]);
      continue;
    }
    const s = state.get(character.id);
    if (s) positions.set(character.id, toCartesian(s));
  }
  return positions;
}
