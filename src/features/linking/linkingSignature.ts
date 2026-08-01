import { hashString } from '@/features/galaxy/layout';
import { fold } from '@/features/search/match';
import type { Character, Relation } from '@/types/character';
import type { Story } from '@/types/story';
import { LINKED_PROSE_PARSER_VERSION } from './parse-prose';

/** Fingerprint of the global searchable name roster — the whole-file "nothing
 *  at all changed" exit. It is NOT folded into the per-entity signatures: a
 *  single new character used to invalidate every baked paragraph, and the
 *  linker does not work that way (see nameOwners below). */
export function linkingNamesSignature(characters: Character[]): string {
  const names = characters
    .map((c) => `${c.id}:${c.name}:${c.romanName ?? ''}:${c.type}`)
    .sort()
    .join(',');
  return `${LINKED_PROSE_PARSER_VERSION}.${characters.length}.${hashString(names)}`;
}

/** Every string the linker can match, folded exactly as the matcher folds it,
 *  mapped to who answers to it. The owners carry their `type` because a link
 *  segment records the type it linked to, so a retyped character changes the
 *  baked output of every paragraph that names it. */
export function linkableNameOwners(characters: Character[]): Record<string, string> {
  const owners = new Map<string, string[]>();
  for (const character of characters) {
    for (const raw of [character.name, character.romanName].filter(Boolean) as string[]) {
      const key = fold(raw);
      owners.set(key, [...(owners.get(key) ?? []), `${character.id}:${character.type}`]);
    }
  }
  return Object.fromEntries([...owners].map(([key, ids]) => [key, ids.sort().join(',')]));
}

/** The names whose meaning moved between two bakes — added, removed, re-owned
 *  (a homonym joined them) or retyped. This is the whole trick: parseLinkedProse
 *  walks a text left to right and matches names locally, consulting nothing
 *  global, so a paragraph containing NONE of these strings must bake to exactly
 *  the bytes it baked to last time, however much the roster grew around it. */
export function changedNames(
  before: Record<string, string>,
  after: Record<string, string>,
): string[] {
  const moved: string[] = [];
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[name] !== after[name]) moved.push(name);
  }
  return moved;
}

/** Per-character inputs that are the character's OWN: its prose and the
 *  relation scope its links resolve against. What the rest of the roster is
 *  called is handled by the name delta, not by invalidating this. */
export function characterLinkingSignature(character: Character, relations: Relation[]): string {
  const relScope = relations
    .filter((r) => r.from === character.id || r.to === character.id)
    .map((r) => `${r.from}|${r.to}`)
    .sort()
    .join(',');
  const prose = [
    ...character.summary.map((p) => p.text),
    ...character.story.map((p) => p.text),
  ].join('\0');
  return `${LINKED_PROSE_PARSER_VERSION}.${hashString(relScope)}.${hashString(prose)}`;
}

/** Per-story inputs that are the story's own: cast ids (link scope) and prose. */
export function storyLinkingSignature(story: Story): string {
  const cast = story.cast
    .flatMap((member) => (member.id ? [member.id] : []))
    .sort()
    .join(',');
  const prose = [story.summary.text, ...story.chapters.map((ch) => ch.text)].join('\0');
  return `${LINKED_PROSE_PARSER_VERSION}.${hashString(cast)}.${hashString(prose)}`;
}

/** Aggregate file signature from per-entity signatures — quick "nothing changed" exit. */
export function linkingFileSignature(
  namesSignature: string,
  characterSignatures: Record<string, string>,
  storySignatures: Record<string, string>,
): string {
  const chars = Object.entries(characterSignatures)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, sig]) => `${id}:${sig}`)
    .join(',');
  const stories = Object.entries(storySignatures)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, sig]) => `${id}:${sig}`)
    .join(',');
  return `${namesSignature}.${hashString(chars)}.${hashString(stories)}`;
}
