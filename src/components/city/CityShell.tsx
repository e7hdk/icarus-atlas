import { CrumbBar } from '@/components/hud/CrumbBar';
import { CityTabNav } from '@/components/city/CityTabNav';
import type { CityTab } from '@/components/city/city-tabs';
import type { GeoCity, GeoRegion } from '@/types/geo';

export type { CityTab };

/** Shared chrome of the city codex routes: top bar, hero identity, tab navigation. */
export function CityShell({
  city,
  region,
  parentRegion,
  active,
  residentCount,
  children,
}: {
  city: GeoCity;
  region: GeoRegion | undefined;
  parentRegion: GeoRegion | undefined;
  active: CityTab;
  /** Residents linked via sourced residences — drives the sky tab badge and hint. */
  residentCount?: number;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full pb-24 pt-20">
      <div className="mx-auto w-full max-w-4xl px-6">
        <CrumbBar
          back={{ href: '/areas', label: 'Back to the lands' }}
          trail={[{ href: '/areas', label: 'Lands' }]}
          current={city.name}
        />
        <header className="mt-8 text-center">
          <h1 className="font-display text-[clamp(26px,7vw,60px)] tracking-[0.22em] text-aether [text-shadow:0_0_46px_rgba(252,211,77,.45)]">
            {city.name.toUpperCase()}
          </h1>
          <p className="mt-2 font-body text-xl italic text-aether-muted">{city.greekName}</p>
          {region && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-star-olympian/40 bg-star-olympian/10 px-3 py-0.5 font-display text-[11px] uppercase tracking-[0.18em] text-star-olympian">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-star-olympian"
                  style={{ boxShadow: '0 0 8px #fcd34d' }}
                />
                {region.name}
                {parentRegion ? ` · ${parentRegion.name}` : ''}
              </span>
            </div>
          )}
          {region && (
            <p className="mx-auto mt-4 max-w-xl font-body text-lg italic leading-relaxed text-aether-muted">
              {region.blurb.text}
            </p>
          )}
        </header>

        <CityTabNav cityId={city.id} active={active} residentCount={residentCount} className="mt-7" />

        {residentCount != null && (
          <p className="mt-4 text-center font-body text-sm italic text-aether-muted">
            {residentCount === 0 ? (
              <>The city sky will populate as residence data grows.</>
            ) : (
              <>
                {residentCount} {residentCount === 1 ? 'figure' : 'figures'} lived here — wander
                among them in the{' '}
                <span className="text-nebula-soft/90">City sky</span> tab.
              </>
            )}
          </p>
        )}

        {children}
      </div>
    </main>
  );
}
