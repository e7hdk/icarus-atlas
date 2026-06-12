import * as THREE from 'three';

/** Desaturated environment tints per cluster — deliberately offset from TYPE_GLOW
 *  so nebula haze never aliases with the star-type color code the user learns.
 *  Every tint is additionally pulled 30% toward neutral dust so regions tint
 *  rather than color-block. */
const RAW_CLUSTER_TINTS: Record<string, string> = {
  core: '#c084fc',
  'titan-ring': '#e8538f',
  'olympian-band': '#d9a648',
  chthonic: '#5b46d6',
  'night-court': '#00b8d4',
  'mortal-arm': '#7e93b8',
};

export const NEUTRAL_DUST = new THREE.Color('#9aa4c0');

const FALLBACK_TINT = new THREE.Color('#9aa4c0');

const tintCache = new Map<string, THREE.Color>();

/** Linear-space cluster tint, pre-mixed 30% toward neutral dust. */
export function clusterTint(cluster: string): THREE.Color {
  const hit = tintCache.get(cluster);
  if (hit) return hit;
  const raw = RAW_CLUSTER_TINTS[cluster];
  const color = raw ? new THREE.Color(raw).lerp(NEUTRAL_DUST, 0.3) : FALLBACK_TINT.clone();
  tintCache.set(cluster, color);
  return color;
}

export const WISP_CLUSTERS = Object.keys(RAW_CLUSTER_TINTS);

/** Backdrop shell wisps cycle the theme's nebula accents. */
export const BACKDROP_TINTS = ['#7c4dff', '#00e5ff', '#ff4081'].map((hex) =>
  new THREE.Color(hex).lerp(NEUTRAL_DUST, 0.3),
);
