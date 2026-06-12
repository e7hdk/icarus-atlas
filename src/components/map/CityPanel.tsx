'use client';

import Link from 'next/link';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { GeoCity, GeoRegion, Lineage } from '@/types/geo';

/** Lineage panel for a selected city: the royal succession as sourced facts.
 *  Citations live in hover footnotes; disputed reigns get the quiet ⚖ marker. */
export function CityPanel({
  city,
  region,
  lineage,
  onClose,
}: {
  city: GeoCity;
  region: GeoRegion | undefined;
  lineage: Lineage | null;
  onClose: () => void;
}) {
  return (
    <GlassPanel
      data-map-overlay
      className="absolute inset-x-4 bottom-4 top-auto z-10 flex max-h-[60%] w-auto touch-auto flex-col overscroll-contain bg-glass-heavy sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5 sm:max-h-[calc(100%-7rem)] sm:w-[21rem]"
    >
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <h2 className="font-display text-base tracking-[0.1em] text-aether">
            {city.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {city.greekName}
            </span>
          </h2>
          {region && (
            <p className="mt-0.5 font-body text-[13px] italic text-aether-muted">{region.name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close city panel"
          className="rounded-full px-2 py-0.5 font-display text-sm text-aether-faint transition-colors hover:text-aether"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-4">
        <div className="font-display text-[10px] uppercase tracking-[0.2em] text-aether-faint">
          Royal succession
        </div>
        {lineage ? (
          <ol className="mt-2 flex flex-col gap-2.5">
            {lineage.reigns.map((reign, index) => (
              <li key={`${reign.ruler}-${index}`} title={reign.citation}>
                <div className="flex items-baseline gap-2">
                  <span className="w-5 shrink-0 text-right font-display text-[11px] text-aether-faint">
                    {index + 1}
                  </span>
                  <span className="font-display text-[15px] tracking-[0.06em] text-aether">
                    {reign.ruler}
                  </span>
                  {reign.topic && (
                    <span
                      className="text-[13px] text-nebula-soft"
                      title="The sources disagree about this reign."
                      aria-label="Disputed reign"
                    >
                      ⚖
                    </span>
                  )}
                </div>
                {reign.note && (
                  <p className="ml-7 mt-0.5 font-body text-[13.5px] leading-snug text-aether-muted">
                    {reign.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 font-body text-[15px] italic text-aether-muted">
            The royal line of this city is still being researched — the atlas grows one throne at
            a time.
          </p>
        )}
      </div>

      <Link
        href={`/city/${city.id}`}
        className="block border-t border-glass-border px-5 py-2.5 text-center font-display text-[11px] uppercase tracking-[0.2em] text-nebula-soft transition-colors hover:text-aether"
      >
        Step through the gates →
      </Link>
      <p className="border-t border-glass-border px-5 py-2 font-body text-[11px] italic text-aether-faint">
        Coordinates: Pleiades gazetteer, CC BY · place {city.pleiadesId}
      </p>
    </GlassPanel>
  );
}
