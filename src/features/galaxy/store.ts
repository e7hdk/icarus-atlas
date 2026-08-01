import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LensId } from '@/types/character';

interface GalaxyState {
  /** Active source lens. The selector UI lives in atlas settings. */
  lens: LensId;
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
      setLens: (lens) => set({ lens }),
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
