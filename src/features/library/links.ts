import registryJson from '../../../data/library/works.json';
import { createCitationResolver, type CiteContext } from './cite';
import { OTHER_LANGUAGES, type CiteRef, type LibraryWork, type LibraryWorksFile, type Locus, type WorkId } from '@/types/library';

/** Where a citation leads in the Library (docs/LIBRARY_PLAN.md §6, deep links):
 *  `/library/homer/iliad/5#l370-417`, `/library/apollodorus/bibliotheca/1#s1.3.1`,
 *  `/library/hesiod/theogony#l116-122`. Small enough to run in the browser, so a
 *  footnote anywhere can read its own citation. The registry is validated by
 *  `pnpm validate-library`. */

export const LIBRARY_REGISTRY = registryJson as unknown as LibraryWorksFile;
const resolver = createCitationResolver(LIBRARY_REGISTRY);
const workById = new Map(LIBRARY_REGISTRY.works.map((work) => [work.id, work]));

export { TELLER_ORDER, quarrelHref } from './paths';

export interface PassageLink {
  href: string;
  /** "Iliad 5.370–417" */
  label: string;
}

type Passage = Extract<CiteRef, { kind: 'passage' }>;

export function libraryWork(id: WorkId): LibraryWork {
  const work = workById.get(id);
  if (!work) throw new Error(`${id} is not in the Library's registry`);
  return work;
}

export const workHref = (work: LibraryWork) => `/library/${work.author}/${work.id}`;

/** The credits of a work's translations into the reader's other languages (German, Turkish), in order. */
export const otherCredits = (work: LibraryWork): string[] => OTHER_LANGUAGES.flatMap((language) => work.translations?.[language]?.credit ?? []);

/** The reading page a locus sits on: its book, or the whole work. */
export function unitOf(work: LibraryWork, locus: Locus): string {
  if (work.units === 'whole') return 'whole';
  if (locus.kind === 'book') return String(locus.book);
  if (locus.kind === 'line') return locus.book === undefined ? 'whole' : String(locus.book);
  if (locus.kind === 'section') return locus.path.split('.')[0];
  return 'whole';
}

export const unitHref = (work: LibraryWork, unit: string) => (unit === 'whole' ? workHref(work) : `${workHref(work)}/${unit}`);

function anchor(ref: Passage): string {
  const { from, to } = ref;
  if (from.kind === 'book') return '';
  if (from.kind === 'line') {
    const sameBook = to.kind === 'line' && to.book === from.book;
    return `#l${from.line}${sameBook && to.line !== from.line ? `-${to.line}` : ''}`;
  }
  if (from.kind === 'section') return `#s${from.path}${to.kind === 'section' && to.path !== from.path ? `-${to.path}` : ''}`;
  return `#t${from.tale}`;
}

function place(locus: Locus): string {
  if (locus.kind === 'book') return `book ${locus.book}`;
  if (locus.kind === 'line') return locus.book === undefined ? locus.line : `${locus.book}.${locus.line}`;
  if (locus.kind === 'section') return locus.path;
  return locus.tale === 'preface' ? 'preface' : locus.tale;
}

export function passageLink(ref: Passage): PassageLink {
  const work = libraryWork(ref.work);
  const from = place(ref.from);
  const to = place(ref.to);
  // "5.370–5.417" reads as "5.370–417"
  const end = to === from ? '' : `–${ref.from.kind === 'line' && ref.to.kind === 'line' && ref.from.book === ref.to.book ? ref.to.line : to}`;
  return { href: unitHref(work, unitOf(work, ref.from)) + anchor(ref), label: `${work.title} ${from}${end}` };
}

/** A stretch of a citation string, and where the Library reads it, if it does. */
export interface CitationPart {
  text: string;
  href?: string;
}

/** A citation cut at its semicolons, each stretch the Library holds made a link
 *  to its passage: "Theogony 453–506; Works and Days 166–173" as two links. A
 *  bare locus carries on the work before it ("Odyssey 3.193–200; 11.404–434"). */
export function citationParts(raw: string, context: CiteContext = {}): CitationPart[] {
  const parts: CitationPart[] = [];
  let work = context.work;
  for (const piece of raw.split(/(;\s*)/)) {
    if (!piece) continue;
    if (/^;\s*$/.test(piece)) {
      parts.push({ text: piece });
      continue;
    }
    const passage = resolver.resolve(piece, { ...context, work }).find((ref): ref is Passage => ref.kind === 'passage');
    if (!passage) {
      parts.push({ text: piece });
      continue;
    }
    parts.push({ text: piece, href: passageLink(passage).href });
    work = libraryWork(passage.work).title;
  }
  return parts;
}

/** A work's page in the Library, by any name the registry knows it by ("The Library", "Il."). */
export function workLinkNamed(name: string): string | null {
  const work = resolver.workNamed(name);
  return work ? workHref(work) : null;
}

/** The opening citation of a testimony written "Hyginus, Astronomica 2.29 — many say…". */
export const testimonyCitation = (line: string) => line.split(' — ')[0];

/** The passages a citation string names, ready to link; none for a note or a work the Library does not hold. */
export function citationLinks(raw: string | undefined, context: CiteContext = {}): PassageLink[] {
  if (!raw) return [];
  const links = new Map<string, PassageLink>();
  for (const ref of resolver.resolve(raw, context)) {
    if (ref.kind === 'passage') {
      const link = passageLink(ref);
      links.set(link.href, link);
    }
    if (ref.kind === 'work') {
      const work = libraryWork(ref.work);
      links.set(workHref(work), { href: workHref(work), label: work.title });
    }
  }
  return [...links.values()];
}
