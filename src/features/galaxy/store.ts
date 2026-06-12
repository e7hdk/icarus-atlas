import { create } from 'zustand';
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
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  lens: 'consensus',
  hoveredId: null,
  selectedId: null,
  isDiving: false,
  searchOpen: false,
  settingsOpen: false,
  spacingScale: 3.0,
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
}));
