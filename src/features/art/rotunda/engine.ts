import * as THREE from 'three';
import type { LoomDoor } from '@/features/art/door';
import { SAGA_LABEL, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import { Drum, clamp, lerp, smooth, unwrapNear } from './drum';
import { createLineLayer, pushArc, setLines, stitchesOnBack, type LineLayer } from './lines';
import { buildRoom } from './room';
import { FINE_FS, LIFT_FS, LIFT_VS, PLAIN_VS } from './shaders';
import { Sharpener, type Cloth } from './sharpen';
import {
  SAGA_COLOR,
  clothBands,
  createCellTexture,
  createClothTexture,
  createTearTexture,
  paintCloth,
  type FullSheets,
  type Sheets,
} from './textures';
import { RotundaWeb } from './web';

/** The Loom as a rotunda (docs/LOOM_PLAN.md §12): the door's cloth hangs flat, or
 *  closes into a drum round the visitor. Across it the sagas go round in Spindle order;
 *  down it the centuries fall from the beam to the clay weights. */

export type RotundaMode = 'flat' | 'entering' | 'inside' | 'leaving' | 'turning' | 'outside';

/** The lens's range inside, in degrees of vertical field. */
export const LENS = { min: 14, max: 60 } as const;
/** Inside, the visitor stands on the axis with the widest lens; standing back, across the
 *  room from the wall they face with a long one. */
export const STANCE_LENS = { centre: 60, back: 24 } as const;

const FLAT_FOV = 34;
const OUTSIDE_FOV = 46;
const CURL_SECONDS = 2.9;
const UNCURL_SECONDS = 2.6;
const TURN_SECONDS = 2.3;
const REDUCED_SECONDS = 0.35;
/** The fell, the gold edge of the weaving, crosses the cloth this fast on the first visit. */
const FELL_SECONDS = 1.6;

const SAGA_NAME: Record<SagaId, string> = { ...SAGA_LABEL, heroic: 'Other tales' };

interface Pose {
  B: number;
  back: number;
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  fov: number;
  d?: number;
  y?: number;
}

interface Tween {
  from: Pose;
  to: Pose;
  t: number;
  dur: number;
  kind: 'curl' | 'turn';
  done?: () => void;
}

export interface RotundaPick {
  /** A work on the cloth or in the air, or -1. */
  work: number;
  lifted: boolean;
  /** A clay weight's saga, or null. */
  saga: SagaId | null;
}

export interface RotundaOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  door: LoomDoor;
  sheets: Sheets;
  width: number;
  height: number;
  /** What the door's chrome covers at each edge of the view, in CSS pixels. */
  insets?: { top: number; right: number; bottom: number; left: number };
  lens: number;
  centre: boolean;
  /** The weaving falls into place on the first visit of a session. */
  reveal: boolean;
  reduceMotion: boolean;
  saveData: boolean;
  onMode: (mode: RotundaMode) => void;
  onHover: (work: number, saga: SagaId | null) => void;
  onReadout: (label: string, sub: string) => void;
  /** The held work and the one thread it is narrowed to, as the door's store keeps them. */
  onWeb: (focus: number | null, along: number | null) => void;
  /** The Pattern shown, or none. */
  onPattern: (pattern: number | null) => void;
}

export class Rotunda {
  readonly drum: Drum;
  readonly web: RotundaWeb;
  private readonly o: RotundaOptions;
  private readonly sharpener: Sharpener;
  private readonly room: ReturnType<typeof buildRoom>;
  /** The cloth's own canvas and texture: from the low-quality sheet at first, at its full
   *  resolution once the full sheets have landed and the opening fall is over. */
  private cloth: Cloth;
  private readonly fullCell: number;
  private readonly anisotropy: number;
  private sheets: Sheets;
  private pendingFull: FullSheets | null = null;
  private readonly cells: ReturnType<typeof createCellTexture>;
  private readonly clothUniforms: Record<string, THREE.IUniform>;
  private readonly tear: THREE.Texture;
  private readonly lines: { web: LineLayer; pattern: LineLayer; back: LineLayer; backHot: LineLayer };
  private readonly bright: Float32Array;
  private readonly brightGoal: Float32Array;
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly templates: THREE.Material[] = [];
  private view = { width: 1, height: 1 };
  /** What the door's chrome covers at each edge of the view, in CSS pixels. */
  private insets = { top: 0, right: 0, bottom: 0, left: 0 };
  private stateMode: RotundaMode = 'flat';
  private tween: Tween | null = null;
  private pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private fov = FLAT_FOV;
  private yawGoal = 0;
  private pitchGoal = 0;
  private homeD: number;
  private d: number;
  private y = 0;
  private dGoal: number;
  private yGoal = 0;
  private lens: number;
  private readonly orbit: { yaw: number; el: number; dist: number; yawGoal: number; elGoal: number; distGoal: number };
  private back = 0;
  private weaveFlat = 0.6;
  private fell: number;
  private sharpClock = 0;
  private readClock = 0;
  private backCentre: number | null = null;
  private pattern = -1;
  private patternLit = new Set<number>();
  private dimmed: (index: number) => boolean = () => false;
  private sagaShown = -1;
  private hover = -1;
  private hoverSaga: SagaId | null = null;
  private hoverBack = -1;
  private readout = '';
  /** Where the pointer is over the view, in CSS pixels, or null. */
  private pointer: { x: number; y: number } | null = null;
  /** No hover while a drag is under way. */
  private dragging = false;

