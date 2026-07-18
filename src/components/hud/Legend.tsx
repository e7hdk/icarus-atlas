import { CHARACTER_TYPES, TYPE_GLOW } from '@/types/character';

export function Legend() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-wrap justify-center gap-x-5 gap-y-1 bg-gradient-to-t from-cosmos-deep/90 to-transparent px-4 pb-3 pt-10">
      {CHARACTER_TYPES.map((type) => (
        <span
          key={type}
          className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.18em] text-aether-muted"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: TYPE_GLOW[type].color, boxShadow: `0 0 7px ${TYPE_GLOW[type].color}` }}
            aria-hidden
          />
          {type}
        </span>
      ))}
      <span className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.18em] text-aether-muted">
        <span
          aria-hidden
          className="w-5 border-t border-dashed border-nebula-soft/80"
          style={{ boxShadow: '0 0 6px rgba(192, 132, 252, 0.45)' }}
        />
        constellation of the week
      </span>
    </div>
  );
}
