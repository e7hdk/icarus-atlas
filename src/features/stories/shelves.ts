import type { Story } from '@/types/story';

/** Top-level sagas that open the inner-cosmos shelf (era 0–2). */
export const COSMIC_CYCLE_ROOT_IDS = ['cosmogony', 'great-flood'] as const;

/** Top-level saga for the Argonaut voyage shelf (era ~7). */
export const ARGONAUTICA_ROOT_IDS = ['argonautica'] as const;

/** Top-level saga for the Cadmean house shelf (era ~5–6). */
export const THEBAN_CYCLE_ROOT_IDS = ['theban-cycle'] as const;

/** Top-level saga for Perseus and the Gorgon quest (era ~5.75–5.85). */
export const PERSEUS_CYCLE_ROOT_IDS = ['perseus-cycle'] as const;

/** Top-level saga for Heracles' labours shelf (era ~6.45–6.7). */
export const HERACLES_CYCLE_ROOT_IDS = ['heracles-cycle'] as const;

/** Top-level saga for Theseus and the Attic cycle (era ~6.7–6.8). */
export const THESEUS_CYCLE_ROOT_IDS = ['theseus-cycle'] as const;

/** Top-level saga for the Epic Trojan arc (era ~7.5–8.9). */
export const TROJAN_CYCLE_ROOT_IDS = ['trojan-cycle'] as const;

/** Top-level saga for Odysseus' homecoming (era ~9). */
export const RETURNS_ROOT_IDS = ['odyssey'] as const;

/** Top-level saga for Ovid's catalogue of changed forms (era ~4–6). */
export const METAMORPHOSES_ROOT_IDS = ['metamorphoses'] as const;

export type StoryShelfRootId =
  | (typeof COSMIC_CYCLE_ROOT_IDS)[number]
  | (typeof ARGONAUTICA_ROOT_IDS)[number]
  | (typeof THEBAN_CYCLE_ROOT_IDS)[number]
  | (typeof PERSEUS_CYCLE_ROOT_IDS)[number]
  | (typeof HERACLES_CYCLE_ROOT_IDS)[number]
  | (typeof THESEUS_CYCLE_ROOT_IDS)[number]
  | (typeof TROJAN_CYCLE_ROOT_IDS)[number]
  | (typeof RETURNS_ROOT_IDS)[number]
  | (typeof METAMORPHOSES_ROOT_IDS)[number];

const SHELF_ROOT_IDS: readonly string[] = [
  ...COSMIC_CYCLE_ROOT_IDS,
  ...ARGONAUTICA_ROOT_IDS,
  ...THEBAN_CYCLE_ROOT_IDS,
  ...PERSEUS_CYCLE_ROOT_IDS,
  ...HERACLES_CYCLE_ROOT_IDS,
  ...THESEUS_CYCLE_ROOT_IDS,
  ...TROJAN_CYCLE_ROOT_IDS,
  ...RETURNS_ROOT_IDS,
  ...METAMORPHOSES_ROOT_IDS,
];

export function storiesById(stories: Story[]): Map<string, Story> {
  return new Map(stories.map((story) => [story.id, story]));
}

export function isCosmicCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (COSMIC_CYCLE_ROOT_IDS.includes(current.id as (typeof COSMIC_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isArgonauticaStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (ARGONAUTICA_ROOT_IDS.includes(current.id as (typeof ARGONAUTICA_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isThebanCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (THEBAN_CYCLE_ROOT_IDS.includes(current.id as (typeof THEBAN_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isPerseusCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (PERSEUS_CYCLE_ROOT_IDS.includes(current.id as (typeof PERSEUS_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isHeraclesCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (HERACLES_CYCLE_ROOT_IDS.includes(current.id as (typeof HERACLES_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isTheseusCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (THESEUS_CYCLE_ROOT_IDS.includes(current.id as (typeof THESEUS_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isTrojanCycleStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (TROJAN_CYCLE_ROOT_IDS.includes(current.id as (typeof TROJAN_CYCLE_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isReturnsStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (RETURNS_ROOT_IDS.includes(current.id as (typeof RETURNS_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function isMetamorphosesStory(story: Story, byId: Map<string, Story>): boolean {
  let current: Story | undefined = story;
  while (current) {
    if (METAMORPHOSES_ROOT_IDS.includes(current.id as (typeof METAMORPHOSES_ROOT_IDS)[number])) {
      return true;
    }
    current = current.parent ? byId.get(current.parent) : undefined;
  }
  return false;
}

export function childrenOf(stories: Story[], parentId: string): Story[] {
  return stories
    .filter((story) => story.parent === parentId)
    .sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));
}

export function partitionStoryShelves(stories: Story[]) {
  const byId = storiesById(stories);
  const cosmicRoots = COSMIC_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const argonautRoots = ARGONAUTICA_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const thebanRoots = THEBAN_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const perseusRoots = PERSEUS_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const heraclesRoots = HERACLES_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const theseusRoots = THESEUS_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const trojanRoots = TROJAN_CYCLE_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const returnsRoots = RETURNS_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const metamorphRoots = METAMORPHOSES_ROOT_IDS.map((id) => byId.get(id)).filter(
    (story): story is Story => story != null,
  );
  const heroicRoots = stories
    .filter(
      (story) =>
        story.parent === null &&
        !SHELF_ROOT_IDS.includes(story.id),
    )
    .sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));

  return {
    cosmicRoots,
    argonautRoots,
    thebanRoots,
    perseusRoots,
    heraclesRoots,
    theseusRoots,
    trojanRoots,
    returnsRoots,
    metamorphRoots,
    heroicRoots,
    byId,
  };
}
