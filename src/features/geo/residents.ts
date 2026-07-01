import type { Character, Relation } from '@/types/character';

/** Figures whose sourced residences include this city. */
export function filterCityResidents(characters: Character[], cityId: string): Character[] {
  return characters.filter((character) =>
    character.residences?.some((residence) => residence.city === cityId),
  );
}

export function countCityResidents(characters: Character[], cityId: string): number {
  return filterCityResidents(characters, cityId).length;
}

/** Relation edges whose endpoints both belong to the resident set. */
export function filterInternalRelations(residents: Character[], relations: Relation[]): Relation[] {
  const residentIds = new Set(residents.map((character) => character.id));
  return relations.filter(
    (relation) => residentIds.has(relation.from) && residentIds.has(relation.to),
  );
}

/** Residences on polises other than the city sky currently open. */
export function otherCityResidences(
  character: Character,
  currentCityId: string,
): NonNullable<Character['residences']> {
  return (character.residences ?? []).filter((residence) => residence.city !== currentCityId);
}
