import type { HTMLAttributes } from "react";

/** Standard glass surface of the Aether Nebula theme.
 *  Use for cards, HUD panels and overlays so all chrome stays consistent. */
export function GlassPanel({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-glass-border bg-glass backdrop-blur-xl ${className}`}
      {...props}
    />
  );
}