  constructor(options: RotundaOptions) {
    this.o = options;
    const { renderer, scene, camera, door, sheets } = options;
    const drum = new Drum(door.layout.width, door.layout.height);
    this.drum = drum;
    this.view = { width: options.width, height: options.height };
    if (options.insets) this.insets = options.insets;
    this.homeD = options.centre ? 0 : drum.R - 2.6;
    this.d = this.dGoal = this.homeD;
    this.lens = clamp(Math.round(options.lens), LENS.min, LENS.max);
    this.orbit = { yaw: 0, el: 0.42, dist: 3.1 * drum.R, yawGoal: 0, elGoal: 0.42, distGoal: 3.1 * drum.R };
    this.fell = options.reveal && !options.reduceMotion ? 0 : drum.H + 1;
    camera.near = 0.05;
    camera.far = 5000;

    // A cell is 64 texels where the screen is, and up to 112 on a dense one, where the
    // cloth's own pixels would otherwise show from the middle of the room. The first
    // cloth is woven at the low-quality sheet's own 24, small enough to show at once.
    const dense = renderer.getPixelRatio() >= 1.5;
    this.fullCell = Math.min(dense ? 112 : 64, Math.floor(renderer.capabilities.maxTextureSize / Math.max(drum.W, drum.H)));
    this.anisotropy = renderer.capabilities.getMaxAnisotropy();
    this.sheets = sheets;
    const cell = sheets.full ? this.fullCell : door.sheet.lqCell;
    this.cloth = { ...createClothTexture(drum, cell, this.anisotropy), cell };
    const bands = clothBands(door);
    this.cells = createCellTexture(door, bands);
    this.tear = createTearTexture(door, drum);
    this.bright = new Float32Array(door.works.length).fill(1);
    this.brightGoal = new Float32Array(door.works.length).fill(1);
    this.clothUniforms = {
      ...drum.U,
      uTex: { value: this.cloth.texture },
      uCells: { value: this.cells.texture },
      uCrack: { value: this.tear },
      uGrid: { value: new THREE.Vector2(drum.W, drum.H) },
      uWeave: { value: 0.6 },
      uFell: { value: this.fell > drum.H ? 1e4 : 0 },
    };
    this.room = buildRoom(scene, drum, bands, this.clothUniforms);
    this.lines = {
      web: createLineLayer(scene, 2.6, 0.95),
      pattern: createLineLayer(scene, 3.2, 1),
      back: createLineLayer(scene, 1.1, 0.22),
      backHot: createLineLayer(scene, 2.6, 1),
    };
    this.sharpener = new Sharpener({
      renderer,
      scene,
      camera,
      drum,
      door,
      cloth: this.cloth,
      budget: dense ? 24e6 : 12e6,
      saveData: options.saveData,
      isLifted: (index) => this.web.lifted.has(index),
      phase: () => ({ inside: this.stateMode === 'inside', outside: this.stateMode === 'outside', moving: this.tween !== null }),
      viewHeight: () => this.view.height,
    });
    this.web = new RotundaWeb({
      scene,
      drum,
      door,
      sheets: () => this.sheets,
      sharpener: this.sharpener,
      lines: this.lines.web,
      colorOf: (saga) => SAGA_COLOR[SAGA_ORDER.indexOf(saga as SagaId)],
      reduceMotion: options.reduceMotion,
    });

    paintCloth(this.cloth.canvas, this.cloth.texture, door, cell, sheets, new Set());
    if (sheets.full) this.sharpener.setFullSheets(sheets.full);
    this.cells.write(this.bright);
    this.resize(options.width, options.height);
    this.pos.copy(this.flatPose().pos);
    this.applyCamera();
    this.warmUp();
  }

  /** The full sheets have landed: the cloth is rewoven from them once the opening fall
   *  is over and the view is still, since its first upload costs a frame. */
  upgradeSheets(full: FullSheets) {
    if (this.sheets.full) return;
    this.pendingFull = full;
  }

  get mode(): RotundaMode {
    return this.stateMode;
  }

  get moving(): boolean {
    return this.tween !== null;
  }

  get lensDegrees(): number {
    return this.lens;
  }

  get centred(): boolean {
    return this.homeD === 0;
  }

  /** The pointer over the view, in CSS pixels, or off it. */
  point(x: number, y: number) {
    this.pointer = { x, y };
  }

  unpoint() {
    this.pointer = null;
  }

  setDragging(dragging: boolean) {
    this.dragging = dragging;
  }

