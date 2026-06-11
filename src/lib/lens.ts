import type { Character, LensId, Relation, SourcedText } from '@/types/character';

export function isVisibleUnderLens(sources: SourcedText['sources'], lens: LensId): boolean {
  return lens === 'consensus' || sources.includes(lens);
}

/** Returns only facts attested by the active source; consensus keeps the union. */
export function filterSourced(entries: SourcedText[], lens: LensId): SourcedText[] {
  return entries.filter((entry) => isVisibleUnderLens(entry.sources, lens));
}

/** Picks the first fact actually attested by the active source. */
export function pickSourced(entries: SourcedText[], lens: LensId): SourcedText | undefined {
  return filterSourced(entries, lens)[0];
}

/** Relations re-wire with the lens just like sourced text does. */
export function filterRelations(relations: Relation[], lens: LensId): Relation[] {
  return relations.filter((relation) => isVisibleUnderLens(relation.sources, lens));
}

/** True when any topic about this character is told differently by different sources. */
export function isDisputed(character: Character, relations: Relation[]): boolean {
  const counts = new Map<string, number>();
  const bump = (topic?: string) => {
    if (topic) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  };
  for (const entry of [...character.summary, ...character.story]) bump(entry.topic);
  for (const relation of relations) {
    if (relation.from === character.id || relation.to === character.id) bump(relation.topic);
  }
  for (const count of counts.values()) {
    if (count > 1) return true;
  }
  return false;
}
