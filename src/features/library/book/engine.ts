import { compose, composeStacked, type Cell, type Row, type Slice } from './compose';
import { targetsOf } from './targets';

/** The reading room's book (docs/LIBRARY_PLAN.md §6). The text is rendered on
 *  the server into a hidden flow; this engine measures it, cuts it into pages
 *  (`compose`), and shows each page as clipped copies of the lines on it. The
 *  flow itself is never moved, so React keeps what it rendered.
 *
 *  A view is what lies open: two facing pages on a wide screen, one page on a
 *  phone. With both languages on a wide screen the original is the left page
 *  and the English the right, cut together (or any two of the work's languages,
 *  as the reader sets them: `data-left` and `data-tl` on the book); on a phone each page holds a
 *  stretch of the original over its English; with one language the text runs
 *  from page to page.
 *
 *  A face is one side of a leaf, and it never changes parent: a right-hand face
 *  is laid out on the right, a left-hand one on the left, and a turn is two of
 *  them rotating about the spine, back to back. The faces of the views either
 *  side are built ahead and kept out of sight, so a turn begins at once. */

export type BookLanguage = 'both' | 'orig' | 'trans';
export type BookState = 'closed' | 'opening' | 'open';

/** What lies open, for the chrome round the book. */
export interface BookSight {
  view: number;
  views: number;
  kind: 'title' | 'text' | 'end';
  /** The first and last page number on show. */
  folios: [number, number] | null;
  /** The last page number of the book. */
  pages: number;
  /** The blocks with a part on show, by `data-from`. */
  blocks: string[];
}

export interface BookOptions {
  /** `work/unit`: the place in a book is kept through the session under it. */
  key: string;
  work: string;
  /** The running head of a left page: the work, and its book or its teller. */
  heads: [string, string];
  structure: 'verse' | 'sections' | 'tales';
  /** The work has both languages to set on facing pages. */
  facing: boolean;
  onSight: (sight: BookSight) => void;
  onNow: (from: string | null) => void;
  navigate: (href: string) => void;
}

type Face = { kind: 'none' | 'title' | 'colophon' } | { kind: 'text'; slices: Slice[]; folio: number };
type Side = 'left' | 'right' | 'single';
type Role = 'rest' | 'wing' | 'fly';

interface RowRef {
  el: HTMLElement;
  from: string;
  to: string;
  orig: HTMLElement | null;
  /** What faces the right page: the original, or the translation the reader set there (`data-left`). */
  left: HTMLElement | null;
  /** The translation the reader chose, set again with each layout. */
  trans: HTMLElement | null;
}

/** A block's translation in the reader's language (`data-tl` on the book), or its English. */
function translationCell(block: HTMLElement, language: string | undefined): HTMLElement | null {
  return block.querySelector<HTMLElement>(`.lib-trans[data-tl="${language ?? 'en'}"]`) ?? block.querySelector<HTMLElement>('.lib-trans');
}

/** The block's left page: its original, or the translation the reader set beside the other one. */
function leftCell(block: HTMLElement, language: string | undefined): HTMLElement | null {
  const original = block.querySelector<HTMLElement>('.lib-orig');
  if (!language || language === 'orig') return original;
  return block.querySelector<HTMLElement>(`.lib-trans[data-tl="${language}"]`) ?? original;
}

interface LineMark {
  n: string;
  top: number;
}

/** A line or a paragraph of a cell, and where it stands in it. */
interface Item {
  el: HTMLElement;
  top: number;
  bottom: number;
}

interface Measured extends Cell {
  lines: LineMark[];
  items: Item[];
}

interface Geometry {
  spread: boolean;
  /** The languages are measured apart: on facing pages, or one over the other. */
  cells: 1 | 2;
  /** Faces to a composed page: two when the languages face each other. */
  columns: 1 | 2;
  /** One page holds both languages, the original over its English. */
  stack: boolean;
  pageW: number;
  pageH: number;
  textH: number;
  lead: number;
}

/** A leaf in the air: its front is a right-hand face, its back a left-hand one. */
interface Leaf {
  front: HTMLElement | null;
  back: HTMLElement | null;
}

/** A turn between two views. `m` runs from 0, every leaf lying on the right, to
 *  1, every leaf on the left: forward it rises, backward it falls. */
interface Turn {
  from: number;
  to: number;
  forward: boolean;
  leaves: Leaf[];
  /** The leaves between, when the turn skips pages: paper with nothing set on it. */
  blanks: HTMLElement[];
  m: number;
  frame: number;
  /** Held by a hover or a hand: it does not land by itself. */
  held: boolean;
}

/** Where the reader is, in terms that survive a new layout. */
type Anchor = { at: 'title' } | { at: 'end' } | { at: 'row'; row: number; part: number };

/** How far the eye stands from the page: nearer, and a leaf in the air looms over the room. */
const PERSPECTIVE = 3400;
const TURN_MS = 780;
/** Between one leaf and the next, when several go over together. */
const STAGGER = 110;
const OPEN_MS = 1350;
/** How far a leaf lifts under the pointer before any click. */
const PEEK = 0.065;
/** On a single page the leaf swings out past the edge of the screen and is gone. */
const SINGLE_SWEEP = 116;
const PLACE = 'icarus-book:';
const LAST_WORK = 'icarus-book-work';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeTurn = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const div = (className: string) => {
  const el = document.createElement('div');
  el.className = className;
  return el;
};

function measureCell(part: HTMLElement | null, lead: number): Measured {
  const none: Measured = { height: 0, breaks: [0], lines: [], items: [] };
  if (!part) return none;
  const box = part.getBoundingClientRect();
  if (box.height === 0) return none;
  const marks = [0, box.height];
  const lines: LineMark[] = [];
  const items: Item[] = [];
  let labelled = false;
  for (const el of part.querySelectorAll<HTMLElement>('.lib-line, p, .lib-out')) {
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) continue;
    const top = rect.top - box.top;
    items.push({ el, top, bottom: top + rect.height });
    // every element is set on the same leading, so its lines are its height shared out
    const count = Math.max(1, Math.round(rect.height / lead));
    // a label keeps the lines it names: no cut under it, nor under the first of them
    const label = el.classList.contains('lib-range');
    const first = labelled ? (count >= 3 ? 2 : 1) : 0;
    // a line of verse that runs over on a narrow page stays whole: its last word never turns the page alone
    const step = el.classList.contains('lib-line') || el.classList.contains('lib-vl') ? count : 1;
    for (let i = first; i <= (label ? 0 : count); i += step) marks.push(top + (rect.height * i) / count);
    labelled = label;
    if (el.dataset.n !== undefined) lines.push({ n: el.dataset.n, top });
  }
  marks.sort((a, b) => a - b);
  const breaks: number[] = [];
  for (const mark of marks) if (breaks.length === 0 || mark - breaks[breaks.length - 1] > 1) breaks.push(mark);
  if (box.height - breaks[breaks.length - 1] <= 1) breaks[breaks.length - 1] = box.height;
  else breaks.push(box.height);
  return { height: box.height, breaks, lines, items };
}

