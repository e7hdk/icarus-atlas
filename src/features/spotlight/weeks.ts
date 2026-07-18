/** The constellation of the week (docs/EPHEMERIS_PLAN.md D4).
 *
 *  Every ISO week tells one saga: the auto rotation walks the era-ordered
 *  top-level sagas — the year moves through mythic time, cosmogony toward the
 *  returns — and day N of the week features the saga's Nth eligible cast
 *  member in narrative order. A curated entry in data/spotlight/weeks.json
 *  overrides the whole week and may pin specific stars to specific days.
 *  Anything unresolvable falls through to the daily cycle (D7). */

import { dayOfWeekMon0, isoWeekId, weekIndexOf } from './calendar';
import {
  WEEK_DAY_KEYS,
  type EphemerisCuratedWeek,
  type EphemerisData,
  type EphemerisWeekSaga,
} from '@/types/spotlight';

/** A saga needs at least this many eligible cast members to carry a week. */
export const WEEK_MIN_CAST = 4;

export interface WeekContext {
  saga: EphemerisWeekSaga;
  isoWeek: string;
  /** 0 = Monday … 6 = Sunday. */
  dayOfWeek: number;
  curated: EphemerisCuratedWeek | null;
}

export function weekContextFor(data: EphemerisData, isoDate: string): WeekContext | null {
  const isoWeek = isoWeekId(isoDate);
  const dayOfWeek = dayOfWeekMon0(isoDate);
  const curated = data.weeks.curated.find((week) => week.isoWeek === isoWeek) ?? null;
  if (curated) return { saga: curated, isoWeek, dayOfWeek, curated };
  if (data.weeks.sagas.length === 0) return null;
  const count = data.weeks.sagas.length;
  const index = ((weekIndexOf(isoDate) % count) + count) % count;
  return { saga: data.weeks.sagas[index], isoWeek, dayOfWeek, curated: null };
}

/** The week's pick for a day, or null to fall through to the cycle:
 *  curated day pin first, then the saga cast in narrative order. */
export function weekDayPickId(
  context: WeekContext,
  rosterIds: ReadonlySet<string>,
): string | null {
  const pinned = context.curated?.days?.[WEEK_DAY_KEYS[context.dayOfWeek]];
  if (pinned && rosterIds.has(pinned)) return pinned;
  const castPick = context.saga.cast[context.dayOfWeek];
  return castPick && rosterIds.has(castPick) ? castPick : null;
}
