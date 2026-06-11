# Icarus Atlas — Project Plan

> A galaxy of Greek mythology. Every figure is a star; every story has more than one teller.

## 1. Vision

An explorable 3D galaxy where all of Greek mythology lives: primordials at the bright core, titans on the inner ring, Olympians on a golden band, heroes / nymphs / mortals / creatures along the outer arms. Stars glow by character type. Hovering reveals who someone is and who they are bound to; clicking flies you to their star and unfolds their full story. A global **source lens** lets you read the whole sky "according to Hesiod" or "according to Homer" — genealogy lines literally re-wire when you switch, because the ancient authors disagree, and that disagreement is the most interesting thing we can show.

## 2. Decision log

| Decision | Choice | Date |
|---|---|---|
| Rendering | Full 3D WebGL — Next.js + React Three Fiber | 2026-06-11 |
| Milestone-1 scope | Core set, 30 characters (26 + Leto, Iapetus, Erebus, Tethys added after roster review) | 2026-06-11 |
| Hover UX | Summary card on hover; click = camera fly-to + full story panel | 2026-06-11 |
| Source system | Global lens selector + Consensus mode with dispute badges | 2026-06-11 |
| Theme | Aether Nebula (mockup B) visuals + classical serif typography (Cinzel display, Cormorant Garamond body). Tokens centralized in `src/styles/theme.css`; UI built from reusable primitives in `src/components/ui/` | 2026-06-11 |

## 3. The source-lens system

### 3.1 The 7 sources

| id | Author | Works | Period | Lens character |
|---|---|---|---|---|
| `hesiod` | Hesiod | Theogony, Works and Days | c. 700 BC | Cosmogony & divine genealogy — the default lens |
| `homer` | Homer | Iliad, Odyssey | c. 8th c. BC | Trojan cycle, the Olympians in action |
| `apollodorus` | Pseudo-Apollodorus | Bibliotheca | 1st–2nd c. AD | The systematic mythographer — widest coverage |
| `apollonius` | Apollonius of Rhodes | Argonautica | 3rd c. BC | The Argonaut cycle |
| `ovid` | Ovid | Metamorphoses | 8 AD | Roman retellings, transformations |
| `hyginus` | Hyginus | Fabulae, Astronomica | 1st–2nd c. AD | Catalogs, alternate versions, star myths |
| `pausanias` | Pausanias | Description of Greece | 2nd c. AD | Local cult variants and regional traditions |

(Validated and enriched in docs/SOURCES.md; candidates for later addition: Homeric Hymns, Pindar, Euripides, Nonnus.)

### 3.2 Mechanics

- Every fact (summary sentence, story paragraph, relation edge) carries `sources: SourceId[]` and optionally `citation` ("Theogony 188–206").
- Active lens `L` shows a fact iff `L ∈ sources`.
- `consensus` lens shows the union; facts whose topic has conflicting versions get a **dispute badge** ("2 traditions"). Conflicts are detected via a shared `topic` key on competing facts (e.g. `aphrodite-parentage`).
- Lens switching animates: relation lines fade out/in and re-route; story panel cross-fades.
- Default lens: `hesiod` (richest genealogy for the core set). The lens is in the URL (`?lens=homer`) for shareability.

## 4. Data model

```ts
type SourceId = 'homer' | 'hesiod' | 'apollodorus' | 'apollonius' | 'ovid' | 'hyginus' | 'pausanias';
type LensId = SourceId | 'consensus';
type CharacterType = 'primordial' | 'titan' | 'olympian' | 'god' | 'hero' | 'mortal' | 'nymph' | 'creature';

interface SourcedText {
  text: string;
  sources: SourceId[];
  citation?: string;
  topic?: string;        // shared key marks competing variants of the same fact
}

interface Character {
  id: string;            // kebab-case, e.g. "aphrodite"
  name: string;          // English display name
  greekName: string;     // "Aphroditē (Ἀφροδίτη)"
  romanName?: string;    // "Venus"
  type: CharacterType;
  domains: string[];
  epithets?: string[];
  summary: SourcedText[];  // hover card: pick best match for active lens
  story: SourcedText[];    // full story paragraphs, each tagged
  cluster: string;         // galaxy region (see §6)
}

interface Relation {
  id: string;            // "aphrodite-parent-uranus"
  type: 'parent' | 'consort' | 'sibling' | 'lover' | 'slayer' | 'creator' | 'ally' | 'adversary';
  from: string;          // child / agent side
  to: string;            // parent / patient side
  sources: SourceId[];
  topic?: string;        // competing edges share a topic ("aphrodite-parentage")
  note?: string;
}
```

