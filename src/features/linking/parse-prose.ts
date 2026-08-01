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

/** Folded names and a first-letter index, built once per roster.
 *
 *  The scan used to fold BOTH the candidate name and a fresh slice of the text
 *  at every cursor position — and `fold` normalises character by character, so
 *  a full bake was folding some fifteen billion times and took minutes. Two
 *  facts make that unnecessary: `fold` maps each character to exactly one
 *  character (so a text folded once is index-identical to folding each slice),
 *  and a name can only match where its own first letter stands. Same matches,
 *  same order, same output — only the arithmetic is gone. */
const foldedRosters = new WeakMap<
  string[],
  { folded: string[]; byFirstLetter: Map<string, number[]> }
>();

function foldedRoster(sortedNames: string[]) {
  const cached = foldedRosters.get(sortedNames);
  if (cached) return cached;
  const folded = sortedNames.map(fold);
  const byFirstLetter = new Map<string, number[]>();
  // Longest-first order is preserved inside each bucket, and only one bucket
  // can ever apply at a given cursor, so the first match found is unchanged.
  folded.forEach((name, index) => {
    const letter = name[0];
    if (letter === undefined) return;
    const bucket = byFirstLetter.get(letter);
    if (bucket) bucket.push(index);
    else byFirstLetter.set(letter, [index]);
  });
  const built = { folded, byFirstLetter };
  foldedRosters.set(sortedNames, built);
  return built;
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
  const foldedText = fold(text);
  const { folded, byFirstLetter } = foldedRoster(sortedNames);

  while (cursor < text.length) {
    let linked: ProseSegment | null = null;

    // A name can only begin where a word begins, so mid-word positions — most
    // of any text — are skipped before a single name is considered.
    if (cursor === 0 || !isWordChar(text[cursor - 1]!)) {
      for (const index of byFirstLetter.get(foldedText[cursor]!) ?? []) {
        const name = sortedNames[index]!;
        if (!foldedText.startsWith(folded[index]!, cursor)) continue;
        if (!hasWordBoundary(text, cursor, name.length)) continue;

        const slice = text.slice(cursor, cursor + name.length);
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
