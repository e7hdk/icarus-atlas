import type { CharacterType } from "@/types/character";
import { TYPE_GLOW } from "@/types/character";

/** Pill badge showing a character type in its glow color.
 *  The single place where type → badge styling is defined. */
export function TypeBadge({ type }: { type: CharacterType }) {
  const { color } = TYPE_GLOW[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-0.5 font-display text-[11px] uppercase tracking-[0.18em]"
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}1a`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      {type}
    </span>
  );
}
