import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import type { CiteContext } from './cite';

/** Every citation in data/, found with what it belongs to (docs/LIBRARY_PLAN.md
 *  §4.3, §4.5). Read from disk: for the bakes, the gate and the server render only,
 *  never a client bundle. */

export type SiteOwner =
  | { kind: 'character'; id: string; part: string }
  | { kind: 'story'; id: string; part: 'summary' | 'chapter' | 'attestation'; title?: string }
  | { kind: 'relation'; id: string; from: string; to: string; type: string }
  | { kind: 'reign'; city: string; ruler: string; characterId?: string }
  | { kind: 'place'; id: string }
  | { kind: 'other'; label: string };

export interface CitationSite {
  /** The data/-relative file. */
  file: string;
  /** Where in the file: "story[2]", "reigns[3]", "[aphrodite-parent-zeus]". */
  at: string;
  raw: string;
  context: CiteContext;
  /** The claim the citation proves, where the cited object carries one. */
  text?: string;
  topic?: string;
  owner: SiteOwner;
  /** Read out of a relation's note rather than a `citation` field: indexed, never gated. */
  fromNote?: boolean;
}

/** Folders and files that hold no citations, or none of the data's own. */
const SKIP_DIRS = new Set(['generated', 'culture', 'story-culture', 'library', 'raw']);
const SKIP_FILES = new Set(['geo/basemap.json']);
/** The chronology's citations explain a date as often as they cite a passage. */
const NOTE_FILES = new Set(['chronology.json']);

function jsonFiles(dir: string, root: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(name)) out.push(...jsonFiles(path, root));
      continue;
    }
    if (name.endsWith('.json') && !SKIP_FILES.has(relative(root, path))) out.push(path);
  }
  return out;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const stringList = (value: unknown) => (Array.isArray(value) && value.every((item) => typeof item === 'string') ? (value as string[]) : null);
const str = (value: unknown) => (typeof value === 'string' ? value : undefined);

function ownerOf(file: string, top: string, node: Record<string, unknown>, nearestId: string | undefined): SiteOwner {
  const stem = basename(file, '.json');
  if (file.startsWith('characters/')) return { kind: 'character', id: stem, part: top };
  if (file.startsWith('stories/')) {
    const part = top === 'chapters' ? 'chapter' : top === 'attestations' ? 'attestation' : 'summary';
    return { kind: 'story', id: stem, part, title: str(node.title) };
  }
  if (file === 'relations.json') return { kind: 'relation', id: str(node.id) ?? '?', from: str(node.from) ?? '?', to: str(node.to) ?? '?', type: str(node.type) ?? '?' };
  if (file.startsWith('lineages/')) return { kind: 'reign', city: stem, ruler: str(node.ruler) ?? '?', characterId: str(node.characterId) };
  if (file.startsWith('geo/')) return { kind: 'place', id: nearestId ?? stem };
  return { kind: 'other', label: file };
}

/** A relation's note cites in parentheses: "Born of Chaos (Theogony 123)". */
const CITES_IN_NOTE = /\(([^()]*\d[^()]*)\)/;

export function collectCitationSites(dataDir: string, options: { notes?: boolean } = {}): CitationSite[] {
  const sites: CitationSite[] = [];
  for (const path of jsonFiles(dataDir, dataDir)) {
    const file = relative(dataDir, path);
    const allowNotes = NOTE_FILES.has(file);
    const walk = (node: unknown, at: string, top: string, inherited: string[] | null, nearestId: string | undefined): void => {
      if (Array.isArray(node)) {
        node.forEach((item, index) => walk(item, `${at}[${isRecord(item) && typeof item.id === 'string' ? item.id : index}]`, top, inherited, nearestId));
        return;
      }
      if (!isRecord(node)) return;
      const sources = stringList(node.sources) ?? (typeof node.source === 'string' ? [node.source] : inherited);
      const id = str(node.id) ?? nearestId;
      const owner = () => ownerOf(file, top, node, id);
      if (typeof node.citation === 'string') {
        sites.push({
          file,
          at: at || '(root)',
          raw: node.citation,
          context: { sources: sources ?? undefined, work: str(node.work), allowNotes },
          text: str(node.text) ?? str(node.note),
          topic: str(node.topic),
          owner: owner(),
        });
      }
      if (options.notes && file === 'relations.json' && typeof node.note === 'string' && CITES_IN_NOTE.test(node.note)) {
        sites.push({ file, at: `${at} note`, raw: node.note, context: { sources: sources ?? undefined, allowNotes: true }, text: node.note, topic: str(node.topic), owner: owner(), fromNote: true });
      }
      for (const [key, value] of Object.entries(node)) {
        if (key !== 'citation') walk(value, at ? `${at}.${key}` : key, top || key, sources, id);
      }
    };
    walk(JSON.parse(readFileSync(path, 'utf8')), '', '', null, undefined);
  }
  return sites;
}
