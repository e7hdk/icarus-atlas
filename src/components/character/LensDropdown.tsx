'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
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

/** Popover width, capped to the viewport with a small gutter, and its gap from the trigger. */
const PANEL_WIDTH = 320;
const GUTTER = 8;
const GAP = 8;

interface Placement {
  panel: CSSProperties;
  maxHeight: number;
}

/** Where the open panel sits, in viewport coordinates: under the trigger, its
 *  left edge on the trigger's, kept inside the viewport; above the trigger when
 *  the room below is short and the room above is larger. */
function placement(trigger: DOMRect): Placement {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const width = Math.min(PANEL_WIDTH, vw - GUTTER * 2);
  const left = Math.min(Math.max(trigger.left, GUTTER), vw - GUTTER - width);
  const cap = vh * 0.58;
  const below = vh - trigger.bottom - GAP - GUTTER;
  const above = trigger.top - GAP - GUTTER;
  if (below >= Math.min(cap, 300) || below >= above) {
    return { panel: { left, width, top: trigger.bottom + GAP }, maxHeight: Math.min(cap, below) };
  }
  return { panel: { left, width, bottom: vh - trigger.top + GAP }, maxHeight: Math.min(cap, above) };
}

/** The "told after" lens selector as a dropdown — mirrors the source-lens list
 *  in the atlas settings panel (active dot, name, works subtitle), so the
 *  single lens control reads the same wherever it appears.
 *
 *  The panel renders into the body at a fixed position. Inside the codex it
 *  would sit in the sidebar, which scrolls on its own at lg and so clips
 *  anything wider than itself, and under the card's own glass, where a second
 *  backdrop blur does not take and the text behind shows through. */
export function LensDropdown({ sources }: { sources: Source[] }) {
  const lens = useGalaxyStore((s) => s.lens);
  const setLens = useGalaxyStore((s) => s.setLens);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const options: LensOption[] = [
    CONSENSUS,
    ...sources.map((source) => ({
      id: source.id,
      name: source.name,
      note: source.works.join(' · '),
    })),
  ];
  const current = options.find((option) => option.id === lens) ?? CONSENSUS;

  const toggle = () => {
    const trigger = triggerRef.current;
    if (!open && trigger) setPlace(placement(trigger.getBoundingClientRect()));
    setOpen((value) => !value);
  };

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    // The panel follows its trigger through scrolls and resizes, and closes
    // once the trigger has left the viewport.
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setOpen(false);
          return;
        }
        setPlace(placement(rect));
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, { capture: true });
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
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

      {open &&
        place &&
        createPortal(
          <GlassPanel
            ref={panelRef}
            role="listbox"
            aria-label="Choose a teller"
            style={place.panel}
            className="fixed z-20 overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.82),0_0_42px_rgba(124,77,255,0.14)] animate-[search-panel-in_160ms_cubic-bezier(0.2,0.8,0.2,1)]"
          >
            <div className="overflow-y-auto overscroll-contain p-1.5" style={{ maxHeight: place.maxHeight }}>
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
          </GlassPanel>,
          document.body,
        )}
    </div>
  );
}
