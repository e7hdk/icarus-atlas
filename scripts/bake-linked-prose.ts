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
  changedNames,
  characterLinkingSignature,
  linkableNameOwners,
  linkingFileSignature,
  linkingNamesSignature,
  storyLinkingSignature,
} from '../src/features/linking/linkingSignature';
import { fold } from '../src/features/search/match';
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
  /** Folded matchable name → its owners. Absent in bakes written before the
   *  name-delta cache; those can only be migrated by one full rebake. */
  nameOwners?: Record<string, string>;
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

const nameOwners = linkableNameOwners(characters);
const storySignatures = Object.fromEntries(
  stories.map((story) => [story.id, storyLinkingSignature(story)]),
);
const characterSignatures = Object.fromEntries(
  characters.map((character) => [character.id, characterLinkingSignature(character, relations)]),
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

// Which names moved since the last bake. A paragraph that contains none of
// them cannot bake differently, however many characters joined the roster —
// so growing the sky no longer costs a full rebake. A bake written before this
// cache existed carries no name map, and can only be migrated by rebaking once.
const moved = prev?.nameOwners ? changedNames(prev.nameOwners, nameOwners) : null;
const migrating = moved === null;
/** Does this text contain a name whose meaning moved? Folded like the matcher,
 *  and deliberately loose (no word boundaries): a false positive costs one
 *  reparse, a false negative would bake a stale link. */
function namesMoveInside(texts: string[]): boolean {
  if (migrating) return true;
  if (moved.length === 0) return false;
  const folded = fold(texts.join('\0'));
  return moved.some((name) => folded.includes(name));
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
  const shaken =
    !prevEntry ||
    namesMoveInside([story.summary.text, ...story.chapters.map((ch) => ch.text)]);
  if (prevEntry?.signature === signature && !shaken) {
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
  const shaken =
    !prevEntry ||
    namesMoveInside([
      ...character.summary.map((p) => p.text),
      ...character.story.map((p) => p.text),
    ]);
  if (prevEntry?.signature === signature && !shaken) {
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
  nameOwners,
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
