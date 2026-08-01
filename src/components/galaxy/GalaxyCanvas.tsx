'use client';

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { Character, Relation } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { StarsDriver } from './StarsDriver';
import { Nebula } from './Nebula';
import { BackgroundDome } from './BackgroundDome';
import { StarField } from './StarField';
import { RelationLines } from './RelationLines';
import { CameraRig } from './CameraRig';
import { EphemerisBeacon } from './EphemerisBeacon';
import { WeekConstellation } from './WeekConstellation';
import { MobileStarLabels } from './MobileStarLabels';
import { createGalaxyPointerEvents } from './galaxyPointerEvents';

export function GalaxyCanvas({
  characters,
  relations,
  positions,
  cameraIntro = false,
  ephemerisBeacon = false,
}: {
  characters: Character[];
  relations: Relation[];
  positions: Map<string, Vec3>;
  cameraIntro?: boolean;
  /** Mark the star of the day — the full galaxy only, never the city skies. */
  ephemerisBeacon?: boolean;
}) {
  const select = useGalaxyStore((s) => s.select);
  const spacingScale = useGalaxyStore((s) => s.spacingScale);
  const isMobile = useIsMobile();
  const mobileLabelCanvas = useRef<HTMLCanvasElement>(null);
  // The mobile CPU path is now batched, so phones can spend more of their frame
  // budget on image quality. Keep an adaptive floor below desktop's full cost.
  const [highPerf, setHighPerf] = useState(true);
  const dpr = isMobile ? (highPerf ? 1.5 : 1.15) : highPerf ? 1.75 : 1.5;

  return (
    <>
      <Canvas
        dpr={dpr}
        events={createGalaxyPointerEvents}
        camera={{ position: [18, 43, 88], fov: 50, near: 0.1, far: 20000 }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
        onPointerMissed={() => select(null)}
      >
        <color attach="background" args={['#08041d']} />
        <PerformanceMonitor onDecline={() => setHighPerf(false)} onIncline={() => setHighPerf(true)} />
        <group scale={spacingScale * 4.0}>
          <BackgroundDome />
          <StarField />
          <Nebula />
        </group>
        <StarsDriver characters={characters} isMobile={isMobile} positions={positions} />
        {isMobile && (
          <MobileStarLabels
            canvasRef={mobileLabelCanvas}
            characters={characters}
            positions={positions}
          />
        )}
        <RelationLines relations={relations} positions={positions} />
        {ephemerisBeacon && <EphemerisBeacon positions={positions} />}
        {ephemerisBeacon && <WeekConstellation isMobile={isMobile} positions={positions} />}
        <CameraRig positions={positions} intro={cameraIntro} isMobile={isMobile} />
        {/* Mobile now restores moderate MSAA and the desktop grain treatment. */}
        {isMobile ? (
          <EffectComposer key="m" multisampling={2}>
            <Bloom mipmapBlur resolutionScale={0.5} intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.25} radius={0.75} />
            <Vignette eskil={false} offset={0.15} darkness={0.55} />
            <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.018} />
          </EffectComposer>
        ) : (
          <EffectComposer key="d" multisampling={4}>
            <Bloom mipmapBlur resolutionScale={0.5} intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.25} radius={0.75} />
            <Vignette eskil={false} offset={0.15} darkness={0.55} />
            {/* faint SCREEN grain kills additive-gradient banding on the dark backdrop */}
            <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.018} />
          </EffectComposer>
        )}
      </Canvas>
      {isMobile && (
        <canvas
          ref={mobileLabelCanvas}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        />
      )}
    </>
  );
}
