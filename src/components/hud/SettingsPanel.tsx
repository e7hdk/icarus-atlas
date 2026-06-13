'use client';

import { useState } from 'react';
import type { LensId, Source } from '@/types/character';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useGalaxyStore } from '@/features/galaxy/store';
import { APP_VERSION } from '@/lib/changelog';
import { ChangelogPanel } from './ChangelogPanel';

const CONSENSUS: { id: LensId; name: string; note: string } = {
  id: 'consensus',
  name: 'Consensus',
  note: 'All tellers, with disputed traditions marked.',
};

export function SettingsPanel({ sources, starCount }: { sources: Source[]; starCount: number }) {
  const open = useGalaxyStore((state) => state.settingsOpen);
  const setOpen = useGalaxyStore((state) => state.setSettingsOpen);
  const setSearchOpen = useGalaxyStore((state) => state.setSearchOpen);
  const lens = useGalaxyStore((state) => state.lens);
  const setLens = useGalaxyStore((state) => state.setLens);
  const spacingScale = useGalaxyStore((state) => state.spacingScale);
  const setSpacingScale = useGalaxyStore((state) => state.setSpacingScale);
  const musicEnabled = useGalaxyStore((state) => state.musicEnabled);
  const setMusicEnabled = useGalaxyStore((state) => state.setMusicEnabled);
  const musicVolume = useGalaxyStore((state) => state.musicVolume);
  const setMusicVolume = useGalaxyStore((state) => state.setMusicVolume);
  const [changelogOpen, setChangelogOpen] = useState(false);

  if (!open) return null;

  const lenses = [CONSENSUS, ...sources.map((source) => ({
    id: source.id,
    name: source.name,
    note: source.works.join(' · '),
  }))];

  return (
    <>
    <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)}>
      <GlassPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-settings-title"
        className="absolute right-3 top-[4.25rem] max-h-[calc(100dvh-5.5rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.82),0_0_42px_rgba(124,77,255,0.14)] animate-[search-panel-in_180ms_cubic-bezier(0.2,0.8,0.2,1)] sm:right-6 sm:w-[min(24rem,calc(100vw-3rem))]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-glass-border px-5 py-4">
          <div>
            <h2 id="atlas-settings-title" className="font-display text-sm tracking-[0.2em] text-aether">
              ATLAS SETTINGS
            </h2>
            <p className="mt-1 font-body text-sm italic text-aether-faint">
              Shape the sky and choose its teller.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close settings"
            className="rounded-full px-2 py-1 font-display text-xs text-aether-faint transition-colors hover:text-aether"
          >
            ×
          </button>
        </div>

        <section className="flex items-center justify-between border-b border-glass-border px-5 py-3.5">
          <span className="font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
            Stars in the sky
          </span>
          <span className="font-display text-sm tracking-[0.14em] text-nebula-soft drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]">
            {starCount.toLocaleString()}
          </span>
        </section>

        <section className="border-b border-glass-border px-5 py-3 sm:hidden">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-glass-border bg-white/[0.03] px-3.5 py-3 text-left transition-colors hover:border-nebula-soft/50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 shrink-0 text-nebula-soft"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[11px] tracking-[0.16em] text-aether">
              SEARCH THE ATLAS
            </span>
          </button>
        </section>

        <section className="border-b border-glass-border px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
              Ambient music
            </h3>
            <button
              type="button"
              role="switch"
              aria-checked={musicEnabled}
              aria-label="Toggle ambient music"
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`relative h-5 w-9 rounded-full border transition-colors ${
                musicEnabled
                  ? 'border-nebula-soft/60 bg-nebula-violet/40'
                  : 'border-glass-border bg-white/[0.04]'
              }`}
            >
              <span
                className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
                  musicEnabled
                    ? 'left-[1.15rem] bg-nebula-soft shadow-[0_0_10px_#c084fc]'
                    : 'left-0.5 bg-aether-faint'
                }`}
              />
            </button>
          </div>
          <input
            aria-label="Music volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            disabled={!musicEnabled}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
            className="mt-3 w-full accent-[#c084fc] disabled:opacity-40"
          />
          <div className="mt-1 flex justify-between font-body text-xs italic text-aether-faint">
            <span>{musicEnabled ? 'Now playing' : 'Silenced'}</span>
            <span>{Math.round(musicVolume * 100)}%</span>
          </div>
        </section>

        <section className="border-b border-glass-border px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
              Star spacing
            </h3>
            <span className="font-display text-[10px] tracking-[0.12em] text-nebula-soft">
              {spacingScale.toFixed(1)}×
            </span>
          </div>
          <input
            aria-label="Star spacing"
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={spacingScale}
            onChange={(event) => setSpacingScale(Number(event.target.value))}
            className="mt-3 w-full accent-[#c084fc]"
          />
          <div className="mt-1 flex justify-between font-body text-xs italic text-aether-faint">
            <span>Close orbit</span>
            <span>Wide cosmos</span>
          </div>
        </section>

        <section className="px-5 py-4">
          <h3 className="font-display text-[10px] uppercase tracking-[0.24em] text-aether-faint">
            Source lens
          </h3>
          <div className="mt-3 grid gap-1.5">
            {lenses.map((option) => {
              const active = lens === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLens(option.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-nebula-soft/55 bg-nebula-violet/20'
                      : 'border-transparent bg-white/[0.025] hover:border-glass-border hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      active
                        ? 'bg-nebula-soft shadow-[0_0_10px_#c084fc]'
                        : 'border border-aether-faint'
                    }`}
                  />
                  <span className="min-w-0">
                    <span className={`block font-display text-[11px] tracking-[0.12em] ${active ? 'text-aether' : 'text-aether-muted'}`}>
                      {option.name.toUpperCase()}
                    </span>
                    <span className="mt-0.5 block truncate font-body text-xs italic text-aether-faint">
                      {option.note}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-glass-border px-5 py-4 text-center">
          <div className="flex items-center justify-between font-display text-[9px] uppercase tracking-[0.18em] text-aether-faint">
            <span>Icarus Atlas</span>
            <button
              type="button"
              onClick={() => setChangelogOpen(true)}
              className="rounded-full px-1.5 py-0.5 tracking-[0.18em] text-nebula-soft/90 transition-colors hover:text-nebula-soft hover:underline"
              title="Read the chronicle"
            >
              v{APP_VERSION}
            </button>
          </div>
          <p className="mt-3 font-body text-[13px] italic leading-relaxed text-aether-muted">
            Created by <span className="text-aether">Mehmet Fatih Aksoy</span>,
            <br />
            with the Muses&rsquo; fire and a mortal&rsquo;s devotion.
          </p>
        </footer>
      </GlassPanel>
    </div>
    <ChangelogPanel open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </>
  );
}
