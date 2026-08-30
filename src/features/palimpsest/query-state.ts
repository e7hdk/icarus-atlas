/** Compare state in the URL (docs/PALIMPSEST_PLAN.md §8.5). Pure string work:
 *  parsing never touches the store and serializing never touches the DOM, so
 *  both are testable and the caller decides when to read or write.
 *
 *  The params are read from `window.location.search` in an effect rather than
 *  through `useSearchParams`, so statically generated routes stay static —
 *  a query parameter must never be the reason a route turns dynamic. */

import { SOURCE_IDS, type LensId, type SourceId } from '@/types/character';

export const LENS_PARAM = 'lens';
export const COMPARE_PARAM = 'compare';
export const TOPIC_PARAM = 'topic';

export interface CompareQuery {
  /** The primary teller the URL asks for, or null when it asks for nothing. */
  lens: LensId | null;
  compareWith: SourceId | null;
  focusedTopic: string | null;
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function asSource(value: string | null): SourceId | null {
  return value && (SOURCE_IDS as readonly string[]).includes(value) ? (value as SourceId) : null;
}

function asLens(value: string | null): LensId | null {
  return value === 'consensus' ? 'consensus' : asSource(value);
}

/** Read compare state out of a query string, failing closed: anything unknown,
 *  self-paired, or incoherent degrades to single-lens reading rather than
 *  throwing or guessing. `consensus` is never a side of a comparison — it is
 *  already the union of all tellers. */
export function parseCompareQuery(search: string): CompareQuery {
  const params = new URLSearchParams(search);
  const lens = asLens(params.get(LENS_PARAM));
  const requested = asSource(params.get(COMPARE_PARAM));
  // A secondary teller only means something beside a concrete primary one.
  const compareWith =
    requested && lens && lens !== 'consensus' && lens !== requested ? requested : null;
  const topic = params.get(TOPIC_PARAM);
  return { lens, compareWith, focusedTopic: topic && KEBAB.test(topic) ? topic : null };
}

/** Canonical query string for the current state, preserving any unrelated
 *  params already in `search`. Consensus with no comparison writes nothing, so
 *  ordinary browsing keeps the clean URLs it has today. */
export function serializeCompareQuery(
  state: { lens: LensId; compareWith: SourceId | null; focusedTopic: string | null },
  search = '',
): string {
  const params = new URLSearchParams(search);
  const comparing = state.lens !== 'consensus' && state.compareWith !== null;

  if (state.lens === 'consensus') params.delete(LENS_PARAM);
  else params.set(LENS_PARAM, state.lens);

  if (comparing) params.set(COMPARE_PARAM, state.compareWith as SourceId);
  else params.delete(COMPARE_PARAM);

  if (state.focusedTopic) params.set(TOPIC_PARAM, state.focusedTopic);
  else params.delete(TOPIC_PARAM);

  return params.toString();
}
