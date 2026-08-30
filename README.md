# Icarus Atlas

An interactive galaxy of Greek mythology. Every figure — god, titan, primordial, hero, nymph, mortal, creature — is a star. Hover a star to read who they are and who they are bound to; click to fly to it and unfold the full story. Switch the **source lens** (Hesiod, Homer, Apollodorus, …) and watch genealogies re-wire, because the ancient authors never agreed in the first place.

## Stack

Next.js (App Router, TypeScript) · React Three Fiber + drei + postprocessing · zustand · zod-validated JSON data · Tailwind CSS · pnpm

## Getting started

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm validate-data  # check data integrity after editing data/
```

## Project layout

- `src/` — app code (see `CLAUDE.md` for the directory map)
- `data/` — sourced mythology data: `sources.json`, `characters/*.json`, `relations.json`
- `docs/` — [PLAN.md](docs/PLAN.md) (roadmap & architecture), source/character/contradiction catalogs
- `mockups/` — interactive theme mockups (open in a browser)

## The one rule of the data layer

Every mythological fact carries `sources` (which ancient authors attest it) and, where versions clash, a shared `topic` key. Nothing in this galaxy is presented as undisputed unless the sources actually agree.

## Licensing

Source code is MIT; the sourced mythology data and the research prose in `data/` and `docs/` are CC BY-SA 4.0, because part of that layer derives from ShareAlike sources and cannot be relicensed. The audio is the author's own and is not licensed for reuse.

- [LICENSE](LICENSE) — the split, and the MIT terms
- [data/LICENSE](data/LICENSE) — CC BY-SA 4.0, what it covers, how to attribute
- [ATTRIBUTION.md](ATTRIBUTION.md) — every upstream source: Perseus, ToposText, Wikipedia, Wikimedia Commons, Wikidata, Pleiades, Natural Earth, OpenStreetMap (ODbL), Mapterhorn, astronomy-engine, and the fonts

The ancient primary texts are **not** redistributed here — `research/corpus/manifest.json` pins their editions and checksums, and `pnpm corpus:sync` fetches them into a gitignored local corpus.
