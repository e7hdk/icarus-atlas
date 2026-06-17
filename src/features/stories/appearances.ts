import type { Story } from '@/types/story';

/** Stories whose cast lists this character id (sorted by mythic era). */
export function storiesFeaturingCharacter(stories: Story[], characterId: string): Story[] {
  return stories
    .filter((story) => story.cast.some((member) => member.id === characterId))
    .sort((a, b) => a.era - b.era || a.title.localeCompare(b.title));
}

export function storiesById(stories: Story[]): Map<string, Story> {
  return new Map(stories.map((story) => [story.id, story]));
}
