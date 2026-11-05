'use client';

import { useEffect, useReducer, useState } from 'react';
import { retrying, retryUrl } from '@/lib/retry';

interface FileEntry {
  promise: Promise<unknown>;
  data?: unknown;
}

const entries = new Map<string, FileEntry>();

/** Fetches a baked file once per visit, however many components ask. A failed fetch
 *  is tried twice more after a short wait (a phone's connection, or an in-app
 *  browser, can lose one request), then forgotten, so the next ask tries again. */
export function loadAtlasFile<T>(url: string): Promise<T> {
  const known = entries.get(url);
  if (known) return known.promise as Promise<T>;
  const entry: FileEntry = {
    promise: retrying(async (attempt) => {
      const response = await fetch(retryUrl(url, attempt));
      if (!response.ok) throw new Error(`${url} unavailable (${response.status})`);
      return (await response.json()) as unknown;
    })
      .then((data) => {
        entry.data = data;
        return data;
      })
      .catch((error: unknown) => {
        entries.delete(url);
        throw error;
      }),
  };
  entries.set(url, entry);
  return entry.promise as Promise<T>;
}

/** A baked file for rendering: `data` is there on the first render once it has
 *  landed. A failure stays failed until the component asks for another file or
 *  mounts again. */
export function useAtlasFile<T>(url: string | null): { data: T | null; failed: boolean } {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [, noteLanding] = useReducer((count: number) => count + 1, 0);
  const data = url ? entries.get(url)?.data : undefined;

  useEffect(() => {
    if (!url || entries.get(url)?.data !== undefined) return;
    let current = true;
    loadAtlasFile(url).then(
      () => {
        if (current) noteLanding();
      },
      () => {
        if (current) setFailedUrl(url);
      },
    );
    return () => {
      current = false;
    };
  }, [url]);

  return { data: (data as T | undefined) ?? null, failed: url !== null && failedUrl === url };
}
