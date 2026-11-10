/** Validates how the reading room's book is cut into pages. Run with: pnpm validate-book
 *
 * Contract (src/features/library/book/compose.ts, docs/LIBRARY_PLAN.md §6):
 *   every line of every block is set exactly once, in reading order
 *   nothing is set past the foot of a page, and no page is empty
 *   a block is cut only between lines
 *   on facing pages the original and its English begin a block at the same height
 *   on a single page the English of a stretch stands under that stretch
 *   deterministic: the same blocks come to the same pages
 *
 * The composer is pure geometry, so the gate needs no browser: it sets a few
 * hundred made-up books (blocks of one line and of a hundred and twenty, cells
 * with nothing in them, pages of eight lines and of twenty-eight) both ways. */

import { compose, composeStacked, type ComposedPage, type Row } from '../src/features/library/book/compose';

const ROUNDS = 600;
const SLACK = 0.6;

/** A small fixed generator, so a failure names a round that can be run again. */
function generator(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const cell = (lines: number, lead: number) => ({ height: lines * lead, breaks: Array.from({ length: lines + 1 }, (_, at) => at * lead) });

function check(name: string, rows: Row[], pages: ComposedPage[], pageHeight: number, lead: number, stacked: boolean): string[] {
  const errors: string[] = [];
  const taken = rows.map((row) => row.cells.map(() => 0));
  pages.forEach((page, at) => {
    if (page.every((column) => column.length === 0)) errors.push(`${name}: page ${at + 1} is empty`);
    const tops = new Map<number, number>();
    for (const column of page) {
      let floor = -Infinity;
      for (const slice of column) {
        if (slice.y < floor - SLACK) errors.push(`${name}: page ${at + 1} sets one stretch over another`);
        if (slice.y + slice.height > pageHeight + SLACK) errors.push(`${name}: page ${at + 1} runs ${(slice.y + slice.height - pageHeight).toFixed(1)} px past its foot`);
        if (Math.abs(slice.from - taken[slice.row][slice.cell]) > SLACK) errors.push(`${name}: block ${slice.row} is set out of order on page ${at + 1}`);
        const over = slice.height % lead;
        if (over > SLACK && lead - over > SLACK) errors.push(`${name}: block ${slice.row} is cut inside a line on page ${at + 1}`);
        // facing pages: both languages of a block begin at one height
        const top = tops.get(slice.row);
        if (!stacked && top !== undefined && Math.abs(top - slice.y) > SLACK) errors.push(`${name}: block ${slice.row} begins at two heights on page ${at + 1}`);
        if (top === undefined) tops.set(slice.row, slice.y);
        // one page for both: the English never stands above its original
        if (stacked && slice.cell === 1 && top !== undefined && slice.y < top - SLACK) errors.push(`${name}: block ${slice.row} has its English above its original on page ${at + 1}`);
        taken[slice.row][slice.cell] = slice.from + slice.height;
        floor = slice.y + slice.height;
      }
    }
  });
  rows.forEach((row, at) =>
    row.cells.forEach((part, which) => {
      if (Math.abs(taken[at][which] - part.height) > SLACK) errors.push(`${name}: block ${at} loses ${(part.height - taken[at][which]).toFixed(1)} px of its text`);
    }),
  );
  return errors;
}

function main() {
  const errors: string[] = [];
  let pagesSet = 0;
  for (let round = 0; round < ROUNDS; round++) {
    const random = generator(round + 1);
    const lead = [26, 27, 28, 30][round % 4];
    const pageHeight = lead * (8 + Math.floor(random() * 21));
    const cells = round % 5 === 0 ? 1 : 2;
    const rows: Row[] = Array.from({ length: 1 + Math.floor(random() * 70) }, () => ({
      cells: Array.from({ length: cells }, () => cell(random() < 0.08 ? 0 : 1 + Math.floor(random() * (random() < 0.2 ? 120 : 9)), lead)),
    }));
    const ways: [string, boolean][] = cells === 2 ? [['facing', false], ['stacked', true]] : [['one language', false]];
    for (const [way, stacked] of ways) {
      const set = () => (stacked ? composeStacked(rows, pageHeight, lead) : compose(rows, pageHeight, lead));
      const pages = set();
      pagesSet += pages.length;
      const name = `round ${round + 1}, ${way}`;
      errors.push(...check(name, rows, pages, pageHeight, lead, stacked));
      if (JSON.stringify(set()) !== JSON.stringify(pages)) errors.push(`${name}: the same blocks came to other pages`);
    }
  }
  if (errors.length > 0) {
    for (const error of errors.slice(0, 20)) console.error(`✗ ${error}`);
    if (errors.length > 20) console.error(`… and ${errors.length - 20} more`);
    process.exit(1);
  }
  console.log(`${ROUNDS} books set, ${pagesSet.toLocaleString('en-US')} pages: every line once, in order, none cut, none past the foot.`);
  console.log('\nBook pages valid.');
}

main();
