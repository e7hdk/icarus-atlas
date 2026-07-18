/** The spotlight gate — who may be a star of the day.
 *
 *  Rule (docs/EPHEMERIS_PLAN.md D2, audited 2026-07-11):
 *    hasCulture || (degree >= SPOTLIGHT_MIN_DEGREE && casts >= SPOTLIGHT_MIN_CASTS)
 *
 *  A curated Legacy shelf is a sufficient signal on its own (it saves figures
 *  like Icarus — degree 1, culturally enormous), while the degree+casts leg
 *  admits figures woven into both the genealogy and the myths that simply have
 *  no Legacy research yet. Reference files are deliberately NOT a signal —
 *  batches wrote them for filler figures too. Nor is a culture file with every
 *  shelf empty (the "honest empty Legacy" of the M2.20 abstractions): callers
 *  must pass cultureIds already filtered to non-empty shelves
 *  (build.ts loadCuratedCultureIds).
 *
 *  This gate is internal editorial machinery only (D9): it must never surface
 *  in the UI as a ranking, badge or sort order. */

import type { Character, Relation } from '@/types/character';
import type { EphemerisRosterEntry, SpotlightOverrides } from '@/types/spotlight';

export const SPOTLIGHT_MIN_DEGREE = 4;
export const SPOTLIGHT_MIN_CASTS = 2;

/** Undirected relation degree per character id. */
export function relationDegrees(relations: Pick<Relation, 'from' | 'to'>[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const relation of relations) {
    degrees.set(relation.from, (degrees.get(relation.from) ?? 0) + 1);
    degrees.set(relation.to, (degrees.get(relation.to) ?? 0) + 1);
  }
  return degrees;
}

/** Story-cast appearance count per character id (plain-name cast members carry no id). */
export function castCounts(stories: { cast: { id?: string }[] }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const member of story.cast) {
      if (member.id) counts.set(member.id, (counts.get(member.id) ?? 0) + 1);
    }
  }
  return counts;
}

export function isSpotlightEligible(args: {
  hasCulture: boolean;
  degree: number;
  casts: number;
  pinned: boolean;
  excluded: boolean;
}): boolean {
  if (args.excluded) return false;
  if (args.pinned || args.hasCulture) return true;
  return args.degree >= SPOTLIGHT_MIN_DEGREE && args.casts >= SPOTLIGHT_MIN_CASTS;
}

/** The eligible roster, sorted by id — the permutation's stable base order. */
export function buildRoster(args: {
  characters: Pick<Character, 'id' | 'name' | 'type'>[];
  relations: Pick<Relation, 'from' | 'to'>[];
  stories: { cast: { id?: string }[] }[];
  cultureIds: ReadonlySet<string>;
  overrides: SpotlightOverrides;
}): EphemerisRosterEntry[] {
  const degrees = relationDegrees(args.relations);
  const casts = castCounts(args.stories);
  const pins = new Set(args.overrides.pins);
  const exclusions = new Set(args.overrides.exclusions);

  return args.characters
    .filter((character) =>
      isSpotlightEligible({
        hasCulture: args.cultureIds.has(character.id),
        degree: degrees.get(character.id) ?? 0,
        casts: casts.get(character.id) ?? 0,
        pinned: pins.has(character.id),
        excluded: exclusions.has(character.id),
      }),
    )
    .map(({ id, name, type }) => ({ id, name, type }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
