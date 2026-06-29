import { loadStories, loadStoryCrossings, loadChronology } from '@/features/stories/load';
import { loadAtlasData } from '@/features/characters/load';
import { MainNav } from '@/components/hud/MainNav';
import { HudActions } from '@/components/hud/HudActions';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { IcarusBrand } from '@/components/ui/IcarusBrand';
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

      <div className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex min-h-[68px] items-center px-4 py-3 sm:px-6 sm:py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="stories" />
        </div>
        <HudActions />
      </div>
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
