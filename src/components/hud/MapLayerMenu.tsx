'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_MAP_LAYERS,
  layersEqual,
  MAP_LAYER_IDS,
  type MapLayerId,
} from '@/features/geo/map-layers';
import { useLandsStore } from '@/features/geo/lands-store';
import { GlassPanel } from '@/components/ui/GlassPanel';

const LABELS: Record<MapLayerId, string> = {
  cities: 'Cities',
  sanctuaries: 'Sanctuaries',
  rivers: 'Rivers',
};

/** Map layer filter — ellipsis menu to the left of the Lands search bar. */
export function MapLayerMenu() {
  const mapLayers = useLandsStore((s) => s.mapLayers);
  const setMapLayers = useLandsStore((s) => s.setMapLayers);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = !layersEqual(mapLayers, DEFAULT_MAP_LAYERS);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (id: MapLayerId) => {
    // Plain toggle — turning the last layer off leaves the map bare (it used to snap
    // everything back on, which read as a bug).
    setMapLayers({ ...mapLayers, [id]: !mapLayers[id] });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Map layers"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border bg-glass backdrop-blur-xl transition-colors ${
          open || filtered
            ? 'border-nebula-soft/50 text-nebula-soft'
            : 'border-glass-border text-aether-muted hover:border-nebula-soft/50 hover:text-aether'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {open && (
        <GlassPanel
          role="menu"
          className="pointer-events-auto absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[11.5rem] bg-glass-heavy py-1.5 shadow-[0_16px_48px_rgba(5,2,15,0.75)]"
        >
          <p className="px-3.5 pb-1.5 font-display text-[9px] tracking-[0.22em] text-aether-faint">
            MAP LAYERS
          </p>
          {MAP_LAYER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={mapLayers[id]}
              onClick={() => toggle(id)}
              className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-nebula-violet/10"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  mapLayers[id]
                    ? 'border-nebula-soft/60 bg-nebula-violet/30 text-nebula-soft'
                    : 'border-glass-border bg-transparent'
                }`}
                aria-hidden
              >
                {mapLayers[id] ? (
                  <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                    <path
                      d="M2 6.2 4.8 9 10 3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="font-body text-[15px] text-aether/90">{LABELS[id]}</span>
            </button>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
