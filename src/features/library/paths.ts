import type { SourceId } from '@/types/character';

/** The Library's lightest constants, for any bundle: nothing here reads the works
 *  registry or the resolver (links.ts does). */

/** The seven tellers in the order they composed: the Library's order everywhere. */
export const TELLER_ORDER: SourceId[] = ['homer', 'hesiod', 'apollonius', 'ovid', 'apollodorus', 'hyginus', 'pausanias'];

/** A quarrel's page in the Library. */
export const quarrelHref = (topic: string) => `/library/quarrels/${topic}`;

/** A teller's name where space is short: Apollonius, Apollodorus. */
export const shortTeller = (name: string) => name.replace(/^Pseudo-/, '').replace(/ of Rhodes$/, '');
