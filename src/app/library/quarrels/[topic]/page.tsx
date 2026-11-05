import { notFound } from 'next/navigation';
import { Link } from '@/components/ui/Link';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { loadAtlasData } from '@/features/characters/load';
import { QUARRELS, claimReading, claimsInTime, findQuarrel, tellersOf, type ClaimPassage } from '@/features/library/quarrels';
import { TYPE_GLOW, type Character } from '@/types/character';

/** A quarrel of the Library (docs/LIBRARY_PLAN.md §7): its claims side by side in
 *  their tellers' order of composition, each under its passage in the original
 *  and in English, so the quarrel is read in the sources' own words. */
export const dynamicParams = false;

export function generateStaticParams() {
  return QUARRELS.map((quarrel) => ({ topic: quarrel.topic }));
}

type Params = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Params) {
  const { topic } = await params;
  const quarrel = findQuarrel(topic);
  if (!quarrel) return { title: 'The Quarrels — Icarus Atlas' };
  const { sources } = await loadAtlasData();
  const names = tellersOf(quarrel).map((id) => sources.find((source) => source.id === id)?.name ?? id);
  const description = `${names.join(', ')}: ${quarrel.claims.length} claim${quarrel.claims.length === 1 ? '' : 's'}, each in the teller's own words, the original beside the English.`;
  return {
    title: `${quarrel.title} — The Quarrels — Icarus Atlas`,
    description,
    openGraph: { siteName: 'Icarus Atlas', type: 'article', title: `${quarrel.title} — The Quarrels`, description },
  };
}

/** A catalogue note, its `ids` read as the names of their figures. */
function NoteText({ text, byId }: { text: string; byId: Map<string, Character> }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, index) => {
        if (index % 2 === 0) return part;
        const figure = byId.get(part);
        if (!figure) return part;
        return (
          <Link key={index} href={`/character/${figure.id}`} className="hover:underline" style={{ color: TYPE_GLOW[figure.type].color }}>
            {figure.name}
          </Link>
        );
      })}
    </>
  );
}

