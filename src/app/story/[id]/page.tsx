import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadStories, loadStoryCulture, loadVoyage } from '@/features/stories/load';
import { loadAtlasData } from '@/features/characters/load';
import { getBakedLinkedProse, getStoryProseSegments } from '@/features/linking/load-baked';
import { buildLinkingContext } from '@/features/linking/name-index';
import { StoryProse } from '@/components/stories/StoryProse';
import { StoryTheatre } from '@/components/stories/StoryTheatre';
import { loadCities } from '@/features/geo/load';
import { CrumbBar } from '@/components/hud/CrumbBar';
import { StoryLegacy } from '@/components/stories/StoryLegacy';
import type { SourceId } from '@/types/character';

export async function generateStaticParams() {
  const stories = await loadStories();
  return stories.map((story) => ({ id: story.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const stories = await loadStories();
  const story = stories.find((s) => s.id === id);
  return { title: story ? `${story.title} — Icarus Atlas` : 'Story — Icarus Atlas' };
}

export default async function StoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [stories, atlas, cities, culture, voyage] = await Promise.all([
    loadStories(),
    loadAtlasData(),
    loadCities(),
    loadStoryCulture(id),
    loadVoyage(id),
  ]);
  const bakedProse = getBakedLinkedProse();
  const story = stories.find((s) => s.id === id);
  if (!story) notFound();

  const parent = story.parent ? stories.find((s) => s.id === story.parent) : undefined;
  const subStories = stories.filter((s) => s.parent === story.id);
  const sourceNames = new Map(atlas.sources.map((source) => [source.id, source.name]));
  const characterById = new Map(atlas.characters.map((character) => [character.id, character]));
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const linkingContext = buildLinkingContext(atlas.characters);
  const scopeIds = story.cast.flatMap((member) => (member.id ? [member.id] : []));
  const storySegments = bakedProse ? getStoryProseSegments(bakedProse, story.id) : undefined;

  /** Hover-footnote label: teller names + optional citation. */
  const footnote = (sources: SourceId[], citation?: string) =>
    `${sources.map((sourceId) => sourceNames.get(sourceId) ?? sourceId).join(' · ')}${
      citation ? ` — ${citation}` : ''
    }`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-24 pt-20">
      <CrumbBar
        back={{ href: '/stories', label: 'Back to the myths' }}
        trail={[
          { href: '/stories', label: 'Myths' },
          ...(parent ? [{ href: `/story/${parent.id}`, label: parent.title }] : []),
        ]}
        current={story.title}
      />

      {/* The saga has a flagship voyage — the codex offers the cinematic door
          (docs/NOSTOS_PLAN.md §6; only the Odyssey carries one today). */}
      {voyage && (
        <Link
          href="/odyssey"
          className="group mt-6 flex items-center justify-between gap-4 border border-star-olympian/35 bg-cosmos-raised/40 px-6 py-4 backdrop-blur-xl transition-colors hover:border-star-olympian/70"
        >
          <span className="font-display text-[12px] tracking-[0.24em] text-star-olympian">
            ENTER THE VOYAGE — THE POEM TOLD BY THE STARS
          </span>
          <span
            aria-hidden
            className="font-display text-star-olympian transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      )}

      <StoryTheatre
        title={story.title}
        greekTitle={story.greekTitle}
        parent={parent ? { id: parent.id, title: parent.title } : undefined}
        summaryProse={
          <StoryProse
            text={story.summary.text}
            segments={storySegments?.summary}
            linkingContext={linkingContext}
            scopeIds={scopeIds}
          />
        }
        summaryFootnote={footnote(story.summary.sources, story.summary.citation)}
        chapters={story.chapters.map((chapter, index) => ({
          title: chapter.title,
          disputed: Boolean(chapter.topic),
          footnote: footnote(chapter.sources, chapter.citation),
          prose: (
            <StoryProse
              key={`${chapter.title}-${index}`}
              text={chapter.text}
              segments={storySegments?.chapters[index]}
              linkingContext={linkingContext}
              scopeIds={scopeIds}
            />
          ),
        }))}
        cast={story.cast.map((member) => ({
          name: member.name,
          role: member.role,
          id: member.id,
          linked: Boolean(member.id && characterById.has(member.id)),
        }))}
        places={story.places.map((place) => ({
          name: place.name,
          role: place.role,
          id: place.id,
          linked: Boolean(place.id && cityById.has(place.id)),
        }))}
        attestations={story.attestations.map((attestation) => ({
          sourceName: sourceNames.get(attestation.source) ?? attestation.source,
          work: attestation.work,
          citation: attestation.citation,
        }))}
        episodes={subStories.map((sub) => ({ id: sub.id, title: sub.title }))}
      />

      {culture && <StoryLegacy culture={culture} />}
    </main>
  );
}
