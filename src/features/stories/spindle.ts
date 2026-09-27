import type { LensId } from '@/types/character';
import type { Story } from '@/types/story';
import type { SagaId } from './sagas';

/** The Spindle of Time's scene contract: the shapes its stars, rig, labels and
 *  navigation read. The layout itself is the River of Myth's, spun onto the
 *  spindle by threadedSpindle.ts. */

export type Vec3 = [number, number, number];

/** A story's star on the spindle, on its saga's thread. */
export interface SpindleNode {
  id: string;
  title: string;
  greekTitle?: string;
  kind: Story['kind'];
  era: number;
  eraEnd: number;
  parentId: string | null;
  sagaId: SagaId;
  color: string;
  /** Star size — shelf roots largest, episodes smallest. */
  size: number;
  isSagaRoot: boolean;
  /** Where the star sits on its thread. */
  pos: Vec3;
  /** Sources attesting the summary — the lens gate. */
  sources: LensId[];
}

export interface SpindleAge {
  y: number;
  era: number;
  label: string;
}

export interface SpindleLayout {
  nodes: SpindleNode[];
  byId: Map<string, SpindleNode>;
  ages: SpindleAge[];
  minEra: number;
  maxEra: number;
  yTop: number;
  yBottom: number;
  radius: number;
}

/** A story is attested (bright) under lens L when its summary names that source. */
export function isStoryAttested(node: SpindleNode, lens: LensId): boolean {
  return lens === 'consensus' || node.sources.includes(lens);
}
