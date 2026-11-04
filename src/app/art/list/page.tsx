import { Link } from '@/components/ui/Link';
import { WorkListFilter } from '@/components/art/WorkListFilter';
import { loadArtCatalogue } from '@/features/art/load';
import { LOOM_ERAS } from '@/features/art/loom';

export const metadata = {
  title: 'Every work on the Loom — Icarus Atlas',
  description: 'Every image of the Greek myths the atlas holds, as a plain list by age.',
};

/** The Loom without the cloth: for screen readers, for browsers without WebGL 2, and
 *  for crawlers. Same works, same order of time. */
export default async function ArtListPage() {
  const { works } = await loadArtCatalogue();
  const groups = LOOM_ERAS.map((era, index) => {
    const until = LOOM_ERAS[index + 1]?.from ?? Infinity;
    return { era, works: works.filter((work) => work.sortYear >= era.from && work.sortYear < until) };
  }).filter((group) => group.works.length > 0);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-24">
      <h1 className="font-display text-3xl tracking-[0.08em] text-aether">The Loom, as a list</h1>
      <p className="mt-3 font-body text-lg italic text-aether-muted">
        {works.length.toLocaleString('en')} works, oldest first.{' '}
        <Link href="/art" className="text-star-olympian underline underline-offset-4">
          See them woven
        </Link>
        .
      </p>
      <WorkListFilter />
      {groups.map((group) => (
        <section key={group.era.label} className="mt-12 [&:not(:has(li:not([hidden])))]:hidden">
          <h2 className="font-display text-sm uppercase tracking-[0.24em] text-aether-faint">
            {group.era.label === 'The tear' ? 'AD 500–1400' : group.era.label}
            {group.era.sub && group.era.label !== 'The tear' ? `, ${group.era.sub}` : ''}
          </h2>
          <ul className="mt-4 space-y-1.5">
            {group.works.map((work) => (
              <li key={work.id} data-work className="font-body text-[17px] leading-snug">
                <Link href={`/art/${work.id}`} className="text-aether transition-colors hover:text-star-olympian">
                  {work.title}
                </Link>
                <span className="text-aether-muted">
                  {' '}
                  — {work.artist}, {work.year}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
