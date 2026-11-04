import * as THREE from 'three';
import { TAU, gridGeometry, type Drum } from './drum';
import {
  BAND_VS,
  BEAM_FS,
  CLOTH_FS,
  CLOTH_VS,
  DOME_FS,
  DOME_VS,
  FLOOR_FS,
  FLOOR_VS,
  PLAIN_VS,
  SKY_FS,
  SKY_VS,
  STONE_FS,
  WARP_FS,
  WARP_VS,
  WEIGHT_FS,
} from './shaders';
import { SAGA_RGB, type ClothBands } from './textures';

/** The rotunda's fixed parts (docs/LOOM_PLAN.md §12): the cloth and its reflection,
 *  the loom's frame, the warp and its clay weights, the dome, the floor, the night. */

export interface Weight {
  saga: number;
  /** The weight's column, where its warp gathers. */
  x: number;
  lit: { value: number };
}

export interface Room {
  mirror: THREE.Mesh;
  weights: Weight[];
  dispose: () => void;
}

export function buildRoom(
  scene: THREE.Scene,
  drum: Drum,
  { bands, cellSaga }: ClothBands,
  clothUniforms: Record<string, THREE.IUniform>,
): Room {
  const { W, H, R, U } = drum;
  const owned: THREE.Object3D[] = [];
  const add = <T extends THREE.Object3D>(object: T, bent = true): T => {
    if (bent) object.frustumCulled = false;
    scene.add(object);
    owned.push(object);
    return object;
  };

  const clothGeometry = gridGeometry(0, 0, W, H, W * 4, 2);
  add(
    new THREE.Mesh(
      clothGeometry,
      new THREE.ShaderMaterial({ uniforms: clothUniforms, vertexShader: CLOTH_VS, fragmentShader: CLOTH_FS, side: THREE.DoubleSide }),
    ),
  );
  const mirror = add(
    new THREE.Mesh(
      clothGeometry,
      new THREE.ShaderMaterial({
        uniforms: clothUniforms,
        vertexShader: CLOTH_VS,
        fragmentShader: CLOTH_FS,
        side: THREE.DoubleSide,
        defines: { MIRROR: '' },
      }),
    ),
  );

  // The beam above, the attic band under the dome, the plinth down to the floor.
  const band = (y0: number, y1: number, x0: number, x1: number, lift: number, fragmentShader: string) =>
    add(
      new THREE.Mesh(
        gridGeometry(x0, y0, x1, y1, Math.round((x1 - x0) * 4), 1),
        new THREE.ShaderMaterial({
          uniforms: { ...U, uLift: { value: lift } },
          vertexShader: BAND_VS,
          fragmentShader,
          side: THREE.DoubleSide,
        }),
      ),
    );
  band(drum.BEAM[0], drum.BEAM[1], -1.5, W + 1.5, 0.02, BEAM_FS);
  band(drum.ATTIC, 0.02, 0, W, -0.08, STONE_FS);
  band(H, drum.FLOOR_ROW + 0.02, 0, W, -0.6, STONE_FS);

  // The warp: short threads from the beam into the cloth, and below it gathered on the weights.
  {
    const positions: number[] = [];
    const colors: number[] = [];
    const thread = (x0: number, y0: number, x1: number, y1: number, rgb: number[], k: number) => {
      positions.push(x0, y0, 0, x1, y1, 0);
      colors.push(...rgb.map((v) => v * k), ...rgb.map((v) => v * k));
    };
    for (let x = 0; x < W; x++) thread(x + 0.5, drum.BEAM[1], x + 0.5, 0.02, SAGA_RGB[cellSaga[x]], 0.55);
    for (const { saga, x0, x1 } of bands) {
      const centre = (x0 + x1) / 2;
      for (let x = x0; x < x1; x++) {
        thread(x + 0.5, H, centre + (x + 0.5 - centre) * 0.12, drum.WEIGHT_TOP + 0.25, SAGA_RGB[saga], 0.6);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
    add(
      new THREE.LineSegments(
        geometry,
        new THREE.ShaderMaterial({ uniforms: U, vertexShader: WARP_VS, fragmentShader: WARP_FS, transparent: true, depthWrite: false }),
      ),
    );
  }

  const weights = bands.map(({ saga, x0, x1 }): Weight => {
    const centre = (x0 + x1) / 2;
    const lit = { value: 1 };
    add(
      new THREE.Mesh(
        gridGeometry(centre - 0.6, drum.WEIGHT_TOP, centre + 0.6, drum.WEIGHT_TOP + 1.7, 2, 1),
        new THREE.ShaderMaterial({
          uniforms: { ...U, uLift: { value: -0.02 }, uSaga: { value: new THREE.Vector3(...SAGA_RGB[saga]) }, uLit: lit },
          vertexShader: PLAIN_VS,
          fragmentShader: WEIGHT_FS,
          side: THREE.DoubleSide,
        }),
      ),
    );
    return { saga, x: centre, lit };
  });

  // A coffered dome over the beam and a dark floor; both show only once the drum has closed.
  const dome = add(
    new THREE.Mesh(
      new THREE.SphereGeometry(R + 0.08, 128, 48, 0, TAU, 0, Math.PI / 2),
      new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.DoubleSide }),
    ),
    false,
  );
  dome.position.set(0, H / 2 - drum.ATTIC, R);

  const floorGeometry = new THREE.CircleGeometry(R * 6, 200);
  floorGeometry.rotateX(-Math.PI / 2);
  const floor = add(
    new THREE.Mesh(
      floorGeometry,
      new THREE.ShaderMaterial({ uniforms: U, vertexShader: FLOOR_VS, fragmentShader: FLOOR_FS, transparent: true, depthWrite: false }),
    ),
    false,
  );
  floor.position.set(0, drum.FLOOR_Y, R);
  floor.renderOrder = -1;

  // The night outside, and its stars.
  const sky = add(
    new THREE.Mesh(
      new THREE.SphereGeometry(2000, 48, 24),
      new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false }),
    ),
    false,
  );
  sky.renderOrder = -10;
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [count, size] of [
    [2600, 1.4],
    [420, 2.4],
  ]) {
    const positions: number[] = [];
    const colors: number[] = [];
    for (let i = 0; i < count; i++) {
      const y = random() * 2 - 1;
      const a = random() * TAU;
      const r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * 1800, y * 1800, Math.sin(a) * r * 1800);
      const glow = 0.25 + random() * random() * 0.75;
      colors.push(0.86 * glow, 0.89 * glow, glow);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const stars = add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false }),
      ),
      false,
    );
    stars.renderOrder = -9;
  }

  return {
    mirror,
    weights,
    dispose: () => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      for (const object of owned) {
        scene.remove(object);
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          materials.add(object.material as THREE.Material);
        }
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
