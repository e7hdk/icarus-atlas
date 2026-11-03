import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { MythsDoor } from '@/components/stories/MythsDoor';
import { loadAtlasData } from '@/features/characters/load';

export const metadata = {
  title: 'Myths — Icarus Atlas',
  description:
    'The Spindle of Time: every myth a star on the thread of its saga, spun on the spindle of mythic time; the threads touch where the ancient sources say the myths meet.',
};

/** The Myths door: the River of Myth's layout, spun onto the Spindle as one
 *  thread per saga (docs/MYTHS_RIVER_PLAN.md). */
export default async function StoriesPage() {
  const atlas = await loadAtlasData();

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MythsDoor />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
