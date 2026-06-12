/** Tileable periodic value noise / fBm / ridged chunk.
 *  Bake-time only — never runs in the per-frame hot path.
 *  Periodic lattice (mod(i, period)) with integer base frequencies and
 *  per-octave constant offsets (rotation would break periodicity), so the
 *  baked atlas tiles seamlessly under plain RepeatWrapping. */
export const NOISE_GLSL = /* glsl */ `
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float vnoiseT(vec2 p, float period) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(mod(i, period));
  float b = hash21(mod(i + vec2(1.0, 0.0), period));
  float c = hash21(mod(i + vec2(0.0, 1.0), period));
  float d = hash21(mod(i + vec2(1.0, 1.0), period));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbmT(vec2 p, float period) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoiseT(p + vec2(float(i) * 7.31, float(i) * 3.17), period);
    p *= 2.0; period *= 2.0; a *= 0.5;
  }
  return v;
}

float ridgedT(vec2 p, float period) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * (1.0 - abs(2.0 * vnoiseT(p + vec2(float(i) * 11.7, float(i) * 5.3), period) - 1.0));
    p *= 2.0; period *= 2.0; a *= 0.5;
  }
  return v;
}
`;
