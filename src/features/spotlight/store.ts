import { create } from 'zustand';
import type { DayPick, EphemerisData } from '@/types/spotlight';

/** Client state of the Ephemeris. `data` arrives from the server host props;
 *  `pick` is only ever set after mount (the server never renders "today"),
 *  which is what keeps hydration clean by construction. The proem block
 *  drives the staged telling; `oracleOpen` and `riddleOpen` are the day's
 *  other two stages — the AtlasBar retracts while any stage is open. The
 *  riddle is the DEFAULT door to an unrevealed day (docs/EPHEMERIS_PLAN.md
 *  §11): no setting, the Sphinx simply asks first. */
interface EphemerisState {
  data: EphemerisData | null;
  pick: DayPick | null;
  cardOpen: boolean;
  proemActive: boolean;
  proemBeat: number;
  proemStep: number;
  spotlightRelationIds: string[];
  oracleOpen: boolean;
  riddleOpen: boolean;
  setData: (data: EphemerisData) => void;
  setPick: (pick: DayPick | null) => void;
  setCardOpen: (cardOpen: boolean) => void;
  startProem: () => void;
  setProemProgress: (beat: number, step: number, spotlight: string[]) => void;
  closeProem: () => void;
  setOracleOpen: (oracleOpen: boolean) => void;
  setRiddleOpen: (riddleOpen: boolean) => void;
}

export const useEphemerisStore = create<EphemerisState>()((set) => ({
  data: null,
  pick: null,
  cardOpen: false,
  proemActive: false,
  proemBeat: 0,
  proemStep: 0,
  spotlightRelationIds: [],
  oracleOpen: false,
  riddleOpen: false,
  setData: (data) => set({ data }),
  setPick: (pick) => set({ pick }),
  setCardOpen: (cardOpen) => set({ cardOpen }),
  startProem: () =>
    set({
      proemActive: true,
      proemBeat: 0,
      proemStep: 0,
      spotlightRelationIds: [],
      cardOpen: false,
      riddleOpen: false,
    }),
  setProemProgress: (proemBeat, proemStep, spotlightRelationIds) =>
    set({ proemBeat, proemStep, spotlightRelationIds }),
  closeProem: () => set({ proemActive: false, spotlightRelationIds: [] }),
  setOracleOpen: (oracleOpen) => set({ oracleOpen }),
  setRiddleOpen: (riddleOpen) => set({ riddleOpen, ...(riddleOpen ? { cardOpen: false } : {}) }),
}));
