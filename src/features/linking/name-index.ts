import type { Character, CharacterType } from '@/types/character';
import { buildCharacterIndex, type CharacterIndex } from '@/features/characters/character-index';
import { fold } from '@/features/search/match';

export interface NameIndexEntry {
  id: string;
  name: string;
  type: CharacterType;
}

/** Lowercase folded name → all characters answering to that searchable label. */
export type NameIndex = Map<string, NameIndexEntry[]>;

/** All searchable labels (canonical name + romanName), longest first for greedy scan. */
export function buildSortedSearchNames(characters: Character[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const character of characters) {
    for (const raw of [character.name, character.romanName].filter(Boolean) as string[]) {
      const key = fold(raw);
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(raw);
    }
  }
  return names.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

/** Index canonical and Roman names for case-insensitive prose matching. */
export function buildNameIndex(characters: Character[]): NameIndex {
  const index: NameIndex = new Map();

  const addKey = (key: string, entry: NameIndexEntry) => {
    const bucket = index.get(key);
    if (bucket) {
      if (!bucket.some((existing) => existing.id === entry.id)) bucket.push(entry);
    } else {
      index.set(key, [entry]);
    }
  };

  for (const character of characters) {
    const entry: NameIndexEntry = {
      id: character.id,
      name: character.name,
      type: character.type,
    };
    addKey(fold(character.name), entry);
    if (character.romanName) addKey(fold(character.romanName), entry);
  }

  return index;
}

export interface LinkingContext {
  characterIndex: CharacterIndex;
  nameIndex: NameIndex;
  sortedNames: string[];
}

/** Precompute everything LinkedProse needs from the full character roster. */
export function buildLinkingContext(characters: Character[]): LinkingContext {
  return {
    characterIndex: buildCharacterIndex(characters),
    nameIndex: buildNameIndex(characters),
    sortedNames: buildSortedSearchNames(characters),
  };
}
