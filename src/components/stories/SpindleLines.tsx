'use client';

import { memo, useMemo } from 'react';
import * as THREE from 'three';
import type { LensId } from '@/types/character';
import { isStoryAttested, type SpindleNode, type Vec3 } from '@/features/stories/spindle';

/** The layout point at parameter t (0→1) along a world-line's polyline — used to
 *  land the camera where the thread was clicked, not at its star. */
function pointAt(points: Vec3[], t: number): Vec3 {
  if (points.length === 1) return points[0];
  const d = Math.min(Math.max(t, 0), 1) * (points.length - 1);
  const i = Math.min(Math.floor(d), points.length - 2);
  const a = points[i];
  const b = points[i + 1];
  const f = d - i;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** A piecewise-linear curve through the layout's sampled points. Unlike a
 *  Catmull-Rom spline it never overshoots its endpoints, so the tube starts
 *  cleanly at the star instead of curling into the "hook" it used to show. */
class PolylineCurve extends THREE.Curve<THREE.Vector3> {
  private pts: THREE.Vector3[];
  constructor(pts: THREE.Vector3[]) {
    super();
    this.pts = pts;
  }
  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const pts = this.pts;
    if (pts.length === 1) return target.copy(pts[0]);
    const d = t * (pts.length - 1);
    const i = Math.min(Math.floor(d), pts.length - 2);
    return target.copy(pts[i]).lerp(pts[i + 1], d - i);
  }
}

/** Tube material that fades out only near its far tip (uv.x: 0 at the branch
 *  point / star, 1 at the world-line's end). The fade is narrow so a trunk that
 *  carries several branches stays solid all along its length — only the loose
 *  end dissolves softly into space instead of stopping at an ugly hard cap. */
const LINE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const LINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float fade = 1.0 - smoothstep(0.88, 1.0, vUv.x);
  gl_FragColor = vec4(uColor, uOpacity * fade);
}
`;

/** One story's world-line: a glowing tube running era → eraEnd along the
 *  cylinder. Geometry is built once; only its opacity reacts to hover/lens. */
const WorldLine = memo(function WorldLine({
  node,
  attested,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  node: SpindleNode;
  attested: boolean;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string, focus?: Vec3) => void;
}) {
  const { geometry, material, pickGeometry } = useMemo(() => {
    const pts = node.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new PolylineCurve(pts);
    const radius = 0.07 + node.size * 0.05;
    const geometry = new THREE.TubeGeometry(curve, Math.max(16, pts.length * 2), radius, 8, false);
    // A fat, invisible companion tube is the real pointer target — the visible
    // thread is far too thin to raycast reliably, which is why some lines felt
    // un-clickable. Cheap radial resolution: it is never drawn, only picked.
    const pickGeometry = new THREE.TubeGeometry(
      curve,
      Math.max(12, pts.length),
      Math.max(0.55, radius * 5),
      5,
      false,
    );
    const material = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(node.color) },
        uOpacity: { value: 0.6 },
      },
    });
    return { geometry, material, pickGeometry };
  }, [node.points, node.size, node.color]);

  const emphasized = hovered || selected;
  const opacity = emphasized ? 0.95 : attested ? 0.6 : 0.14;
  material.uniforms.uOpacity.value = opacity;

  return (
    <group>
      {/* Visible thread — drawn only, never picked. */}
      <mesh geometry={geometry} material={material} renderOrder={emphasized ? 3 : 1} raycast={() => null} />
      {/* Invisible fat hit volume — the reliable click/hover target. */}
      <mesh
        geometry={pickGeometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(node.id);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (!hovered) onHover(node.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          // uv.x runs 0→1 along the tube, so it pinpoints where on the thread we
          // clicked — fly there instead of snapping to the line's starting star.
          const t = e.uv?.x;
          onSelect(node.id, typeof t === 'number' ? pointAt(node.points, t) : undefined);
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
});

/** All the myths as crossing world-lines on the spindle. */
export function SpindleLines({
  nodes,
  lens,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: {
  nodes: SpindleNode[];
  lens: LensId;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string, focus?: Vec3) => void;
}) {
  return (
    <group>
      {nodes.map((node) => (
        <WorldLine
          key={node.id}
          node={node}
          attested={isStoryAttested(node, lens)}
          hovered={hoveredId === node.id}
          selected={selectedId === node.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
