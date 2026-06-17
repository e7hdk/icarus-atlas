import { create } from 'zustand';
import { DEFAULT_MAP_LAYERS, type MapLayerVisibility } from '@/features/geo/map-layers';

/** Fly-to target dispatched from ⌘K search while the Lands map is mounted. */
export type LandsMapTarget =
  | { kind: 'city'; id: string }
  | { kind: 'place'; id: string }
  | { kind: 'feature'; id: string };

interface LandsState {
  mapTarget: LandsMapTarget | null;
  setMapTarget: (target: LandsMapTarget | null) => void;
  mapLayers: MapLayerVisibility;
  setMapLayers: (layers: MapLayerVisibility) => void;
}

export const useLandsStore = create<LandsState>((set) => ({
  mapTarget: null,
  setMapTarget: (mapTarget) => set({ mapTarget }),
  mapLayers: { ...DEFAULT_MAP_LAYERS },
  setMapLayers: (mapLayers) => set({ mapLayers }),
}));
