'use client';

import { useEffect, useRef, type ComponentRef } from 'react';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';

const HOME_POSITION: Vec3 = [18, 43, 88];
const HOME_TARGET: Vec3 = [0, 1, 0];
const TRAVEL_DISTANCE = 13;
/** Shifts the aim point right so the star sits left of the story panel. */
const PANEL_OFFSET = 2.6;

/** Smooth fly-to on selection; returns to the overview when deselected. */
export function CameraRig({
  positions,
  intro = false,
}: {
  positions: Map<string, Vec3>;
  /** City skies: drift in from a high vantage on first mount. */
  intro?: boolean;
}) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const introDone = useRef(false);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const isDiving = useGalaxyStore((s) => s.isDiving);
  const spacingScale = useGalaxyStore((s) => s.spacingScale);

  useEffect(() => {
    if (!intro || introDone.current) return;
    const rig = controls.current;
    if (!rig) return;

    const overviewScale = spacingScale * 1.65;
    const homeCamera: Vec3 = [
      HOME_POSITION[0] * overviewScale,
      HOME_POSITION[1] * overviewScale,
      HOME_POSITION[2] * overviewScale,
    ];
    const introCamera: Vec3 = [
      homeCamera[0] * 1.85,
      homeCamera[1] * 1.55,
      homeCamera[2] * 1.85,
    ];

    rig.setLookAt(...introCamera, ...HOME_TARGET, false);
    const timer = window.setTimeout(() => {
      rig.setLookAt(...homeCamera, ...HOME_TARGET, true);
      introDone.current = true;
    }, 80);
    return () => window.clearTimeout(timer);
  }, [intro, spacingScale]);

  useEffect(() => {
    const rig = controls.current;
    if (!rig) return;
    if (intro && !introDone.current) return;
    if (selectedId) {
      const position = positions.get(selectedId);
      if (!position) return;
      const [x, y, z] = position;

      if (isDiving) {
        rig.minDistance = 0.01;
        // Fly directly into the star's core
        rig.setLookAt(x, y, z + 0.1, x, y, z, true);
        return;
      }
      rig.minDistance = 4;
      
      const outward = new THREE.Vector3(x, 0, z);
      if (outward.lengthSq() < 0.01) outward.set(1, 0, 1);
      outward.normalize();
      const camera = new THREE.Vector3(
        x + outward.x * TRAVEL_DISTANCE,
        y + TRAVEL_DISTANCE * 0.45,
        z + outward.z * TRAVEL_DISTANCE,
      );
      const forward = new THREE.Vector3(x, y, z).sub(camera).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const target = new THREE.Vector3(x, y, z).addScaledVector(right, PANEL_OFFSET);
      rig.setLookAt(camera.x, camera.y, camera.z, target.x, target.y, target.z, true);
    } else {
      const overviewScale = intro ? spacingScale * 1.65 : spacingScale * 2.5;
      rig.setLookAt(
        HOME_POSITION[0] * overviewScale,
        HOME_POSITION[1] * overviewScale,
        HOME_POSITION[2] * overviewScale,
        ...HOME_TARGET,
        true
      );
    }
  }, [selectedId, positions, isDiving, spacingScale, intro]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.5}
      minDistance={4}
      maxDistance={6000}
      dollySpeed={0.6}
    />
  );
}
