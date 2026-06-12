/** HDR shader-quad character star: gaussian hot core, chromatic dual-slope halo,
 *  4-point diffraction spikes, in-shader selection ring.
 *  All 45 materials share this source → one compiled program.
 *
 *  HDR authoring contract (bloom luminanceThreshold = 1.0 is the selector):
 *  core 10/14/16 (dive → 96) blooms; halo peaks ~1.3; spikes ~1.6 near core. */
export const STAR_VERT = /* glsl */ `
uniform float uScale;    // world half-extent of the quad
uniform float uSpikeRot; // global telescope orientation + tiny per-star jitter
varying vec2 vP;         // -1..1 across the quad, rotated into spike space

void main() {
  float c = cos(uSpikeRot), s = sin(uSpikeRot);
  vP = mat2(c, -s, s, c) * (position.xy * 2.0);
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); // view-space billboard
  mv.xy += position.xy * uScale * 2.0;
  gl_Position = projectionMatrix * mv;
}
`;

export const STAR_FRAG = /* glsl */ `
precision highp float;
uniform vec3  uTint;   // TYPE_GLOW color (linear)
uniform float uCore;   // HDR core radiance
uniform float uHalo;   // halo gain
uniform float uSpike;  // spike gain (0 when lens-dimmed)
uniform float uRing;   // selection ring 0..1
uniform float uTime;
uniform float uSeed;
varying vec2 vP;

void main() {
  float d = length(vP);
  float core = exp(-d * d * 42.0);

  // White-hot center -> tint -> over-saturated rim (astrophoto chromatic falloff).
  float haloP = exp(-d * 2.6) * 0.55 + pow(max(0.0, 1.0 - d), 2.2) * 0.25;
  vec3 haloCol = mix(vec3(1.0), uTint, smoothstep(0.04, 0.35, d));
  haloCol = mix(haloCol, uTint * uTint * 1.6, smoothstep(0.35, 0.95, d));

  vec2 a = abs(vP);
  float sp = exp(-pow(a.y * 22.0, 1.6)) * exp(-a.x * 2.2)
           + exp(-pow(a.x * 22.0, 1.6)) * exp(-a.y * 2.4);

  float ring = (1.0 - smoothstep(0.008, 0.018, abs(d - 0.32))) * uRing;
  float tw = 0.95 + 0.05 * sin(uTime * 1.9 + uSeed * 41.0);

  vec3 col = mix(uTint, vec3(1.0), 0.78) * core * uCore
           + haloCol * haloP * uHalo
           + mix(uTint, vec3(1.0), 0.5) * sp * uSpike * uCore * 0.16
           + uTint * ring * 2.5;
  col *= tw * (1.0 - smoothstep(0.88, 1.0, d)); // kill the quad edge
  gl_FragColor = vec4(col, 1.0);                // additive: alpha unused
}
`;
