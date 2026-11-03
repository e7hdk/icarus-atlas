import { Uniform } from 'three';
import { BlendFunction, Effect } from 'postprocessing';
import { wrapEffect } from '@react-three/postprocessing';

/** Highlight roll-off: the galaxy's tone mapping.
 *
 *  Below the knee the image passes through untouched, so every theme colour,
 *  nebula and line stays exactly as authored and TYPE_GLOW still matches the
 *  CSS tokens. Above it, HDR light is compressed smoothly toward 1 with the hue
 *  kept, and the brightest light drifts toward white — the way a camera
 *  saturates on a star's core. This is Khronos PBR Neutral without its toe:
 *  the toe's black offset would crush the faint sky this scene is made of,
 *  and AgX / ACES re-grade the whole palette. */
const FRAGMENT = /* glsl */ `
uniform float knee;
uniform float desaturation;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = inputColor.rgb;
  float peak = max(color.r, max(color.g, color.b));
  if (peak <= knee) {
    outputColor = inputColor;
    return;
  }
  float d = 1.0 - knee;
  float newPeak = 1.0 - d * d / (peak + d - knee);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  outputColor = vec4(mix(color, vec3(newPeak), g), inputColor.a);
}
`;

export class HighlightRolloffEffect extends Effect {
  constructor({ knee = 0.8, desaturation = 0.25 }: { knee?: number; desaturation?: number } = {}) {
    super('HighlightRolloffEffect', FRAGMENT, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map([
        ['knee', new Uniform(knee)],
        ['desaturation', new Uniform(desaturation)],
      ]),
    });
  }
}

export const HighlightRolloff = wrapEffect(HighlightRolloffEffect);
