'use client';

import type { MouseEvent } from 'react';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import { marginIndexUrl, type MarginIndex } from '@/features/library/margin-paths';
import { useReadingNow } from './ReadingLens';

/** Where the atlas cites the page (docs/LIBRARY_PLAN.md §6, the rail): one bar a
 *  block, longer where more facts rest on it, drawn as one histogram so that a
 *  book of three hundred sections fits as well as one of twenty. The block being
 *  read burns gold beside a dot; a click goes to the block under the pointer. */

/** The most a row may take, in pixels, so a short book keeps a short strip. */
const ROW = 4;

export function CitationStrip({ base, blocks }: { base: string; blocks: string[] }) {
  const { data } = useAtlasFile<MarginIndex>(marginIndexUrl(base));
  const now = useReadingNow();
  if (!data || blocks.length < 2) return null;
  const counts = blocks.map((from) => data.facts[from] ?? 0);
  const most = Math.max(1, ...counts);
  const current = now ? blocks.indexOf(now) : -1;
  // rows of a pixel or so need their whole height to show at all
  const bar = blocks.length > 90 ? 0.9 : 0.64;
  const go = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.min(blocks.length - 1, Math.max(0, Math.floor(((event.clientY - box.top) / box.height) * blocks.length)));
    const target = document.querySelector<HTMLElement>(`.lib-block[data-from="${CSS.escape(blocks[index])}"]`);
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3, behavior: 'smooth' });
  };
  return (
    <div className="mt-6">
      <p className="font-display text-[9px] tracking-[0.22em] text-aether-faint">CITED BY THE ATLAS</p>
      <div aria-hidden onClick={go} className="relative mt-2 cursor-pointer" style={{ height: `min(38vh, ${blocks.length * ROW}px)` }}>
        <svg viewBox={`0 0 100 ${blocks.length}`} preserveAspectRatio="none" className="block h-full w-full">
          {current >= 0 && <rect x="0" y={current} width="100" height="1" fill="rgba(252,211,77,0.12)" />}
          {counts.map((count, index) => (
            <rect
              key={blocks[index]}
              x="0"
              y={index + (1 - bar) / 2}
              height={bar}
              width={count ? 14 + 86 * Math.sqrt(count / most) : 6}
              fill={index === current ? '#fcd34d' : `rgba(252,211,77,${count ? 0.42 : 0.14})`}
            />
          ))}
        </svg>
        {current >= 0 && (
          <span
            className="pointer-events-none absolute -left-2.5 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-star-olympian shadow-[0_0_6px_rgba(252,211,77,0.9)] transition-[top] duration-300"
            style={{ top: `${((current + 0.5) / blocks.length) * 100}%` }}
          />
        )}
      </div>
      <p className="mt-2 font-body text-[12px] italic leading-snug text-aether-faint">One bar a block, longer where more facts rest on it.</p>
    </div>
  );
}
