import type { Character, Relation, RelationType } from '@/types/character';
import { hashString, mulberry32 } from '@/lib/prng';

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

/** Bumped when layout semantics change — invalidates baked galaxy-positions.json. */
export const LAYOUT_VERSION = '8-parent-radial-gap';

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
    const capacity = (2 * Math.PI * Math.max(innerRadius, BASE_RADIUS)) / MIN_STAR_DISTANCE;
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

/** Spiral twist applied uniformly per generation — lineages become arms while
 *  same-ring spacing is untouched (a pure rotation per ring). */
export const SPIRAL_TWIST = 0.38;

/** Stars may drift this far from their generation ring during relaxation. */
export const RADIUS_TOLERANCE = 1.5;
/** Minimum radial gap enforced between a parent and its child — kept in sync with
 *  validate-layout chronology check. Cohort patches widen radialTolerance, which
 *  can otherwise let adjacent-generation kin overlap after relaxation. */
export const MIN_PARENT_CHILD_RADIAL_GAP = 2.5;
/** Angular gap between top-level dynasty wedges. */
const WEDGE_GUTTER = 0.07;
/** Leaf-peer masses (suitors, sibling broods, co-resident catalogues) form cohort patches. */
const COHORT_MIN = 8;
/** Vertical stretch applied to a cohort member's realm band at seed time. */
const COHORT_BAND_SCALE = 0.42;
const RELAX_ITERATIONS = 190;
const MAX_STEP = 0.8;
const CONSORT_TARGET = 2.6;
const RESOLUTION_SWEEPS = 220;

/* ------------------------------ realms ------------------------------ */

export type Realm = 'ouranic' | 'upper' | 'terrestrial' | 'chthonic';

export const REALM_BANDS: Record<Realm, { center: number; half: number }> = {
  ouranic: { center: 24, half: 7 },
  upper: { center: 13, half: 4 },
  terrestrial: { center: 0, half: 9 },
  chthonic: { center: -20, half: 8 },
};

/** Extra vertical stretch the resolution pass may add when a band is packed.
 *  The mortal plane holds most figures, so it leans on height to spread a packed
 *  heroic age into a 3-D shoal instead of a flat jam — this is the un-pancaking
 *  lever, the disc's underused vertical dimension. */
