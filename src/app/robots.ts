import type { MetadataRoute } from 'next';

/** Every page of the atlas may be read; the sitemap lists them. Written once, at build. */
export const dynamic = 'force-static';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://icarusatlas.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
