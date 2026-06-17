'use client';

import Link from 'next/link';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { pickSourced } from '@/lib/lens';
import { useGalaxyStore } from '@/features/galaxy/store';
import type { GeoFeature, GeoRegion } from '@/types/geo';
import { StoryLinks } from '@/components/map/StoryLinks';

const KIND_LABEL: Record<GeoFeature['kind'], string> = {
  river: 'River',
  lake: 'Lake',
  plain: 'Plain',
  strait: 'Strait',
  gulf: 'Gulf',
  'mountain-range': 'Mountain range',
};

/** Panel for a selected geography feature (river, strait, …). */
export function FeaturePanel({
  feature,
  region,
  onClose,
}: {
  feature: GeoFeature;
  region: GeoRegion | undefined;
  onClose: () => void;
}) {
  const lens = useGalaxyStore((s) => s.lens);
  const summary = pickSourced(feature.summary, lens);

  return (
    <GlassPanel
      data-map-overlay
      className="absolute inset-x-4 bottom-4 top-auto z-10 flex max-h-[55%] w-auto touch-auto flex-col overscroll-contain bg-glass-heavy sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:max-h-[calc(100%-7rem)] sm:w-[21rem]"
    >
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-nebula-soft">
            {KIND_LABEL[feature.kind]}
          </p>
          <h2 className="mt-1 font-display text-base tracking-[0.1em] text-aether">
            {feature.name.toUpperCase()}
            <span className="ml-2 font-body text-sm italic tracking-normal text-aether-muted">
              {feature.greekName}
            </span>
          </h2>
          {region && (
            <p className="mt-0.5 font-body text-[13px] italic text-aether-muted">{region.name}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close feature panel"
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
            No telling of this feature survives under the active lens.
          </p>
        )}
      </div>

      {feature.storyIds?.length ? <StoryLinks storyIds={feature.storyIds} /> : null}

      {feature.characterId && (
        <Link
          href={`/character/${feature.characterId}`}
          className="block border-t border-glass-border px-5 py-2.5 text-center font-display text-[11px] uppercase tracking-[0.2em] text-nebula-soft transition-colors hover:text-aether"
        >
          Meet the river-god →
        </Link>
      )}
    </GlassPanel>
  );
}
