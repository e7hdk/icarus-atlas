'use client';

import { MainNav } from '@/components/hud/MainNav';
import { useGalaxyStore } from '@/features/galaxy/store';

export function TopBar() {
  const lens = useGalaxyStore((state) => state.lens);
  const spacingScale = useGalaxyStore((state) => state.spacingScale);
  const setSpacingScale = useGalaxyStore((state) => state.setSpacingScale);
  const setSearchOpen = useGalaxyStore((state) => state.setSearchOpen);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3 font-display text-sm tracking-[0.38em] text-aether">
        <span className="h-2 w-2 rounded-full bg-nebula-soft shadow-[0_0_12px_#c084fc]" aria-hidden />
        <span>
          ICARUS <span className="text-star-olympian">ATLAS</span>
        </span>
      </div>
      <MainNav active="galaxy" />
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-glass-border bg-glass px-4 py-1.5 font-display text-[11px] tracking-[0.14em] text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3 w-3"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          SEARCH
          <kbd className="rounded-md border border-glass-border px-1.5 py-px text-[9px] tracking-[0.1em] text-aether-faint">
            ⌘K
          </kbd>
        </button>
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-glass-border bg-glass px-4 py-1.5 backdrop-blur-xl">
          <span className="font-display text-[10px] tracking-[0.14em] text-aether-muted uppercase">
            Spacing
          </span>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.1"
            value={spacingScale}
            onChange={(e) => setSpacingScale(parseFloat(e.target.value))}
            className="w-24 accent-[#c084fc]"
          />
        </div>
        <span className="rounded-full border border-glass-border bg-glass px-4 py-1.5 font-display text-[11px] tracking-[0.14em] text-aether-muted backdrop-blur-xl">
          LENS · {lens.toUpperCase()}
        </span>
      </div>
    </header>
  );
}
