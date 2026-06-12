import { useSyncExternalStore } from 'react';

/** Phones and other touch/low-power devices: small viewport OR a coarse pointer.
 *  Drives mobile-only performance trims; desktop is never affected. */
const QUERY = '(max-width: 768px), (pointer: coarse)';

let mql: MediaQueryList | null = null;
function getMql(): MediaQueryList | null {
  if (mql === null && typeof window !== 'undefined') mql = window.matchMedia(QUERY);
  return mql;
}

function subscribe(callback: () => void): () => void {
  const query = getMql();
  query?.addEventListener('change', callback);
  return () => query?.removeEventListener('change', callback);
}

/** SSR renders desktop defaults; the client corrects on its first render
 *  (useSyncExternalStore keeps this hydration-safe — no flash, no warning). */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getMql()?.matches ?? false,
    () => false,
  );
}
