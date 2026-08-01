import { useSyncExternalStore } from 'react';

/** Phones and other touch/low-power devices: small viewport OR a coarse pointer.
 *  Drives mobile-only performance trims; desktop is never affected. */
export const MOBILE_MEDIA_QUERY = '(max-width: 768px), (pointer: coarse)';
/** Shared CSS-pixel tolerance that separates an intentional tap from a drag. */
export const MOBILE_TAP_SLOP = 16;

let mql: MediaQueryList | null = null;
function getMql(): MediaQueryList | null {
  if (mql === null && typeof window !== 'undefined') mql = window.matchMedia(MOBILE_MEDIA_QUERY);
  return mql;
}

/** Imperative form for event systems created outside React. */
export function matchesMobileDevice(): boolean {
  return getMql()?.matches ?? false;
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
    matchesMobileDevice,
    () => false,
  );
}
