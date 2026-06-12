'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { Character, Relation } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { CharacterStar } from './CharacterStar';
import { Nebula } from './Nebula';
import { BackgroundDome } from './BackgroundDome';
import { StarField } from './StarField';
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
  const spacingScale = useGalaxyStore((s) => s.spacingScale);
  const [dpr, setDpr] = useState(1.75);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [18, 43, 88], fov: 50, near: 0.1, far: 20000 }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={['#08041d']} />
      <PerformanceMonitor onDecline={() => setDpr(1.5)} onIncline={() => setDpr(1.75)} />
      <group scale={spacingScale * 4.0}>
        <BackgroundDome />
        <StarField />
        <Nebula />
      </group>
      {characters.map((character) => {
        const position = positions.get(character.id);
        if (!position) return null;
        return <CharacterStar key={character.id} character={character} position={position} />;
      })}
      <RelationLines relations={relations} positions={positions} />
      <CameraRig positions={positions} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.25} radius={0.75} />
        <Vignette eskil={false} offset={0.15} darkness={0.55} />
        {/* faint SCREEN grain kills additive-gradient banding on the dark backdrop */}
        <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.018} />
      </EffectComposer>
    </Canvas>
  );
}
