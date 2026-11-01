import type { CommonsFileMeta, ImageCredit } from '@/types/art';

/** Wikimedia Commons helpers shared by the bake, the validators and the credits. */

/** Commons file name from an upload.wikimedia.org URL, original or thumbnail. */
export function commonsFileName(url: string): string | null {
  if (!url.startsWith('https://upload.wikimedia.org/')) return null;
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const thumbIndex = parts.indexOf('thumb');
  const name = thumbIndex >= 0 ? parts[thumbIndex + 3] : parts[parts.length - 1];
  return name ? decodeURIComponent(name) : null;
}

/** Commons hash path from the same URL: `d/d5` for `.../commons/thumb/d/d5/Name.jpg/…`. */
export function commonsHashPath(url: string): string | null {
  return url.match(/\/commons\/(?:thumb\/)?([0-9a-f]\/[0-9a-f]{2})\//)?.[1] ?? null;
}

export function commonsPageUrl(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;
}

const FREE_LICENSE_PREFIXES = ['cc0', 'cc ', 'cc-', 'public domain', 'pd', 'no restrictions', 'attribution'];

/** The licensing rule of CULTURE_PLAN §3: public domain or Creative Commons only. */
export function isFreeLicense(license: string): boolean {
  const value = license.toLowerCase();
  return FREE_LICENSE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isPublicDomain(license: string): boolean {
  return /^(public domain|pd\b|no restrictions)/i.test(license);
}

/** A long Commons `Artist` field stays readable; the page link carries the rest. */
const AUTHOR_DISPLAY_LIMIT = 90;

export function toImageCredit(file: string, meta: CommonsFileMeta | undefined): ImageCredit | undefined {
  if (!meta?.license) return undefined;
  const publicDomain = isPublicDomain(meta.license);
  const author = meta.author && meta.author.length > AUTHOR_DISPLAY_LIMIT
    ? `${meta.author.slice(0, AUTHOR_DISPLAY_LIMIT - 1).trimEnd()}…`
    : meta.author;
  return {
    license: publicDomain ? 'Public domain' : meta.license,
    pageUrl: commonsPageUrl(file),
    publicDomain,
    ...(meta.attributionRequired && author ? { author } : {}),
    ...(meta.licenseUrl ? { licenseUrl: meta.licenseUrl } : {}),
  };
}
