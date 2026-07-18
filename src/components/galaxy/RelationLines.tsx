'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Relation } from '@/types/character';
import type { Vec3 } from '@/features/galaxy/layout';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useEphemerisStore } from '@/features/spotlight/store';
import { filterRelations } from '@/lib/lens';

/** Lights up the bonds of the hovered (or selected) star.
 *  Disputed edges (carrying a topic) render dashed in the nebula accent.
 *  While the Proem plays, only its thread's edges are lit, one reveal at a
 *  time — the full selected fan would wash the stage (docs/EPHEMERIS_PLAN.md §6). */
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
  const proemActive = useEphemerisStore((s) => s.proemActive);
  const spotlightIds = useEphemerisStore((s) => s.spotlightRelationIds);
  const activeId = hoveredId ?? selectedId;

  const activeEdges = useMemo(() => {
    if (proemActive) {
      const wanted = new Set(spotlightIds);
      return relations.filter((relation) => wanted.has(relation.id));
    }
    return activeId
      ? filterRelations(relations, lens).filter((r) => r.from === activeId || r.to === activeId)
      : [];
  }, [activeId, lens, relations, proemActive, spotlightIds]);

  return (
    <group>
      {activeEdges.map((relation) => {
        const from = positions.get(relation.from);
        const to = positions.get(relation.to);
        if (!from || !to) return null;
        const disputed = lens === 'consensus' && Boolean(relation.topic);
        return (
          <Line
            key={relation.id}
            points={[from, to]}
            color={disputed ? '#c084fc' : '#8b9bd4'}
            lineWidth={proemActive ? 2.2 : disputed ? 1.8 : 1.1}
            dashed={disputed}
            dashSize={0.7}
            gapSize={0.45}
            transparent
            opacity={proemActive ? 0.9 : 0.6}
            renderOrder={3}
          />
        );
      })}
    </group>
  );
}
