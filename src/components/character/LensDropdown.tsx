'use client';

import { useEffect, useRef, useState } from 'react';
import type { LensId, Source } from '@/types/character';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useGalaxyStore } from '@/features/galaxy/store';

interface LensOption {
  id: LensId;
  name: string;
  note: string;
}

const CONSENSUS: LensOption = {
  id: 'consensus',
  name: 'All tellers',
  note: 'Every telling, disputes marked with ⚖',
};

/** The "told after" lens selector as a dropdown — mirrors the source-lens list
 *  in the atlas settings panel (active dot, name, works subtitle), so the
 *  single lens control reads the same wherever it appears. */
/** Popover width, capped to the viewport with a small gutter. */
const PANEL_WIDTH = 320;
const GUTTER = 8;

export function LensDropdown({ sources }: { sources: Source[] }) {
  const lens = useGalaxyStore((s) => s.lens);
  const setLens = useGalaxyStore((s) => s.setLens);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<{ left: number; width: number }>({ left: 0, width: PANEL_WIDTH });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const options: LensOption[] = [
    CONSENSUS,
    ...sources.map((source) => ({
      id: source.id,
      name: source.name,
      note: source.works.join(' · '),
    })),
  ];
  const current = options.find((option) => option.id === lens) ?? CONSENSUS;

  useEffect(() => {
    if (!open) return;
    // Centre the panel under the trigger, but clamp it inside the viewport so
    // it never overflows on narrow screens. Positioned absolute, so we store
    // the offset relative to this wrapper.
    const place = () => {
      const wrapper = ref.current;
      const trigger = triggerRef.current;
      if (!wrapper || !trigger) return;
      const vw = document.documentElement.clientWidth;
      const width = Math.min(PANEL_WIDTH, vw - GUTTER * 2);
      const triggerRect = trigger.getBoundingClientRect();
      const center = triggerRect.left + triggerRect.width / 2;
      const leftVp = Math.min(Math.max(center - width / 2, GUTTER), vw - GUTTER - width);
      setPanel({ left: leftVp - wrapper.getBoundingClientRect().left, width });
    };
    place();
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full border border-glass-border bg-glass px-4 py-2 backdrop-blur-xl transition-colors hover:border-nebula-soft/50"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-nebula-soft shadow-[0_0_10px_#c084fc]" />
        <span className="font-display text-[11.5px] tracking-[0.1em] text-aether">
          {current.name.toUpperCase()}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 text-aether-faint transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <GlassPanel
          role="listbox"
          aria-label="Choose a teller"
          style={{ left: panel.left, width: panel.width }}
          className="absolute top-full z-30 mt-2 overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.82),0_0_42px_rgba(124,77,255,0.14)] animate-[search-panel-in_160ms_cubic-bezier(0.2,0.8,0.2,1)]"
        >
          <div className="max-h-[58vh] overflow-y-auto p-1.5">
            {options.map((option) => {
              const active = lens === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLens(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-nebula-soft/55 bg-nebula-violet/20'
                      : 'border-transparent bg-white/[0.015] hover:border-glass-border hover:bg-white/[0.05]'
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
                    <span
                      className={`block font-display text-[11px] tracking-[0.12em] ${
                        active ? 'text-aether' : 'text-aether-muted'
                      }`}
                    >
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
        </GlassPanel>
      )}
    </div>
  );
}
