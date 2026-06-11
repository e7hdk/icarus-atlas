import type { LensId, Relation, SourceId } from '@/types/character';

/** Orrery ring layers, innermost first. Only non-empty rings are rendered. */
export const RING_ORDER = ['parents', 'siblings', 'children', 'loves', 'wars'] as const;

export type RingKey = (typeof RING_ORDER)[number];

export const RING_LABELS: Record<RingKey, string> = {
  parents: 'Parents',
  siblings: 'Siblings',
  children: 'Children',
  loves: 'Loves',
  wars: 'Wars & allies',
};

export interface RingMember {
  id: string;
  role: string;
  /** True when this membership is told differently by different sources (consensus view only). */
  disputed: boolean;
  sources: SourceId[];
}

/** Groups a character's relations into orrery rings, filtered by the active lens. */
export function ringsFor(
  characterId: string,
  relations: Relation[],
  lens: LensId,
): Record<RingKey, RingMember[]> {
  const rings: Record<RingKey, RingMember[]> = {
    parents: [],
    siblings: [],
    children: [],
    loves: [],
    wars: [],
  };

  for (const relation of relations) {
    if (relation.from !== characterId && relation.to !== characterId) continue;
    if (lens !== 'consensus' && !relation.sources.includes(lens)) continue;

    const other = relation.from === characterId ? relation.to : relation.from;
    const member: RingMember = {
      id: other,
      role: '',
      disputed: Boolean(relation.topic) && lens === 'consensus',
      sources: relation.sources,
    };

    switch (relation.type) {
      case 'parent':
        if (relation.from === characterId) {
          member.role = 'parent';
          rings.parents.push(member);
        } else {
          member.role = 'child';
          rings.children.push(member);
        }
        break;
      case 'sibling':
        member.role = 'sibling';
        rings.siblings.push(member);
        break;
      case 'consort':
        member.role = 'consort';
        rings.loves.push(member);
        break;
      case 'lover':
        member.role = 'lover';
        rings.loves.push(member);
        break;
      case 'ally':
        member.role = 'ally';
        rings.wars.push(member);
        break;
      case 'adversary':
        member.role = 'adversary';
        rings.wars.push(member);
        break;
      case 'slayer':
        member.role = relation.from === characterId ? 'slew' : 'slain by';
        rings.wars.push(member);
        break;
      case 'creator':
        member.role = relation.from === characterId ? 'creation' : 'creator';
        rings.children.push(member);
        break;
    }
  }

  return rings;
}
