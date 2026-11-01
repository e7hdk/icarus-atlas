import { buildNameIndex, buildSortedSearchNames } from '@/features/linking/name-index';
import { parseLinkedProse } from '@/features/linking/parse-prose';
import { resolveCharacterId } from '@/features/linking/resolve-name';
import { resolveSaga, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type {
  ArtOverrides,
  ArtWork,
  ArtWorkFigure,
  ArtWorkOverride,
  CommonsFileMeta,
  Medium,
  MediumVia,
  SagaVia,
  ShelfEntry,
} from '@/types/art';
import type { Character, CharacterType, Relation } from '@/types/character';
import type { Story } from '@/types/story';
import { commonsFileName, commonsHashPath } from './commons';

/** The Loom's catalogue (docs/LOOM_PLAN.md §4): one record per physical work,
 *  derived from the Legacy shelves, Commons metadata and a small overrides file.
 *  Pure and deterministic; `pnpm bake-art` writes the result. */

/** Bumped when a derivation rule changes: invalidates art-catalogue.json. */
export const CATALOGUE_VERSION = 1;

export interface CatalogueInput {
  entries: ShelfEntry[];
  stories: Story[];
  characters: Character[];
  relations: Relation[];
  commons: Record<string, CommonsFileMeta>;
  overrides: ArtOverrides;
}

export interface HeldWork {
  file: string;
  title: string;
  reason: string;
}

export interface CatalogueResult {
  works: ArtWork[];
  captions: Record<string, string>;
  /** Works that cannot enter the catalogue yet, with the reason. */
  held: HeldWork[];
}

/** Signed year for ordering, negative for BC; null when the string names no date. */
export function parseSortYear(raw: string): number | null {
  const text = raw.replace(/[–—]/g, '-');
  // "1893 (reconstruction of a 5th-century BC mural)": the work is the modern one.
  const modern = text.match(/^(\d{4})\s*\(/);
  if (modern) return Number(modern[1]);
  const bc = /\b(BC|BCE|B\.C\.)\b/i.test(text);
  const century = text.match(
    /(\d{1,2})(?:st|nd|rd|th)(?:[\s-]*(?:to[\s-]*)?\d{1,2}(?:st|nd|rd|th))?[\s-]*centur/i,
  );
  if (century) {
    let year = (Number(century[1]) - 1) * 100 + 50;
    if (/\b(early|first half)\b/i.test(text)) year -= 30;
    if (/\b(late|second half)\b/i.test(text)) year += 30;
    return bc ? -year : year;
  }
  const era = text.match(/\b(?:AD|CE)\s*(\d{1,4})/) ?? text.match(/(\d{1,4})\s*(?:AD|CE)\b/);
  if (era) return Number(era[1]);
  const year = text.match(/(\d{3,4})/) ?? (bc ? text.match(/(\d{1,4})/) : null);
  if (year) return bc ? -Number(year[1]) : Number(year[1]);
  if (/medieval/i.test(text)) return 1100;
  if (/byzantine/i.test(text)) return 800;
  if (/hadrianic|imperial/i.test(text)) return 130;
  if (/archaic/i.test(text)) return -520;
  if (/hellenistic/i.test(text)) return -200;
  if (/roman|antiquity/i.test(text)) return 100;
  if (/\bancient\b/i.test(text)) return -300;
  return null;
}

/** First match wins, so the rarer, more telling media come first. */
const MEDIUM_SIGNALS: [Medium, RegExp][] = [
  ['vase', /\b(kraters?|amphora[es]?|kylix|kylikes|hydria[ie]?|lekythos|lekythoi|vases?|red-figure|black-figure|oinochoe|skyphos|pelike|stamnos|psykter|aryballos|pithos|nestoris|loutrophoros|dinos|kantharos|alabastron|pyxis|pottery|lamps?|maiolica|majolica|bowls?|dish|dishes|plate with)\b/i],
  ['wall', /\b(mosaics?|frescos?|frescoes|wall paintings?|ceiling paintings?|tapestry|tapestries)\b/i],
  ['print', /\b(engravings?|engraved|woodcuts?|etchings?|prints?|drawings?|illustrations?|lithographs?|mezzotints?|frontispieces?|manuscripts?|miniatures?|illuminat\w+)\b/i],
  ['stone', /\b(statues?|statuettes?|sculptures?|marble|bronzes?|reliefs?|sarcophag(?:us|i)|friezes?|metopes?|pediments?|busts?|altars?|coins?|drachms?|didrachms?|staters?|gems?|intaglios?|cameos?|terracottas?|enamels?|master of the aeneid)\b/i],
  ['painting', /\b(paintings?|oil on|canvas|tempera)\b/i],
];

const SHELF_KIND_MEDIUM: Record<string, Medium> = {
  vase: 'vase',
  sculpture: 'stone',
  relief: 'stone',
  coin: 'stone',
  mosaic: 'wall',
  fresco: 'wall',
};

function mediumSignal(text: string): Medium | null {
  return MEDIUM_SIGNALS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function resolveMedium(
  entries: ShelfEntry[],
  categories: string[],
  sortYear: number,
): { medium: Medium; mediumVia: MediumVia } {
  const shelf = entries.map((entry) => SHELF_KIND_MEDIUM[entry.kind ?? '']).find(Boolean);
  if (shelf) return { medium: shelf, mediumVia: 'shelf' };

  // A work's own title is the best witness: "(Pompeii fresco)" outranks a category
  // that files every Pompeian wall under paintings. Its caption is the weakest:
  // captions compare, so a painting's caption may well mention marble.
  const lead = entries[0];
  const fromTitle = mediumSignal(`${lead.title} ${lead.artist}`);
  const fromCategories = mediumSignal(categories.join(' | '));
  if (fromTitle) {
    if (!fromCategories || fromCategories === fromTitle) {
      return { medium: fromTitle, mediumVia: fromCategories ? 'agreed' : 'text' };
    }
    return { medium: fromTitle, mediumVia: 'disputed' };
  }
  const fromCaption = mediumSignal(entries.map((entry) => entry.description).join(' '));
  if (fromCategories) {
    if (!fromCaption || fromCaption === fromCategories) {
      return { medium: fromCategories, mediumVia: fromCaption ? 'agreed' : 'category' };
    }
    return { medium: fromCategories, mediumVia: 'disputed' };
  }
  if (fromCaption) return { medium: fromCaption, mediumVia: 'text' };
  return { medium: sortYear < 1300 ? 'stone' : 'painting', mediumVia: 'default' };
}

function bestSaga(tally: Map<SagaId, number>): SagaId | null {
  const ranked = [...tally].sort(
    (a, b) => b[1] - a[1] || SAGA_ORDER.indexOf(a[0]) - SAGA_ORDER.indexOf(b[0]),
  );
  return ranked[0]?.[0] ?? null;
}

const DIVINE_SAGA: Partial<Record<CharacterType, SagaId>> = {
  olympian: 'olympian',
  god: 'olympian',
  titan: 'titan',
  primordial: 'primordial',
};

/** A category counts only when it is the figure itself. Anything looser leaks vase
 *  painters' names, modern cities and artists into the threads. */
const EXACT_CATEGORY =
  /^(.+?)(?: \((?:mythology|Greek mythology|mythological figure|Greek hero|Greek god|goddess|god|Titan|Titaness)\)| in (?:art|arts|painting|paintings|sculpture|sculptures|ancient [A-Z].*|Greek .*|Roman .*|mythology|literature))?$/;

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fnv(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const ID_LIMIT = 72;

function workSlug(entry: ShelfEntry): string {
  const person = entry.shelf === 'artifacts' || /^unknown\b/i.test(entry.artist)
    ? ''
    : slug(entry.artist.split(/[,(]/)[0].replace(/\bthe (elder|younger)\b/i, ''))
        .split('-')
        .pop() ?? '';
  const id = [person, slug(entry.title)].filter(Boolean).join('-');
  return id.length <= ID_LIMIT ? id : id.slice(0, ID_LIMIT).replace(/-+[^-]*$/, '');
}

/** Which shelf speaks for a work: a story's caption is written for the myth, a
 *  figure's for that figure, so a story goes first, then a figure the title names. */
function leadEntry(entries: ShelfEntry[], titled: Set<string>, override?: ArtWorkOverride): ShelfEntry {
  const chosen = override?.caption ? entries.find((entry) => entry.owner === override.caption) : undefined;
  if (chosen) return chosen;
  const story = entries.find((entry) => entry.ownerKind === 'story');
  if (story) return story;
  const named = entries.find((entry) => titled.has(entry.owner));
  if (named) return named;
  return [...entries].sort((a, b) => b.description.length - a.description.length)[0];
}

export function buildCatalogue(input: CatalogueInput): CatalogueResult {
  const { entries, stories, characters, relations, commons, overrides } = input;
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const sagaOfStory = new Map(stories.map((story) => [story.id, resolveSaga(story, storyById)]));
  const sortedNames = buildSortedSearchNames(characters);
  const nameIndex = buildNameIndex(characters);
  const characterTypes = Object.fromEntries(characters.map((c) => [c.id, c.type])) as Record<string, CharacterType>;

  // A figure's weight in each saga: leading a cast counts for more than walking on.
  const castWeights = new Map<string, Map<SagaId, number>>();
  for (const story of stories) {
    const saga = sagaOfStory.get(story.id)!;
    story.cast.forEach((member, index) => {
      if (!member.id) return;
      const weight = index === 0 ? 3 : index < 3 ? 2 : 1;
      const tally = castWeights.get(member.id) ?? new Map<SagaId, number>();
      tally.set(saga, (tally.get(saga) ?? 0) + weight);
      castWeights.set(member.id, tally);
    });
  }
  const neighbours = new Map<string, string[]>();
  for (const relation of relations) {
    for (const [from, to] of [[relation.from, relation.to], [relation.to, relation.from]]) {
      const list = neighbours.get(from) ?? [];
      list.push(to);
      neighbours.set(from, list);
    }
  }

  const canonical = new Map<string, string>();
  for (const [file, override] of Object.entries(overrides.works)) {
    for (const other of override.sameAs ?? []) canonical.set(other, file);
  }
  const groups = new Map<string, ShelfEntry[]>();
  const held: HeldWork[] = [];
  for (const entry of entries) {
    const raw = commonsFileName(entry.imageUrl);
    if (!raw) {
      held.push({ file: entry.imageUrl, title: entry.title, reason: 'not a Commons image' });
      continue;
    }
    const file = canonical.get(raw) ?? raw;
    groups.set(file, [...(groups.get(file) ?? []), entry]);
  }

  const works: ArtWork[] = [];
  const captions = new Map<ArtWork, string>();
  for (const file of [...groups.keys()].sort()) {
    const group = groups.get(file)!;
    const override = overrides.works[file];
    if (override?.exclude) continue;
    const meta = commons[file];
    if (!meta) {
      held.push({ file, title: group[0].title, reason: 'no Commons record: run pnpm art:commons' });
      continue;
    }

    const shelfFigures = [...new Set(group.filter((e) => e.ownerKind === 'figure').map((e) => e.owner))].sort();
    const storyIds = [...new Set(group.filter((e) => e.ownerKind === 'story').map((e) => e.owner))].sort();
    const scope = [...new Set([...shelfFigures, ...storyIds.flatMap((id) => (storyById.get(id)?.cast ?? []).flatMap((m) => (m.id ? [m.id] : [])))])];

    const titled = new Set<string>();
    for (const title of new Set(group.map((entry) => entry.title))) {
      for (const segment of parseLinkedProse(title, sortedNames, nameIndex, characterTypes, scope)) {
        if (segment.kind === 'link') titled.add(segment.id);
      }
    }
    const lead = leadEntry(group, titled, override);
    const ordered = [lead, ...group.filter((entry) => entry !== lead)];

    const sortYear = override?.sortYear ?? parseSortYear(lead.year);
    if (sortYear === null) {
      held.push({ file, title: lead.title, reason: `no date in "${lead.year}"` });
      continue;
    }

    const figures = new Map<string, ArtWorkFigure['via']>(shelfFigures.map((id) => [id, 'shelf']));
    for (const id of titled) if (!figures.has(id)) figures.set(id, 'title');
    for (const category of meta.categories) {
      const name = category.match(EXACT_CATEGORY)?.[1];
      const id = name ? resolveCharacterId(name, nameIndex, scope) : null;
      if (id && !figures.has(id)) figures.set(id, 'category');
    }
    for (const id of override?.figuresAdd ?? []) if (!figures.has(id)) figures.set(id, 'override');
    for (const id of override?.figuresRemove ?? []) figures.delete(id);
    const figureIds = [...figures.keys()];

    let saga: SagaId | null = null;
    let sagaVia: SagaVia = 'none';
    const settle = (candidate: SagaId | null, via: SagaVia) => {
      if (saga || !candidate) return;
      saga = candidate;
      sagaVia = via;
    };
    settle((override?.saga as SagaId | undefined) ?? null, 'override');
    if (!saga) {
      const tally = new Map<SagaId, number>();
      for (const id of storyIds) {
        const found = sagaOfStory.get(id);
        if (found) tally.set(found, (tally.get(found) ?? 0) + 1);
      }
      settle(bestSaga(tally), 'story');
    }
    if (!saga) {
      const tally = new Map<SagaId, number>();
      for (const id of figureIds) {
        for (const [found, weight] of castWeights.get(id) ?? []) tally.set(found, (tally.get(found) ?? 0) + weight);
      }
      settle(bestSaga(tally), 'cast');
    }
    if (!saga) {
      const divine = figureIds.flatMap((id) => DIVINE_SAGA[characterById.get(id)?.type as CharacterType] ?? []);
      settle(divine[0] ?? null, 'type');
    }
    if (!saga) {
      const tally = new Map<SagaId, number>();
      for (const id of figureIds) {
        for (const neighbour of neighbours.get(id) ?? []) {
          for (const [found, weight] of castWeights.get(neighbour) ?? []) {
            if (found !== 'heroic') tally.set(found, (tally.get(found) ?? 0) + weight);
          }
        }
      }
      settle(bestSaga(tally), 'relation');
    }

    const work: ArtWork = {
      id: workSlug(lead),
      title: lead.title,
      artist: lead.artist,
      year: lead.year,
      sortYear,
      ...(override?.medium ? { medium: override.medium, mediumVia: 'override' as const } : resolveMedium(ordered, meta.categories, sortYear)),
      file,
      // The lead may be a merged scan; the hash path must be this file's own.
      path: commonsHashPath(group.find((entry) => commonsFileName(entry.imageUrl) === file)?.imageUrl ?? '') ?? '',
      width: meta.width,
      height: meta.height,
      license: meta.license ?? 'unknown',
      figures: figureIds.map((id) => ({ id, via: figures.get(id)! })),
      stories: storyIds,
      saga: saga ?? 'heroic',
      sagaVia,
      ...(meta.licenseUrl ? { licenseUrl: meta.licenseUrl } : {}),
      ...(meta.author ? { author: meta.author } : {}),
      ...(override?.span ? { span: override.span } : {}),
      ...(override?.focus ? { focus: override.focus } : {}),
    };
    works.push(work);
    captions.set(work, lead.description);
  }

  // Two works may slug alike: the first by file name keeps the plain id.
  const taken = new Set<string>();
  for (const work of works) {
    if (taken.has(work.id)) work.id = `${work.id}-${fnv(work.file).slice(0, 6)}`;
    taken.add(work.id);
  }

  works.sort((a, b) => a.sortYear - b.sortYear || a.id.localeCompare(b.id));
  return {
    works,
    captions: Object.fromEntries(works.map((work) => [work.id, captions.get(work)!])),
    held,
  };
}
