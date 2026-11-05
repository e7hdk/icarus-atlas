'use client';

import { useEffect, useState, useSyncExternalStore, type ComponentType } from 'react';
import { matchesMobileDevice, useIsMobile } from '@/lib/useIsMobile';
import { LoomView } from './LoomView';

/** A desktop asks for the room as soon as this module runs, before the page hydrates. */
const early = typeof window !== 'undefined' && !matchesMobileDevice() ? import('./RotundaView') : null;

/** Hydration renders nothing, as the server did; the store then reports the client at
 *  once, so the door is chosen on the next render. */
const reportOnce = (callback: () => void) => {
  queueMicrotask(callback);
  return () => {};
};

/** The Art door (docs/LOOM_PLAN.md §12): the rotunda where there is a mouse and room for
 *  it, the flat cloth on a phone. Chosen once the device is known, so neither one is
 *  mounted for nothing. The rotunda is imported here by hand rather than through
 *  next/dynamic, which would have every page preload it, phones included. */
export function LoomDoor() {
  const phone = useIsMobile();
  const known = useSyncExternalStore(
    reportOnce,
    () => true,
    () => false,
  );
  const [Rotunda, setRotunda] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (!known || phone) return;
    let live = true;
    (early ?? import('./RotundaView')).then(({ RotundaView }) => {
      if (live) setRotunda(() => RotundaView);
    });
    return () => {
      live = false;
    };
  }, [known, phone]);
  if (!known) return null;
  if (phone) return <LoomView />;
  return Rotunda ? <Rotunda /> : null;
}
