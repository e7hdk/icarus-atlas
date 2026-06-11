import type { Relation, RelationType, SourceId } from '@/types/character';

/** Relations are stored once, from the child/agent side ("from" = child for type "parent").
 *  These maps phrase the edge from each endpoint's point of view. */
const FROM_SIDE: Record<RelationType, string> = {
  parent: 'child of',
  consort: 'consort of',
  sibling: 'sibling of',
  lover: 'lover of',
  slayer: 'slayer of',
  creator: 'creator of',
  ally: 'ally of',
  adversary: 'adversary of',
};

const TO_SIDE: Record<RelationType, string> = {
  parent: 'parent of',
  consort: 'consort of',
  sibling: 'sibling of',
  lover: 'lover of',
  slayer: 'slain by',
  creator: 'created by',
  ally: 'ally of',
  adversary: 'adversary of',
};

export interface Bond {
  relationId: string;
  otherId: string;
  label: string;
  sources: SourceId[];
  topic?: string;
  note?: string;
}

/** All bonds of a character, phrased from that character's perspective. */
export function bondsFor(characterId: string, relations: Relation[]): Bond[] {
  const bonds: Bond[] = [];
  for (const relation of relations) {
    if (relation.from === characterId) {
      bonds.push({
        relationId: relation.id,
        otherId: relation.to,
        label: FROM_SIDE[relation.type],
        sources: relation.sources,
        topic: relation.topic,
        note: relation.note,
      });
    } else if (relation.to === characterId) {
      bonds.push({
        relationId: relation.id,
        otherId: relation.from,
        label: TO_SIDE[relation.type],
        sources: relation.sources,
        topic: relation.topic,
        note: relation.note,
      });
    }
  }
  return bonds;
}
