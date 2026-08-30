/** The locked comparison vocabulary (docs/PALIMPSEST_PLAN.md P2). Every surface
 *  draws its words from here, so the same state is never described two ways —
 *  and so the one sentence the atlas must never say, "Homer denies this", has
 *  nowhere to come from. Silence is a statement about our coverage, never about
 *  an author's belief. */

import type { PairClassification } from './types';

export const COMPARE_COPY = {
  attestedHere: 'Attested here',
  anotherTelling: 'Another telling',
  sharedTelling: 'Shared telling',
  silent: 'Silent in the atlas',
  internalSplit: 'The teller differs within the surviving works',
  outsidePair: 'Other tellers differ',
} as const;

export interface CompareLabel {
  label: string;
  /** One plain sentence, safe to read aloud to a screen reader. */
  detail: string;
}

/** Turn a classification into the words the UI is allowed to use. `names` maps
 *  a source id to its display name so the sentence reads "Hesiod", not "hesiod". */
export function describePair(
  classification: PairClassification,
  names: (source: string) => string,
): CompareLabel {
  const { presence, agreement, outsidePair } = classification;
  const dissenters = [...new Set(outsidePair.map((item) => names(item.source)))].join(', ');

  if (presence === 'neither') {
    return {
      label: COMPARE_COPY.silent,
      detail: 'No passage included in this atlas attests either teller here.',
    };
  }
  if (presence !== 'shared') {
    return {
      label: COMPARE_COPY.attestedHere,
      detail: 'Only one of the two tellers speaks here; the other is silent in this atlas.',
    };
  }
  if (agreement === 'internal-split') {
    return {
      label: COMPARE_COPY.internalSplit,
      detail: 'One teller preserves more than one tradition, in different passages.',
    };
  }
  if (agreement === 'split-stance') {
    return {
      label: COMPARE_COPY.anotherTelling,
      detail: 'The two tellers attest different traditions here.',
    };
  }
  if (agreement === 'same-stance') {
    return outsidePair.length > 0
      ? {
          label: COMPARE_COPY.outsidePair,
          detail: `Both selected tellers agree, but ${dissenters} tells it differently.`,
        }
      : {
          label: COMPARE_COPY.sharedTelling,
          detail: 'Both selected tellers attest the same tradition.',
        };
  }
  return {
    label: COMPARE_COPY.attestedHere,
    detail: 'This fact is not yet prepared for comparison.',
  };
}
