import type { BookLanguage } from './engine';
import { READER_LANGUAGES, type ReaderLanguage } from '@/types/library';

/** What a reader chose in the reading room, kept in the browser so that the next
 *  book opens in it too: which pages to show (the original, both, the translation)
 *  and which translation (English, German, Turkish). Small stores for
 *  `useSyncExternalStore`: the server and the first paint know nothing of them, and
 *  the choice arrives after. A translation a work lacks is still kept, so the next
 *  book that has it opens in it. */

function keptChoice<T extends string>(key: string, values: readonly T[]) {
  const listeners = new Set<() => void>();
  let kept: T | null | undefined;
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read(): T | null {
      if (kept !== undefined) return kept;
      try {
        const value = window.localStorage.getItem(key);
        kept = values.find((candidate) => candidate === value) ?? null;
      } catch {
        // a private window may refuse storage: the choice lasts for the page
        kept = null;
      }
      return kept;
    },
    keep(value: T) {
      kept = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // as above
      }
      for (const listener of listeners) listener();
    },
  };
}

const language = keptChoice<BookLanguage>('icarus-book-language', ['both', 'orig', 'trans']);
const translation = keptChoice<ReaderLanguage>('icarus-book-translation', READER_LANGUAGES);

export const subscribeLanguage = language.subscribe;
export const keptLanguage = language.read;
export const keepLanguage = language.keep;

export const subscribeTranslation = translation.subscribe;
export const keptTranslation = translation.read;
export const keepTranslation = translation.keep;
