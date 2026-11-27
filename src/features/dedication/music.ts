/** The music a gift is performed to.
 *
 *  The whole track is fetched while the door still asks its question, and
 *  played from memory. The atlas's host serves a file whole and answers no
 *  byte range, and a browser that streams such a file cannot seek in it (a
 *  step forward restarts the track), and a phone may refuse to play it at all.
 *  From memory, the track seeks anywhere and asks nothing more of the host.
 *
 *  A phone also lets a sound begin outside a touch only on an element that a
 *  touch has already started once, and the gift opens a moment after the last
 *  digit is typed, not inside the keystroke. So the first touch or key on the
 *  page plays the element a breath of silence (`bless`), and the track may be
 *  put on it and started later. */

/** Why the music did not start: the browser wants a touch first, or the track could not be had. */
export type MusicRefusal = 'refused' | 'lost';

/** A twentieth of a second of silence, as a WAV in memory. */
function silence(): string {
  const samples = 400;
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const text = (at: number, value: string) => {
    for (let index = 0; index < value.length; index++) view.setUint8(at + index, value.charCodeAt(index));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // one channel
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, 'data');
  view.setUint32(40, samples, true);
  new Uint8Array(buffer, 44).fill(128);
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

/** The track, whole; a failed fetch is tried twice more. */
async function fetchTrack(src: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`${src} unavailable (${response.status})`);
      const blob = await response.blob();
      return URL.createObjectURL(blob.type.startsWith('audio/') ? blob : new Blob([blob], { type: 'audio/mpeg' }));
    } catch (error) {
      if (attempt >= 2) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
}

export class GiftMusic {
  readonly audio = new Audio();
  private readonly hush = silence();
  private readonly loaded: Promise<string>;
  /** The track's address in memory, once the element plays it. */
  private track: string | null = null;
  private blessed = false;
  private fading = 0;
  private gone = false;

  constructor(
    src: string,
    private readonly volume: number,
  ) {
    this.audio.src = this.hush;
    this.audio.volume = volume;
    this.loaded = fetchTrack(src);
    // Reported by `start`, to whoever asks for the music.
    this.loaded.catch(() => {});
  }

  /** Call inside a touch or a key press, before the gift opens. */
  bless(): void {
    if (this.blessed || this.track) return;
    this.blessed = true;
    const audio = this.audio;
    audio.muted = true;
    audio.play().then(
      () => {
        if (this.track) return;
        audio.pause();
        audio.muted = false;
      },
      () => {
        audio.muted = false;
        this.blessed = false;
      },
    );
  }

  /** Starts the track at second `at()` of it, read at the moment it is ready
   *  to sound: a show that did not wait for a slow download is joined where it
   *  has got to. Resolves once it sounds; rejects with a MusicRefusal. */
  async start(at: () => number): Promise<void> {
    let url: string;
    try {
      url = await this.loaded;
    } catch {
      throw 'lost' satisfies MusicRefusal;
    }
    if (this.gone) throw 'lost' satisfies MusicRefusal;
    const audio = this.audio;
    window.clearInterval(this.fading);
    if (this.track !== url) {
      this.track = url;
      audio.pause();
      audio.src = url;
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(), { once: true });
        audio.addEventListener('error', () => reject(new Error('undecodable')), { once: true });
      }).catch(() => {
        throw 'lost' satisfies MusicRefusal;
      });
    }
    audio.muted = false;
    audio.volume = this.volume;
    audio.currentTime = Math.min(Math.max(0, at()), Math.max(0, audio.duration - 0.05));
    try {
      await audio.play();
    } catch {
      throw 'refused' satisfies MusicRefusal;
    }
  }

  pause(): void {
    this.audio.pause();
  }

  resume(): void {
    if (!this.track || this.audio.ended) return;
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
    this.gone = true;
    window.clearInterval(this.fading);
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    URL.revokeObjectURL(this.hush);
    void this.loaded.then(
      (url) => URL.revokeObjectURL(url),
      () => {},
    );
  }
}