  resize(width: number, height: number) {
    this.view = { width: Math.max(1, width), height: Math.max(1, height) };
    for (const layer of Object.values(this.lines)) layer.material.resolution.set(this.view.width, this.view.height);
    if (this.stateMode === 'flat' && !this.tween) this.pos.copy(this.flatPose().pos);
  }

  /** The flat cloth hangs in the room the bar, the rail and the dock leave it. */
  setInsets(insets: { top: number; right: number; bottom: number; left: number }) {
    this.insets = insets;
    if (this.stateMode === 'flat' && !this.tween) this.pos.copy(this.flatPose().pos);
  }

  /** Where each saga's clay weight hangs on screen, in CSS pixels, while the cloth is
   *  flat: one each, though a saga's warp may gather on two. */
  weightsOnScreen(): { saga: SagaId; x: number; y: number }[] {
    if (this.stateMode !== 'flat' || this.tween) return [];
    const seen = new Set<number>();
    return this.room.weights.flatMap(({ saga, x }) => {
      if (seen.has(saga)) return [];
      seen.add(saga);
      const at = this.toScreen(x, this.drum.WEIGHT_TOP + 0.85);
      return at ? [{ saga: SAGA_ORDER[saga], ...at }] : [];
    });
  }

  /** One frame: the camera, the web, the brightness, the sharpening, the readout. */
  frame(dt: number, now: number) {
    const { drum } = this;
    const { U } = drum;
    U.uTime.value = this.o.reduceMotion ? 0 : now / 1000;
    if (this.fell <= drum.H + 1) {
      this.fell += (dt * (drum.H + 1)) / FELL_SECONDS;
      this.clothUniforms.uFell.value = this.fell > drum.H + 1 ? 1e4 : this.fell;
    }
    if (this.tween) this.stepTween(dt);
    else this.userCamera(dt);
    if (this.pendingFull && this.fell > drum.H + 1 && !this.tween) this.weaveFull();
    U.uRoom.value = smooth(0.82, 1, U.uBend.value);
    this.room.mirror.visible = U.uRoom.value > 0.01;
    this.applyCamera();
    this.web.animate(dt);
    this.easeBrightness(dt);
    this.updateHover();
    if ((this.sharpClock += dt) > 0.3) {
      this.sharpClock = 0;
      this.sharpener.update();
    }
    this.sharpener.pump();
    this.sharpener.flush();
    this.sharpener.settle();
    this.sharpener.fade(dt, this.bright);
    if (!this.tween && (this.stateMode === 'inside' || this.stateMode === 'flat')) {
      // From afar whites turn to old wool; close up the paintings are left as they are.
      const hit = this.hitCloth(0, 0);
      const px = this.view.height / (2 * Math.tan((this.o.camera.fov * Math.PI) / 360) * (hit ? hit.t : 60));
      const weave = clamp(1 - (px - 24) / 60, 0, 1);
      this.clothUniforms.uWeave.value = weave;
      if (this.stateMode === 'flat') this.weaveFlat = weave;
    }
    this.lines.back.material.opacity = this.back * 0.22;
    this.lines.back.visible = this.back > 0.01 && this.backCentre !== null;
    this.lines.backHot.visible = this.stateMode === 'outside' && this.hoverBack >= 0;
    if ((this.readClock += dt) > 0.15) {
      this.readClock = 0;
      this.emitReadout();
    }
  }

  /** The cloth at its full resolution, from the full sheets. Nothing has been woven
   *  into the first one: weaving waits for the full sheets, to cut where the bake cut. */
  private weaveFull() {
    const full = this.pendingFull;
    if (!full) return;
    this.pendingFull = null;
    this.sheets = { ...this.sheets, full };
    const woven = createClothTexture(this.drum, this.fullCell, this.anisotropy);
    paintCloth(woven.canvas, woven.texture, this.o.door, this.fullCell, this.sheets, new Set());
    const first = this.cloth.texture;
    this.cloth = { ...woven, cell: this.fullCell };
    this.clothUniforms.uTex.value = woven.texture;
    first.dispose();
    this.sharpener.setCloth(this.cloth);
    this.sharpener.setFullSheets(full);
  }

  // ------------------------------------------------------------ the three states

  /** Close the cloth round the work chosen, or round the column in front of the visitor. */
  enter(work = -1, then?: () => void) {
    if (this.stateMode !== 'flat' || this.tween) return;
    const { drum, o } = this;
    const { U } = drum;
    const centre = work >= 0 ? o.door.works[work].x + o.door.works[work].w / 2 : clamp(this.pos.x + U.uCenter.value, 0, drum.W);
    this.pos.x += U.uCenter.value - centre;
    U.uCenter.value = centre;
    let y = 0;
    let pitch = 0;
    if (work >= 0) {
      const w = o.door.works[work];
      const v = drum.H / 2 - (w.row + w.h / 2);
      y = clamp(v * 0.7, drum.BOTTOM + 3, drum.TOP - 3);
      pitch = Math.atan2(v - y, drum.R + this.homeD);
    }
    this.setMode('entering');
    this.startTween(this.insidePose(y, 0, pitch), CURL_SECONDS, 'curl', () => {
      this.setMode('inside');
      if (work >= 0) this.pull(work);
      then?.();
    });
  }

