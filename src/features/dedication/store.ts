import { create } from 'zustand';

/** What the door's page and its stage share. The Director runs inside the
 *  canvas and the words are drawn outside it: this is where they meet. */
interface DoorState {
  /** The stage owns the screen: the atlas bar steps aside. */
  curtain: boolean;
  /** The performance is running, not held. */
  playing: boolean;
  /** The entry of the score's track being spoken, -1 before the first. */
  spoken: number;
  /** The performance has reached its end. */
  ended: boolean;
  setCurtain: (curtain: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setSpoken: (spoken: number) => void;
  setEnded: (ended: boolean) => void;
}

export const useDoorStore = create<DoorState>()((set) => ({
  curtain: false,
  playing: false,
  spoken: -1,
  ended: false,
  setCurtain: (curtain) => set({ curtain }),
  setPlaying: (playing) => set({ playing }),
  setSpoken: (spoken) => set({ spoken }),
  setEnded: (ended) => set({ ended }),
}));
