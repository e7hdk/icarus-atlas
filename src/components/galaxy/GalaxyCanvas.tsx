'use client';

import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Character, Relation } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { CharacterStar } from './CharacterStar';
import { Nebula } from './Nebula';
import { RelationLines } from './RelationLines';
import { CameraRig } from './CameraRig';

export function GalaxyCanvas({
  characters,
  relations,
  positions,
}: {
  characters: Character[];
  relations: Relation[];
  positions: Map<string, Vec3>;
}) {
  const select = useGalaxyStore((s) => s.select);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [18, 43, 88], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={['#08041d']} />
      <ambientLight intensity={0.2} />
      <Stars radius={150} depth={70} count={5000} factor={4} saturation={0} fade speed={0.4} />
      <Nebula />
      {characters.map((character) => {
        const position = positions.get(character.id);
        if (!position) return null;
        return <CharacterStar key={character.id} character={character} position={position} />;
      })}
      <RelationLines relations={relations} positions={positions} />
      <CameraRig positions={positions} />
      <EffectComposer>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.25} radius={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
