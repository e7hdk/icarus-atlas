import { buildChronologyYears } from '@/features/stories/chronology';
import { loadChronology, loadStories, loadStoryCrossings } from '@/features/stories/load';
import { buildRiverLayout, toRiverScene } from '@/features/stories/river';
import { loadAtlasData } from '@/features/characters/load';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { MythsSpindleView } from '@/components/stories/MythsSpindleView';

export const metadata = {
  title: 'The River of Myth — Icarus Atlas',
  description:
    'The River of Myth: every myth a star on the stream of its saga, the streams touching where the ancient sources say the myths meet.',
};

/** The River of Myth's layout spun onto the Spindle, beside the old Spindle while
 *  it is judged (docs/MYTHS_RIVER_PLAN.md): laid out here on the server, so the
 *  client's first frame never waits on the layout. */
export default async function StoriesRiverPage() {
  const [stories, crossings, atlas, chronology] = await Promise.all([
    loadStories(),
    loadStoryCrossings(),
    loadAtlasData(),
    loadChronology(),
  ]);
  const river = toRiverScene(buildRiverLayout(stories, buildChronologyYears(stories, chronology), crossings));

  return (
    <main className="fixed inset-0 overflow-hidden">
      <MythsSpindleView stories={stories} crossings={crossings} chronology={chronology} river={river} />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
