/** Instanced character-star shaders. Both output LINEAR colour straight into the
 *  EffectComposer's HDR target (exactly like StarField's points shader), so the
 *  result is byte-identical to the previous per-star MeshBasicMaterial(core) +
 *  SpriteMaterial(glow) path — only the draw structure changes (521 meshes → 2
 *  instanced draws). Per-instance attributes are driven by the single StarsDriver
 *  loop. */

/** Core: a unit sphere placed + uniformly scaled by instanceMatrix, tinted and
 *  alpha'd per instance. Matches MeshBasicMaterial{toneMapped:false, transparent}. */
export const CORE_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aAlpha;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

export const CORE_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

/** Glow: a camera-facing billboard quad (view-space offset, like BILLBOARD_VERT)
 *  at the instance position, sized by aScale, sampling the shared radial halo
 *  texture. Additive (SrcAlpha, One): contributes aColor × tex.a × aOpacity —
 *  identical to the old SpriteMaterial{map, color, opacity, AdditiveBlending}. */
export const GLOW_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aScale;
attribute float aOpacity;
varying vec3 vColor;
varying float vOpacity;
varying vec2 vUv;
void main() {
  vColor = aColor;
  vOpacity = aOpacity;
  vUv = uv;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * aScale;
  gl_Position = projectionMatrix * mv;
}
`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
varying vec3 vColor;
varying float vOpacity;
varying vec2 vUv;
void main() {
  float a = texture2D(uMap, vUv).a;
  gl_FragColor = vec4(vColor, a * vOpacity);
}
`;
