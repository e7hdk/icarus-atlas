import { loadStories, loadStoryCrossings, loadChronology } from '@/features/stories/load';
import { loadAtlasData } from '@/features/characters/load';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { MythsSpindleView } from '@/components/stories/MythsSpindleView';

export const metadata = {
  title: 'Myths — Icarus Atlas',
  description: 'The Spindle of Time: every myth a star, wound on the thread of mythic time.',
};

export default async function StoriesPage() {
  const [stories, crossings, atlas, chronology] = await Promise.all([
    loadStories(),
    loadStoryCrossings(),
    loadAtlasData(),
    loadChronology(),
  ]);

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MythsSpindleView stories={stories} crossings={crossings} chronology={chronology} />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
