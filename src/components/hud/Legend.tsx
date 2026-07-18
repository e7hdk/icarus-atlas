import { CHARACTER_TYPES, TYPE_GLOW } from '@/types/character';

export function Legend() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-wrap justify-center gap-x-3 gap-y-0.5 bg-gradient-to-t from-cosmos-deep/90 to-transparent px-3 pb-2 pt-8 sm:gap-x-5 sm:gap-y-1 sm:px-4 sm:pb-3 sm:pt-10">
      {CHARACTER_TYPES.map((type) => (
        <span
          key={type}
          className="flex items-center gap-1.5 font-display text-[8px] uppercase tracking-[0.12em] text-aether-muted sm:gap-2 sm:text-[10px] sm:tracking-[0.18em]"
        >
          <span
            className="h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5"
            style={{ backgroundColor: TYPE_GLOW[type].color, boxShadow: `0 0 7px ${TYPE_GLOW[type].color}` }}
            aria-hidden
          />
          {type}
        </span>
      ))}
      <span className="flex items-center gap-1.5 font-display text-[8px] uppercase tracking-[0.12em] text-aether-muted sm:gap-2 sm:text-[10px] sm:tracking-[0.18em]">
        <span
          aria-hidden
          className="w-4 border-t border-dashed sm:w-5 border-nebula-soft/80"
          style={{ boxShadow: '0 0 6px rgba(192, 132, 252, 0.45)' }}
        />
        constellation of the week
      </span>
    </div>
  );
}
