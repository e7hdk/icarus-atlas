import { GlassPanel } from "@/components/ui/GlassPanel";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { CHARACTER_TYPES } from "@/types/character";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <h1 className="font-display text-4xl tracking-[0.45em] text-aether sm:text-5xl">
        ICARUS <span className="text-star-olympian">ATLAS</span>
      </h1>
      <p className="max-w-xl font-body text-2xl italic leading-relaxed text-aether-muted">
        An interactive galaxy of Greek mythology — every figure a star, every
        story with more than one teller.
      </p>
      <GlassPanel className="flex max-w-2xl flex-wrap items-center justify-center gap-3 px-8 py-6">
        {CHARACTER_TYPES.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </GlassPanel>
      <p className="font-body text-lg text-aether-faint">
        The core sky is under construction — Milestone 1.
      </p>
    </main>
  );
}
