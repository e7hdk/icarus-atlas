/** Background starfield points: per-star blackbody color, subtle twinkle,
 *  soft gaussian falloff, clamped point size (dive-safe). */
export const POINTS_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = aColor * (0.82 + 0.18 * sin(uTime * aSpeed + aPhase));
  gl_PointSize = clamp(aSize * uPixelRatio * (160.0 / -mv.z), 1.0, 16.0 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;

export const POINTS_FRAG = /* glsl */ `
varying vec3 vColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(p, p);
  if (d2 > 1.0) discard;
  gl_FragColor = vec4(vColor * exp(-d2 * 4.5), 1.0);
}
`;
