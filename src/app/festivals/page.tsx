import { CrumbBar } from '@/components/hud/CrumbBar';
import { HeortologionView, type FeastEntry } from '@/components/festivals/HeortologionView';
import { loadAtlasData } from '@/features/characters/load';
import { loadPlaces } from '@/features/geo/load';
import { MONTH_DISPLAY } from '@/features/spotlight/attic';
import { loadFestivals } from '@/features/spotlight/build';
import { loadStories } from '@/features/stories/load';
import { TYPE_GLOW } from '@/types/character';
import { ATTIC_MONTHS } from '@/types/spotlight';
import type { Festival } from '@/types/spotlight';

export const metadata = {
  title: 'Heortologion — Icarus Atlas',
  description:
    'The festival year of ancient Greece as an instrument — aim the wheel, read the feast.',
};

/** The recorded Attic date, honest about uncertainty (≈) and month-only spans. */
function atticDateLabel(festival: Festival): string {
  const { month, days, approximate } = festival.atticDate;
  const approx = approximate ? '≈ ' : '';
  if (!days) return `${approx}the month of ${MONTH_DISPLAY[month]}`;
  const [start, end] = days;
  const span = end !== undefined && end !== start ? `${start}–${end}` : `${start}`;
  return `${approx}${span} ${MONTH_DISPLAY[month]}`;
}

/** The Heortologion — the festival year as an instrument, not a catalog:
 *  the year wheel up top selects, one feast at a time lies on the plaque.
 *  The server resolves every feast into plain display data; the client view
 *  owns the aim (docs/EPHEMERIS_PLAN.md §5). */
export default async function FestivalsPage() {
  const [festivals, { characters }, places, stories] = await Promise.all([
    loadFestivals(),
    loadAtlasData(),
    loadPlaces(),
    loadStories(),
  ]);
  const charactersById = new Map(characters.map((character) => [character.id, character]));
  const placesById = new Map(places.map((place) => [place.id, place]));
  const storiesById = new Map(stories.map((story) => [story.id, story]));

  const entries: FeastEntry[] = [...festivals]
    // Day-less feasts sit mid-month (15.5) — the SAME seat the wheel draws
    // them at, so the ‹ › / arrow-key order always matches the visual ring.
    .sort(
      (a, b) =>
        ATTIC_MONTHS.indexOf(a.atticDate.month) - ATTIC_MONTHS.indexOf(b.atticDate.month) ||
        (a.atticDate.days?.[0] ?? 15.5) - (b.atticDate.days?.[0] ?? 15.5),
    )
    .map((festival) => {
      const place = festival.place ? (placesById.get(festival.place) ?? null) : null;
      const aition = festival.aition ? (storiesById.get(festival.aition) ?? null) : null;
      return {
        id: festival.id,
        name: festival.name,
        greekName: festival.greekName,
        dateLabel: atticDateLabel(festival),
        month: festival.atticDate.month,
        day: festival.atticDate.days?.[0] ?? null,
        deities: festival.deities.map((deity) => {
          const character = charactersById.get(deity);
          return {
            id: deity,
            name: character?.name ?? deity,
            color: character ? TYPE_GLOW[character.type].color : 'inherit',
          };
        }),
        place: place ? { id: place.id, name: place.name, isCity: place.kind === 'city' } : null,
        gamesNote: festival.games
          ? `Every ${festival.games.cycleYears === 4 ? 'fourth' : 'second'} year`
          : null,
        summary: festival.summary,
        aition: aition ? { id: aition.id, title: aition.title } : null,
        testimonia: festival.testimonia,
      };
    });

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl overflow-x-clip px-5 pb-24 pt-20 sm:px-6">
      <CrumbBar
        back={{ href: '/', label: 'Back to the galaxy' }}
        trail={[{ href: '/', label: 'Galaxy' }]}
        current="Heortologion"
      />

      <header className="mt-9 text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-star-olympian sm:text-[11px] sm:tracking-[0.3em]">
          The festival year
        </p>
        <h1 className="mt-2 font-display text-[1.7rem] uppercase tracking-[0.08em] text-aether sm:text-4xl sm:tracking-[0.12em]">
          Heortologion
        </h1>
        <p className="mx-auto mt-3 max-w-xl font-body text-[15px] italic leading-relaxed text-aether-muted">
          Every feast a star on the wheel of the Attic year — aim it, and the plaque below
          retells the rite. Dates follow the reconstructed calendar: months begin at the new moon
          after the summer solstice.
        </p>
      </header>

      <div className="mt-8">
        <HeortologionView entries={entries} />
      </div>
    </main>
  );
}
