import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LensId, SourceId } from '@/types/character';

interface GalaxyState {
  /** Active source lens — the primary teller. The selector UI lives in atlas
   *  settings; on a character's Poets tab it has a local dropdown too. */
  lens: LensId;
  /** The second teller held beside the primary one (docs/PALIMPSEST_PLAN.md
   *  §8.5). Null means reading after one teller, which is the default and the
   *  state every existing surface already understands. `consensus` is never a
   *  side: it is already the union of all tellers. */
  compareWith: SourceId | null;
  /** The topic the visitor followed into a comparison, so a shared link can
   *  reopen the same Knot rather than a generic pair. */
  focusedTopic: string | null;
  hoveredId: string | null;
  selectedId: string | null;
  isDiving: boolean;
  searchOpen: boolean;
  settingsOpen: boolean;
  /** Where the camera should fly for the current selection, when that is NOT
   *  the star's own place on the disc. The week's catasterism hangs copies of
   *  its cast high above the galaxy: clicking one opens that character, but
   *  the camera must rise to the copy the visitor actually clicked. */
  focusPoint: [number, number, number] | null;
  /** How far the camera should stand off that focus. The sky's stars are drawn
   *  tens of units wide at their distance, so the galaxy's close framing would
   *  put the camera inside them. */
  focusDistance: number | null;
  /** A constellation the visitor has flown out to read — the sky's own focus,
   *  independent of any character selection. */
  skyFocus: { id: string; at: [number, number, number]; distance: number } | null;
  setSkyFocus: (focus: GalaxyState['skyFocus']) => void;
  setLens: (lens: LensId) => void;
  setComparison: (primary: SourceId, secondary: SourceId) => void;
  swapComparison: () => void;
  clearComparison: () => void;
  followTeller: (source: SourceId) => void;
  focusTopic: (topic: string | null) => void;
  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
  selectAt: (
    id: string,
    focusPoint: [number, number, number],
    focusDistance?: number | null,
  ) => void;
  setDiving: (isDiving: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  spacingScale: number;
  setSpacingScale: (scale: number) => void;
  /** Ambient music — persisted, controls a single global audio element. */
  musicEnabled: boolean;
  musicVolume: number;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
}

export const useGalaxyStore = create<GalaxyState>()(
  persist(
    (set) => ({
      lens: 'consensus',
      compareWith: null,
      focusedTopic: null,
      hoveredId: null,
      selectedId: null,
      isDiving: false,
      focusPoint: null,
      focusDistance: null,
      skyFocus: null,
      searchOpen: false,
      settingsOpen: false,
      spacingScale: 6.1,
      musicEnabled: true,
      musicVolume: 0.45,
      // Choosing a new primary teller keeps an active comparison unless that
      // would make the pair meaningless — consensus is the union already, and
      // a teller cannot be read against itself. Both fail closed to one lens.
      setLens: (lens) =>
        set((state) => ({
          lens,
          compareWith:
            lens === 'consensus' || lens === state.compareWith ? null : state.compareWith,
        })),
      setComparison: (primary, secondary) =>
        set(
          primary === secondary
            ? { lens: primary, compareWith: null }
            : { lens: primary, compareWith: secondary },
        ),
      swapComparison: () =>
        set((state) =>
          state.compareWith && state.lens !== 'consensus'
            ? { lens: state.compareWith, compareWith: state.lens }
            : {},
        ),
      clearComparison: () => set({ compareWith: null }),
      // "Follow this telling" — leave the comparison into one teller's reading,
      // from either side of the pair (§5.1). The focused topic survives: the
      // visitor is still on the same question, just no longer holding two
      // answers side by side.
      followTeller: (source) => set({ lens: source, compareWith: null }),
      focusTopic: (focusedTopic) => set({ focusedTopic }),
      setHovered: (hoveredId) => set({ hoveredId }),
      select: (selectedId) =>
        set({ selectedId, hoveredId: null, isDiving: false, focusPoint: null, focusDistance: null }),
      selectAt: (selectedId, focusPoint, focusDistance = null) =>
        set({ selectedId, hoveredId: null, isDiving: false, focusPoint, focusDistance }),
      setSkyFocus: (skyFocus) => set({ skyFocus }),
      setDiving: (isDiving) => set({ isDiving }),
      setSearchOpen: (searchOpen) =>
        set((state) => ({
          searchOpen,
          settingsOpen: searchOpen ? false : state.settingsOpen,
        })),
      setSettingsOpen: (settingsOpen) =>
        set((state) => ({
          settingsOpen,
          searchOpen: settingsOpen ? false : state.searchOpen,
        })),
      setSpacingScale: (spacingScale) => set({ spacingScale }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
    }),
    {
      name: 'icarus-atlas',
      storage: createJSONStorage(() => localStorage),
      // Only the audio preferences survive reloads — selection/lens stay fresh.
      partialize: (state) => ({
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
      }),
    },
  ),
);
