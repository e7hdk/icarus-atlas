/** Precompute linked-prose segments at build time and write them to
 *  data/generated/linked-prose.json, so story and character pages never run the
 *  ~1200-name greedy scan on the client. Run via `pnpm bake-linked-prose`
 *  (also chained into `pnpm dev` and `pnpm build`). */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildNameIndex,
  buildSortedSearchNames,
} from '../src/features/linking/name-index';
import { parseLinkedProse } from '../src/features/linking/parse-prose';
import { linkingSignature } from '../src/features/linking/linkingSignature';
import type { Character, CharacterType, Relation } from '../src/types/character';
import type { Story } from '../src/types/story';

const DATA = join(import.meta.dirname, '..', 'data');
const OUT_DIR = join(DATA, 'generated');
const OUT = join(OUT_DIR, 'linked-prose.json');

const characters = readdirSync(join(DATA, 'characters'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DATA, 'characters', f), 'utf-8')) as Character)
  .sort((a, b) => a.id.localeCompare(b.id));
const relations = JSON.parse(readFileSync(join(DATA, 'relations.json'), 'utf-8')) as Relation[];
const stories = readdirSync(join(DATA, 'stories'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DATA, 'stories', f), 'utf-8')) as Story)
  .sort((a, b) => a.id.localeCompare(b.id));

const signature = linkingSignature(characters, relations, stories);

if (existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf-8')) as {
      signature?: string;
      stories?: Record<string, unknown>;
      characters?: Record<string, unknown>;
    };
    if (prev.signature === signature) {
      const storyCount = Object.keys(prev.stories ?? {}).length;
      const charCount = Object.keys(prev.characters ?? {}).length;
      console.log(
        `Linked prose already baked & current (${storyCount} stories, ${charCount} characters) — skipping.`,
      );
      process.exit(0);
    }
  } catch {
    // fall through and rebake
  }
}

const nameIndex = buildNameIndex(characters);
const sortedNames = buildSortedSearchNames(characters);
const characterTypes: Record<string, CharacterType> = Object.fromEntries(
  characters.map((c) => [c.id, c.type]),
);

function scopeIdsForCharacter(charId: string): string[] {
  const ids = new Set<string>([charId]);
  for (const relation of relations) {
    if (relation.from === charId) ids.add(relation.to);
    if (relation.to === charId) ids.add(relation.from);
  }
  return [...ids];
}

const t0 = performance.now();

const bakedStories: Record<
  string,
  { summary: ReturnType<typeof parseLinkedProse>; chapters: ReturnType<typeof parseLinkedProse>[] }
> = {};
for (const story of stories) {
  const scopeIds = story.cast.flatMap((member) => (member.id ? [member.id] : []));
  bakedStories[story.id] = {
    summary: parseLinkedProse(story.summary.text, sortedNames, nameIndex, characterTypes, scopeIds),
    chapters: story.chapters.map((chapter) =>
      parseLinkedProse(chapter.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
  };
}

const bakedCharacters: Record<
  string,
  { summary: ReturnType<typeof parseLinkedProse>[]; story: ReturnType<typeof parseLinkedProse>[] }
> = {};
for (const character of characters) {
  const scopeIds = scopeIdsForCharacter(character.id);
  bakedCharacters[character.id] = {
    summary: character.summary.map((paragraph) =>
      parseLinkedProse(paragraph.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
    story: character.story.map((paragraph) =>
      parseLinkedProse(paragraph.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
  };
}

const ms = Math.round(performance.now() - t0);

const out = {
  signature,
  stories: bakedStories,
  characters: bakedCharacters,
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
console.log(
  `Baked linked prose for ${stories.length} stories and ${characters.length} characters in ${ms}ms → data/generated/linked-prose.json`,
);
