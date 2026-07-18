/** Bakes data/generated/attic-calendar.json — the reconstructed Attic
 *  calendar behind the Ephemeris (docs/EPHEMERIS_PLAN.md M12.5).
 *  Run with: pnpm bake-attic-calendar (dev-only; the table is committed).
 *
 *  Convention — always labeled "reconstructed" in the UI:
 *  - The Attic year begins with Hekatombaion: its Day 1 is the Athens
 *    calendar day AFTER the day of the first new-moon conjunction following
 *    the June solstice (a stand-in for first-crescent visibility).
 *  - Every later conjunction starts the next month the same way.
 *  - A year that holds thirteen lunations doubles Poseideon (poseideon-ii),
 *    which reproduces the Metonic rhythm without any bookkeeping.
 *  - Olympiad years (astronomical year ≡ 1 mod 4, anchored on 776 BC)
 *    record the second full moon after the solstice as the games' peak.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Astronomy from 'astronomy-engine';
import { athensIsoDate } from '../src/features/spotlight/calendar';
import { ATTIC_MONTHS } from '../src/types/spotlight';
import type { AtticCalendar, AtticCalendarYear } from '../src/types/spotlight';

const FIRST_YEAR = 2024;
const LAST_YEAR = 2044;
const DAY_MS = 86_400_000;

function searchPhaseAfter(targetLongitude: number, after: Date): Date {
  const found = Astronomy.SearchMoonPhase(targetLongitude, after, 40);
  if (!found) throw new Error(`no moon phase ${targetLongitude} within 40 days of ${after.toISOString()}`);
  return found.date;
}

/** Day 1 = the Athens day after the conjunction's Athens day. */
function monthStartFor(conjunction: Date): string {
  const [year, month, day] = athensIsoDate(conjunction).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

const years: AtticCalendarYear[] = [];
for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
  const solstice = Astronomy.Seasons(year).jun_solstice.date;
  const nextSolstice = Astronomy.Seasons(year + 1).jun_solstice.date;

  const conjunctions: Date[] = [];
  let cursor = searchPhaseAfter(0, solstice);
  while (cursor.getTime() < nextSolstice.getTime()) {
    conjunctions.push(cursor);
    cursor = searchPhaseAfter(0, new Date(cursor.getTime() + 2 * DAY_MS));
  }

  const names: string[] = [...ATTIC_MONTHS];
  if (conjunctions.length === 13) {
    names.splice(6, 0, 'poseideon-ii');
  } else if (conjunctions.length !== 12) {
    throw new Error(`attic year ${year}/${year + 1}: unexpected ${conjunctions.length} lunations`);
  }

  const entry: AtticCalendarYear = {
    atticYear: `${year}/${year + 1}`,
    months: conjunctions.map((conjunction, index) => ({
      name: names[index] as AtticCalendarYear['months'][number]['name'],
      start: monthStartFor(conjunction),
    })),
  };

  if ((year - 1) % 4 === 0) {
    const firstFull = searchPhaseAfter(180, solstice);
    const secondFull = searchPhaseAfter(180, new Date(firstFull.getTime() + 2 * DAY_MS));
    entry.olympicPeak = athensIsoDate(secondFull);
  }

  years.push(entry);
}

const table: AtticCalendar = {
  convention:
    'Reconstruction: Hekatombaion Day 1 = the Athens day after the first new-moon conjunction following the June solstice; each conjunction starts the next month the same way; 13-lunation years double Poseideon (poseideon-ii); Olympiad years (astronomical ≡ 1 mod 4) record the second full moon after the solstice as the games peak. Modern convention — the UI always labels it "reconstructed".',
  engine: 'astronomy-engine ^2.1.19',
  years,
};

const outDir = join(import.meta.dirname, '..', 'data', 'generated');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'attic-calendar.json'), `${JSON.stringify(table, null, 2)}\n`);
console.log(
  `Attic calendar baked: ${years.length} years (${FIRST_YEAR}/${FIRST_YEAR + 1} – ${LAST_YEAR}/${LAST_YEAR + 1}), ` +
    `${years.filter((entry) => entry.months.length === 13).length} intercalary.`,
);
