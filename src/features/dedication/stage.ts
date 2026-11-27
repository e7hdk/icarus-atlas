/** What a performance holds over the sky, read by the renderer every frame.
 *  Plain values, not React state: a performance changes them at 60 Hz and
 *  nothing should re-render for it. With `active` false the galaxy draws as it
 *  always has and none of this is read. */

/** The light an unlit star keeps in a reading of the sky (First, Chaos). */
export const READING_FLOOR = 0.07;

export const stage = {
  active: false,
  /** The light an unlit star keeps: 0 is out, 1 as bright as a lit one. */
  floor: READING_FLOOR,
  /** How dark the backdrop (dome, field stars, nebula) is drawn: 0 as it is, 1 black. */
  veil: 0,
  /** The brightness of single stars, as a multiple of their own. */
  gains: new Map<string, number>(),
  /** Seconds into the performance. */
  time: 0,
};

export function resetStage(): void {
  stage.active = false;
  stage.floor = READING_FLOOR;
  stage.veil = 0;
  stage.gains.clear();
  stage.time = 0;
}
