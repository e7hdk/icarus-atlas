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

const COMMONS_BASE = 'https://upload.wikimedia.org/wikipedia/commons';

/** The widths Commons serves thumbnails at; anything else is refused. */
const THUMB_STEPS = [120, 250, 330, 500, 960, 1280, 1920];

/** The usable thumbnail widths for a file, best first: at most `wanted`, and
 *  narrower than the original, which Commons will not upscale. */
export function commonsThumbSteps(originalWidth: number, wanted: number): number[] {
  return THUMB_STEPS.filter((step) => step <= wanted && step < originalWidth).reverse();
}

export function commonsThumbUrl(path: string, file: string, step: number): string {
  const name = encodeURIComponent(file);
  const extension = file.toLowerCase().split('.').pop();
  const rendered =
    extension === 'tif' || extension === 'tiff'
      ? `lossy-page1-${step}px-${name}.jpg`
      : extension === 'webp'
        ? `${step}px-${name}.png`
        : `${step}px-${name}`;
  return `${COMMONS_BASE}/thumb/${path}/${name}/${rendered}`;
}

export function commonsOriginalUrl(path: string, file: string): string {
  return `${COMMONS_BASE}/${path}/${encodeURIComponent(file)}`;
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
