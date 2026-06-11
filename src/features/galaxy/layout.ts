import type { Character } from '@/types/character';

export type Vec3 = [number, number, number];

/** Galaxy regions: genealogical time maps to distance from the core.
 *  Each band has its own tilt and thickness so the sky reads as a volume, not a flat disc. */
const CLUSTERS: Record<
  string,
  { rMin: number; rMax: number; yBase: number; thickness: number; tilt: number }
> = {
  core: { rMin: 5.5, rMax: 14, yBase: 0, thickness: 4.5, tilt: 3.5 },
  'titan-ring': { rMin: 18, rMax: 27, yBase: 0, thickness: 6.5, tilt: -6 },
  'olympian-band': { rMin: 33, rMax: 46, yBase: 1, thickness: 9, tilt: 9 },
  chthonic: { rMin: 15, rMax: 23, yBase: -15, thickness: 4, tilt: -4 },
  'night-court': { rMin: 22, rMax: 39, yBase: -5, thickness: 11, tilt: -13 },
};

const FALLBACK_CLUSTER = { rMin: 52, rMax: 66, yBase: 0, thickness: 12, tilt: 11 };

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** FNV-1a — stable across sessions so the sky never rearranges between visits. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic star positions: tilted, thick golden-angle bands with per-id jitter. */
export function computePositions(characters: Character[]): Map<string, Vec3> {
  const byCluster = new Map<string, Character[]>();
  for (const character of characters) {
    const members = byCluster.get(character.cluster) ?? [];
    members.push(character);
    byCluster.set(character.cluster, members);
  }

  const positions = new Map<string, Vec3>();
  for (const [cluster, members] of byCluster) {
    const cfg = CLUSTERS[cluster] ?? FALLBACK_CLUSTER;
    members.sort((a, b) => a.id.localeCompare(b.id));
    const clusterOffset = (hashString(cluster) % 3600) * (Math.PI / 1800);

    members.forEach((character, index) => {
      if (character.id === 'chaos') {
        positions.set(character.id, [0, 0, 0]);
        return;
      }
      const rng = mulberry32(hashString(character.id));
      const angle = clusterOffset + index * GOLDEN_ANGLE + (rng() - 0.5) * 0.5;
      const spread = members.length > 1 ? index / (members.length - 1) : 0.5;
      const radius = cfg.rMin + (cfg.rMax - cfg.rMin) * ((spread + rng() * 0.35) % 1);
      const bandElevation = Math.sin(angle + clusterOffset * 0.7) * cfg.tilt;
      const y = cfg.yBase + bandElevation + (rng() - 0.5) * 2 * cfg.thickness;
      positions.set(character.id, [Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    });
  }
  return positions;
}
