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
#ifdef USE_FOG
  varying float vFogDepth;
#endif
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #ifdef USE_FOG
    vFogDepth = -mvPosition.z;
  #endif
}
`;

export const CORE_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogDensity;
  varying float vFogDepth;
#endif
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
  #ifdef USE_FOG
    float fogFactor = clamp(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0.0, 1.0);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
    gl_FragColor.a *= (1.0 - 0.85 * fogFactor);
  #endif
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
#ifdef USE_FOG
  varying float vFogDepth;
#endif
void main() {
  vColor = aColor;
  vOpacity = aOpacity;
  vUv = uv;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  #ifdef USE_FOG
    vFogDepth = -mv.z;
  #endif
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
#ifdef USE_FOG
  uniform float fogDensity;
  varying float vFogDepth;
#endif
void main() {
  float a = texture2D(uMap, vUv).a;
  float op = vOpacity;
  #ifdef USE_FOG
    // Additive glow: a distant star simply ADDS less light, so it fades into the dark.
    float fogFactor = clamp(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), 0.0, 1.0);
    op *= (1.0 - fogFactor);
  #endif
  gl_FragColor = vec4(vColor, a * op);
}
`;
