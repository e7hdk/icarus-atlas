import { retrying, retryUrl } from '@/lib/retry';

/** A local image decoded off the main thread, as both Loom doors load their sprite
 *  sheets. A request that fails is tried again. */
export function loadBitmap(url: string): Promise<ImageBitmap> {
  return retrying(async (attempt) => {
    const response = await fetch(retryUrl(url, attempt));
    if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
    return createImageBitmap(await response.blob());
  });
}
