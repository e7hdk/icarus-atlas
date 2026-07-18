import { buildCardPayload, buildEphemerisData } from '@/features/spotlight/build';

/** Static per-star card payloads for the Ephemeris — one tiny JSON endpoint
 *  per eligible star, all baked at build time (docs/EPHEMERIS_PLAN.md §3).
 *  The client card fetches these on open, so the daily payload never rides in
 *  the layout props. */
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const { roster } = await buildEphemerisData();
  return roster.map(({ id }) => ({ id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await buildCardPayload(id);
  if (!payload) {
    return Response.json({ error: 'not part of the ephemeris roster' }, { status: 404 });
  }
  return Response.json(payload);
}
