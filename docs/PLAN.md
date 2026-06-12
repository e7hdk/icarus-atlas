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
| Expansion batch 1 | Night court: 14 figures from the house of Nyx and Erebus, plus Themis to complete the Moirai parentage dispute (45 total characters) | 2026-06-11 |
| Character page IA | Three modes per character: **The Poets** (`/character/[id]` — the ONLY place the source lens appears; relation orrery with category rings: parents / siblings / children / loves / wars; names revealed on demand), **Information** (`/info` — neutral encyclopedic reference), **Legacy** (`/legacy` — own route, room to grow). Data split accordingly: `data/reference/` (encyclopedic) and `data/culture/` (artworks only) | 2026-06-11 |
| Expansion batch 2 | The first humans: 11 figures — the missing Iapetionids (Epimetheus, Menoetius) with both rival Oceanid mothers (Clymene, Asia), the anthropogony and flood line (Pandora, Pyrrha, Deucalion, Hellen), and the Argive first-man tradition (Phoroneus, Inachus, Melia). 56 total characters; first `mortal` and `nymph` stars; new `mortal-arm` cluster | 2026-06-12 |
| Expansion batch 3 | The Pelopid curse: 12 figures from Tantalus and Plouto through Pelops, Niobe and Broteas to the Oenomaus–Myrtilus race and the Atreus–Thyestes feud. 68 total characters; four newly documented source disputes | 2026-06-12 |
| Expansion batch 4 | The two royal houses: 14 figures from Pelopia and Aegisthus through Agamemnon, Menelaus, their children, Pylades and Orestes' marriages. 82 total characters; five newly documented source disputes | 2026-06-12 |
| Expansion batch 5 | The elder Titans: Coeus, Crius, Hyperion, Theia, Mnemosyne, Phoebe and source-disputed Dione. 89 total characters; Hesiod's first-generation twelve complete, with three newly documented genealogy disputes | 2026-06-12 |
| Expansion batch 6 | The younger Titans: Asteria, Astraeus, Pallas, Perses, Eos, Helios and Selene. 96 total characters; the standard two-generation Titan roster is complete with no dangling relation endpoints | 2026-06-12 |
| Galaxy placement | Deterministic genealogy layout: mythic generation controls radius, family branches share a bounded angular neighborhood, sibling lanes add vertical volume, and a packing pass enforces minimum star separation without changing generation order | 2026-06-12 |
| Expansion batch 7 | The house of Troy: 23 figures — Dardanus through the royal line (Erichthonius, Tros, Ilus, Assaracus, Capys, Anchises, Laomedon, Priam) to the war court (Ganymede, Tithonus, Hecuba, Hector, Paris, Cassandra, Aeneas, Andromache) plus Hesione, Deiphobus, Helenus, Troilus, Polyxena and Creusa. 196 total characters; the whole dynasty resides in Troy's city sky; Troy lineage (`data/lineages/troy.json`), Troad map region over the Anatolian coast, "The House of Troy" saga + "Judgment of Paris" episode, 8 new Legacy galleries. Corpus-verified by parallel agents; two new documented disputes (`deiphobus-slayer`, `troilus-paternity`), the rest kept in prose (Ganymede's father and abductor, Hecuba's father, Laomedon's broken wages) | 2026-06-12 |
| Cosmos layout | Three meaning-bearing axes: radius = mythic generation, angle = dynasty (sunburst wedges + per-generation spiral twist), height = cosmological realm (ouranic/upper/mortal/chthonic bands). Deterministic constrained relaxation with consort binaries and adversary repulsion; hard separation floor enforced by a resolution pass that may stretch realm bands but never the generation radius. City skies reuse the engine in compact mode | 2026-06-12 |
| Stories feature | Myths as narratives, the third main tab (GALAXY · AREAS · STORIES). Nested story tree (saga → episode), sourced chapters with citations and dispute topics, cast/places with promote-later links to characters and cities, "Told in" attestations of the ancient works. Pilot batch: cosmogony, great flood, Seven Against Thebes, Trojan War, Rhesus | 2026-06-12 |
| Areas feature | Interactive 2D Mediterranean map (`/areas`, AREAS entry on the HUD): two-level classical regions with animated zoom; cities carry sourced, lens-aware royal lineages (plain attested names allowed until promoted to characters); each city opens a 3D "city sky" reusing the galaxy engine and the same genealogical layout, populated via a new sourced `residences` field. Far-myth locations (Colchis, Egypt, Italy/Sicily) included as edge markers. Flagship cities: Thebes, Mycenae, Argos, Athens, Sparta, Troy. Basemap from compatibly-licensed geodata (Wikimedia CC / Natural Earth public domain), city coordinates from the Pleiades gazetteer (CC BY) | 2026-06-12 |

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
- Default lens: `consensus` while legacy multi-source paragraphs are being split into source-atomic facts. The lens will be stored in the URL (`?lens=homer`) for shareability when the selector lands.

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
- **Night court**: a steep, thick orbit around the core for Nyx, Erebus and their personified children.
- **Golden band**: the Olympians.
- **Outer arms** (later milestones): heroes, mortals, nymphs, creatures — clustered by saga (Trojan arm, Argonaut arm, Theban arm…) and domain (sea cluster near Poseidon/Oceanus, underworld cluster near Hades/Nyx).

