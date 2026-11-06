# Hosting — Cloudflare, plain files

> **Status:** the atlas is a static export served by Cloudflare Workers Static Assets at **icarusatlas.app**, on the Workers Free plan. It moved from Netlify in November 2026, when Netlify's free credits ran out. Configured in `wrangler.jsonc`; the export is finished for the host by `scripts/finish-export.ts`.

## Why plain files

A first deploy ran the Next server on a Worker through the OpenNext adapter, with every page prerendered and answered from a static-assets cache. It worked, but the Worker still spent CPU on every page request:

| Request on the OpenNext Worker (2026-11-03) | CPU |
|---|---|
| Warm, small cache entries (Ephemeris JSON, constellations, cities) | 5–10 ms |
| Warm, RSC navigation | 12–17 ms; 25–29 ms for `/story/trojan-war` (a 1.3 MB cache entry) |
| First request on a fresh isolate (evaluating a 30 MB bundle) | ~60 ms |
| A path that is not prerendered (`/favicon.ico`, bots probing `/.env`), cold | 330–440 ms |

The free plan allows 10 ms a request and tolerates only infrequent overruns before it answers with error 1102. Plain files run no code at all: no CPU limit, no daily request cap, and requests to static assets are free and unlimited.

## The free plan sets the shape

| Workers Static Assets limit | Value | What it means for the atlas |
|---|---|---|
| Files per deployed version | 20,000 | Each page is two files (its HTML and its RSC payload). |
| File size | 25 MiB | The geo archives cannot ship. |
| `_headers` rules | 100 | One rule per name of extensionless file: every share card shares `/*/opengraph-image`, every Ephemeris card `/api/ephemeris/:id`. |
| Requests to static assets | free, unlimited | — |

## How the export works

- **`output: "export"`** in `next.config.ts`. Every route is prerendered: the dynamic routes set `dynamicParams = false` and list their ids in `generateStaticParams`, the three codex routes for every star (`loadCharacterIds`). That supersedes D16 in docs/NOSTOS_PLAN.md, which prerendered only the flagship stars to fit Netlify's 18-minute build window.
- **Client navigation fetches the page's `.txt` payload.** Next 16 also writes per-segment prefetch files, three a page (20,676 in all), which would take the export to 36,856 files. `finish-export` deletes them, and every link goes through `src/components/ui/Link.tsx`, which turns prefetching off, so nothing asks for them. ESLint forbids `next/link` anywhere else.
- **Headers come from `out/_headers`,** written by `finish-export` because a static host cannot run `next.config` headers. It marks `_next/static` immutable, gives the doors their `Link` preload of the door's data (`ATLAS_FILES`), and types the files a route handler or a share image writes without an extension: the Ephemeris cards (`/api/ephemeris/:id`, JSON) and the share cards (`/*/opengraph-image`, PNG). The files of one name and one type share a rule, a splat that matches the name at any depth, so the Library's 200 cards cost one rule, not 200; a name of mixed types, a file at the root, or a name a page also carries keeps a rule per file.
- **Routing** is `html_handling: "auto-trailing-slash"` (`/art` serves `art.html`) and `not_found_handling: "404-page"` (an unknown path gets `404.html` with a 404 status).
- **Images** load as they are (`images.unoptimized`): the art straight from Commons thumbnails.

## Building and deploying

- `pnpm cf:build` runs `pnpm build`, which writes `out/`, then `scripts/finish-export.ts`, which fails when the export would not deploy: too many files, a file over 25 MiB, or the geo archives on board. `pnpm cf:preview` serves `out/` locally with `wrangler dev`; `pnpm cf:deploy` uploads it.
- **Build from a clean tree.** `public/` is copied into the export whole. The gitignored geo archives (`public/geo/dem*.pmtiles`, `public/geo/relief/*`, about 2.8 GB) must not be on disk: they break the 25 MiB cap, and `build:map` would point the map style at archives the deploy does not carry. Without them the style falls back to the AWS terrain tiles. `GEO_ASSETS_BASE` points it at a hosted bucket instead, once there is one (an R2 bucket).
- **Set `NEXT_PUBLIC_SITE_URL=https://icarusatlas.app` at build.** It is `metadataBase`, the base of every Open Graph and Twitter image URL. Unset, they point at `localhost`.
- `next start` does not serve a static export; `pnpm cf:preview` does.

## What to watch

- **Files:** the count `finish-export` prints, against 20,000. Each new work, story, city or star adds two.
- **Header rules:** the count `finish-export` prints, against 100. A new kind of extensionless file adds a rule, or one per file if it cannot share; `pnpm build` alone never runs this check, so build with `pnpm cf:build` before a deploy.
- **A new dynamic route** needs `generateStaticParams` and `dynamicParams = false`, and a new route handler or metadata image needs `dynamic = 'force-static'`; the export fails without them.
