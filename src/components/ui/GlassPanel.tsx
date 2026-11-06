import type { ComponentProps } from "react";

/** Standard glass surface of the Aether Nebula theme.
 *  Use for cards, HUD panels and overlays so all chrome stays consistent.
 *  It takes a `ref` like the div it renders (React 19 passes it as a prop). */
export function GlassPanel({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-glass-border bg-glass backdrop-blur-xl ${className}`}
      {...props}
    />
  );
}
