import type { Character, Relation, StarFacts } from '@/types/character';

/** Figures whose sourced residences include this city. */
export function filterCityResidents<T extends StarFacts>(characters: T[], cityId: string): T[] {
  return characters.filter((character) =>
    character.residences?.some((residence) => residence.city === cityId),
  );
}

export function countCityResidents(characters: StarFacts[], cityId: string): number {
  return filterCityResidents(characters, cityId).length;
}

/** Relation edges whose endpoints both belong to the resident set. */
export function filterInternalRelations(residents: StarFacts[], relations: Relation[]): Relation[] {
  const residentIds = new Set(residents.map((character) => character.id));
  return relations.filter(
    (relation) => residentIds.has(relation.from) && residentIds.has(relation.to),
  );
}

/** Residences on polises other than the city sky currently open. */
export function otherCityResidences(
  character: StarFacts,
  currentCityId: string,
): NonNullable<Character['residences']> {
  return (character.residences ?? []).filter((residence) => residence.city !== currentCityId);
}
