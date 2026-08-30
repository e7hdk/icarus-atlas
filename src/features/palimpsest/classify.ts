/** Pure source-pair classification (docs/PALIMPSEST_PLAN.md §8.6). No React, no
 *  Three.js, no data loading — it takes the records of one topic and answers
 *  what the selected pair of tellers says about it.
 *
 *  Two rules the rest of the atlas depends on:
 *    - silence is never denial: a teller with no record is `unknown`, not a
 *      contradiction (P2);
 *    - a pair is a window, not the whole record: when a teller outside the pair
 *      attests a stance neither selected teller does, agreement inside the pair
 *      may not be announced as a plain "shared telling" (§6.5). */

import type { SourceId } from '@/types/character';
import type {
  OutsideStance,
  PairAgreement,
  PairClassification,
  PairPresence,
  StanceRecord,
} from './types';

/** Distinct stances a single teller attests across the topic's records, in
 *  first-seen order. One teller may hold several: Homer casts Hephaestus from
 *  Olympus twice, by different hands, in different books (P5). */
export function stancesOf(records: StanceRecord[], source: SourceId): string[] {
  const stances: string[] = [];
  for (const record of records) {
    if (!record.sources.includes(source)) continue;
    if (!record.stance || stances.includes(record.stance)) continue;
    stances.push(record.stance);
  }
  return stances;
}

/** True when the teller appears on any record of the topic, with or without a
 *  stance. Presence answers "does this teller speak here", nothing more. */
export function isPresent(records: StanceRecord[], source: SourceId): boolean {
  return records.some((record) => record.sources.includes(source));
}

function presenceOf(primaryPresent: boolean, secondaryPresent: boolean): PairPresence {
  if (primaryPresent && secondaryPresent) return 'shared';
  if (primaryPresent) return 'primary-only';
  if (secondaryPresent) return 'secondary-only';
  return 'neither';
}

function agreementOf(primaryStances: string[], secondaryStances: string[]): PairAgreement {
  // Either side silent, or the topic not yet promoted to stances: not comparable.
  if (primaryStances.length === 0 || secondaryStances.length === 0) return 'unknown';
  // One teller holding several answers is its own state, and it outranks the
  // others: the pair may still overlap on one of them, but the split is the
  // more informative thing to show.
  if (primaryStances.length > 1 || secondaryStances.length > 1) return 'internal-split';
  return primaryStances[0] === secondaryStances[0] ? 'same-stance' : 'split-stance';
}

/** Tellers outside the pair attesting a stance neither selected teller holds. */
function outsidePairOf(
  records: StanceRecord[],
  pair: readonly [SourceId, SourceId],
  selectedStances: string[],
): OutsideStance[] {
  const found: OutsideStance[] = [];
  for (const record of records) {
    if (!record.stance || selectedStances.includes(record.stance)) continue;
    for (const source of record.sources) {
      if (pair.includes(source)) continue;
      if (found.some((item) => item.source === source && item.stance === record.stance)) continue;
      found.push({ source, stance: record.stance });
    }
  }
  return found;
}

/** Classify one topic for one pair of tellers. `records` are every fact carrying
 *  the topic, from every surface — character prose, relation edges, story
 *  chapters — so the answer is the same wherever it is asked. */
export function classifyPair(
  records: StanceRecord[],
  primary: SourceId,
  secondary: SourceId,
): PairClassification {
  if (primary === secondary) {
    throw new Error(`A compare pair needs two different tellers (got "${primary}" twice).`);
  }
  const primaryStances = stancesOf(records, primary);
  const secondaryStances = stancesOf(records, secondary);
  return {
    presence: presenceOf(isPresent(records, primary), isPresent(records, secondary)),
    agreement: agreementOf(primaryStances, secondaryStances),
    primaryStances,
    secondaryStances,
    outsidePair: outsidePairOf(records, [primary, secondary], [
      ...primaryStances,
      ...secondaryStances,
    ]),
  };
}

/** The guard behind hard-won honesty: the pair agrees AND no one outside it
 *  differs. When this is false but the agreement is `same-stance`, the UI must
 *  use the qualified form — "shared here; another teller differs" — and offer
 *  the Knot, which lists every witness. */
export function canAnnounceSharedTelling(classification: PairClassification): boolean {
  return classification.agreement === 'same-stance' && classification.outsidePair.length === 0;
}
