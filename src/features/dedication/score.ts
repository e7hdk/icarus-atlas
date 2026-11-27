import { z } from 'zod';

/** The score of a gift: a poem, the track that says when each of its lines is
 *  spoken, and the cues that say what the sky does meanwhile. A score is
 *  written by hand (ScoreBuilder), sealed (seal.ts) and performed by the
 *  Director; the atlas itself ships no score in the clear.
 *
 *  A star set names stars by id or by a token the stage resolves against the
 *  sky: `@all`, `@muses`, `@type:<type>`, `@cluster:<name>`.
 *  A line of the poem may name a star: `[[zeus|Zeus]]` is written `Zeus`, in
 *  that star's colour. */

const starSet = z.array(z.string().min(1));
const at = { t: z.number().min(0) };

const litCue = z.object({
  ...at,
  kind: z.literal('lit'),
  /** `set` leaves only these alight; `add` and `remove` change them alone. */
  op: z.enum(['set', 'add', 'remove']),
  stars: starSet,
  except: starSet.optional(),
  /** Seconds the change takes, star after star; 0 or absent is at once. */
  over: z.number().min(0).optional(),
  /** The order they go in: as given, or by distance from `from` (default: the gift's star). */
  order: z.enum(['given', 'near', 'far', 'random']).optional(),
  from: z.string().optional(),
});

const levelCue = z.object({
  ...at,
  kind: z.literal('level'),
  /** `floor`: the light an unlit star keeps. `veil`: how dark the backdrop is drawn. */
  what: z.enum(['floor', 'veil']),
  to: z.number().min(0).max(1),
  over: z.number().min(0),
});

const gainCue = z.object({
  ...at,
  kind: z.literal('gain'),
  star: z.string(),
  /** A multiple of the star's own light; 1 is as it is. */
  to: z.number().min(0),
  over: z.number().min(0),
});

const pulseCue = z.object({
  ...at,
  kind: z.literal('pulse'),
  /** The stars that beat together. */
  stars: starSet,
  except: starSet.optional(),
  until: z.number(),
  /** Beats a second, and how much of its light a beat adds. */
  rate: z.number().positive(),
  depth: z.number().min(0),
  /** `heart`: two quick strokes a beat. `heave`: one long pull and a letting go. */
  shape: z.enum(['heart', 'heave']).optional(),
});

const threadsCue = z.object({
  ...at,
  kind: z.literal('threads'),
  /** The relation lines drawn from now on, `accent` ones in gold. */
  relations: z.array(z.string()),
  accent: z.array(z.string()).optional(),
});

const shotCue = z.object({
  ...at,
  kind: z.literal('shot'),
  /** What the camera looks at: the whole disc, or the middle of these stars. */
  focus: z.union([z.literal('home'), starSet]),
  except: starSet.optional(),
  /** World units from the focus; absent, the stars are fitted, `fit` their margin. */
  distance: z.number().positive().optional(),
  fit: z.number().positive().optional(),
  /** Degrees round the focus from its outward side, and above the disc. */
  azimuth: z.number().optional(),
  elevation: z.number().optional(),
  /** Seconds the move takes to settle; `jump` cuts instead. */
  ease: z.number().positive().optional(),
  jump: z.boolean().optional(),
  /** Degrees a second the camera goes on turning round its focus. */
  drift: z.number().optional(),
  /** The focus moved by this much of the world before the camera is placed. */
  shift: z.tuple([z.number(), z.number(), z.number()]).optional(),
  /** How far above the middle of the screen the focus sits, as a fraction of
   *  the camera's distance; absent, a tenth (the words keep the lower third). */
  lift: z.number().optional(),
});

const pieceCue = z.object({
  ...at,
  kind: z.literal('piece'),
  /** A set piece drawn in the sky between `t` and `until`. */
  piece: z.string().min(1),
  until: z.number(),
  stars: starSet.optional(),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
});

export const cueSchema = z.discriminatedUnion('kind', [litCue, levelCue, gainCue, pulseCue, threadsCue, shotCue, pieceCue]);

export const giftSchema = z.object({
  v: z.literal(1),
  /** The star the gift belongs to. */
  star: z.string().min(1),
  title: z.string(),
  signature: z.string().optional(),
  /** The poem, line by line, with its star names marked. */
  poem: z.array(z.string().min(1)).min(1),
  /** When each line is spoken: `n` is its index in the poem, null a silence. */
  track: z.array(z.object({ t: z.number().min(0), n: z.number().int().min(0).nullable() })).min(1),
  /** Where the movements begin, for the thread of progress. */
  marks: z.array(z.number().min(0)),
  cues: z.array(cueSchema),
  /** Seconds the performance lasts. */
  end: z.number().positive(),
  /** What the poem echoes, by its lines (1-based, inclusive). */
  notes: z.array(
    z.object({ from: z.number().int().min(1), to: z.number().int().min(1), text: z.string().min(1), cite: z.string().min(1), href: z.string().optional() }),
  ),
});

