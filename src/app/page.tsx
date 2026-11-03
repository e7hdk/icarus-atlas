import { GalaxyDoor } from '@/components/galaxy/GalaxyDoor';
import { loadAtlasData } from '@/features/characters/load';

export default async function Home() {
  const { sources } = await loadAtlasData();
  return <GalaxyDoor sources={sources} />;
}
