import type { Vec3 } from '@/features/galaxy/layout';

/** The galaxy disc's radius in world units: P95 of the stars' planar distance
 *  from the centre, so a few stray outliers do not set it. 0 when empty. */
export function discRadiusOf(positions: Map<string, Vec3>): number {
  const radii = [...positions.values()].map(([x, , z]) => Math.hypot(x, z)).sort((a, b) => a - b);
  return radii.length > 0 ? radii[Math.floor((radii.length - 1) * 0.95)] : 0;
}
