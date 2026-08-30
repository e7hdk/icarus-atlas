'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';
import { parseCompareQuery, serializeCompareQuery } from '@/features/palimpsest/query-state';

/** Keeps the compare pair and the URL in step (docs/PALIMPSEST_PLAN.md §8.5).
 *  Mounted once in the AtlasBar, so it lives on every page.
 *
 *  It reads `window.location.search` directly instead of `useSearchParams`:
 *  the hook would opt every statically generated route into client-side
 *  rendering, and a query parameter must never be the reason a route stops
 *  being static. The URL is written with `replaceState`, so comparing never
 *  fills the visitor's back button with pair changes. */
export function CompareQuerySync() {
  const pathname = usePathname();
  const lens = useGalaxyStore((state) => state.lens);
  const compareWith = useGalaxyStore((state) => state.compareWith);
  const focusedTopic = useGalaxyStore((state) => state.focusedTopic);
  const hydrated = useRef(false);

  // A shared link decides the opening state — once, on first mount. Later
  // navigations must not re-read the URL, or moving to a clean route would
  // silently drop the comparison the visitor is in the middle of.
  useEffect(() => {
    const asked = parseCompareQuery(window.location.search);
    const store = useGalaxyStore.getState();
    if (asked.lens && asked.lens !== 'consensus' && asked.compareWith) {
      store.setComparison(asked.lens, asked.compareWith);
    } else if (asked.lens) {
      store.setLens(asked.lens);
    }
    if (asked.focusedTopic) store.focusTopic(asked.focusedTopic);
    hydrated.current = true;
  }, []);

  // From then on the URL follows the store — including after client-side
  // navigation, which hands us a fresh clean URL to re-stamp, so the address
  // bar stays copyable at every point of the visit.
  useEffect(() => {
    if (!hydrated.current) return;
    const query = serializeCompareQuery({ lens, compareWith, focusedTopic }, window.location.search);
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, '', next);
    }
  }, [lens, compareWith, focusedTopic, pathname]);

  return null;
}
