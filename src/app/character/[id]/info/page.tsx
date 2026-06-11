import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAtlasData, loadReference } from '@/features/characters/load';
import { CharacterShell } from '@/components/character/CharacterShell';
import { GlassPanel } from '@/components/ui/GlassPanel';

export async function generateStaticParams() {
  const { characters } = await loadAtlasData();
  return characters.map((character) => ({ id: character.id }));
}

export default async function CharacterInfoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { characters, relations } = await loadAtlasData();
  const character = characters.find((c) => c.id === id);
  if (!character) notFound();

  const reference = await loadReference(id);
  const byId = new Map(characters.map((c) => [c.id, c]));

  const parentEdges = relations.filter((r) => r.type === 'parent' && r.from === id);
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

  return (
    <CharacterShell character={character} active="info">
      <div className="mx-auto mt-9 max-w-3xl">
        {reference ? (
          <GlassPanel className="bg-glass-heavy px-7 py-6">
            <p className="font-body text-lg leading-relaxed text-aether/90">{reference.summary}</p>
            <p className="mt-3 font-body text-sm italic text-aether-faint">{reference.attribution}</p>
          </GlassPanel>
        ) : (
          <p className="text-center font-body text-lg italic text-aether-faint">
            The reference entry for this figure is still being written.
          </p>
        )}

        <h2 className="mt-10 font-display text-[12px] tracking-[0.26em] text-aether-faint">
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
              <span className="w-36 shrink-0 font-display text-[11px] uppercase tracking-[0.18em] text-aether-faint leading-6">
                {fact.label}
              </span>
              <span className="min-w-0 flex-1 font-body text-[16px] text-aether/90">
                {fact.value}
              </span>
            </div>
          ))}
        </div>

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
    </CharacterShell>
  );
}
