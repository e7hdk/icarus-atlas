'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Story } from '@/types/story';
import { useGalaxyStore } from '@/features/galaxy/store';
import { searchStories, type StorySearchHit } from '@/features/search/stories-match';
import { SAGA_LABEL, type SpindleNode } from '@/features/stories/spindle';
import { GlassPanel } from '@/components/ui/GlassPanel';

/** Command-palette search (⌘K) for the Spindle of Time. Type a figure's name and
 *  every myth they walk through is laid out; choosing one rolls the spindle to
 *  that star instead of opening a codex — we already have somewhere to fly. */
export function StorySearchOverlay({
  stories,
  nodeById,
  onSelect,
}: {
  stories: Story[];
  nodeById: Map<string, SpindleNode>;
  onSelect: (storyId: string) => void;
}) {
  const searchOpen = useGalaxyStore((s) => s.searchOpen);
  if (!searchOpen) return null;
  // Remount per open so query/selection start fresh.
  return <StorySearchDialog stories={stories} nodeById={nodeById} onSelect={onSelect} />;
}

function StorySearchDialog({
  stories,
  nodeById,
  onSelect,
}: {
  stories: Story[];
  nodeById: Map<string, SpindleNode>;
  onSelect: (storyId: string) => void;
}) {
  const setSearchOpen = useGalaxyStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Only myths that have a star on the spindle can be flown to.
  const hits = useMemo(
    () => searchStories(stories, query).filter((hit) => nodeById.has(hit.story.id)),
    [stories, query, nodeById],
  );
  const active = Math.min(activeIndex, Math.max(hits.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const travel = (hit: StorySearchHit) => {
    setSearchOpen(false);
    onSelect(hit.story.id);
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
            placeholder="Search a figure, place, or myth…"
            spellCheck={false}
            className="flex-1 bg-transparent font-body text-xl text-aether placeholder:text-aether-faint focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-glass-border bg-glass px-1.5 py-0.5 font-display text-[9px] tracking-[0.18em] text-aether-faint sm:block">
            ESC
          </kbd>
        </div>

        {query.trim() && hits.length === 0 && (
          <p className="px-5 py-6 text-center font-body text-[15px] italic text-aether-muted">
            No myth answers to &ldquo;{query.trim()}&rdquo;.
          </p>
        )}

        {hits.length > 0 && (
          <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-1.5">
            {hits.map((hit, index) => (
              <StoryResultRow
                key={hit.story.id}
                hit={hit}
                color={nodeById.get(hit.story.id)?.color ?? '#c084fc'}
                sagaLabel={
                  nodeById.get(hit.story.id) ? SAGA_LABEL[nodeById.get(hit.story.id)!.sagaId] : ''
                }
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
              {hits.length} {hits.length === 1 ? 'myth' : 'myths'}
            </span>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}

function StoryResultRow({
  hit,
  color,
  sagaLabel,
  index,
  isActive,
  onHover,
  onTravel,
}: {
  hit: StorySearchHit;
  color: string;
  sagaLabel: string;
  index: number;
  isActive: boolean;
  onHover: () => void;
  onTravel: () => void;
}) {
  const { story, field, value, start, end, context } = hit;

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
          {field === 'title' ? (
            <Highlight value={value} start={start} end={end} color={color} />
          ) : (
            story.title
          )}
        </span>
        <span className="block truncate font-body text-[13px] italic text-aether-muted">
          {field === 'cast' && (
            <>
              with <Highlight value={value} start={start} end={end} color={color} />
              {context ? ` · ${context}` : ''}
            </>
          )}
          {field === 'place' && (
            <>
              in <Highlight value={value} start={start} end={end} color={color} />
            </>
          )}
          {field === 'greekTitle' && <Highlight value={value} start={start} end={end} color={color} />}
          {field === 'title' && story.greekTitle}
        </span>
      </span>
      <span
        className="shrink-0 font-display text-[9px] uppercase tracking-[0.2em]"
        style={{ color: `${color}cc` }}
      >
        {sagaLabel}
      </span>
    </button>
  );
}

/** Renders `value` with the matched [start, end) range glowing in the saga's color. */
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