Position rules (the "cosmos layout"):

1. **Radius = mythic time, on the "mortal clock".** Gods are timeless: divine figures (primordial/titan/olympian/god/nymph) keep Hesiod's cosmic ages in the inner rings, computed only over divine→divine parent steps. Mortal-time figures (hero/mortal/creature) all start at one shared base ring just outside the youngest god — a dynasty's distance from the core measures its own mortal generations, not where it happens to touch a god. Only mortal→mortal steps advance the clock; a figure with no mortal parent (Helen, daughter of timeless Zeus) joins the ring of their earliest consort. Every sourced chronological parent edge still pushes the child visibly farther out, and outer rings compress so deep king-lists (the 12-step Argive chain) stay on canvas. Known limit: chains of different granularity still drift apart (Perseus's 9 mortal steps vs Hector's 6) — fixing that needs the era-synchronism milestone below.
2. **Angle = dynasty.** The family forest is laid out as a sunburst: each root dynasty gets an angular wedge proportional to its subtree, children subdivide their parent's wedge, and lone spouses adopt their partner's wedge. A uniform per-generation twist (differential rotation) turns every lineage into a spiral arm — follow the arm, follow the bloodline.
3. **Height = cosmological realm.** Ouranic figures ride above the disc plane, the lesser divine band sits under them, heroes and mortals hold the plane, and the chthonic court hangs below — the three-storey Greek cosmos as the y-axis.
4. **Constrained relaxation.** A deterministic force pass polishes spacing: consort pairs settle into close binaries (`2.1` floor), lovers and siblings attract gently, adversaries and slayers repel; every iteration projects stars back inside their generation ring, dynasty wedge and realm band.
5. **Hard separation floor.** A resolution pass guarantees `3.6` world units between unrelated stars; if a neighbourhood is packed it stretches the realm band vertically (bounded) — never the generation radius.
6. Positions are deterministic and lens-independent, so switching sources rewires facts and relations without rearranging the sky. City skies reuse the engine in compact mode (generations remapped to start at zero).

