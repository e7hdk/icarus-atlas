import type { CharacterType, FigureKind } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';

/** Outline badge for a mythological sub-class (Dryad, Nereid, Centaur, …).
 *  Uses the primary type's glow colour at reduced opacity — kinds never get
 *  their own palette slot. */
export function KindBadge({ kind, primaryType }: { kind: FigureKind; primaryType: CharacterType }) {
  const { color } = TYPE_GLOW[primaryType];
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.14em]"
      style={{
        color: `${color}cc`,
        borderColor: `${color}44`,
        backgroundColor: `${color}0d`,
      }}
    >
      {label}
    </span>
  );
}
