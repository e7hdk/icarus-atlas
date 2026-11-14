/** Verse translations that keep the original's lines without numbering them
 *  (docs/LIBRARY_PLAN.md §4.4, the reader's languages). Voß's Homer, Peppmüller's
 *  Theogony and Suchier's Metamorphoses are set line for line against the Greek and
 *  the Latin, but their editions print no line numbers, and here and there a line
 *  is missing or added (the Theogony's lettered lines 929a–t are not in Peppmüller).
 *
 *  So each line of the translation is laid beside a line of the original by a
 *  banded alignment: by default line beside line; a line left over on either side
 *  costs something, a name both lines carry earns something. Names find where a
 *  translation gains or drops a line, and a lettered line of the original costs
 *  almost nothing to pass by. Pure functions over the files' text: the callers read
 *  the pinned corpus. */

import { load, type CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';

/** A numbered line of the original: [line id, text]. */
export type Line = [string, string];

const clean = (text: string) => text.replace(/ /g, ' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?)\]])/g, '$1').trim();

function verseText($: CheerioAPI, node: AnyNode): string {
  const clone = $(node).clone();
  clone.find('note').remove();
  clone.find('pb, milestone, lb').replaceWith(' ');
  return clean(clone.text());
}

/** A Perseus TEI original, unit by unit: each book's numbered lines, or `whole`
 *  for a poem without books (the books are `div[subtype=book]`; the Iliad spells it "Book"). */
export function teiVerseUnits(content: string): Map<string, Line[]> {
  const $ = load(content, { xmlMode: true });
  const linesIn = (scope: ReturnType<typeof $>) => scope.find('l[n]').map((_, line) => [[$(line).attr('n') ?? '', verseText($, line)]]).get() as Line[];
  const books = $('body div[type="textpart"]').filter((_, div: Element) => /^book$/i.test($(div).attr('subtype') ?? ''));
  if (books.length === 0) return new Map([['whole', linesIn($('body'))]]);
  const units = new Map<string, Line[]>();
  books.each((_, div) => {
    units.set($(div).attr('n') ?? '?', linesIn($(div)));
  });
  return units;
}

/** TextGrid's Digitale Bibliothek (the Zeno.org texts, in TEI): a verse translation,
 *  book by book. A book is a `div[type=h4]` holding verse; its first line is set as
 *  a paragraph with a hanging indent (`p[rend^=zenoPL]`), the rest as `<l>`. The
 *  editor's summary before it, a plain paragraph, is not the poem and is left out. */
export function textGridBooks(content: string): string[][] {
  const $ = load(content, { xmlMode: true });
  const books: string[][] = [];
  $('body div[type="h4"]').each((_, div) => {
    if ($(div).find('l').length === 0) return;
    const lines: string[] = [];
    const walk = (node: AnyNode) => {
      if (node.type !== 'tag') return;
      const { name } = node;
      if (name === 'l' || (name === 'p' && ($(node).attr('rend') ?? '').startsWith('zenoPL'))) {
        const text = verseText($, node);
        if (text) lines.push(text);
        return;
      }
      for (const child of node.children) walk(child);
    };
    walk(div);
    books.push(lines);
  });
  return books;
}

/* ───────────────────────── names ───────────────────────── */

const GREEK: Record<string, string> = {
  α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 't', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x',
  ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'u', φ: 'f', χ: 'k', ψ: 'ps', ω: 'o',
};

/** A name as the ear hears it, the same in Greek, Latin and German letters:
 *  Ἕκτωρ, Hector and Hektor are all `ektor`, Ἀχαιοί and Achaier both `ake…`. */
export function nameKey(word: string): string {
  const plain = word
    // German writes Greek αι and οι as ä and ö (Äneias, Phöbos)
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[α-ω]/g, (letter) => GREEK[letter] ?? '')
    .replace(/ß/g, 'ss');
  return plain
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/[ck]h/g, 'k')
    .replace(/rh/g, 'r')
    .replace(/[cq]/g, 'k')
    .replace(/y/g, 'u')
    .replace(/j/g, 'i')
    .replace(/[vw]/g, 'u')
    .replace(/h/g, '')
    .replace(/[ao]e|[ao]i/g, 'e')
    .replace(/ei/g, 'i')
    .replace(/ou/g, 'u')
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1');
}