/** A copy of `part` holding only the lines and paragraphs a stretch of it shows,
 *  and how far that copy must be pulled up for the stretch to begin at its top.
 *  A page copies what it shows, not the whole of a block a hundred lines long. */
function copyStretch(part: HTMLElement, items: Item[], from: number, height: number): { node: HTMLElement; pull: number } | null {
  const kept = items.filter((item) => item.bottom > from + 0.5 && item.top < from + height - 0.5);
  if (kept.length === 0) return null;
  const copies = new Map<Element, Element>();
  const node = part.cloneNode(false) as HTMLElement;
  copies.set(part, node);
  for (const item of kept) {
    const chain: Element[] = [];
    let parent = item.el.parentElement;
    while (parent && !copies.has(parent)) {
      chain.push(parent);
      parent = parent.parentElement;
    }
    let into = parent ? copies.get(parent) : undefined;
    if (!into) continue;
    for (let i = chain.length - 1; i >= 0; i--) {
      const copy = chain[i].cloneNode(false) as Element;
      into.append(copy);
      copies.set(chain[i], copy);
      into = copy;
    }
    into.append(item.el.cloneNode(true));
  }
  return { node, pull: from - kept[0].top };
}

export class BookEngine {
  private readonly els: {
    stage: HTMLElement;
    shift: HTMLElement;
    pages: HTMLElement;
    cover: HTMLElement;
    spine: HTMLElement;
    castL: HTMLElement;
    castR: HTMLElement;
    zonePrev: HTMLButtonElement;
    zoneNext: HTMLButtonElement;
    flow: HTMLElement;
  };
  private readonly plates: Partial<Record<'title' | 'colophon', HTMLElement>> = {};
  private readonly rows: RowRef[];
  private readonly rowOf = new Map<Element, number>();
  private readonly undo: (() => void)[] = [];
  private readonly reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  /** The faces in the book now: those lying open, and those either side kept ready. */
  private readonly shown = new Map<number, HTMLElement>();

