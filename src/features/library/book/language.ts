import type { BookLanguage } from './engine';

/** The language a reader chose in the reading room, kept in the browser so that
 *  the next book opens in it too. A small store for `useSyncExternalStore`: the
 *  server and the first paint know nothing of it, and the choice arrives after. */

const KEY = 'icarus-book-language';
const listeners = new Set<() => void>();
let kept: BookLanguage | null | undefined;

export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function keptLanguage(): BookLanguage | null {
  if (kept !== undefined) return kept;
  try {
    const value = window.localStorage.getItem(KEY);
    kept = value === 'both' || value === 'orig' || value === 'trans' ? value : null;
  } catch {
    // a private window may refuse storage: the choice lasts for the page
    kept = null;
  }
  return kept;
}

export function keepLanguage(language: BookLanguage) {
  kept = language;
  try {
    window.localStorage.setItem(KEY, language);
  } catch {
    // as above
  }
  for (const listener of listeners) listener();
}
