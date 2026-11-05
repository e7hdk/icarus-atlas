import { TELLER_ORDER } from './paths';
import type { SourceId } from '@/types/character';
import type { Quarrel, QuarrelClaim } from '@/types/quarrel';

/** The order of a quarrel's claims (docs/LIBRARY_PLAN.md §7): by their tellers'
 *  order of composition, the catalogue's order within a teller. Pure, for the
 *  pages, the margin bake and the client alike. */

/** A claim's place: its earliest teller's; a claim told outside the seven comes last. */
const rank = (claim: QuarrelClaim) => (claim.outside ? TELLER_ORDER.length : Math.min(...claim.sources.map((source) => TELLER_ORDER.indexOf(source))));

export const claimsInTime = (quarrel: Quarrel): QuarrelClaim[] =>
  quarrel.claims
    .map((claim, index) => ({ claim, index }))
    .sort((a, b) => rank(a.claim) - rank(b.claim) || a.index - b.index)
    .map(({ claim }) => claim);

/** Every teller who takes part, in order. */
export const tellersOf = (quarrel: Quarrel): SourceId[] => TELLER_ORDER.filter((teller) => quarrel.claims.some((claim) => claim.sources.includes(teller)));
