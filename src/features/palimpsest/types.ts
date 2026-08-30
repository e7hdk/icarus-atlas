/** Shared vocabulary for source-pair comparison (docs/PALIMPSEST_PLAN.md §8.6).
 *  Every surface — Galaxy, Poets, Story Theatre, Lands — must classify a topic
 *  through the same helpers, so the same disagreement cannot be described two
 *  different ways in two places. */

import type { SourceId } from '@/types/character';

/** Which side of the pair has anything to say about the topic at all. Presence
 *  is not agreement: two tellers can both speak and still contradict. */
export type PairPresence = 'shared' | 'primary-only' | 'secondary-only' | 'neither';

/** What the two tellers actually say, once both are present.
 *  `unknown` covers silence and topics not yet promoted to compare-ready. */
export type PairAgreement = 'same-stance' | 'split-stance' | 'internal-split' | 'unknown';

/** The minimum a fact must expose to be compared: who attests it, and which
 *  answer it gives. A record without a `stance` belongs to a legacy topic and
 *  can be counted for presence but never for agreement. */
export interface StanceRecord {
  sources: SourceId[];
  stance?: string;
}

/** One teller outside the selected pair, and the stance it attests that neither
 *  selected teller does. See `canAnnounceSharedTelling`. */
export interface OutsideStance {
  source: SourceId;
  stance: string;
}

export interface PairClassification {
  presence: PairPresence;
  agreement: PairAgreement;
  /** Distinct stances the primary teller attests, in first-seen order. */
  primaryStances: string[];
  secondaryStances: string[];
  /** Tellers outside the pair attesting a stance neither selected teller does.
   *  Non-empty forbids an unqualified "shared telling" (§P2, §6.5). */
  outsidePair: OutsideStance[];
}
