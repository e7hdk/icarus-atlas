'use client';

import { useEffect, useRef, type ComponentRef } from 'react';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { MOBILE_TAP_SLOP } from '@/lib/useIsMobile';

const HOME_POSITION: Vec3 = [18, 43, 88];
const HOME_TARGET: Vec3 = [0, 1, 0];
const TRAVEL_DISTANCE = 13;
/** Shifts the aim point right so the star sits left of the story panel. */
const PANEL_OFFSET = 2.6;

/** Smooth fly-to on selection; returns to the overview when deselected. */
export function CameraRig({
  isMobile,
  positions,
  intro = false,
}: {
  isMobile: boolean;
  positions: Map<string, Vec3>;
  /** City skies: drift in from a high vantage on first mount. */
  intro?: boolean;
}) {
  const controls = useRef<ComponentRef<typeof CameraControls>>(null);
  const eventSource = useThree((state) => state.events.connected ?? state.gl.domElement);
  const introDone = useRef(false);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const focusPoint = useGalaxyStore((s) => s.focusPoint);
  const focusDistance = useGalaxyStore((s) => s.focusDistance);
  const skyFocus = useGalaxyStore((s) => s.skyFocus);
  const isDiving = useGalaxyStore((s) => s.isDiving);
  const spacingScale = useGalaxyStore((s) => s.spacingScale);

  useEffect(() => {
    const rig = controls.current;
    if (!isMobile || !rig || !(eventSource instanceof HTMLElement)) return;

    const ownerDocument = eventSource.ownerDocument;
    const originalOneTouchAction = rig.touches.one;
    const touchStarts = new Map<number, { x: number; y: number }>();
    let primaryPointerId: number | null = null;
    let dragUnlocked = false;

    const restoreOneTouchAction = () => {
      rig.touches.one = originalOneTouchAction;
    };
    const startedInsideControls = (event: PointerEvent) => {
      const target = event.target;
      return target instanceof Node && eventSource.contains(target);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !startedInsideControls(event)) return;
      touchStarts.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchStarts.size === 1) {
        primaryPointerId = event.pointerId;
        dragUnlocked = false;
        rig.touches.one = CameraControlsImpl.ACTION.NONE;
      } else {
        // Pinch and other multi-touch gestures must begin immediately.
        dragUnlocked = true;
        restoreOneTouchAction();
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (
        event.pointerType !== 'touch' ||
        dragUnlocked ||
        event.pointerId !== primaryPointerId ||
        touchStarts.size !== 1
      ) {
        return;
      }
      const start = touchStarts.get(event.pointerId);
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dx * dx + dy * dy > MOBILE_TAP_SLOP * MOBILE_TAP_SLOP) {
        dragUnlocked = true;
        restoreOneTouchAction();
      }
    };
    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !touchStarts.delete(event.pointerId)) return;
      if (touchStarts.size === 0) {
        primaryPointerId = null;
        dragUnlocked = false;
        restoreOneTouchAction();
      } else {
        // Continue a pinch as a regular one-finger drag after either finger lifts.
        primaryPointerId = touchStarts.keys().next().value ?? null;
        dragUnlocked = true;
        restoreOneTouchAction();
      }
    };

    // Bubble after CameraControls' own pointerdown so an earlier gesture's
    // inertia is stopped before the one-finger action enters the dead zone.
    ownerDocument.addEventListener('pointerdown', onPointerDown);
    ownerDocument.addEventListener('pointermove', onPointerMove, true);
    ownerDocument.addEventListener('pointerup', onPointerEnd, true);
    ownerDocument.addEventListener('pointercancel', onPointerEnd, true);
    return () => {
      ownerDocument.removeEventListener('pointerdown', onPointerDown);
      ownerDocument.removeEventListener('pointermove', onPointerMove, true);
      ownerDocument.removeEventListener('pointerup', onPointerEnd, true);
      ownerDocument.removeEventListener('pointercancel', onPointerEnd, true);
      restoreOneTouchAction();
    };
  }, [eventSource, isMobile]);

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
      // A sky-copy in the week's constellation carries its own focus: the
      // visitor clicked the star up there, so that is where we fly — dropping
      // to the original on the disc would yank them out of the sky.
      const position = focusPoint ?? positions.get(selectedId);
      if (!position) return;
      const [x, y, z] = position;

      if (isDiving) {
        rig.minDistance = 0.01;
        // Fly directly into the star's core
        rig.setLookAt(x, y, z + 0.1, x, y, z, true);
        return;
      }
      // A sky-star is drawn far larger than a galaxy star, so it is framed from
      // proportionally further out — otherwise the flight ends inside it.
      const travel = focusDistance ?? TRAVEL_DISTANCE;
      rig.minDistance = Math.max(4, travel * 0.3);

      const outward = new THREE.Vector3(x, 0, z);
      if (outward.lengthSq() < 0.01) outward.set(1, 0, 1);
      outward.normalize();
      const camera = new THREE.Vector3(
        x + outward.x * travel,
        y + travel * 0.45,
        z + outward.z * travel,
      );
      const forward = new THREE.Vector3(x, y, z).sub(camera).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const target = new THREE.Vector3(x, y, z).addScaledVector(right, PANEL_OFFSET);
      rig.setLookAt(camera.x, camera.y, camera.z, target.x, target.y, target.z, true);
    } else if (skyFocus) {
      // Out to the constellation itself: the sky is read from beside it.
      const [x, y, z] = skyFocus.at;
      const outward = new THREE.Vector3(x, y, z).normalize().multiplyScalar(-skyFocus.distance);
      rig.minDistance = 4;
      rig.setLookAt(x + outward.x, y + outward.y, z + outward.z, x, y, z, true);
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
  }, [selectedId, focusPoint, focusDistance, skyFocus, positions, isDiving, spacingScale, intro]);

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
