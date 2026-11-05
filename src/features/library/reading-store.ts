'use client';

import { create } from 'zustand';

/** First, Chaos's own state (docs/LIBRARY_PLAN.md §8), apart from the galaxy's:
 *  which teller the reader asked for in the finale, if any. Until they ask, the
 *  scroll decides — Hesiod through the poem, Homer at its end. */
export type ReadingLens = 'hesiod' | 'homer';

export const useReadingStore = create<{ chosen: ReadingLens | null; choose: (lens: ReadingLens | null) => void }>()((set) => ({
  chosen: null,
  choose: (chosen) => set({ chosen }),
}));
