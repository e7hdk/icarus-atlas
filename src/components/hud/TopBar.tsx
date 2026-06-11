'use client';

import { useGalaxyStore } from '@/features/galaxy/store';

export function TopBar() {
  const lens = useGalaxyStore((state) => state.lens);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3 font-display text-sm tracking-[0.38em] text-aether">
        <span className="h-2 w-2 rounded-full bg-nebula-soft shadow-[0_0_12px_#c084fc]" aria-hidden />
        <span>
          ICARUS <span className="text-star-olympian">ATLAS</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-glass-border bg-glass px-4 py-1.5 font-display text-[11px] tracking-[0.14em] text-aether-muted backdrop-blur-xl">
          LENS · {lens.toUpperCase()}
        </span>
      </div>
    </header>
  );
}
