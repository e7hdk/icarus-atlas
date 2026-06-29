import type { CharacterType } from '@/types/character';
import { fold } from '@/features/search/match';
import type { NameIndex } from './name-index';
import { resolveCharacterId } from './resolve-name';

/** Bumped when link-scan semantics change — invalidates linked-prose.json. */
export const LINKED_PROSE_PARSER_VERSION = 1;

export type ProseSegment =
  | { kind: 'plain'; text: string }
  | { kind: 'link'; text: string; id: string; type: CharacterType };

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}']/u.test(ch);
}

function hasWordBoundary(text: string, start: number, length: number): boolean {
  const beforeOk = start === 0 || !isWordChar(text[start - 1]!);
  const afterIndex = start + length;
  const afterOk = afterIndex >= text.length || !isWordChar(text[afterIndex]!);
  return beforeOk && afterOk;
}

/** Split prose into plain runs and resolvable character links (longest match, word boundaries). */
export function parseLinkedProse(
  text: string,
  sortedNames: string[],
  nameIndex: NameIndex,
  characterTypes: Record<string, CharacterType>,
  scopeIds?: string[],
): ProseSegment[] {
  if (!text) return [];

  const segments: ProseSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let linked: ProseSegment | null = null;

    for (const name of sortedNames) {
      if (cursor + name.length > text.length) continue;

      const slice = text.slice(cursor, cursor + name.length);
      if (fold(slice) !== fold(name)) continue;
      if (!hasWordBoundary(text, cursor, name.length)) continue;

      const id = resolveCharacterId(name, nameIndex, scopeIds);
      if (!id) {
        linked = { kind: 'plain', text: slice };
        break;
      }

      const type = characterTypes[id];
      if (!type) break;

      linked = { kind: 'link', text: slice, id, type };
      break;
    }

    if (linked) {
      segments.push(linked);
      cursor += linked.text.length;
      continue;
    }

    const nextCursor = cursor + 1;
    const trailing = segments[segments.length - 1];
    if (trailing?.kind === 'plain') {
      trailing.text += text[cursor];
    } else {
      segments.push({ kind: 'plain', text: text[cursor]! });
    }
    cursor = nextCursor;
  }

  return segments;
}
