import type { CharacterType } from "@/types/character";
import { TYPE_GLOW } from "@/types/character";
import { dedicationOf } from "@/features/galaxy/dedication";

/** Pill badge showing a character type in its glow color.
 *  The single place where type → badge styling is defined. A dedicated star
 *  (src/features/galaxy/dedication.ts) shows its dedication's label instead,
 *  written in the two colours its light drifts between. */
export function TypeBadge({ type, id }: { type: CharacterType; id?: string }) {
  const gift = id ? dedicationOf(id) : undefined;
  const color = gift?.color ?? TYPE_GLOW[type].color;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-0.5 font-display text-[11px] uppercase tracking-[0.18em]"
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}1a`,
        boxShadow: gift ? `0 0 14px ${color}33` : undefined,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: gift ? `linear-gradient(135deg, ${gift.from}, ${gift.to})` : color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {gift ? (
        <span
          style={{
            backgroundImage: `linear-gradient(90deg, ${gift.from}, ${gift.to})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {gift.label}
        </span>
      ) : (
        type
      )}
    </span>
  );
}

/** The line of dedication under a dedicated star's badges; nothing for any other star. */
export function DedicationLine({ id, className }: { id: string; className?: string }) {
  const gift = dedicationOf(id);
  if (!gift) return null;
  return (
    <p
      className={`font-body text-[15px] italic tracking-[0.04em] ${className ?? ""}`}
      style={{ color: gift.color, textShadow: `0 0 10px ${gift.color}55` }}
    >
      {gift.line}
    </p>
  );
}