export type Cue = z.infer<typeof cueSchema>;
export type LitCue = z.infer<typeof litCue>;
export type ShotCue = z.infer<typeof shotCue>;
export type PieceCue = z.infer<typeof pieceCue>;
export type GiftScore = z.infer<typeof giftSchema>;
export type GiftNote = GiftScore['notes'][number];

/** A piece of a line: plain words, or the name of a star. */
export interface LineSpan {
  text: string;
  ref?: string;
}

const NAME = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;

export function lineSpans(line: string): LineSpan[] {
  const spans: LineSpan[] = [];
  let last = 0;
  for (const match of line.matchAll(NAME)) {
    if (match.index > last) spans.push({ text: line.slice(last, match.index) });
    spans.push({ text: match[2], ref: match[1] });
    last = match.index + match[0].length;
  }
  if (last < line.length) spans.push({ text: line.slice(last) });
  return spans;
}

/** The line as it is read, its marks gone. */
export const plainLine = (line: string): string => line.replace(NAME, '$2');

type Timeless<T> = T extends unknown ? Omit<T, 't'> : never;
type Spanless<T> = T extends unknown ? Omit<T, 't' | 'until'> : never;

/** Seconds a line is given: a short one a little over three, a long one five. */
const pace = (plain: string): number => Math.min(5.4, Math.max(3.3, 2.3 + 0.047 * plain.length));

/** Writes a score in the order it is performed: cues fall at the present
 *  moment, and a line moves the moment on by the time it takes to read. */
export class ScoreBuilder {
  private now = 0;
  private rate = 1;
  private readonly poem: string[] = [];
  private readonly track: GiftScore['track'] = [];
  private readonly marks: number[] = [];
  private readonly cues: Cue[] = [];

  /** The present moment, in seconds. */
  get t(): number {
    return this.now;
  }

  /** From here on a line takes this multiple of its reading time. A score is
   *  fitted to its music stretch by stretch; holds and rests keep their length. */
  tempo(rate: number): this {
    this.rate = rate;
    return this;
  }

  /** A movement begins here. */
  mark(): this {
    this.marks.push(this.now);
    return this;
  }

  /** Time passes with nothing said: the line on screen stays. */
  rest(seconds: number): this {
    this.now += seconds;
    return this;
  }

  /** The words leave the screen; time passes. */
  hush(seconds: number): this {
    this.track.push({ t: this.now, n: null });
    this.now += seconds;
    return this;
  }

  /** The next line of the poem, held `hold` seconds longer than its reading. */
  line(text: string, hold = 0): this {
    this.track.push({ t: this.now, n: this.poem.length });
    this.poem.push(text);
    this.now += pace(plainLine(text)) * this.rate + hold;
    return this;
  }

  /** A cue at the present moment, moved by `shift` seconds. */
  cue(cue: Timeless<Exclude<Cue, { until: number }>>, shift = 0): this {
    this.cues.push({ ...cue, t: Math.max(0, this.now + shift) } as Cue);
    return this;
  }

  /** A cue at a moment already passed or noted: `t` is a value of `this.t`. */
  at(t: number, cue: Timeless<Exclude<Cue, { until: number }>>): this {
    this.cues.push({ ...cue, t } as Cue);
    return this;
  }

  /** A cue that has lasted from `start` (a value of `this.t`) until the present moment. */
  since(start: number, cue: Spanless<Extract<Cue, { until: number }>>): this {
    this.cues.push({ ...cue, t: start, until: this.now } as Cue);
    return this;
  }

  /** A cue that lasts from `start` to `end`, both values of `this.t` (or sums with it). */
  between(start: number, end: number, cue: Spanless<Extract<Cue, { until: number }>>): this {
    this.cues.push({ ...cue, t: start, until: end } as Cue);
    return this;
  }

  /** A cue that lasts `length` seconds from the present moment (moved by `shift`). */
  span(cue: Spanless<Extract<Cue, { until: number }>>, length: number, shift = 0): this {
    const t = Math.max(0, this.now + shift);
    this.cues.push({ ...cue, t, until: t + length } as Cue);
    return this;
  }

  build(meta: Pick<GiftScore, 'star' | 'title' | 'signature' | 'notes'>): GiftScore {
    return giftSchema.parse({
      v: 1,
      ...meta,
      poem: this.poem,
      track: this.track,
      marks: this.marks,
      cues: [...this.cues].sort((a, b) => a.t - b.t),
      end: this.now,
    });
  }
}