  /** Unroll the drum from the column the visitor faces. */
  leave() {
    if (this.stateMode !== 'inside' || this.tween) return;
    const { U } = this.drum;
    if (this.web.focus >= 0) this.o.onWeb(null, null);
    this.web.drop();
    this.clearPattern();
    U.uCenter.value = this.drum.columnAt(this.yaw);
    this.yaw = this.yawGoal = 0;
    this.pos.copy(this.drum.rimPos(0, this.d, this.y));
    this.setMode('leaving');
    this.startTween(this.flatPose(), UNCURL_SECONDS, 'curl', () => this.setMode('flat'));
  }

  /** Step out through the wall to the back of the cloth, where the threads are. */
  turnOut() {
    if (this.stateMode !== 'inside' || this.tween) return;
    this.release();
    this.clearPattern();
    this.buildBack();
    this.setMode('turning');
    const { yaw } = this;
    const { R } = this.drum;
    this.startTween(this.outsidePose(yaw), TURN_SECONDS, 'turn', () => {
      Object.assign(this.orbit, { yaw, el: 0.42, dist: 3.1 * R, yawGoal: yaw, elGoal: 0.42, distGoal: 3.1 * R });
      this.setMode('outside');
    });
  }

  /** Back inside, facing the work chosen on the back, or the way the visitor looked. */
  turnIn(work = -1) {
    if (this.stateMode !== 'outside' || this.tween) return;
    const { drum } = this;
    setLines(this.lines.backHot, [], []);
    this.hoverBack = -1;
    let y = 0;
    let yaw = this.yaw;
    let pitch = 0;
    if (work >= 0) {
      const w = this.o.door.works[work];
      yaw = (w.x + w.w / 2 - drum.U.uCenter.value) / drum.R;
      const v = drum.H / 2 - (w.row + w.h / 2);
      y = clamp(v * 0.7, drum.BOTTOM + 3, drum.TOP - 3);
      pitch = Math.atan2(v - y, drum.R + this.homeD);
    }
    this.setMode('turning');
    this.startTween(this.insidePose(y, unwrapNear(yaw, this.yaw), pitch), TURN_SECONDS, 'turn', () => {
      this.setMode('inside');
      if (work >= 0) this.pull(work);
    });
  }

  /** Back to where the visitor stands, level. */
  goHome() {
    this.dGoal = this.homeD;
    this.yGoal = 0;
    this.pitchGoal = 0;
  }

  /** Away from home inside: drifted, raised or looking up or down. */
  get away(): boolean {
    return Math.abs(this.d - this.homeD) > 0.5 || Math.abs(this.y) > 0.5 || Math.abs(this.pitch) > 0.05;
  }

  // ------------------------------------------------------------ the web

  /** Lift a work toward the visitor, with its web, along every thread or along one. */
  pull(work: number, along: number | null = null) {
    if (this.stateMode !== 'inside') return;
    this.clearPattern();
    const { camera } = this.o;
    const eye = this.pos.clone();
    const view = camera.getWorldDirection(new THREE.Vector3());
    // The held work fills about half the height of the view, whatever the lens; with a
    // long one it stops well short of the wall and is drawn smaller there instead.
    const tanHalf = Math.tan((this.fov * Math.PI) / 360);
    const hold = Math.min(2.25 / (0.92 * tanHalf), Math.max(3, (this.hitCloth(0, 0)?.t ?? 20) * 0.6));
    this.web.pull(work, along, eye, view, hold, 0.92 * hold * tanHalf);
    this.setBrightness();
    this.o.onWeb(work, along);
  }

  release() {
    if (this.web.focus < 0) return;
    this.web.release();
    this.setBrightness();
    this.o.onWeb(null, null);
  }

  /** A thread named in the rail lights alone, or none. */
  isolate(thread: number | null) {
    this.web.setIsolate(thread ?? -1);
  }

  // ------------------------------------------------------------ Patterns

  /** A Pattern's gold thread across the room, the view turned to its first stop. From
   *  the flat cloth the visitor steps inside first. */
  showPattern(index: number | null) {
    if (index === null) {
      this.clearPattern();
      return;
    }
    if (this.stateMode === 'flat') {
      this.enter(-1, () => this.showPattern(index));
      return;
    }
    if (this.stateMode !== 'inside') return;
    this.release();
    const { door } = this.o;
    const pattern = door.patterns[index];
    this.pattern = index;
    this.patternLit = pattern.lit;
    const gold = new THREE.Color('#fcd34d');
    const points = pattern.stops.map(({ work }) => {
      const w = door.works[work];
      return this.drum.bendAt(w.x + w.w / 2, w.row + w.h / 2, 0.3, new THREE.Vector3(), 1);
    });
    const positions: number[] = [];
    const colors: number[] = [];
    for (let j = 0; j + 1 < points.length; j++) pushArc(this.drum, points[j], points[j + 1], gold, 1, positions, colors, 32, 0.22);
    setLines(this.lines.pattern, positions, colors);
    if (points.length) this.lookToward(points[0]);
    this.setBrightness();
    this.o.onPattern(index);
  }

