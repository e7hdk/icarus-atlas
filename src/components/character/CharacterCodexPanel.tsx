'use client';

import { useEffect, useState } from 'react';
import type { Character, Relation } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';
import { CodexIdentity, CodexRegisters, MarqueeCard, MarqueeHeading, Meander } from './codex-marquee';
import { CodexSeal } from './CodexSeal';

/** The codex marquee for the lens-independent tabs (Information, Legacy):
 *  identity, the seal in consensus orbit, a live contents index of the
 *  stage's sections, and the registers. The source lens never appears here —
 *  it lives on the Poets tab alone (the character-page rule). */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function CharacterCodexPanel({
  character,
  characters,
  relations,
  contentsHeading,
  contents,
  residences,
  appearances,
}: {
  character: Character;
  characters: Pick<Character, 'id' | 'name' | 'type'>[];
  relations: Relation[];
  /** Rubric over the live index, e.g. "THE ARTICLE" or "THE SHELVES". */
  contentsHeading: string;
  /** Stage section anchors, in page order; ids must exist in the stage DOM. */
  contents: { id: string; label: string }[];
  residences: { city: string; label: string }[];
  appearances: { id: string; title: string }[];
}) {
  const glow = TYPE_GLOW[character.type].color;
  const [active, setActive] = useState<string | null>(contents[0]?.id ?? null);

  /* The index follows the reader: the stage section under the eyes glows
   * gold on the card. */
  useEffect(() => {
    const sections = contents
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [contents]);

  const scrollTo = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
      <MarqueeCard>
        <CodexIdentity character={character} />

        <CodexSeal
          characterId={character.id}
          glow={glow}
          characters={characters}
          relations={relations}
          lens="consensus"
          hint="his bonds keep their orbits — hover a star to name it"
        />

        <Meander />

        {contents.length > 0 && (
          <>
            <MarqueeHeading>{contentsHeading}</MarqueeHeading>
            <nav aria-label={contentsHeading.toLowerCase()}>
              {contents.map((entry, index) => {
                const on = active === entry.id;
                return (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    onClick={scrollTo(entry.id)}
                    className={`flex items-baseline gap-2.5 py-1.5 font-body text-[15.5px] transition-colors ${
                      on ? 'text-star-olympian' : 'text-aether-muted hover:text-aether'
                    }`}
                  >
                    <span
                      className={`h-[7px] w-[7px] shrink-0 self-center rounded-full transition-all duration-300 ${
                        on
                          ? 'bg-star-olympian shadow-[0_0_9px_2px_rgba(252,211,77,.65)]'
                          : 'bg-aether/20'
                      }`}
                    />
                    <span
                      className={`min-w-[24px] font-display text-[10px] tracking-[0.14em] ${
                        on ? 'text-star-olympian' : 'text-aether-faint'
                      }`}
                    >
                      {ROMAN[index] ?? String(index + 1)}
                    </span>
                    <span className="min-w-0 truncate">{entry.label}</span>
                  </a>
                );
              })}
            </nav>
          </>
        )}

        <CodexRegisters residences={residences} appearances={appearances} />

        <p className="mt-4 text-center text-[15px] tracking-[0.5em] text-aether/35">⁂</p>
      </MarqueeCard>
    </aside>
  );
}
