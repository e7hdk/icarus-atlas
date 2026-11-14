import type { SourceId } from './character';

/** The works the Library holds — the pinned corpus, one entry per work
 *  (docs/LIBRARY_PLAN.md §4.2). */
export const LIBRARY_WORK_IDS = [
  'iliad',
  'odyssey',
  'theogony',
  'works-and-days',
  'argonautica',
  'metamorphoses',
  'bibliotheca',
  'epitome',
  'fabulae',
  'astronomica',
  'description-of-greece',
] as const;
export type WorkId = (typeof LIBRARY_WORK_IDS)[number];

/** How a work is cut, and so how it is cited:
 *  - `books-of-lines`: Il. 5.370 (book.line)
 *  - `lines`: Theog. 116 (one run of lines; a line may carry a letter, 929o)
 *  - `sections`: Bibl. 1.3.1, Paus. 2.29.6 (dotted sections)
 *  - `tales`: Fab. 92 (numbered tales, a preface cited by page, p.35) */
export const WORK_STRUCTURES = ['books-of-lines', 'lines', 'sections', 'tales'] as const;
export type WorkStructure = (typeof WORK_STRUCTURES)[number];

/** The languages the reading room reads a work in beside its original: English for
 *  every work, German and Turkish where a free translation is pinned
 *  (docs/LIBRARY_PLAN.md §4.4, the reader's languages). */
export const READER_LANGUAGES = ['en', 'de', 'tr'] as const;
export type ReaderLanguage = (typeof READER_LANGUAGES)[number];
/** The reader's languages beside English, which every work has. */
export type OtherLanguage = Exclude<ReaderLanguage, 'en'>;
export const OTHER_LANGUAGES = ['de', 'tr'] as const satisfies readonly OtherLanguage[];

/** The atlas's own translation, made from the original line for line and kept in
 *  data/library/translations/<file> (docs/LIBRARY_PLAN.md §4.4, L15). It says what
 *  it is: a draft until the editor has read it through. */
export interface OwnEdition {
  file: string;
  status: 'draft' | 'reviewed';
  credit: string;
  licence: string;
}

/** A translation into a reader's other language: pinned, or the atlas's own. */
export type ReaderEdition = LibraryEdition | OwnEdition;
export const isOwnEdition = (edition: ReaderEdition): edition is OwnEdition => 'file' in edition;

/** data/library/translations/<work>.<language>.json: the atlas's own translation,
 *  one line of it for each line of the original it was made from, keyed by the
 *  line's id (`116`, `929a`; `5.370` in a work of books). */
export interface OwnTranslation {
  work: WorkId;
  language: OtherLanguage;
  /** The pinned edition of the original it was made from. */
  from: string;
  note: string;
  lines: Record<string, string>;
}

export interface LibraryEdition {
  /** A `research/corpus/manifest.json` entry. */
  corpusId: string;
  credit: string;
  licence: string;
}

export interface LibraryWork {
  id: WorkId;
  /** The teller. */
  author: SourceId;
  title: string;
  greekTitle?: string;
  /** Signed years; the label is what shows, and no date is more precise than it. */
  composed: { from: number; to: number; label: string };
  structure: WorkStructure;
  /** A reading page per book, or the whole work on one page. */
  units: 'books' | 'whole';
  /** Every spelling the data uses for this work ("Bibliotheca", "Apollod.", "The Library"). */
  aliases: string[];
  /** Absent for Hyginus: the corpus has no Latin. */
  original?: LibraryEdition;
  translation: LibraryEdition;
  /** Translations into the reader's other languages: a free one pinned in the corpus
   *  (Voß's Homer, Peppmüller's Theogony, Suchier's Metamorphoses in German), or the
   *  atlas's own (the Theogony in Turkish). */
  translations?: Partial<Record<OtherLanguage, ReaderEdition>>;
  /** The licence gate: `excerpt` keeps a work to short quotations and a link out. */
  display: 'full' | 'excerpt';
}

/** A work the atlas cites that the Library does not hold: cited, never resolved to a passage. */
export interface ExternalWork {
  label: string;
  aliases: string[];
  note?: string;
}

export interface LibraryWorksFile {
  works: LibraryWork[];
  external: ExternalWork[];
}

/** A place in a work. Line and tale ids are strings because the editions number
 *  some of them with letters (Theog. 929o, Fab. 152A, the preface's p.35). */
export type Locus =
  | { kind: 'line'; book?: number; line: string }
  | { kind: 'book'; book: number }
  | { kind: 'section'; path: string }
  | { kind: 'tale'; tale: string };

/** What one cited stretch resolves to (docs/LIBRARY_PLAN.md §4.3). */
export type CiteRef =
  | { kind: 'passage'; work: WorkId; from: Locus; to: Locus }
  | { kind: 'work'; work: WorkId }
  | { kind: 'external'; label: string }
  | { kind: 'note'; text: string }
  | { kind: 'unresolved'; text: string; reason: string };

/** One aligned stretch of a reading page: an English card beside the original
 *  lines it translates (verse), or one section beside its translation (prose). */
export interface LibraryBlock {
  /** The first and last original line (verse), or the section id (prose). */
  from: string;
  to: string;
  /** Verse: [line id, text] pairs. Prose: the section's text, '' where the corpus has no original. */
  orig: [string, string][] | string;
  /** The translation's paragraphs; empty where the licence keeps it out (`display: 'excerpt'`). */
  trans: string[];
  /** Where the translation can be read when it is not shown here. */
  link?: string;
  /** The block in the reader's other languages: a verse translation's lines laid
   *  beside this block's original lines (scripts/lib/lineation.ts). */
  translations?: Partial<Record<OtherLanguage, string[]>>;
}

/** A reading page: one book, or the whole work. */
export interface LibraryUnit {
  id: string;
  blocks: LibraryBlock[];
}

/** One work's text, baked by `pnpm bake-library-texts` into data/generated/library/<work>.json. */
export interface LibraryText {
  work: WorkId;
  /** Hash of the editions and the reading of them; the gate compares it with the pinned corpus. */
  signature: string;
  verse: boolean;
  /** The reader's other languages the text carries, and how each is set: line by line, or in paragraphs. */
  translations?: Partial<Record<OtherLanguage, 'verse' | 'prose'>>;
  units: LibraryUnit[];
}

/** How far each work runs, baked from the pinned corpus (`pnpm bake-library-extents`). */
export interface WorkExtent {
  /** `books-of-lines`: the last line of each book, and any lettered lines. */
  books?: Record<string, { last: number; extra: string[] }>;
  /** `lines`: the last line, and any lettered lines. */
  lines?: { last: number; extra: string[] };
  /** `sections` and `tales`: every id the edition numbers. */
  ids?: string[];
  /** Words in the edition that sets the numbering: the original, or the English where the corpus has no original. */
  words?: number;
}

export interface LibraryExtents {
  /** Hash of the manifest entries the extents were baked from. */
  signature: string;
  works: Record<WorkId, WorkExtent>;
}
