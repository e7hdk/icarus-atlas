'use client';

import { NebulaWisps } from './NebulaWisps';
import { DustLanes } from './DustLanes';

/** Volumetric nebula stack: additive wisps inside the cluster bands and
 *  subtractive dust lanes in the band gaps.
 *  Pure environment — nothing here is interactive or raycast. */
export function Nebula() {
  return (
    <group>
      <DustLanes />
      <NebulaWisps />
    </group>
  );
}
