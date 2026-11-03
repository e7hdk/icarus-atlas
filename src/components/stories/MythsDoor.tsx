'use client';

import { DoorUnavailable } from '@/components/ui/DoorUnavailable';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import type { RiverScene } from '@/features/stories/river';
import type { Story, StoryCrossing } from '@/types/story';
import { MythsSpindleView } from './MythsSpindleView';

export interface MythsData {
  /** With `chapters` emptied: the door shows summaries, and each story's page its text. */
  stories: Story[];
  crossings: StoryCrossing[];
  river: RiverScene;
}

/** The Myths door: the River of Myth is laid out at bake time and preloaded by the
 *  page, so the client's first frame still never waits on the layout. */
export function MythsDoor() {
  const { data, failed } = useAtlasFile<MythsData>(ATLAS_FILES.myths);
  if (failed) return <DoorUnavailable what="The spindle" />;
  if (!data) return null;
  return <MythsSpindleView stories={data.stories} crossings={data.crossings} river={data.river} />;
}
