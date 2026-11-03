import type { Character, CharacterType } from '@/types/character';
import { buildCharacterIndex, type CharacterIndex } from '@/features/characters/character-index';
import { fold } from '@/features/search/match';
import placeNamesJson from '../../../data/generated/place-names.json';

export interface NameIndexEntry {
  id: string;
  name: string;
  type: CharacterType;
  /** The name is also a place's, and the place is what prose usually means:
   *  it links to this character only where the character is in scope. */
  scoped?: boolean;
}

/** Lowercase folded name → all characters answering to that searchable label. */
export type NameIndex = Map<string, NameIndexEntry[]>;

/** Every place, city and feature name in data/geo, folded as the matcher folds —
 *  baked by scripts/bake-linked-prose.ts, so the bake, the server pages and the
 *  client fallback all read one list. */
export const PLACE_NAMES: ReadonlySet<string> = new Set(placeNamesJson as string[]);

/** Folded place names for the bake to write to data/generated/place-names.json. */
export function foldedPlaceNames(places: { name: string }[]): string[] {
  return [...new Set(places.map((place) => fold(place.name)))].sort();
}

/** Deities keep their names wherever they are said: a river, a mountain or the
 *  Styx is the god itself in this atlas, and Atlas the Titan outweighs Mount
 *  Atlas. A mortal, hero, nymph or creature named like a place — the dog Argos,
 *  the nymph Sparte, the Phrygian Midea — is the place far more often than the
 *  figure, so its name links only where the figure is in scope. */
const KEEPS_ITS_NAME = new Set<CharacterType>(['primordial', 'titan', 'olympian', 'god']);

export function linksOnlyInScope(
  foldedName: string,
  type: CharacterType,
  placeNames: ReadonlySet<string>,
): boolean {
  return placeNames.has(foldedName) && !KEEPS_ITS_NAME.has(type);
}

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
export function buildNameIndex(
  characters: Character[],
  placeNames: ReadonlySet<string> = PLACE_NAMES,
): NameIndex {
  const index: NameIndex = new Map();

  const addKey = (key: string, character: Character) => {
    const entry: NameIndexEntry = {
      id: character.id,
      name: character.name,
      type: character.type,
      ...(linksOnlyInScope(key, character.type, placeNames) ? { scoped: true } : {}),
    };
    const bucket = index.get(key);
    if (bucket) {
      if (!bucket.some((existing) => existing.id === entry.id)) bucket.push(entry);
    } else {
      index.set(key, [entry]);
    }
  };

  for (const character of characters) {
    addKey(fold(character.name), character);
    if (character.romanName) addKey(fold(character.romanName), character);
  }

  return index;
}

export interface LinkingContext {
  characterIndex: CharacterIndex;
  nameIndex: NameIndex;
  sortedNames: string[];
}

/** Precompute everything LinkedProse needs from the full character roster. */
export function buildLinkingContext(
  characters: Character[],
  placeNames: ReadonlySet<string> = PLACE_NAMES,
): LinkingContext {
  return {
    characterIndex: buildCharacterIndex(characters),
    nameIndex: buildNameIndex(characters, placeNames),
    sortedNames: buildSortedSearchNames(characters),
  };
}
