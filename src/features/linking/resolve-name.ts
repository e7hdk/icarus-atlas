import { fold } from '@/features/search/match';
import type { NameIndex } from './name-index';

/** Pick a single character id for a matched name, or null when ambiguous. A
 *  name with one bearer links anywhere — unless it is scoped (a place's name
 *  too), which links only where its bearer is in scope. A figure's own prose
 *  never links to itself (`selfId`): its name there is either the page it is
 *  read on or a namesake it is being told apart from. */
export function resolveCharacterId(
  matchedName: string,
  nameIndex: NameIndex,
  scopeIds?: string[],
  selfId?: string,
): string | null {
  const candidates = nameIndex.get(fold(matchedName));
  if (!candidates?.length) return null;

  let resolved: string | null = null;
  if (candidates.length === 1 && !candidates[0].scoped) {
    resolved = candidates[0].id;
  } else if (scopeIds?.length) {
    const inScope = candidates.filter((entry) => scopeIds.includes(entry.id));
    if (inScope.length === 1) resolved = inScope[0].id;
  }

  return resolved === selfId ? null : resolved;
}
