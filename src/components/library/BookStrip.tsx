'use client';

import type { MouseEvent } from 'react';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import { marginIndexUrl, type MarginIndex } from '@/features/library/margin-paths';

/** The book's fore-edge (docs/LIBRARY_PLAN.md §6): one bar a block, taller where
 *  more facts of the atlas rest on it, drawn as one histogram so that a book of
 *  three hundred sections fits as well as one of twenty. The blocks lying open
 *  burn gold; a click turns to the block under the pointer. */
export function BookStrip({ base, blocks, shown, onPick }: { base: string; blocks: string[]; shown: string[]; onPick: (index: number) => void }) {
  const { data } = useAtlasFile<MarginIndex>(marginIndexUrl(base));
  if (blocks.length < 2) return <span className="min-w-0 flex-1" />;
  const counts = blocks.map((from) => data?.facts[from] ?? 0);
  const most = Math.max(1, ...counts);
  const open = new Set(shown);
  // bars of a pixel or so need their whole width to show at all
  const bar = blocks.length > 90 ? 0.92 : blocks.length > 40 ? 0.66 : 0.4;
  const pick = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onPick(Math.min(blocks.length - 1, Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * blocks.length))));
  };
  return (
    <div
      aria-hidden
      onClick={pick}
      title="Where the atlas cites this page: one bar a block, taller where more facts rest on it"
      className="relative h-4 min-w-0 flex-1 cursor-pointer"
    >
      <svg viewBox={`0 0 ${blocks.length} 10`} preserveAspectRatio="none" className="block h-full w-full">
        {counts.map((count, index) => {
          const height = count ? 2.4 + 7.6 * Math.sqrt(count / most) : 1.3;
          const lit = open.has(blocks[index]);
          return (
            <rect
              key={blocks[index]}
              x={index + (1 - bar) / 2}
              y={10 - height}
              width={bar}
              height={height}
              fill={lit ? '#fcd34d' : count ? 'rgba(252,211,77,0.28)' : 'rgba(255,255,255,0.12)'}
            />
          );
        })}
      </svg>
    </div>
  );
}
