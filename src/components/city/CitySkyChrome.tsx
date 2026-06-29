'use client';

import { useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Floating city context over the full galaxy experience of a city sky. */
export function CitySkyChrome({
  cityName,
  greekName,
  residentCount,
}: {
  cityId: string;
  cityName: string;
  residentCount: number;
  greekName?: string;
}) {
  const select = useGalaxyStore((s) => s.select);

  // Arrive with a clean slate — selection may linger from the main galaxy.
  useEffect(() => {
    select(null);
  }, [select]);

  const residentLabel = residentCount === 1 ? '1 resident' : `${residentCount} residents`;

  return (
    <GlassPanel className="pointer-events-none fixed left-4 top-[4.25rem] z-20 max-w-[min(18rem,calc(100vw-2rem))] bg-glass-heavy px-4 py-3 shadow-[0_8px_32px_rgba(5,2,15,0.55),0_0_24px_rgba(124,77,255,0.12)] sm:left-6 sm:top-[4.5rem] sm:px-5 sm:py-3.5">
      <p className="font-display text-[13px] uppercase tracking-[0.14em] text-aether">
        {cityName}
      </p>
      {greekName && (
        <p className="mt-0.5 font-body text-[14px] italic text-aether-muted">{greekName}</p>
      )}
      <p className="mt-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-nebula-soft/90">
        {residentLabel}
      </p>
      <p className="mt-1 font-body text-[13px] italic leading-snug text-aether-faint">
        Only those who lived here
      </p>
    </GlassPanel>
  );
}
