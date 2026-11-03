/** Family-readability measurements of a solved layout. Shared by
 *  `pnpm layout:metrics` (the report) and `pnpm validate-layout` (the gates), so
 *  the two can never disagree about what a number means. Distances are planar
 *  (x/z) world units — height is cosmological realm, not kinship.
 *  See docs/FAMILY_LAYOUT_PROPOSAL.md §7. */

import {
  buildKinship,
  detectCohorts,
  isChronologicalParentRelation,
  realmOf,
  ringRadiusOf,
  type Realm,
  MIN_CONSORT_DISTANCE,
  MIN_STAR_DISTANCE,
  REALM_BANDS,
  TEMPORAL_TYPES,
  type Vec3,
} from '../../src/features/galaxy/layout';
import type { Character, Relation } from '../../src/types/character';

export interface Distribution {
  n: number;
  median: number;
  p75: number;
  p90: number;
  max: number;
}

export interface LayoutMetrics {
  /** Child → its placement parent: the edges the layout is built around. */
  scaffoldEdges: Distribution;
  /** Chronological parent edges that are not the placement edge — a second
   *  parent in another house, a shared divine parent. Long by necessity. */
  bridgeEdges: Distribution;
  /** Every parent edge in the data, scaffold or not. */
  parentEdges: Distribution;
  /** Neighbours in a placement parent's child list. */
  adjacentSiblings: Distribution;
  consortPairs: Distribution;
  /** A figure with neither parent nor child → the leader it is an `ally` of. */
  orphanToHub: Distribution;
  fixtures: { parent: string; child: string; distance: number; limit: number }[];
  /** Mortal → mortal parent edges spanning four or more generation rings. */
  longMortalSteps: number;
  terrestrial: { stars: number; outsideBaseBand: number; atOtherRealmHeight: number };
  /** Per realm: stars outside their own band, and those that have drifted all the
   *  way into another realm's band — a mortal at Olympian height, a god on the plane. */
  heights: Record<Realm, { stars: number; outsideOwnBand: number; insideOtherBand: number }>;
  /** Mortal-time spouses: how many generation rings apart they are charted. */
  spouseRingGap: Distribution & { withinOneRing: number };
  /** Mortal → mortal parent steps, in generation rings (1 is the ideal). */
  mortalStepRings: Distribution;
  /** Angular spread of each cohort around its own mean bearing (degrees, P90 of
   *  its members), summarised over cohorts: a patch should read as one place. */
  cohortSpreadDegrees: Distribution;
  rings: {
    mortalBase: number;
    /** Timeless figures on the ring just inside the mortal base. A handful means
     *  one deep divine chain is holding the whole mortal world outward. */
    divineInsideBase: number;
    mostCrowded: { ring: number; population: number; capacity: number };
  };
  cohorts: { count: number; members: number; doubleMembership: number };
  separationViolations: number;
  galaxyRadius: number;
}

/** Named parent → child pairs every reader looks for first, with the planar
 *  distance `validate-layout` allows them. Telemachus shares Odysseus' wedge with
 *  the suitors' patch, so he gets more room than the rest. */
export const FIXTURES: { parent: string; child: string; limit: number }[] = [
  { parent: 'atreus', child: 'agamemnon', limit: 12 },
  { parent: 'priam', child: 'hector', limit: 12 },
  { parent: 'peleus', child: 'achilles', limit: 12 },
  { parent: 'tyndareus', child: 'clytemnestra', limit: 12 },
  { parent: 'odysseus', child: 'telemachus', limit: 24 },
  { parent: 'agamemnon', child: 'orestes', limit: 16 },
];

/** Where the chthonic band begins: a terrestrial star beyond this height (either
 *  way) has left the mortal plane for another realm's storey. */
const OTHER_REALM_HEIGHT = Math.abs(REALM_BANDS.chthonic.center + REALM_BANDS.chthonic.half);

