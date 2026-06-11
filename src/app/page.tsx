import { loadAtlasData } from '@/features/characters/load';
import { GalaxyView } from '@/components/galaxy/GalaxyView';

export default async function Home() {
  const { characters, relations, sources } = await loadAtlasData();
  return <GalaxyView characters={characters} relations={relations} sources={sources} />;
}
