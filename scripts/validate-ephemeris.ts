/** Validates the Ephemeris engine. Run with: pnpm validate-ephemeris
 *
 * Contract (docs/EPHEMERIS_PLAN.md §4 and §8):
 *   eligibility — hasCulture || (degree >= SPOTLIGHT_MIN_DEGREE && casts >= SPOTLIGHT_MIN_CASTS),
 *                 pins always in, exclusions always out
 *   calendar    — the day flips at Athens midnight, DST-proof
 *   determinism — same date, same star, on every machine
 *   cycle       — one permutation per cycle, every roster member exactly once
 *   golden      — the first picks from the epoch are pinned below; any drift
 *                 (roster change, algorithm change) must be a deliberate,
 *                 reviewed update of GOLDEN_SEQUENCE in the same change
 *
 * Refresh the golden sequence intentionally with:
 *   pnpm validate-ephemeris --print-golden
 */

import { buildCardPayload, buildEphemerisData } from '../src/features/spotlight/build';
import {
  athensDayStamp,
  dayOfWeekMon0,
  EPHEMERIS_EPOCH,
  isoDateAtIndex,
  isoWeekId,
} from '../src/features/spotlight/calendar';
import { atticDateFor } from '../src/features/spotlight/attic';
import { nextFestival } from '../src/features/spotlight/festivals';
import { buildRoster } from '../src/features/spotlight/eligibility';
import { buildOracle } from '../src/features/spotlight/oracle';
import { buildProemScript } from '../src/features/spotlight/proem';
import { cyclePickId, selectDay } from '../src/features/spotlight/selection';
import { weekContextFor, weekDayPickId } from '../src/features/spotlight/weeks';
import type { EphemerisData } from '../src/types/spotlight';

const GOLDEN_DAYS = 14;

/** First GOLDEN_DAYS picks from EPHEMERIS_EPOCH — see the refresh note above.
 *  Refreshed for M12.5: with the reconstructed Attic calendar live, the
 *  Lenaia moved to its real lunar dates (12–15 Gamelion 2025/26 = Jan 30 –
 *  Feb 2) and left the golden window — the sequence is the pure cosmogony
 *  walk again.
 *  Refreshed 2026-07-18: the M13.1 Nostos micro-batch (mentor-ithaca,
 *  argos-dog — docs/ODYSSEY.md §6) grew the roster to 1486; the permutation
 *  reseeded, erebus entered the window and gigantes slid past its edge. */
const GOLDEN_SEQUENCE: string[] = [
  'tartarus',
  'eros',
  'nyx',
  'erebus',
  'cronus',
  'uranus',
  'gaia',
  'rhea',
  'zeus',
  'aphrodite',
  'erinyes',
  'zeus',
  'cronus',
  'rhea',
];

const errors: string[] = [];

function pickAt(data: Awaited<ReturnType<typeof buildEphemerisData>>, dayIndex: number): string {
  const pick = selectDay(data, { isoDate: isoDateAtIndex(dayIndex), dayIndex });
  if (!pick) throw new Error('empty roster — the Ephemeris has no sky to deal');
  return pick.id;
}

