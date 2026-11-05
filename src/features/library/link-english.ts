import aliasesJson from '../../../data/library/aliases.json';
import { buildLinkingContext, type NameIndex } from '@/features/linking/name-index';
import { parseLinkedProse, type ProseSegment } from '@/features/linking/parse-prose';
import { fold } from '@/features/search/match';
import type { Character, CharacterType } from '@/types/character';

/** Names in the English column (docs/LIBRARY_PLAN.md §4.6, L11). The atlas's own
 *  engine reads the text, with two changes for the ancient texts: outside the
 *  passage's scope only a god whose name no one else bears links (Achaea the land
 *  is not the figure Achaea, the war-goddess Enyo is not the Graea), and each
 *  edition's own spellings join the index (Murray's Athene, More's Jove). */

type Alias = string | string[] | { id: string; scoped: boolean };
const ALIASES = (aliasesJson as unknown as { editions: Record<string, Record<string, Alias>> }).editions;
const DIVINE = new Set<CharacterType>(['primordial', 'titan', 'olympian', 'god']);

export interface EnglishLinker {
  link(text: string, scope: string[]): ProseSegment[];
}

const cache = new Map<string, EnglishLinker>();

export function englishLinker(edition: string, characters: Character[]): EnglishLinker {
  const known = cache.get(edition);
  if (known) return known;
  const { nameIndex, sortedNames } = buildLinkingContext(characters);
  const byId = new Map(characters.map((character) => [character.id, character]));
  const types: Record<string, CharacterType> = Object.fromEntries(characters.map((character) => [character.id, character.type]));

  // the Library's rule: a mortal, a hero, a nymph or a creature links only in scope
  const index: NameIndex = new Map();
  for (const [key, entries] of nameIndex) index.set(key, entries.map((entry) => (DIVINE.has(entry.type) ? entry : { ...entry, scoped: true })));
  const extraNames: string[] = [];
  for (const [form, alias] of Object.entries(ALIASES[edition] ?? {})) {
    const targets = typeof alias === 'string' ? [{ id: alias, scoped: false }] : Array.isArray(alias) ? alias.map((id) => ({ id, scoped: false })) : [alias];
    const entries = targets.flatMap(({ id, scoped }) => {
      const character = byId.get(id);
      if (!character) return [];
      return [{ id, name: character.name, type: character.type, ...(scoped || !DIVINE.has(character.type) ? { scoped: true as const } : {}) }];
    });
    if (entries.length === 0) continue;
    const key = fold(form);
    index.set(key, [...(index.get(key) ?? []), ...entries]);
    extraNames.push(form);
  }
  const names = [...sortedNames, ...extraNames].sort((a, b) => b.length - a.length);
  const linker: EnglishLinker = { link: (text, scope) => parseLinkedProse(text, names, index, types, scope) };
  cache.set(edition, linker);
  return linker;
}
