import type { SourceId } from './character';

export type StoryKind = 'cosmogony' | 'war' | 'catastrophe' | 'saga' | 'episode';

export interface StoryChapter {
  title: string;
  text: string;
  sources: SourceId[];
  citation?: string;
  topic?: string;
}

export interface StoryCastMember {
  /** Character id once the figure is in the roster; plain name until then. */
  id?: string;
  name: string;
  role: string;
}

export interface StoryPlace {
  /** City id once the place is curated; plain name until then. */
  id?: string;
  name: string;
  role?: string;
}

export interface StoryAttestation {
  source: SourceId;
  work: string;
  citation?: string;
}

/** A myth told as a story (data/stories/*.json). Sub-stories nest via `parent`. */
export interface Story {
  id: string;
  title: string;
  greekTitle?: string;
  kind: StoryKind;
  parent: string | null;
  era: number;
  summary: { text: string; sources: SourceId[]; citation?: string; topic?: string };
  chapters: StoryChapter[];
  cast: StoryCastMember[];
  places: StoryPlace[];
  attestations: StoryAttestation[];
}
