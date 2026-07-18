import Link from 'next/link';

/** The city gates (city concept C, folded under the Dynasty Spine): three
 *  temple gates with meander lintels below the succession — HER SKY (a
 *  drifting starfield preview of the sky tab), MYTHS SET HERE (the tales
 *  whose places include this city) and ON THE MAP (the Lands pin). The
 *  lineage needs no gate: it is the page itself. */

function Lintel() {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3.5 text-star-olympian/50 transition-colors duration-300 group-hover:text-star-olympian/85">
      <span className="h-px flex-1 bg-current opacity-50" />
      <svg width="54" height="10" viewBox="0 0 64 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path
          d="M1 11V1h10v7H8V4H5v7h18V1h10v7h-3V4h-3v7h18V1h10v7h-3V4h-3v7h11"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <span className="h-px flex-1 bg-current opacity-50" />
    </div>
  );
}

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="group flex h-full flex-col border border-glass-border bg-cosmos-raised/40 backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-star-olympian/45 hover:shadow-[0_26px_60px_rgba(5,2,15,.55)]">
      {children}
    </div>
  );
}

function GateHead({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="px-4 pt-3 text-center font-display text-[13px] tracking-[0.32em] text-aether">
        {title}
      </h2>
      <p className="text-center font-body text-[14.5px] italic text-aether-faint">{sub}</p>
    </>
  );
}

export interface GateMyth {
  id: string;
  title: string;
  role?: string;
}

export function CityGates({
  cityId,
  residentCount,
  myths,
  regionLabel,
}: {
  cityId: string;
  residentCount: number;
  myths: GateMyth[];
  regionLabel?: string;
}) {
  return (
    <section className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {/* HER SKY */}
      <Link href={`/city/${cityId}/sky`} className="block">
        <GateFrame>
          <Lintel />
          <GateHead
            title="HER SKY"
            sub={
              residentCount > 0
                ? `a mini-galaxy of ${residentCount} dwellers`
                : 'a sky waiting for its stars'
            }
          />
          <div className="flex-1 px-5 pb-2 pt-4">
            <div className="gate-sky relative h-36 overflow-hidden rounded-xl motion-reduce:animate-none">
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cosmos-deep/85 to-transparent pb-2 pt-6 text-center font-body text-[13.5px] italic text-aether-muted">
                the sky drifts, waiting
              </span>
            </div>
          </div>
          <span className="px-5 pb-4 text-right font-display text-[11px] tracking-[0.2em] text-aether-faint transition-colors group-hover:text-star-olympian">
            ENTER THE SKY →
          </span>
        </GateFrame>
      </Link>

      {/* MYTHS SET HERE */}
      <GateFrame>
        <Lintel />
        <GateHead
          title="MYTHS SET HERE"
          sub={
            myths.length > 0
              ? `${myths.length === 1 ? 'one tale walks' : `${myths.length} tales walk`} these walls`
              : 'no tale is set here yet'
          }
        />
        <div className="flex-1 px-5 pb-2 pt-3">
          {myths.slice(0, 5).map((myth) => (
            <Link
              key={myth.id}
              href={`/story/${myth.id}`}
              className="group/row flex items-baseline py-1.5 font-body text-[15.5px] text-aether-muted transition-colors hover:text-aether"
            >
              <span className="font-display text-[13px] tracking-[0.06em] text-aether transition-colors group-hover/row:text-star-olympian">
                {myth.title}
              </span>
              <span className="mx-2.5 flex-1 -translate-y-[3px] border-b border-dotted border-aether/20" />
              <span className="shrink-0 font-body text-[13px] italic text-aether-faint">
                {myth.role ?? 'tale'}
              </span>
            </Link>
          ))}
          {myths.length > 5 && (
            <p className="pt-1 font-body text-[14px] italic text-aether-faint">
              … and {myths.length - 5} more
            </p>
          )}
        </div>
        <Link
          href="/stories"
          className="px-5 pb-4 text-right font-display text-[11px] tracking-[0.2em] text-aether-faint transition-colors hover:text-star-olympian"
        >
          THE SPINDLE OF MYTHS →
        </Link>
      </GateFrame>

      {/* ON THE MAP */}
      <Link href={`/areas#city=${cityId}`} className="block md:col-span-2 lg:col-span-1">
        <GateFrame>
          <Lintel />
          <GateHead title="ON THE MAP" sub={regionLabel ? `in ${regionLabel}` : 'among the lands'} />
          <div className="flex-1 px-5 pb-2 pt-4">
            <div className="relative h-36 overflow-hidden rounded-xl border border-glass-border/60">
              <svg viewBox="0 0 400 144" className="absolute inset-0 h-full w-full" aria-hidden>
                <path
                  d="M0 104 C 60 88, 104 116, 164 104 S 276 74, 336 92 S 386 110, 400 102"
                  fill="none"
                  stroke="rgba(0,229,255,.22)"
                  strokeWidth="1.4"
                />
                <path
                  d="M0 124 C 80 112, 140 132, 230 122 S 350 100, 400 116"
                  fill="none"
                  stroke="rgba(0,229,255,.1)"
                  strokeWidth="1"
                />
                <line x1="200" y1="0" x2="200" y2="52" stroke="rgba(252,211,77,.3)" strokeWidth="1" />
                <line x1="200" y1="92" x2="200" y2="144" stroke="rgba(252,211,77,.3)" strokeWidth="1" />
                <line x1="0" y1="72" x2="176" y2="72" stroke="rgba(252,211,77,.3)" strokeWidth="1" />
                <line x1="224" y1="72" x2="400" y2="72" stroke="rgba(252,211,77,.3)" strokeWidth="1" />
                <circle cx="200" cy="72" r="20" fill="none" stroke="rgba(252,211,77,.35)" strokeWidth="1" />
              </svg>
              <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-star-olympian shadow-[0_0_12px_4px_rgba(252,211,77,.65),0_0_36px_14px_rgba(252,211,77,.22)]" />
            </div>
          </div>
          <span className="px-5 pb-4 text-right font-display text-[11px] tracking-[0.2em] text-aether-faint transition-colors group-hover:text-star-olympian">
            OPEN THE MAP →
          </span>
        </GateFrame>
      </Link>
    </section>
  );
}
