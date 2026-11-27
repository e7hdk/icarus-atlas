/** The music a gift is performed to: one audio element, loaded while the door
 *  still asks its question, so that it is ready when the answer comes.
 *
 *  A phone lets a sound begin outside a touch only on an element that a touch
 *  has already started once, and the gift opens a moment after the last digit
 *  is typed, not inside the keystroke. So the first touch or key on the page
 *  plays the element muted for an instant (`bless`), and the show may start it
 *  for real later. Where the browser still refuses, `start` rejects, and the
 *  show holds until the next touch. */
export class GiftMusic {
  readonly audio: HTMLAudioElement;
  private blessed = false;
  private fading = 0;

  constructor(
    src: string,
    private readonly volume: number,
  ) {
    this.audio = new Audio(src);
    this.audio.preload = 'auto';
    this.audio.volume = volume;
  }

  /** Call inside a touch or a key press, before the gift opens. */
  bless(): void {
    if (this.blessed || !this.audio.paused) return;
    this.blessed = true;
    const audio = this.audio;
    audio.muted = true;
    audio.play().then(
      () => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      },
      () => {
        audio.muted = false;
        this.blessed = false;
      },
    );
  }

  /** From the beginning. Rejects where the browser will not let it sound yet. */
  start(): Promise<void> {
    window.clearInterval(this.fading);
    this.audio.muted = false;
    this.audio.volume = this.volume;
    this.audio.currentTime = 0;
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    if (this.audio.ended) return;
    this.audio.volume = this.volume;
    void this.audio.play().catch(() => {});
  }

  /** Fades out and stops: a show left before its end. */
  stop(): void {
    const audio = this.audio;
    window.clearInterval(this.fading);
    const from = audio.volume;
    let step = 0;
    this.fading = window.setInterval(() => {
      step += 1;
      // A phone ignores the volume; there the pause at the end is the whole of it.
      audio.volume = Math.max(0, from * (1 - step / 12));
      if (step >= 12) {
        window.clearInterval(this.fading);
        audio.pause();
      }
    }, 40);
  }

  dispose(): void {
    window.clearInterval(this.fading);
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}
