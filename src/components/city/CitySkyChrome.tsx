'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Floating city context over the full galaxy experience of a city sky. */
export function CitySkyChrome({ cityId, cityName }: { cityId: string; cityName: string }) {
  const select = useGalaxyStore((s) => s.select);

  // Arrive with a clean slate — selection may linger from the main galaxy.
  useEffect(() => {
    select(null);
  }, [select]);

  return (
    <div className="pointer-events-none fixed left-6 top-16 z-20">
      <Link
        href={`/city/${cityId}`}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-4 py-1.5 font-display text-[11px] tracking-[0.18em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether"
      >
        ← {cityName.toUpperCase()} CODEX
      </Link>
      <p className="mt-2 pl-1 font-body text-sm italic text-aether-muted">
        The sky over {cityName} — only those who lived here.
      </p>
    </div>
  );
}
