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
  setLens: (lens: LensId) => void;
  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
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
      searchOpen: false,
      settingsOpen: false,
      spacingScale: 4.0,
      musicEnabled: true,
      musicVolume: 0.45,
      setLens: (lens) => set({ lens }),
      setHovered: (hoveredId) => set({ hoveredId }),
      select: (selectedId) => set({ selectedId, hoveredId: null, isDiving: false }),
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
