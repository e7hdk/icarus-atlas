import Link from 'next/link';
import { CITY_TABS, type CityTab } from '@/components/city/city-tabs';

/** Pill navigation between lineage and city sky — shared by codex and immersive sky routes. */
export function CityTabNav({
  cityId,
  active,
  residentCount,
  className = '',
}: {
  cityId: string;
  active: CityTab;
  residentCount?: number;
  className?: string;
}) {
  return (
    <nav className={`flex justify-center ${className}`.trim()}>
      <div className="flex gap-1 rounded-full border border-glass-border bg-glass p-1 backdrop-blur-xl">
        {CITY_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/city/${cityId}${tab.path}`}
            className={`rounded-full px-5 py-2 font-display text-[12px] tracking-[0.1em] transition-colors ${
              active === tab.key
                ? 'border border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                : 'border border-transparent text-aether-muted hover:text-aether'
            }`}
          >
            {tab.label.toUpperCase()}
            {tab.key === 'sky' && residentCount != null && residentCount > 0 && (
              <span className="ml-1.5 font-body text-[10px] tabular-nums tracking-normal text-aether-faint">
                {residentCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
