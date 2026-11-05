import { ImageResponse } from 'next/og';
import { loadAtlasData } from '@/features/characters/load';
import { findLibraryWork, libraryWorks } from '@/features/library/load';
import { libraryShelf } from '@/features/library/shelf';

/** A work's social card (docs/LIBRARY_PLAN.md §9): its name, its teller and date,
 *  and how much of it the atlas cites. Its books share it. Latin text only. */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return libraryWorks().map((work) => ({ author: work.author, work: work.id }));
}

export const alt = 'A work of the Library, read in the original and in English | Icarus Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fmt = (n: number) => n.toLocaleString('en-US');

export default async function Image({ params }: { params: Promise<{ author: string; work: string }> }) {
  const { author, work: id } = await params;
  const work = findLibraryWork(author, id);
  const [{ sources }, { works }] = await Promise.all([loadAtlasData(), libraryShelf()]);
  const stats = work ? works[work.id] : null;
  const teller = sources.find((source) => source.id === author)?.name ?? author;
  const cited = stats ? Math.round(stats.cited * 100) : 0;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', background: 'linear-gradient(160deg, #0b0522 0%, #05020f 55%, #0b0420 100%)', color: '#e5e7eb' }}>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 12, color: 'rgba(252, 211, 77, 0.75)' }}>ICARUS ATLAS · THE LIBRARY</div>
        <div style={{ display: 'flex', marginTop: 34, fontSize: 26, letterSpacing: 8, color: 'rgba(229, 231, 235, 0.7)' }}>
          {`${teller.toUpperCase()} · ${(work?.composed.label ?? '').toUpperCase()}`}
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: work && work.title.length > 14 ? 76 : 100, letterSpacing: 12, color: '#fdf6e3' }}>{(work?.title ?? 'The Library').toUpperCase()}</div>
        {stats && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
            <div style={{ display: 'flex', width: 640, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', width: `${cited}%`, height: 10, borderRadius: 5, background: '#fcd34d' }} />
            </div>
            <div style={{ display: 'flex', marginTop: 14, fontSize: 26, color: 'rgba(229, 231, 235, 0.75)' }}>
              {`${cited}% of it cited by the atlas · ${stats.lines ? `${fmt(stats.lines)} lines` : `about ${fmt(Math.round(stats.words / 1000))},000 words`} · ${stats.quarrels} quarrels`}
            </div>
          </div>
        )}
      </div>
    ),
    size,
  );
}
