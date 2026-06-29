import { hashString } from '@/features/galaxy/layout';
import type { Character, Relation } from '@/types/character';
import type { Story } from '@/types/story';
import { LINKED_PROSE_PARSER_VERSION } from './parse-prose';

/** A cheap, stable fingerprint of everything the linked-prose baker reads —
 *  searchable names, relation partners (scope), and every prose block it parses.
 *  Matches the baked file's signature → skip the multi-second rebake. */
export function linkingSignature(
  characters: Character[],
  relations: Relation[],
  stories: Story[],
): string {
  const names = characters
    .map((c) => `${c.id}:${c.name}:${c.romanName ?? ''}`)
    .sort()
    .join(',');
  const rels = relations
    .map((r) => `${r.from}|${r.to}`)
    .sort()
    .join(',');
  const prose = [
    ...characters.flatMap((c) => [...c.summary.map((p) => p.text), ...c.story.map((p) => p.text)]),
    ...stories.flatMap((s) => [s.summary.text, ...s.chapters.map((ch) => ch.text)]),
  ].join('\0');
  return `${LINKED_PROSE_PARSER_VERSION}.${characters.length}.${relations.length}.${stories.length}.${hashString(names)}.${hashString(rels)}.${hashString(prose)}`;
}
