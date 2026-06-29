import type { Character, CharacterType } from '@/types/character';

export type CharacterIndex = Record<string, { name: string; type: CharacterType }>;

/** Lightweight id → { name, type } map for lineage links and other UI surfaces. */
export function buildCharacterIndex(characters: Character[]): CharacterIndex {
  return Object.fromEntries(characters.map((c) => [c.id, { name: c.name, type: c.type }]));
}
