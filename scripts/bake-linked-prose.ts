/** Precompute linked-prose segments at build time and write them to
 *  data/generated/linked-prose.json, so story and character pages never run the
 *  ~1200-name greedy scan on the client. Incremental: only entities whose
 *  per-entity signature changed are rebaked. Run via `pnpm bake-linked-prose`
 *  (also chained into `pnpm dev` and `pnpm build`). */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildNameIndex,
  buildSortedSearchNames,
} from '../src/features/linking/name-index';
import { parseLinkedProse } from '../src/features/linking/parse-prose';
import {
  characterLinkingSignature,
  linkingFileSignature,
  linkingNamesSignature,
  storyLinkingSignature,
} from '../src/features/linking/linkingSignature';
import type { Character, CharacterType, Relation } from '../src/types/character';
import type { Story } from '../src/types/story';
import type { ProseSegment } from '../src/features/linking/parse-prose';

const DATA = join(import.meta.dirname, '..', 'data');
const OUT_DIR = join(DATA, 'generated');
const OUT = join(OUT_DIR, 'linked-prose.json');

type BakedStoryEntry = {
  signature: string;
  summary: ProseSegment[];
  chapters: ProseSegment[][];
};

type BakedCharacterEntry = {
  signature: string;
  summary: ProseSegment[][];
  story: ProseSegment[][];
};

type PrevBaked = {
  signature?: string;
  namesSignature?: string;
  stories?: Record<string, BakedStoryEntry>;
  characters?: Record<string, BakedCharacterEntry>;
};

const characters = readdirSync(join(DATA, 'characters'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DATA, 'characters', f), 'utf-8')) as Character)
  .sort((a, b) => a.id.localeCompare(b.id));
const relations = JSON.parse(readFileSync(join(DATA, 'relations.json'), 'utf-8')) as Relation[];
const stories = readdirSync(join(DATA, 'stories'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DATA, 'stories', f), 'utf-8')) as Story)
  .sort((a, b) => a.id.localeCompare(b.id));

const namesSignature = linkingNamesSignature(characters);

const storySignatures = Object.fromEntries(
  stories.map((story) => [story.id, storyLinkingSignature(story, namesSignature)]),
);
const characterSignatures = Object.fromEntries(
  characters.map((character) => [
    character.id,
    characterLinkingSignature(character, relations, namesSignature),
  ]),
);
const fileSignature = linkingFileSignature(namesSignature, characterSignatures, storySignatures);

let prev: PrevBaked | null = null;
if (existsSync(OUT)) {
  try {
    prev = JSON.parse(readFileSync(OUT, 'utf-8')) as PrevBaked;
    if (prev.signature === fileSignature) {
      console.log(
        `Linked prose already baked & current (${stories.length} stories, ${characters.length} characters) — skipping.`,
      );
      process.exit(0);
    }
  } catch {
    prev = null;
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
let storiesRebaked = 0;
let storiesReused = 0;
let charactersRebaked = 0;
let charactersReused = 0;

const bakedStories: Record<string, BakedStoryEntry> = {};
for (const story of stories) {
  const signature = storySignatures[story.id]!;
  const prevEntry = prev?.stories?.[story.id];
  if (prevEntry?.signature === signature) {
    bakedStories[story.id] = prevEntry;
    storiesReused++;
    continue;
  }

  const scopeIds = story.cast.flatMap((member) => (member.id ? [member.id] : []));
  bakedStories[story.id] = {
    signature,
    summary: parseLinkedProse(story.summary.text, sortedNames, nameIndex, characterTypes, scopeIds),
    chapters: story.chapters.map((chapter) =>
      parseLinkedProse(chapter.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
  };
  storiesRebaked++;
}

const bakedCharacters: Record<string, BakedCharacterEntry> = {};
for (const character of characters) {
  const signature = characterSignatures[character.id]!;
  const prevEntry = prev?.characters?.[character.id];
  if (prevEntry?.signature === signature) {
    bakedCharacters[character.id] = prevEntry;
    charactersReused++;
    continue;
  }

  const scopeIds = scopeIdsForCharacter(character.id);
  bakedCharacters[character.id] = {
    signature,
    summary: character.summary.map((paragraph) =>
      parseLinkedProse(paragraph.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
    story: character.story.map((paragraph) =>
      parseLinkedProse(paragraph.text, sortedNames, nameIndex, characterTypes, scopeIds),
    ),
  };
  charactersRebaked++;
}

const ms = Math.round(performance.now() - t0);

const out = {
  signature: fileSignature,
  namesSignature,
  stories: bakedStories,
  characters: bakedCharacters,
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

if (storiesRebaked === 0 && charactersRebaked === 0) {
  console.log(
    `Linked prose signatures refreshed (${stories.length} stories, ${characters.length} characters) — no rebake needed (${ms}ms).`,
  );
} else {
  console.log(
    `Baked linked prose incrementally in ${ms}ms → data/generated/linked-prose.json`,
  );
  console.log(
    `  stories: ${storiesRebaked} rebaked, ${storiesReused} reused · characters: ${charactersRebaked} rebaked, ${charactersReused} reused`,
  );
}
