import type { Character, Relation } from '@/types/character';

export type Vec3 = [number, number, number];

/* ============================== Cosmos layout ==============================
 * Three meaning-bearing axes:
 *   radius = mythic generation (parents always inside their descendants)
 *   angle  = dynasty — a sunburst wedge sized by subtree, plus a uniform
 *            per-generation twist that turns each lineage into a spiral arm
 *   height = cosmological realm: ouranic above the disc plane, the lesser
 *            divine band over it, the mortal plane at zero, chthonic below
 * A deterministic constrained relaxation polishes spacing (consort pairs
 * settle into close binaries, adversaries drift apart), then a resolution
 * pass enforces the hard separation floor. Stars are always projected back
 * inside their generation ring and dynasty wedge; the realm band may stretch
 * vertically as a last resort, never the radius.
 * ========================================================================= */

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

/** Hard spacing floor between unrelated stars; consort binaries may sit closer. */
export const MIN_STAR_DISTANCE = 3.6;
export const MIN_CONSORT_DISTANCE = 2.1;

/** Spiral twist applied uniformly per generation — lineages become arms while
 *  same-ring spacing is untouched (a pure rotation per ring). */
export const SPIRAL_TWIST = 0.38;

/** Stars may drift this far from their generation ring during relaxation. */
export const RADIUS_TOLERANCE = 1.5;
/** Angular gap between top-level dynasty wedges. */
const WEDGE_GUTTER = 0.07;
const RELAX_ITERATIONS = 140;
const MAX_STEP = 0.8;
const CONSORT_TARGET = 2.6;
const RESOLUTION_SWEEPS = 120;

/* ------------------------------ realms ------------------------------ */

export type Realm = 'ouranic' | 'upper' | 'terrestrial' | 'chthonic';

export const REALM_BANDS: Record<Realm, { center: number; half: number }> = {
  ouranic: { center: 16, half: 6 },
  upper: { center: 7.5, half: 3.5 },
  terrestrial: { center: 0, half: 5 },
  chthonic: { center: -15, half: 6 },
};

/** Extra vertical stretch the resolution pass may add when a band is packed. */
export const REALM_OVERFLOW = 8;

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

/** FNV-1a — stable across sessions so the sky never rearranges between visits. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
const TEMPORAL_TYPES = new Set<Character['type']>(['hero', 'mortal', 'creature']);

/** Stable generation numbers — the "mortal clock" model:
 *  - Divine figures keep Hesiod's cosmic ages (longest path over divine→divine
 *    parent steps from their cluster baselines).
 *  - Mortal-time figures start together at one mortal base ring, just outside
 *    the youngest gods, and only mortal→mortal steps advance the clock.
 *  - A figure with no mortal parent (Helen, daughter of timeless Zeus) joins
 *    the ring of their earliest mortal consort.
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
  const propagate = (edges: Relation[], generations: Map<string, number>) => {
    for (let pass = 0; pass < characters.length; pass++) {
      let changed = false;
      for (const relation of edges) {
        const parentGeneration = generations.get(relation.to);
        const childGeneration = generations.get(relation.from);
        if (parentGeneration === undefined || childGeneration === undefined) continue;
        if (parentGeneration + 1 > childGeneration + 0.001) {
          generations.set(relation.from, parentGeneration + 1);
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

  // Phase B — the mortal clock, starting just outside the youngest god.
  const divineGenerations = [...generations.values()];
  const mortalBase = (divineGenerations.length > 0 ? Math.max(...divineGenerations) : -1) + 1;
  for (const character of characters) {
    if (TEMPORAL_TYPES.has(character.type)) generations.set(character.id, mortalBase);
  }
  const mortalEdges = parentRelations.filter((r) => isTemporal(r.from) && isTemporal(r.to));
  propagate(mortalEdges, generations);

  // Era through marriage: a figure with no era-bearing parent of their own
  // kind takes the ring of their earliest partner.
  const anchored = new Set(
    parentRelations
      .filter((r) => isTemporal(r.from) === isTemporal(r.to))
      .map((relation) => relation.from),
  );
  for (const character of characters) {
    if (anchored.has(character.id)) continue;
    const partnerGenerations = relations
      .filter(
        (relation) =>
          relation.type === 'consort' &&
          (relation.from === character.id || relation.to === character.id),
      )
      .map((relation) => (relation.from === character.id ? relation.to : relation.from))
      .filter(
        (partnerId) =>
          !parentRelations.some(
            (parentRelation) =>
              parentRelation.from === partnerId && parentRelation.to === character.id,
          ),
      )
      .map((partnerId) => generations.get(partnerId))
      .filter((generation): generation is number => generation !== undefined);
    if (partnerGenerations.length > 0) {
      generations.set(
        character.id,
        Math.max(generations.get(character.id) ?? 0, Math.min(...partnerGenerations)),
      );
    }
  }

  // Final fixpoint over every chronological edge (covers consort bumps and the
  // rare god born of a mortal), so no child ever ends up inside a parent.
  propagate(parentRelations, generations);

  return generations;
}

/* ------------------------------ kinship ------------------------------ */

