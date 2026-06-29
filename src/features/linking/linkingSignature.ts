import { hashString } from '@/features/galaxy/layout';
import type { Character, Relation } from '@/types/character';
import type { Story } from '@/types/story';
import { LINKED_PROSE_PARSER_VERSION } from './parse-prose';

/** Fingerprint of the global searchable name roster — any change rebakes every entity
 *  (new names can match in any prose block). */
export function linkingNamesSignature(characters: Character[]): string {
  const names = characters
    .map((c) => `${c.id}:${c.name}:${c.romanName ?? ''}`)
    .sort()
    .join(',');
  return `${LINKED_PROSE_PARSER_VERSION}.${characters.length}.${hashString(names)}`;
}

/** Per-character inputs: global names, relation scope partners, and own prose. */
export function characterLinkingSignature(
  character: Character,
  relations: Relation[],
  namesSignature: string,
): string {
  const relScope = relations
    .filter((r) => r.from === character.id || r.to === character.id)
    .map((r) => `${r.from}|${r.to}`)
    .sort()
    .join(',');
  const prose = [
    ...character.summary.map((p) => p.text),
    ...character.story.map((p) => p.text),
  ].join('\0');
  return `${namesSignature}.${hashString(relScope)}.${hashString(prose)}`;
}

/** Per-story inputs: global names, cast ids (link scope), and prose. */
export function storyLinkingSignature(story: Story, namesSignature: string): string {
  const cast = story.cast
    .flatMap((member) => (member.id ? [member.id] : []))
    .sort()
    .join(',');
  const prose = [story.summary.text, ...story.chapters.map((ch) => ch.text)].join('\0');
  return `${namesSignature}.${hashString(cast)}.${hashString(prose)}`;
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

/** @deprecated Use per-entity signatures + linkingFileSignature. Kept for docs/tests. */
export function linkingSignature(
  characters: Character[],
  relations: Relation[],
  stories: Story[],
): string {
  const namesSignature = linkingNamesSignature(characters);
  const characterSignatures = Object.fromEntries(
    characters.map((c) => [c.id, characterLinkingSignature(c, relations, namesSignature)]),
  );
  const storySignatures = Object.fromEntries(
    stories.map((s) => [s.id, storyLinkingSignature(s, namesSignature)]),
  );
  return linkingFileSignature(namesSignature, characterSignatures, storySignatures);
}
