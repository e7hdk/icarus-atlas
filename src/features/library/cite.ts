import type { CiteRef, LibraryWork, LibraryWorksFile, Locus, WorkStructure } from '@/types/library';

/** The citation resolver (docs/LIBRARY_PLAN.md §4.3): one pure function shared by
 *  the bakes, the gate, ⌘K and the UI. It reads a citation string as the data
 *  writes it — "Iliad 5.370–417", "Apollod. 3.12.6; Paus. 2.29.2, 2.29.6–10",
 *  "Bibliotheca 1.3.4, Epitome 7.18" — and never rewrites it. */

export interface CiteContext {
  /** The tellers of the fact the citation proves. */
  sources?: readonly string[];
  /** A story attestation's own work ("The Library", "Iliad"), for its bare loci. */
  work?: string;
  /** Free text without a work is a note here (data/chronology.json), not an error. */
  allowNotes?: boolean;
}

export interface CitationResolver {
  resolve(raw: string, context?: CiteContext): CiteRef[];
  /** The registry work a name means, if any ("Il.", "The Library"). */
  workNamed(name: string): LibraryWork | null;
}

type Target = { kind: 'work'; work: LibraryWork } | { kind: 'external'; label: string };
type Span = { from: Locus; to: Locus };

/** "Hom. Il." and "hom il" are one name: case, dots, commas and spacing never matter. */
export function foldWorkName(name: string): string {
  return name.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
}

const DASH = /\s*[–—-]\s*/;
const ID = /^\d+[a-z]?(?:\.\d+[a-z]?)*$/i;
const PREFACE = /^(?:pref(?:ace)?\.?|praef(?:atio)?\.?)$/i;
const PAGE = /^p\.\s*(\d+)$/i;
/** Where the loci begin: a digit, a page of the Fabulae preface, the preface itself, or an Epitome "E.". */
const LOCUS_START = /(?:^|\s)(?=(?:E\.\s*)?\d|p\.\s*\d|pref|praef)/i;
const LOCUS_PREFIX = /^(?:E\.\s*|bk\.?\s*|book\s+|ll?\.\s*|lines?\s+|§\s*)/i;

