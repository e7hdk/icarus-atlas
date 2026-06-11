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
