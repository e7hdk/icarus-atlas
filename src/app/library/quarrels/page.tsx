import { Link } from '@/components/ui/Link';
import { SagaMore } from '@/components/library/SagaMore';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { QuarrelFilter } from '@/components/library/QuarrelFilter';
import { loadAtlasData } from '@/features/characters/load';
import { TELLER_ORDER, quarrelHref, shortTeller } from '@/features/library/paths';
import { QUARRELS, musesLine, quarrelSaga, tellersOf } from '@/features/library/quarrels';
import { loadStories } from '@/features/stories/load';
import { SAGA_ACCENT, SAGA_LABEL, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type { Quarrel } from '@/types/quarrel';

/** The Quarrels (docs/LIBRARY_PLAN.md §7): every place where the tellers contradict
 *  each other, grouped by saga in Spindle order, under the Muses' own warning. */

const DESCRIPTION = 'Where the seven tellers of Greek myth contradict each other: every quarrel the atlas keeps, each claim beside its passage in the original and in English.';

/** A saga opens on its first ten quarrels; the Olympians' run to 37. */
const SAGA_SHOWN = 10;

export const metadata = {
  title: 'The Quarrels — The Library — Icarus Atlas',
  description: DESCRIPTION,
  openGraph: { siteName: 'Icarus Atlas', type: 'website', title: 'The Quarrels — The Library', description: DESCRIPTION },
};

export default async function QuarrelsPage() {
  const [{ characters, sources }, stories, muses] = await Promise.all([loadAtlasData(), loadStories(), musesLine()]);
  const storyById = new Map(stories.map((story) => [story.id, story]));
  const types = new Map(characters.map((character) => [character.id, character.type]));
  const names = new Map(characters.map((character) => [character.id, character.name]));
  const tellerName = new Map(sources.map((source) => [source.id, shortTeller(source.name)]));

  const bySaga = new Map<SagaId, Quarrel[]>();
  for (const quarrel of QUARRELS) {
    const saga = quarrelSaga(quarrel, stories, storyById, types);
    bySaga.set(saga, [...(bySaga.get(saga) ?? []), quarrel]);
  }
  const tellers = TELLER_ORDER.map((id) => ({ id, name: tellerName.get(id) ?? id, count: QUARRELS.filter((quarrel) => tellersOf(quarrel).includes(id)).length }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-20 sm:px-6">
      <CrumbBar back={{ href: '/library', label: 'Back to the Library' }} trail={[{ href: '/library', label: 'Library' }]} current="The Quarrels" />
      <header className="mt-8 max-w-2xl">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-nebula-soft">⚖ The Library</p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.14em] text-aether drop-shadow-[0_0_18px_rgba(192,132,252,0.3)]">
          THE QUARRELS
          <span className="mt-1 block font-greek text-2xl italic tracking-normal text-nebula-soft/80">Νείκεα</span>
        </h1>
        <p className="mt-5 font-body text-[17px] leading-relaxed text-aether-muted">
          Where the seven tellers contradict each other, the atlas keeps every version and marks it ⚖. Here are all {QUARRELS.length}, each claim beside the passage it rests on, in the original and in English. Hesiod counts Quarrels among the children of Strife (
          <Link href="/library/hesiod/theogony#l229" className="text-aether hover:text-star-olympian">
            Theogony 229
          </Link>
          ).
        </p>
      </header>

      {muses.greek.length > 0 && (
        <blockquote className="mt-9 max-w-2xl border-l-2 border-star-olympian/30 pl-5">
          <p lang="grc" className="font-greek text-[19px] italic leading-relaxed text-aether/90">
            {muses.greek.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </p>
          {muses.english && <p className="mt-2 font-body text-[16px] italic leading-relaxed text-aether-muted">“{muses.english}”</p>}
          <footer className="mt-2 font-display text-[9px] tracking-[0.22em] text-aether-faint">
            THE MUSES TO HESIOD ·{' '}
            <Link href="/library/hesiod/theogony#l27-28" className="hover:text-star-olympian">
              THEOGONY 27–28
            </Link>
          </footer>
        </blockquote>
      )}

      <div className="mt-10">
        <QuarrelFilter tellers={tellers} total={QUARRELS.length}>
          {SAGA_ORDER.filter((saga) => bySaga.has(saga)).map((saga) => {
            const quarrels = bySaga.get(saga) ?? [];
            return (
              <section key={saga} className="quarrel-saga mt-10">
                <h2 className="flex items-center gap-2.5 font-display text-[12px] tracking-[0.24em] text-aether">
                  <span className="h-2 w-2 rounded-full" style={{ background: SAGA_ACCENT[saga], boxShadow: `0 0 8px ${SAGA_ACCENT[saga]}` }} />
                  {SAGA_LABEL[saga].toUpperCase()}
                  <span className="quarrel-count font-body text-[13px] italic tracking-normal text-aether-faint">{quarrels.length}</span>
                </h2>
                <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
                  {quarrels.map((quarrel, index) => {
                    const involved = tellersOf(quarrel);
                    return (
                      <li key={quarrel.topic} data-tellers={involved.join(' ')} className={index >= SAGA_SHOWN ? 'quarrel-more' : undefined}>
                        <Link href={quarrelHref(quarrel.topic)} className="group block border-t border-glass-border py-3">
                          <span className="block font-body text-[17px] leading-snug text-aether transition-colors group-hover:text-star-olympian">{quarrel.title}</span>
                          <span className="mt-1 block font-display text-[8.5px] tracking-[0.2em] text-nebula-soft/80">
                            {involved.map((id) => (tellerName.get(id) ?? id).toUpperCase()).join(' · ')}
                          </span>
                          {quarrel.characters.length > 0 && (
                            <span className="mt-0.5 block truncate font-body text-[13.5px] italic text-aether-faint">
                              {quarrel.characters
                                .slice(0, 5)
                                .map((id) => names.get(id) ?? id)
                                .join(', ')}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {quarrels.length > SAGA_SHOWN && <SagaMore total={quarrels.length} hidden={quarrels.length - SAGA_SHOWN} />}
              </section>
            );
          })}
        </QuarrelFilter>
      </div>
    </main>
  );
}