function distributionOf(values: number[]): Distribution {
  if (values.length === 0) return { n: 0, median: 0, p75: 0, p90: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
  return { n: sorted.length, median: at(0.5), p75: at(0.75), p90: at(0.9), max: sorted[sorted.length - 1] };
}

export function measureLayout(
  characters: Character[],
  relations: Relation[],
  positions: Map<string, Vec3>,
): LayoutMetrics {
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const kinship = buildKinship(characters, relations);
  const planar = (a: string, b: string): number | undefined => {
    const pa = positions.get(a);
    const pb = positions.get(b);
    return pa && pb ? Math.hypot(pa[0] - pb[0], pa[2] - pb[2]) : undefined;
  };
  const measured = (pairs: Iterable<readonly [string, string]>): number[] => {
    const distances: number[] = [];
    for (const [a, b] of pairs) {
      const distance = planar(a, b);
      if (distance !== undefined) distances.push(distance);
    }
    return distances;
  };

  const parentRelations = relations.filter((relation) => relation.type === 'parent');
  const bridgePairs = parentRelations
    .filter((relation) => isChronologicalParentRelation(relation, charactersById))
    .filter((relation) => kinship.primaryParent.get(relation.from) !== relation.to)
    .map((relation) => [relation.from, relation.to] as const);

  const siblingPairs: [string, string][] = [];
  for (const children of kinship.childrenOf.values()) {
    for (let index = 1; index < children.length; index++) {
      siblingPairs.push([children[index - 1], children[index]]);
    }
  }

  const isOrphanLeaf = (id: string) =>
    !kinship.primaryParent.has(id) && (kinship.childrenOf.get(id)?.length ?? 0) === 0;
  const hubPairs = relations
    .filter((relation) => relation.type === 'ally' && isOrphanLeaf(relation.from))
    .map((relation) => [relation.from, relation.to] as const);

  const isTemporal = (id: string) => TEMPORAL_TYPES.has(charactersById.get(id)?.type ?? 'god');
  const generationOf = (id: string) => Math.round(kinship.generations.get(id) ?? 0);
  const longMortalSteps = parentRelations.filter(
    (relation) =>
      isChronologicalParentRelation(relation, charactersById) &&
      isTemporal(relation.from) &&
      isTemporal(relation.to) &&
      generationOf(relation.from) - generationOf(relation.to) >= 4,
  ).length;

  let terrestrialStars = 0;
  let outsideBaseBand = 0;
  let atOtherRealmHeight = 0;
  for (const character of characters) {
    const position = positions.get(character.id);
    if (!position || character.id === 'chaos' || realmOf(character) !== 'terrestrial') continue;
    terrestrialStars++;
    const height = Math.abs(position[1]);
    if (height > REALM_BANDS.terrestrial.half) outsideBaseBand++;
    if (height > OTHER_REALM_HEIGHT) atOtherRealmHeight++;
  }

  const heights = Object.fromEntries(
    (Object.keys(REALM_BANDS) as Realm[]).map((realm) => [
      realm,
      { stars: 0, outsideOwnBand: 0, insideOtherBand: 0 },
    ]),
  ) as LayoutMetrics['heights'];
  for (const character of characters) {
    const position = positions.get(character.id);
    if (!position || character.id === 'chaos') continue;
    const realm = realmOf(character);
    const inBand = (name: Realm) =>
      Math.abs(position[1] - REALM_BANDS[name].center) <= REALM_BANDS[name].half;
    heights[realm].stars++;
    if (inBand(realm)) continue;
    heights[realm].outsideOwnBand++;
    if ((Object.keys(REALM_BANDS) as Realm[]).some((other) => other !== realm && inBand(other))) {
      heights[realm].insideOtherBand++;
    }
  }

  const spouseGaps = relations
    .filter((r) => r.type === 'consort' && isTemporal(r.from) && isTemporal(r.to))
    .filter((r) => positions.has(r.from) && positions.has(r.to))
    .map((r) => Math.abs((kinship.generations.get(r.from) ?? 0) - (kinship.generations.get(r.to) ?? 0)));
  const mortalSteps = parentRelations
    .filter(
      (r) =>
        isChronologicalParentRelation(r, charactersById) && isTemporal(r.from) && isTemporal(r.to),
    )
    .map((r) => (kinship.generations.get(r.from) ?? 0) - (kinship.generations.get(r.to) ?? 0));

  const ringPopulation = new Map<number, number>();
  let mortalBase = Infinity;
  for (const character of characters) {
    if (!positions.has(character.id)) continue;
    const ring = generationOf(character.id);
    ringPopulation.set(ring, (ringPopulation.get(ring) ?? 0) + 1);
    if (TEMPORAL_TYPES.has(character.type)) mortalBase = Math.min(mortalBase, ring);
  }
  if (!Number.isFinite(mortalBase)) mortalBase = 0;
  const divineInsideBase = characters.filter(
    (character) =>
      positions.has(character.id) &&
      !TEMPORAL_TYPES.has(character.type) &&
      generationOf(character.id) === mortalBase - 1,
  ).length;
  let mostCrowded = { ring: 0, population: 0, capacity: 1 };
  for (const [ring, population] of ringPopulation) {
    const capacity = Math.floor((2 * Math.PI * ringRadiusOf(ring)) / MIN_STAR_DISTANCE);
    if (population / capacity > mostCrowded.population / mostCrowded.capacity) {
      mostCrowded = { ring, population, capacity };
    }
  }

  const cohorts = detectCohorts(characters, relations, kinship);
  const membership = new Map<string, number>();
  for (const cohort of cohorts) {
    for (const member of cohort.members) membership.set(member, (membership.get(member) ?? 0) + 1);
  }

  const cohortSpreads: number[] = [];
  for (const cohort of cohorts) {
    const bearings = cohort.members
      .map((member) => positions.get(member))
      .filter((position): position is Vec3 => position !== undefined)
      .map((position) => Math.atan2(position[2], position[0]));
    if (bearings.length < 2) continue;
    const mean = Math.atan2(
      bearings.reduce((sum, angle) => sum + Math.sin(angle), 0),
      bearings.reduce((sum, angle) => sum + Math.cos(angle), 0),
    );
    const deviations = bearings
      .map((angle) => Math.abs(Math.atan2(Math.sin(angle - mean), Math.cos(angle - mean))))
      .sort((a, b) => a - b);
    cohortSpreads.push((deviations[Math.floor(0.9 * (deviations.length - 1))] * 180) / Math.PI);
  }

  const consortKeys = new Set(
    relations
      .filter((relation) => relation.type === 'consort')
      .map((relation) => [relation.from, relation.to].sort().join('|')),
  );
  const entries = [...positions.entries()];
  let separationViolations = 0;
  let galaxyRadius = 0;
  for (let left = 0; left < entries.length; left++) {
    const [leftId, a] = entries[left];
    galaxyRadius = Math.max(galaxyRadius, Math.hypot(a[0], a[2]));
    for (let right = left + 1; right < entries.length; right++) {
      const [rightId, b] = entries[right];
      const floor = consortKeys.has([leftId, rightId].sort().join('|'))
        ? MIN_CONSORT_DISTANCE
        : MIN_STAR_DISTANCE;
      if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < floor - 0.001) separationViolations++;
    }
  }

  return {
    scaffoldEdges: distributionOf(measured(kinship.primaryParent)),
    bridgeEdges: distributionOf(measured(bridgePairs)),
    parentEdges: distributionOf(measured(parentRelations.map((r) => [r.from, r.to] as const))),
    adjacentSiblings: distributionOf(measured(siblingPairs)),
    consortPairs: distributionOf(
      measured(relations.filter((r) => r.type === 'consort').map((r) => [r.from, r.to] as const)),
    ),
    orphanToHub: distributionOf(measured(hubPairs)),
    fixtures: FIXTURES.flatMap(({ parent, child, limit }) => {
      const distance = planar(parent, child);
      return distance === undefined ? [] : [{ parent, child, distance, limit }];
    }),
    longMortalSteps,
    terrestrial: { stars: terrestrialStars, outsideBaseBand, atOtherRealmHeight },
    heights,
    spouseRingGap: {
      ...distributionOf(spouseGaps),
      withinOneRing: spouseGaps.filter((gap) => gap <= 1.001).length,
    },
    mortalStepRings: distributionOf(mortalSteps),
    cohortSpreadDegrees: distributionOf(cohortSpreads),
    rings: { mortalBase, divineInsideBase, mostCrowded },
    cohorts: {
      count: cohorts.length,
      members: membership.size,
      doubleMembership: [...membership.values()].filter((count) => count > 1).length,
    },
    separationViolations,
    galaxyRadius,
  };
}