function Passage({ passage }: { passage: ClaimPassage }) {
  return (
    <figure>
      <figcaption className="font-display text-[9px] tracking-[0.24em] text-aether-faint">
        <Link href={passage.link.href} className="transition-colors hover:text-star-olympian">
          {passage.link.label.toUpperCase()} →
        </Link>
      </figcaption>
      {passage.lines.length > 0 && (
        <div lang={passage.lang} className={`mt-2 ${passage.lang === 'grc' ? 'font-greek' : 'font-body italic'} text-[16px] leading-[1.6] text-aether/90`}>
          {passage.lines.map(([n, line], index) => (
            <div key={n} className="grid grid-cols-[2.2rem_1fr]">
              <i aria-hidden className="pt-[3px] text-right font-body text-[11px] not-italic text-aether-faint/80 pr-2.5">
                {index === 0 || Number.parseInt(n, 10) % 5 === 0 ? n : ''}
              </i>
              <span className="pl-4 -indent-4">{line}</span>
            </div>
          ))}
          {passage.more && <p className="pl-[2.2rem] font-body text-[13px] not-italic text-aether-faint">…</p>}
        </div>
      )}
      {passage.prose.length > 0 && (
        <div lang={passage.lang} className={`mt-2 line-clamp-[8] ${passage.lang === 'grc' ? 'font-greek' : 'font-body italic'} text-[15.5px] leading-[1.6] text-aether/85`}>
          {passage.prose.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {passage.english.length > 0 && (
        <div className="mt-3 line-clamp-[9] border-l border-star-olympian/25 pl-3 font-body text-[15.5px] leading-[1.6] text-aether-muted">
          {passage.english.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {passage.out && (
        <a href={passage.out} target="_blank" rel="noreferrer" className="mt-2 inline-block font-display text-[9px] tracking-[0.2em] text-star-olympian/80 hover:text-star-olympian">
          READ THE ENGLISH AT TOPOSTEXT ↗
        </a>
      )}
    </figure>
  );
}

export default async function QuarrelPage({ params }: Params) {
  const { topic } = await params;
  const quarrel = findQuarrel(topic);
  if (!quarrel) notFound();
  const { characters } = await loadAtlasData();
  const byId = new Map(characters.map((character) => [character.id, character]));
  const claims = claimsInTime(quarrel);
  const readings = await Promise.all(claims.map((claim) => claimReading(claim)));
  const figures = quarrel.characters.map((id) => byId.get(id)).filter((character): character is Character => character !== undefined);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1240px] px-4 pb-24 pt-20 sm:px-6">
      <CrumbBar
        back={{ href: '/library/quarrels', label: 'Back to the Quarrels' }}
        trail={[
          { href: '/library', label: 'Library' },
          { href: '/library/quarrels', label: 'Quarrels' },
        ]}
        current={quarrel.title}
      />
      <header className="mt-8 max-w-3xl">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-nebula-soft">
          ⚖ A quarrel · {claims.length} claim{claims.length === 1 ? '' : 's'}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-[0.08em] text-aether drop-shadow-[0_0_18px_rgba(192,132,252,0.25)] sm:text-4xl">{quarrel.title}</h1>
        {figures.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {figures.map((figure) => {
              const { color } = TYPE_GLOW[figure.type];
              return (
                <Link
                  key={figure.id}
                  href={`/character/${figure.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-2.5 py-1 font-body text-[14px] text-aether-muted transition-colors hover:text-aether"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  {figure.name}
                </Link>
              );
            })}
            <span className="ml-1 font-body text-[13px] italic text-aether-faint">Each codex reads its figure after one teller at a time.</span>
          </div>
        )}
      </header>

      <div className="quarrel-claims mt-10">
        {claims.map((claim, index) => {
          const { passages, links, works } = readings[index];
          const work = works[0] ?? null;
          return (
            <GlassPanel key={`${claim.who}-${index}`} className={`p-5 sm:p-6 ${claim.outside ? 'border-dashed opacity-80' : ''}`}>
              <article>
              <h2 className="font-display text-[12px] tracking-[0.22em] text-star-olympian/90">{(claim.outside ? 'Outside the seven tellers' : claim.who).toUpperCase()}</h2>
              {claim.outside ? (
                <p className="mt-0.5 font-body text-[13px] italic text-aether-faint">{claim.who}: a later summary, kept so the quarrel is whole</p>
              ) : (
                work && <p className="mt-0.5 font-body text-[13px] italic text-aether-faint">{work}</p>
              )}
              <p className="mt-3 font-body text-[18px] leading-[1.55] text-aether/90">{claim.claim}</p>
              {claim.citation && (
                <p className="mt-2 font-body text-[13.5px] italic text-aether-faint">
                  {claim.citation}
                  {links.length > passages.length && (
                    <>
                      {' · '}
                      {links.slice(passages.length).map((link, linkIndex) => (
                        <span key={link.href}>
                          {linkIndex > 0 && ', '}
                          <Link href={link.href} className="not-italic text-star-olympian/80 hover:text-star-olympian">
                            {link.label}
                          </Link>
                        </span>
                      ))}
                    </>
                  )}
                </p>
              )}
              {passages.length > 0 && (
                <div className="mt-4 space-y-5 border-t border-white/[0.06] pt-4">
                  <p className="font-display text-[8.5px] tracking-[0.28em] text-aether-faint">IN THE TELLER’S WORDS</p>
                  {passages.map((passage) => (
                    <Passage key={passage.link.href} passage={passage} />
                  ))}
                </div>
              )}
              </article>
            </GlassPanel>
          );
        })}
      </div>

      {(quarrel.significance || quarrel.verification) && (
        <section className="mt-12 max-w-3xl border-t border-star-olympian/20 pt-6">
          {quarrel.significance && (
            <>
              <h2 className="font-display text-[10px] tracking-[0.3em] text-aether-faint">WHY IT MATTERS</h2>
              <p className="mt-2 font-body text-[18px] leading-relaxed text-aether/85 first-letter:uppercase">
                <NoteText text={quarrel.significance} byId={byId} />
              </p>
            </>
          )}
          {quarrel.verification && (
            <>
              <h2 className="mt-6 font-display text-[10px] tracking-[0.3em] text-aether-faint">CHECKED</h2>
              <p className="mt-2 font-body text-[14px] italic leading-relaxed text-aether-faint">
                <NoteText text={quarrel.verification} byId={byId} />
              </p>
            </>
          )}
        </section>
      )}
      <nav className="mt-10 font-display text-[10px] tracking-[0.22em]">
        <Link href="/library/quarrels" className="text-aether-muted hover:text-aether">
          ← ALL THE QUARRELS
        </Link>
      </nav>
    </main>
  );
}
