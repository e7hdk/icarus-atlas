'use client';

import dynamic from 'next/dynamic';

/** MapLibre touches WebGL/window — never SSR. */
export const MapView = dynamic(
  () => import('./MapLibreView').then((m) => m.MapLibreView),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-body text-sm italic text-aether-muted">Charting the basin…</p>
      </div>
    ),
  },
);
