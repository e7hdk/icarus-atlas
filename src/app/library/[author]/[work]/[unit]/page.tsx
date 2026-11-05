import { notFound } from 'next/navigation';
import { ReadingRoom } from '@/components/library/ReadingRoom';
import { loadAtlasData } from '@/features/characters/load';
import { findLibraryWork, libraryWorks, loadLibraryText, romanBook } from '@/features/library/load';

/** One book of a work: /library/homer/iliad/5. Prerendered whole (docs/HOSTING.md). */
export const dynamicParams = false;

export async function generateStaticParams() {
  const pages = await Promise.all(
    libraryWorks()
      .filter((work) => work.units === 'books')
      .map(async (work) => (await loadLibraryText(work.id)).units.map((unit) => ({ author: work.author, work: work.id, unit: unit.id }))),
  );
  return pages.flat();
}

type Params = { params: Promise<{ author: string; work: string; unit: string }> };

export async function generateMetadata({ params }: Params) {
  const { author, work: id, unit } = await params;
  const work = findLibraryWork(author, id);
  if (!work) return { title: 'The Library — Icarus Atlas' };
  const title = `${work.title}, Book ${romanBook(unit)}`;
  const description = `${work.title}, book ${romanBook(unit)}, in the original and in English, line by line — every name a star of the atlas.`;
  return {
    title: `${title} — The Library — Icarus Atlas`,
    description,
    openGraph: { siteName: 'Icarus Atlas', type: 'article', title, description },
  };
}

export default async function LibraryUnitPage({ params }: Params) {
  const { author, work: id, unit: unitId } = await params;
  const work = findLibraryWork(author, id);
  if (!work || work.units !== 'books') notFound();
  const [text, { sources }] = await Promise.all([loadLibraryText(work.id), loadAtlasData()]);
  const unit = text.units.find((candidate) => candidate.id === unitId);
  if (!unit) notFound();
  const tellerName = sources.find((source) => source.id === work.author)?.name ?? work.author;
  return <ReadingRoom work={work} unit={unit} units={text.units.map((candidate) => candidate.id)} tellerName={tellerName} />;
}
