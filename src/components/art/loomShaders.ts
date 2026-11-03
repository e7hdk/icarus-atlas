/** The Loom's shaders, ported from mockups/art-loom-web.html. Colour passes through:
 *  no tone mapping, and the wool grade fades out before a work can be read. */

/** The hanging cloth: pinned at the beam, freer the further it falls. */
const DRAPE_GLSL = /* glsl */ `
uniform float uTime, uAmp;
uniform vec2 uGrid;
float wave(vec2 p, float t) {
  return sin(p.x * .17 + t * .46 + sin(p.y * .10 + t * .19) * 1.5) * .62
       + sin(p.x * .061 - t * .29 + p.y * .047) * 1.1
       + sin(p.y * .21 + t * .37 + p.x * .029) * .34;
}
float pin(float y) { float v = clamp(y / uGrid.y, 0., 1.5); return smoothstep(0., .34, v) * (.55 + v * .75); }
vec3 drape(vec2 p) {
  float k = pin(p.y) * uAmp;
  float sway = sin(uTime * .23) * .55 + sin(uTime * .11 + 1.3) * .35;
  return vec3(p.x + sway * k * .7, p.y + k * .12 * sin(p.x * .13 + uTime * .3), wave(p, uTime) * k);
}
`;

export const CLOTH_VERTEX = /* glsl */ `
precision highp float;
in vec3 position;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform vec3 uHover;
${DRAPE_GLSL}
out vec2 vG;
out vec3 vN;
void main() {
  vec2 p = position.xy;
  vec3 q = drape(p);
  float e = .35;
  vec3 dx = drape(p + vec2(e, 0.)) - q;
  vec3 dy = drape(p + vec2(0., e)) - q;
  vN = normalize(cross(dx, dy));
  if (p.y > 0. && p.y < uGrid.y) {
    vec2 d = p - uHover.xy;
    q.z += uHover.z * 1.5 * exp(-dot(d, d) / 7.);
  }
  vG = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q.x, -q.y, q.z, 1.);
}
`;

export const CLOTH_FRAGMENT = /* glsl */ `
precision highp float;
precision highp sampler2D;
uniform sampler2D uTex, uCells, uCrack;
uniform vec2 uGrid;
uniform float uWeave, uThreads, uTime, uFell;
in vec2 vG;
in vec3 vN;
out vec4 o;
float luma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
void main() {
  // the gold beam the warp hangs from
  if (vG.y < 0.) {
    float t = (vG.y + 1.28) / .46;
    if (t < 0. || t > 1.) discard;
    float s = 1. - pow(abs(t * 2. - 1.), 2.);
    if (min(vG.x + 1.5, uGrid.x + 1.5 - vG.x) < 0.) discard;
    vec3 gold = mix(vec3(.30, .20, .07), vec3(.99, .84, .44), pow(s, 1.6));
    o = vec4(gold + vec3(.25, .2, .1) * pow(s, 14.), 1.);
    return;
  }
  if (vG.x < 0. || vG.x > uGrid.x || vG.y > uGrid.y || vG.y > uFell) discard;
  vec2 uv = vG / uGrid;
  vec4 s = texture(uTex, uv);
  if (s.a < .5) discard;
  ivec2 id = ivec2(clamp(vG, vec2(0.), uGrid - 1.));
  vec4 cell = texelFetch(uCells, id, 0);
  float b = cell.a * 1.6;
  if (!gl_FrontFacing) {
    // the reverse of a tapestry: the picture is only a rumour, the thread is the subject
    vec3 back = vec3(.034, .024, .07) + luma(s.rgb) * vec3(.05, .046, .08);
    back += cell.rgb * .032 * (.5 + .5 * sin(vG.x * 6.2832 * 3.));
    back += vec3(1., .78, .36) * texture(uCrack, uv).r * .9;
    o = vec4(back, 1.);
    return;
  }

  // from a distance whites turn to old wool and shadows deepen; up close the
  // painting is left exactly as it is
  vec3 c = s.rgb;
  float L = luma(c);
  vec3 wool = mix(c, c * .74, smoothstep(.55, 1., L));
  wool = pow(max(wool, vec3(0.)), vec3(1.04));
  wool = mix(vec3(luma(wool)), wool, 1.42);
  wool *= vec3(1.06, .96, .82);
  c = mix(c, wool, uWeave);

  // the warp shows between the tiles, the weft ribs across them
  float anchor = mod(floor(cell.r * 255. + .5), 2.);
  float warpLine = smoothstep(.435, .5, abs(fract(vG.x) - .5)) * (1. - anchor);
  c = mix(c, cell.rgb * .92, warpLine * uWeave * .55);
  c *= 1. + uWeave * (.03 * sin(vG.y * 6.2832 * uThreads) + .018 * sin(vG.x * 6.2832 * uThreads));

  // light on the fold
  float l = dot(normalize(vN), normalize(vec3(-.42, .55, .72)));
  c *= mix(1., .66 + .56 * l, uWeave * .92);

  // dimmed tiles sink into the warp, they do not vanish
  vec3 ghost = vec3(luma(c)) * vec3(.26, .24, .34);
  c = mix(ghost, c, smoothstep(.06, .92, b)) * max(1., b);

  // the tear: bare warp in the gap, gold along the mend
  vec4 k = texture(uCrack, uv);
  if (k.g > .01) {
    float warp = .5 + .5 * sin(vG.x * 6.2832 * 3.);
    vec3 bare = cell.rgb * (.1 + .34 * warp * warp) + vec3(.012, .008, .03);
    c = mix(c, bare, k.g);
  }
  float shimmer = .86 + .14 * sin(vG.x * .8 - uTime * .9);
  c += vec3(1., .78, .36) * k.r * 1.25 * shimmer;

  // the fell, the gold edge of the weaving, during the opening reveal
  c += vec3(1., .8, .4) * (1. - smoothstep(0., .5, uFell - vG.y));
  o = vec4(c, 1.);
}
`;

