import * as THREE from 'three';
import { NOISE_GLSL } from './shaders/noise';
import { ATLAS_BAKE_VERT, ATLAS_BAKE_FRAG } from './shaders/nebula';

/** Lazy module-singleton GPU bake of the 1024² 4-channel noise atlas.
 *  Idempotent per renderer (WeakMap cache) so React StrictMode double-invocation
 *  never double-bakes or leaks a render target. One-time cost ~2-4ms GPU.
 *  The render target lives for the renderer's lifetime — its texture IS the atlas. */
const cache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

export function getNebulaAtlas(gl: THREE.WebGLRenderer): THREE.Texture {
  const hit = cache.get(gl);
  if (hit) return hit;

  const rt = new THREE.WebGLRenderTarget(1024, 1024, { depthBuffer: false });
  rt.texture.wrapS = rt.texture.wrapT = THREE.RepeatWrapping; // bake is tileable
  rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  rt.texture.generateMipmaps = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: ATLAS_BAKE_VERT,
    fragmentShader: NOISE_GLSL + ATLAS_BAKE_FRAG,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const prev = gl.getRenderTarget();
  gl.setRenderTarget(rt);
  gl.render(scene, camera);
  gl.setRenderTarget(prev);

  quad.geometry.dispose();
  material.dispose();

  cache.set(gl, rt.texture);
  return rt.texture;
}
