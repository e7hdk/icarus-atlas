import type { SourceId } from './character';

/** The Quarrels (docs/LIBRARY_PLAN.md §4.7): the places where the tellers
 *  contradict each other, each told in its own claims. `data/quarrels.json` is
 *  the source; `docs/CONTRADICTIONS.md` is written from it (`pnpm quarrels:doc`),
 *  and a fact's `topic` names the quarrel it takes part in. */

export interface QuarrelClaim {
  /** Who claims it, as the catalogue words it: a teller ("Homer"), a teller
   *  reporting another ("Pseudo-Apollodorus (Pherecydes)"), several tellers, or
   *  a strand of tradition ("Aeolian"). */
  who: string;
  /** The tellers whose works carry the claim. Empty only for a claim `outside`. */
  sources: SourceId[];
  claim: string;
  citation?: string;
  /** Told outside the seven tellers (a later summary), kept so the quarrel is
   *  whole, never shown as a teller's word. */
  outside?: true;
}

export interface Quarrel {
  /** The `topic` the facts carry. */
  topic: string;
  /** "Aphrodite's birth" */
  title: string;
  characters: string[];
  places?: string[];
  /** The claims are strands of tradition rather than authors (the doc's column head). */
  strands?: true;
  claims: QuarrelClaim[];
  significance?: string;
  verification?: string;
}

export interface QuarrelsFile {
  quarrels: Quarrel[];
}