  // ------------------------------------------------------------ filters and the lens

  /** The door's filters: which works sink, and which saga's weight is held down. */
  setFilters(dimmed: (index: number) => boolean, saga: SagaId | null) {
    this.dimmed = dimmed;
    this.sagaShown = saga ? SAGA_ORDER.indexOf(saga) : -1;
    for (const weight of this.room.weights) {
      weight.lit.value = this.sagaShown < 0 ? 1 : weight.saga === this.sagaShown ? 1.35 : 0.4;
    }
    this.setBrightness();
  }

  setLens(degrees: number) {
    this.lens = clamp(Math.round(degrees), LENS.min, LENS.max);
  }

  setStance(centre: boolean) {
    this.homeD = centre ? 0 : this.drum.R - 2.6;
    this.dGoal = this.homeD;
  }

  /** Turn to face a work on the wall, as the keyboard walks the cloth. */
  face(work: number) {
    if (this.stateMode !== 'inside') return;
    const w = this.o.door.works[work];
    this.lookToward(this.drum.bendAt(w.x + w.w / 2, w.row + w.h / 2, 0, new THREE.Vector3(), 1));
  }

  // ------------------------------------------------------------ input

  /** A drag, in CSS pixels: inside the far wall follows the hand and the head tilts;
   *  outside the visitor walks round the drum. */
  drag(dx: number, dy: number) {
    if (this.tween) return;
    if (this.stateMode === 'inside') {
      const rate = this.fov / 30;
      this.yawGoal -= dx * 0.0013 * rate;
      this.pitchGoal = clamp(this.pitchGoal + dy * 0.0011 * rate, -1.2, 1.2);
    } else if (this.stateMode === 'outside') {
      this.orbit.yawGoal -= dx * 0.005;
      this.orbit.elGoal = clamp(this.orbit.elGoal + dy * 0.004, -0.12, 1.2);
    }
  }

  /** A wheel, in pixels: inside it drifts toward what the visitor looks at, level to
   *  cross the room, up or down through time; outside it steps nearer or further. */
  wheel(dx: number, dy: number, fast: boolean) {
    if (this.tween) return;
    if (this.stateMode === 'inside') {
      this.drift(-dy * (fast ? 0.06 : 0.02));
      this.yawGoal -= dx * 0.0012 * (this.fov / 30);
    } else if (this.stateMode === 'outside') {
      const { R } = this.drum;
      this.orbit.distGoal = clamp(this.orbit.distGoal * Math.exp(dy * 0.0012), R * 1.7, R * 6);
      this.orbit.yawGoal -= dx * 0.0025;
    }
  }

  /** What is under a point of the view, in CSS pixels. */
  pick(x: number, y: number): RotundaPick {
    const none: RotundaPick = { work: -1, lifted: false, saga: null };
    if (this.tween) return none;
    const nx = (x / this.view.width) * 2 - 1;
    const ny = -(y / this.view.height) * 2 + 1;
    if (this.stateMode === 'inside') {
      const lifted = this.hitLifted(nx, ny);
      if (lifted >= 0) return { work: lifted, lifted: true, saga: null };
    }
    if (this.stateMode !== 'inside' && this.stateMode !== 'outside' && this.stateMode !== 'flat') return none;
    const hit = this.hitCloth(nx, ny);
    if (!hit) return none;
    const outside = this.stateMode === 'outside';
    if (hit.back !== outside && this.stateMode !== 'flat') return none;
    return { work: hit.work, lifted: false, saga: outside ? null : this.weightAt(hit.gx, hit.gy) };
  }

  /** Where a point on the wall shows on screen, in CSS pixels, or null behind the eye. */
  toScreen(gx: number, gy: number, h = 0): { x: number; y: number } | null {
    this.o.camera.updateMatrixWorld();
    const p = this.drum.bendAt(gx, gy, h).project(this.o.camera);
    if (p.z > 1 || p.z < -1) return null;
    return { x: ((p.x + 1) / 2) * this.view.width, y: ((1 - p.y) / 2) * this.view.height };
  }

  dispose() {
    this.sharpener.dispose();
    this.web.dispose();
    this.room.dispose();
    for (const layer of Object.values(this.lines)) {
      this.o.scene.remove(layer);
      layer.geometry.dispose();
      layer.material.dispose();
    }
    this.cloth.texture.dispose();
    this.cells.texture.dispose();
    this.tear.dispose();
    for (const material of this.templates) material.dispose();
  }

  // ------------------------------------------------------------ camera

