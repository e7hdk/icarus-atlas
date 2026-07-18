import Link from 'next/link';
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
export function CodexRegisters({
  residences,
  appearances,
}: {
  residences: { city: string; label: string }[];
  appearances: { id: string; title: string }[];
}) {
  const linkClass =
    'not-italic text-star-olympian/85 transition-colors hover:text-star-olympian hover:underline hover:underline-offset-2';
  return (
    <>
      {residences.length > 0 && (
        <>
          <MarqueeHeading>DWELT AT</MarqueeHeading>
          <p className="font-body text-[14.5px] italic leading-[1.8] text-aether-muted">
            {residences.map((residence, index) => (
              <span key={residence.city}>
                {index > 0 && ' · '}
                <Link href={`/city/${residence.city}`} className={linkClass}>
                  {residence.label}
                </Link>
              </span>
            ))}
          </p>
        </>
      )}
      {appearances.length > 0 && (
        <>
          <MarqueeHeading>APPEARS IN THE MYTHS</MarqueeHeading>
          <p className="font-body text-[14.5px] italic leading-[1.8] text-aether-muted">
            {appearances.map((story, index) => (
              <span key={story.id}>
                {index > 0 && ' · '}
                <Link href={`/story/${story.id}`} className={linkClass}>
                  {story.title}
                </Link>
              </span>
            ))}
          </p>
        </>
      )}
    </>
  );
}
