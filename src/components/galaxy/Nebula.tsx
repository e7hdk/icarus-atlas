'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const CLOUDS: { color: string; position: [number, number, number]; scale: number; opacity: number }[] = [
  { color: '#7c4dff', position: [-70, 14, -110], scale: 190, opacity: 0.32 },
  { color: '#00e5ff', position: [85, -24, -130], scale: 150, opacity: 0.16 },
  { color: '#ff4081', position: [50, 36, -150], scale: 130, opacity: 0.18 },
  { color: '#7c4dff', position: [20, -10, -90], scale: 110, opacity: 0.14 },
];

function cloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

/** Distant additive nebula clouds — pure backdrop, never interactive. */
export function Nebula() {
  const texture = useMemo(() => cloudTexture(), []);
  return (
    <group>
      {CLOUDS.map((cloud, index) => (
        <sprite key={index} position={cloud.position} scale={[cloud.scale, cloud.scale, 1]}>
          <spriteMaterial
            map={texture}
            color={cloud.color}
            blending={THREE.AdditiveBlending}
            opacity={cloud.opacity}
            depthWrite={false}
            transparent
          />
        </sprite>
      ))}
    </group>
  );
}
