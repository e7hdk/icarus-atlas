'use client';

import { useCallback, useMemo, useRef, type ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { pieceNumber, type StagePiece } from '@/features/dedication/director';
import { stage } from '@/features/dedication/stage';
import type { Dedication } from '@/features/galaxy/dedication';
import type { Vec3 } from '@/features/galaxy/layout';
import { TYPE_GLOW } from '@/types/character';
import { guestPlace } from './Guest';
import { Sprites, ease, type SpriteBuffers } from './Sprites';

/** Two threads spun out of the spinners' hands, one to each of two stars, and
 *  then wound round each other between those stars into one cord. The piece's
 *  first star is hers, the rest are the spinners; the other end is a guest
 *  (Guest.tsx), placed by the same `dx`, `dy`, `dz`.
 *
 *  `reach`: seconds the threads take to arrive. `knot`: seconds from the start
 *  at which the winding begins. `wind`: seconds it takes. `gild`: seconds from
 *  the start at which the cord turns to gold. */

type LineRef = ComponentRef<typeof Line>;

const ARC_POINTS = 72;
const STRAND_POINTS = 200;
const TURNS = 6.5;
const GIRTH = 4.4;

/** A thread's path from `from` to `to`, bowed to one side. */
function arc(from: THREE.Vector3, to: THREE.Vector3, bow: number): THREE.Vector3[] {
  const along = to.clone().sub(from);
  const side = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 1, 0));
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  side.normalize();
  const middle = from.clone().lerp(to, 0.5).addScaledVector(side, bow * along.length()).add(new THREE.Vector3(0, Math.abs(bow) * along.length() * 0.35, 0));
  const curve = new THREE.QuadraticBezierCurve3(from, middle, to);
  return curve.getPoints(ARC_POINTS - 1);
}

/** One strand of the cord: round the axis from `from` to `to`, loose in the middle, tied at the ends. */
function strand(from: THREE.Vector3, to: THREE.Vector3, phase: number): THREE.Vector3[] {
  const axis = to.clone().sub(from);
  const u = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(1, 0, 0.35));
  if (u.lengthSq() < 1e-6) u.set(0, 0, 1);
  u.normalize();
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < STRAND_POINTS; index++) {
    const s = index / (STRAND_POINTS - 1);
    const girth = GIRTH * Math.sin(Math.PI * s) ** 0.7;
    const angle = 2 * Math.PI * TURNS * s + phase;
    points.push(from.clone().addScaledVector(axis, s).addScaledVector(u, girth * Math.cos(angle)).addScaledVector(v, girth * Math.sin(angle)));
  }
  return points;
}

