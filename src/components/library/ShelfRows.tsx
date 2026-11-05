import type { ShelfSaga, ShelfWork } from './Shelf';

/** The Shelf on a phone (docs/LIBRARY_PLAN.md §5): it stands up, time running down
 *  the screen; each work a row with its spine, gilt as far as the atlas cites it,
 *  and its sagas as coloured knots; the empty shelf a gap with its label. */

const fmt = (n: number) => n.toLocaleString('en-US');

export function ShelfRows({ works, sagas, tellers }: { works: ShelfWork[]; sagas: ShelfSaga[]; tellers: { id: string; name: string; period: string; href: string }[] }) {
  const most = Math.max(1, ...works.map((work) => work.stats.words));
  return (
    <div>
      {tellers.map((teller) => (
        <div key={teller.id}>
          {teller.id === 'apollonius' && (
            <div className="mt-3.5 rounded border border-dashed border-white/15 px-4 py-4 text-center">
              <h4 className="font-display text-[10px] tracking-[0.3em] text-star-olympian/60">THE EMPTY SHELF</h4>
              <p className="mt-1.5 font-body text-[14px] italic leading-relaxed text-aether-faint">
                No teller of ours between Hesiod and Apollonius, about four centuries. The lyric poets and the tragedians reach the atlas only inside the later handbooks: Apollodorus gives Euripides&apos; versions by name (Bibl. 2.1.4, 3.6.8, 3.7.7, 3.9.2).
              </p>
            </div>
          )}
          <div className="relative border-l border-star-olympian/25 pb-1.5 pl-[18px] pt-3.5">
            <span className="absolute -left-[4px] top-[19px] h-[7px] w-[7px] rounded-full bg-star-olympian shadow-[0_0_8px_2px_rgba(252,211,77,0.5)]" />
            <a href={teller.href} className="font-display text-[11px] tracking-[0.24em] text-star-olympian/85">
              {teller.name.toUpperCase()}
              <span className="ml-2 font-body text-[13px] italic tracking-normal text-aether-faint">{teller.period}</span>
            </a>
            {works
              .filter((work) => work.teller === teller.id)
              .map((work) => (
                <a key={work.id} href={work.href} className="mt-3 block">
                  <span className="flex items-baseline justify-between gap-2.5">
                    <b className="font-display text-[15px] font-semibold tracking-[0.06em] text-aether">{work.title}</b>
                    <small className="whitespace-nowrap font-body text-[13px] italic text-aether-faint">
                      {work.stats.lines ? `${fmt(work.stats.lines)} lines` : `≈ ${fmt(Math.round(work.stats.words / 100) * 100)} words`} · ⚖ {work.stats.quarrels}
                    </small>
                  </span>
                  <span className="relative mt-1.5 block h-4 rounded-sm border border-star-olympian/35 bg-[linear-gradient(180deg,rgba(36,22,80,0.85),rgba(20,12,48,0.85))]" style={{ width: `${28 + 72 * Math.sqrt(work.stats.words / most)}%` }}>
                    <i className="absolute inset-y-0 left-0 border-r-2 border-star-olympian bg-gradient-to-r from-star-olympian/[0.08] to-star-olympian/30 shadow-[2px_0_8px_rgba(252,211,77,0.4)]" style={{ width: `${(work.stats.cited * 100).toFixed(0)}%` }} />
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-[5px]">
                    {sagas
                      .filter((saga) => work.stats.sagas[saga.id])
                      .map((saga) => {
                        const size = 5 + 1.1 * Math.sqrt(work.stats.sagas[saga.id] ?? 0);
                        return <i key={saga.id} title={saga.label} className="rounded-full" style={{ width: size, height: size, background: saga.color, boxShadow: `0 0 5px ${saga.color}` }} />;
                      })}
                  </span>
                </a>
              ))}
          </div>
        </div>
      ))}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 font-body text-[13px] italic text-aether-faint">
        {sagas.map((saga) => (
          <span key={saga.id} className="inline-flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: saga.color }} />
            {saga.label}
          </span>
        ))}
      </div>
    </div>
  );
}
