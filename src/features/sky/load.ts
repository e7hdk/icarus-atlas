import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { constellationsFileSchema } from '@/lib/schemas';
import type { Constellation, SkyCatalogue } from '@/types/sky';

/** The Greek sky (data/sky/constellations.json, baked by scripts/build-sky.ts).
 *  Server-side like the rest of the loaders — the client component imports the
 *  JSON directly, since the sky is static and must be in the scene at once. */
export async function loadSky(): Promise<SkyCatalogue> {
  const raw = JSON.parse(
    await readFile(path.join(process.cwd(), 'data', 'sky', 'constellations.json'), 'utf-8'),
  );
  return constellationsFileSchema.parse(raw) as SkyCatalogue;
}

export async function loadConstellation(id: string): Promise<Constellation | undefined> {
  const sky = await loadSky();
  return sky.constellations.find((figure) => figure.id === id);
}
