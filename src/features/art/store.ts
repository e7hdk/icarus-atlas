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
  setSaga: (saga: SagaId | null) => void;
  setPeekSaga: (saga: SagaId | null) => void;
  setMedium: (medium: Medium | null) => void;
  setHover: (hover: LoomState['hover']) => void;
}

/** Saga and medium intersect; a dimmed tile sinks into the warp but stays in place. */
export function isDimmed(work: LoomWork, filters: Pick<LoomState, 'saga' | 'peekSaga' | 'medium'>): boolean {
  const shown = filters.peekSaga ?? filters.saga;
  return Boolean((shown && work.saga !== shown) || (filters.medium && work.medium !== filters.medium));
}

/** Filters and hover, shared by the scene and the 2D layers above it. */
export const useLoomStore = create<LoomState>((set) => ({
  saga: null,
  peekSaga: null,
  medium: null,
  hover: null,
  setSaga: (saga) => set({ saga }),
  setPeekSaga: (peekSaga) => set({ peekSaga }),
  setMedium: (medium) => set({ medium }),
  setHover: (hover) => set({ hover }),
}));
