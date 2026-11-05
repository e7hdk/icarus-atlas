import { ImageResponse } from 'next/og';
import { loadAtlasData } from '@/features/characters/load';
import { shortTeller } from '@/features/library/paths';
import { QUARRELS, findQuarrel, tellersOf } from '@/features/library/quarrels';

/** A quarrel's social card (docs/LIBRARY_PLAN.md §9): what is in dispute, and who
 *  disputes it. Latin text only. */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return QUARRELS.map((quarrel) => ({ topic: quarrel.topic }));
}

export const alt = 'A quarrel of the Greek myths, each claim in its teller’s own words | Icarus Atlas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const quarrel = findQuarrel(topic);
  const { sources } = await loadAtlasData();
  const tellers = quarrel ? tellersOf(quarrel).map((id) => shortTeller(sources.find((source) => source.id === id)?.name ?? id).toUpperCase()) : [];
  const title = quarrel?.title ?? 'The Quarrels';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', background: 'linear-gradient(160deg, #120628 0%, #05020f 55%, #10052a 100%)', color: '#e5e7eb' }}>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 12, color: 'rgba(192, 132, 252, 0.85)' }}>ICARUS ATLAS · THE QUARRELS</div>
        <div style={{ display: 'flex', marginTop: 34, maxWidth: 1020, fontSize: title.length > 48 ? 58 : 72, lineHeight: 1.12, color: '#fdf6e3' }}>{title}</div>
        {tellers.length > 0 && <div style={{ display: 'flex', marginTop: 34, fontSize: 26, letterSpacing: 8, color: 'rgba(252, 211, 77, 0.8)' }}>{tellers.join('  ·  ')}</div>}
        <div style={{ display: 'flex', marginTop: 16, fontSize: 26, color: 'rgba(229, 231, 235, 0.7)' }}>Each claim in its teller’s own words, the passage under it</div>
      </div>
    ),
    size,
  );
}
