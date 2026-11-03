'use client';

import { useEffect, useState } from 'react';
import type { LoomWorkDetail } from '@/types/art';

type Details = Record<string, LoomWorkDetail>;

let details: Promise<Details> | null = null;

function fetchDetails(): Promise<Details> {
  details ??= fetch('/art/details.json').then((response) => response.json() as Promise<Details>);
  return details;
}

/** Captions, credits and links for every work, fetched once and only when something
 *  first asks: a plate opening, or the search palette. */
export function useWorkDetails(wanted: boolean): Details | null {
  const [loaded, setLoaded] = useState<Details | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    fetchDetails()
      .then((all) => {
        if (!cancelled) setLoaded(all);
      })
      .catch(() => {
        details = null;
      });
    return () => {
      cancelled = true;
    };
  }, [wanted]);
  return loaded;
}
