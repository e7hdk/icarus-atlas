import { fold } from '@/features/search/match';
import type { NameIndex } from './name-index';

/** Pick a single character id for a matched name, or null when ambiguous. A
 *  name with one bearer links anywhere — unless it is scoped (a place's name
 *  too), which links only where its bearer is in scope. */
export function resolveCharacterId(
  matchedName: string,
  nameIndex: NameIndex,
  scopeIds?: string[],
): string | null {
  const candidates = nameIndex.get(fold(matchedName));
  if (!candidates?.length) return null;
  if (candidates.length === 1 && !candidates[0].scoped) return candidates[0].id;

  if (scopeIds?.length) {
    const inScope = candidates.filter((entry) => scopeIds.includes(entry.id));
    if (inScope.length === 1) return inScope[0].id;
  }

  return null;
}