export const REALM_OVERFLOW = 14;

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

  // ---- Marriage-aware leveling -------------------------------------------
  // Spouses are contemporaries, so a couple should share one generation ring;
  // otherwise the deeper-charted partner (a Spartan eponym-king descendant, say)
  // sits many rings out from the shallow-charted one, and the consort binary can
  // never form. The radius should read as mythic contemporaneity, not raw
  // lineage depth ("the mortal clock"). We union the consort graph into
  // contemporary cohorts — refusing any merge that would trap an ancestor and a
  // descendant in one cohort (mother-son unions keep their parent ordering and
  // never form a cycle) — then level each cohort to its MAX member generation
  // (raising only, so no parent floor is ever crossed) and re-run the parent
  // fixpoint so descendants stay outside. Both steps only raise generations over
  // a cohort-contracted DAG, so the iteration converges.
  //
  // We level a couple ONLY when the two spouses share a common ancestor — i.e.
  // a same-dynasty (cousin) marriage, where pulling them to one ring genuinely
  // co-locates them (they already sit in the same wedge). A cross-dynasty union
  // (Pelopid Agamemnon × Tyndarid Clytemnestra) is left alone: leveling there
  // cannot close the gap — the spouses live in different wedges, an ANGULAR tear
  // the radius cannot fix — and would only fling the shallow-charted spouse out
  // past its own parent (Atreus → Agamemnon), tearing a lineage to no benefit.
  const parentsOf = new Map<string, string[]>();
  for (const relation of parentRelations) {
    const list = parentsOf.get(relation.from) ?? [];
    list.push(relation.to);
    parentsOf.set(relation.from, list);
  }
  const isAncestor = (ancestor: string, descendant: string): boolean => {
    const stack = [...(parentsOf.get(descendant) ?? [])];
    const seen = new Set<string>();
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === ancestor) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      for (const grandparent of parentsOf.get(current) ?? []) stack.push(grandparent);
    }
    return false;
  };
  // How many generation rings a single consort cohort may span. A couple is
  // leveled only while the merged cohort stays within this many rings of itself,
  // which directly bounds the worst lineage tear the leveling can open: the
  // shallowest member is raised by at most the cohort spread, so it can never be
  // flung more than MAX_COHORT_SPREAD rings past its own parent. Cousin and
  // near-contemporary marriages (small gaps) bind freely; a deep cross-dynasty
  // union (Pelopid Agamemnon, gen 11, × Tyndarid Clytemnestra, gen 18) exceeds
  // the bound and is left alone — leveling could not close its angular gap
  // anyway (the spouses live in different wedges), it would only tear a lineage.
  const MAX_COHORT_SPREAD = 3;
  const cohortGenSpan = (members: string[]): [number, number] => {
    let min = Infinity;
    let max = -Infinity;
    for (const member of members) {
      const g = generations.get(member) ?? 0;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    return [min, max];
  };
  const ufParent = new Map<string, string>();
  const ufFind = (id: string): string => {
    let root = id;
    while ((ufParent.get(root) ?? root) !== root) root = ufParent.get(root)!;
    let cursor = id;
    while ((ufParent.get(cursor) ?? cursor) !== cursor) {
      const next = ufParent.get(cursor)!;
      ufParent.set(cursor, root);
      cursor = next;
    }
    return root;
  };
  const cohortMembers = new Map<string, string[]>();
  const membersOf = (root: string): string[] => cohortMembers.get(root) ?? [root];
  const consortEdges = relations
    .filter((relation) => relation.type === 'consort')
    .sort((a, b) =>
      a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from),
    );
  for (const relation of consortEdges) {
    if (!generations.has(relation.from) || !generations.has(relation.to)) continue;
    const rootA = ufFind(relation.from);
    const rootB = ufFind(relation.to);
    if (rootA === rootB) continue;
    const membersA = membersOf(rootA);
    const membersB = membersOf(rootB);
    // Bound the merged cohort's generation span: a deep cross-dynasty union would
    // fling its shallow spouse far past its own parent for no angular gain.
    const [min, max] = cohortGenSpan([...membersA, ...membersB]);
    if (max - min > MAX_COHORT_SPREAD) continue;
    // Refuse a merge that would put an ancestor and a descendant in one cohort.
    let wouldTrapLineage = false;
    for (const x of membersA) {
      for (const y of membersB) {
        if (isAncestor(x, y) || isAncestor(y, x)) {
          wouldTrapLineage = true;
          break;
        }
      }
      if (wouldTrapLineage) break;
    }
    if (wouldTrapLineage) continue;
    ufParent.set(rootA, rootB);
    cohortMembers.set(rootB, [...membersB, ...membersA]);
    cohortMembers.delete(rootA);
  }
  for (let round = 0; round < characters.length; round++) {
    const cohortMax = new Map<string, number>();
    for (const id of generations.keys()) {
      const root = ufFind(id);
      cohortMax.set(root, Math.max(cohortMax.get(root) ?? 0, generations.get(id) ?? 0));
    }
    let changed = false;
    for (const id of generations.keys()) {
      const leveled = cohortMax.get(ufFind(id));
      if (leveled !== undefined && leveled > (generations.get(id) ?? 0) + 0.001) {
        generations.set(id, leveled);
        changed = true;
      }
    }
    propagate(parentRelations, generations);
    if (!changed) break;
  }

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
 *  consuming root arc. This is the "angle = dynasty" half of the contract.
 *  Optional weightBonus inflates anchor subtrees so cohort patches receive arc. */
