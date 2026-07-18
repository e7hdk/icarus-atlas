/** Day selection (docs/EPHEMERIS_PLAN.md §4).
 *
 *  The roster is dealt like a deck: one deterministic Fisher–Yates shuffle per
 *  cycle (seed = cycle index), walked one star per day. No star repeats until
 *  the whole deck has been played (~15 months at today's pool). A deploy that
 *  changes the roster re-deals the live cycle — accepted (D3); the golden
 *  sequence in scripts/validate-ephemeris.ts makes that deliberate, not silent. */

import { hashString, mulberry32 } from '@/lib/prng';
import { isoDateAtIndex } from './calendar';
import { festivalOn } from './festivals';
import { weekContextFor, weekDayPickId } from './weeks';
import type { DayPick, EphemerisData } from '@/types/spotlight';

/** Deterministic Fisher–Yates — same seed, same deck, on every machine. */
function shuffled(ids: readonly string[], seed: string): string[] {
  const rng = mulberry32(hashString(seed));
  const deck = [...ids];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Floored division / positive modulo — dayIndex may be negative before the epoch. */
const floorDiv = (a: number, n: number) => Math.floor(a / n);
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** The cycle pick for a day: position dayIndex mod N in the cycle's deck. */
export function cyclePickId(rosterIds: readonly string[], dayIndex: number): string {
  const cycle = floorDiv(dayIndex, rosterIds.length);
  const deck = shuffled(rosterIds, `ephemeris-cycle-${cycle}`);
  return deck[mod(dayIndex, rosterIds.length)];
}

/** One day resolved under the D7 precedence: festival > curated week day >
 *  auto week day > daily cycle. `avoid` implements the repeat-breaker:
 *  era-neighbour sagas share casts (cosmogony hands Cronus to the reign of
 *  Cronus), so without it the same star could headline two days running.
 *  Festival takeovers deliberately ignore `avoid` — the ancient calendar
 *  outranks freshness — and multi-day festivals rotate through their deities
 *  (Thargelia: Artemis on the 6th, Apollo on the 7th); later days of a
 *  single-deity festival keep the festival line as ambience while the week
 *  or cycle supplies the star. */
function resolve(
  data: EphemerisData,
  stamp: { isoDate: string; dayIndex: number },
  avoid: string | null,
): DayPick | null {
  if (data.roster.length === 0) return null;

  const rosterIds = new Set(data.roster.map((entry) => entry.id));

  const festivalContext = festivalOn(data.festivals, stamp.isoDate, data.attic);
  const festivalMeta = festivalContext
    ? {
        id: festivalContext.festival.id,
        name: festivalContext.festival.name,
        day: festivalContext.day,
        of: festivalContext.of,
      }
    : undefined;
  if (festivalContext && festivalMeta) {
    const deity = festivalContext.festival.deities[festivalContext.day - 1];
    if (deity && rosterIds.has(deity)) {
      return {
        id: deity,
        reason: 'festival',
        isoDate: stamp.isoDate,
        dayIndex: stamp.dayIndex,
        festival: festivalMeta,
      };
    }
  }

  const week = weekContextFor(data, stamp.isoDate);
  if (week) {
    const weekPick = (id: string): DayPick => ({
      id,
      reason: 'week',
      isoDate: stamp.isoDate,
      dayIndex: stamp.dayIndex,
      week: {
        storyId: week.saga.storyId,
        title: week.saga.title,
        day: week.dayOfWeek + 1,
        of: 7,
      },
      ...(festivalMeta ? { festival: festivalMeta } : {}),
    });
    const candidate = weekDayPickId(week, rosterIds);
    if (candidate && candidate !== avoid) return weekPick(candidate);
    if (candidate && candidate === avoid) {
      // Step forward along the cast to the next fresh member; a cast with no
      // fresh member left falls through to the cycle.
      for (let index = week.dayOfWeek + 1; index < week.saga.cast.length; index++) {
        const next = week.saga.cast[index];
        if (next && next !== avoid && rosterIds.has(next)) return weekPick(next);
      }
    }
  }

  const id = cyclePickId(
    data.roster.map((entry) => entry.id),
    stamp.dayIndex,
  );
  return {
    id,
    reason: 'cycle',
    isoDate: stamp.isoDate,
    dayIndex: stamp.dayIndex,
    ...(festivalMeta ? { festival: festivalMeta } : {}),
  };
}

/** The repeat-breaker chains: today's avoid is yesterday's *shown* star,
 *  which itself depended on the day before. Folding from a fixed horizon
 *  keeps that chain identical on every machine — everyone folds the same
 *  window, so everyone shows the same star — while making a same-star-twice
 *  day practically impossible. A skip cascades at most a few slots (the week
 *  still walks its cast in order, shifted by one). */
const DEDUPE_HORIZON_DAYS = 14;

/** Today's star. `stamp.isoDate` must be a real calendar date — the week
 *  resolver reads its ISO week. Null only on an empty roster. */
export function selectDay(
  data: EphemerisData,
  stamp: { isoDate: string; dayIndex: number },
): DayPick | null {
  let avoid: string | null = null;
  let pick: DayPick | null = null;
  for (let index = stamp.dayIndex - DEDUPE_HORIZON_DAYS; index <= stamp.dayIndex; index++) {
    pick = resolve(data, { isoDate: isoDateAtIndex(index), dayIndex: index }, avoid);
    avoid = pick?.id ?? null;
  }
  return pick ? { ...pick, isoDate: stamp.isoDate } : null;
}
