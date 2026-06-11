'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Character, Relation } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { RING_LABELS, RING_ORDER, ringsFor, type RingKey } from '@/features/characters/categories';
import { useGalaxyStore } from '@/features/galaxy/store';

const STAGE = 480;
const INNER_RADIUS = 56;
const OUTER_RADIUS = 214;
const SPIN_SECONDS = [38, 52, 68, 86, 104];

/** Bonds as a living orbit system: one ring per relation category.
 *  Names stay hidden until hover; ring chips reveal the full lists on click. */
export function RelationOrrery({
  character,
  characters,
  relations,
}: {
  character: Character;
  characters: Character[];
  relations: Relation[];
}) {
  const router = useRouter();
  const lens = useGalaxyStore((s) => s.lens);
  const [tip, setTip] = useState<string | null>(null);
  const [openRing, setOpenRing] = useState<RingKey | null>(null);

  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);
  const rings = useMemo(() => ringsFor(character.id, relations, lens), [character.id, relations, lens]);
  const activeRings = RING_ORDER.filter((key) => rings[key].length > 0);

  const radiusFor = (index: number) =>
    activeRings.length === 1
      ? (INNER_RADIUS + OUTER_RADIUS) / 2
      : INNER_RADIUS + ((OUTER_RADIUS - INNER_RADIUS) * index) / (activeRings.length - 1);

  const centerColor = TYPE_GLOW[character.type].color;

  return (
    <div>
      <div
        className="orrery relative mx-auto"
        style={{ width: STAGE, height: STAGE, maxWidth: '100%' }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap font-body text-base italic text-nebula-soft transition-opacity duration-200"
          style={{ opacity: tip ? 1 : 0 }}
        >
          {tip ?? ' '}
        </div>

        {activeRings.map((key, index) => {
          const radius = radiusFor(index);
          return (
            <div
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

        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 26,
            height: 26,
            background: centerColor,
            boxShadow: `0 0 18px 6px ${centerColor}, 0 0 58px 22px ${centerColor}55`,
            animation: 'orrery-pulse 3.4s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {activeRings.map((key, index) => {
          const radius = radiusFor(index);
          const members = rings[key];
          return (
            <div
              key={`orbit-${key}-${lens}`}
              data-orrery-ring
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{
                animation: `${index % 2 ? 'orrery-spin-reverse' : 'orrery-spin'} ${SPIN_SECONDS[index]}s linear infinite`,
              }}
            >
              {members.map((member, memberIndex) => {
                const other = byId.get(member.id);
                if (!other) return null;
                const color = TYPE_GLOW[other.type].color;
                const angle = (360 / members.length) * memberIndex + index * 31;
                return (
                  <button
                    key={`${key}-${member.id}-${memberIndex}`}
                    type="button"
                    aria-label={`${other.name} — ${member.role}`}
                    className="absolute h-3.5 w-3.5 cursor-pointer rounded-full transition-shadow"
                    style={{
                      background: color,
                      boxShadow: `0 0 9px 3px ${color}, 0 0 22px 8px ${color}55`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
                      outline: member.disputed ? '1.5px dashed rgba(192,132,252,.7)' : 'none',
                      outlineOffset: 3,
                    }}
                    onMouseEnter={() =>
                      setTip(`${other.name} — ${member.role}${member.disputed ? ' · differs by teller' : ''}`)
                    }
                    onMouseLeave={() => setTip(null)}
                    onClick={() => router.push(`/character/${other.id}`)}
                  />
                );
              })}
            </div>
          );
        })}

        {activeRings.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 mt-10 text-center font-body text-base italic text-aether-faint">
            No bonds recorded under this telling.
          </p>
        )}
      </div>

      <p className="mt-1 text-center font-body text-sm italic text-aether-faint">
        hover to halt the heavens · click a star to travel
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {activeRings.map((key) => (
          <button
            key={`chip-${key}`}
            type="button"
            onClick={() => setOpenRing(openRing === key ? null : key)}
            className={`rounded-full border px-4 py-1.5 font-display text-[11px] tracking-[0.12em] transition-colors ${
              openRing === key
                ? 'border-nebula-soft/50 bg-nebula-violet/20 text-[#e9d5ff]'
                : 'border-glass-border bg-glass text-aether-muted hover:text-aether'
            }`}
          >
            {RING_LABELS[key].toUpperCase()}{' '}
            <span className="font-semibold text-star-olympian">{rings[key].length}</span>
          </button>
        ))}
      </div>

      {openRing && (
        <div className="mx-auto mt-3 max-h-44 max-w-sm overflow-y-auto rounded-2xl border border-glass-border bg-cosmos-raised/80 px-4 py-3 backdrop-blur-xl">
          {rings[openRing].map((member, index) => {
            const other = byId.get(member.id);
            if (!other) return null;
            const color = TYPE_GLOW[other.type].color;
            return (
              <button
                key={`row-${member.id}-${index}`}
                type="button"
                onClick={() => router.push(`/character/${other.id}`)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 7px ${color}` }}
                />
                <span className="font-body text-[15px] text-aether/90">{other.name}</span>
                <span className="font-body text-sm italic text-aether-faint">{member.role}</span>
                {member.disputed && <span className="ml-auto text-nebula-soft">⚖</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
