'use client';

import { useRouter } from 'next/navigation';
import { dedicationOf } from '@/features/galaxy/dedication';
import { useGalaxyStore } from '@/features/galaxy/store';

/** The words at the foot of a dedicated star's panel that lead to its door;
 *  nothing for any other star. From the galaxy the way in is through the star
 *  itself (`dive`): the camera goes into its light, and the door's page opens
 *  out of that same light. */
export function DedicationWhisper({ id, dive = false, className = '' }: { id: string; dive?: boolean; className?: string }) {
  const router = useRouter();
  const dedication = dedicationOf(id);
  const door = dedication?.door;
  if (!dedication || !door) return null;

  const enter = () => {
    if (!dive) {
      router.push(door.route);
      return;
    }
    // As "Step into the star" does: the dive first, then the page.
    useGalaxyStore.getState().setDiving(true);
    window.setTimeout(() => router.push(door.route), 600);
  };

  return (
    <button
      type="button"
      onClick={enter}
      className={`mx-auto flex items-center gap-3 font-body text-[16px] italic opacity-85 transition-opacity hover:opacity-100 ${className}`}
      style={{ color: dedication.color }}
    >
      <span className="h-px w-7" style={{ background: `linear-gradient(to right, transparent, ${dedication.from}bb)` }} aria-hidden />
      <span style={{ textShadow: `0 0 12px ${dedication.color}66` }}>{door.whisper}</span>
      <span className="h-px w-7" style={{ background: `linear-gradient(to left, transparent, ${dedication.to}bb)` }} aria-hidden />
    </button>
  );
}
