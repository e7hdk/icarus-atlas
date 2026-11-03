import { LoomView } from '@/components/art/LoomView';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { loadAtlasData } from '@/features/characters/load';

export const metadata = {
  title: 'Art — Icarus Atlas',
  description:
    'The Loom: every image of the Greek myths the atlas holds, woven into one cloth. Across, the myths in their order; down, the hands that drew them, across twenty-six centuries.',
};

/** The Art door (docs/LOOM_PLAN.md): the cloth loads its data from public/art/. */
export default async function ArtPage() {
  const atlas = await loadAtlasData();
  return (
    <main className="fixed inset-0 overflow-hidden">
      <LoomView />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
