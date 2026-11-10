/** How the reading room's book is set (docs/LIBRARY_PLAN.md §6): the aligned
 *  blocks of a reading page are cut into the pages of a book. Pure geometry, so
 *  it can be checked without a browser: the engine measures, this composes.
 *
 *  A row is one aligned block. With the original and the English on facing
 *  pages it has two cells that start at the same height, as in a Loeb; with one
 *  language it has one. A row that does not fit is cut between lines, and where
 *  it has two cells the shorter one is cut in proportion, so that a page of
 *  English still faces the Greek it translates. On a phone the two cells share
 *  one page instead (`composeStacked`): a stretch of the original, and under it
 *  the English of that stretch. */

/** One language's share of a block as it was laid out. */
export interface Cell {
  height: number;
  /** Where it may be cut, from its top: every line boundary, 0 and its height included, ascending. */
  breaks: number[];
}

export interface Row {
  cells: Cell[];
}

/** A stretch of one cell on a page: `from` and `height` in the cell, `y` on the page. */
export interface Slice {
  row: number;
  cell: number;
  from: number;
  height: number;
  y: number;
}

/** A composed page: its slices, column by column (one column, or the two facing pages). */
export type ComposedPage = Slice[][];

const EPSILON = 0.5;
/** Lines that must stay together at either end of a cut. */
const KEEP = 2;

/** The last cut at or before `limit` that leaves the reader at least `KEEP`
 *  lines on both sides, or null when the cell has none there. */
function cutBefore(cell: Cell, from: number, limit: number, lead: number): number | null {
  const least = from + KEEP * lead - EPSILON;
  const most = Math.min(limit, cell.height - KEEP * lead) + EPSILON;
  for (let index = cell.breaks.length - 1; index >= 0; index--) {
    const at = cell.breaks[index];
    if (at > most) continue;
    if (at < least) return null;
    return at;
  }
  return null;
}

/** The last cut at or before `limit`, no earlier than `low`. */
function cutUpTo(cell: Cell, low: number, limit: number): number {
  let best = low;
  for (const at of cell.breaks) {
    if (at > limit + EPSILON) break;
    if (at > best) best = at;
  }
  return best;
}

/** The cut nearest to `target` within `[low, high]`. */
function cutNear(cell: Cell, target: number, low: number, high: number): number {
  let best = low;
  for (const at of cell.breaks) {
    if (at < low - EPSILON) continue;
    if (at > high + EPSILON) break;
    if (Math.abs(at - target) < Math.abs(best - target)) best = at;
  }
  return best;
}

export function compose(rows: Row[], pageHeight: number, lead: number): ComposedPage[] {
  const columns = Math.max(1, ...rows.map((row) => row.cells.length));
  const pages: ComposedPage[] = [];
  const blank = (): ComposedPage => Array.from({ length: columns }, () => []);
  let page = blank();
  let y = 0;
  const used = () => page.some((column) => column.length > 0);
  const turn = () => {
    pages.push(page);
    page = blank();
    y = 0;
  };

  rows.forEach((row, index) => {
    const taken = row.cells.map(() => 0);
    const left = () => row.cells.map((cell, at) => cell.height - taken[at]);
    if (Math.max(...left()) <= EPSILON) return;
    // a line of air between one block and the next
    let start = used() ? y + lead : 0;
    for (;;) {
      const rest = left();
      const most = Math.max(...rest);
      const room = pageHeight - start;
      if (most <= room + EPSILON) {
        row.cells.forEach((_, at) => {
          if (rest[at] > EPSILON) page[at].push({ row: index, cell: at, from: taken[at], height: rest[at], y: start });
        });
        y = start + most;
        return;
      }
      // the tallest cell leads the cut; the others follow in proportion
      const driver = rest.indexOf(most);
      let cut = cutBefore(row.cells[driver], taken[driver], taken[driver] + room, lead);
      if (cut === null) {
        if (used()) {
          turn();
          start = 0;
          continue;
        }
        // nothing on the page and still no cut: a cell with no line to break at
        cut = taken[driver] + room;
      }
      const share = (cut - taken[driver]) / rest[driver];
      row.cells.forEach((cell, at) => {
        const to = at === driver ? cut : cutNear(cell, taken[at] + rest[at] * share, taken[at], Math.min(cell.height, taken[at] + room));
        if (to - taken[at] > EPSILON) page[at].push({ row: index, cell: at, from: taken[at], height: to - taken[at], y: start });
        taken[at] = to;
      });
      turn();
      start = 0;
    }
  });
  if (used()) pages.push(page);
  return pages;
}

/** One column for both languages: each page holds a stretch of the original and,
 *  half a line under it, the English of that stretch. A block too long for the
 *  page gives each language its share of the room, in proportion to what is
 *  left of it, so the two run out together. */
export function composeStacked(rows: Row[], pageHeight: number, lead: number): ComposedPage[] {
  const gap = lead / 2;
  const pages: ComposedPage[] = [];
  let page: ComposedPage = [[]];
  let y = 0;
  const used = () => page[0].length > 0;
  const turn = () => {
    pages.push(page);
    page = [[]];
    y = 0;
  };

  rows.forEach((row, index) => {
    const [first, second] = [row.cells[0] ?? { height: 0, breaks: [0] }, row.cells[1] ?? { height: 0, breaks: [0] }];
    const taken = [0, 0];
    if (first.height + second.height <= EPSILON) return;
    let start = used() ? y + lead : 0;
    for (;;) {
      const rest = [first.height - taken[0], second.height - taken[1]];
      const between = rest[0] > EPSILON && rest[1] > EPSILON ? gap : 0;
      const room = pageHeight - start;
      if (rest[0] + between + rest[1] <= room + EPSILON) {
        if (rest[0] > EPSILON) page[0].push({ row: index, cell: 0, from: taken[0], height: rest[0], y: start });
        if (rest[1] > EPSILON) page[0].push({ row: index, cell: 1, from: taken[1], height: rest[1], y: start + rest[0] + between });
        y = start + rest[0] + between + rest[1];
        return;
      }
      // too little room to give each language two lines: begin on the next page
      if (used() && room - between < KEEP * 2 * lead) {
        turn();
        start = 0;
        continue;
      }
      const share = (room - between) / (rest[0] + rest[1]);
      let cuts = [cutUpTo(first, taken[0], taken[0] + rest[0] * share), 0];
      cuts[1] = cutUpTo(second, taken[1], taken[1] + Math.min(room - between - (cuts[0] - taken[0]), rest[1] * share + lead));
      // neither language has a line to cut at: cut the longer one where the page ends
      if (cuts[0] - taken[0] + (cuts[1] - taken[1]) <= EPSILON) cuts = rest[0] >= rest[1] ? [Math.min(first.height, taken[0] + room), taken[1]] : [taken[0], Math.min(second.height, taken[1] + room)];
      const heights = [cuts[0] - taken[0], cuts[1] - taken[1]];
      if (heights[0] > EPSILON) page[0].push({ row: index, cell: 0, from: taken[0], height: heights[0], y: start });
      if (heights[1] > EPSILON) page[0].push({ row: index, cell: 1, from: taken[1], height: heights[1], y: start + heights[0] + (heights[0] > EPSILON ? between : 0) });
      taken[0] = cuts[0];
      taken[1] = cuts[1];
      turn();
      start = 0;
    }
  });
  if (used()) pages.push(page);
  return pages;
}