  /** The flat cloth with its beam and its weights, fitted to the room the chrome leaves. */
  private flatPose(): Pose {
    const t = Math.tan((FLAT_FOV * Math.PI) / 360);
    const { width, height } = this.view;
    const { top, right, bottom, left } = this.insets;
    const freeWidth = Math.max(120, width - left - right);
    const freeHeight = Math.max(120, height - top - bottom);
    const { W, H, U } = this.drum;
    // from the beam's ends to the weights' feet; pixels a cell
    const px = Math.min(freeWidth / (W + 4), freeHeight / (H + 5.4));
    const d = height / (2 * t * px);
    // the middle of the cloth, from the top of the beam to the foot of the weights
    const x = W / 2 - U.uCenter.value - (left + freeWidth / 2 - width / 2) / px;
    const y = -1.225 + (top + freeHeight / 2 - height / 2) / px;
    return { B: 0, back: 0, pos: new THREE.Vector3(x, y, d), yaw: 0, pitch: 0, fov: FLAT_FOV };
  }

  private insidePose(y = 0, yaw = 0, pitch = 0): Pose {
    return { B: 1, back: 0, pos: this.drum.rimPos(yaw, this.homeD, y), yaw, pitch, fov: this.lens, d: this.homeD, y };
  }

  private outsidePose(yaw: number): Pose {
    return { B: 1, back: 1, pos: this.drum.orbitPos(yaw, 0.42, 3.1 * this.drum.R), yaw, pitch: -0.42, fov: OUTSIDE_FOV };
  }

  private startTween(to: Pose, seconds: number, kind: Tween['kind'], done?: () => void) {
    const from: Pose = { B: this.drum.U.uBend.value, back: this.back, pos: this.pos.clone(), yaw: this.yaw, pitch: this.pitch, fov: this.fov };
    to.yaw = unwrapNear(to.yaw, from.yaw);
    this.tween = { from, to, t: 0, dur: this.o.reduceMotion ? REDUCED_SECONDS : seconds, kind, done };
    this.setHover(-1, null);
  }

  private stepTween(dt: number) {
    const tween = this.tween;
    if (!tween) return;
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const q = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - (-2 * tween.t + 2) ** 3 / 2;
    // while the cloth closes, the visitor walks in a little late, so it closes behind them
    const c = tween.kind === 'curl' ? q * q * (3 - 2 * q) : q;
    const { from, to } = tween;
    this.drum.U.uBend.value = lerp(from.B, to.B, q);
    this.back = lerp(from.back, to.back, q);
    this.pos.lerpVectors(from.pos, to.pos, c);
    this.yaw = lerp(from.yaw, to.yaw, c);
    this.pitch = lerp(from.pitch, to.pitch, c);
    this.fov = lerp(from.fov, to.fov, c);
    if (tween.kind === 'curl') this.clothUniforms.uWeave.value = this.weaveFlat * (1 - this.drum.U.uBend.value);
    if (tween.t < 1) return;
    this.tween = null;
    this.yawGoal = this.yaw;
    this.pitchGoal = this.pitch;
    if (to.d !== undefined && to.y !== undefined) {
      this.d = this.dGoal = to.d;
      this.y = this.yGoal = to.y;
    }
    tween.done?.();
  }

  private userCamera(dt: number) {
    if (this.stateMode === 'flat') return;
    const k = 1 - Math.exp(-dt * 12);
    if (this.stateMode === 'outside') {
      const o = this.orbit;
      o.yaw += (o.yawGoal - o.yaw) * k;
      o.el += (o.elGoal - o.el) * k;
      o.dist += (o.distGoal - o.dist) * (1 - Math.exp(-dt * 7));
      this.pos.copy(this.drum.orbitPos(o.yaw, o.el, o.dist));
      this.yaw = o.yaw;
      this.pitch = -Math.atan2(this.pos.y, Math.hypot(this.pos.x, this.pos.z - this.drum.R));
      return;
    }
    this.yaw += (this.yawGoal - this.yaw) * k;
    this.pitch += (this.pitchGoal - this.pitch) * k;
    const m = 1 - Math.exp(-dt * 6);
    this.d += (this.dGoal - this.d) * m;
    this.y += (this.yGoal - this.y) * m;
    this.fov += (this.lens - this.fov) * m;
    this.pos.copy(this.drum.rimPos(this.yaw, this.d, this.y));
  }

  private drift(step: number) {
    const { R, BOTTOM, TOP } = this.drum;
    this.dGoal = clamp(this.dGoal - step * Math.cos(this.pitchGoal), -(R - 2.4), R - 2.2);
    this.yGoal = clamp(this.yGoal + step * Math.sin(this.pitchGoal), BOTTOM - 2, TOP + 1);
  }

  /** Walk round the rim until a point on the wall is straight across the room. */
  private lookToward(point: THREE.Vector3) {
    const { R } = this.drum;
    this.yawGoal = unwrapNear(Math.atan2(point.x, R - point.z), this.yaw);
    this.pitchGoal = clamp(Math.atan2(point.y - this.yGoal, R + this.dGoal), -1.2, 1.2);
  }

