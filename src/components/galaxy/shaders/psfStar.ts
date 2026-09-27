/** Point-spread character stars.
 *
 *  A star is drawn the way a camera sees one: not as a solid ball but as the
 *  optics' response to a point of light. One instanced camera-facing quad per
 *  star; the fragment sums
 *    · a tight gaussian core, authored in HDR so the roll-off burns it white,
 *    · a Moffat halo (alpha 1, beta 2) — the profile real star images have —
 *      that turns from that white into the type colour,
 *    · a broad exponential aura that carries the colour out into the dark,
 *    · four diffraction spikes, for the brightest stars and the one in focus,
 *    · the selection ring.
 *
 *  Sizes live in screen pixels. The PSF scale r follows perspective up to a
 *  knee and grows sub-linearly past it, so a star never swells into a disc that
 *  fills the screen; far off it holds a pixel floor and dims instead of
 *  shrinking below it, which is what keeps distant stars from shimmering.
 *  Output is linear HDR straight into the composer (additive, alpha unused). */

export const PSF_VERT = /* glsl */ `
attribute vec3 aColor;  // linear tint: TYPE_GLOW, or a Muse's travelling hue
attribute float aSize;  // the star's world radius (STAR_SIZE)
attribute vec4 aDyn;    // x: scale, y: radiance, z: spike gain, w: selection ring
uniform float uViewportHeight; // drawing-buffer height in device px
uniform float uPixelRatio;
varying vec3 vColor;
varying vec2 vP;        // offset from the centre, in units of r
varying float vRadiance;
varying float vWhite;
varying float vSpike;
varying float vRing;
varying float vRadiusPx;
varying float vExtent;

const float KNEE_PX = 6.0;       // below: r tracks perspective
const float GROWTH = 0.62;       // above: r grows as a power of it
const float FLOOR_CSS_PX = 1.15; // r never drops below this
const float FADE_POWER = 0.75;   // how fast a star dims once it sits on the floor
const float MIN_FADE = 0.28;     // the far side of the disc still reads
const float SPIKE_SATURATION_PX = 40.0;

void main() {
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float depth = max(-mv.z, 1e-3);
  float pxPerUnit = 0.5 * uViewportHeight * projectionMatrix[1][1] / depth;

  float r = aSize * pxPerUnit;
  if (r > KNEE_PX) r = KNEE_PX * pow(r / KNEE_PX, GROWTH);
  float floorPx = FLOOR_CSS_PX * uPixelRatio;
  float fade = 1.0;
  if (r < floorPx) {
    fade = max(pow(r / floorPx, FADE_POWER), MIN_FADE);
    r = floorPx;
  }
  r *= aDyn.x;

  vColor = aColor;
  vRadiance = aDyn.y * fade;
  // A faint star shows its colour; a bright one saturates to white.
  vWhite = 0.9 * smoothstep(0.35, 1.3, vRadiance);
  vSpike = aDyn.z;
  vRing = aDyn.w;
  vRadiusPx = r;
  // Spikes reach far on a small star and are reined in as it swells.
  vExtent = aDyn.z > 0.001 ? max(9.0, 15.0 / (1.0 + r / SPIKE_SATURATION_PX)) : 9.0;

  float halfSize = vExtent * r / pxPerUnit;
  mv.xy += position.xy * 2.0 * halfSize;
  vP = position.xy * 2.0 * vExtent;
  gl_Position = projectionMatrix * mv;
}
`;

export const PSF_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying vec2 vP;
varying float vRadiance;
varying float vWhite;
varying float vSpike;
varying float vRing;
varying float vRadiusPx;
varying float vExtent;

const float CORE = 5.0;
const float HALO = 2.4;
const float AURA = 0.22;
const float SPIKE = 1.1;
const float RING = 1.6;
const float RING_RADIUS = 3.4;
const float SPIKE_SATURATION_PX = 40.0;
// One telescope for the whole sky: every spike shares this 12 degree tilt.
const vec2 SPIKE_AXIS = vec2(0.9781476, 0.2079117);

void main() {
  float rho2 = dot(vP, vP);
  if (rho2 > vExtent * vExtent) discard;
  float rho = sqrt(rho2);

  float core = exp(-2.2 * rho2);
  float m = 1.0 + rho2;
  float halo = 1.0 / (m * m);
  float aura = exp(-0.6 * rho);

  vec3 tint = vColor;
  float peak = max(tint.r, max(tint.g, tint.b));
  vec3 deep = mix(tint, tint * tint / max(peak, 1e-3), 0.5);
  vec3 coreCol = mix(tint, vec3(1.0), vWhite);
  vec3 haloCol = mix(mix(tint, vec3(1.0), 0.6 * vWhite), tint, smoothstep(0.3, 1.6, rho));
  vec3 light = coreCol * (CORE * core) + haloCol * (HALO * halo) + deep * (AURA * aura);

  if (vSpike > 0.0) {
    vec2 q = abs(vec2(dot(vP, SPIKE_AXIS), dot(vP, vec2(-SPIKE_AXIS.y, SPIKE_AXIS.x))));
    // Never thinner than a pixel, or the spike crawls as the camera moves.
    float w = max(0.05, 0.8 / vRadiusPx);
    // A close star's spikes stay a sensible length on screen.
    vec2 u = q * (1.0 + vRadiusPx / SPIKE_SATURATION_PX);
    float spikes = exp(-(q.y * q.y) / (w * w)) * pow(1.0 + 0.3 * u.x * u.x, -1.05)
                 + exp(-(q.x * q.x) / (w * w)) * pow(1.0 + 0.3 * u.y * u.y, -1.05);
    vec3 spikeCol = mix(vec3(1.0), tint, smoothstep(0.8, 6.0, rho));
    light += spikeCol * (SPIKE * vSpike * spikes);
  }

  vec3 col = light * vRadiance;
  if (vRing > 0.0) {
    float wr = max(0.06, 1.0 / vRadiusPx);
    float d = (rho - RING_RADIUS) / wr;
    col += tint * (RING * vRing * exp(-d * d));
  }
  col *= smoothstep(vExtent, 0.7 * vExtent, rho);
  gl_FragColor = vec4(col, 1.0);
}
`;
