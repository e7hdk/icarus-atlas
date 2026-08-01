import * as THREE from 'three';
import type { CharacterType } from '@/types/character';

/** The one recipe for what a star LOOKS like: core radius per cosmic role, the
 *  pulse each role breathes with, and the shared radial halo. StarsDriver draws
 *  the galaxy's stars from it; the week's catasterism draws its sky-copies from
 *  the same numbers (scaled up), so a copy reads as the same star, brighter —
 *  not as a different kind of dot. */

export const STAR_SIZE: Record<CharacterType, number> = {
  primordial: 0.85,
  titan: 0.78,
  olympian: 0.95,
  god: 0.8,
  hero: 0.7,
  mortal: 0.6,
  nymph: 0.65,
  creature: 0.75,
};

export const STAR_PULSE: Record<
  'slow' | 'steady' | 'quick' | 'irregular',
  { speed: number; amp: number }
> = {
  slow: { speed: 0.7, amp: 0.1 },
  steady: { speed: 1.4, amp: 0.06 },
  quick: { speed: 3.2, amp: 0.1 },
  irregular: { speed: 2.1, amp: 0.12 },
};

/** How much bigger a glow billboard is than its core sphere. */
export const GLOW_SPREAD = 7;

let cached: THREE.CanvasTexture | null = null;

/** Soft radial halo, generated once and shared by every glow in the scene. */
export function starGlowTexture(): THREE.CanvasTexture {
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.07)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  cached = new THREE.CanvasTexture(canvas);
  return cached;
}