async function main() {
  const data = await buildEphemerisData();
  const rosterIds = data.roster.map((entry) => entry.id);
  const rosterSet = new Set(rosterIds);

  // 1. Eligibility probes (docs/EPHEMERIS_PLAN.md D2). If an edit to the rule,
  //    the data, or spotlight.json moves one of these, that must be deliberate.
  for (const id of ['icarus', 'odysseus', 'machaon']) {
    if (!rosterSet.has(id)) errors.push(`probe: "${id}" must be spotlight-eligible`);
  }
  for (const id of ['amycus-centaur', 'taras-hero']) {
    if (rosterSet.has(id)) errors.push(`probe: "${id}" must NOT be spotlight-eligible`);
  }
  const sorted = [...rosterIds].sort((a, b) => a.localeCompare(b));
  if (rosterIds.join('\n') !== sorted.join('\n')) {
    errors.push('roster must be sorted by id (the permutation base order)');
  }

  // 2. Overrides semantics on a synthetic fixture: exclusion beats culture,
  //    a pin admits a figure the rule alone would drop.
  const fixtureRoster = buildRoster({
    characters: [
      { id: 'aa-cultured', name: 'Aa', type: 'god' },
      { id: 'bb-woven', name: 'Bb', type: 'hero' },
      { id: 'cc-faint', name: 'Cc', type: 'mortal' },
    ],
    relations: [
      { from: 'bb-woven', to: 'aa-cultured' },
      { from: 'bb-woven', to: 'cc-faint' },
      { from: 'cc-faint', to: 'bb-woven' },
      { from: 'aa-cultured', to: 'bb-woven' },
    ],
    stories: [
      { cast: [{ id: 'bb-woven' }] },
      { cast: [{ id: 'bb-woven' }, { id: 'cc-faint' }] },
    ],
    cultureIds: new Set(['aa-cultured']),
    overrides: { pins: ['cc-faint'], exclusions: ['aa-cultured'] },
  }).map((entry) => entry.id);
  if (fixtureRoster.join(',') !== 'bb-woven,cc-faint') {
    errors.push(`override fixture expected [bb-woven, cc-faint], got [${fixtureRoster.join(', ')}]`);
  }

  // 3. Calendar: the day flips at Athens midnight in both winter (UTC+2) and
  //    summer (UTC+3), never at UTC midnight.
  const calendarChecks: [string, number][] = [
    ['2026-01-01T10:00:00Z', 0],
    ['2025-12-31T23:00:00Z', 0], // 01:00 Jan 1 in Athens
    ['2026-01-01T21:59:00Z', 0], // 23:59 Jan 1 in Athens
    ['2026-01-01T22:01:00Z', 1], // 00:01 Jan 2 in Athens
    ['2026-07-11T20:59:00Z', 191], // 23:59 Jul 11 in Athens (DST)
    ['2026-07-11T21:01:00Z', 192], // 00:01 Jul 12 in Athens (DST)
  ];
  for (const [instant, expected] of calendarChecks) {
    const stamp = athensDayStamp(new Date(instant));
    if (stamp.dayIndex !== expected) {
      errors.push(`calendar: ${instant} should be dayIndex ${expected}, got ${stamp.dayIndex}`);
    }
  }
  // ISO weeks, including the year-crossing edges (2026 is a 53-week ISO year).
  const isoWeekChecks: [string, string][] = [
    ['2026-01-01', '2026-W01'],
    ['2025-12-29', '2026-W01'], // the Monday of the epoch's week
    ['2026-07-11', '2026-W28'],
    ['2026-12-28', '2026-W53'],
    ['2027-01-01', '2026-W53'],
  ];
  for (const [date, expected] of isoWeekChecks) {
    const got = isoWeekId(date);
    if (got !== expected) errors.push(`calendar: isoWeekId(${date}) should be ${expected}, got ${got}`);
  }

  // 3b. The constellation of the week (docs/EPHEMERIS_PLAN.md D4): the epoch's
  //     ISO week walks the first saga's cast in narrative order, Monday first;
  //     days past the cast fall through to the cycle.
  if (data.weeks.sagas.length === 0) {
    errors.push('weeks: no eligible sagas — the rotation has no fuel');
  } else {
    const firstSaga = data.weeks.sagas[0];
    const epochMondayIndex = -dayOfWeekMon0(EPHEMERIS_EPOCH);
    for (let day = 0; day < 7; day++) {
      const dayIndex = epochMondayIndex + day;
      const pick = selectDay(data, { isoDate: isoDateAtIndex(dayIndex), dayIndex });
      if (!pick) continue;
      if (day < firstSaga.cast.length) {
        // Exact slot, or a documented repeat-breaker forward-skip within the
        // cast, or the cycle when no fresh cast member remained.
        const slotOk =
          pick.reason === 'week' &&
          (pick.id === firstSaga.cast[day] || firstSaga.cast.slice(day).includes(pick.id));
        if (!slotOk && pick.reason !== 'cycle') {
          errors.push(
            `weeks: epoch week day ${day} should walk "${firstSaga.storyId}" cast (slot ${firstSaga.cast[day]}), got ${pick.reason}/${pick.id}`,
          );
        }
      } else if (pick.reason !== 'cycle') {
        errors.push(`weeks: epoch week day ${day} is past the cast and should fall to the cycle`);
      }
    }
  }

  // 3c. Curated weeks (pure layer, chain-free): a synthetic entry overrides
  //     the auto rotation, its day pins win over the cast, and days past both
  //     cast and pins resolve to null (the fall-through to the cycle).
  {
    const fixture: EphemerisData = {
      roster: ['aa', 'bb', 'cc', 'dd'].map((id) => ({ id, name: id.toUpperCase(), type: 'god' })),
      weeks: {
        sagas: [{ storyId: 'auto-saga', title: 'Auto', cast: ['aa', 'bb', 'cc', 'dd'] }],
        curated: [
          {
            isoWeek: isoWeekId(EPHEMERIS_EPOCH),
            storyId: 'curated-saga',
            title: 'Curated',
            cast: ['cc', 'aa'],
            days: { thu: 'bb' },
          },
        ],
      },
      festivals: [],
      attic: null,
      sacredDays: [],
    };
    const rosterSetFixture = new Set(fixture.roster.map((entry) => entry.id));
    const thursday = weekContextFor(fixture, EPHEMERIS_EPOCH);
    if (!thursday?.curated || thursday.saga.title !== 'Curated') {
      errors.push('weeks: curated entry should override the auto rotation for its ISO week');
    } else {
      if (weekDayPickId(thursday, rosterSetFixture) !== 'bb') {
        errors.push('weeks: curated day pin should win over the cast');
      }
      const friday = weekContextFor(fixture, isoDateAtIndex(1));
      if (friday && weekDayPickId(friday, rosterSetFixture) !== null) {
        errors.push('weeks: a curated day past cast and pins should fall through to the cycle');
      }
      const monday = weekContextFor(fixture, isoDateAtIndex(-3));
      if (monday && weekDayPickId(monday, rosterSetFixture) !== 'cc') {
        errors.push('weeks: an unpinned curated day should walk the curated cast');
      }
    }
  }

  // 3d. Live curated entries: every pinned day must be in the roster.
  for (const week of data.weeks.curated) {
    for (const [day, id] of Object.entries(week.days ?? {})) {
      if (id && !rosterSet.has(id)) {
        errors.push(`weeks: curated ${week.isoWeek} pins "${id}" on ${day}, which is not spotlight-eligible`);
      }
    }
  }

  // 3e. Festivals (docs/EPHEMERIS_PLAN.md M12.4). Synthetic fixture: day 1
  //     takes the first deity, multi-deity windows rotate, later days of a
  //     single-deity window are ambience only (the star comes from the week
  //     or cycle, the festival line stays).
  {
    const fixture: EphemerisData = {
      roster: ['aa', 'bb', 'cc', 'dd'].map((id) => ({ id, name: id.toUpperCase(), type: 'god' })),
      weeks: { sagas: [{ storyId: 's', title: 'S', cast: ['aa', 'bb', 'cc', 'dd'] }], curated: [] },
      festivals: [
        { id: 'two-day', name: 'Two-Day', deities: ['cc', 'dd'], conventionalDates: ['01-01', '01-02'], atticDate: null, place: null },
        { id: 'long', name: 'Long', deities: ['aa'], conventionalDates: ['01-05', '01-06', '01-07'], atticDate: null, place: null },
      ],
      attic: null,
      sacredDays: [],
    };
    const dayOne = selectDay(fixture, { isoDate: EPHEMERIS_EPOCH, dayIndex: 0 });
    if (dayOne?.reason !== 'festival' || dayOne.id !== 'cc' || dayOne.festival?.day !== 1) {
      errors.push(`festivals: day 1 should take the first deity (expected cc, got ${dayOne?.reason}/${dayOne?.id})`);
    }
    const dayTwo = selectDay(fixture, { isoDate: isoDateAtIndex(1), dayIndex: 1 });
    if (dayTwo?.reason !== 'festival' || dayTwo.id !== 'dd' || dayTwo.festival?.day !== 2) {
      errors.push(`festivals: multi-deity windows should rotate (expected dd, got ${dayTwo?.reason}/${dayTwo?.id})`);
    }
    const ambience = selectDay(fixture, { isoDate: isoDateAtIndex(5), dayIndex: 5 });
    if (ambience?.reason === 'festival' || ambience?.festival?.id !== 'long' || ambience.festival.day !== 2) {
      errors.push(
        `festivals: later single-deity days should be ambience only (got ${ambience?.reason}, festival ${ambience?.festival?.id}/${ambience?.festival?.day})`,
      );
    }
  }

  // 3f. Live festivals: a dated festival whose opening deity fell out of the
  //     spotlight pool would silently never take its day.
  for (const festival of data.festivals) {
    if (festival.conventionalDates.length === 0 && !festival.atticDate && !festival.gamesCycle) continue;
    if (!rosterSet.has(festival.deities[0])) {
      errors.push(`festivals: "${festival.id}" opens with "${festival.deities[0]}", which is not spotlight-eligible`);
    }
  }
  if (!nextFestival(data.festivals, 0, data.attic)) {
    errors.push('festivals: no festival opens within 400 days of the epoch — the "next feast" line would go dark');
  }

  // 3g. The reconstructed Attic calendar (docs/EPHEMERIS_PLAN.md M12.5):
  //     structural sanity of the baked table, then a precise fixture pass on
  //     the attic-first festival resolver.
  if (!data.attic) {
    errors.push('attic: data/generated/attic-calendar.json missing — run pnpm bake-attic-calendar');
  } else {
    let previousStart = '';
    for (const year of data.attic.years) {
      if (year.months.length !== 12 && year.months.length !== 13) {
        errors.push(`attic ${year.atticYear}: ${year.months.length} months`);
      }
      if (year.months.length === 13 && year.months[6]?.name !== 'poseideon-ii') {
        errors.push(`attic ${year.atticYear}: intercalary month must be poseideon-ii in position 7`);
      }
      if (year.months[0]?.name !== 'hekatombaion') {
        errors.push(`attic ${year.atticYear}: the year must open with hekatombaion`);
      }
      for (const month of year.months) {
        if (previousStart && month.start <= previousStart) {
          errors.push(`attic ${year.atticYear}: month starts not strictly increasing at ${month.start}`);
        }
        if (previousStart) {
          const length = Math.round(
            (Date.parse(`${month.start}T00:00:00Z`) - Date.parse(`${previousStart}T00:00:00Z`)) / 86_400_000,
          );
          if (length < 29 || length > 30) {
            errors.push(`attic: month before ${month.start} runs ${length} days`);
          }
        }
        previousStart = month.start;
      }
    }
    const today = atticDateFor(data.attic, '2026-07-11');
    if (!today) errors.push('attic: 2026-07-11 must resolve inside the baked table');

    const atticFixture: EphemerisData = {
      roster: ['aa', 'bb', 'cc', 'dd'].map((id) => ({ id, name: id.toUpperCase(), type: 'god' })),
      weeks: { sagas: [], curated: [] },
      festivals: [
        {
          id: 'attic-feast',
          name: 'Attic Feast',
          deities: ['cc', 'dd'],
          conventionalDates: ['01-20'],
          atticDate: { month: 'hekatombaion', days: [3, 4] },
          place: null,
        },
        {
          id: 'dayless',
          name: 'Dayless',
          deities: ['bb'],
          conventionalDates: ['01-10'],
          atticDate: null,
          place: null,
        },
      ],
      attic: {
        convention: 'fixture',
        engine: 'fixture',
        years: [
          {
            atticYear: 'fixture',
            months: [
              { name: 'hekatombaion', start: '2026-01-01' },
              { name: 'metageitnion', start: '2026-01-30' },
            ],
          },
        ],
      },
      sacredDays: [],
    };
    const feastOne = selectDay(atticFixture, { isoDate: '2026-01-03', dayIndex: 2 });
    if (feastOne?.reason !== 'festival' || feastOne.id !== 'cc' || feastOne.festival?.day !== 1) {
      errors.push(`attic: day-precise festival should fire on 3 Hekatombaion (got ${feastOne?.reason}/${feastOne?.id})`);
    }
    const feastTwo = selectDay(atticFixture, { isoDate: '2026-01-04', dayIndex: 3 });
    if (feastTwo?.reason !== 'festival' || feastTwo.id !== 'dd') {
      errors.push(`attic: day-precise festival should rotate deities on 4 Hekatombaion (got ${feastTwo?.id})`);
    }
    const noConventional = selectDay(atticFixture, { isoDate: '2026-01-20', dayIndex: 19 });
    if (noConventional?.festival?.id === 'attic-feast') {
      errors.push('attic: a day-precise festival must not also fire on its conventional date');
    }
    const dayless = selectDay(atticFixture, { isoDate: '2026-01-10', dayIndex: 9 });
    if (dayless?.reason !== 'festival' || dayless.id !== 'bb') {
      errors.push(`attic: day-less festivals keep conventional placements (got ${dayless?.reason}/${dayless?.id})`);
    }
  }

  // 4. Determinism: two independent 60-day runs agree.
  const runA = Array.from({ length: 60 }, (_, day) => pickAt(data, day));
  const runB = Array.from({ length: 60 }, (_, day) => pickAt(data, day));
  if (runA.join('\n') !== runB.join('\n')) {
    errors.push('determinism: two identical 60-day runs disagreed');
  }

  // 5. Cycle coverage: one full cycle visits every roster member exactly once,
  //    and the next cycle deals a different deck.
  const cycle = new Set<string>();
  for (let day = 0; day < rosterIds.length; day++) cycle.add(cyclePickId(rosterIds, day));
  if (cycle.size !== rosterIds.length) {
    errors.push(`cycle: expected ${rosterIds.length} distinct picks in one cycle, got ${cycle.size}`);
  }
  if (cyclePickId(rosterIds, 0) === cyclePickId(rosterIds, rosterIds.length) &&
      cyclePickId(rosterIds, 1) === cyclePickId(rosterIds, rosterIds.length + 1)) {
    errors.push('cycle: the second cycle deck looks identical to the first — reshuffle seed broken');
  }

  // 5b. The Daily Oracle (docs/EPHEMERIS_PLAN.md §11): deterministic, one
  //     correct option, sane option counts — probed on the eligibility ids.
  for (const id of ['icarus', 'odysseus', 'machaon']) {
    const payload = await buildCardPayload(id);
    if (!payload) continue; // probe 1 already reports missing ids
    const first = buildOracle(payload, data, EPHEMERIS_EPOCH);
    const second = buildOracle(payload, data, EPHEMERIS_EPOCH);
    if (JSON.stringify(first) !== JSON.stringify(second)) {
      errors.push(`oracle [${id}]: two identical builds disagreed`);
    }
    if (first.length < 1 || first.length > 3) {
      errors.push(`oracle [${id}]: expected 1-3 questions, got ${first.length}`);
    }
    for (const question of first) {
      if (question.options.length < 2 || question.options.length > 4) {
        errors.push(`oracle [${id}/${question.kind}]: ${question.options.length} options`);
      }
      if (new Set(question.options).size !== question.options.length) {
        errors.push(`oracle [${id}/${question.kind}]: duplicate options`);
      }
      if (!question.options[question.correctIndex]) {
        errors.push(`oracle [${id}/${question.kind}]: correctIndex out of range`);
      }
      if (!question.prompt) {
        errors.push(`oracle [${id}/${question.kind}]: empty prompt`);
      }
    }
  }

  // 6. Golden sequence.
  const golden = Array.from({ length: GOLDEN_DAYS }, (_, day) => pickAt(data, day));
  if (process.argv.includes('--print-golden')) {
    console.log('const GOLDEN_SEQUENCE: string[] = [');
    for (const id of golden) console.log(`  '${id}',`);
    console.log('];');
    return;
  }
  if (GOLDEN_SEQUENCE.length !== GOLDEN_DAYS || golden.join('\n') !== GOLDEN_SEQUENCE.join('\n')) {
    errors.push(
      'golden sequence drifted — if the roster or algorithm change is intentional, refresh GOLDEN_SEQUENCE via `pnpm validate-ephemeris --print-golden`',
    );
    for (let day = 0; day < GOLDEN_DAYS; day++) {
      const expected = GOLDEN_SEQUENCE[day] ?? '(missing)';
      if (expected !== golden[day]) {
        errors.push(`  day ${day} (${isoDateAtIndex(day)}): expected "${expected}", got "${golden[day]}"`);
      }
    }
  }

  // 7. The Proem (docs/EPHEMERIS_PLAN.md §6): a script must build for EVERY
  //    eligible star — invocation first, a telling always present, thread
  //    capped at three lit edges, quarrels with at least two variants, traces
  //    with Commons https urls. Beats 4-5 may drop; a sixth beat may not.
  let fullProems = 0;
  const PROEM_BATCH = 32;
  for (let start = 0; start < rosterIds.length; start += PROEM_BATCH) {
    const scripts = await Promise.all(
      rosterIds.slice(start, start + PROEM_BATCH).map(async (id) => {
        const payload = await buildCardPayload(id);
        return { id, payload, script: payload ? buildProemScript(payload) : null };
      }),
    );
    for (const { id, payload, script } of scripts) {
      if (!payload || !script) {
        errors.push(`proem: payload/script failed to build for "${id}"`);
        continue;
      }
      if (script.beats.length > 5) errors.push(`proem [${id}]: more than five beats`);
      if (script.beats[0]?.kind !== 'invocation') {
        errors.push(`proem [${id}]: must open with the invocation`);
      } else if (!script.beats[0].line.includes(payload.name.toUpperCase())) {
        errors.push(`proem [${id}]: invocation must name the star`);
      }
      const telling = script.beats.find((beat) => beat.kind === 'telling');
      if (!telling || telling.kind !== 'telling' || telling.summary.length === 0) {
        errors.push(`proem [${id}]: telling beat missing or empty`);
      }
      for (const beat of script.beats) {
        if (beat.kind === 'thread') {
          if (beat.steps.length === 0 || beat.steps.length > 3) {
            errors.push(`proem [${id}]: thread must light 1-3 edges, got ${beat.steps.length}`);
          }
          for (const bond of beat.steps) {
            if (!bond.otherName || !bond.label) errors.push(`proem [${id}]: unnamed thread step`);
          }
        }
        if (beat.kind === 'quarrel' && beat.variants.length < 2) {
          errors.push(`proem [${id}]: quarrel needs at least two variants`);
        }
        if (beat.kind === 'trace' && !beat.artwork.imageUrl.startsWith('https://')) {
          errors.push(`proem [${id}]: trace artwork must be an https url`);
        }
      }
      if (script.beats.length === 5) fullProems++;
    }
  }

  console.log(
    `Roster: ${rosterIds.length} eligible of the full sky · cycle length ${rosterIds.length} days · epoch ${EPHEMERIS_EPOCH} (Athens) · weekly sagas: ${data.weeks.sagas.length} · curated weeks: ${data.weeks.curated.length} · festivals: ${data.festivals.length} · full five-beat proems: ${fullProems}/${rosterIds.length}`,
  );
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s):`);
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }
  console.log('\nEphemeris deterministic and valid.');
}

main().catch((error) => {
  console.error(`validate-ephemeris crashed: ${(error as Error).stack ?? error}`);
  process.exit(1);
});
