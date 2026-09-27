import { buildChronologyYears } from '@/features/stories/chronology';
import { loadStories, loadStoryCrossings, loadChronology } from '@/features/stories/load';
import { buildRiverLayout, toRiverScene } from '@/features/stories/river';
import { loadAtlasData } from '@/features/characters/load';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { MythsSpindleView } from '@/components/stories/MythsSpindleView';

export const metadata = {
  title: 'Myths — Icarus Atlas',
  description:
    'The Spindle of Time: every myth a star on the thread of its saga, spun on the spindle of mythic time; the threads touch where the ancient sources say the myths meet.',
};

/** The Myths door: the River of Myth's layout, spun onto the Spindle as one
 *  thread per saga (docs/MYTHS_RIVER_PLAN.md) — laid out here on the server,
 *  so the client's first frame never waits on the layout. */
export default async function StoriesPage() {
  const [stories, crossings, atlas, chronology] = await Promise.all([
    loadStories(),
    loadStoryCrossings(),
    loadAtlasData(),
    loadChronology(),
  ]);
  const river = toRiverScene(buildRiverLayout(stories, buildChronologyYears(stories, chronology), crossings));

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MythsSpindleView stories={stories} crossings={crossings} river={river} />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
