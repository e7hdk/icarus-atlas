/** The Ephemeris clock — every date decision flows through here, nowhere else.
 *
 *  The day flips at midnight in Athens (docs/EPHEMERIS_PLAN.md D1): uniform
 *  for every visitor and pleasingly thematic. All functions take `now` as an
 *  argument so they stay pure and validator-testable; only the client host
 *  ever calls them with a live clock. */

export const EPHEMERIS_EPOCH = '2026-01-01';
export const EPHEMERIS_TIME_ZONE = 'Europe/Athens';

/** en-CA renders YYYY-MM-DD, which is exactly the ISO date we want. */
const athensDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: EPHEMERIS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const athensClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: EPHEMERIS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const DAY_MS = 86_400_000;

/** The Athens calendar date of `now`, as YYYY-MM-DD. */
export function athensIsoDate(now: Date): string {
  return athensDay.format(now);
}

function utcMidnightOf(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole days between the Athens calendar date of `now` and the epoch.
 *  The subtraction happens between UTC midnights of plain calendar dates, so
 *  DST transitions can never produce a fractional day. Negative before the
 *  epoch — the selection math is total over all integers. */
export function athensDayIndex(now: Date): number {
  return Math.round((utcMidnightOf(athensIsoDate(now)) - utcMidnightOf(EPHEMERIS_EPOCH)) / DAY_MS);
}

/** Convenience stamp for a selection run. */
export function athensDayStamp(now: Date): { isoDate: string; dayIndex: number } {
  return { isoDate: athensIsoDate(now), dayIndex: athensDayIndex(now) };
}

/** The Athens calendar date `dayIndex` whole days after the epoch. */
export function isoDateAtIndex(dayIndex: number): string {
  const [year, month, day] = EPHEMERIS_EPOCH.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + dayIndex)).toISOString().slice(0, 10);
}

/** Inverse of isoDateAtIndex — the day index of a plain calendar date
 *  (the ?when= time machine rides on this). */
export function dayIndexOfIso(isoDate: string): number {
  return Math.round((utcMidnightOf(isoDate) - utcMidnightOf(EPHEMERIS_EPOCH)) / DAY_MS);
}

/** Monday-first day of week (0 = Monday … 6 = Sunday) of a calendar date. */
export function dayOfWeekMon0(isoDate: string): number {
  return (new Date(utcMidnightOf(isoDate)).getUTCDay() + 6) % 7;
}

/** ISO-8601 week id ("2026-W28"), year-crossing safe via the Thursday rule:
 *  a date belongs to the week-year of its week's Thursday. */
export function isoWeekId(isoDate: string): string {
  const thursday = new Date(utcMidnightOf(isoDate) + (3 - dayOfWeekMon0(isoDate)) * DAY_MS);
  const isoYear = thursday.getUTCFullYear();
  const jan4 = Date.UTC(isoYear, 0, 4);
  const jan4DayOfWeek = (new Date(jan4).getUTCDay() + 6) % 7;
  const week1Thursday = jan4 + (3 - jan4DayOfWeek) * DAY_MS;
  const week = 1 + Math.round((thursday.getTime() - week1Thursday) / (7 * DAY_MS));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Whole ISO weeks between a date's week and the epoch's week — drives the
 *  auto saga rotation (docs/EPHEMERIS_PLAN.md D4). Negative before the epoch. */
export function weekIndexOf(isoDate: string): number {
  const mondayOf = (iso: string) => utcMidnightOf(iso) - dayOfWeekMon0(iso) * DAY_MS;
  return Math.round((mondayOf(isoDate) - mondayOf(EPHEMERIS_EPOCH)) / (7 * DAY_MS));
}

/** Milliseconds until the next Athens midnight, plus a small buffer so the
 *  re-armed timer lands safely inside the new day. Around a DST shift the
 *  estimate can be off by an hour — harmless, because the host recomputes the
 *  pick and re-arms from a fresh clock every time the timer fires. */
export function msUntilNextAthensMidnight(now: Date): number {
  const [hour, minute, second] = athensClock
    .format(now)
    .split(':')
    .map((part) => Number(part));
  const elapsed = (hour * 3600 + minute * 60 + second) * 1000;
  return Math.max(1000, DAY_MS - elapsed) + 1500;
}
