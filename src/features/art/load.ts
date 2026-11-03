import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArtCatalogue } from '@/types/art';

let catalogue: Promise<ArtCatalogue> | null = null;

/** The baked catalogue (data/generated/art-catalogue.json), read once per process. */
export function loadArtCatalogue(): Promise<ArtCatalogue> {
  catalogue ??= readFile(path.join(process.cwd(), 'data', 'generated', 'art-catalogue.json'), 'utf-8').then(
    (raw) => JSON.parse(raw) as ArtCatalogue,
  );
  return catalogue;
}