Run `pnpm validate-layout` after character or relation edits. It verifies generation order, dynasty-wedge containment, realm bands, the separation floors (with the consort-binary exemption), determinism, and the Zeus–Tantalus–Pelops example.

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
- **M1.5 — The night court**: +15 verified characters (Aether, Hemera, Moros, Thanatos, Hypnos, Momus, Oizys, Nemesis, Apate, Geras, Eris, Themis, Clotho, Lachesis, Atropos), source-rewired parentage, and a dedicated 3D cluster. ✅
- **M1.6 — The character codex**: `/character/[id]` in three modes (Poets with lens + relation orrery, Information, Legacy), SSG for all 45 characters, reference/culture data split. ✅
- **M1.7 — The first humans**: +11 verified characters (Epimetheus, Menoetius, Clymene, Asia, Pandora, Pyrrha, Deucalion, Hellen, Phoroneus, Inachus, Melia), 10 new documented contradictions (`iapetionid-mother`, `fire-bringer`, `flood-landing`, …), first `mortal`/`nymph` stars, new `mortal-arm` cluster. ✅
- **M1.8 — The Pelopid curse**: +12 verified characters (Tantalus, Plouto, Pelops, Niobe, Broteas, Hippodamia, Oenomaus, Myrtilus, Atreus, Thyestes, Aerope, Chrysippus), 4 new documented contradictions, and a connected source-lensed dynasty from Zeus to the Atreid feud. ✅
- **M1.9 — The two royal houses**: +14 verified characters (Pelopia, Aegisthus, the younger Tantalus, Agamemnon, Menelaus, Clytemnestra, Helen, Orestes, Electra, Iphigenia, Chrysothemis, Hermione, Erigone, Pylades), 5 new documented contradictions, and deterministic genealogy-aware 3D placement. ✅
- **M1.10 — The elder Titans**: +7 verified characters (Coeus, Crius, Hyperion, Theia, Mnemosyne, Phoebe, Dione), completing Hesiod's first-generation Titan roster and preserving Dione's disputed generation. ✅
- **M1.11 — The younger Titans**: +7 verified characters (Asteria, Astraeus, Pallas, Perses, Eos, Helios, Selene), completing the standard two-generation Titan genealogy. ✅
- **M2 — The lens**: lens selector + consensus mode, animated edge re-routing, dispute badges, URL state. Contradiction catalog from docs/CONTRADICTIONS.md drives at least 8 visible disputes.
- **M3 — Find your way**: ⌘K search, type filters, performance pass (instancing, LOD), mobile fallback (2D touch mode or guarded experience).
- **M4 — Expansion: Titanomachy & heroes**: +~30 characters (remaining titans, major heroes), saga clusters, relation-hop navigation polish.
- **M5 — Depth**: comparison view ("this fact across all 7 authors"), character page routes for SEO/sharing, family-tree overlay mode.
- **M6+ — The long sky**: nymphs, creatures, mortals in verified batches; community-proof data pipeline (validator gates in CI).
- **M7 — The Wikipedia Lens**: Add a modern encyclopedic lens for pure, synthesized facts alongside ancient sources.
- **M8 — Cultural Expansion**: Expand entity data to include their cultural legacy: related artworks, films, music, pop culture, and historical artifacts.
- **M9 — Areas, the map** (in progress):
  - **M9.1 — Map shell**: `/areas` route + AREAS HUD entry; themed Mediterranean basemap from a licensed, attributed source; two-level region geometry (mainland regions + Peloponnese sub-regions at minimum); hover glow; animated click-to-zoom; free roam (wheel zoom to cursor + drag pan). ✅
  - **M9.2 — Cities & lineages** (in progress): markers for the six flagship cities (Thebes, Mycenae, Argos, Athens, Sparta, Troy) with lineage panels — sourced, lens-aware reigns, ⚖ disputes, plain-name rulers allowed; edge markers for far locations (Colchis, Egypt, Italy/Sicily). _Done: six Pleiades-verified city stars (always visible, names on region focus or deep zoom), CityPanel, corpus-verified Thebes lineage (13 reigns, 3 documented disputes). Next: remaining five lineages, far-location edge markers._
  - **M9.3 — City skies**: `/city/[id]` 3D mini-galaxy reusing the galaxy engine and genealogical layout; `residences` field with corpus-verified backfill for flagship-city residents; validator gains geo/lineage/residence referential checks.
- **M11 — Era synchronisms**: calibrate the mortal clock across dynasties with sourced synchronism anchors ("Tlepolemus son of Heracles fought at Troy", Hom. Il. 2.653-670; "Heracles sacked Troy in Laomedon's reign", Il. 5.640-651; the Perseid→Pelopid succession at Mycenae) — generations become a constraint solve so contemporaries share a ring regardless of king-list length. Unlocks properly once the Heracles batch lands.
- **M10 — Stories** (in progress):
  - **M10.1 — Foundations**: story schema (nested saga/episode tree, sourced chapters, cast/places with promote-later links, attestations), `/stories` + `/story/[id]` routes, GALAXY · AREAS · STORIES main nav, validator checks. Pilot: cosmogony, great flood, Seven Against Thebes, Trojan War, Rhesus. ✅
  - **M10.2 — The cycle shelves**: more sagas in verified batches (Titanomachy, Argonautica, the Theban cycle complete, the Returns), stories cross-linked from character and city pages, cultural artworks for stories.

Each milestone ends with: `pnpm lint && pnpm build && pnpm validate-data && pnpm validate-layout` green + a manual UX review together.

## 9. Risks & guards

- **Data quality**: mythology is genuinely messy → every fact sourced, validator enforces structure, contradictions documented before being surfaced in UI.
- **Performance**: bloom + many lights is expensive → one bloom pass, emissive materials instead of real lights, instanced background stars, capped device pixel ratio.
- **Scope creep**: the "all of mythology" temptation → roster changes only at milestone boundaries (docs/CHARACTERS.md is the gate).
- **WebGL availability**: graceful fallback message + (M3) reduced 2D mode.