/** The names a line carries: its capitalised words, by the first four letters of their key. */
export function namesOf(text: string): Set<string> {
  const names = new Set<string>();
  // Suchier marks the stress inside a name (Ce'res, Lyä'us): the mark is no word break
  for (const word of text.replace(/(\p{L})['’](\p{Ll})/gu, '$1$2').split(/[^\p{L}\p{M}]+/u)) {
    if (!/^\p{Lu}/u.test(word)) continue;
    const key = nameKey(word);
    if (key.length >= 4) names.add(key.slice(0, 4));
  }
  return names;
}

/** How a line ends, before any closing quotation mark: 2 at a stop (a full stop, a
 *  colon, a semicolon, a question or an exclamation, Greek's raised dot and question
 *  mark among them), 1 at a comma, 0 running on. A translation line for line keeps
 *  the original's syntax, so its stops fall on the same lines; a raised dot is as
 *  often a comma in German, so a stop against a comma says nothing. */
export function ending(text: string): 0 | 1 | 2 {
  const end = text.replace(/[\s"'“”‘’«»‹›)\]–—-]+$/u, '').at(-1) ?? '';
  return /[.;:!?··;]/.test(end) ? 2 : end === ',' ? 1 : 0;
}

/* ───────────────────────── the alignment ───────────────────────── */

/** A line left over on either side. */
const LEFT_OVER = 1.5;
/** A lettered line of the original (Theog. 929a), which a translation may well not have;
 *  and a translated line where the original's numbers skip (Il. 9.457 → 462), lines
 *  the edition leaves out that the translator's text had. */
const LETTERED = 0.05;
/** A shared name counts for so much, and no more than three of them on one line. */
const NAME = 1;
const MOST_NAMES = 3;
/** Two lines that both close a sentence, or only one of them. */
const BOTH_CLOSE = 0.6;
const ONE_CLOSES = -0.3;
/** How far a translation may run from its original's line count, before it is no translation line for line. */
export const MOST_DRIFT = 0.03;

export interface Alignment {
  /** For each line of the original, the lines of the translation laid beside it. */
  beside: string[][];
  /** Lines of the original with none beside them, and lines of the translation laid beside the line before. */
  leftOriginal: number;
  leftTranslation: number;
  /** Lines laid beside one another that share a name, of those whose original names someone. */
  named: number;
  agreeing: number;
}

/** Lays each line of `translation` beside a line of `original`, in order, every line once. */
export function alignLines(original: Line[], translation: string[]): Alignment {
  const n = original.length;
  const m = translation.length;
  const band = Math.abs(m - n) + 25;
  const width = 2 * band + 1;
  const at = (i: number, j: number) => i * width + (j - i + band);
  const inBand = (i: number, j: number) => j >= 0 && j <= m && Math.abs(j - i) <= band;
  const score = new Float64Array((n + 1) * width).fill(-Infinity);
  // 0 a line beside a line, 1 an original line left over, 2 a translated line left over
  const move = new Uint8Array((n + 1) * width);
  const left = original.map(([id]) => (/[a-z]/i.test(id) ? LETTERED : LEFT_OVER));
  // a translated line left over after original line i: cheap where the numbers skip after it
  const after = original.map(([id], i) => {
    const next = original[i + 1]?.[0];
    return /^\d+$/.test(id) && next !== undefined && /^\d+$/.test(next) && Number(next) - Number(id) > 1 ? LETTERED : LEFT_OVER;
  });
  const namesO = original.map(([, text]) => namesOf(text));
  const namesT = translation.map(namesOf);
  const endsO = original.map(([, text]) => ending(text));
  const endsT = translation.map(ending);
  const shared = (i: number, j: number) => {
    let count = 0;
    for (const name of namesO[i]) if (namesT[j].has(name)) count++;
    return Math.min(count, MOST_NAMES) * NAME;
  };
  const stops = (a: number, b: number) => (a === 2 && b === 2 ? BOTH_CLOSE : a + b === 2 && a !== b ? ONE_CLOSES : 0);
  const kin = (i: number, j: number) => shared(i, j) + stops(endsO[i], endsT[j]);

  score[at(0, 0)] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = Math.max(0, i - band); j <= Math.min(m, i + band); j++) {
      if (i === 0 && j === 0) continue;
      let best = -Infinity;
      let way = 0;
      // the order of the trials breaks ties: line beside line first
      if (i > 0 && j > 0 && inBand(i - 1, j - 1)) {
        const value = score[at(i - 1, j - 1)] + kin(i - 1, j - 1);
        if (value > best) [best, way] = [value, 0];
      }
      if (i > 0 && inBand(i - 1, j)) {
        const value = score[at(i - 1, j)] - left[i - 1];
        if (value > best) [best, way] = [value, 1];
      }
      if (j > 0 && inBand(i, j - 1)) {
        const value = score[at(i, j - 1)] - (i > 0 ? after[i - 1] : LEFT_OVER);
        if (value > best) [best, way] = [value, 2];
      }
      score[at(i, j)] = best;
      move[at(i, j)] = way;
    }
  }
  if (!Number.isFinite(score[at(n, m)])) throw new Error(`no alignment within ${band} lines of the diagonal`);

  // walk back from the end: which original line each translated line goes with
  const partner: number[] = new Array(m).fill(-1);
  const besideLeft: boolean[] = new Array(m).fill(false);
  let leftOriginal = 0;
  let named = 0;
  let agreeing = 0;
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const way = move[at(i, j)];
    if (way === 0) {
      partner[j - 1] = i - 1;
      if (namesO[i - 1].size > 0) {
        named++;
        if (shared(i - 1, j - 1) > 0) agreeing++;
      }
      i--;
      j--;
    } else if (way === 1) {
      if (left[i - 1] === LEFT_OVER) leftOriginal++;
      i--;
    } else {
      besideLeft[j - 1] = true;
      j--;
    }
  }
  // a translated line left over goes with the original line before it (the first, at the head of the book)
  const beside: string[][] = original.map(() => []);
  let last = 0;
  translation.forEach((text, j) => {
    if (partner[j] >= 0) last = partner[j];
    beside[last].push(text);
  });
  return { beside, leftOriginal, leftTranslation: besideLeft.filter(Boolean).length, named, agreeing };
}

/** A translation's books laid beside the original's units, in order. Fails when the
 *  books do not match, or a book runs further from its original's count than a
 *  line-for-line translation can (MOST_DRIFT, counting the original's numbered lines). */
export function alignBooks(id: string, units: Map<string, Line[]>, books: string[][]): Map<string, Alignment> {
  if (books.length !== units.size) throw new Error(`${id}: ${books.length} book(s) of translation against ${units.size} of the original`);
  const aligned = new Map<string, Alignment>();
  [...units].forEach(([unit, lines], index) => {
    const numbered = lines.filter(([n]) => !/[a-z]/i.test(n)).length;
    const drift = Math.abs(books[index].length - numbered) / Math.max(1, numbered);
    if (drift > MOST_DRIFT) throw new Error(`${id}: book ${unit} has ${books[index].length} lines against the original's ${numbered}: not a line-for-line translation`);
    aligned.set(unit, alignLines(lines, books[index]));
  });
  return aligned;
}
