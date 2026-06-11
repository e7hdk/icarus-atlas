# CLAUDE.md — Icarus Atlas

## What this project is

Icarus Atlas is an interactive **galaxy of Greek mythology**: every figure — gods, goddesses, titans, primordials, heroes, mortals, nymphs, creatures — is a star. The galaxy is rendered in 3D (React Three Fiber). Hovering a star shows a summary card (type, domains, story excerpt, related characters with highlighted relation lines); clicking flies the camera to the star and opens the full story panel. A global **source lens** (Hesiod, Homer, Apollodorus, …) re-shapes genealogies and stories per ancient author, because the ancient sources contradict each other — the contradictions are a feature, not a bug.

## Hard rules

1. **Language**: Chat with the user is in Turkish. EVERYTHING else is English — code, comments, commit messages, branch names, documentation, data content, UI copy, error messages. No exceptions.
2. **Source attribution**: every mythological fact in the data layer carries `sources: SourceId[]`. Never present a disputed fact as undisputed; never invent attributions. If a fact is genuinely universal across our sources, tag all relevant sources, not an empty array.
3. **Incremental data**: characters are added in small, verified batches (see docs/PLAN.md milestones). Never bulk-import unverified mythology data.
4. **UI quality bar is high**: animations must be smooth (60fps target), interactions deliberate. Prefer fewer, polished features over many rough ones.

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

## Current status

See docs/PLAN.md for the milestone roadmap and decision log (chosen options are recorded there). Research catalogs: docs/SOURCES.md (7 author lenses), docs/CHARACTERS.md (M1 roster of 30 + data-entry conventions), docs/CONTRADICTIONS.md (16 verified inter-author disputes).
