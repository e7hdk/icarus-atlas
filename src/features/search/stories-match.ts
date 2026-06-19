import type { Story } from '@/types/story';
import { fold, matchIn } from './match';

/** One myth matched by a search query. A query can land on the myth's own title
 *  or — the point of search on the spindle — on a figure in its `cast` or a
 *  `place` it happens in, so typing a name lays out every story it appears in. */
export interface StorySearchHit {
  story: Story;
  /** Which facet matched; non-title facets render as a context line under the title. */
  field: 'title' | 'greekTitle' | 'cast' | 'place';
  /** Exact string the match was found in (a title, a cast name, a place name). */
  value: string;
  /** [start, end) of the match within `value`, for highlighting. */
  start: number;
  end: number;
  /** Extra context for the result row: a cast member's role, or a place's role. */
  context?: string;
}

interface ScoredHit extends StorySearchHit {
  score: number;
}

/** A myth's own name outranks an alternate title, which outranks an appearance
 *  in the cast, which outranks merely being set in a place. */
const FIELD_WEIGHT: Record<StorySearchHit['field'], number> = {
  title: 4,
  greekTitle: 3,
  cast: 2,
  place: 1,
};

/** Rank myths against a query; each story contributes its single best match.
 *  A figure's name therefore surfaces every story that figure walks through. */
export function searchStories(stories: Story[], rawQuery: string, limit = 12): StorySearchHit[] {
  const query = fold(rawQuery.trim());
  if (!query) return [];

  const hits: ScoredHit[] = [];
  for (const story of stories) {
    const candidates: { field: StorySearchHit['field']; value: string; context?: string }[] = [
      { field: 'title', value: story.title },
    ];
    if (story.greekTitle) candidates.push({ field: 'greekTitle', value: story.greekTitle });
    for (const member of story.cast) {
      candidates.push({ field: 'cast', value: member.name, context: member.role });
    }
    for (const place of story.places) {
      candidates.push({ field: 'place', value: place.name, context: place.role });
    }

    let best: ScoredHit | null = null;
    for (const candidate of candidates) {
      const match = matchIn(candidate.value, query);
      if (!match) continue;
      const score = match.score + FIELD_WEIGHT[candidate.field] * 50;
      if (!best || score > best.score) {
        best = {
          story,
          field: candidate.field,
          value: candidate.value,
          start: match.start,
          end: match.end,
          context: candidate.context,
          score,
        };
      }
    }
    if (best) hits.push(best);
  }

  // Ties (e.g. one figure across many myths) fall into mythic-chronological order.
  hits.sort((a, b) => b.score - a.score || a.story.era - b.story.era);
  return hits.slice(0, limit);
}
