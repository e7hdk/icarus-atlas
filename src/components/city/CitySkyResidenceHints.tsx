import Link from 'next/link';
import type { Character } from '@/types/character';
import type { GeoCity } from '@/types/geo';
import { otherCityResidences } from '@/features/geo/residents';
import { ClampList } from '@/components/ui/ClampList';

/** In a city sky, surfaces other polises where the same figure also dwelt. */
export function CitySkyResidenceHints({
  character,
  currentCityId,
  citiesById,
  compact = false,
}: {
  character: Character;
  currentCityId: string;
  citiesById: Map<string, Pick<GeoCity, 'id' | 'name' | 'greekName'>>;
  /** Tighter layout for hover cards. */
  compact?: boolean;
}) {
  const others = otherCityResidences(character, currentCityId);
  if (others.length === 0) return null;

  return (
    <div className={compact ? 'mt-3 border-t border-glass-border pt-3' : 'mt-6 border-t border-glass-border pt-5'}>
      <div
        className={`font-display uppercase tracking-[0.22em] text-aether-faint ${
          compact ? 'text-[9px]' : 'text-[11px]'
        }`}
      >
        Also seen in the lands
      </div>
      <ul className={`mt-2 flex flex-wrap gap-2 ${compact ? '' : 'mt-3'}`}>
        <ClampList max={compact ? 3 : 5}>
          {others.map((residence) => {
            const city = citiesById.get(residence.city);
            const label = city?.name ?? residence.city;
            return (
              <li key={residence.city}>
                <Link
                  href={`/city/${residence.city}/sky`}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass transition-colors hover:border-nebula-soft/50 hover:text-aether ${
                    compact
                      ? 'px-2.5 py-0.5 font-body text-[12px] italic text-aether-muted'
                      : 'px-3 py-1 font-display text-[11px] tracking-[0.08em] text-aether/90'
                  }`}
                  title={city?.greekName ? `${label} (${city.greekName})` : label}
                >
                  {compact ? label : label.toUpperCase()}
                  <span className="font-display text-[9px] tracking-[0.14em] text-nebula-soft/90">
                    SKY →
                  </span>
                </Link>
              </li>
            );
          })}
        </ClampList>
      </ul>
    </div>
  );
}
