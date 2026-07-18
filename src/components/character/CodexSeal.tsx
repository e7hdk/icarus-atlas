'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Character, LensId, Relation } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { RING_ORDER, ringsFor } from '@/features/characters/categories';

/** The codex seal: the figure's bonds as a miniature orrery riding the
 *  marquee card. One ring per relation category, stars in their type glow,
 *  disputed bonds outlined; hovering halts the heavens and names the star,
 *  clicking travels to that codex. On the Poets tab the seal additionally
 *  "follows the tale" — CharacterTheatre drives `data-follow` / `data-now`
 *  on the container imperatively (see the .orrery rules in globals.css). */

const SEAL_INNER = 39;
const SEAL_OUTER = 113;
const SEAL_SPIN_SECONDS = [85, 105, 130, 158, 190];

export function CodexSeal({
  characterId,
  glow,
  characters,
  relations,
  lens,
  hint,
  hotBond,
  onBodyHover,
  containerRef,
}: {
  characterId: string;
  /** The figure's own type color (the core star). */
  glow: string;
  characters: Pick<Character, 'id' | 'name' | 'type'>[];
  relations: Relation[];
  /** 'consensus' on the lens-independent tabs; the store lens on Poets. */
  lens: LensId;
  hint: string;
  /** Externally flared bond (hovered row on the Poets marquee). */
  hotBond?: string | null;
  /** Fires with the bond id under the cursor (prose lighting on Poets). */
  onBodyHover?: (id: string | null) => void;
  /** Exposes the container so the theatre can drive follow-the-tale. */
  containerRef?: React.Ref<HTMLDivElement>;
}) {
  const router = useRouter();
  const [tip, setTip] = useState<string | null>(null);

  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const rings = useMemo(() => ringsFor(characterId, relations, lens), [characterId, relations, lens]);
  const activeRings = RING_ORDER.filter((key) => rings[key].length > 0);

  const radiusFor = (index: number) =>
    activeRings.length === 1
      ? (SEAL_INNER + SEAL_OUTER) / 2
      : SEAL_INNER + ((SEAL_OUTER - SEAL_INNER) * index) / Math.max(activeRings.length - 1, 1);

  if (activeRings.length === 0) {
    return (
      <p className="mt-5 text-center font-body text-[14px] italic text-aether-faint">
        No bonds recorded under this telling.
      </p>
    );
  }

  return (
    <>
      <div ref={containerRef} data-follow="false" className="orrery relative mt-4 h-[238px]">
        <span
          className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap font-body text-[13.5px] italic text-nebula-soft transition-opacity duration-200"
          style={{ opacity: tip ? 1 : 0 }}
        >
          {tip ?? ' '}
        </span>
        {activeRings.map((key, index) => {
          const radius = radiusFor(index);
          return (
            <span
              key={`ring-${key}`}
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
              style={{
                width: radius * 2,
                height: radius * 2,
                borderStyle: index % 2 ? 'dashed' : 'solid',
              }}
            />
          );
        })}
        <span
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 15,
            height: 15,
            background: glow,
            boxShadow: `0 0 14px 5px ${glow}b3, 0 0 46px 18px ${glow}40`,
            animation: 'orrery-pulse 3.6s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {activeRings.map((key, index) => {
          const radius = radiusFor(index);
          const members = rings[key];
          return (
            <span
              key={`orbit-${key}-${lens}`}
              data-orrery-ring
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{
                animation: `${index % 2 ? 'orrery-spin-reverse' : 'orrery-spin'} ${SEAL_SPIN_SECONDS[index]}s linear infinite`,
              }}
            >
              {members.map((member, memberIndex) => {
                const other = byId.get(member.id);
                if (!other) return null;
                const color = TYPE_GLOW[other.type].color;
                const angle = (360 / members.length) * memberIndex + index * 31;
                const hot = hotBond === member.id;
                return (
                  <button
                    key={`${key}-${member.id}-${memberIndex}`}
                    type="button"
                    data-seal-body={member.id}
                    data-now="false"
                    aria-label={`${other.name} — ${member.role}`}
                    className="absolute h-2 w-2 cursor-pointer rounded-full transition-[box-shadow,opacity] duration-300"
                    style={{
                      background: color,
                      boxShadow: hot
                        ? `0 0 12px 4px ${color}, 0 0 32px 12px ${color}99`
                        : `0 0 6px 2px ${color}, 0 0 14px 5px ${color}4d`,
                      opacity: hot ? 1 : undefined,
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
                      outline: member.disputed ? '1.5px dashed rgba(192,132,252,.7)' : 'none',
                      outlineOffset: 2,
                    }}
                    onMouseEnter={() => {
                      setTip(
                        `${other.name} — ${member.role}${member.disputed ? ' · differs by teller' : ''}`,
                      );
                      onBodyHover?.(member.id);
                    }}
                    onMouseLeave={() => {
                      setTip(null);
                      onBodyHover?.(null);
                    }}
                    onClick={() => router.push(`/character/${other.id}`)}
                  />
                );
              })}
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-center font-body text-[12.5px] italic text-aether-faint">{hint}</p>
    </>
  );
}
