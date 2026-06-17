import { loadStories } from '@/features/stories/load';
import { childrenOf, partitionStoryShelves } from '@/features/stories/shelves';
import { loadAtlasData } from '@/features/characters/load';
import { MainNav } from '@/components/hud/MainNav';
import { HudActions } from '@/components/hud/HudActions';
import { AtlasOverlays } from '@/components/hud/AtlasOverlays';
import { StoryShelfCard } from '@/components/stories/StoryShelfCard';
import { IcarusBrand } from '@/components/ui/IcarusBrand';

export const metadata = {
  title: 'Myths — Icarus Atlas',
  description: 'The great myths: the cosmic cycle, wars, wanderings and their episodes.',
};

const COSMIC_ACCENT = '#c084fc';
const ARGONAUT_ACCENT = '#38bdf8';
const THEBAN_ACCENT = '#fb7185';
const PERSEUS_ACCENT = '#eab308';
const HERACLES_ACCENT = '#f97316';
const THESEUS_ACCENT = '#2dd4bf';
const TROJAN_ACCENT = '#fbbf24';
const RETURNS_ACCENT = '#34d399';
const METAMORPHOSES_ACCENT = '#e879f9';

export default async function StoriesPage() {
  const [stories, atlas] = await Promise.all([loadStories(), loadAtlasData()]);
  const {
    cosmicRoots,
    argonautRoots,
    thebanRoots,
    perseusRoots,
    heraclesRoots,
    theseusRoots,
    trojanRoots,
    returnsRoots,
    metamorphRoots,
    heroicRoots,
  } = partitionStoryShelves(stories);
  const getChildren = (id: string) => childrenOf(stories, id);

  return (
    <main className="min-h-screen w-full pb-24">
      <div className="pointer-events-none relative flex min-h-[68px] items-center px-4 py-3 sm:px-6 sm:py-4">
        <IcarusBrand />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MainNav active="stories" />
        </div>
        <HudActions />
      </div>
      <AtlasOverlays characters={atlas.characters} sources={atlas.sources} />

      <div className="mx-auto max-w-4xl px-6">
        <header className="mt-10 text-center">
          <h1 className="font-display text-4xl tracking-[0.3em] text-aether [text-shadow:0_0_46px_rgba(192,132,252,.4)]">
            MYTHS
          </h1>
          <p className="mt-3 font-body text-lg italic text-aether-muted">
            The myths as the poets told them — from the first yawning of Chaos to the fall of Troy.
          </p>
        </header>

        <section className="mt-12">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-nebula-soft">
              The cosmic cycle
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Succession of the gods, the wars for heaven, stolen fire, and the floods that remade mankind — era
              zero to the age of Hellen.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {cosmicRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={COSMIC_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Argonautica
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              The first voyage of a named ship — from Pelias&apos; oracle at Iolcus to the witchcraft of Colchis
              and the cauldron that boiled a king.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {argonautRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={ARGONAUT_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Theban cycle
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Cadmus and the dragon&apos;s teeth, Oedipus and the Sphinx, the Seven at the gates, Antigone&apos;s
              defiance, and the Epigoni who returned.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {thebanRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={THEBAN_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Perseus cycle
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Danae in the bronze chamber, the chest on Seriphos, the Gorgon&apos;s head, Andromeda on the rock,
              and the discus that founded Mycenae.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {perseusRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={PERSEUS_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The labours of Heracles
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Serpents in the cradle at Thebes, service at Tiryns, and the twelve tasks that drove Alcides to Nemea,
              Lerna, the edge of the world, and the hound of Hades.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {heraclesRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={HERACLES_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Attic cycle of Theseus
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Sword and sandals at Troezen, brigands on the Isthmus road, the Minotaur in the labyrinth, the
              synoecism of Attica, and Phaedra&apos;s fatal lie.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {theseusRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={THESEUS_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Trojan cycle
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              The house of Priam, the judgment on Ida, the muster at Aulis, ten years at Ilion, the wooden horse,
              and the bitter Nostoi.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {trojanRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={TROJAN_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Returns
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
            Ten years after Troy, Odysseus is still at sea — Cyclops and Circe, Scylla and the cattle of
            the Sun, until the beggar in his own hall bends the bow. Nested episodes carry Telemachus&apos; voyage,
            every wandering, and the suitors&apos; slaughter.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {returnsRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={RETURNS_ACCENT}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-muted">
              The Metamorphoses
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-muted">
              Ovid&apos;s song of changed forms — laurel and spider, stone and star — where desire and pride fix
              mortals and gods alike in shapes that cannot be undone.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-5">
            {metamorphRoots.map((story) => (
              <StoryShelfCard
                key={story.id}
                story={story}
                getChildren={getChildren}
                nestedEpisodes
                accent={METAMORPHOSES_ACCENT}
              />
            ))}
          </div>
        </section>

        {heroicRoots.length > 0 && (
          <section className="mt-14">
            <div className="text-center">
              <h2 className="font-display text-[12px] uppercase tracking-[0.34em] text-aether-faint">
                Heroic ages
              </h2>
              <p className="mx-auto mt-2 max-w-lg font-body text-[15px] italic text-aether-faint">
                Other tales of the age when mortals walked with kings and gods still quarrelled in the open.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-5">
              {heroicRoots.map((story) => (
                <StoryShelfCard key={story.id} story={story} getChildren={getChildren} />
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center text-center">
          <span
            aria-hidden
            className="block h-px w-28 bg-gradient-to-r from-transparent via-nebula-soft/50 to-transparent"
          />
          <p className="mt-7 font-display text-[11px] uppercase tracking-[0.34em] text-aether-faint">
            The song continues
          </p>
          <p className="mt-5 font-body text-xl italic leading-relaxed text-aether-muted">
            Nine shelves stand on the wall — cosmos, voyage, Thebes, Perseus, Heracles, Theseus, Troy, the long
            homecoming, and Ovid&apos;s catalogue of change.
            <br />
            More episodes will nest beneath them as the sky fills star by star.
          </p>
        </div>
      </div>
    </main>
  );
}
