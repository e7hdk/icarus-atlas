/** The disc of myth stands in front of the firmament: where the galaxy's disc
 *  (the plane y = 0 out to its radius) lies between the camera and a point of
 *  the sky, that point keeps only `behindDisc` of its light. Shared by the sky's
 *  threads (per fragment) and its stars (per star). */
export const DISC_VEIL_GLSL = /* glsl */ `
float discVeil(vec3 world, float discRadius, float behindDisc) {
  if (discRadius <= 0.0) return 1.0;
  vec3 ray = world - cameraPosition;
  if (abs(ray.y) < 1e-4) return 1.0;
  float t = -cameraPosition.y / ray.y;
  if (t <= 0.0 || t >= 1.0) return 1.0;
  float r = length((cameraPosition + ray * t).xz);
  return mix(behindDisc, 1.0, smoothstep(discRadius * 0.8, discRadius * 1.25, r));
}
`;
