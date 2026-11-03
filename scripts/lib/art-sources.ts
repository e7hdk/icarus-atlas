import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { artCommonsSchema, artOverridesSchema, artPatternSchema, cultureSchema } from '../../src/lib/schemas';
import type { ArtCommons, ArtOverrides, ArtPattern, ShelfEntry } from '../../src/types/art';

const DATA = join(import.meta.dirname, '..', '..', 'data');

export const ART_COMMONS_PATH = join(DATA, 'generated', 'art-commons.json');
export const ART_CATALOGUE_PATH = join(DATA, 'generated', 'art-catalogue.json');
export const ART_OVERRIDES_PATH = join(DATA, 'art', 'overrides.json');
export const ART_PATTERNS_DIR = join(DATA, 'art', 'patterns');

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

/** The curated Patterns, in file order, each checked against its schema. The file name
 *  is the Pattern's id. */
export function readArtPatterns(): ArtPattern[] {
  if (!existsSync(ART_PATTERNS_DIR)) return [];
  return readdirSync(ART_PATTERNS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const parsed = artPatternSchema.safeParse(JSON.parse(readFileSync(join(ART_PATTERNS_DIR, name), 'utf-8')));
      if (!parsed.success) throw new Error(`art/patterns/${name}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')}`);
      if (`${parsed.data.id}.json` !== name) throw new Error(`art/patterns/${name}: id "${parsed.data.id}" must match the file name`);
      return parsed.data as ArtPattern;
    });
}
