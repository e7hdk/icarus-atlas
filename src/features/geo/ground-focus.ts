/** Screen-centred map focus — the coordinate painted at the viewport midpoint. */

import { pickTopRegionAtPoint, ZOOM_SUBREGION, type RegionsMetaFile } from './region-drilldown';

/** The slice of the MapLibre map the sampler needs (kept structural so the
 *  module stays a pure import for tests and labels alike). */
export interface FocusableMap {
  getCanvas(): { clientWidth: number; clientHeight: number };
  unproject(point: [number, number]): { lng: number; lat: number };
}

/**
 * Do not use `map.getCenter()` here. With pitched terrain it is the camera's
 * geographic centre, not necessarily the ground currently painted at the
 * middle pixel. Converting the literal canvas midpoint keeps the focus tied to
 * what the user sees, regardless of pitch choreography or viewport size.
 */
export function screenCenterGround(map: FocusableMap): { lng: number; lat: number } {
  const canvas = map.getCanvas();
  const focus = map.unproject([canvas.clientWidth / 2, canvas.clientHeight / 2]);
  return { lng: focus.lng, lat: focus.lat };
}

/** Live top-level region under the viewport centre. Drilldown, city label
 *  gating and river visibility all share this single focus signal. */
export function liveGroundParent(
  map: FocusableMap,
  zoom: number,
  meta: RegionsMetaFile | null,
): string | null {
  if (!meta || zoom < ZOOM_SUBREGION) return null;
  const focus = screenCenterGround(map);
  return pickTopRegionAtPoint(focus.lng, focus.lat, meta);
}
