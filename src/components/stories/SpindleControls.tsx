'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '@/features/stories/spindle';

/** Eye height of the marble above the tunnel floor. */
const EYE = 6;
/** How far ahead of the marble a focused star rolls to rest, on the floor. */
const AHEAD_SEL = 40;
/** How far ahead the origin (Chaos) sits in the overview. */
const AHEAD_OVR = 30;
/** Easing for the selection roll/travel — low and slow, so clicking a star
 *  glides the tunnel gently around to it rather than snapping there. */
const SELECT_LERP = 0.04;
/** Manual input sensitivity. Travel is brisk — the corridor of time is long. */
const ROLL_SENS = 0.0055;
const TRAVEL_SENS = 1.2;
const TAU = Math.PI * 2;

/** Spindle rig — the "rolling marble" camera. We never fly through space: the
 *  camera is a marble fixed on the tunnel floor, always gazing forward down the
 *  corridor of time. Instead, the whole tunnel ROLLS about its axis and SLIDES
 *  along it to bring the chosen star down to the marble — so from our seat the
 *  cylinder turns and the stars sweep around the walls, exactly as if we rolled
 *  along the surface to reach it. Wheel travels through time; drag spins the
 *  cylinder. The roll group is owned by the parent; we only animate it. */
export function SpindleRig({
  rollRef,
  selectedPos,
  originPos,
  radius,
  draggedRef,
}: {
  /** The animated outer group that rolls (rotation.z) and travels (position.z). */
  rollRef: MutableRefObject<THREE.Group | null>;
  selectedPos: Vec3 | null;
  /** The origin myth (Chaos) the overview rests on. */
  originPos: Vec3 | null;
  radius: number;
  /** Set true while dragging so a drag never registers as a star click. */
  draggedRef: MutableRefObject<boolean>;
}) {
  const { camera, gl } = useThree();
  const rollTarget = useRef(0);
  const travelTarget = useRef(0);
  // The animated base, easing slowly toward the targets (the selection glide).
  const baseRoll = useRef(0);
  const baseTravel = useRef(0);
  // Manual offsets, applied instantly on top of the base (responsive drag/wheel).
  const userRoll = useRef(0);
  const userTravel = useRef(0);
  const firstRef = useRef(true);

  // The marble: fixed on the floor, gazing forward and a touch down the tunnel.
  useEffect(() => {
    camera.position.set(0, -(radius - EYE), 0);
    camera.lookAt(0, -(radius - EYE) - 4, 72);
    camera.updateProjectionMatrix();
  }, [camera, radius]);

  // Bring the focus down to the marble. The roll takes the short way round from
  // where we are. Aim the rig at a layout point P, easing forward (ahead) along
  // the tunnel; folds any manual offset into the base so the glide starts with no
  // jump from exactly where we sit.
  useEffect(() => {
    const aimAt = (p: Vec3, ahead: number) => {
      const [lx, ly, lz] = p;
      // Inner-world (after the side-lay rotation): (x, z, -y).
      const phi = Math.atan2(lz, lx);
      baseRoll.current += userRoll.current;
      baseTravel.current += userTravel.current;
      userRoll.current = 0;
      userTravel.current = 0;
      let beta = -Math.PI / 2 - phi; // rotate this star's angle to the floor (−Y)
      beta += Math.round((baseRoll.current - beta) / TAU) * TAU; // nearest way round
      rollTarget.current = beta;
      travelTarget.current = ahead - -ly; // innerZ = -ly
    };

    if (selectedPos) {
      aimAt(selectedPos, AHEAD_SEL);
      // First time in, snap straight there so nothing sweeps across the screen.
      if (firstRef.current) {
        baseRoll.current = rollTarget.current;
        baseTravel.current = travelTarget.current;
        firstRef.current = false;
      }
      return;
    }

    // No selection. On first mount fall back to the origin overview; afterwards
    // (an Escape / deselect) FREEZE exactly where we are — never fly back.
    if (firstRef.current && originPos) {
      aimAt(originPos, AHEAD_OVR);
      baseRoll.current = rollTarget.current;
      baseTravel.current = travelTarget.current;
      firstRef.current = false;
      return;
    }
    baseRoll.current += userRoll.current;
    baseTravel.current += userTravel.current;
    userRoll.current = 0;
    userTravel.current = 0;
    rollTarget.current = baseRoll.current;
    travelTarget.current = baseTravel.current;
  }, [selectedPos, originPos]);

  // Wheel = travel through time; drag = spin the cylinder. On touch, a
  // vertical drag travels too (phones have no wheel). The canvas opts out of
  // browser gestures via CSS (`.spindle-stage canvas { touch-action: none }`,
  // globals.css) — without it the browser cancels the pointer stream after a
  // few pixels, which read as "barely moves".
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      userTravel.current -= e.deltaY * TRAVEL_SENS;
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      userRoll.current += dx * ROLL_SENS;
      // Drag up = advance down the corridor (the touch twin of wheel-down).
      if (e.pointerType !== 'mouse') userTravel.current += dy * TRAVEL_SENS;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) draggedRef.current = true;
    };
    const onUp = () => {
      dragging = false;
      // Clear on the next tick so the click handler (same gesture) can read it.
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl, draggedRef]);

  useFrame(() => {
    const g = rollRef.current;
    if (!g) return;
    // The base eases slowly toward the selected target (the gentle glide);
    // manual offsets ride on top instantly so dragging stays 1:1 responsive.
    baseRoll.current += (rollTarget.current - baseRoll.current) * SELECT_LERP;
    baseTravel.current += (travelTarget.current - baseTravel.current) * SELECT_LERP;
    g.rotation.z = baseRoll.current + userRoll.current;
    g.position.z = baseTravel.current + userTravel.current;
  });

  return null;
}
