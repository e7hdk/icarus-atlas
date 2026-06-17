import Link from 'next/link';
import type { Character } from '@/types/character';
import type { GeoCity } from '@/types/geo';
import { ClampList } from '@/components/ui/ClampList';

/** Links from the character codex to Lands map pins and per-city skies. */
export function CharacterResidences({
  residences,
  citiesById,
}: {
  residences: NonNullable<Character['residences']>;
  citiesById: Map<string, GeoCity>;
}) {
  if (residences.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <div className="font-display text-[10px] tracking-[0.26em] text-aether-faint">
        SEEN IN THE LANDS
      </div>
      <ul className="flex max-w-2xl flex-wrap items-stretch justify-center gap-2.5">
        <ClampList max={6}>
        {residences.map((residence) => {
          const city = citiesById.get(residence.city);
          const label = city?.name ?? residence.city;
          return (
            <li
              key={residence.city}
              className="flex flex-col gap-1.5 rounded-2xl border border-glass-border bg-glass px-4 py-3 backdrop-blur-xl"
            >
              <div className="text-center">
                <span className="font-display text-[13px] tracking-[0.08em] text-aether">
                  {label.toUpperCase()}
                </span>
                {city?.greekName ? (
                  <span className="mt-0.5 block font-body text-[13px] italic text-aether-muted">
                    {city.greekName}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <Link
                  href={`/areas#city=${residence.city}`}
                  className="rounded-full border border-glass-border px-3 py-1 font-display text-[10px] tracking-[0.12em] text-nebula-soft transition-colors hover:border-nebula-soft/50 hover:text-aether"
                >
                  MAP
                </Link>
                <Link
                  href={`/city/${residence.city}/sky`}
                  className="rounded-full border border-glass-border px-3 py-1 font-display text-[10px] tracking-[0.12em] text-nebula-soft transition-colors hover:border-nebula-soft/50 hover:text-aether"
                >
                  SKY
                </Link>
                <Link
                  href={`/city/${residence.city}`}
                  className="rounded-full border border-glass-border px-3 py-1 font-display text-[10px] tracking-[0.12em] text-nebula-soft transition-colors hover:border-nebula-soft/50 hover:text-aether"
                >
                  CODEX
                </Link>
              </div>
            </li>
          );
        })}
        </ClampList>
      </ul>
    </div>
  );
}
