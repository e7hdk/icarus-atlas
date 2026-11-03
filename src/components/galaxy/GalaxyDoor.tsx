'use client';

import { DoorUnavailable } from '@/components/ui/DoorUnavailable';
import { Legend } from '@/components/hud/Legend';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
import type { BakedLayout } from '@/features/characters/load';
import type { Relation, SkyCharacter, Source } from '@/types/character';
import { GalaxyView } from './GalaxyView';

export interface GalaxySky {
  characters: SkyCharacter[];
  relations: Relation[];
  bakedLayout: BakedLayout | null;
}

/** The Galaxy door: the sky arrives as one baked file, preloaded by the page, so the
 *  HTML stays small. Each star's prose comes separately, when it is read. */
export function GalaxyDoor({ sources }: { sources: Source[] }) {
  const { data: sky, failed } = useAtlasFile<GalaxySky>(ATLAS_FILES.galaxy);
  if (failed) return <DoorUnavailable what="The sky" />;
  if (!sky) return <Legend />;
  return (
    <GalaxyView
      characters={sky.characters}
      relations={sky.relations}
      sources={sources}
      bakedLayout={sky.bakedLayout}
    />
  );
}
