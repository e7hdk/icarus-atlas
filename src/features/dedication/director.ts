import * as THREE from 'three';
import { HOME_POSITION, HOME_TARGET, OVERVIEW_FIT } from '@/components/galaxy/CameraRig';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore, type CameraShot } from '@/features/galaxy/store';
import { hashString, mulberry32 } from '@/lib/prng';
import { MUSE_IDS, type SkyCharacter } from '@/types/character';
import type { GiftScore, LitCue, PieceCue, ShotCue } from './score';
import { stage } from './stage';

/** Performs a score on the sky. The Director holds no clock: given a second of
 *  the performance it brings the sky to that second's state, so a pause, a leap
 *  forward and a step back are all the same call. Lights are applied as events
 *  in order (a step back replays them from the start, a few thousand set
 *  operations); the levels, the gains and the camera are read off the time. */

export interface StageSky {
  characters: SkyCharacter[];
  positions: Map<string, Vec3>;
  /** P95 of the stars' planar radius (discRadiusOf). */
  discRadius: number;
  /** Width over height of the screen. */
  aspect: number;
}

/** The galaxy camera's vertical field of view, in degrees (GalaxyCanvas). */
const FOV = 50;
const RAD = Math.PI / 180;
const NO_LINES: string[] = [];

/** Stars by id, or by a token resolved against the sky. */
export function resolveStars(sky: StageSky, refs: string[], except: string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    if (seen.has(id) || !sky.positions.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  for (const ref of refs) {
    if (ref === '@all') sky.characters.forEach((character) => push(character.id));
    else if (ref === '@muses') MUSE_IDS.forEach(push);
    else if (ref.startsWith('@type:')) sky.characters.filter((character) => character.type === ref.slice(6)).forEach((character) => push(character.id));
    else if (ref.startsWith('@cluster:')) sky.characters.filter((character) => character.cluster === ref.slice(9)).forEach((character) => push(character.id));
    else push(ref);
  }
  if (except.length === 0) return out;
  const dropped = new Set(resolveStars(sky, except));
  return out.filter((id) => !dropped.has(id));
}

interface LightEvent {
  t: number;
  /** `keep` puts out every star but these; the rest change these alone. */
  op: 'keep' | 'add' | 'remove';
  ids: string[];
}

/** A change of light as events: at once, or star after star over `over` seconds. */
function lightEvents(cue: LitCue, sky: StageSky, home: string): LightEvent[] {
  let ids = resolveStars(sky, cue.stars, cue.except);
  const events: LightEvent[] = [];
  if (cue.op === 'set') events.push({ t: cue.t, op: 'keep', ids });
  const op = cue.op === 'remove' ? 'remove' : 'add';
  const over = cue.over ?? 0;
  if (over <= 0 || ids.length < 2) {
    events.push({ t: cue.t, op, ids });
    return events;
  }

  // When each star goes: by its distance from the origin (a wave that travels
  // at one speed), or evenly in the order given or drawn.
  const order = cue.order ?? 'given';
  let fractions: number[];
  if (order === 'near' || order === 'far') {
    const origin = sky.positions.get(cue.from ?? home) ?? [0, 0, 0];
    const distance = new Map(
      ids.map((id) => {
        const [x, y, z] = sky.positions.get(id)!;
        return [id, Math.hypot(x - origin[0], y - origin[1], z - origin[2])] as const;
      }),
    );
    ids = [...ids].sort((a, b) => distance.get(a)! - distance.get(b)!);
    const nearest = distance.get(ids[0])!;
    const reach = Math.max(1e-6, distance.get(ids[ids.length - 1])! - nearest);
    fractions = ids.map((id) => (distance.get(id)! - nearest) / reach);
    if (order === 'far') fractions = fractions.map((fraction) => 1 - fraction);
  } else {
    if (order === 'random') {
      const random = mulberry32(hashString(`${cue.t}:${ids.length}`));
      ids = [...ids];
      for (let index = ids.length - 1; index > 0; index--) {
        const other = Math.floor(random() * (index + 1));
        [ids[index], ids[other]] = [ids[other], ids[index]];
      }
    }
    fractions = ids.map((_, index) => index / (ids.length - 1));
  }

  // One event a frame at most, however many stars share it.
  const frames = new Map<number, string[]>();
  ids.forEach((id, index) => {
    const frame = Math.round((cue.t + over * fractions[index]) * 60);
    const batch = frames.get(frame);
    if (batch) batch.push(id);
    else frames.set(frame, [id]);
  });
  for (const [frame, batch] of frames) events.push({ t: frame / 60, op, ids: batch });
  return events;
}

/** A value that moves from key to key, easing over each key's span. */
class Channel {
  private readonly keys: { t: number; over: number; from: number; to: number }[] = [];

  constructor(private readonly rest: number) {}

  /** Keys are added in the order of their times. */
  add(t: number, to: number, over: number): void {
    this.keys.push({ t, over, from: this.at(t), to });
  }

  at(t: number): number {
    let key: (typeof this.keys)[number] | undefined;
    for (const candidate of this.keys) {
      if (candidate.t > t) break;
      key = candidate;
    }
    if (!key) return this.rest;
    if (key.over <= 0) return key.to;
    const progress = Math.min(1, (t - key.t) / key.over);
    return key.from + (key.to - key.from) * progress * progress * (3 - 2 * progress);
  }
}

/** A heart's two strokes in one beat, each a short swell of light. */
export function heartbeat(beats: number): number {
  const phase = beats - Math.floor(beats);
  const stroke = (centre: number, width: number) => Math.exp(-(((phase - centre) / width) ** 2));
  return stroke(0.09, 0.05) + 0.6 * stroke(0.31, 0.06);
}

/** One long pull and a letting go: the light swells through most of the beat, then drops. */
export function heave(beats: number): number {
  const phase = beats - Math.floor(beats);
  return phase < 0.72 ? Math.sin((Math.PI * phase) / 0.72) ** 2 : 0;
}

/** Where the camera stands for a shot. The focus sits a little above the
 *  middle of the screen, so the words below it have the lower third. */
export function resolveShot(cue: ShotCue, sky: StageSky): CameraShot {
  const portrait = sky.aspect < 1;
  const vertical = (FOV / 2) * RAD;
  const horizontal = Math.atan(Math.tan(vertical) * sky.aspect);
  const lift = cue.lift ?? (portrait ? 0.15 : 0.1);
  const up = new THREE.Vector3(0, 1, 0);
  let centre: THREE.Vector3;
  let outward: THREE.Vector3;
  let distance: number;
  let elevation: number;
  let points: THREE.Vector3[] = [];

  if (cue.focus === 'home') {
    // The disc, fitted across the narrower side of the screen.
    centre = new THREE.Vector3(...HOME_TARGET);
    outward = new THREE.Vector3(HOME_POSITION[0], 0, HOME_POSITION[2]).normalize();
    elevation = cue.elevation !== undefined ? cue.elevation * RAD : Math.atan2(HOME_POSITION[1], Math.hypot(HOME_POSITION[0], HOME_POSITION[2]));
    distance = cue.distance ?? sky.discRadius * Math.max(OVERVIEW_FIT, (cue.fit ?? 0.72) / Math.tan(horizontal));
  } else {
    points = resolveStars(sky, cue.focus, cue.except).map((id) => new THREE.Vector3(...sky.positions.get(id)!));
    centre = points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(Math.max(1, points.length));
    if (cue.shift) centre.add(new THREE.Vector3(...cue.shift));
    outward = new THREE.Vector3(centre.x, 0, centre.z);
    if (outward.lengthSq() < 1) outward.set(1, 0, 1);
    outward.normalize();
    elevation = (cue.elevation ?? 22) * RAD;
    distance = 0;
  }

  outward.applyAxisAngle(up, (cue.azimuth ?? 0) * RAD);
  const away = outward.clone().multiplyScalar(Math.cos(elevation)).addScaledVector(up, Math.sin(elevation));
  // The camera's own axes: what lies across the screen, and what lies up it.
  const forward = away.clone().negate();
  const across = new THREE.Vector3().crossVectors(forward, up).normalize();
  const rise = new THREE.Vector3().crossVectors(across, forward).normalize();
  if (cue.focus !== 'home') {
    if (cue.distance !== undefined) {
      // A set distance is for a wide screen; a tall one stands a little further off.
      distance = cue.distance * (portrait ? 1.3 : 1);
    } else {
      // Fitted: far enough that the stars' reach across and up the screen both
      // fall inside it, the height less the letterbox and the words' third.
      let wide = 0;
      let tall = 0;
      let deep = 0;
      for (const point of points) {
        const offset = point.clone().sub(centre);
        wide = Math.max(wide, Math.abs(offset.dot(across)));
        tall = Math.max(tall, Math.abs(offset.dot(rise)));
        deep = Math.max(deep, offset.dot(away));
      }
      const needed = Math.max(wide / Math.tan(horizontal), tall / (Math.tan(vertical) * 0.62));
      distance = Math.max(28, needed * (cue.fit ?? 1.15) + deep + 10);
    }
  }
  const position = centre.clone().addScaledVector(away, distance);
  // Aim below the focus: along the camera's own up, so it holds at any elevation.
  const target = centre.clone().addScaledVector(rise, -lift * distance);

  return {
    position: [position.x, position.y, position.z],
    target: [target.x, target.y, target.z],
    ease: cue.ease ?? 1.8,
    jump: cue.jump,
    drift: cue.drift ? cue.drift * RAD : undefined,
  };
}

/** The index of the last entry at or before `t`, -1 when none is. */
function lastAt(entries: { t: number }[], t: number): number {
  let found = -1;
  for (let index = 0; index < entries.length; index++) {
    if (entries[index].t > t) break;
    found = index;
  }
  return found;
}

/** The performance's time: it runs while playing, and stops at the end. A
 *  show with music keeps the music's time, so a scene scored to a bar falls on
 *  that bar: while the music has not begun to sound, or has stalled, the sky
 *  waits for it; once it has ended, or where there is none, the show runs on
 *  its own. */
export class StageClock {
  time = 0;
  playing = false;
  private music: HTMLAudioElement | null = null;

  constructor(readonly end: number) {}

  /** The show keeps this music's time from now on; null gives it back its own. */
  follow(music: HTMLAudioElement | null): void {
    this.music = music;
  }

  /** Whether the show is keeping a music's time. */
  get following(): boolean {
    return this.music !== null;
  }

  /** A frame has passed. A long one (a tab that slept) counts as a tenth of a second. */
  tick(delta: number): void {
    if (!this.playing) return;
    const step = Math.min(delta, 0.1);
    const music = this.music;
    if (music && !music.ended && this.time < (Number.isFinite(music.duration) ? music.duration - 0.05 : Infinity)) {
      if (music.paused || music.readyState < 3) return;
      // Step with the frames, and lean toward the music: its own time comes in
      // coarser steps than a frame, and a leap in it is followed at once.
      const ahead = music.currentTime - this.time;
      this.time = Math.abs(ahead) > 0.3 ? music.currentTime : this.time + step + ahead * 0.08;
    } else {
      this.time += step;
    }
    this.time = Math.min(this.end, Math.max(0, this.time));
  }

  /** To second `t`, the music with it. */
  seek(t: number): void {
    this.time = Math.min(this.end, Math.max(0, t));
    const music = this.music;
    if (music && Number.isFinite(music.duration)) music.currentTime = Math.min(this.time, Math.max(0, music.duration - 0.05));
  }
}

/** A set piece of the score, its star set resolved. */
export type StagePiece = PieceCue & { ids: string[] };

/** A number among a piece's parameters, or the value it has when unset. */
export const pieceNumber = (piece: StagePiece, name: string, unset: number): number => {
  const value = piece.params?.[name];
  return typeof value === 'number' ? value : unset;
};

export class Director {
  /** The set pieces of the score, their star sets resolved. */
  readonly pieces: StagePiece[];

  private readonly events: LightEvent[];
  private readonly floor: Channel;
  private readonly veil = new Channel(0);
  private readonly gains = new Map<string, Channel>();
  private readonly pulses: { ids: string[]; t: number; until: number; rate: number; depth: number; heave: boolean }[] = [];
  private readonly threads: { t: number; relations: string[]; accent: string[] }[] = [];
  private readonly shots: { t: number; shot: CameraShot }[] = [];

  private lit: Set<string>;
  private eventAt = 0;
  private threadAt = -2;
  private shotAt = -2;
  private last = -1;

  /** `before` is the sky the performance begins from: what burns, and the floor. */
  constructor(
    private readonly score: GiftScore,
    sky: StageSky,
    private readonly before: { lit: string[]; floor: number },
  ) {
    this.lit = new Set(before.lit);
    this.floor = new Channel(before.floor);
    const events: LightEvent[] = [];
    const pieces: Director['pieces'] = [];
    for (const cue of score.cues) {
      if (cue.kind === 'lit') events.push(...lightEvents(cue, sky, score.star));
      else if (cue.kind === 'level') (cue.what === 'floor' ? this.floor : this.veil).add(cue.t, cue.to, cue.over);
      else if (cue.kind === 'gain') {
        let channel = this.gains.get(cue.star);
        if (!channel) this.gains.set(cue.star, (channel = new Channel(1)));
        channel.add(cue.t, cue.to, cue.over);
      } else if (cue.kind === 'pulse') {
        this.pulses.push({ ids: resolveStars(sky, cue.stars, cue.except), t: cue.t, until: cue.until, rate: cue.rate, depth: cue.depth, heave: cue.shape === 'heave' });
      }
      else if (cue.kind === 'threads') this.threads.push({ t: cue.t, relations: cue.relations, accent: cue.accent ?? NO_LINES });
      else if (cue.kind === 'shot') this.shots.push({ t: cue.t, shot: resolveShot(cue, sky) });
      else pieces.push({ ...cue, ids: cue.stars ? resolveStars(sky, cue.stars) : [] });
    }
    // Stable: events of one moment keep the order their cues were written in.
    this.events = events.map((event, index) => ({ event, index })).sort((a, b) => a.event.t - b.event.t || a.index - b.index).map(({ event }) => event);
    this.pieces = pieces;
  }

  /** Brings the sky to second `t`; `cut` has the camera jump there instead of flying. */
  frame(t: number, cut = false): void {
    const first = this.last < 0;
    const back = t < this.last;
    if (back) {
      this.lit = new Set(this.before.lit);
      this.eventAt = 0;
    }
    let changed = first || back;
    while (this.eventAt < this.events.length && this.events[this.eventAt].t <= t) {
      const event = this.events[this.eventAt++];
      if (event.op === 'keep') {
        const kept = new Set(event.ids);
        for (const id of this.lit) if (!kept.has(id)) this.lit.delete(id);
      } else if (event.op === 'add') for (const id of event.ids) this.lit.add(id);
      else for (const id of event.ids) this.lit.delete(id);
      changed = true;
    }
    const threadAt = lastAt(this.threads, t);
    if (threadAt !== this.threadAt) {
      this.threadAt = threadAt;
      changed = true;
    }
    if (changed) {
      const drawn = threadAt >= 0 ? this.threads[threadAt] : null;
      // The line arrays keep their identity between changes of light, so the
      // lines are not redrawn for every star that kindles.
      useGalaxyStore.getState().setLit({ stars: [...this.lit], relations: drawn?.relations ?? NO_LINES, accent: drawn?.accent ?? NO_LINES });
    }

    stage.floor = this.floor.at(t);
    stage.veil = this.veil.at(t);
    stage.gains.clear();
    for (const [star, channel] of this.gains) {
      const gain = channel.at(t);
      if (Math.abs(gain - 1) > 1e-3) stage.gains.set(star, gain);
    }
    for (const pulse of this.pulses) {
      if (t < pulse.t || t > pulse.until) continue;
      const swell = Math.min(1, (t - pulse.t) / 0.5, (pulse.until - t) / 0.5);
      const beats = (t - pulse.t) * pulse.rate;
      const beat = 1 + pulse.depth * swell * (pulse.heave ? heave(beats) : heartbeat(beats));
      for (const id of pulse.ids) stage.gains.set(id, (stage.gains.get(id) ?? 1) * beat);
    }

    const shotAt = lastAt(this.shots, t);
    if (shotAt >= 0 && (shotAt !== this.shotAt || cut)) {
      const { shot } = this.shots[shotAt];
      useGalaxyStore.getState().setShot({ ...shot, jump: cut || back || shot.jump });
    }
    this.shotAt = shotAt;

    stage.time = t;
    this.last = t;
  }

  /** The track entry spoken at `t`, -1 before the first. */
  spoken(t: number): number {
    return lastAt(this.score.track, t);
  }

  /** The times a step forward or back lands on: where each entry of the track begins. */
  step(t: number, by: 1 | -1): number {
    const at = lastAt(this.score.track, t);
    if (by > 0) return this.score.track[Math.min(this.score.track.length - 1, at + 1)].t;
    // A step back within a line's first second goes to the line before it.
    const here = at >= 0 ? this.score.track[at].t : 0;
    return t - here > 1 || at <= 0 ? here : this.score.track[at - 1].t;
  }
}
