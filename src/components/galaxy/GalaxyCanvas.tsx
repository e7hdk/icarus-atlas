'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { Relation, SkyCharacter } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useIsMobile } from '@/lib/useIsMobile';
import { StarsDriver } from './StarsDriver';
import { Nebula } from './Nebula';
import { BackgroundDome } from './BackgroundDome';
import { StarField } from './StarField';
import { RelationLines } from './RelationLines';
import { CameraRig, type CameraAim } from './CameraRig';
import { EphemerisBeacon } from './EphemerisBeacon';
import { WeekConstellation } from './WeekConstellation';
import { MobileStarLabels } from './MobileStarLabels';
import { createGalaxyPointerEvents } from './galaxyPointerEvents';
import { HighlightRolloff } from './HighlightRolloff';

/** At the widest spacing the backdrop's dome is 18,000 units in radius (300 at
 *  four times the spacing), and a camera drawn all the way back from a
 *  constellation stands some 22,000 from the centre (WeekConstellation's
 *  sphere and CameraRig's MAX_DISTANCE, both scaled by `skyReach`): the far
 *  plane clears the two together. Depth precision is set by the near plane, so
 *  a deep far plane costs nothing. */
const CAMERA_FAR = 50_000;

export function GalaxyCanvas({
  characters,
  relations,
  positions,
  cameraIntro = false,
  ephemerisBeacon = false,
  reading = null,
  spacing,
  children,
}: {
  characters: SkyCharacter[];
  relations: Relation[];
  positions: Map<string, Vec3>;
  cameraIntro?: boolean;
  /** Mark the star of the day — the full galaxy only, never the city skies. */
  ephemerisBeacon?: boolean;
  /** A reading of the sky (First, Chaos): looked at, not picked, framed by `aim`.
   *  `labels: false` leaves the stars unnamed, for a stage that names them itself;
   *  `sizes` are the world radii a stage draws stars at instead, by id. */
  reading?: { aim: CameraAim; labels?: boolean; sizes?: Readonly<Record<string, number>> } | null;
  /** How far `positions` are spread, when that is not the atlas's own setting: a
   *  reading keeps the spacing it was composed at (features/galaxy/spacing.ts). */
  spacing?: number;
  /** What a stage draws in the sky besides its stars (src/features/dedication). */
  children?: ReactNode;
}) {
  const select = useGalaxyStore((s) => s.select);
  const setting = useGalaxyStore((s) => s.spacingScale);
  const spread = spacing ?? setting;
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
        camera={{ position: [18, 43, 88], fov: 50, near: 0.1, far: CAMERA_FAR }}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
        onPointerMissed={() => {
          if (!reading) select(null);
        }}
      >
        <color attach="background" args={['#08041d']} />
        <PerformanceMonitor onDecline={() => setHighPerf(false)} onIncline={() => setHighPerf(true)} />
        <group scale={spread * 4.0}>
          <BackgroundDome />
          <StarField />
          <Nebula />
        </group>
        <StarsDriver
          characters={characters}
          isMobile={isMobile}
          positions={positions}
          spacing={spread}
          pickable={!reading}
          labels={reading?.labels ?? true}
          sizes={reading?.sizes}
        />
        {isMobile && (reading?.labels ?? true) && (
          <MobileStarLabels
            canvasRef={mobileLabelCanvas}
            characters={characters}
            positions={positions}
            spacing={spread}
          />
        )}
        <RelationLines relations={relations} positions={positions} />
        {children}
        {ephemerisBeacon && <EphemerisBeacon positions={positions} />}
        {ephemerisBeacon && <WeekConstellation isMobile={isMobile} positions={positions} spacing={spread} />}
        <CameraRig positions={positions} spacing={spread} intro={cameraIntro} isMobile={isMobile} aim={reading?.aim ?? null} />
        {/* The HDR contract the shaders are written to: only true light
            sources (star cores, giant field stars) cross the bloom threshold,
            and the roll-off burns them white without touching anything below
            its knee. Mobile keeps moderate MSAA. */}
        <EffectComposer key={isMobile ? 'm' : 'd'} multisampling={isMobile ? 2 : 4}>
          <Bloom mipmapBlur resolutionScale={0.5} intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.4} radius={0.7} />
          <HighlightRolloff knee={0.8} desaturation={0.25} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
          {/* faint SCREEN grain kills additive-gradient banding on the dark backdrop */}
          <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.018} />
        </EffectComposer>
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