export const WARP_VERTEX = /* glsl */ `
precision highp float;
in vec3 position; // x at the beam, x at the weight, t along the thread
in vec3 aColor;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float uTop, uBottom, uRows;
${DRAPE_GLSL}
out vec3 vC;
void main() {
  float y = mix(uTop, uBottom, position.z);
  float gather = smoothstep(uRows + .4, uBottom - .4, y);
  float x = mix(position.x, position.y, gather * gather * (3. - 2. * gather));
  vec3 q = drape(vec2(x, y));
  float rest = 1. - smoothstep(uRows + 3., uBottom - .2, y);
  q.xy = mix(vec2(x, y), q.xy, rest);
  q.z *= rest;
  vC = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q.x, -q.y, q.z - .02, 1.);
}
`;

export const WARP_FRAGMENT = /* glsl */ `
precision highp float;
in vec3 vC;
uniform float uAlpha;
out vec4 o;
void main() { o = vec4(vC * 1.3, uAlpha); }
`;

/** A stitch: one ribbon arcing out of the cloth between two works of a thread, its
 *  ends following the works when they are lifted. Instanced, one per stitch. */
export const STITCH_VERTEX = /* glsl */ `
precision highp float;
precision highp sampler2D;
in vec3 position; // t along the stitch, side of the ribbon
in vec4 aEnds;    // the two works' cells
in vec4 aIds;     // work a, work b, thread, place along the thread
in vec4 aColor;   // saga colour, seed
uniform mat4 modelViewMatrix, projectionMatrix;
uniform vec3 uEye;
uniform sampler2D uLift, uState;
uniform float uPx, uFace;
${DRAPE_GLSL}
out vec3 vC;
out float vA;
out float vS;
vec3 at(float t, vec2 a, vec2 b, float za, float zb, float h) {
  float e = t * t * (3. - 2. * t);
  vec3 q = drape(vec2(mix(a.x, b.x, e), mix(a.y, b.y, t)));
  return vec3(q.x, -q.y, q.z + (mix(za, zb, t) + sin(t * 3.14159265) * h) * uFace);
}
void main() {
  vec4 la = texelFetch(uLift, ivec2(int(aIds.x), 0), 0);
  vec4 lb = texelFetch(uLift, ivec2(int(aIds.y), 0), 0);
  vec4 st = texelFetch(uState, ivec2(int(aIds.z), 0), 0);
  vec2 a = aEnds.xy + la.xy, b = aEnds.zw + lb.xy;
  float h = (.9 + min(length(b - a), 34.) * .3) * (.7 + .6 * aColor.a);
  vec3 p = at(position.x, a, b, la.z, lb.z, h);
  vec3 n = at(position.x + .015, a, b, la.z, lb.z, h);
  vec3 side = normalize(cross(n - p, uEye - p));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p + side * position.y * st.g * 3.2 * uPx, 1.);
  // a thread is brightest at the work it is held by and dies away along its length
  float reach = st.a * 255.;
  float fade = reach > 254. ? 1. : clamp(1.25 - abs(aIds.w + .5 - st.b * 255.) / reach, 0., 1.);
  vC = aColor.rgb;
  vA = st.r * fade;
  vS = position.y;
}
`;

export const STITCH_FRAGMENT = /* glsl */ `
precision highp float;
in vec3 vC;
in float vA;
in float vS;
out vec4 o;
void main() {
  // Alpha stays out of it: the light adds onto whatever is below, the sky included.
  o = vec4(vC * (1. - smoothstep(.25, 1., abs(vS))) * vA * 1.25, 0.);
}
`;