  private applyCamera() {
    const { camera } = this.o;
    const cp = Math.cos(this.pitch);
    camera.position.copy(this.pos);
    camera.lookAt(this.pos.x + Math.sin(this.yaw) * cp, this.pos.y + Math.sin(this.pitch), this.pos.z - Math.cos(this.yaw) * cp);
    if (camera.fov !== this.fov) {
      camera.fov = this.fov;
      camera.updateProjectionMatrix();
    }
  }

  // ------------------------------------------------------------ brightness

  private setBrightness() {
    const { length } = this.bright;
    for (let i = 0; i < length; i++) {
      let g = this.dimmed(i) ? 0.22 : this.pattern >= 0 && this.patternLit.has(i) ? 1.1 : 1;
      if (this.web.focus >= 0) g = this.web.holds(i) ? 0.05 : 0.2;
      if (i === this.hover && this.stateMode !== 'outside' && !this.web.lifted.has(i)) g = Math.max(g, 1) * 1.14;
      this.brightGoal[i] = g;
    }
  }

  private easeBrightness(dt: number) {
    const k = 1 - Math.exp(-dt * 9);
    let changed = false;
    for (let i = 0; i < this.bright.length; i++) {
      const d = this.brightGoal[i] - this.bright[i];
      if (d === 0) continue;
      this.bright[i] = Math.abs(d) < 0.003 ? this.brightGoal[i] : this.bright[i] + d * k;
      changed = true;
    }
    if (changed) this.cells.write(this.bright);
  }

  // ------------------------------------------------------------ picking and hover

  /** Where a screen point meets the cloth: the plane when flat, the drum when closed. */
  private hitCloth(nx: number, ny: number) {
    const { drum, o } = this;
    this.ndc.set(nx, ny);
    this.ray.setFromCamera(this.ndc, o.camera);
    const origin = this.ray.ray.origin;
    const dir = this.ray.ray.direction;
    const b = drum.U.uBend.value;
    let gx: number;
    let gy: number;
    let t: number;
    let back = false;
    if (b < 1e-4) {
      if (Math.abs(dir.z) < 1e-6) return null;
      t = -origin.z / dir.z;
      if (t <= 0) return null;
      gx = origin.x + dir.x * t + drum.U.uCenter.value;
      gy = drum.H / 2 - (origin.y + dir.y * t);
    } else if (b > 0.999) {
      const ox = origin.x;
      const oz = origin.z - drum.R;
      const qa = dir.x * dir.x + dir.z * dir.z;
      const qb = 2 * (ox * dir.x + oz * dir.z);
      const qc = ox * ox + oz * oz - drum.R * drum.R;
      const disc = qb * qb - 4 * qa * qc;
      if (disc < 0 || qa < 1e-9) return null;
      back = qc > 0;
      t = back ? (-qb - Math.sqrt(disc)) / (2 * qa) : (-qb + Math.sqrt(disc)) / (2 * qa);
      if (t <= 0) return null;
      const px = origin.x + dir.x * t;
      const pz = origin.z + dir.z * t;
      gx = drum.columnAt(Math.atan2(px, drum.R - pz));
      gy = drum.H / 2 - (origin.y + dir.y * t);
    } else {
      return null;
    }
    const on = gx >= 0 && gx < drum.W && gy >= 0 && gy < drum.H;
    return { gx, gy, t, back, work: on ? o.door.cellOf[Math.floor(gy) * drum.W + Math.floor(gx)] : -1 };
  }

  private hitLifted(nx: number, ny: number): number {
    this.ndc.set(nx, ny);
    this.ray.setFromCamera(this.ndc, this.o.camera);
    const meshes = [...this.web.lifted.values()].filter((lifted) => !lifted.leaving).map((lifted) => lifted.mesh);
    const hit = this.ray.intersectObjects(meshes, false)[0];
    return hit ? (hit.object.userData.work as number) : -1;
  }

  /** The clay weight at a point of the wall below the cloth, as its saga. */
  private weightAt(gx: number, gy: number): SagaId | null {
    const { drum } = this;
    if (gy < drum.WEIGHT_TOP - 0.3 || gy > drum.WEIGHT_TOP + 1.9) return null;
    const closed = drum.U.uBend.value > 0.5;
    for (const weight of this.room.weights) {
      let dx = Math.abs(gx - weight.x);
      if (closed) dx = Math.min(dx, drum.W - dx);
      if (dx <= 0.75) return SAGA_ORDER[weight.saga];
    }
    return null;
  }