Storage: JSON files under `data/` (one file per character), validated by `pnpm validate-data` (zod schemas + referential integrity: every relation endpoint exists, every source id is known, every topic with 2+ facts is flagged as a contradiction and must appear in docs/CONTRADICTIONS.md). This scales to ~1000 characters; if we outgrow JSON we lift the same schema into SQLite without API changes.

## 5. Character taxonomy & glow palette

Type drives the star material (color + emissive intensity + pulse rhythm):

| Type | Glow | Pulse |
|---|---|---|
| `primordial` | Pale violet-white | Very slow, deep breathing |
| `titan` | Ember orange | Slow, heavy |
| `olympian` | Radiant gold | Confident, brightest of all |
| `god` (other deities) | Silver blue | Steady |
| `hero` | Electric cyan | Quick flicker |
| `mortal` | Warm white, faint | Gentle |
| `nymph` | Emerald shimmer | Soft ripple |
| `creature` | Magenta-red | Irregular, unsettling |

The palette is the Aether Nebula set; it lives in two synced places: `src/styles/theme.css` (CSS tokens for UI) and `TYPE_GLOW` in `src/types/character.ts` (hex values for WebGL materials).

## 6. Galaxy layout

Spatial story = genealogical time:

- **Core**: Chaos at the very center; primordials (Gaia, Nyx, Uranus, Tartarus, Eros) in tight orbit.
- **Inner ring**: Titans (Cronus, Rhea, Oceanus, Prometheus, Atlas…).
- **Golden band**: the Olympians.
- **Outer arms** (later milestones): heroes, mortals, nymphs, creatures — clustered by saga (Trojan arm, Argonaut arm, Theban arm…) and domain (sea cluster near Poseidon/Oceanus, underworld cluster near Hades/Nyx).

Positions are precomputed (deterministic from id + cluster, stored at build time) so the galaxy is stable between visits; thousands of decorative background stars are instanced for depth.

## 7. UX specification

- **Idle**: slow galaxy drift, parallax on mouse move; type glows pulsing; faint dust.
- **Hover star**: star scales up; summary card appears (name, Greek name, type chip, domains, 2–3 sentence summary for active lens, bonds list); relation lines to bonded stars light up in type colors; disputed bonds render dashed with a badge.
- **Click star**: camera flies to the star (~0.9s, eased); side panel opens with the full story (paragraphs cited per source), epithets, all relations (clicking a relation flies onward — galaxy as hyperlink graph). `Esc` / back button zooms out.
- **Lens switch** (top bar): instant re-filter with animated line re-routing; "Consensus" shows union + dispute badges; hovering a badge previews the competing claims with citations.
- **Search** (`⌘K`): fuzzy name/epithet search, enter = fly to star.
- **Legend** (bottom): type → glow mapping, doubles as a type filter (dim non-matching stars).
- **Empty states**: characters not attested under the active lens dim to "unattested" ghost stars rather than disappearing (so the sky doesn't pop).

## 8. Milestones

- **M0 — Foundation (now)**: scaffold ✅, deps ✅, directory ✅, mockups ✅, theme decision, design tokens, data schema + validator, seed `sources.json`.
- **M1 — The core sky**: 26 core characters fully written (summary + story + relations, all sourced), R3F galaxy with type glows, hover cards, click fly-to, legend. No lens UI yet — data already sourced. _Roster review recommends 4 load-bearing additions (Leto, Iapetus, Erebus, Tethys → 30 total) so no genealogy edge dangles; see docs/CHARACTERS.md._
- **M2 — The lens**: lens selector + consensus mode, animated edge re-routing, dispute badges, URL state. Contradiction catalog from docs/CONTRADICTIONS.md drives at least 8 visible disputes.
- **M3 — Find your way**: ⌘K search, type filters, performance pass (instancing, LOD), mobile fallback (2D touch mode or guarded experience).
- **M4 — Expansion: Titanomachy & heroes**: +~30 characters (remaining titans, major heroes), saga clusters, relation-hop navigation polish.
- **M5 — Depth**: comparison view ("this fact across all 7 authors"), character page routes for SEO/sharing, family-tree overlay mode.
- **M6+ — The long sky**: nymphs, creatures, mortals in verified batches; community-proof data pipeline (validator gates in CI).

Each milestone ends with: `pnpm lint && pnpm build && pnpm validate-data` green + a manual UX review together.

## 9. Risks & guards

- **Data quality**: mythology is genuinely messy → every fact sourced, validator enforces structure, contradictions documented before being surfaced in UI.
- **Performance**: bloom + many lights is expensive → one bloom pass, emissive materials instead of real lights, instanced background stars, capped device pixel ratio.
- **Scope creep**: the "all of mythology" temptation → roster changes only at milestone boundaries (docs/CHARACTERS.md is the gate).
- **WebGL availability**: graceful fallback message + (M3) reduced 2D mode.
