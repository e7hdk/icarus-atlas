'use client';

import { useEffect } from 'react';
import type { EphemerisData } from '@/types/spotlight';
import { ATLAS_FILES } from '@/features/atlas/files';
import { useAtlasFile } from '@/features/atlas/useAtlasFile';
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

/** Client mount point of the Ephemeris: fetches the static data RootLayout
 *  preloads, computes today's pick strictly after hydration (the server never
 *  renders "today"), and re-arms a timer so the star flips at the next Athens
 *  midnight without a reload. Mounted once in RootLayout, beside GlobalOverlays.
 *  If the fetch fails the chip stays a skeleton and the rest of the page is
 *  untouched. */
export function EphemerisHost() {
  const { data } = useAtlasFile<EphemerisData>(ATLAS_FILES.ephemeris);
  const setData = useEphemerisStore((s) => s.setData);
  const setPick = useEphemerisStore((s) => s.setPick);

  useEffect(() => {
    if (data) setData(data);
  }, [data, setData]);

  useEffect(() => {
    if (!data) return;
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
