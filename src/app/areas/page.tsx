import { LandsDoor } from '@/components/map/LandsDoor';
import { loadAtlasData } from '@/features/characters/load';

export const metadata = {
  title: 'Lands — Icarus Atlas',
  description: 'The regions and ancient cities of the Greek world, as an interactive map.',
};

export default async function AreasPage() {
  const atlas = await loadAtlasData();

  return (
    <div className="fixed inset-0">
      <LandsDoor sources={atlas.sources} starCount={atlas.characters.length} />
    </div>
  );
}
