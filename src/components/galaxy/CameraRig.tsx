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
export function CameraRig({ positions }: { positions: Map<string, Vec3> }) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const isDiving = useGalaxyStore((s) => s.isDiving);

  useEffect(() => {
    const rig = controls.current;
    if (!rig) return;
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
      rig.setLookAt(...HOME_POSITION, ...HOME_TARGET, true);
    }
  }, [selectedId, positions, isDiving]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.5}
      minDistance={4}
      maxDistance={190}
      dollySpeed={0.6}
    />
  );
}