export function computeDynastyWedges(
  characters: Character[],
  relations: Relation[],
  weightBonus: Map<string, number> = new Map(),
): Map<string, Wedge> {
  const { primaryParent, childrenOf, consortsOf } = buildKinship(characters, relations);

  const weight = new Map<string, number>();
  const subtreeWeight = (id: string): number => {
    const cached = weight.get(id);
    if (cached !== undefined) return cached;
    weight.set(id, 1); // cycle guard; chronological parent edges cannot cycle
    let total = 1 + (weightBonus.get(id) ?? 0);
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

/* ------------------------------ cohorts ------------------------------ */

export interface Cohort {
  id: string;
  anchor: string;
  members: string[];
}

function isLeaf(id: string, childrenOf: Map<string, string[]>): boolean {
  return (childrenOf.get(id)?.length ?? 0) === 0;
}

function cohortPatchHalf(
  memberCount: number,
  anchorHalf: number,
  ringRadius: number,
): number {
  const spread = Math.sqrt(memberCount) * GOLDEN_ANGLE * 0.55;
  const spacingHalf =
    (memberCount * MIN_STAR_DISTANCE) / (2 * Math.max(ringRadius, BASE_RADIUS));
  return Math.max(anchorHalf, Math.min(Math.max(spread, spacingHalf), Math.PI * 0.85));
}

/** Cohort patches may span several radial lanes so 3D separation can converge. */
function cohortRadialTolerance(memberCount: number): number {
  const lanes = Math.ceil(Math.sqrt(memberCount / COHORT_MIN));
  return Math.min(RADIUS_TOLERANCE + lanes * 0.45, 5);
}

function cohortBandHalf(realmHalf: number, memberCount: number): number {
  const scale = 1 + Math.log2(Math.max(memberCount, COHORT_MIN)) * COHORT_BAND_SCALE;
  return Math.min(realmHalf * scale, realmHalf + REALM_OVERFLOW);
}

function residenceGroupKeys(character: Character): string[] {
  const island = character.id.match(/-(ithaca|dulichium|zacynthus|same)$/)?.[1];
  if (island) return [`island:${island}`];
  const cities = [...new Set((character.residences ?? []).map((residence) => residence.city))].sort();
  return cities.map((city) => `residence:${city}`);
}

function cohortAngularOffset(cohortId: string): number {
  return ((hashString(cohortId) % 2000) / 2000 - 0.5) * Math.PI * 0.55;
}

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
  const residents = characters
    .filter((character) => {
      if (island) return character.id.endsWith(`-${island}`);
      return character.residences?.some((residence) => residence.city === city);
    })
    .sort((a, b) => {
      const generationDifference =
        (kinship.generations.get(a.id) ?? FALLBACK_GENERATION) -
        (kinship.generations.get(b.id) ?? FALLBACK_GENERATION);
      return generationDifference || a.id.localeCompare(b.id);
    });
  const outside = residents.find((character) => !memberSet.has(character.id));
  if (outside) return outside.id;
  const linkedParent = members
    .map((id) => kinship.primaryParent.get(id))
    .find((parentId) => parentId !== undefined && !memberSet.has(parentId));
  if (linkedParent) return linkedParent;
  return members[0];
}

/** Detect leaf-peer masses: sibling broods and co-resident catalogues (8+ leaves). */
export function detectCohorts(
  characters: Character[],
  relations: Relation[],
  kinship: Kinship = buildKinship(characters, relations),
): Cohort[] {
  const { childrenOf } = kinship;
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
    for (const groupKey of residenceGroupKeys(character)) {
      const list = byGroup.get(groupKey) ?? [];
      if (!list.includes(character.id)) list.push(character.id);
      byGroup.set(groupKey, list);
    }
  }
  for (const [groupKey, members] of byGroup) {
    if (members.length < COHORT_MIN) continue;
    members.sort();
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

/** Dynasty wedges with cohort patch widening and per-generation spiral twist —
 *  the same angular bounds computePositions enforces. */
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
  const dynastyWedges = computeDynastyWedges(characters, relations, weightBonus);
  const wedges = new Map<string, Wedge>();
  for (const character of characters) {
    if (character.id === 'chaos') continue;
    const generation = kinship.generations.get(character.id) ?? FALLBACK_GENERATION;
    const cohort = cohortOf.get(character.id);
    if (cohort) {
      const anchorWedge = dynastyWedges.get(cohort.anchor) ?? { mid: 0, half: Math.PI };
      const ringRadius = ringRadiusOf(generation);
      wedges.set(character.id, {
        mid: anchorWedge.mid + SPIRAL_TWIST * generation + cohortAngularOffset(cohort.id),
        half: cohortPatchHalf(cohort.members.length, anchorWedge.half, ringRadius),
      });
    } else {
      const wedge = dynastyWedges.get(character.id) ?? { mid: 0, half: Math.PI };
      wedges.set(character.id, {
        mid: wedge.mid + SPIRAL_TWIST * generation,
        half: Math.max(wedge.half, 0.015),
      });
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
  starAngular: number;
  radialHalf: number;
  radialTolerance: number;
  band: { center: number; half: number };
  realmBand: { center: number; half: number };
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
    const realmBand = REALM_BANDS[realmOf(character)];
    const cohort = cohortOf.get(character.id);
    const bandHalf = cohort
      ? cohortBandHalf(realmBand.half, cohort.members.length)
      : realmBand.half;
    const band = { center: realmBand.center, half: bandHalf };
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
      realmBand,
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

  const clampToBounds = (id: string, next: Vec3, yOverflow: number): StarState => {
    const constraint = bounds.get(id)!;
    const inwardSlack = Math.min(constraint.radialTolerance, RADIUS_TOLERANCE);
    const radius = Math.min(
      Math.max(Math.hypot(next[0], next[2]), constraint.ringRadius - inwardSlack),
      constraint.ringRadius + constraint.radialTolerance,
    );
    const delta = normalizeSignedAngle(Math.atan2(next[2], next[0]) - constraint.starAngular);
    const theta =
      constraint.starAngular +
      Math.max(-constraint.radialHalf, Math.min(constraint.radialHalf, delta));
    const effectiveOverflow =
      constraint.band.half > constraint.realmBand.half ? 0 : yOverflow;
    const yHalf = constraint.band.half + effectiveOverflow;
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
        const shove = (floor - d) / 2 + 0.09;
        state.set(a, clampToBounds(a, [pa[0] - ux * shove, pa[1] - uy * shove, pa[2] - uz * shove], yOverflow));
        state.set(b, clampToBounds(b, [pb[0] + ux * shove, pb[1] + uy * shove, pb[2] + uz * shove], yOverflow));
      }
    }
    if (violations === 0) break;
  }

  /* ---- parent-child chronology on radius ----
   * Residence cohorts widen radialTolerance so packed city skies can breathe in
   * 3-D; that slack can leave a child star inside its parent's outer envelope
   * (sibling attraction makes the Argos case worse). Nudge child outward first,
   * then parent inward, always staying inside each star's ring slack. */

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
  }

  /* ---- final invariant clamp ----
   * The vertically-biased shove (and cohort seeding) can overshoot the cohort
   * band by a hair on a star's last touch. Snap every star back inside the
   * realm's hard height bound (base half + REALM_OVERFLOW) — exactly the bound
   * validate-layout enforces — so the realm invariant always holds. A no-op for
   * anything already in band; only nudges the rare boundary straggler. */
  for (const id of ids) {
    const s = state.get(id);
    if (!s) continue;
    const { realmBand } = bounds.get(id)!;
    const limit = realmBand.half + REALM_OVERFLOW;
    s.y = Math.min(Math.max(s.y, realmBand.center - limit), realmBand.center + limit);
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
