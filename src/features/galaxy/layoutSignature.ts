import { hashString, LAYOUT_VERSION } from './layout';
import type { Character, Relation } from '@/types/character';

/** A cheap, stable fingerprint of everything the layout solver reads — character
 *  id/type/cluster/residences and the relation graph (from/type/to). If it matches
 *  the baked file's signature, the precomputed galaxy positions are valid and the
 *  multi-second `computePositions` solve is skipped entirely. Any added/removed
 *  character, type/cluster/residence change, or edited relation flips the signature
 *  and forces a re-bake / runtime recompute. Residences are folded in because the
 *  cohort/shell layout now reads them (co-resident masses cluster). Cheap to compute
 *  (~a few ms) versus the ~5s solve it guards. */
export function layoutSignature(characters: Character[], relations: Relation[]): string {
  const chars = characters
    .map(
      (c) =>
        `${c.id}:${c.type}:${c.cluster}:${(c.residences ?? [])
          .map((r) => r.city)
          .sort()
          .join('+')}`,
    )
    .sort()
    .join(',');
  const rels = relations
    .map((r) => `${r.from}|${r.type}|${r.to}`)
    .sort()
    .join(',');
  return `${LAYOUT_VERSION}.${characters.length}.${relations.length}.${hashString(chars)}.${hashString(rels)}`;
}
