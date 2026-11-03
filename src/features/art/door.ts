import { SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type {
  ArtPattern,
  ArtWork,
  CommonsFileMeta,
  LoomDoorData,
  LoomDoorLayout,
  LoomDoorPattern,
  LoomWorkDetail,
  LoomWorkRow,
  Medium,
} from '@/types/art';
import type { Character } from '@/types/character';
import type { Story } from '@/types/story';
import { commonsOriginalUrl, commonsThumbSteps, commonsThumbUrl, toImageCredit } from './commons';
import { buildLoomLayout, LOOM_WIDTH, type LoomLayout } from './loom';
import { buildThreads, type LoomThread } from './threads';

/** Bumped whenever public/art/loom.json changes shape, so the bake rewrites it. */
export const DOOR_VERSION = 3;

/** The Art door's client data (docs/LOOM_PLAN.md §4.8). `pnpm bake-art` writes it to
 *  public/art/ instead of each page embedding it, because `/art/[id]` is prerendered
 *  1,703 times and the same payload in every page would be a quarter of a gigabyte. */

export const MEDIA: Medium[] = ['painting', 'vase', 'stone', 'wall', 'print'];

export const MEDIUM_LABEL: Record<Medium, string> = {
  painting: 'Paintings',
  vase: 'Vases & ceramics',
  stone: 'Sculpture & objects',
  wall: 'Walls & floors',
  print: 'Prints & drawings',
};

/** The subset of public/art/manifest.json the door reads. */
export interface AtlasManifest {
  columns: number;
  cell: number;
  lqCell: number;
  anchorColumns: number;
  anchorSlot: number;
  sprites: Record<string, number>;
  anchors: Record<string, number>;
}

function compactLayout(layout: LoomLayout, works: ArtWork[]): LoomDoorLayout {
  const tileOf = new Map(layout.tiles.map((tile) => [tile.id, tile]));
  return {
    width: layout.width,
    height: layout.height,
    tearTop: layout.tearTop,
    tearRows: layout.tearRows,
    eras: layout.eras,
    cells: works.flatMap((work) => {
      const tile = tileOf.get(work.id);
      return tile ? [tile.x, tile.row, tile.w, tile.h] : [0, 0, 0, 0];
    }),
  };
}

export function buildDoorData(
  catalogue: ArtWork[],
  manifest: AtlasManifest,
  characters: Character[],
  patterns: ArtPattern[],
  sourceNames: Record<string, string>,
): LoomDoorData {
  const works = catalogue.filter((work) => manifest.sprites[work.id] !== undefined);
  const workIndex = new Map(works.map((work, index) => [work.id, index]));
  const names = new Map(characters.map((character) => [character.id, character.name]));
  const figureIds = [...new Set(works.flatMap((work) => work.figures.map(({ id }) => id)))].sort();
  const figureIndex = new Map(figureIds.map((id, index) => [id, index]));
  const rows = works.map(
    (work): LoomWorkRow => [
      work.id,
      work.title,
      work.artist,
      work.year,
      work.sortYear,
      SAGA_ORDER.indexOf(work.saga),
      MEDIA.indexOf(work.medium),
      work.path,
      work.file,
      work.width,
      work.height,
      manifest.sprites[work.id],
      manifest.anchors[work.id] ?? -1,
      work.figures.map(({ id }) => figureIndex.get(id) as number),
    ],
  );
  // Anchors missing from the atlas fall back to single tiles rather than a hole.
  const placed = works.map((work) => (manifest.anchors[work.id] === undefined ? { ...work, span: undefined } : work));
  return {
    works: rows,
    figures: figureIds.map((id): [string, string] => [id, names.get(id) ?? id]),
    // A work the atlas does not hold yet drops out of its Pattern until the next bake.
    patterns: patterns.map(
      (pattern): LoomDoorPattern => ({
        id: pattern.id,
        title: pattern.title,
        summary: pattern.summary,
        stops: pattern.stops.flatMap(({ work, note, citation, sources, evidence }) => {
          const index = workIndex.get(work);
          if (index === undefined) return [];
          // Written as the site's other footnotes are: the tellers, then the passage.
          const footnote = sources
            ? `${sources.map((id) => sourceNames[id] ?? id).join(' · ')}${citation ? ` — ${citation}` : ''}`
            : undefined;
          return [{ work: index, note, footnote, evidence }];
        }),
        members: (pattern.members ?? []).flatMap((work) => workIndex.get(work) ?? []),
      }),
    ),
    desktop: compactLayout(buildLoomLayout(placed, LOOM_WIDTH.desktop), works),
    phone: compactLayout(buildLoomLayout(placed, LOOM_WIDTH.phone), works),
    sheet: {
      columns: manifest.columns,
      cell: manifest.cell,
      lqCell: manifest.lqCell,
      anchorColumns: manifest.anchorColumns,
      anchorSlot: manifest.anchorSlot,
    },
  };
}

export function buildDoorDetails(
  works: ArtWork[],
  captions: Record<string, string>,
  commons: Record<string, CommonsFileMeta>,
  characters: Character[],
  stories: Story[],
): Record<string, LoomWorkDetail> {
  const names = new Map(characters.map((character) => [character.id, character.name]));
  const titles = new Map(stories.map((story) => [story.id, story.title]));
  return Object.fromEntries(
    works.map((work) => {
      const credit = toImageCredit(work.file, commons[work.file]);
      return [
        work.id,
        {
          caption: captions[work.id] ?? '',
          ...(credit ? { credit } : {}),
          figures: work.figures.flatMap(({ id }) => {
            const name = names.get(id);
            return name ? [{ id, name }] : [];
          }),
          stories: work.stories.flatMap((id) => {
            const title = titles.get(id);
            return title ? [{ id, title }] : [];
          }),
        },
      ];
    }),
  );
}

/** A work as the client holds it. */
export interface LoomWork {
  index: number;
  id: string;
  title: string;
  artist: string;
  year: string;
  sortYear: number;
  saga: SagaId;
  medium: Medium;
  path: string;
  file: string;
  width: number;
  height: number;
  sprite: number;
  anchor: number;
  x: number;
  row: number;
  w: number;
  h: number;
  /** Indices into `LoomDoor.figures`. */
  figures: number[];
}

/** A stop of a Pattern, as the door holds it: `work` indexes `LoomDoor.works`. */
export type LoomPatternStop = LoomDoorPattern['stops'][number];

/** A Pattern on the client: `lit` holds its stops and members, which stay bright
 *  while it is shown. */
export interface LoomPattern extends LoomDoorPattern {
  lit: Set<number>;
}

export interface LoomDoor {
  works: LoomWork[];
  byId: Map<string, LoomWork>;
  figures: { id: string; name: string }[];
  patterns: LoomPattern[];
  threads: LoomThread[];
  /** Thread indices per work. */
  threadsOf: number[][];
  /** Work index per cell, -1 where no work sits. */
  cellOf: Int32Array;
  layout: LoomDoorLayout;
  sheet: LoomDoorData['sheet'];
}

export function decodeDoor(data: LoomDoorData, phone: boolean): LoomDoor {
  const layout = phone ? data.phone : data.desktop;
  const works = data.works.map((row, index): LoomWork => {
    const [id, title, artist, year, sortYear, saga, medium, path, file, width, height, sprite, anchor, figures] = row;
    return {
      index,
      id,
      title,
      artist,
      year,
      sortYear,
      saga: SAGA_ORDER[saga],
      medium: MEDIA[medium],
      path,
      file,
      width,
      height,
      sprite,
      anchor,
      x: layout.cells[index * 4],
      row: layout.cells[index * 4 + 1],
      w: layout.cells[index * 4 + 2],
      h: layout.cells[index * 4 + 3],
      figures,
    };
  });
  const cellOf = new Int32Array(layout.width * layout.height).fill(-1);
  for (const work of works) {
    for (let dy = 0; dy < work.h; dy++) {
      for (let dx = 0; dx < work.w; dx++) cellOf[(work.row + dy) * layout.width + work.x + dx] = work.index;
    }
  }
  const figures = data.figures.map(([id, name]) => ({ id, name }));
  const { threads, threadsOf } = buildThreads(works, figures.map((figure) => figure.name));
  return {
    works,
    byId: new Map(works.map((work) => [work.id, work])),
    figures,
    patterns: data.patterns.map((pattern) => ({
      ...pattern,
      lit: new Set([...pattern.stops.map((stop) => stop.work), ...pattern.members]),
    })),
    threads,
    threadsOf,
    cellOf,
    layout,
    sheet: data.sheet,
  };
}

/** The Patterns whose gold thread passes through a work, with what each says there. */
export function stopsAt(door: LoomDoor, work: number): { pattern: number; stop: LoomPatternStop }[] {
  return door.patterns.flatMap((pattern, index) =>
    pattern.stops.filter((stop) => stop.work === work).map((stop) => ({ pattern: index, stop })),
  );
}

/** The sharpest Commons image of a work up to `wanted` pixels wide. */
export function workImageUrl(work: Pick<LoomWork, 'path' | 'file' | 'width'>, wanted: number): string {
  const [step] = commonsThumbSteps(work.width, wanted);
  return step ? commonsThumbUrl(work.path, work.file, step) : commonsOriginalUrl(work.path, work.file);
}
