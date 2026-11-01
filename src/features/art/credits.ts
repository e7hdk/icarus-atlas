import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArtCommons, CommonsFileMeta } from '@/types/art';
import type { CultureData } from '@/types/character';
import { commonsFileName, toImageCredit } from './commons';

/** Server-side lookup of image credits. Pages get them on the culture data, so no
 *  client ever loads the Commons metadata (docs/LOOM_PLAN.md §4.5). */

let commonsFiles: Promise<Record<string, CommonsFileMeta>> | null = null;

function loadCommonsFiles(): Promise<Record<string, CommonsFileMeta>> {
  commonsFiles ??= readFile(path.join(process.cwd(), 'data', 'generated', 'art-commons.json'), 'utf-8')
    .then((raw) => (JSON.parse(raw) as ArtCommons).files)
    .catch(() => ({}));
  return commonsFiles;
}

/** Attach each image's credit to a parsed culture file. */
export async function withCredits(culture: CultureData): Promise<CultureData> {
  const files = await loadCommonsFiles();
  const credited = <T extends { imageUrl: string }>(item: T): T => {
    const file = commonsFileName(item.imageUrl);
    const credit = file ? toImageCredit(file, files[file]) : undefined;
    return credit ? { ...item, credit } : item;
  };
  return {
    ...culture,
    artworks: culture.artworks.map(credited),
    ...(culture.artifacts ? { artifacts: culture.artifacts.map(credited) } : {}),
  };
}
