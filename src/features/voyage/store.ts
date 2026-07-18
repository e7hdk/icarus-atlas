import { create } from 'zustand';
import type { VoyageMood } from '@/types/story';

/** Voyage audio state (docs/NOSTOS_PLAN.md §8, M13.4): while the voyage is
 *  active the global atlas bed ducks out and the mood-stem mixer takes over;
 *  the current station's mood drives which stem plays. Not persisted — the
 *  state lives and dies with the /odyssey route. */
interface VoyageAudioState {
  /** True while /odyssey is mounted — AmbientAudio ducks the atlas bed. */
  active: boolean;
  /** Mood of the station under the reading line (null when inactive). */
  mood: VoyageMood | null;
  setActive: (active: boolean) => void;
  setMood: (mood: VoyageMood | null) => void;
}

export const useVoyageAudioStore = create<VoyageAudioState>()((set) => ({
  active: false,
  mood: null,
  setActive: (active) => set({ active }),
  setMood: (mood) => set({ mood }),
}));
