import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArtCatalogue, ArtCommons, ArtOverrides, ArtWork } from '@/types/art';
import { commonsFileName } from './commons';

let catalogue: Promise<ArtCatalogue> | null = null;

/** The baked catalogue (data/generated/art-catalogue.json), read once per process. */
export function loadArtCatalogue(): Promise<ArtCatalogue> {
  catalogue ??= readFile(path.join(process.cwd(), 'data', 'generated', 'art-catalogue.json'), 'utf-8').then(
    (raw) => JSON.parse(raw) as ArtCatalogue,
  );
  return catalogue;
}

/** What the rest of the atlas asks of the Loom to build its bridges into it
 *  (docs/LOOM_PLAN.md §8). */
export interface LoomIndex {
  /** How many works on the cloth show a figure. */
  figureWorks: (id: string) => number;
  /** How many works on the cloth tell a story. */
  storyWorks: (id: string) => number;
  /** The work an image of the atlas shows, by its Commons URL, merged scans included. */
  workForImage: (imageUrl: string) => string | null;
}

let index: Promise<LoomIndex> | null = null;

export function loadLoomIndex(): Promise<LoomIndex> {
  index ??= Promise.all([
    loadArtCatalogue(),
    readFile(path.join(process.cwd(), 'data', 'art', 'overrides.json'), 'utf-8').then(
      (raw) => JSON.parse(raw) as ArtOverrides,
    ),
  ]).then(([{ works }, overrides]) => {
    const tally = (keys: string[][]) => {
      const counts = new Map<string, number>();
      for (const list of keys) for (const key of list) counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts;
    };
    const figures = tally(works.map((work) => work.figures.map((figure) => figure.id)));
    const stories = tally(works.map((work) => work.stories));
    const byFile = new Map(works.map((work) => [work.file, work.id]));
    // A scan merged into another work by `sameAs` opens that work.
    for (const [file, override] of Object.entries(overrides.works)) {
      const id = byFile.get(file);
      if (id) for (const other of override.sameAs ?? []) byFile.set(other, id);
    }
    return {
      figureWorks: (id) => figures.get(id) ?? 0,
      storyWorks: (id) => stories.get(id) ?? 0,
      workForImage: (imageUrl) => {
        const file = commonsFileName(imageUrl);
        return file ? (byFile.get(file) ?? null) : null;
      },
    };
  });
  return index;
}

/** Commons categories that say a work shows nudity. */
const NUDITY = /\b(nude|nudes|nudity|naked)\b/i;

let previews: Promise<(work: ArtWork) => boolean> | null = null;

/** Whether a shared link to a work previews as the work. Much of this art is nude and
 *  the audience arrives through Instagram, so a work its Commons categories call nude
 *  previews as the cloth instead, unless an override says otherwise either way
 *  (docs/LOOM_PLAN.md §10). */
export function loadPreviewPolicy(): Promise<(work: ArtWork) => boolean> {
  previews ??= Promise.all([
    readFile(path.join(process.cwd(), 'data', 'generated', 'art-commons.json'), 'utf-8').then(
      (raw) => JSON.parse(raw) as ArtCommons,
    ),
    readFile(path.join(process.cwd(), 'data', 'art', 'overrides.json'), 'utf-8').then(
      (raw) => JSON.parse(raw) as ArtOverrides,
    ),
  ]).then(([commons, overrides]) => (work) => {
    const chosen = overrides.works[work.file]?.preview;
    if (chosen !== undefined) return chosen;
    return !(commons.files[work.file]?.categories ?? []).some((category) => NUDITY.test(category));
  });
  return previews;
}
