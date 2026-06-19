'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeoCity, GeoFeature, GeoPlace } from '@/types/geo';
import { useLandsStore } from '@/features/geo/lands-store';
import { useGalaxyStore } from '@/features/galaxy/store';
import { searchPlaces, type PlaceSearchHit } from '@/features/search/places-match';
import { GlassPanel } from '@/components/ui/GlassPanel';

const KIND_COLOR: Record<PlaceSearchHit['kind'], string> = {
  city: '#c084fc',
  place: '#fcd34d',
  feature: '#22d3ee',
};

/** Command-palette search (⌘K) for cities, sanctuaries, rivers, and mountains on the Lands map. */
export function PlacesSearchOverlay({
  cities,
  places,
  features,
}: {
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
}) {
  const searchOpen = useGalaxyStore((s) => s.searchOpen);
  if (!searchOpen) return null;
  return (
    <PlacesSearchDialog cities={cities} places={places} features={features} />
  );
}

function PlacesSearchDialog({
  cities,
  places,
  features,
}: {
  cities: GeoCity[];
  places: GeoPlace[];
  features: GeoFeature[];
}) {
  const setSearchOpen = useGalaxyStore((s) => s.setSearchOpen);
  const setMapTarget = useLandsStore((s) => s.setMapTarget);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(
    () => searchPlaces(cities, places, features, query),
    [cities, places, features, query],
  );
  const active = Math.min(activeIndex, Math.max(hits.length - 1, 0));

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const travel = (hit: PlaceSearchHit) => {
    setSearchOpen(false);
    setMapTarget({ kind: hit.kind, id: hit.id });
    const params = new URLSearchParams();
    if (hit.kind === 'city') params.set('city', hit.id);
    else if (hit.kind === 'place') params.set('place', hit.id);
    else params.set('feature', hit.id);
    const next = params.toString();
    if (window.location.hash.replace(/^#/, '') !== next) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${next}`);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setSearchOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(hits.length ? (active + 1) % hits.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(hits.length ? (active - 1 + hits.length) % hits.length : 0);
    } else if (event.key === 'Enter' && hits[active]) {
      event.preventDefault();
      travel(hits[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-cosmos-deep/55 px-4 pt-16 backdrop-blur-[6px] animate-[search-veil-in_160ms_ease-out] sm:pt-[18vh]"
      onMouseDown={() => setSearchOpen(false)}
    >
      <GlassPanel
        className="w-full max-w-xl overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(124,77,255,0.16)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-glass-border px-5 py-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 shrink-0 text-nebula-soft drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search cities, sanctuaries, rivers…"
            spellCheck={false}
            className="flex-1 bg-transparent font-body text-xl text-aether placeholder:text-aether-faint focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-glass-border bg-glass px-1.5 py-0.5 font-display text-[9px] tracking-[0.18em] text-aether-faint sm:block">
            ESC
          </kbd>
        </div>

        {query.trim() && hits.length === 0 && (
          <p className="px-5 py-6 text-center font-body text-[15px] italic text-aether-muted">
            No place answers to &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {hits.length > 0 && (
          <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-1.5">
            {hits.map((hit, index) => (
              <PlaceResultRow
                key={`${hit.kind}-${hit.id}`}
                hit={hit}
                index={index}
                isActive={index === active}
                onHover={() => setActiveIndex(index)}
                onTravel={() => travel(hit)}
              />
            ))}
          </div>
        )}

        <div className="hidden items-center gap-4 border-t border-glass-border px-5 py-2.5 font-display text-[9px] uppercase tracking-[0.2em] text-aether-faint sm:flex">
          <span>↑↓ Navigate</span>
          <span>↵ Fly to</span>
          {query.trim() && hits.length > 0 && (
            <span className="ml-auto">
              {hits.length} {hits.length === 1 ? 'place' : 'places'}
            </span>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function PlaceResultRow({
  hit,
  index,
  isActive,
  onHover,
  onTravel,
}: {
  hit: PlaceSearchHit;
  index: number;
  isActive: boolean;
  onHover: () => void;
  onTravel: () => void;
}) {
  const color = KIND_COLOR[hit.kind];

  return (
    <button
      type="button"
      data-index={index}
      onMouseEnter={onHover}
      onClick={onTravel}
      className={`flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors duration-100 ${
        isActive ? 'bg-nebula-violet/15' : ''
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: isActive ? `0 0 12px ${color}` : `0 0 6px ${color}88`,
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] uppercase tracking-[0.1em] text-aether">
          {hit.field === 'name' ? (
            <Highlight value={hit.value} start={hit.start} end={hit.end} color={color} />
          ) : (
            hit.name
          )}
        </span>
        {hit.field !== 'name' && hit.greekName ? (
          <span className="block truncate font-body text-[13px] italic text-aether-muted">
            <Highlight value={hit.value} start={hit.start} end={hit.end} color={color} />
          </span>
        ) : (
          <span className="block truncate font-body text-[13px] italic text-aether-muted">
            {hit.greekName}
          </span>
        )}
      </span>
      <span
        className="shrink-0 font-display text-[9px] uppercase tracking-[0.2em]"
        style={{ color: `${color}cc` }}
      >
        {hit.subtitle}
      </span>
    </button>
  );
}

function Highlight({
  value,
  start,
  end,
  color,
}: {
  value: string;
  start: number;
  end: number;
  color: string;
}) {
  if (start >= end) return <>{value}</>;
  return (
    <>
      {value.slice(0, start)}
      <span style={{ color, textShadow: `0 0 16px ${color}, 0 0 4px ${color}99` }}>
        {value.slice(start, end)}
      </span>
      {value.slice(end)}
    </>
  );
}