  private geo: Geometry = { spread: false, cells: 1, columns: 1, stack: false, pageW: 0, pageH: 0, textH: 0, lead: 28 };
  private measured: { cells: Measured[] }[] = [];
  private faces: Face[] = [];
  /** What the last setting came to: a new one that comes to the same is left alone. */
  private print = '';
  private view = 0;
  private state: BookState = 'closed';
  private started = false;
  /** The room changed while the cover was going over. */
  private stale = false;
  private dead = false;
  private turn: Turn | null = null;
  private frame = 0;
  private lastTurn = 0;
  /** Where the reader turned to: a new setting opens there, however often the room changes. */
  private place: Anchor | null = null;
  private keeping = false;
  private chosen: number | null = null;
  private now: number | null = null;
  private hovered: number | null = null;
  private resizeTimer = 0;
  private flashTimer = 0;
  private wingTimer = 0;
  private pointer = 'mouse';
  private swallowClick = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly options: BookOptions,
  ) {
    const find = <T extends HTMLElement>(selector: string) => {
      const el = root.querySelector<T>(selector);
      if (!el) throw new Error(`The book is missing ${selector}`);
      return el;
    };
    this.els = {
      stage: find('.book-stage'),
      shift: find('.bk-shift'),
      pages: find('.bk-pages'),
      cover: find('.bk-cover'),
      spine: find('.bk-spine'),
      castL: find('.bk-castbox-l .bk-cast'),
      castR: find('.bk-castbox-r .bk-cast'),
      zonePrev: find<HTMLButtonElement>('.bk-zone-prev'),
      zoneNext: find<HTMLButtonElement>('.bk-zone-next'),
      flow: find('.bk-flow'),
    };
    for (const kind of ['title', 'colophon'] as const) {
      const plate = root.querySelector<HTMLElement>(`.bk-tpl[data-face="${kind}"] > *`);
      if (plate) this.plates[kind] = plate;
    }
    this.rows = [...this.els.flow.querySelectorAll<HTMLElement>('.lib-block')].map((el, index) => {
      this.rowOf.set(el, index);
      return {
        el,
        from: el.dataset.from ?? '',
        to: el.dataset.to ?? '',
        orig: el.querySelector<HTMLElement>('.lib-orig'),
        left: leftCell(el, root.dataset.left),
        trans: translationCell(el, root.dataset.tl),
      };
    });
  }

  /* ───────────────────────── life ───────────────────────── */

  /** Sizes the book, waits for the faces the text is set in, and opens it. */
  async start() {
    this.bind();
    this.size();
    this.closedPose();
    this.root.setAttribute('data-ready', '');
    const shown = performance.now();
    // the flow is laid out now, so its fonts are on their way: measure once they are in
    void this.els.flow.offsetHeight;
    await Promise.race([document.fonts.ready, new Promise((resolve) => window.setTimeout(resolve, 2500))]);
    if (this.dead) return;
    const target = this.markTargets(window.location.hash);
    // the reader's language may have come back from storage in the meantime
    this.size();
    this.layout();
    this.started = true;
    let further = false;
    try {
      further = window.sessionStorage.getItem(LAST_WORK) === this.options.work;
      window.sessionStorage.setItem(LAST_WORK, this.options.work);
    } catch {
      // a private window may refuse storage: the book only forgets its place
    }
    // the cover is given a moment to be read, less of one when the reader is already in the work
    const pause = this.reduced.matches ? 0 : Math.max(0, (target || further ? 380 : 680) - (performance.now() - shown));
    window.setTimeout(() => {
      if (!this.dead) this.open(this.firstView(target, further));
    }, pause);
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    if (this.turn) cancelAnimationFrame(this.turn.frame);
    window.clearTimeout(this.resizeTimer);
    window.clearTimeout(this.flashTimer);
    window.clearTimeout(this.wingTimer);
    for (const off of this.undo) off();
    for (const blank of this.turn?.blanks ?? []) blank.remove();
    this.turn = null;
    this.clearFaces();
    this.els.cover.removeAttribute('style');
    this.els.shift.removeAttribute('style');
    for (const name of ['data-ready', 'data-state', 'data-view', 'data-cols', 'data-stack']) this.root.removeAttribute(name);
  }

  /** Sets the book again after the language or the room changed, keeping the reader's place. */
  relayout() {
    if (!this.started || this.dead) return;
    if (this.state === 'opening') {
      this.stale = true;
      return;
    }
    const anchor = this.state === 'open' ? (this.place ?? this.anchor()) : null;
    const before = this.print;
    this.size();
    this.layout();
    if (this.print === before) return;
    if (!anchor) {
      this.closedPose();
      return;
    }
    if (this.turn) this.land(false);
    this.clearFaces();
    this.view = this.viewAt(anchor);
    this.restingPose();
    this.keeping = true;
    this.show();
    this.keeping = false;
  }

  next() {
    this.go(this.view + 1);
  }

  previous() {
    this.go(this.view - 1);
  }

  /** Turns to the view that holds a block, by its place in the page's list. */
  goToRow(row: number) {
    if (this.state !== 'open') return;
    this.chosen = row;
    const view = this.viewAt({ at: 'row', row, part: 0 });
    if (view !== this.view) return this.go(view);
    this.pickNow();
    this.markNow();
  }

  go(to: number) {
    if (this.state !== 'open') return;
    const goal = clamp(to, 0, this.views() - 1);
    if (this.turn) {
      if (this.turn.to === goal && this.turn.held) {
        // the leaf already lifted under the pointer: let it go over
        this.turn.held = false;
        this.glide(this.turn.forward ? 1 : 0, TURN_MS, () => this.land(true));
        return;
      }
      this.land(!this.turn.held);
    }
    if (goal === this.view) return;
    if (this.reduced.matches) {
      this.view = goal;
      this.show();
      return;
    }
    const quick = performance.now() - this.lastTurn < 520;
    this.lastTurn = performance.now();
    const turn = this.lift(goal);
    this.glide(turn.forward ? 1 : 0, quick ? 420 : TURN_MS, () => this.land(true));
  }

  /* ───────────────────────── setting ───────────────────────── */

  private views() {
    return Math.ceil(this.faces.length / (this.geo.spread ? 2 : 1));
  }

  private facesOf(view: number): number[] {
    return this.geo.spread ? [view * 2, view * 2 + 1] : [view];
  }

  private sideOf(index: number): Side {
    return this.geo.spread ? (index % 2 === 0 ? 'left' : 'right') : 'single';
  }

  /** The size of the page from the room it is given, and the measure of its text. */
  private size() {
    const box = this.els.stage.getBoundingClientRect();
    const spread = box.width >= 860 && box.height >= 380;
    const over = spread ? 16 : 6;
    const pageH = Math.round(clamp(box.height - (spread ? 40 : 14), 280, 880));
    // a short room gets a wider page than a book would have, so the line keeps its measure
    const pageW = Math.round(spread ? Math.min((box.width - 2 * over - 12) / 2, Math.max(pageH * 0.78, 470), 610) : Math.min(box.width - 2 * over, 600));
    const short = spread && pageH < 600;
    const lead = pageH >= 760 && pageW >= 500 ? 30 : short ? 26 : pageW >= 400 ? 28 : 27;
    const padTop = spread ? (short ? 48 : 56) : 44;
    const padBottom = spread ? (short ? 42 : 50) : 38;
    const padOut = spread ? Math.round(pageW * 0.095) : Math.round(Math.max(20, pageW * 0.062));
    const padIn = spread ? Math.round(pageW * 0.105) : padOut;
    const textH = Math.max(lead * 4, Math.floor((pageH - padTop - padBottom) / lead) * lead);
    const verse = this.options.structure === 'verse';
    const both = this.options.facing && this.root.dataset.lang === 'both';
    const columns = spread && both ? 2 : 1;
    const stack = !spread && both;
    this.geo = { spread, cells: both ? 2 : 1, columns, stack, pageW, pageH, textH, lead };
    const set = (name: string, value: string) => this.root.style.setProperty(name, value);
    set('--bk-page-w', `${pageW}px`);
    set('--bk-page-h', `${pageH}px`);
    set('--bk-per-view', spread ? '2' : '1');
    set('--bk-over', `${over}px`);
    set('--bk-pad-top', `${padTop}px`);
    set('--bk-pad-bottom', `${padBottom}px`);
    set('--bk-pad-in', `${padIn}px`);
    set('--bk-pad-out', `${padOut}px`);
    set('--bk-text-w', `${pageW - padIn - padOut}px`);
    set('--bk-text-h', `${textH}px`);
    set('--bk-lead', `${lead}px`);
    set('--bk-fs-trans', `${(lead * 0.67).toFixed(2)}px`);
    set('--bk-fs-orig', `${(lead * (verse ? 0.595 : 0.62)).toFixed(2)}px`);
    // line numbers hang in the outer margin of a spread; a phone has no margin to spare
    set('--bk-num', spread ? '0px' : '28px');
    set('--bk-persp', `${PERSPECTIVE}px`);
    this.root.dataset.view = spread ? '2' : '1';
    this.root.dataset.cols = String(columns);
    this.root.toggleAttribute('data-stack', stack);
  }

  /** Measures the flow and cuts it into faces. */
  private layout() {
    const { cells, columns, stack, spread, textH, lead, pageW, pageH } = this.geo;
    // the reader may have chosen other languages since the last setting
    for (const row of this.rows) {
      row.left = leftCell(row.el, this.root.dataset.left);
      row.trans = translationCell(row.el, this.root.dataset.tl);
    }
    this.measured = this.rows.map((row) => ({
      cells: (cells === 2 ? [row.left, row.trans] : [row.el]).map((part) => measureCell(part, lead)),
    }));
    const rows: Row[] = this.measured;
    const pages = stack ? composeStacked(rows, textH, lead) : compose(rows, textH, lead);
    const faces: Face[] = spread ? [{ kind: 'none' }, { kind: 'title' }] : [{ kind: 'title' }];
    let folio = 0;
    for (const page of pages) for (const slices of page) faces.push({ kind: 'text', slices, folio: ++folio });
    faces.push({ kind: 'colophon' });
    if (spread && faces.length % 2 === 1) faces.push({ kind: 'none' });
    this.faces = faces;
    // the languages too: two translations may happen to come to the same heights, and the faces copy their words
    const { lang, tl, left } = this.root.dataset;
    this.print = [lang, tl, left, spread, columns, stack, pageW, pageH, lead, ...this.measured.map((row) => row.cells.map((cell) => Math.round(cell.height)).join('/'))].join(',');
  }

  private anchor(): Anchor {
    const open = this.openFaces();
    if (open.some((face) => face.kind === 'title')) return { at: 'title' };
    for (const face of open) {
      if (face.kind !== 'text' || face.slices.length === 0) continue;
      const slice = face.slices[0];
      const height = this.measured[slice.row]?.cells[slice.cell]?.height ?? 0;
      return { at: 'row', row: slice.row, part: height > 0 ? slice.from / height : 0 };
    }
    return { at: 'end' };
  }

  private viewAt(anchor: Anchor): number {
    const per = this.geo.spread ? 2 : 1;
    if (anchor.at === 'title') return 0;
    if (anchor.at === 'end') return this.views() - 1;
    const height = this.measured[anchor.row]?.cells[0]?.height ?? 0;
    const offset = anchor.part * height;
    let fallback = -1;
    for (let index = 0; index < this.faces.length; index++) {
      const face = this.faces[index];
      if (face.kind !== 'text') continue;
      for (const slice of face.slices) {
        if (slice.row !== anchor.row) continue;
        if (fallback < 0) fallback = index;
        if (slice.cell === 0 && offset >= slice.from - 0.5 && offset < slice.from + slice.height - 0.5) return Math.floor(index / per);
      }
    }
    return fallback < 0 ? 0 : Math.floor(fallback / per);
  }

  /** The view to open on: a cited passage, the place kept from before, or the title page. */
  private firstView(target: Anchor | null, further: boolean): number {
    if (target) return this.viewAt(target);
    try {
      const kept = window.sessionStorage.getItem(PLACE + this.options.key);
      if (kept) {
        const [from, part] = kept.split('|');
        const row = this.rows.findIndex((candidate) => candidate.from === from);
        if (row >= 0) return this.viewAt({ at: 'row', row, part: Number(part) || 0 });
      }
    } catch {
      // no storage: the title page
    }
    // further into a work already in hand, the reader goes straight to the text
    return further && this.views() > 1 ? 1 : 0;
  }

  /** Marks what a deep link names in the flow, so every copy of it carries the mark. */
  private markTargets(hash: string): Anchor | null {
    const { flow } = this.els;
    for (const node of flow.querySelectorAll('[data-target]')) node.removeAttribute('data-target');
    const targets = targetsOf(flow, hash);
    if (targets.length === 0) return null;
    for (const target of targets) {
      target.setAttribute('data-target', '');
      target.closest('.lib-block')?.setAttribute('data-target', '');
      target.classList.add('lib-flash');
    }
    // the glow is for the arrival: later copies of these lines keep the mark and lose the flash
    window.clearTimeout(this.flashTimer);
    this.flashTimer = window.setTimeout(() => {
      for (const target of targets) target.classList.remove('lib-flash');
    }, 5000);
    const first = targets[0];
    const block = first.closest('.lib-block');
    const row = block ? this.rowOf.get(block) : undefined;
    if (row === undefined) return null;
    this.chosen = row;
    if (first === block) return { at: 'row', row, part: 0 };
    // a line: how far down its block it stands
    const lines = [...(block?.querySelectorAll('.lib-line') ?? [])];
    return { at: 'row', row, part: lines.length > 0 ? lines.indexOf(first) / lines.length : 0 };
  }

  /* ───────────────────────── faces ───────────────────────── */

  private openFaces(): Face[] {
    return this.facesOf(this.view).map((index) => this.faces[index] ?? { kind: 'none' });
  }

  /** The lines, sections or tales a face holds, for its running head. */
  private rangeOf(faces: Face[]): string {
    const text = faces.filter((face): face is Extract<Face, { kind: 'text' }> => face.kind === 'text' && face.slices.length > 0);
    if (text.length === 0) return '';
    const first = text[0].slices[0];
    const last = text[text.length - 1].slices[text[text.length - 1].slices.length - 1];
    const { structure } = this.options;
    if (structure === 'verse') {
      const seen: string[] = [];
      for (const face of text) {
        for (const slice of face.slices) {
          const lines = this.measured[slice.row]?.cells[slice.cell]?.lines ?? [];
          for (const line of lines) if (line.top >= slice.from - 1 && line.top < slice.from + slice.height - 1) seen.push(line.n);
        }
      }
      const from = seen[0] ?? this.rows[first.row].from;
      const to = seen[seen.length - 1] ?? this.rows[last.row].to;
      return from === to ? `Line ${from}` : `Lines ${from}–${to}`;
    }
    const a = this.rows[first.row].from;
    const b = this.rows[last.row].from;
    if (structure === 'tales' && /^\d/.test(a) && /^\d/.test(b)) return a === b ? `Tale ${a}` : `Tales ${a}–${b}`;
    return a === b ? a : `${a} – ${b}`;
  }

  private buildFace(index: number): HTMLElement {
    const face: Face = this.faces[index] ?? { kind: 'none' };
    const side = this.sideOf(index);
    const el = div('bk-face');
    el.dataset.kind = face.kind;
    el.dataset.side = side;
    if (face.kind !== 'text') {
      // nothing lies there, or a plate does: the title page, the last page
      if (face.kind === 'none') return el;
      const plate = this.plates[face.kind];
      if (plate) el.append(plate.cloneNode(true));
      el.append(div('bk-shade'));
      return el;
    }

    const head = div('bk-head');
    const [work, unit] = this.options.heads;
    const mate = this.faces[side === 'left' ? index + 1 : index - 1];
    const range = this.rangeOf(side === 'single' || !mate ? [face] : side === 'left' ? [face, mate] : [mate, face]);
    const [a, b] = side === 'left' ? [work, unit] : side === 'right' ? ['', range] : [work, range];
    for (const label of [a, b]) {
      const span = document.createElement('span');
      span.textContent = label;
      head.append(span);
    }

    const text = div('bk-text');
    const apart = this.geo.cells === 2;
    let above: Slice | null = null;
    for (const slice of face.slices) {
      const row = this.rows[slice.row];
      const part = apart ? (slice.cell === 0 ? row.left : row.trans) : row.el;
      const stretch = part && copyStretch(part, this.measured[slice.row].cells[slice.cell].items, slice.from, slice.height);
      if (!stretch) continue;
      // one page for both: a short rule between a stretch of the original and its English
      if (this.geo.stack && slice.cell === 1 && above?.row === slice.row && above.cell === 0) {
        const rule = div('bk-between');
        rule.style.top = `${Math.round((above.y + above.height + slice.y) / 2)}px`;
        text.append(rule);
      }
      above = slice;
      const box = div('bk-slice');
      box.dataset.row = String(slice.row);
      box.style.top = `${Math.round(slice.y)}px`;
      box.style.height = `${Math.ceil(slice.height)}px`;
      if (row.el.hasAttribute('data-target')) box.dataset.target = '';
      if (slice.row === this.now) box.dataset.now = '';
      const pull = div('bk-pull');
      if (stretch.pull > 0.5) pull.style.transform = `translateY(${-Math.round(stretch.pull)}px)`;
      pull.append(stretch.node);
      box.append(pull);
      text.append(box);
    }

    const folio = div('bk-folio');
    folio.textContent = String(face.folio);
    el.append(head, text, folio, div('bk-shade'));
    return el;
  }

  /** The face at `index`, built and put in its place the first time it is asked for. */
  private face(index: number): HTMLElement {
    const known = this.shown.get(index);
    if (known) return known;
    const el = this.buildFace(index);
    el.dataset.role = 'wing' satisfies Role;
    this.els.pages.insertBefore(el, this.els.spine);
    this.shown.set(index, el);
    return el;
  }

  private rest(el: HTMLElement, role: Role) {
    el.dataset.role = role;
    el.style.transform = '';
    el.style.opacity = '';
    el.style.zIndex = '';
    const shade = this.shadeOf(el);
    if (shade) shade.style.opacity = '';
  }

  private clearFaces() {
    window.clearTimeout(this.wingTimer);
    for (const el of this.shown.values()) el.remove();
    this.shown.clear();
  }

  /** Lays the current view flat: its faces at rest, those of the views either side
   *  out of sight, every other face gone. */
  private arrange() {
    const open = new Set(this.facesOf(this.view));
    const near = new Set([...this.facesOf(this.view - 1), ...this.facesOf(this.view + 1)]);
    for (const [index, el] of this.shown) {
      if (open.has(index)) this.rest(el, 'rest');
      else if (near.has(index)) this.rest(el, 'wing');
      else {
        el.remove();
        this.shown.delete(index);
      }
    }
    for (const index of open) this.rest(this.face(index), 'rest');
    this.els.castL.style.opacity = '0';
    this.els.castR.style.opacity = '0';
    this.readyWings();
  }

  /** Builds the faces of the views either side while nothing moves, one at a time,
   *  so the next turn has nothing to set. */
  private readyWings() {
    window.clearTimeout(this.wingTimer);
    const step = () => {
      if (this.dead || this.turn || this.state !== 'open') return;
      const views = this.views();
      const wanted = [this.view + 1, this.view - 1].filter((view) => view >= 0 && view < views).flatMap((view) => this.facesOf(view));
      const next = wanted.find((index) => !this.shown.has(index));
      if (next === undefined) return;
      this.face(next);
      this.wingTimer = window.setTimeout(step, 40);
    };
    this.wingTimer = window.setTimeout(step, 160);
  }

  /** Lays the current view on the table, with nothing in the air. */
  private show() {
    this.pickNow();
    this.arrange();
    this.settle();
  }

  /** After the view changed: the page edges, the chrome, the margin, the place kept. */
  private settle() {
    const views = this.views();
    const last = Math.max(1, views - 1);
    const most = this.geo.spread ? 9 : 4;
    const left = this.state === 'closed' ? 0 : Math.round((most * this.view) / last);
    this.root.style.setProperty('--bk-stack-l', `${this.geo.spread ? left : 0}px`);
    this.root.style.setProperty('--bk-stack-r', `${most - left}px`);
    this.els.zonePrev.disabled = this.view <= 0;
    this.els.zoneNext.disabled = this.view >= views - 1;

    const open = this.openFaces();
    const text = open.filter((face): face is Extract<Face, { kind: 'text' }> => face.kind === 'text');
    const blocks: string[] = [];
    for (const face of text) for (const slice of face.slices) if (!blocks.includes(this.rows[slice.row].from)) blocks.push(this.rows[slice.row].from);
    let pages = 0;
    for (const face of this.faces) if (face.kind === 'text') pages = face.folio;
    this.options.onSight({
      view: this.view,
      views,
      kind: text.length > 0 ? 'text' : open.some((face) => face.kind === 'title') ? 'title' : 'end',
      folios: text.length > 0 ? [text[0].folio, text[text.length - 1].folio] : null,
      pages,
      blocks,
    });
    this.pickNow();
    this.markNow();

    if (this.state !== 'open' || this.keeping) return;
    const place = this.anchor();
    this.place = place;
    try {
      if (place.at === 'row') window.sessionStorage.setItem(PLACE + this.options.key, `${this.rows[place.row].from}|${place.part.toFixed(4)}`);
      else if (place.at === 'title') window.sessionStorage.removeItem(PLACE + this.options.key);
    } catch {
      // no storage: nothing is kept
    }
  }

  /** The block the margin speaks of: the one the reader chose, a cited one, or the first to begin here. */
  private pickNow() {
    const slices = this.openFaces().flatMap((face) => (face.kind === 'text' ? face.slices : []));
    const rows = [...new Set(slices.map((slice) => slice.row))];
    let now: number | null = null;
    if (this.chosen !== null && rows.includes(this.chosen)) now = this.chosen;
    else {
      this.chosen = null;
      const cited = rows.find((row) => this.rows[row].el.hasAttribute('data-target'));
      const begins = slices.find((slice) => slice.from === 0);
      now = cited ?? begins?.row ?? rows[0] ?? null;
    }
    if (now === this.now) return;
    this.now = now;
    this.options.onNow(now === null ? null : this.rows[now].from);
  }

  private markNow() {
    for (const slice of this.els.pages.querySelectorAll<HTMLElement>('.bk-slice')) {
      const row = Number(slice.dataset.row);
      slice.toggleAttribute('data-now', row === this.now);
      slice.toggleAttribute('data-hover', row === this.hovered && row !== this.now);
    }
  }

  /* ───────────────────────── the leaf ───────────────────────── */

  private shadeOf(face: HTMLElement | null): HTMLElement | null {
    const last = face?.lastElementChild;
    return last instanceof HTMLElement && last.classList.contains('bk-shade') ? last : null;
  }

  /** Puts a leaf at `p` of its way over: 0 lying on the right, 1 lying on the left. */
  private poseLeaf(leaf: Leaf, p: number) {
    const { front, back } = leaf;
    if (this.geo.spread) {
      const rise = Math.sin(p * Math.PI);
      if (front) {
        front.style.transform = `rotateY(${(-180 * p).toFixed(3)}deg)`;
        const shade = this.shadeOf(front);
        if (shade) shade.style.opacity = (0.66 * rise).toFixed(3);
      }
      if (back) {
        back.style.transform = `rotateY(${(180 * (1 - p)).toFixed(3)}deg)`;
        const shade = this.shadeOf(back);
        if (shade) shade.style.opacity = (0.54 * rise).toFixed(3);
      }
      return;
    }
    if (!front) return;
    front.style.transform = `rotateY(${(-SINGLE_SWEEP * p).toFixed(3)}deg)`;
    front.style.opacity = p < 0.5 ? '1' : clamp(1 - (p - 0.5) / 0.42, 0, 1).toFixed(3);
    const shade = this.shadeOf(front);
    if (shade) shade.style.opacity = (0.72 * Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5)).toFixed(3);
  }

  /** The shadow a leaf throws just past its free edge: `right` is how far over the
   *  leaf nearest the right page is, `left` the one nearest the left. */
  private cast(right: number | null, left: number | null) {
    const { spread, pageW } = this.geo;
    const { castL, castR } = this.els;
    if (!spread) {
      const p = right ?? 0;
      const angle = (SINGLE_SWEEP * p * Math.PI) / 180;
      const reach = (pageW * Math.max(0, Math.cos(angle))) / (1 - (pageW * Math.sin(angle)) / PERSPECTIVE);
      castR.style.opacity = Math.sin(clamp(p * 1.15, 0, 1) * Math.PI).toFixed(3);
      castR.style.transform = `translateX(${reach.toFixed(1)}px)`;
      return;
    }
    // where the free edge falls on the page beneath, seen through the perspective
    const fall = (p: number) => (pageW * Math.cos(p * Math.PI)) / (1 - (pageW * Math.sin(p * Math.PI)) / PERSPECTIVE);
    if (right !== null && right < 0.5) {
      castR.style.opacity = Math.sin(right * Math.PI).toFixed(3);
      castR.style.transform = `translateX(${fall(right).toFixed(1)}px)`;
    } else castR.style.opacity = '0';
    if (left !== null && left > 0.5) {
      castL.style.opacity = Math.sin(left * Math.PI).toFixed(3);
      castL.style.transform = `translateX(${fall(left).toFixed(1)}px)`;
    } else castL.style.opacity = '0';
  }

  private blank(side: Side): HTMLElement {
    const el = div('bk-face');
    el.dataset.kind = 'blank';
    el.dataset.side = side;
    el.append(div('bk-shade'));
    this.els.pages.insertBefore(el, this.els.spine);
    return el;
  }

  /** Lifts the leaves that lead from the current view to `to`: one for the next
   *  page, two or three when the turn skips pages. The first to rise shows the
   *  page being left, the last to fall the page arrived at. */
  private lift(to: number): Turn {
    window.clearTimeout(this.wingTimer);
    const from = this.view;
    const forward = to > from;
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    const count = high - low >= 4 ? 3 : high - low >= 2 ? 2 : 1;
    const { spread } = this.geo;
    const blanks: HTMLElement[] = [];
    const blank = (side: Side) => {
      const el = this.blank(side);
      blanks.push(el);
      return el;
    };
    const leaves: Leaf[] = [];
    const still = spread ? [this.face(low * 2), this.face(high * 2 + 1)] : [this.face(high)];
    for (let i = 0; i < count; i++) {
      if (spread) leaves.push({ front: i === 0 ? this.face(low * 2 + 1) : blank('right'), back: i === count - 1 ? this.face(high * 2) : blank('left') });
      else leaves.push({ front: i === 0 ? this.face(low) : blank('single'), back: null });
    }
    for (const el of this.shown.values()) this.rest(el, 'wing');
    for (const el of still) this.rest(el, 'rest');
    // on the right the first leaf lies on top, on the left the last one does
    leaves.forEach((leaf, i) => {
      if (leaf.front) {
        leaf.front.dataset.role = 'fly' satisfies Role;
        leaf.front.style.zIndex = String(9 - i);
      }
      if (leaf.back) {
        leaf.back.dataset.role = 'fly' satisfies Role;
        leaf.back.style.zIndex = String(6 + i);
      }
    });
    const turn: Turn = { from, to, forward, leaves, blanks, m: forward ? 0 : 1, frame: 0, held: false };
    this.turn = turn;
    this.poseTurn(turn, turn.m);
    return turn;
  }

  private poseTurn(turn: Turn, m: number) {
    turn.m = m;
    const count = turn.leaves.length;
    const whole = TURN_MS + (count - 1) * STAGGER;
    const ps = turn.leaves.map((leaf, i) => {
      // one leaf follows the hand or the glide; several each take their own time, one after another
      const p = count === 1 ? m : easeTurn(clamp((m * whole - i * STAGGER) / TURN_MS, 0, 1));
      this.poseLeaf(leaf, p);
      return p;
    });
    this.cast(ps[count - 1], ps[0]);
  }

  private glide(to: number, ms: number, done: () => void) {
    const turn = this.turn;
    if (!turn) return;
    cancelAnimationFrame(turn.frame);
    const from = turn.m;
    const start = performance.now();
    const several = turn.leaves.length > 1;
    const span = Math.max(120, ms * Math.max(0.25, Math.abs(to - from))) + (several ? (turn.leaves.length - 1) * STAGGER : 0);
    const step = (now: number) => {
      if (this.turn !== turn) return;
      const k = clamp((now - start) / span, 0, 1);
      this.poseTurn(turn, from + (to - from) * (several ? k : easeTurn(k)));
      if (k < 1) turn.frame = requestAnimationFrame(step);
      else done();
    };
    turn.frame = requestAnimationFrame(step);
  }

  /** Ends the turn: the leaves go over (`over`) or fall back, and every face lies flat again. */
  private land(over: boolean) {
    const turn = this.turn;
    if (!turn) return;
    cancelAnimationFrame(turn.frame);
    for (const blank of turn.blanks) blank.remove();
    this.turn = null;
    if (over) this.view = turn.to;
    this.arrange();
    if (over) this.settle();
  }

  /** A leaf lifts a little under the pointer, to say it can be turned. */
  private peek(direction: 1 | -1) {
    if (this.state !== 'open' || this.turn || this.reduced.matches) return;
    const to = this.view + direction;
    if (to < 0 || to >= this.views()) return;
    const turn = this.lift(to);
    turn.held = true;
    this.glide(turn.forward ? PEEK : 1 - PEEK, 900, () => {});
  }

  private unpeek() {
    const turn = this.turn;
    if (!turn || !turn.held) return;
    this.glide(turn.forward ? 0 : 1, 700, () => this.land(false));
  }

  /* ───────────────────────── opening ───────────────────────── */

  private setState(state: BookState) {
    this.state = state;
    this.root.dataset.state = state;
  }

  private closedPose() {
    this.setState('closed');
    this.els.shift.style.transform = this.geo.spread ? 'translateX(-25%)' : '';
    this.root.style.setProperty('--bk-stack-l', '0px');
    this.root.style.setProperty('--bk-stack-r', `${this.geo.spread ? 9 : 4}px`);
  }

  /** The cover as it lies once the book is open: the left board of a spread, gone from a single page. */
  private restingPose() {
    const { cover, shift } = this.els;
    shift.style.transform = '';
    cover.style.opacity = '';
    cover.style.zIndex = '';
    cover.style.transform = this.geo.spread ? 'rotateY(-180deg)' : '';
    cover.style.display = this.geo.spread ? '' : 'none';
    for (const shade of cover.querySelectorAll<HTMLElement>('.bk-shade')) shade.style.opacity = '0';
  }

  private poseCover(p: number) {
    const { cover } = this.els;
    const front = cover.querySelector<HTMLElement>('.bk-cover-front .bk-shade');
    const back = cover.querySelector<HTMLElement>('.bk-cover-back .bk-shade');
    if (this.geo.spread) {
      const rise = Math.sin(p * Math.PI);
      cover.style.transform = `rotateY(${(-180 * p).toFixed(3)}deg)`;
      // above the pages while it lies on them, beneath them once it is over
      cover.style.zIndex = p < 0.5 ? '' : '1';
      if (front) front.style.opacity = (0.66 * rise).toFixed(3);
      if (back) back.style.opacity = (0.54 * rise).toFixed(3);
      return;
    }
    cover.style.transform = `rotateY(${(-SINGLE_SWEEP * p).toFixed(3)}deg)`;
    cover.style.opacity = p < 0.5 ? '1' : clamp(1 - (p - 0.5) / 0.42, 0, 1).toFixed(3);
    if (front) front.style.opacity = (0.72 * Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5)).toFixed(3);
  }

  /** The cover goes over, and with it every page before the one to read. */
  private open(view: number) {
    const { shift } = this.els;
    const { spread } = this.geo;
    this.view = clamp(view, 0, this.views() - 1);
    this.show();
    if (this.reduced.matches) {
      this.restingPose();
      this.setState('open');
      this.show();
      return;
    }
    this.setState('opening');
    // opening further in, the pages before go over as one leaf: the title page above, the left page beneath
    let block: Leaf | null = null;
    if (spread && this.view > 0) {
      block = { front: this.face(1), back: this.face(this.view * 2) };
      for (const el of [block.front, block.back]) if (el) el.dataset.role = 'fly' satisfies Role;
    }
    // on a single page the board is out of sight well before it has gone all the way
    const span = spread ? OPEN_MS : OPEN_MS * 0.74;
    const start = performance.now();
    const step = (now: number) => {
      if (this.dead) return;
      const t = now - start;
      const p = easeTurn(clamp(t / span, 0, 1));
      this.poseCover(p);
      if (block) {
        const behind = easeTurn(clamp((t - 200) / (span - 80), 0, 1));
        this.poseLeaf(block, behind);
        this.cast(behind, behind);
      } else this.cast(p, null);
      if (spread) shift.style.transform = `translateX(${(-25 * (1 - easeOut(clamp(t / (span * 0.9), 0, 1)))).toFixed(3)}%)`;
      if (t < span + 140) {
        this.frame = requestAnimationFrame(step);
        return;
      }
      this.restingPose();
      this.setState('open');
      this.show();
      if (this.stale) {
        this.stale = false;
        this.print = '';
        this.relayout();
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  /* ───────────────────────── hands ───────────────────────── */

  private on<T extends Event>(target: EventTarget, type: string, handler: (event: T) => void, options?: AddEventListenerOptions) {
    target.addEventListener(type, handler as EventListener, options);
    this.undo.push(() => target.removeEventListener(type, handler as EventListener, options));
  }

  private bind() {
    const { stage, pages, zonePrev, zoneNext } = this.els;

    const observer = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.relayout(), 160);
    });
    observer.observe(stage);
    this.undo.push(() => observer.disconnect());

    // a face that arrives late moves every line: set the book again
    this.on(document.fonts, 'loadingdone', () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.relayout(), 160);
    });

    this.on<HashChangeEvent>(window, 'hashchange', () => {
      if (!this.started) return;
      const target = this.markTargets(window.location.hash);
      if (!target || this.state !== 'open') return;
      if (this.turn) this.land(!this.turn.held);
      // every face is set again, so that the cited lines carry their mark
      const view = this.viewAt(target);
      if (view === this.view) {
        this.clearFaces();
        this.show();
        return;
      }
      const open = this.facesOf(this.view);
      for (const [index, el] of this.shown) {
        if (open.includes(index)) continue;
        el.remove();
        this.shown.delete(index);
      }
      this.go(view);
    });

    this.on<KeyboardEvent>(window, 'keydown', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || this.state !== 'open') return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const last = this.views() - 1;
      const to =
        event.key === 'ArrowRight' || event.key === 'PageDown'
          ? this.view + 1
          : event.key === 'ArrowLeft' || event.key === 'PageUp'
            ? this.view - 1
            : event.key === ' ' && !target?.closest('button, a')
              ? this.view + (event.shiftKey ? -1 : 1)
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? last
                  : null;
      if (to === null) return;
      event.preventDefault();
      this.go(to);
    });

    // the wheel: one push, one page; a trackpad's glide after it turns nothing more
    let pushed = 0;
    let lastWheel = 0;
    let armed = true;
    this.on<WheelEvent>(
      stage,
      'wheel',
      (event) => {
        // a sideways push is a page here, never the browser's way back
        if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.preventDefault();
        const now = performance.now();
        if (now - lastWheel > 160) {
          pushed = 0;
          armed = true;
        }
        lastWheel = now;
        if (!armed) return;
        pushed += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (Math.abs(pushed) < 60) return;
        armed = false;
        this.go(this.view + (pushed > 0 ? 1 : -1));
      },
      { passive: false },
    );

    // the edges of the book: a hover lifts the leaf, a click turns it, a drag carries it
    let grab: { id: number; direction: 1 | -1; x: number; t: number; speed: number; moved: boolean; origin: number; swipe: boolean } | null = null;
    const follow = (event: PointerEvent) => {
      if (!grab || grab.id !== event.pointerId) return;
      const dx = event.clientX - grab.origin;
      if (!grab.moved) {
        if (Math.abs(dx) < 6) return;
        grab.moved = true;
        if (this.turn && this.turn.to !== this.view + grab.direction) this.land(!this.turn.held);
        if (!this.turn) {
          const to = this.view + grab.direction;
          if (to < 0 || to >= this.views() || this.state !== 'open') {
            grab = null;
            return;
          }
          this.lift(to);
        }
        if (this.turn) {
          this.turn.held = true;
          cancelAnimationFrame(this.turn.frame);
        }
      }
      const turn = this.turn;
      if (!turn) return;
      const now = performance.now();
      if (now > grab.t) grab.speed = (event.clientX - grab.x) / (now - grab.t);
      grab.x = event.clientX;
      grab.t = now;
      const { spread, pageW } = this.geo;
      let p: number;
      if (spread && !grab.swipe) {
        // the free edge of the leaf stays under the pointer
        const box = pages.getBoundingClientRect();
        p = Math.acos(clamp((event.clientX - (box.left + box.width / 2)) / pageW, -1, 1)) / Math.PI;
      } else {
        // a finger pulls the leaf its own way: back the other way lets it fall again
        const way = clamp((turn.forward ? -dx : dx) / (pageW * (spread ? 1.5 : 0.8)), 0, 1);
        p = turn.forward ? way : 1 - way;
      }
      this.poseTurn(turn, p);
    };
    const release = (event: PointerEvent) => {
      if (!grab || grab.id !== event.pointerId) return;
      const { moved } = grab;
      // a hand that paused before letting go did not fling the leaf
      const speed = performance.now() - grab.t > 90 ? 0 : grab.speed;
      grab = null;
      const turn = this.turn;
      if (!moved) return;
      this.swallowClick = true;
      window.setTimeout(() => (this.swallowClick = false), 0);
      if (!turn) return;
      const over = event.type !== 'pointercancel' && (turn.forward ? turn.m > 0.38 || speed < -0.45 : turn.m < 0.62 || speed > 0.45);
      turn.held = false;
      this.glide(over === turn.forward ? 1 : 0, TURN_MS * 0.8, () => this.land(over));
    };

    for (const [zone, direction] of [
      [zonePrev, -1],
      [zoneNext, 1],
    ] as const) {
      this.on<PointerEvent>(zone, 'pointerenter', (event) => {
        if (event.pointerType === 'mouse' && !grab) this.peek(direction);
      });
      this.on<PointerEvent>(zone, 'pointerleave', () => {
        if (!grab) this.unpeek();
      });
      this.on<PointerEvent>(zone, 'pointerdown', (event) => {
        if (event.button !== 0 || this.state !== 'open') return;
        zone.setPointerCapture(event.pointerId);
        grab = { id: event.pointerId, direction, x: event.clientX, t: performance.now(), speed: 0, moved: false, origin: event.clientX, swipe: false };
      });
      this.on<PointerEvent>(zone, 'pointermove', (event) => {
        if (grab) follow(event);
        else if (event.pointerType === 'mouse') this.peek(direction);
      });
      this.on<PointerEvent>(zone, 'pointerup', release);
      this.on<PointerEvent>(zone, 'pointercancel', release);
      this.on<MouseEvent>(zone, 'click', () => {
        if (this.swallowClick) return;
        this.go(this.view + direction);
      });
    }

    // a finger anywhere on the page: a swipe carries the leaf
    this.on<PointerEvent>(pages, 'pointerdown', (event) => {
      this.pointer = event.pointerType;
      if (event.pointerType === 'mouse' || grab || this.state !== 'open') return;
      if (event.target instanceof Element && event.target.closest('.bk-zone')) return;
      const origin = { x: event.clientX, y: event.clientY, id: event.pointerId };
      const watch = (move: PointerEvent) => {
        if (move.pointerId !== origin.id) return;
        const dx = move.clientX - origin.x;
        const dy = move.clientY - origin.y;
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) return stop();
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        stop();
        try {
          pages.setPointerCapture(move.pointerId);
        } catch {
          // the pointer is already gone
        }
        grab = { id: move.pointerId, direction: dx < 0 ? 1 : -1, x: move.clientX, t: performance.now(), speed: 0, moved: false, origin: origin.x, swipe: true };
        follow(move);
      };
      const stop = () => {
        pages.removeEventListener('pointermove', watch);
        pages.removeEventListener('pointerup', stop);
        pages.removeEventListener('pointercancel', stop);
      };
      pages.addEventListener('pointermove', watch);
      pages.addEventListener('pointerup', stop);
      pages.addEventListener('pointercancel', stop);
    });
    this.on<PointerEvent>(pages, 'pointermove', (event) => {
      if (grab?.swipe) follow(event);
    });
    this.on<PointerEvent>(pages, 'pointerup', (event) => {
      if (grab?.swipe) release(event);
    });
    this.on<PointerEvent>(pages, 'pointercancel', (event) => {
      if (grab?.swipe) release(event);
    });

    // under the pointer a block shows the faint hair that a click makes gold
    const hover = (row: number | null) => {
      if (row === this.hovered) return;
      this.hovered = row;
      this.markNow();
    };
    this.on<PointerEvent>(pages, 'pointerover', (event) => {
      if (event.pointerType !== 'mouse') return;
      const slice = event.target instanceof Element ? event.target.closest<HTMLElement>('.bk-face[data-role="rest"] .bk-slice') : null;
      hover(slice ? Number(slice.dataset.row) : null);
    });
    this.on<PointerEvent>(pages, 'pointerleave', () => hover(null));

    this.on<MouseEvent>(pages, 'click', (event) => {
      if (this.swallowClick || this.state !== 'open') return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest('.bk-zone')) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (link) {
        // a copy of a server-rendered link: hand it to the router, as the original would
        const href = link.getAttribute('href') ?? '';
        if (!href.startsWith('/') || link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        this.options.navigate(href);
        return;
      }
      // a finger has no edge to hover: a tap near either side turns the page
      if (this.pointer !== 'mouse') {
        const box = pages.getBoundingClientRect();
        const at = (event.clientX - box.left) / box.width;
        const edge = this.geo.spread ? 0.1 : 0.2;
        if (at < edge) return this.go(this.view - 1);
        if (at > 1 - edge) return this.go(this.view + 1);
      }
      const slice = target.closest<HTMLElement>('.bk-slice');
      if (!slice || window.getSelection()?.toString()) return;
      this.chosen = Number(slice.dataset.row);
      this.pickNow();
      this.markNow();
    });
  }
}
