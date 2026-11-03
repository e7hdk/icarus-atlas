import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LoomView } from '@/components/art/LoomView';
import { SettingsPanel } from '@/components/hud/SettingsPanel';
import { loadArtCatalogue } from '@/features/art/load';
import { loadAtlasData } from '@/features/characters/load';

export async function generateStaticParams() {
  const { works } = await loadArtCatalogue();
  return works.map((work) => ({ id: work.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { works, captions } = await loadArtCatalogue();
  const work = works.find((candidate) => candidate.id === id);
  if (!work) return {};
  return {
    title: `${work.title} — Icarus Atlas`,
    description: captions[id] || `${work.title}, ${work.artist}, ${work.year}.`,
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
      <LoomView />
      <SettingsPanel sources={atlas.sources} starCount={atlas.characters.length} />
    </main>
  );
}
