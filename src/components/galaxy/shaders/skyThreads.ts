import { PSF_RADIUS_GLSL } from './psfStar';
import { DISC_VEIL_GLSL } from './discVeil';

/** Constellation threads — one screen-space quad per segment, a fixed pixel
 *  width at any distance, with soft anti-aliased edges and an optional halo.
 *
 *  Each thread stops short of its two stars by a multiple of the star's own
 *  point-spread radius (the same curve psfStar draws it with), so every star
 *  sits in a small clearing, as on a printed atlas, and the thread tapers into
 *  the gap instead of stabbing the light. Where the galaxy's disc lies between
 *  the camera and a thread, the thread recedes: the disc of myth stands in
 *  front of the firmament. Additive, linear HDR out. */

export const SKY_THREAD_VERT = /* glsl */ `
attribute vec3 aEnd;   // position is the start of the segment
attribute vec2 aSize;  // world radius of the star at the start and at the end
attribute float aAt;   // 0 at the start, 1 at the end
attribute float aSide; // -1 or 1 across the thread
uniform vec2 uResolution; // drawing buffer, device px
uniform float uPixelRatio;
uniform float uWidth;     // core width, CSS px
uniform float uGlow;      // halo width, CSS px (0 = none)
varying float vAcross;
varying float vAlong;
varying float vLength;
varying vec3 vWorld;

${PSF_RADIUS_GLSL}

const float GAP = 2.6; // a star's clearing, in point-spread radii

void main() {
  vec4 viewA = modelViewMatrix * vec4(position, 1.0);
  vec4 viewB = modelViewMatrix * vec4(aEnd, 1.0);
  vec4 clipA = projectionMatrix * viewA;
  vec4 clipB = projectionMatrix * viewB;
  if (clipA.w <= 0.0 || clipB.w <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // behind the camera: drop the thread
    return;
  }
  vec2 halfRes = 0.5 * uResolution;
  vec2 screenA = clipA.xy / clipA.w * halfRes;
  vec2 screenB = clipB.xy / clipB.w * halfRes;
  vec2 delta = screenB - screenA;
  float len = length(delta);
  vec2 dir = len > 1e-4 ? delta / len : vec2(1.0, 0.0);

  float fadeA;
  float fadeB;
  float gapA = GAP * psfRadius(aSize.x, -viewA.z, uResolution.y, uPixelRatio, fadeA);
  float gapB = GAP * psfRadius(aSize.y, -viewB.z, uResolution.y, uPixelRatio, fadeB);
  float visible = max(len - gapA - gapB, 0.0);
  float along = gapA + aAt * visible;
  float reach = max(0.5 * uWidth, uGlow) * uPixelRatio + 1.0;

  vec2 screen = screenA + dir * along + vec2(-dir.y, dir.x) * aSide * reach;
  float depth = mix(clipA.z / clipA.w, clipB.z / clipB.w, aAt);
  gl_Position = vec4(screen / halfRes, depth, 1.0);

  vAcross = aSide * reach;
  vAlong = aAt * visible;
  vLength = visible;
  vec3 local = mix(position, aEnd, len > 1e-4 ? along / len : 0.0);
  vWorld = (modelMatrix * vec4(local, 1.0)).xyz;
}
`;

export const SKY_THREAD_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPixelRatio;
uniform float uWidth;
uniform float uGlow;
uniform float uGlowGain;
uniform float uDiscRadius; // world units; 0 = no disc to recede behind
uniform float uBehindDisc; // what is left of a thread seen through the disc
varying float vAcross;
varying float vAlong;
varying float vLength;
varying vec3 vWorld;

${DISC_VEIL_GLSL}
const float TAPER_CSS_PX = 7.0;

void main() {
  if (vLength <= 0.0) discard;
  float d = abs(vAcross);
  float halfWidth = 0.5 * uWidth * uPixelRatio;
  float core = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 1.0, d);
  float glow = 0.0;
  if (uGlow > 0.0) {
    float g = d / (0.5 * uGlow * uPixelRatio);
    glow = exp(-g * g) * uGlowGain;
  }
  float taper = TAPER_CSS_PX * uPixelRatio;
  float ends = smoothstep(0.0, taper, vAlong) * smoothstep(0.0, taper, vLength - vAlong);

  float disc = discVeil(vWorld, uDiscRadius, uBehindDisc);
  gl_FragColor = vec4(uColor * ((core + glow) * ends * disc * uOpacity), 1.0);
}
`;
