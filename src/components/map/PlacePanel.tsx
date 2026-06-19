'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';
import { pickSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import type { GeoPlace, GeoRegion } from '@/types/geo';
import { StoryLinks } from '@/components/map/StoryLinks';

const KIND_LABEL: Partial<Record<GeoPlace['kind'], string>> = {
  'myth-site': 'Mythic horizon',
  sanctuary: 'Sanctuary',
  landmark: 'Landmark',
  mountain: 'Mountain',
  pass: 'Pass',
  'region-capital': 'Capital',
};

/** Panel for a selected non-city place (far-myth site, sanctuary, …). */
export function PlacePanel({
  place,
  region,
  onClose,
}: {
  place: GeoPlace;
  region: GeoRegion | undefined;
  onClose: () => void;
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const summary = pickSourced(place.summary, lens);

  return (
    <GlassPanel
      data-map-overlay
      className="absolute inset-x-4 bottom-4 top-auto z-10 flex max-h-[55%] w-auto touch-auto flex-col overscroll-contain bg-glass-heavy sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:max-h-[calc(100%-7rem)] sm:w-[21rem]"
    >
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-nebula-soft">
            {KIND_LABEL[place.kind] ?? place.kind.replace('-', ' ')}
          </p>
          <h2 className="mt-1 font-display text-base tracking-[0.1em] text-aether">
            {place.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {place.greekName}
            </span>
          </h2>
          {region && (
            <p className="mt-0.5 font-body text-[13px] italic text-aether-muted">{region.name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close place panel"
          className="rounded-full px-2 py-0.5 font-display text-sm text-aether-faint transition-colors hover:text-aether"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-4">
        {summary ? (
          <p className="font-body text-[15px] leading-relaxed text-aether/90">{summary.text}</p>
        ) : (
          <p className="font-body text-[15px] italic text-aether-muted">
            No telling of this place survives under the active lens.
          </p>
        )}
      </div>

      {place.storyIds?.length ? <StoryLinks storyIds={place.storyIds} /> : null}
    </GlassPanel>
  );
}
