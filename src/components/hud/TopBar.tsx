'use client';

import { MainNav } from '@/components/hud/MainNav';
import type { MainTab } from '@/components/hud/MainNav';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import { useGalaxyStore } from '@/features/galaxy/store';

export function TopBar({ active = 'galaxy' }: { active?: MainTab }) {
  const setSearchOpen = useGalaxyStore((state) => state.setSearchOpen);
  const settingsOpen = useGalaxyStore((state) => state.settingsOpen);
  const setSettingsOpen = useGalaxyStore((state) => state.setSettingsOpen);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center px-6 py-4">
      <IcarusBrand />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <MainNav active={active} />
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search the atlas"
          className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-glass-border bg-glass px-3 text-aether-muted backdrop-blur-xl transition-colors hover:border-nebula-soft/50 hover:text-aether"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <kbd className="rounded-md border border-glass-border px-1.5 py-px text-[9px] tracking-[0.1em] text-aether-faint">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          aria-label="Open atlas settings"
          aria-expanded={settingsOpen}
          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border bg-glass backdrop-blur-xl transition-colors ${
            settingsOpen
              ? 'border-nebula-soft/60 text-nebula-soft'
              : 'border-glass-border text-aether-muted hover:border-nebula-soft/50 hover:text-aether'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
