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
