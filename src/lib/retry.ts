/** How long to wait before each further attempt at a load. A connection that drops on a
 *  phone, or one request an in-app browser loses, usually clears within a second or two. */
const RETRY_DELAYS_MS: readonly number[] = [600, 1800];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs a load, and runs it again after a short wait each time it fails, two more times
 *  at most. `attempt` counts from 0, so a retry can ask in a way no cache answers. */
export function retrying<T>(load: (attempt: number) => Promise<T>, attempt = 0): Promise<T> {
  return load(attempt).catch(async (error: unknown) => {
    if (attempt >= RETRY_DELAYS_MS.length) throw error;
    await wait(RETRY_DELAYS_MS[attempt]);
    return retrying(load, attempt + 1);
  });
}

/** The address for an attempt: a retry is marked, so neither the page's preload nor a
 *  cache hands back the copy that just failed. The host serves the file the same. */
export function retryUrl(url: string, attempt: number): string {
  if (attempt === 0) return url;
  return `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}`;
}
