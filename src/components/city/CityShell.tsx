import Link from 'next/link';
import { MainNav } from '@/components/hud/MainNav';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
import type { GeoCity, GeoRegion } from '@/types/geo';

const TABS = [
  { key: 'lineage', label: 'Lineage', path: '' },
  { key: 'sky', label: 'City sky', path: '/sky' },
] as const;

export type CityTab = (typeof TABS)[number]['key'];

/** Shared chrome of the city codex routes: top bar, hero identity, tab navigation. */
export function CityShell({
  city,
  region,
  parentRegion,
  active,
  children,
}: {
  city: GeoCity;
  region: GeoRegion | undefined;
  parentRegion: GeoRegion | undefined;
  active: CityTab;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full pb-24">
      <div className="pointer-events-none relative flex min-h-[68px] items-center px-6 py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="areas" />
        </div>
        <Link
          href="/areas"
          className="pointer-events-auto ml-auto rounded-full border border-glass-border bg-glass px-4 py-2 font-display text-[12px] tracking-[0.1em] text-aether-muted backdrop-blur-md transition-colors hover:border-nebula-soft/50 hover:text-aether"
        >
          ← LANDS
        </Link>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6">
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

        <nav className="mt-7 flex justify-center">
          <div className="flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/city/${city.id}${tab.path}`}
                className={`rounded-full px-5 py-2 font-display text-[12px] tracking-[0.1em] transition-colors ${
                  active === tab.key
                    ? 'border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                    : 'border border-transparent text-aether-muted hover:text-aether'
                }`}
              >
                {tab.label.toUpperCase()}
              </Link>
            ))}
          </div>
        </nav>

        {children}
      </div>
    </main>
  );
}
