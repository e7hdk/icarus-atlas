'use client';

import { useEffect } from 'react';
import type { EphemerisData } from '@/types/spotlight';
import {
  athensDayStamp,
  dayIndexOfIso,
  msUntilNextAthensMidnight,
} from '@/features/spotlight/calendar';
import { selectDay } from '@/features/spotlight/selection';
import { useEphemerisStore } from '@/features/spotlight/store';
import { EphemerisCard } from './EphemerisCard';
import { ConstellationCard } from './ConstellationCard';
import { OracleOverlay } from './OracleOverlay';
import { ProemOverlay } from './ProemOverlay';
import { RiddleOverlay } from './RiddleOverlay';

/** Client mount point of the Ephemeris: feeds the store, computes today's
 *  pick strictly after hydration (the server never renders "today"), and
 *  re-arms a timer so the star flips at the next Athens midnight without a
 *  reload. Mounted once in RootLayout, beside GlobalOverlays. */
export function EphemerisHost({ data }: { data: EphemerisData }) {
  const setData = useEphemerisStore((s) => s.setData);
  const setPick = useEphemerisStore((s) => s.setPick);

  useEffect(() => {
    setData(data);
  }, [data, setData]);

  useEffect(() => {
    // ?when=YYYY-MM-DD — the curator's time machine: pin the Ephemeris to any
    // date (it is deterministic anyway), e.g. /?when=2026-07-26 previews the
    // Kronia. No midnight timer while pinned; drop the param to return to now.
    const when = new URLSearchParams(window.location.search).get('when');
    if (when && /^\d{4}-\d{2}-\d{2}$/.test(when)) {
      setPick(selectDay(data, { isoDate: when, dayIndex: dayIndexOfIso(when) }));
      return;
    }
    let timer: number | undefined;
    const update = () => {
      const now = new Date();
      setPick(selectDay(data, athensDayStamp(now)));
      // Re-armed from a fresh clock every firing, so DST drift self-corrects.
      timer = window.setTimeout(update, msUntilNextAthensMidnight(now));
    };
    update();
    return () => window.clearTimeout(timer);
  }, [data, setPick]);

  return (
    <>
      <EphemerisCard />
      <ConstellationCard />
      <ProemOverlay />
      <OracleOverlay />
      <RiddleOverlay />
    </>
  );
}
