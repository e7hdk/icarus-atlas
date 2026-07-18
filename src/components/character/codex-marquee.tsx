'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Character } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { TypeBadge } from '@/components/ui/TypeBadge';
import { KindBadge } from '@/components/ui/KindBadge';

/** Shared pieces of the character codex marquee — the gold programme card
 *  that fronts every tab of the codex (Poets, Information, Legacy). The
 *  Poets tab adds the lens, passages and bonds; the other tabs add a live
 *  contents index. All of it composes from these bits. */

/** The gold double-framed card. */
export function MarqueeCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-star-olympian/30 bg-cosmos-raised/40 p-[7px] shadow-[0_22px_60px_rgba(5,2,15,.5)] backdrop-blur-xl">
      <div className="border border-star-olympian/15 px-6 py-7">{children}</div>
    </div>
  );
}

export function MarqueeHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-5 font-display text-[10px] tracking-[0.32em] text-aether-faint">
      {children}
    </h2>
  );
}

/** Small gold meander ornament between marquee sections. */
export function Meander() {
  return (
    <div className="mt-4 flex items-center gap-2.5 text-star-olympian/55" aria-hidden>
      <span className="h-px flex-1 bg-star-olympian/25" />
      <svg width="64" height="12" viewBox="0 0 64 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 11V1h10v7H8V4H5v7h18V1h10v7h-3V4h-3v7h18V1h10v7h-3V4h-3v7h11"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <span className="h-px flex-1 bg-star-olympian/25" />
    </div>
  );
}

/** Identity block: presents line, the name in its type glow, badges, domains. */
export function CodexIdentity({ character }: { character: Character }) {
  const glow = TYPE_GLOW[character.type].color;
  return (
    <>
      <p className="text-center font-display text-[9.5px] tracking-[0.44em] text-aether-faint">
        <span className="text-star-olympian/60">ICARUS ATLAS</span> · THE CODEX OF
      </p>
      <h1
        className="mt-3 text-center font-display text-[28px] leading-snug tracking-[0.15em] text-aether"
        style={{ textShadow: `0 0 14px ${glow}a6, 0 0 44px ${glow}4d` }}
      >
        {character.name.toUpperCase()}
      </h1>
      <p className="mt-1.5 text-center font-body text-[15.5px] italic text-aether-muted">
        {character.greekName}
        {character.romanName ? ` · Roman ${character.romanName}` : ''}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <TypeBadge type={character.type} />
        {character.kinds?.map((kind) => (
          <KindBadge key={kind} kind={kind} primaryType={character.type} />
        ))}
      </div>
      <p className="mt-2 text-center font-body text-[14.5px] italic text-aether-muted">
        {character.domains.join(' · ')}
      </p>
    </>
  );
}

/** The compact registers: dwellings and myth appearances as inline links. */
const REGISTER_LINK_CLASS =
  'not-italic text-star-olympian/85 transition-colors hover:text-star-olympian hover:underline hover:underline-offset-2';

/** Long registers clamp behind the house gold pill (Heracles dwells in a dozen
 *  cities; Odysseus appears in dozens of myths) — first N inline, the rest on
 *  demand, on every screen size. */
const REGISTER_CLAMP = 10;

function ClampedRegister({
  heading,
  items,
}: {
  heading: string;
  items: { key: string; href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const shown = open ? items : items.slice(0, REGISTER_CLAMP);
  const hidden = items.length - REGISTER_CLAMP;
  return (
    <>
      <MarqueeHeading>{heading}</MarqueeHeading>
      <p className="font-body text-[14.5px] italic leading-[1.8] text-aether-muted">
        {shown.map((item, index) => (
          <span key={item.key}>
            {index > 0 && ' · '}
            <Link href={item.href} className={REGISTER_LINK_CLASS}>
              {item.label}
            </Link>
          </span>
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="ml-2 rounded-full border border-star-olympian/35 bg-star-olympian/10 px-2.5 py-0.5 align-middle font-display text-[9px] not-italic tracking-[0.12em] text-star-olympian transition-colors hover:border-star-olympian/70 hover:bg-star-olympian/20"
          >
            {open ? 'SHOW LESS' : `+${hidden} MORE`}
          </button>
        )}
      </p>
    </>
  );
}

export function CodexRegisters({
  residences,
  appearances,
}: {
  residences: { city: string; label: string }[];
  appearances: { id: string; title: string }[];
}) {
  return (
    <>
      <ClampedRegister
        heading="DWELT AT"
        items={residences.map((residence) => ({
          key: residence.city,
          href: `/city/${residence.city}`,
          label: residence.label,
        }))}
      />
      <ClampedRegister
        heading="APPEARS IN THE MYTHS"
        items={appearances.map((story) => ({
          key: story.id,
          href: `/story/${story.id}`,
          label: story.title,
        }))}
      />
    </>
  );
}