/** "Bibliotheca 3.4.4 (cf. 3.4.2)" keeps 3.4.2 as a further locus; "(Theogony)" is a label and goes. */
function prepare(raw: string): string {
  return raw
    .replace(/\(([^()]*)\)/g, (_, inner: string) => (/\d/.test(inner) ? `, ${inner}` : ''))
    .replace(/\bcf\.\s*/gi, '')
    .replace(/\s*&\s*/g, ', ')
    .replace(/(\d)\s+and\s+(?=\d)/g, '$1, ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitHead(group: string): { head: string; loci: string } {
  const match = LOCUS_START.exec(group);
  if (!match) return { head: group.trim(), loci: '' };
  return { head: group.slice(0, match.index).trim().replace(/[,:]$/, '').trim(), loci: group.slice(match.index).trim() };
}

function lineLocus(token: string, book?: number): Locus | null {
  if (!/^\d+[a-z]?$/i.test(token)) return null;
  return book === undefined ? { kind: 'line', line: token } : { kind: 'line', book, line: token };
}

/** One locus or range, read by the work's structure. `book` is the book the
 *  group is already in: "16.1–45, 480–505" reads 480–505 as lines of book 16. */
function parseSpan(structure: WorkStructure, token: string, book?: number): Span | string {
  const cleaned = token.replace(LOCUS_PREFIX, '').trim();
  if (!cleaned) return 'an empty locus';
  const [start, end, extra] = cleaned.split(DASH);
  if (extra !== undefined) return `"${token}" has more than one dash`;
  if (structure === 'tales') return parseTales(start, end, cleaned);
  if (!ID.test(start) || (end !== undefined && !ID.test(end))) return `"${token}" is not a locus`;
  if (structure === 'lines') return parseLines(start, end, token);
  if (structure === 'books-of-lines' && book !== undefined && !start.includes('.')) return parseBooksOfLines(`${book}.${start}`, end, token);
  if (structure === 'books-of-lines') return parseBooksOfLines(start, end, token);
  return parseSections(start, end);
}

/** "Catalogue of Ships", "with 1.7.10", "esp. 11": words around a locus are a label, not the locus. */
function locusToken(token: string): string | 'whole' | null {
  const bare = token.replace(/^(?:with|see|esp\.?|especially|also|Grant)\s+/i, '').trim();
  if (/^(?:entire|passim|whole|throughout)$/i.test(bare)) return 'whole';
  if (!/\d/.test(bare) && !PREFACE.test(bare)) return null;
  return bare;
}

function parseLines(start: string, end: string | undefined, token: string): Span | string {
  const from = lineLocus(start);
  const to = end === undefined ? from : lineLocus(end);
  if (!from || !to) return `"${token}" is not a line or a run of lines`;
  return { from, to };
}

function parseBooksOfLines(start: string, end: string | undefined, token: string): Span | string {
  const [book, line, more] = start.split('.');
  if (more !== undefined) return `"${token}" has too many parts for book.line`;
  if (line === undefined) {
    // whole books: an attestation's "17–22"
    const last = end ?? book;
    if (last.includes('.')) return `"${token}" mixes a book with a line`;
    return { from: { kind: 'book', book: Number(book) }, to: { kind: 'book', book: Number(last) } };
  }
  const from = lineLocus(line, Number(book));
  if (!from) return `"${token}" is not book.line`;
  if (end === undefined) return { from, to: from };
  const [endBook, endLine] = end.includes('.') ? end.split('.') : [book, end];
  const to = lineLocus(endLine, Number(endBook));
  if (!to) return `"${token}" does not end on a line`;
  return { from, to };
}

/** "1.1.6-7" ends at 1.1.7: an end with fewer parts replaces the start's last parts. */
function parseSections(start: string, end: string | undefined): Span {
  const from: Locus = { kind: 'section', path: start };
  if (end === undefined) return { from, to: from };
  const head = start.split('.');
  const tail = end.split('.');
  const path = tail.length >= head.length ? end : [...head.slice(0, head.length - tail.length), ...tail].join('.');
  return { from, to: { kind: 'section', path } };
}

function parseTales(start: string, end: string | undefined, token: string): Span | string {
  // "preface 1–3": paragraphs of the preface, which the edition numbers by page
  if (/^pref(?:ace)?\.?\s+\d/i.test(token.trim())) return { from: { kind: 'tale', tale: 'preface' }, to: { kind: 'tale', tale: 'preface' } };
  const tale = (value: string): Locus | null => {
    if (PREFACE.test(value)) return { kind: 'tale', tale: 'preface' };
    const page = PAGE.exec(value) ?? /^pref\.\s*(\d+)$/i.exec(value);
    if (page) return { kind: 'tale', tale: `p.${page[1]}` };
    if (ID.test(value)) return { kind: 'tale', tale: value };
    return null;
  };
  const from = tale(start);
  const to = end === undefined ? from : tale(end);
  if (!from || !to) return `"${token}" is not a tale, a run of tales or the preface`;
  return { from, to };
}

export function createCitationResolver(registry: LibraryWorksFile): CitationResolver {
  const targets = new Map<string, Target>();
  for (const work of registry.works) for (const alias of work.aliases) targets.set(foldWorkName(alias), { kind: 'work', work });
  for (const external of registry.external) for (const alias of external.aliases) targets.set(foldWorkName(alias), { kind: 'external', label: external.label });
  const worksByTeller = new Map<string, LibraryWork[]>();
  for (const work of registry.works) worksByTeller.set(work.author, [...(worksByTeller.get(work.author) ?? []), work]);

  const targetNamed = (name: string) => targets.get(foldWorkName(name)) ?? null;
  const workNamed = (name: string) => {
    const target = targetNamed(name);
    return target?.kind === 'work' ? target.work : null;
  };
  /** A bare locus belongs to the attestation's work, else to its teller's only work. */
  const contextWork = (context: CiteContext): LibraryWork | null => {
    if (context.work) return workNamed(context.work);
    if (context.sources?.length !== 1) return null;
    const works = worksByTeller.get(context.sources[0]) ?? [];
    return works.length === 1 ? works[0] : null;
  };
  /** A comma opens a new work only after a locus and before a name the registry knows. */
  const opensWork = (left: string, right: string) => {
    if (!/\d[a-z]?\s*$/i.test(left)) return false;
    const { head } = splitHead(right.trim());
    return head !== '' && targetNamed(head) !== null;
  };

  function groups(segment: string): string[] {
    const out: string[] = [];
    for (const part of segment.split(',')) {
      const last = out.length - 1;
      if (last >= 0 && !opensWork(out[last], part)) out[last] += `,${part}`;
      else out.push(part);
    }
    return out.map((group) => group.trim()).filter(Boolean);
  }

  /** A note that cites as it explains — "generational — after the Argo (Arg. 1.122;
   *  Apollod. 1.9.19)" — is a note, and each parenthesis is read as a citation. */
  function resolveNote(raw: string, context: CiteContext): CiteRef[] {
    const asides = [...raw.matchAll(/\(([^()]*\d[^()]*)\)/g)].map((match) => match[1]);
    return [{ kind: 'note', text: raw }, ...asides.flatMap((aside) => resolveCitation(aside, context))];
  }

  function resolve(raw: string, context: CiteContext = {}): CiteRef[] {
    return context.allowNotes && raw.includes('(') && !targetNamed(splitHead(raw).head) ? resolveNote(raw, context) : resolveCitation(raw, context);
  }

  /** What an attestation's own work makes of a word in place of a work name. */
  const attestedWork = (context: CiteContext) => (context.work ? workNamed(context.work) : null);

  function resolveCitation(raw: string, context: CiteContext): CiteRef[] {
    const refs: CiteRef[] = [];
    // "Odyssey 3.193–200; 11.404–434": a bare locus continues the work named before it
    let inherited: LibraryWork | null = null;
    for (const segment of prepare(raw).split(';').map((part) => part.trim()).filter(Boolean)) {
      for (const group of groups(segment)) {
        const split = splitHead(group);
        // an attestation's words around its locus ("entire", "the returns, esp. 11") label it
        const labelled = split.head && !targetNamed(split.head) && attestedWork(context) !== null;
        const head = labelled ? '' : split.head;
        const loci = labelled && !split.loci ? split.head : split.loci;
        const target = head ? targetNamed(head) : null;
        // "Hom. Il., Od.": works listed without loci
        const listed = head && !target && !loci ? head.split(',').map((part) => targetNamed(part)) : [];
        if (listed.length > 1 && listed.every((part) => part !== null)) {
          for (const part of listed) refs.push(part?.kind === 'work' ? { kind: 'work', work: part.work.id } : { kind: 'external', label: part?.label ?? head });
          inherited = null;
          continue;
        }
        if (head && !target) {
          refs.push(context.allowNotes ? { kind: 'note', text: group } : { kind: 'unresolved', text: group, reason: `unknown work "${head}"` });
          inherited = null;
          continue;
        }
        // an attestation of a work the Library does not hold: "Fasti" with "5.229–258"
        const external = target ?? (!inherited && context.work ? targetNamed(context.work) : null);
        if (external?.kind === 'external') {
          refs.push({ kind: 'external', label: external.label });
          inherited = null;
          continue;
        }
        const work: LibraryWork | null = target?.kind === 'work' ? target.work : (inherited ?? contextWork(context));
        if (!work) {
          refs.push(context.allowNotes ? { kind: 'note', text: group } : { kind: 'unresolved', text: group, reason: 'no work named' });
          continue;
        }
        inherited = work;
        const tokens = loci.split(',').map((token) => locusToken(token.trim())).filter((token) => token !== null);
        if (tokens.length === 0 || tokens.includes('whole')) {
          refs.push({ kind: 'work', work: work.id });
          if (tokens.length <= 1) continue;
        }
        let book: number | undefined;
        for (const token of tokens) {
          if (token === 'whole') continue;
          const span = parseSpan(work.structure, token, book);
          if (typeof span === 'string') {
            refs.push({ kind: 'unresolved', text: `${work.title} ${token}`, reason: span });
            continue;
          }
          refs.push({ kind: 'passage', work: work.id, ...span });
          book = span.to.kind === 'line' ? span.to.book : undefined;
        }
      }
    }
    return refs;
  }

  return { resolve, workNamed };
}
