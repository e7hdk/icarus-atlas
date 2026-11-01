import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artCommonsSchema, artOverridesSchema, cultureSchema } from '../../src/lib/schemas';
import type { ArtCommons, ArtOverrides, ShelfEntry } from '../../src/types/art';

const DATA = join(import.meta.dirname, '..', '..', 'data');

export const ART_COMMONS_PATH = join(DATA, 'generated', 'art-commons.json');
export const ART_CATALOGUE_PATH = join(DATA, 'generated', 'art-catalogue.json');
export const ART_OVERRIDES_PATH = join(DATA, 'art', 'overrides.json');

/** Every artwork and artifact on a figure's or a story's shelf, in a stable order. */
export function readShelfEntries(): ShelfEntry[] {
  const entries: ShelfEntry[] = [];
  for (const [dir, ownerKind] of [['culture', 'figure'], ['story-culture', 'story']] as const) {
    const full = join(DATA, dir);
    for (const file of readdirSync(full).filter((name) => name.endsWith('.json')).sort()) {
      const culture = cultureSchema.parse(JSON.parse(readFileSync(join(full, file), 'utf-8')));
      for (const artwork of culture.artworks) {
        entries.push({ owner: culture.id, ownerKind, shelf: 'artworks', ...artwork });
      }
      for (const artifact of culture.artifacts ?? []) {
        entries.push({
          owner: culture.id,
          ownerKind,
          shelf: 'artifacts',
          title: artifact.title,
          artist: artifact.museum,
          year: artifact.period,
          imageUrl: artifact.imageUrl,
          description: artifact.description,
          kind: artifact.kind,
        });
      }
    }
  }
  return entries;
}

export function readArtCommons(): ArtCommons {
  if (!existsSync(ART_COMMONS_PATH)) return { files: {} };
  return artCommonsSchema.parse(JSON.parse(readFileSync(ART_COMMONS_PATH, 'utf-8'))) as ArtCommons;
}

export function readArtOverrides(): ArtOverrides {
  return artOverridesSchema.parse(JSON.parse(readFileSync(ART_OVERRIDES_PATH, 'utf-8'))) as ArtOverrides;
}