export function Braid({ piece, positions, dedication }: { piece: StagePiece; positions: Map<string, Vec3>; dedication: Dedication }) {
  const hers = useRef<LineRef>(null);
  const his = useRef<LineRef>(null);
  const herStrand = useRef<LineRef>(null);
  const hisStrand = useRef<LineRef>(null);
  const reach = pieceNumber(piece, 'reach', 10);
  const knot = pieceNumber(piece, 'knot', 12);
  const wind = pieceNumber(piece, 'wind', 6);
  const gild = pieceNumber(piece, 'gild', knot + wind);
  const loosen = pieceNumber(piece, 'loosen', gild + 6);

  const paths = useMemo(() => {
    const [star, ...spinners] = piece.ids;
    const her = new THREE.Vector3(...(positions.get(star) ?? [0, 0, 0]));
    const him = guestPlace(piece, positions);
    const hands = spinners
      .map((id) => new THREE.Vector3(...(positions.get(id) ?? [0, 0, 0])))
      .reduce((sum, point) => sum.add(point), new THREE.Vector3())
      .divideScalar(Math.max(1, spinners.length));
    // His strand is laid from his star toward hers: it grows from its own end.
    return { toHer: arc(hands, her, 0.16), toHim: arc(hands, him, -0.16), hers: strand(her, him, 0), his: strand(him, her, Math.PI) };
  }, [piece, positions]);

  const colours = useMemo(() => {
    const rose = new THREE.Color(dedication.from);
    const white = new THREE.Color(TYPE_GLOW.mortal.color);
    const gold = new THREE.Color(dedication.to);
    return { rose, white, gold };
  }, [dedication.from, dedication.to]);

  const scratch = useRef(new THREE.Color());

  useFrame(() => {
    const lines = [hers.current, his.current, herStrand.current, hisStrand.current];
    if (lines.some((line) => !line)) return;
    const since = stage.time - piece.t;
    const shown = stage.active && since >= 0 && stage.time <= piece.until;
    for (const line of lines) line!.visible = shown;
    if (!shown) return;
    const leaving = ease((piece.until - stage.time) / 2);
    const arrived = ease(since / reach);
    const wound = ease((since - knot) / wind);
    const gilded = ease((since - gild) / 2.4);
    // The long threads have done their work once the cord is gold: they thin away.
    const longThreads = (1 - ease((since - loosen) / 5)) * leaving;
    const shimmer = 0.9 + 0.1 * Math.sin(stage.time * 2.1);
    const mixed = scratch.current;

    const draw = (line: LineRef, drawn: number, points: number, colour: THREE.Color, light: number) => {
      line.geometry.instanceCount = Math.max(0, Math.min(points - 1, Math.floor(drawn * (points - 1))));
      line.visible = line.geometry.instanceCount > 0 && light > 0.004;
      line.material.color.copy(mixed.copy(colour).lerp(colours.gold, gilded)).multiplyScalar(light);
    };
    draw(hers.current!, arrived, ARC_POINTS, colours.rose, 1.25 * longThreads * shimmer);
    draw(his.current!, arrived, ARC_POINTS, colours.white, 1.0 * longThreads * shimmer);
    const cord = (1.3 + 1.5 * gilded) * leaving * shimmer;
    draw(herStrand.current!, wound, STRAND_POINTS, colours.rose, cord);
    draw(hisStrand.current!, wound, STRAND_POINTS, colours.white, cord);
  });

  // A bead of light rides the head of each thread while it is still being spun.
  const heads = useCallback(
    (buffers: SpriteBuffers): boolean => {
      const since = stage.time - piece.t;
      if (!stage.active || since < 0 || stage.time > piece.until) return false;
      const arrived = ease(since / reach);
      const wound = ease((since - knot) / wind);
      const tips: [THREE.Vector3[], number, THREE.Color][] = [
        [paths.toHer, arrived, colours.rose],
        [paths.toHim, arrived, colours.white],
        [paths.hers, wound, colours.rose],
        [paths.his, wound, colours.white],
      ];
      let any = false;
      tips.forEach(([path, drawn, colour], index) => {
        const spinning = drawn > 0.002 && drawn < 0.998;
        const tip = path[Math.min(path.length - 1, Math.floor(drawn * (path.length - 1)))];
        buffers.position.set([tip.x, tip.y, tip.z], index * 3);
        const light = spinning ? 2.6 : 0;
        buffers.color.set([colour.r * light, colour.g * light, colour.b * light], index * 3);
        buffers.size[index] = index < 2 ? 3.2 : 1.9;
        any ||= spinning;
      });
      return any;
    },
    [piece, paths, colours, reach, knot, wind],
  );

  // No `visible` here: drei hands these to the line's material as well, and a
  // hidden material is never drawn. The frame loop decides what shows.
  const common = { transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as const;
  return (
    <>
      <Line ref={hers} points={paths.toHer} lineWidth={1.7} renderOrder={4} {...common} />
      <Line ref={his} points={paths.toHim} lineWidth={1.7} renderOrder={4} {...common} />
      <Line ref={herStrand} points={paths.hers} lineWidth={2.3} renderOrder={4} {...common} />
      <Line ref={hisStrand} points={paths.his} lineWidth={2.3} renderOrder={4} {...common} />
      <Sprites count={4} write={heads} />
    </>
  );
}
