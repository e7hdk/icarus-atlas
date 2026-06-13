# CLAUDE.md — Icarus Atlas

## What this project is

Icarus Atlas is an interactive **galaxy of Greek mythology**: every figure — gods, goddesses, titans, primordials, heroes, mortals, nymphs, creatures — is a star. The galaxy is rendered in 3D (React Three Fiber). Hovering a star shows a summary card (type, domains, story excerpt, related characters with highlighted relation lines); clicking flies the camera to the star and opens the full story panel. A global **source lens** (Hesiod, Homer, Apollodorus, …) re-shapes genealogies and stories per ancient author, because the ancient sources contradict each other — the contradictions are a feature, not a bug.

## Hard rules

1. **Language**: Chat with the user is in Turkish. EVERYTHING else is English — code, comments, commit messages, branch names, documentation, data content, UI copy, error messages. No exceptions.
2. **Source attribution**: every mythological fact in the data layer carries `sources: SourceId[]`. Never present a disputed fact as undisputed; never invent attributions. If a fact is genuinely universal across our sources, tag all relevant sources, not an empty array.
3. **Incremental data**: characters are added in small, verified batches (see docs/PLAN.md milestones). Never bulk-import unverified mythology data.
4. **UI quality bar is high**: animations must be smooth (60fps target), interactions deliberate. Prefer fewer, polished features over many rough ones.
5. **Research local-first**: before web research for any character, relation or contradiction, search the pinned local corpus with `pnpm corpus:search`. Use its citation-bearing passages for discovery, compare relevant source lenses, and verify against the original-language edition when available. Use the web only when the corpus lacks the work or passage, the reading is ambiguous, or independent verification is needed. Corpus hits are research evidence, never automatically generated application data.
6. **Cosmos layout**: the galaxy is a meaning-bearing coordinate system — radius = mythic time under the "mortal clock" (gods are timeless: divine figures keep Hesiod's cosmic ages in the inner rings, every dynasty leaves eternity at one shared mortal base ring, and only mortal→mortal steps advance the clock; parents always stay inside descendants), angle = dynasty (sunburst wedges sized by subtree, a uniform per-generation twist turns lineages into spiral arms), height = cosmological realm (ouranic above the disc, lesser divine band, mortal plane, chthonic below). A deterministic constrained relaxation polishes spacing — consort pairs orbit as close binaries, adversaries repel — but may never break generation order, wedge bounds, or the separation floor. City skies reuse the engine in compact mode. Run `pnpm validate-layout` after character or relation edits.
7. **Check before adding**: before entering ANY new character (or referencing a relation endpoint), check whether it — or a same-name figure — already exists in `data/characters/`. Greek myth is dense with homonyms (three Aeoluses, four Actors, two Cephaluses, an Aeolid `epopeus` vs the existing Sicyonian one). Never silently duplicate an id, and never merge two distinct figures under one node just because they share a name: give homonyms disambiguated ids (`alcyone-aeolid`, `glaucus-corinth`, `orestes-aeolid`) and link relations to the correct existing node. Each dynasty dossier (e.g. docs/AEOLUS_DYNASTY.md) must carry a same-name hazard map and an existing-node-collision list resolved before its batch is written.

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS
- Three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (bloom for star glow)
- `zustand` for client state (active lens, selection, camera target)
- `zod` for data validation; JSON data files under `data/`
- Package manager: **pnpm**

## Commands

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` / `pnpm lint`
- `pnpm validate-data` — zod + referential-integrity check of `data/` (run after ANY data edit)
- `pnpm corpus:sync` / `pnpm corpus:verify` — download and verify the pinned local source corpus
- `pnpm corpus:search <query>` — search citation-bearing local passages before web research
- `pnpm validate-layout` — generation ordering, family proximity, and deterministic-position checks

## Directory map

```
src/
  app/                  # Next.js routes
    character/[id]/     # character codex: Poets (page.tsx), info/, legacy/
  components/
    galaxy/             # R3F scene: GalaxyCanvas, StarField, Star, CameraRig, effects
    character/          # CharacterShell, PoetsView, RelationOrrery (codex routes)
    hud/                # 2D overlay: TopBar, LensSelector, Legend, SearchOverlay
    panels/             # HoverCard, CharacterPanel (full story), RelationList
  features/
    lens/               # source-lens state + fact-filtering logic
    characters/         # character loading, relation/ring grouping
    search/             # name search
  lib/                  # utils, zod schemas, three helpers
  types/                # shared TS types (character.ts is the contract)
data/
  sources.json          # the 7 ancient source authors
  characters/*.json     # one file per character (sourced mythology)
  relations.json        # relation edges, each tagged with sources
  reference/*.json      # neutral encyclopedic facts (Information tab; CC BY-SA attributed)
  culture/*.json        # cultural legacy items, artworks for now (Legacy page)
  stories/*.json        # myths as stories: sourced chapters, cast, places, attestations
  geo/                  # regions.json, cities.json (Pleiades CC BY), generated basemap.json
  lineages/*.json       # per-city royal successions, sources-tagged reigns
docs/                   # PLAN.md (roadmap), SOURCES.md, CHARACTERS.md, CONTRADICTIONS.md
mockups/                # static theme mockups (design artifacts, not app code)
scripts/                # validate-data.ts and other maintenance scripts
```

## Character page rule

The source lens appears in exactly ONE place: the "told after" selector on the Poets tab. Information and Legacy are lens-independent by design. Never scatter per-author labels through running prose — citations live in hover footnotes, disputes as a quiet ⚖ marker.

## Data model in one paragraph

A "fact" (a summary sentence, a story paragraph, a relation edge) is text/edge + `sources` + optional `citation` (e.g. "Theogony 188–206"). The active lens filters facts: a fact is visible under lens L if `sources` includes L; the special `consensus` lens shows the union and marks conflicting facts with a dispute badge. Character type (primordial | titan | olympian | god | hero | mortal | nymph | creature) drives the star's glow color — the palette lives in `src/types/character.ts` and docs/PLAN.md and must stay in sync with the chosen theme.

## Theme

Decided: **Aether Nebula** (vivid nebula cosmos, glassmorphism panels, neon type glows) paired with **classical serif typography** (Cinzel for display, Cormorant Garamond for body). All design tokens live in `src/styles/theme.css` (Tailwind v4 `@theme`); WebGL star colors mirror them in `TYPE_GLOW` (`src/types/character.ts`) — keep the two in sync. Build UI from the primitives in `src/components/ui/` (GlassPanel, TypeBadge, …) instead of ad-hoc styling, so the theme stays controllable from one place.

## Feature in progress: Areas — the map & city skies

Geography becomes the second major axis beside the galaxy. Status: IN PROGRESS — milestones live in docs/PLAN.md §8 (M9.1 map shell → M9.2 cities & lineages → M9.3 city skies). Decisions locked: far-myth locations (Colchis, Egypt, Italy/Sicily) appear as edge markers; lineage rulers may stay plain attested names until promoted; city skies reuse the same genealogical layout engine; flagship cities are Thebes, Mycenae, Argos, Athens, Sparta, Troy.

- **Entry**: an "AREAS" item on the main HUD opens `/areas` — an interactive 2D SVG map of the Mediterranean, centered on Greece and the Aegean (Troy/Asia Minor coast included; the wider Med stays as context backdrop).
- **Regions, two levels**: classical regions as the top level (Peloponnese, Attica, Boeotia, Thessaly, Crete, …), sub-regions inside (Peloponnese → Arcadia, Laconia, Messenia, Argolis, Elis, Achaea, Corinthia). Hover highlights a region; click flies the map in (animated viewBox/transform zoom — the 2D analogue of the camera rig, same 60fps bar, `vector-effect: non-scaling-stroke` so strokes survive zoom).
- **Cities**: each region holds its ancient cities as glowing markers. Clicking a city opens its **lineage panel**: the royal succession (who ruled, in order). King lists are sourced, lens-aware facts — the ancient authors disagree on them, so reigns carry `sources` and disputed links get the ⚖ treatment like everything else.
- **City sky**: from the lineage panel you dive into `/city/[id]` — a separate 3D mini-galaxy reusing the existing galaxy components, holding only the characters who lived in that city (residents, not just rulers). A character with several residences appears in every matching city sky.
- **Data layer**:
  - `data/geo/regions.json` + `data/geo/cities.json` — region tree and city points. City coordinates come from the Pleiades gazetteer (CC BY, store `pleiadesId`, attribute like reference data); map geometry adapted from a compatibly-licensed source (Wikimedia CC BY-SA SVG and/or Natural Earth public-domain coastline projected to SVG paths at build time).
  - `data/lineages/<city>.json` — ordered reigns, each `sources`-tagged with optional `citation`/`topic`. A ruler may be a plain attested name until promoted to a full character in a verified batch.
  - Characters gain `residences: { city: CityId; sources: SourceId[] }[]` — a sourced fact like any other (hard rule 2 applies; backfill via the corpus, hard rule 5).
  - `pnpm validate-data` grows checks: region/city referential integrity, lineage ruler refs, residence city refs.

## Feature: Stories — the mythic sagas

The third door beside Galaxy and Areas (the main HUD carries a GALAXY · AREAS · STORIES nav). A story (`data/stories/*.json`) is a myth told as a narrative: a sourced `summary`, ordered `chapters` (each `sources`-tagged with optional `citation`/`topic` — hard rule 2 applies, research via the corpus per hard rule 5), a `cast` (entries link to characters via optional `id`, or stay plain attested names until promoted), `places` (optional city `id` links to the city codex), and `attestations` — the ancient works that tell the story ("Told in"). Stories nest: an episode (e.g. Rhesus) points at its parent saga (the Trojan War) via `parent`. Routes: `/stories` (era-ordered index, episodes nested under their saga) and `/story/[id]`. `pnpm validate-data` checks story schema, parent/cast/place references, and folds chapter topics into the dispute gate.

## Current status

See docs/PLAN.md for the milestone roadmap and decision log (chosen options are recorded there). Research catalogs: docs/SOURCES.md (7 author lenses), docs/CHARACTERS.md (M1 roster of 30 + data-entry conventions), docs/CONTRADICTIONS.md (16 verified inter-author disputes).
