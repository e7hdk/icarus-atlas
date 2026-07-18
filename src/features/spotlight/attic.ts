/** Reading the reconstructed Attic calendar (docs/EPHEMERIS_PLAN.md M12.5).
 *  Pure lookups over the baked table — the UI must always append the
 *  "reconstructed" label to anything shown from here. */

import type {
  AtticCalendar,
  AtticCalendarMonthName,
  SacredDay,
} from '@/types/spotlight';

const DAY_MS = 86_400_000;

export const MONTH_DISPLAY: Record<AtticCalendarMonthName, string> = {
  hekatombaion: 'Hekatombaion',
  metageitnion: 'Metageitnion',
  boedromion: 'Boedromion',
  pyanepsion: 'Pyanepsion',
  maimakterion: 'Maimakterion',
  poseideon: 'Poseideon',
  'poseideon-ii': 'Poseideon II',
  gamelion: 'Gamelion',
  anthesterion: 'Anthesterion',
  elaphebolion: 'Elaphebolion',
  mounichion: 'Mounichion',
  thargelion: 'Thargelion',
  skirophorion: 'Skirophorion',
};

export interface AtticDayInfo {
  month: AtticCalendarMonthName;
  /** 1-based day within the month. */
  day: number;
  atticYear: string;
  /** Display line, e.g. "12 Anthesterion". */
  label: string;
  /** The games peak of this Attic year, when it is an Olympiad year. */
  olympicPeak?: string;
}

function utcOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The Attic date of a Gregorian day, or null outside the baked table. */
export function atticDateFor(attic: AtticCalendar | null, isoDate: string): AtticDayInfo | null {
  if (!attic) return null;
  const stamp = utcOf(isoDate);
  for (let yearIndex = 0; yearIndex < attic.years.length; yearIndex++) {
    const year = attic.years[yearIndex];
    const nextYearStart = attic.years[yearIndex + 1]?.months[0]?.start;
    if (stamp < utcOf(year.months[0].start)) return null; // before the table
    if (nextYearStart && stamp >= utcOf(nextYearStart)) continue;
    for (let monthIndex = year.months.length - 1; monthIndex >= 0; monthIndex--) {
      const month = year.months[monthIndex];
      const start = utcOf(month.start);
      if (stamp < start) continue;
      const day = Math.round((stamp - start) / DAY_MS) + 1;
      if (day > 30) return null; // past the table's last month
      return {
        month: month.name,
        day,
        atticYear: year.atticYear,
        label: `${day} ${MONTH_DISPLAY[month.name]}`,
        olympicPeak: year.olympicPeak,
      };
    }
  }
  return null;
}

/** The monthly sacred day of an Attic day-number, when one is recorded. */
export function sacredDayFor(sacredDays: SacredDay[], day: number): SacredDay | null {
  return sacredDays.find((sacred) => sacred.day === day) ?? null;
}
