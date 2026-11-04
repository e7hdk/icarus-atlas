import { Link } from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { LoomDoor } from '@/components/art/LoomDoor';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import type { Metadata } from 'next';
import { commonsThumbSteps } from '@/features/art/commons';
import { workImageUrl } from '@/features/art/door';
import { loadArtCatalogue, loadPreviewPolicy } from '@/features/art/load';
import { loadAtlasData } from '@/features/characters/load';
import { LOOM_SHARE_IMAGE } from '../share';

/** Prerendered whole; nothing renders on a request (docs/HOSTING.md). */
export const dynamicParams = false;

export async function generateStaticParams() {
  const { works } = await loadArtCatalogue();
  return works.map((work) => ({ id: work.id }));
}

/** One painting can be shared on its own (docs/LOOM_PLAN.md §8): its link previews as
 *  the work, from Commons, or as the cloth where the work is nude (§10). */
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const [{ works, captions }, previewable] = await Promise.all([loadArtCatalogue(), loadPreviewPolicy()]);
  const work = works.find((candidate) => candidate.id === id);
  if (!work) return {};
  const title = `${work.title} — Icarus Atlas`;
  const description = captions[id] || `${work.title}, ${work.artist}, ${work.year}.`;
  const [step] = commonsThumbSteps(work.width, 1280);
  const width = step ?? work.width;
  const image = previewable(work)
    ? {
        url: workImageUrl(work, 1280),
        width,
        height: Math.round((width * work.height) / work.width),
        alt: `${work.title}, ${work.artist}, ${work.year}`,
      }
    : LOOM_SHARE_IMAGE;
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', images: [image.url] },
  };
}

/** One work on the Loom: the same door, with this work's plate already open. The
 *  article is what a crawler or a screen reader gets; the plate is what the eye gets. */
export default async function ArtWorkPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [{ works, captions }, atlas] = await Promise.all([loadArtCatalogue(), loadAtlasData()]);
  const work = works.find((candidate) => candidate.id === id);
  if (!work) notFound();
  return (
    <main className="fixed inset-0 overflow-hidden">
      <article className="sr-only">
        <h1>{work.title}</h1>
        <p>
          {work.artist}, {work.year}
        </p>
        <p>{captions[id]}</p>
        <Link href="/art/list">All the works, as a list</Link>
      </article>
      <LoomDoor />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
