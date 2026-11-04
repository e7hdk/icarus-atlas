import { BEND_GLSL } from './drum';

/** The rotunda's shaders (docs/LOOM_PLAN.md §12). Written as three's ShaderMaterial
 *  takes them; colours pass through untouched, as the door's cloth does. */

export const CLOTH_VS = /* glsl */ `${BEND_GLSL}
uniform float uFloor;
varying vec2 vG;
varying float vY;
void main() {
  vG = position.xy;
  vec3 p = bendAt(position.xy, 0.);
#ifdef MIRROR
  p.y = 2. * uFloor - p.y;
#endif
  vY = p.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

export const CLOTH_FS = /* glsl */ `
uniform sampler2D uTex, uCells, uCrack;
uniform vec2 uGrid;
uniform float uWeave, uTime, uFell, uFloor, uRoom;
varying vec2 vG;
varying float vY;
float luma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
void main() {
  if (vG.y > uFell) discard;
  vec2 uv = vG / uGrid;
  vec4 s = texture2D(uTex, uv);
  vec4 cell = texture2D(uCells, (floor(min(vG, uGrid - .001)) + .5) / uGrid);
  vec4 k = texture2D(uCrack, uv);
  bool front = gl_FrontFacing;
#ifdef MIRROR
  front = !front;
#endif
  float warp = .5 + .5 * sin(vG.x * 18.8496);
  vec3 c;
  if (k.g > .5) {
    // the gap of the tear: bare warp threads, and the night between them
    if (warp < .9) discard;
    c = cell.rgb * (.08 + .16 * warp) + vec3(.02, .015, .04);
  } else {
    if (s.a < .5) discard;
    if (!front) {
      // the reverse of a tapestry: the picture is only a rumour, the thread is the subject
      c = vec3(.034, .024, .07) + luma(s.rgb) * vec3(.05, .046, .08);
      c += cell.rgb * .032 * (.5 + .5 * sin(vG.x * 18.8496));
      c += vec3(1., .78, .36) * k.r * .9;
    } else {
      // from a distance whites turn to old wool; up close the painting is left as it is
      c = s.rgb;
      float L = luma(c);
      vec3 wool = mix(c, c * .74, smoothstep(.55, 1., L));
      wool = pow(max(wool, vec3(0.)), vec3(1.04));
      wool = mix(vec3(luma(wool)), wool, 1.42);
      wool *= vec3(1.06, .96, .82);
      c = mix(c, wool, uWeave);
      float anchor = mod(floor(cell.r * 255. + .5), 2.);
      float warpLine = smoothstep(.435, .5, abs(fract(vG.x) - .5)) * (1. - anchor);
      c = mix(c, cell.rgb * .92, warpLine * uWeave * .55);
      // dimmed tiles sink into the warp, they do not vanish
      float b = cell.a * 1.6;
      vec3 ghost = vec3(luma(c)) * vec3(.26, .24, .34);
      c = mix(ghost, c, smoothstep(.06, .92, b)) * max(1., b);
      if (k.g > .01) c = mix(c, cell.rgb * (.1 + .34 * warp * warp) + vec3(.012, .008, .03), k.g);
      c += vec3(1., .78, .36) * k.r * 1.25 * (.86 + .14 * sin(vG.x * .8 - uTime * .9));
    }
  }
  // the fell, the gold edge of the weaving, during the opening reveal
  c += vec3(1., .8, .4) * (1. - smoothstep(0., .5, uFell - vG.y));
#ifdef MIRROR
  c *= .24 * exp(-(uFloor - vY) / 10.) * uRoom;
#endif
  gl_FragColor = vec4(c, 1.);
}`;

/** A band of the loom's frame: the beam, the attic, the plinth. */
export const BAND_VS = /* glsl */ `${BEND_GLSL}
uniform float uLift;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 g = position.xy;
  g.x = mix(g.x, clamp(g.x, 0., uW), uBend);  // the beam's ends fold away as the drum closes
  gl_Position = projectionMatrix * modelViewMatrix * vec4(bendAt(g, uLift), 1.);
}`;

export const BEAM_FS = /* glsl */ `
varying vec2 vUv;
void main() {
  float s = 1. - pow(abs(vUv.y * 2. - 1.), 2.);
  vec3 gold = mix(vec3(.30, .20, .07), vec3(.99, .84, .44), pow(s, 1.6));
  gl_FragColor = vec4(gold + vec3(.25, .2, .1) * pow(s, 14.), 1.);
}`;

export const STONE_FS = /* glsl */ `
uniform float uRoom;
varying vec2 vUv;
void main() {
  if (uRoom < .01) discard;
  vec3 c = vec3(.05, .04, .075) * (.8 + .3 * vUv.y);
  c += vec3(.75, .58, .3) * smoothstep(.05, 0., abs(vUv.y - .03)) * .5;  // a gold cornice
  gl_FragColor = vec4(c * uRoom, 1.);
}`;

/** The warp: short threads from the beam into the cloth, and below it gathered on the weights. */
export const WARP_VS = /* glsl */ `${BEND_GLSL}
attribute vec3 aColor;
varying vec3 vC;
void main() { vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(bendAt(position.xy, -.02), 1.); }`;

export const WARP_FS = /* glsl */ `varying vec3 vC; void main() { gl_FragColor = vec4(vC, .6); }`;

export const PLAIN_VS = /* glsl */ `${BEND_GLSL}
uniform float uLift;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(bendAt(position.xy, uLift), 1.); }`;

export const WEIGHT_FS = /* glsl */ `
uniform vec3 uSaga;
uniform float uLit;
varying vec2 vUv;
void main() {
  vec2 p = vUv;
  float side = mix(.27, .5, p.y);                       // a pyramidal clay weight
  if (abs(p.x - .5) > side) discard;
  if (length((p - vec2(.5, .15)) * vec2(1., 1.4)) < .075) discard;  // the hole for the warp
  vec3 clay = mix(vec3(.45, .28, .18), vec3(.62, .40, .26), p.y) * (.8 + .32 * (1. - abs(p.x - .5) / side));
  clay = mix(clay, uSaga, smoothstep(.045, 0., abs(p.y - .64)) * .85);
  gl_FragColor = vec4(clay * (.45 + .55 * uLit) + uSaga * .18 * max(0., uLit - 1.), 1.);
}`;

/** A coffered dome over the beam, open at the oculus. */
export const DOME_VS = /* glsl */ `varying vec3 vN; void main() { vN = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export const DOME_FS = /* glsl */ `
uniform float uRoom;
varying vec3 vN;
void main() {
  if (uRoom < .01) discard;
  float e = asin(clamp(vN.y, 0., 1.)), a = atan(vN.x, vN.z);
  if (e > 1.33) discard;                                  // the oculus, open to the night
  vec3 c;
  if (gl_FrontFacing) {
    c = vec3(.06, .05, .09) * (.7 + .4 * vN.y) + vec3(.035, .03, .02) * smoothstep(.92, 1., abs(sin(a * 14.)));
  } else {
    c = vec3(.055, .045, .085) * (.75 + .55 * e);
    float ring = (e - .08) / 1.1;                          // five rings of twenty-eight coffers
    if (ring > 0. && ring < 1.) {
      float fe = fract(ring * 5.), fa = fract(a / 6.28318 * 28.), m = .16;
      float inner = step(m, fa) * step(fa, 1. - m) * step(m, fe) * step(fe, 1. - m);
      c *= mix(1.3, .55, inner);
      c += vec3(.07, .055, .035) * smoothstep(m + .12, m, fe) * inner;  // the lower lip catches the light
    }
    c += vec3(.95, .76, .42) * smoothstep(.022, 0., abs(e - 1.31));   // gold round the oculus
    c += vec3(.95, .76, .42) * smoothstep(.018, 0., e) * .7;           // and at the dome's foot
  }
  gl_FragColor = vec4(c * uRoom, 1.);
}`;

/** A dark floor of squares and roundels, as on the Pantheon's, that holds a reflection. */
export const FLOOR_VS = /* glsl */ `varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export const FLOOR_FS = /* glsl */ `
uniform float uRoom, uR;
varying vec2 vP;
void main() {
  if (uRoom < .01) discard;
  float r = length(vP), a = .8;
  vec3 c = vec3(.035, .028, .055);
  if (r < uR) {
    vec2 q = vP / (uR / 4.5), f = fract(q) - .5, id = floor(q);
    float shape = mod(id.x + id.y, 2.) > .5 ? step(length(f), .36) : step(max(abs(f.x), abs(f.y)), .36);
    c = mix(vec3(.04, .032, .06), vec3(.058, .046, .082), shape);
    c += vec3(.6, .47, .25) * smoothstep(.03, 0., abs(max(abs(f.x), abs(f.y)) - .5)) * .14;
    c += vec3(.08, .065, .045) * exp(-pow(r / (uR * .3), 2.));      // the light from the oculus
  } else {
    a *= 1. - smoothstep(uR * 1.5, uR * 5., r);
  }
  gl_FragColor = vec4(c * uRoom, a * uRoom);
}`;

/** The night outside. */
export const SKY_VS = /* glsl */ `varying vec3 vD; void main() { vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export const SKY_FS = /* glsl */ `
varying vec3 vD;
void main() {
  vec3 c = mix(vec3(.075, .045, .16), vec3(.02, .008, .06), smoothstep(0., .75, abs(vD.y)));
  c += vec3(.16, .09, .32) * exp(-pow((vD.x + .45) * 2.4, 2.) - pow(vD.y * 3., 2.)) * .35;
  gl_FragColor = vec4(c, 1.);
}`;

/** A finer image laid over the cloth, cut on the GPU to its tile. */
export const FINE_FS = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uCropOffset, uCropScale;
uniform float uOpacity, uBright;
varying vec2 vUv;
float luma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
void main() {
  vec3 c = texture2D(uTex, uCropOffset + vUv * uCropScale).rgb;
  vec3 ghost = vec3(luma(c)) * vec3(.26, .24, .34);
  c = mix(ghost, c, smoothstep(.06, .92, uBright)) * max(1., uBright);
  gl_FragColor = vec4(c, uOpacity);
}`;

/** A work lifted off the wall: the held one framed in double gold, a neighbour in a hairline. */
export const LIFT_VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

export const LIFT_FS = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uCropOffset, uCropScale, uSize;
uniform float uOpacity, uHeld, uHover;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, uCropOffset + vUv * uCropScale).rgb * (1. + uHover * .1);
  vec2 e = min(vUv, 1. - vUv) * uSize;
  float d = min(e.x, e.y);
  float frame = uHeld > .5 ? max(step(d, .03), step(.055, d) * step(d, .068)) : step(d, .022) * .7;
  c = mix(c, vec3(.99, .82, .40), frame);
  gl_FragColor = vec4(c, uOpacity);
}`;
