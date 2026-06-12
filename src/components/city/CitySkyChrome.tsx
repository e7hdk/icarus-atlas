'use client';

import { useEffect } from 'react';
import { BackArrow } from '@/components/ui/BackArrow';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Floating city context over the full galaxy experience of a city sky. */
export function CitySkyChrome({ cityId, cityName }: { cityId: string; cityName: string }) {
  const select = useGalaxyStore((s) => s.select);

  // Arrive with a clean slate — selection may linger from the main galaxy.
  useEffect(() => {
    select(null);
  }, [select]);

  return (
    <div className="pointer-events-none fixed left-4 top-28 z-20 sm:left-6 sm:top-16">
      <BackArrow href={`/city/${cityId}`} label={`Back to the ${cityName} codex`} />
      <p className="mt-2 pl-1 font-body text-sm italic text-aether-muted">
        The sky over {cityName} — only those who lived here.
      </p>
    </div>
  );
}
