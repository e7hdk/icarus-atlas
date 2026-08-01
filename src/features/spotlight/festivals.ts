/** Festival resolution (docs/EPHEMERIS_PLAN.md D6).
 *
 *  With the reconstructed Attic calendar available (M12.5), day-precise
 *  festivals resolve on their real lunar dates: the recorded Attic day inside
 *  the baked month. Day-less festivals (Hyakinthia's three unattested days,
 *  the month-long Rural Dionysia) keep their curated conventional placements,
 *  and the games take a five-day window around the Olympiad year's second
 *  full moon after the solstice. Without the table everything falls back to
 *  the v1 conventional dates. Festivals never fire in Poseideon II — the
 *  intercalary month repeated no feasts.
 *
 *  Same-day collisions break deterministically by alphabetical id —
 *  documented editorial choice. */

import { atticDateFor } from './attic';
import { isoDateAtIndex } from './calendar';
import type { AtticCalendar, EphemerisFestival } from '@/types/spotlight';

export interface FestivalContext {
  festival: EphemerisFestival;
  /** 1-based position inside the festival's window. */
  day: number;
  of: number;
}

const DAY_MS = 86_400_000;

function utcOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function conventionalContext(
  festival: EphemerisFestival,
  monthDay: string,
): FestivalContext | null {
  if (!festival.conventionalDates.includes(monthDay)) return null;
  const window = [...festival.conventionalDates].sort();
  return { festival, day: window.indexOf(monthDay) + 1, of: window.length };
}

export function festivalOn(
  festivals: EphemerisFestival[],
  isoDate: string,
  attic: AtticCalendar | null,
): FestivalContext | null {
  const monthDay = isoDate.slice(5);
  const atticInfo = atticDateFor(attic, isoDate);

  const hits: FestivalContext[] = [];
  for (const festival of festivals) {
    if (festival.gamesCycle) {
      // Only the Olympics have a baked peak (M12.5). Other crown games keep
      // `games` metadata for the Heortologion but wait for their own anchors —
      // never share the Olympiad window (alphabetical id would steal Zeus's day).
      if (festival.id === 'olympic-games' && atticInfo?.olympicPeak) {
        const offset = Math.round((utcOf(isoDate) - utcOf(atticInfo.olympicPeak)) / DAY_MS);
        if (Math.abs(offset) <= 2) hits.push({ festival, day: offset + 3, of: 5 });
      }
      if (festival.id === 'olympic-games') continue;
      // Non-Olympic games: fall through to attic/conventional when present.
    }
    if (atticInfo && festival.atticDate) {
      const [start, end = start] = festival.atticDate.days;
      if (atticInfo.month === festival.atticDate.month && atticInfo.day >= start && atticInfo.day <= end) {
        hits.push({ festival, day: atticInfo.day - start + 1, of: end - start + 1 });
      }
      continue; // day-precise festivals never also fire on conventional dates
    }
    if (!atticInfo || !festival.atticDate) {
      const context = conventionalContext(festival, monthDay);
      if (context) hits.push(context);
    }
  }

  hits.sort((a, b) => a.festival.id.localeCompare(b.festival.id));
  return hits[0] ?? null;
}

export interface UpcomingFestival {
  context: FestivalContext;
  isoDate: string;
  /** Whole days from the reference day (1 = tomorrow). */
  inDays: number;
}

/** The next opening day of ONE festival — the Heortologion's countdown
 *  chips. Games need a long horizon (the next Olympiad can be four summers
 *  out); callers pass it explicitly. */
export function nextOccurrenceOf(
  festival: EphemerisFestival,
  fromDayIndex: number,
  attic: AtticCalendar | null,
  horizonDays = 1500,
): UpcomingFestival | null {
  for (let offset = 1; offset <= horizonDays; offset++) {
    const isoDate = isoDateAtIndex(fromDayIndex + offset);
    const context = festivalOn([festival], isoDate, attic);
    if (context && context.day === 1) return { context, isoDate, inDays: offset };
  }
  return null;
}

/** The next festival OPENING day strictly after the given day — the card's
 *  "next feast" line, which keeps the calendar layer visible between the
 *  feasts themselves (twelfth UX review). */
export function nextFestival(
  festivals: EphemerisFestival[],
  fromDayIndex: number,
  attic: AtticCalendar | null,
  horizonDays = 400,
): UpcomingFestival | null {
  for (let offset = 1; offset <= horizonDays; offset++) {
    const isoDate = isoDateAtIndex(fromDayIndex + offset);
    const context = festivalOn(festivals, isoDate, attic);
    if (context && context.day === 1) return { context, isoDate, inDays: offset };
  }
  return null;
}