interface Kinship {
  generations: Map<string, number>;
  primaryParent: Map<string, string>;
  childrenOf: Map<string, string[]>;
  consortsOf: Map<string, string[]>;
}

function buildKinship(characters: Character[], relations: Relation[]): Kinship {
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
  const primaryParent = new Map<string, string>();
  for (const [childId, parentIds] of parentsByChild) {
    parentIds.sort((a, b) => {
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

  return { generations, primaryParent, childrenOf, consortsOf };
}

/* ------------------------------ wedges ------------------------------ */

export interface Wedge {
  mid: number;
  half: number;
}

/** Sunburst over the family forest: every dynasty root receives an angular
 *  wedge proportional to its subtree size; children recursively subdivide
 *  their parent's wedge. Lone spouses adopt their partner's wedge instead of
 *  consuming root arc. This is the "angle = dynasty" half of the contract. */
export function computeDynastyWedges(
  characters: Character[],
  relations: Relation[],
): Map<string, Wedge> {
  const { primaryParent, childrenOf, consortsOf } = buildKinship(characters, relations);

  const weight = new Map<string, number>();
  const subtreeWeight = (id: string): number => {
    const cached = weight.get(id);
    if (cached !== undefined) return cached;
    weight.set(id, 1); // cycle guard; chronological parent edges cannot cycle
    let total = 1;
    for (const childId of childrenOf.get(id) ?? []) total += subtreeWeight(childId);
    weight.set(id, total);
    return total;
  };

  const allRoots = characters.filter((character) => !primaryParent.has(character.id));
  const adopted = new Set<string>();
  for (const root of allRoots) {
    const isSingleton = (childrenOf.get(root.id)?.length ?? 0) === 0;
    if (isSingleton && (consortsOf.get(root.id)?.length ?? 0) > 0) adopted.add(root.id);
  }
  const wedgeRoots = allRoots.filter((root) => !adopted.has(root.id));
  wedgeRoots.sort((a, b) => subtreeWeight(b.id) - subtreeWeight(a.id) || a.id.localeCompare(b.id));

  const wedges = new Map<string, Wedge>();
  const totalWeight = wedgeRoots.reduce((sum, root) => sum + subtreeWeight(root.id), 0) || 1;
  const totalGutter = Math.min(wedgeRoots.length * WEDGE_GUTTER, Math.PI / 2);
  const usableArc = Math.PI * 2 - totalGutter;
  const gutter = totalGutter / Math.max(wedgeRoots.length, 1);

  const assignWedge = (id: string, start: number, width: number): void => {
    wedges.set(id, { mid: start + width / 2, half: width / 2 });
    const children = childrenOf.get(id) ?? [];
    if (children.length === 0) return;
    const childTotal = children.reduce((sum, childId) => sum + subtreeWeight(childId), 0);
    let childCursor = start;
    for (const childId of children) {
      const childWidth = (width * subtreeWeight(childId)) / childTotal;
      assignWedge(childId, childCursor, childWidth);
      childCursor += childWidth;
    }
  };

  let cursor = ((hashString('icarus-cosmos') % 360) * Math.PI) / 180;
  for (const root of wedgeRoots) {
    const width = (usableArc * subtreeWeight(root.id)) / totalWeight;
    assignWedge(root.id, cursor, width);
    cursor += width + gutter;
  }
  for (const id of adopted) {
    const partnerId = (consortsOf.get(id) ?? []).find((candidate) => wedges.has(candidate));
    const partnerWedge = partnerId ? wedges.get(partnerId) : undefined;
    if (partnerWedge) {
      wedges.set(id, partnerWedge);
    } else {
      wedges.set(id, { mid: cursor + 0.2, half: 0.2 });
      cursor += 0.45;
    }
  }
  return wedges;
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
  mid: number;
  half: number;
  band: { center: number; half: number };
  ringRadius: number;
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
  const wedges = computeDynastyWedges(characters, relations);

  /* ---- seed: generation ring, twisted wedge mid, realm band ---- */

  const order = [...characters].sort((a, b) => a.id.localeCompare(b.id));
  const state = new Map<string, StarState>();
  const bounds = new Map<string, StarBounds>();

  for (const character of order) {
    if (character.id === 'chaos') continue;
    const generation = generations.get(character.id) ?? FALLBACK_GENERATION;
    const wedge = wedges.get(character.id) ?? { mid: 0, half: Math.PI };
    const band = REALM_BANDS[realmOf(character)];
    const rng = mulberry32(hashString(character.id));
    const mid = wedge.mid + SPIRAL_TWIST * generation;
    const half = Math.max(wedge.half, 0.015);
    const theta = mid + (rng() - 0.5) * Math.min(half, 0.4);
    const ringRadius = ringRadiusOf(generation);
    const y =
      band.center +
      Math.sin(theta * 1.7 + rng() * Math.PI * 2) * band.half * 0.3 +
      (rng() - 0.5) * band.half;
    state.set(character.id, { theta, radius: ringRadius, y });
    bounds.set(character.id, { mid, half, band, ringRadius });
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

  const clampToBounds = (id: string, next: Vec3, yOverflow: number): StarState => {
    const constraint = bounds.get(id)!;
    const radius = Math.min(
      Math.max(Math.hypot(next[0], next[2]), constraint.ringRadius - RADIUS_TOLERANCE),
      constraint.ringRadius + RADIUS_TOLERANCE,
    );
    const delta = normalizeSignedAngle(Math.atan2(next[2], next[0]) - constraint.mid);
    const theta = constraint.mid + Math.max(-constraint.half, Math.min(constraint.half, delta));
    const yHalf = constraint.band.half + yOverflow;
    const y = Math.min(
      Math.max(next[1], constraint.band.center - yHalf),
      constraint.band.center + yHalf,
    );
    return { theta, radius, y };
  };

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

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const minSeparation = consortKeys.has(pairKey(ids[i], ids[j]))
          ? MIN_CONSORT_DISTANCE
          : MIN_STAR_DISTANCE;
        apply(ids[i], ids[j], minSeparation * 1.45, 0.55, true);
      }
    }
    for (const [a, b] of consortPairs) apply(a, b, CONSORT_TARGET, 0.2, false);
    for (const [a, b] of loverPairs) apply(a, b, 7, 0.04, false);
    for (const [a, b] of siblingPairs) apply(a, b, 6, 0.05, false);
    for (const [a, b] of hostilePairs) apply(a, b, 13, 0.05, true);

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
      state.set(id, clampToBounds(id, next, 0));
    }
  }

  /* ---- resolution pass: enforce the hard floor deterministically.
   * Late sweeps may stretch the realm band (REALM_OVERFLOW max) — never the
   * generation radius, so chronology survives even a packed neighbourhood. */

  for (let sweep = 0; sweep < RESOLUTION_SWEEPS; sweep++) {
    const yOverflow = Math.min(Math.max(0, (sweep - 20) * 0.4), REALM_OVERFLOW);
    let violations = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const floor = consortKeys.has(pairKey(a, b)) ? MIN_CONSORT_DISTANCE : MIN_STAR_DISTANCE;
        const pa = toCartesian(state.get(a)!);
        const pb = toCartesian(state.get(b)!);
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
        const shove = (floor - d) / 2 + 0.05;
        state.set(a, clampToBounds(a, [pa[0] - ux * shove, pa[1] - uy * shove, pa[2] - uz * shove], yOverflow));
        state.set(b, clampToBounds(b, [pb[0] + ux * shove, pb[1] + uy * shove, pb[2] + uz * shove], yOverflow));
      }
    }
    if (violations === 0) break;
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
