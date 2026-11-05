'use client';

import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Relation } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useEphemerisStore } from '@/features/spotlight/store';
import { filterRelations } from '@/lib/lens';

/** Lights up the bonds of the hovered (or selected) star.
 *  Disputed edges (carrying a topic) render dashed in the nebula accent.
 *  While the Proem plays, only its thread's edges are lit, one reveal at a
 *  time — the full selected fan would wash the stage (docs/EPHEMERIS_PLAN.md §6).
 *  A reading (First, Chaos) draws only its lit relations, accents in gold.
 *  Lines cross-fade: one that leaves the drawn set fades out as the next fades
 *  in, so a lens change re-routes a bond instead of snapping it. */

/** Seconds for a line to come and to go; a reading draws its lines in slowly. */
const FADE_IN = 0.12;
const FADE_OUT = 0.16;
const READING_FADE = 0.4;

type LineRef = ComponentRef<typeof Line>;

function FadingLine({
  points,
  color,
  width,
  dashed,
  opacity,
  leaving,
  tau,
  onGone,
}: {
  points: [Vec3, Vec3];
  color: string;
  width: number;
  dashed: boolean;
  opacity: number;
  leaving: boolean;
  tau: number;
  onGone: () => void;
}) {
  const ref = useRef<LineRef>(null);
  const shown = useRef(0);
  const gone = useRef(false);
  useFrame((_, delta) => {
    const line = ref.current;
    if (!line) return;
    const target = leaving ? 0 : opacity;
    const step = 1 - Math.exp(-delta / (leaving ? Math.min(tau, FADE_OUT * 2) : tau));
    shown.current += (target - shown.current) * step;
    if (Math.abs(target - shown.current) < 0.004) shown.current = target;
    line.material.opacity = shown.current;
    line.visible = shown.current > 0.004;
    if (leaving && shown.current === 0 && !gone.current) {
      gone.current = true;
      onGone();
    }
  });
  return (
    <Line
      ref={ref}
      points={points}
      color={color}
      lineWidth={width}
      dashed={dashed}
      dashSize={0.7}
      gapSize={0.45}
      transparent
      opacity={0}
      renderOrder={3}
    />
  );
}

export function RelationLines({
  relations,
  positions,
}: {
  relations: Relation[];
  positions: Map<string, Vec3>;
}) {
  const hoveredId = useGalaxyStore((s) => s.hoveredId);
  const selectedId = useGalaxyStore((s) => s.selectedId);
  const lens = useGalaxyStore((s) => s.lens);
  const lit = useGalaxyStore((s) => s.lit);
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const spotlightIds = useEphemerisStore((s) => s.spotlightRelationIds);
  const activeId = hoveredId ?? selectedId;

  const activeEdges = useMemo(() => {
    if (lit) {
      const wanted = new Set(lit.relations);
      return relations.filter((relation) => wanted.has(relation.id));
    }
    if (proemActive) {
      const wanted = new Set(spotlightIds);
      return relations.filter((relation) => wanted.has(relation.id));
    }
    return activeId
      ? filterRelations(relations, lens).filter((r) => r.from === activeId || r.to === activeId)
      : [];
  }, [activeId, lens, relations, proemActive, spotlightIds, lit]);
  const accent = useMemo(() => new Set(lit?.accent ?? []), [lit]);

  // the lines that just left the drawn set, kept until they have faded
  const [drawn, setDrawn] = useState<{ active: Relation[]; leaving: Relation[] }>({ active: [], leaving: [] });
  if (drawn.active !== activeEdges) {
    const now = new Set(activeEdges.map((relation) => relation.id));
    setDrawn({
      active: activeEdges,
      leaving: [...drawn.leaving, ...drawn.active].filter((relation, index, all) => !now.has(relation.id) && all.findIndex((other) => other.id === relation.id) === index),
    });
  }
  const drop = (id: string) => setDrawn((current) => ({ ...current, leaving: current.leaving.filter((relation) => relation.id !== id) }));

  const tau = lit ? READING_FADE : FADE_IN;
  const render = (relation: Relation, leaving: boolean) => {
    const from = positions.get(relation.from);
    const to = positions.get(relation.to);
    if (!from || !to) return null;
    const gold = accent.has(relation.id);
    const disputed = !lit && lens === 'consensus' && Boolean(relation.topic);
    return (
      <FadingLine
        key={relation.id}
        points={[from, to]}
        color={gold ? '#fcd34d' : disputed ? '#c084fc' : '#8b9bd4'}
        width={gold ? 2.6 : proemActive ? 2.2 : disputed ? 1.8 : lit ? 1.2 : 1.1}
        dashed={disputed}
        opacity={gold ? 0.95 : proemActive ? 0.9 : lit ? 0.5 : 0.6}
        leaving={leaving}
        tau={tau}
        onGone={() => drop(relation.id)}
      />
    );
  };

  return (
    <group>
      {drawn.active.map((relation) => render(relation, false))}
      {drawn.leaving.map((relation) => render(relation, true))}
    </group>
  );
}
