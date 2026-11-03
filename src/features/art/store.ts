import { create } from 'zustand';
import type { LoomWork } from '@/features/art/door';
import type { SagaId } from '@/features/stories/sagas';
import type { Medium } from '@/types/art';

interface LoomState {
  /** A clay weight held down. */
  saga: SagaId | null;
  /** A clay weight under the pointer. */
  peekSaga: SagaId | null;
  medium: Medium | null;
  /** The tile under the pointer, and where the pointer is. */
  hover: { index: number; x: number; y: number } | null;
  /** The pulled work, held out of the cloth with its web. */
  focus: number | null;
  /** The one thread a pulled web is narrowed to. */
  only: number | null;
  /** A thread named in the rail, isolated while the pointer is on it. */
  peekThread: number | null;
  /** The cloth turned to its back, where its threads are. */
  face: boolean;
  setSaga: (saga: SagaId | null) => void;
  setPeekSaga: (saga: SagaId | null) => void;
  setMedium: (medium: Medium | null) => void;
  setHover: (hover: LoomState['hover']) => void;
  setWeb: (focus: number | null, only: number | null) => void;
  setPeekThread: (thread: number | null) => void;
  setFace: (face: boolean) => void;
}

/** Saga and medium intersect; a dimmed tile sinks into the warp but stays in place. */
export function isDimmed(work: LoomWork, filters: Pick<LoomState, 'saga' | 'peekSaga' | 'medium'>): boolean {
  const shown = filters.peekSaga ?? filters.saga;
  return Boolean((shown && work.saga !== shown) || (filters.medium && work.medium !== filters.medium));
}

/** Filters, hover and the web, shared by the scene and the 2D layers above it. The
 *  web's motion lives in `LoomWeb`; this holds what the controls show. */
export const useLoomStore = create<LoomState>((set) => ({
  saga: null,
  peekSaga: null,
  medium: null,
  hover: null,
  focus: null,
  only: null,
  peekThread: null,
  face: false,
  setSaga: (saga) => set({ saga }),
  setPeekSaga: (peekSaga) => set({ peekSaga }),
  setMedium: (medium) => set({ medium }),
  setHover: (hover) => set({ hover }),
  setWeb: (focus, only) => set({ focus, only, peekThread: null }),
  setPeekThread: (peekThread) => set({ peekThread }),
  setFace: (face) => set({ face }),
}));
