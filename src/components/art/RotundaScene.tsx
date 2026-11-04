'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import type { PerspectiveCamera } from 'three';
import { Rotunda, type RotundaOptions } from '@/features/art/rotunda/engine';

type Events = 'onMode' | 'onHover' | 'onReadout' | 'onWeb' | 'onPattern';
export type RotundaEvents = Pick<RotundaOptions, Events>;
export type RotundaSettings = Omit<RotundaOptions, 'renderer' | 'scene' | 'camera' | 'width' | 'height' | Events>;

/** Hosts the rotunda's engine in the door's canvas: it builds the room once, drives it
 *  every frame, and keeps it the size of the view. The engine picks for itself, so the
 *  canvas's own pointer events go unused, as on the flat cloth. */
export function RotundaScene({
  settings,
  events,
  onReady,
  onFrame,
}: {
  /** Fixed for the life of the room: a new object builds a new one. */
  settings: RotundaSettings;
  /** What the room tells the door, read when it happens. */
  events: RefObject<RotundaEvents | null>;
  onReady: (rotunda: Rotunda | null) => void;
  onFrame: () => void;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const room = useRef<Rotunda | null>(null);
  const seedSize = useRef(size);

  useEffect(() => {
    const built = new Rotunda({
      ...settings,
      renderer: gl,
      scene,
      camera: camera as PerspectiveCamera,
      width: seedSize.current.width,
      height: seedSize.current.height,
      onMode: (mode) => events.current?.onMode(mode),
      onHover: (work, saga) => events.current?.onHover(work, saga),
      onReadout: (label, sub) => events.current?.onReadout(label, sub),
      onWeb: (focus, along) => events.current?.onWeb(focus, along),
      onPattern: (pattern) => events.current?.onPattern(pattern),
    });
    room.current = built;
    onReady(built);
    return () => {
      onReady(null);
      built.dispose();
      room.current = null;
    };
  }, [settings, events, gl, scene, camera, onReady]);

  useEffect(() => {
    seedSize.current = size;
    room.current?.resize(size.width, size.height);
  }, [size]);

  useFrame((_, delta) => {
    const built = room.current;
    if (!built) return;
    built.frame(Math.min(delta, 0.05), performance.now());
    onFrame();
  });
  return null;
}
