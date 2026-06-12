/** Shaders for the nebula stack: atlas bake, wisps, dust lanes, galactic disc, dome.
 *  Runtime fragments only ever read the pre-baked atlas (1-2 fetches) — no live noise. */

export const ATLAS_BAKE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/** 4-channel noise atlas: R domain-warped billows, G variation field,
 *  B sharpened ridged filaments, A patchiness mask.
 *  All fields tile (period-6/12/3 lattices, warp built from periodic noise). */
export const ATLAS_BAKE_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  vec2 uv = vUv * 6.0;
  vec2 q = vec2(fbmT(uv, 6.0), fbmT(uv + vec2(5.2, 1.3), 6.0));
  vec2 w = vec2(fbmT(uv + 4.0 * q + vec2(1.7, 9.2), 6.0),
                fbmT(uv + 4.0 * q + vec2(8.3, 2.8), 6.0));
  float body      = fbmT(uv + 3.5 * (w - 0.5), 6.0);
  float variation = fbmT(uv * 2.0 + 2.5 * q + 17.0, 12.0);
  float filaments = pow(ridgedT(uv * 2.0 + 1.5 * (w - 0.5), 12.0), 2.2);
  float mask      = smoothstep(0.15, 0.75, fbmT(vUv * 3.0 + 13.7, 3.0));
  gl_FragColor = vec4(body, variation, filaments, mask);
}
`;

/** Shared billboard vertex for instanced wisps and dust lanes. */
export const BILLBOARD_VERT = /* glsl */ `
attribute vec3 aTint;
attribute float aScale;
attribute float aPhase;
attribute vec2 aTile;
attribute float aAlpha;
uniform float uTime;
uniform float uSpin; // rad/s; 0 = static orientation from aPhase only
varying vec2 vUv;
varying vec3 vTint;
varying vec2 vTile;
varying float vAlpha;
varying float vViewZ;

void main() {
  vUv = uv;
  vTint = aTint;
  vTile = aTile;
  vAlpha = aAlpha;
  float ang = uTime * uSpin + aPhase;
  float c = cos(ang), s = sin(ang);
  vec2 p = mat2(c, -s, s, c) * position.xy;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += p * aScale;
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

/** Additive nebula wisps. Peak radiance <= 0.6 — mathematically never blooms
 *  (threshold 1.0 contract); sparkle comes from giant field stars instead.
 *  nearFade is load-bearing: caps dive/fly-through fill (TRAVEL_DISTANCE = 13). */
export const WISP_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uTime;
uniform float uGain;
varying vec2 vUv;
varying vec3 vTint;
varying vec2 vTile;
varying float vAlpha;
varying float vViewZ;

void main() {
  vec2 uv1 = vUv * 0.85 + vTile + vec2(uTime * 0.0040, uTime * 0.0023);
  vec2 uv2 = vUv * 1.55 + vTile.yx - vec2(uTime * 0.0031, uTime * 0.0052);
  vec4 n1 = texture2D(uAtlas, uv1);
  vec4 n2 = texture2D(uAtlas, uv2);
  float density   = smoothstep(0.38, 0.95, n1.r * 0.6 + n2.g * 0.55) * n1.a;
  float filaments = pow(n2.b, 1.5);
  vec2 q = vUv * 2.0 - 1.0;
  float radial   = smoothstep(1.0, 0.2, length(q));
  float nearFade = smoothstep(6.0, 18.0, vViewZ);
  float aMask = (density * 0.6 + filaments * 0.4) * radial * nearFade * vAlpha;
  vec3 col = vTint * (0.35 + 0.65 * density) + vTint * vTint * filaments * 0.9;
  gl_FragColor = vec4(col * aMask * uGain, 1.0);
}
`;

/** Dark dust lanes — NORMAL blending: visibly deletes light behind it.
 *  The one subtractive element; the eye reads occluding volume from this. */
export const DUST_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uDust;
varying vec2 vUv;
varying vec2 vTile;
varying float vAlpha;
varying float vViewZ;

void main() {
  vec4 n = texture2D(uAtlas, vUv * 1.1 + vTile);
  float lane = pow(smoothstep(0.45, 0.9, n.b * 0.7 + n.r * 0.4), 1.6);
  vec2 q = vUv * 2.0 - 1.0;
  float a = lane * smoothstep(1.0, 0.25, length(q)) * smoothstep(6.0, 18.0, vViewZ) * vAlpha;
  gl_FragColor = vec4(uDust, a);
}
`;

export const DISC_VERT = /* glsl */ `
varying vec2 vUv;
varying float vViewZ;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

/** Spiral haze plane. Arm weight 0.25 — low contrast on purpose so the spiral
 *  never contradicts the concentric band layout; radial ramp + fBm dominate.
 *  Peak radiance <= uGain (0.28) — never blooms. */
export const DISC_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uTime;
uniform float uGain;
uniform float uSpinSign;
uniform vec3 uRampIn;
uniform vec3 uRampOut;
varying vec2 vUv;
varying float vViewZ;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float theta = atan(p.y, p.x);
  float spin = uTime * 0.002 * uSpinSign;
  float arms = 0.75 + 0.25 * sin(2.0 * (theta + spin) - 4.5 * log(max(r, 1e-3)));
  float n = texture2D(uAtlas, vUv * 3.0 + vec2(spin * 2.0, 0.0)).r;
  float hole = smoothstep(0.04, 0.12, r);
  float fade = smoothstep(1.0, 0.55, r);
  vec3 ramp = mix(uRampIn, uRampOut, smoothstep(0.15, 1.0, r));
  float nearFade = smoothstep(8.0, 20.0, vViewZ);
  gl_FragColor = vec4(ramp * arms * n * hole * fade * nearFade * uGain, 1.0);
}
`;

export const DOME_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Faint vertical gradient (radiance ~0.03-0.06) — gives the vignette and grain
 *  something to grip; kills the flat-void background tell. */
export const DOME_FRAG = /* glsl */ `
uniform vec3 uBottom;
uniform vec3 uTop;
varying vec3 vDir;

void main() {
  float ny = normalize(vDir).y;
  vec3 col = mix(uBottom, uTop, smoothstep(-0.4, 0.6, ny));
  gl_FragColor = vec4(col, 1.0);
}
`;
