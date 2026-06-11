import { create } from 'zustand';
import type { LensId } from '@/types/character';

interface GalaxyState {
  /** Active source lens. The lens selector UI lands in M2; data is lens-aware already. */
  lens: LensId;
  hoveredId: string | null;
  selectedId: string | null;
  isDiving: boolean;
  setLens: (lens: LensId) => void;
  setHovered: (id: string | null) => void;
  select: (id: string | null) => void;
  setDiving: (isDiving: boolean) => void;
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  lens: 'consensus',
  hoveredId: null,
  selectedId: null,
  isDiving: false,
  setLens: (lens) => set({ lens }),
  setHovered: (hoveredId) => set({ hoveredId }),
  select: (selectedId) => set({ selectedId, hoveredId: null, isDiving: false }),
  setDiving: (isDiving) => set({ isDiving }),
}));
