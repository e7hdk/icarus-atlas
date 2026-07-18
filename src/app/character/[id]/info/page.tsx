import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAtlasData, loadFlagshipCharacterIds, loadReference } from '@/features/characters/load';
import { loadCities } from '@/features/geo/load';
import { loadStories } from '@/features/stories/load';
import { storiesFeaturingCharacter } from '@/features/stories/appearances';
import { CharacterTabs } from '@/components/character/CharacterTabs';
import { CharacterCodexPanel } from '@/components/character/CharacterCodexPanel';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { TYPE_GLOW } from '@/types/character';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Prerender the flagship stars; the long tail renders on demand and caches
 *  at the CDN (docs/NOSTOS_PLAN.md D16 — Netlify's build window). */
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await loadFlagshipCharacterIds();
  return ids.map((id) => ({ id }));
}

export default async function CharacterInfoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [{ characters, relations }, cities, stories] = await Promise.all([
    loadAtlasData(),
    loadCities(),
    loadStories(),
  ]);
  const character = characters.find((c) => c.id === id);
  if (!character) notFound();

  const reference = await loadReference(id);
  const byId = new Map(characters.map((c) => [c.id, c]));
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const storyAppearances = storiesFeaturingCharacter(stories, character.id);
  const glow = TYPE_GLOW[character.type].color;

  const codexRelations = relations.filter(
    (relation) => relation.from === character.id || relation.to === character.id,
  );
  const codexCharacterIds = new Set(
    codexRelations.flatMap((relation) => [relation.from, relation.to]),
  );
  const codexCharacters = characters
    .filter((candidate) => codexCharacterIds.has(candidate.id))
    .map(({ id: candidateId, name, type }) => ({ id: candidateId, name, type }));

  const parentEdges = codexRelations.filter((r) => r.type === 'parent' && r.from === id);
  const parentNames = [...new Set(parentEdges.map((r) => byId.get(r.to)?.name ?? r.to))];
  const parentageDisputed = parentEdges.some((r) => r.topic);

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: 'Greek name', value: character.greekName },
    ...(character.romanName ? [{ label: 'Roman name', value: character.romanName }] : []),
    { label: 'Type', value: character.type },
    { label: 'Domains', value: character.domains.join(' · ') },
    ...(character.epithets?.length
      ? [{ label: 'Epithets', value: character.epithets.join(' · ') }]
      : []),
    ...(parentNames.length
      ? [
          {
            label: 'Parentage',
            value: (
              <>
                {parentNames.join(' · ')}
                {parentageDisputed && (
                  <Link
                    href={`/character/${id}`}
                    className="ml-2 font-body text-sm italic text-nebula-soft hover:underline"
                  >
                    tellings differ →
                  </Link>
                )}
              </>
            ),
          },
        ]
      : []),
    ...(reference?.symbols?.length ? [{ label: 'Symbols', value: reference.symbols.join(' · ') }] : []),
    ...(reference?.sacredAnimals?.length
      ? [{ label: 'Sacred animals', value: reference.sacredAnimals.join(' · ') }]
      : []),
    ...(reference?.cultCenters?.length
      ? [{ label: 'Cult centers', value: reference.cultCenters.join(' · ') }]
      : []),
    ...(reference?.etymology ? [{ label: 'Etymology', value: reference.etymology }] : []),
  ];

  const sections = reference?.sections ?? [];
  const contents = [
    ...sections.map((section, index) => ({ id: `article-${index + 1}`, label: section.heading })),
    { id: 'at-a-glance', label: 'At a glance' },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-20">
      <CrumbBar
        back={{ href: '/', label: 'Back to the galaxy' }}
        trail={[{ href: '/', label: 'Galaxy' }]}
        current={`The codex of ${character.name}`}
        laurelCharacterId={character.id}
      />

      <nav className="mt-4 flex justify-center">
        <CharacterTabs characterId={character.id} active="info" />
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[322px_minmax(0,1fr)] lg:gap-x-14">
        <CharacterCodexPanel
          character={character}
          characters={codexCharacters}
          relations={codexRelations}
          contentsHeading="THE ARTICLE"
          contents={contents}
          residences={(character.residences ?? []).map((residence) => ({
            city: residence.city,
            label: citiesById.get(residence.city)?.name ?? residence.city,
          }))}
          appearances={storyAppearances.map((story) => ({ id: story.id, title: story.title }))}
        />

        <div className="max-w-[680px]">
          {reference ? (
            <div className="border-l-2 pl-6" style={{ borderColor: `${glow}80` }}>
              <p className="font-body text-lg leading-relaxed text-aether/90">
                {reference.summary}
              </p>
              <p className="mt-2.5 font-body text-sm italic text-aether-faint">
                {reference.attribution}
              </p>
            </div>
          ) : (
            <p className="font-body text-lg italic text-aether-faint">
              The reference entry for this figure is still being written.
            </p>
          )}

          {sections.length > 0 && (
            <div className="mt-12 space-y-11">
              {sections.map((section, index) => (
                <section key={section.heading} id={`article-${index + 1}`} className="scroll-mt-6">
                  <h2 className="flex items-baseline gap-3">
                    <span className="font-display text-[12px] tracking-[0.12em] text-star-olympian/70">
                      {ROMAN[index] ?? String(index + 1)}.
                    </span>
                    <span className="font-display text-[19px] tracking-[0.02em] text-aether">
                      {section.heading}
                    </span>
                    <span className="h-px min-w-6 flex-1 self-center bg-glass-border" />
                  </h2>
                  <div className="mt-3.5 space-y-3">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        className="font-body text-[17px] leading-relaxed text-aether/85"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <section id="at-a-glance" className="mt-12 scroll-mt-6">
            <h2 className="font-display text-[12px] tracking-[0.26em] text-aether-faint">
              AT A GLANCE
            </h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-glass-border">
              {facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={`flex flex-wrap gap-x-6 gap-y-1 px-6 py-3.5 ${
                    index % 2 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'
                  }`}
                >
                  <span className="w-36 shrink-0 font-display text-[11px] uppercase leading-6 tracking-[0.18em] text-aether-faint">
                    {fact.label}
                  </span>
                  <span className="min-w-0 flex-1 font-body text-[16px] text-aether/90">
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {reference?.externalLinks?.length ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="font-display text-[11px] tracking-[0.22em] text-aether-faint">
                READ MORE
              </span>
              {reference.externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-glass-border bg-glass px-4 py-1.5 font-body text-[15px] text-aether/85 transition-colors hover:border-nebula-soft/50 hover:text-aether"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
