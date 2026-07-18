'use client';

import { useEffect, useReducer, useState } from 'react';
import type { EphemerisCardPayload } from '@/types/spotlight';

/** Payloads are static per deploy — cache them for the session so the card
 *  and the proem share one fetch and reopening never refetches. The payload
 *  is read straight from the cache during render; the effect only fills it
 *  (all setState happens in async callbacks). */
const payloadCache = new Map<string, EphemerisCardPayload>();

export function useEphemerisPayload(
  id: string | null,
  enabled: boolean,
): { payload: EphemerisCardPayload | null; failed: boolean } {
  const [, bumpCache] = useReducer((version: number) => version + 1, 0);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !id || payloadCache.has(id)) return;
    const controller = new AbortController();
    fetch(`/api/ephemeris/${id}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`ephemeris payload ${response.status}`);
        return response.json();
      })
      .then((data: EphemerisCardPayload) => {
        payloadCache.set(id, data);
        bumpCache();
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedId(id);
      });
    return () => controller.abort();
  }, [enabled, id]);

  return {
    payload: id ? (payloadCache.get(id) ?? null) : null,
    failed: failedId !== null && failedId === id,
  };
}