  private updateHover() {
    const point = this.pointer && !this.dragging ? this.pick(this.pointer.x, this.pointer.y) : null;
    const work = point?.work ?? -1;
    const saga = point?.saga ?? null;
    for (const lifted of this.web.lifted.values()) lifted.material.uniforms.uHover.value = lifted.work === work ? 1 : 0;
    if (this.stateMode === 'outside' && work !== this.hoverBack) {
      this.hoverBack = work;
      if (work >= 0) {
        const [positions, colors] = stitchesOnBack(this.drum, this.o.door, this.colorOf, this.o.door.threadsOf[work]);
        setLines(this.lines.backHot, positions, colors.map((c) => Math.min(1, c * 1.6)));
      } else {
        setLines(this.lines.backHot, [], []);
      }
    }
    this.setHover(work, saga);
  }

  private setHover(work: number, saga: SagaId | null) {
    if (work === this.hover && saga === this.hoverSaga) return;
    const changedWork = work !== this.hover;
    this.hover = work;
    this.hoverSaga = saga;
    if (changedWork) this.setBrightness();
    this.o.onHover(work, saga);
  }

  // ------------------------------------------------------------ the rest

  private readonly colorOf = (saga: string) => SAGA_COLOR[SAGA_ORDER.indexOf(saga as SagaId)];

  private clearPattern() {
    if (this.pattern < 0) return;
    this.pattern = -1;
    this.patternLit = new Set();
    setLines(this.lines.pattern, [], []);
    this.setBrightness();
    this.o.onPattern(null);
  }

  /** The back of the cloth, built once for where the drum was closed. */
  private buildBack() {
    if (this.backCentre === this.drum.U.uCenter.value) return;
    this.backCentre = this.drum.U.uCenter.value;
    setLines(this.lines.back, ...stitchesOnBack(this.drum, this.o.door, this.colorOf));
  }

  private setMode(mode: RotundaMode) {
    this.stateMode = mode;
    this.o.onMode(mode);
    this.emitReadout();
  }

  /** What the visitor faces: the era and the saga, the beam, the weights, or the back. */
  private emitReadout() {
    const { door } = this.o;
    const { drum } = this;
    let label = 'The Loom';
    let sub = `${door.works.length.toLocaleString('en-US')} works`;
    if (this.stateMode === 'outside' || this.stateMode === 'turning') {
      const stitches = door.threads.reduce((n, thread) => n + thread.works.length - 1, 0);
      label = 'The back of the cloth';
      sub = `${door.threads.length} threads, ${stitches.toLocaleString('en-US')} stitches`;
    } else if (this.stateMode === 'inside') {
      const hit = this.hitCloth(0, 0);
      if (!hit || hit.back) return;
      if (hit.gy < 0) {
        label = 'The beam';
        sub = 'where the weaving begins';
      } else if (hit.gy >= drum.H) {
        label = 'The weights';
        sub = 'where the warp ends';
      } else {
        const row = Math.floor(hit.gy);
        let era = door.layout.eras[0];
        for (const candidate of door.layout.eras) if (candidate.row <= row) era = candidate;
        label = era.label;
        const work = hit.work >= 0 ? door.works[hit.work] : null;
        sub = work ? SAGA_NAME[work.saga] : era.sub;
      }
    }
    const text = `${label}\n${sub}`;
    if (text === this.readout) return;
    this.readout = text;
    this.o.onReadout(label, sub);
  }

  /** Compile every shader the room will use now, rather than on first use: a first
   *  compile stalls a frame for a third of a second. The template materials stay alive,
   *  so their programs stay cached for the works that use them later. */
  private warmUp() {
    const { renderer, scene, camera } = this.o;
    const plane = new THREE.PlaneGeometry(1, 1);
    const fine = new THREE.ShaderMaterial({
      uniforms: {
        ...this.drum.U,
        uLift: { value: 0 },
        uTex: { value: this.cloth.texture },
        uCropOffset: { value: new THREE.Vector2() },
        uCropScale: { value: new THREE.Vector2(1, 1) },
        uOpacity: { value: 0 },
        uBright: { value: 1 },
      },
      vertexShader: PLAIN_VS,
      fragmentShader: FINE_FS,
      transparent: true,
      depthWrite: false,
    });
    const lift = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: this.cloth.texture },
        uCropOffset: { value: new THREE.Vector2() },
        uCropScale: { value: new THREE.Vector2(1, 1) },
        uSize: { value: new THREE.Vector2(1, 1) },
        uOpacity: { value: 0 },
        uHeld: { value: 0 },
        uHover: { value: 0 },
      },
      vertexShader: LIFT_VS,
      fragmentShader: LIFT_FS,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.templates.push(fine, lift);
    const meshes = [new THREE.Mesh(plane, fine), new THREE.Mesh(plane, lift)];
    const hidden = [this.room.mirror, ...Object.values(this.lines)].filter((object) => !object.visible);
    for (const object of hidden) object.visible = true;
    for (const mesh of meshes) scene.add(mesh);
    // The programs start compiling here, in parallel, and finish in the background.
    void renderer.compileAsync(scene, camera).then(() => plane.dispose());
    for (const mesh of meshes) scene.remove(mesh);
    for (const object of hidden) object.visible = false;
  }
}
