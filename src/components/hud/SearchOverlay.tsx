'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TYPE_GLOW } from '@/types/character';
import { GlassPanel } from '@/components/ui/GlassPanel';
import {
  searchCharacters,
  type SearchHit,
  type SearchableCharacter,
} from '@/features/search/match';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Command-palette search (⌘K). Matched substrings glow in the star's type color.
 *  `navigate` opens the character codex (used off the galaxy, where selecting a
 *  star would have nothing to fly to). */
export function SearchOverlay({
  characters,
  navigate = false,
}: {
  characters: SearchableCharacter[];
  navigate?: boolean;
}) {
  const searchOpen = useGalaxyStore((s) => s.searchOpen);
  if (!searchOpen) return null;
  // Remount on every open so query/selection state starts fresh.
  return <SearchDialog characters={characters} navigate={navigate} />;
}

function SearchDialog({
  characters,
  navigate,
}: {
  characters: SearchableCharacter[];
  navigate: boolean;
}) {
  const setSearchOpen = useGalaxyStore((s) => s.setSearchOpen);
  const select = useGalaxyStore((s) => s.select);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchCharacters(characters, query), [characters, query]);
  const active = Math.min(activeIndex, Math.max(hits.length - 1, 0));

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const travel = (hit: SearchHit) => {
    setSearchOpen(false);
    if (navigate) router.push(`/character/${hit.character.id}`);
    else select(hit.character.id);
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-transparent px-4 pt-[14dvh] animate-[search-veil-in_160ms_ease-out] sm:bg-cosmos-deep/55 sm:pt-[18vh] sm:backdrop-blur-[6px]"
      onMouseDown={() => setSearchOpen(false)}
    >
      <GlassPanel
        role="dialog"
        aria-modal="true"
        aria-label="Search the galaxy"
        className="w-full max-w-[21rem] overflow-hidden bg-glass-heavy shadow-[0_24px_80px_rgba(5,2,15,0.85),0_0_48px_rgba(124,77,255,0.16)] animate-[search-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)] sm:max-w-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-glass-border px-4 py-3 sm:px-5 sm:py-4">
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
            placeholder="Search the galaxy…"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent font-body text-lg text-aether placeholder:text-aether-faint focus:outline-none sm:text-xl"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-glass-border text-aether-faint transition-colors active:border-nebula-soft/60 active:text-aether sm:hidden"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <path
                d="M5 5l10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <kbd className="hidden rounded-md border border-glass-border bg-glass px-1.5 py-0.5 font-display text-[9px] tracking-[0.18em] text-aether-faint sm:block">
            ESC
          </kbd>
        </div>

        {query.trim() && hits.length === 0 && (
          <p className="px-5 py-6 text-center font-body text-[15px] italic text-aether-muted">
            No star answers to &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {hits.length > 0 && (
          <div
            ref={listRef}
            className="max-h-[min(38dvh,15rem)] overflow-y-auto py-1.5 sm:max-h-[46vh]"
          >
            {hits.map((hit, index) => (
              <ResultRow
                key={hit.character.id}
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
          <span>↵ Travel</span>
          {query.trim() && hits.length > 0 && (
            <span className="ml-auto">
              {hits.length} {hits.length === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function ResultRow({
  hit,
  index,
  isActive,
  onHover,
  onTravel,
}: {
  hit: SearchHit;
  index: number;
  isActive: boolean;
  onHover: () => void;
  onTravel: () => void;
}) {
  const { character, field, value, start, end } = hit;
  const { color } = TYPE_GLOW[character.type];

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
          {field === 'name' ? (
            <Highlight value={value} start={start} end={end} color={color} />
          ) : (
            character.name
          )}
        </span>
        {field !== 'name' && (
          <span className="block truncate font-body text-[13px] italic text-aether-muted">
            <Highlight value={value} start={start} end={end} color={color} />
          </span>
        )}
      </span>
      <span
        className="shrink-0 font-display text-[9px] uppercase tracking-[0.2em]"
        style={{ color: `${color}cc` }}
      >
        {character.type}
      </span>
    </button>
  );
}

/** Renders `value` with the matched [start, end) range glowing in the star's color. */
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
