# Lands — The Mythic Map (Areas Expansion Plan)

> **Status:** APPROVED direction, not yet started.  
> **Engine:** MapLibre GL JS (locked).  
> **Scope:** Maximum — Gibraltar (Pillars of Hercules) through full Anatolia, North Africa, and the wider Mediterranean myth-world. Timeline is not a constraint; quality and completeness are.  
> **Replaces:** the current SVG `MapView` once parity is reached; the old basemap pipeline remains as reference until cutover.

---

## 1. Vision

**Lands** is the second axis of Icarus Atlas: an explorable, Google-Maps-like map of the ancient Mediterranean and Near East where geography is mythology-bearing. Every attested place — city, sanctuary, river, mountain, plain, strait, myth-site — is a discoverable point on the map. Hover reveals who lived there and what happened; click opens a sourced panel and links outward to characters, stories, and (for royal cities) lineages and city skies.

The map must feel like **walking over a living atlas**: momentum pan, cursor-anchored zoom, deep zoom with progressive detail, layer toggles, search, shareable URLs, and story overlays that light up the geography of a saga.

This is not a GIS dump of Pleiades. It is a **curated, sourced, lens-aware mythic gazetteer** built in verified batches — the same discipline as character data.

---

## 2. Decision log

| Decision | Choice | Date |
|---|---|---|
| Map engine | **MapLibre GL JS** — vector tiles, custom Aether Nebula style, GeoJSON overlays for places/features | 2026-06-15 |
| Geographic extent | **Full basin:** ~6°W (Pillars / Atlantic edge) → ~44°E (Mesopotamia fringe), ~22°N (deep Sahara margin) → ~47°N (Black Sea north coast) | 2026-06-15 |
| POI taxonomy | Cities, sanctuaries, landmarks, mountains, passes, myth-sites + linear/areal features (rivers, lakes, plains, straits, gulfs) | 2026-06-15 |
| Data entry | Incremental verified batches; corpus-first research; Pleiades for coordinates (CC BY); never bulk-import unattributed POIs | 2026-06-15 |
| SVG MapView | Deprecate after MapLibre reaches feature parity; do not maintain two renderers long-term | 2026-06-15 |
| Tile hosting | **Self-hosted** vector/raster tiles generated at build time from Natural Earth + AWMC — no runtime dependency on CAWM tile servers (AWMC/CAWM remain attribution + source references for cultural linework) | 2026-06-15 |
| Uncertain locations | Places attested by name but not pin-able get `certainty: 'traditional' \| 'disputed'` and render as a **soft halo / dashed ring** at a consensus or regional anchor — never silently placed as precise fact | 2026-06-15 |
| 3D terrain | **MapLibre terrain + pitch (Option B)** — approved, **shipped in M9.10b after the flat 2D map is stable** (not day one). Full basin; stylized Aether Nebula DEM. **Relief** toggle in Settings: Off / Subtle / Dramatic; persisted. Default Subtle on desktop, Off on mobile | 2026-06-15 |
| Implementation order | **Start 2D flat** (M9.4) → POI & geography data (M9.5–M9.9) → roam UX (M9.10) → **then 3D terrain** (M9.10b) | 2026-06-15 |

---

## 3. Geographic extent

### 3.1 Bounding box (WGS84)

| Edge | Approx. | Rationale |
|---|---|---|
| West | 6°W | Pillars of Hercules, Atlantic approaches, Gades |
| East | 44°E | Euphrates/Tigris headwaters, Armenian highlands fringe |
| South | 22°N | Libyan/Egyptian desert margin, oases, Nile cataracts region |
| North | 47°N | Black Sea north coast, Danube (Ister) mouth approaches |

### 3.2 Top-level regions (target roster)

Existing Greek regions from `data/geo/regions.json` are retained and extended:

**Hellas & islands** (existing, refined): Peloponnese, Attica, Central Greece, Euboea, Thessaly, Epirus, Macedonia, Chalcidice, Ionian Islands, North/South Aegean, Crete, Thrace.

**Anatolia & Levant:** Troad (existing), Mysia, Lydia, Ionia, Caria, Lycia, Pamphylia, Cilicia, Pisidia, Phrygia, Bithynia, Paphlagonia, Pontus, Cappadocia, Armenia (mythic horizon), Syria, Phoenicia, Cyprus, Colchis (eastern Black Sea).

**North Africa:** Cyrenaica, Egypt (Lower/Upper), Libyan coast, Numidia, Mauretania, Atlas range.

**West & central Mediterranean:** Sicily, Magna Graecia (southern Italy), Sardinia, Corsica, Iberia (mythic: Tartessus, Gades).

**North & river basins:** Illyria, Paeonia, Scythia (horizon), **Ister** (Danube) basin, **Nile** basin.

**Synthetic / mythic horizons:** Hyperborea (edge marker only), Ethiopia (Homeric horizon), Elysium / Land of the Dead (non-geographic — story overlay only, never pinned as real coordinates).

---

## 4. Architecture

### 4.1 Stack

```
Build time                          Runtime (/areas)
──────────                          ────────────────
Natural Earth (CC0)                 MapLibre GL JS
AWMC GeoJSON (ODbL)        ──►      Custom vector style (Aether Nebula)
Copernicus DEM / SRTM               Raster-DEM source (Terrain-RGB tiles)
HydroSHEDS / rivers                 map.setTerrain({ source, exaggeration })
scripts/build-map-tiles.ts          GeoJSON source: places (clustered)
scripts/build-map-terrain.ts        GeoJSON source: features (rivers, etc.)
scripts/build-map-style.ts          GeoJSON source: regions (polygons)
                                    React: MapView, PlacePanel, LayerBar, StoryOverlay
data/geo/places.json                Settings: Relief Off / Subtle / Dramatic (persisted)
data/geo/features.json              URL state: ?place=delphi&z=9&layers=…
```

### 4.2 Directory layout (target)

```
data/geo/
  regions.json          # extended region tree + blurbs (existing, grow)
  cities.json           # DEPRECATED → subset of places.json (keep alias during migration)
  places.json           # all point POIs
  features.json         # rivers, lakes, plains, straits, gulfs
  lineages/<city>.json  # royal successions (existing)
  tiles/                # generated vector tile tree (gitignored or committed — TBD at M9.4)
  style/                # MapLibre style JSON fragments
  attributions.json     # stacked credits (Natural Earth, AWMC, Pleiades, HydroSHEDS)

scripts/
  build-basemap.ts      # LEGACY — retired after M9.4 cutover
  build-map-tiles.ts    # NEW — tippecanoe / vector tile generation
  build-map-terrain.ts  # NEW — Copernicus/SRTM → Terrain-RGB raster tiles
  build-map-style.ts    # NEW — Aether Nebula MapLibre style from theme tokens

src/
  components/map/
    MapView.tsx         # REWRITE — MapLibre root
    PlacePanel.tsx      # generalizes CityPanel
    LayerBar.tsx
    StoryMapOverlay.tsx
    Minimap.tsx
  features/geo/
    load.ts             # load places, features, style manifest
    spatial.ts          # viewport queries, fly-to helpers
  types/geo.ts          # extended types
```

### 4.3 MapLibre style — Aether Nebula

Visual language must match the galaxy and UI:

- **Base:** deep cosmos navy `#08041d`, land `#170e38`, foreign/shore `#0d0726`
- **Water:** cosmos deep with subtle nebula gradient; not realistic blue
- **Coastline:** thin aether stroke + optional outer violet halo (desktop only)
- **Regions:** nebula hue fills at low opacity; brighten on hover; no modern admin borders
- **Rivers:** emissive cyan trace at mid zoom; widen slightly on hover
- **Mountains:** triangular peak glyphs or short ridge ticks; gold/violet by sacredness tier
- **Labels:** Cinzel uppercase, letter-spaced; collision-aware via MapLibre symbol layers
- **POI glow:** type-colored halos mirroring character `TYPE_GLOW` where a deity/hero anchor exists

Theme tokens sync from `src/styles/theme.css` into style generation — same rule as WebGL stars.

### 4.4 3D terrain (Option B — later milestone, toggleable)

**Not in the first slice.** M9.4 ships a **flat 2D** MapLibre map (pitch locked 0°, no DEM). Once pan/zoom, style, places, and features are stable (through M9.10), **M9.10b** adds terrain for the full basin. The user can then turn it off in Settings if they prefer flat or need better performance.

**Build pipeline (`scripts/build-map-terrain.ts`):**

- Source: Copernicus GLO-30 or SRTM 1″ (public-domain / compatible) clipped to §3.1 bounds
- Output: MapLibre-compatible **Terrain-RGB** raster tiles (self-hosted under `data/geo/tiles/terrain/`)
- Hillshade raster derived from the same DEM, tinted to nebula palette (desaturated violet-navy — not grey satellite relief)

**Runtime (`MapView.tsx`):**

```ts
map.setTerrain({ source: 'terrain-rgb', exaggeration: relief === 'dramatic' ? 1.6 : 1.25 });
map.setPitch(relief === 'off' ? 0 : relief === 'dramatic' ? 55 : 35);
```

**Relief modes (Settings panel + `useGalaxyStore` or dedicated `useLandsStore`, persisted):**

| Mode | Terrain mesh | Pitch | Exaggeration | Default |
|---|---|---|---|---|
| **Off** | disabled (`setTerrain(null)`) | 0° | — | mobile first visit |
| **Subtle** | on | ~35° | 1.25 | desktop first visit |
| **Dramatic** | on | ~55° | 1.6 | user opt-in |

- POI markers and labels stay **billboard-anchored** to coordinates; myth POIs never “sink into” mesh errors
- Overview zoom (0–3): auto-flatten pitch to 0° regardless of mode — readability first
- Deep zoom fly-to: brief pitch ramp for “walking” feel
- `prefers-reduced-motion`: no pitch animation; snap to Off or Subtle

### 4.5 Zoom level design (LOD)

| Zoom | User sees |
|---|---|
| 0–2 | Full basin; top-level regions only; major rivers (Nile, Ister, Euphrates); no city labels |
| 3–4 | Sub-regions; mountain ranges; straits (Hellespont, Corinth); flagship cities as unlabeled dots |
| 5–7 | City names; sanctuary markers; regional river names |
| 8–10 | All curated places; feature labels; myth-site markers |
| 11–14 | Full label density; character/story chips on selection; "street-level" myth prose in panel |
| 15+ | Reserved — only if we add site-scale polygons (e.g. acropolis outline) later |

**Clustering:** MapLibre `cluster` on `places` source below zoom 8; uncluster on deep zoom.

**Progressive disclosure:** `importance: 'flagship' | 'major' | 'minor' | 'obscure'` on each place controls min zoom for icon + label.

---

## 5. Data model

### 5.1 Place (point POI) — `data/geo/places.json`

```ts
type PlaceKind =
  | 'city'
  | 'sanctuary'
  | 'landmark'
  | 'mountain'
  | 'pass'
  | 'myth-site'
  | 'region-capital';   // optional: eponymic nymph/settlement

type PlaceCertainty = 'fixed' | 'approximate' | 'traditional' | 'disputed';

interface GeoPlace {
  id: string;                    // kebab-case; homonyms suffixed (thebes-egypt)
  name: string;
  greekName: string;
  kind: PlaceKind;
  region: string | null;           // regions.json id; null for far-myth
  coordinates: [number, number];   // [lon, lat] WGS84
  certainty: PlaceCertainty;
  pleiadesId?: string;             // when pinned via Pleiades (CC BY)
  importance: 'flagship' | 'major' | 'minor' | 'obscure';
  summary: SourcedText[];          // hover card
  story?: SourcedText[];             // full panel prose (optional)
  characterIds?: string[];         // links to data/characters
  storyIds?: string[];             // links to data/stories
  deityIds?: string[];             // sanctuaries: primary cult
  cityId?: string;                 // when this place IS a city with lineage + sky
  topics?: string[];               // link to docs/CONTRADICTIONS.md topics
}
```

**Migration:** each current `cities.json` entry becomes a `GeoPlace` with `kind: 'city'`, `cityId` = `id`, `importance: 'flagship'`.

### 5.2 Feature (linear / areal) — `data/geo/features.json`

```ts
type FeatureKind = 'river' | 'lake' | 'plain' | 'strait' | 'gulf' | 'mountain-range';

interface GeoFeature {
  id: string;
  name: string;
  greekName: string;
  kind: FeatureKind;
  geometry: {
    type: 'LineString' | 'Polygon';
    coordinates: number[][] | number[][][];  // WGS84
  };
  region: string | null;
  summary: SourcedText[];
  characterId?: string;            // river-god, nymph, etc.
  placeIds?: string[];               // cities on this feature
  importance: 'major' | 'minor';
  sources: SourceId[];             // attestation that this feature matters in myth
}
```

### 5.3 Region — `data/geo/regions.json` (extended)

Existing schema unchanged. Add parent/child entries for Anatolian, African, and western regions per §3.2.

### 5.4 Lineage & city sky (unchanged contract)

- `data/lineages/<city>.json` — royal successions; only for `kind: 'city'` places with `cityId`.
- `residences` on characters — corpus-verified; validator checks `cityId` refs.
- `/city/[id]/sky` — reuses galaxy engine; grows as cities are added.

### 5.5 Story ↔ map linking

Extend `data/stories/*.json` `places` entries to reference `places.json` ids (already partially done). Add optional `features` array for river/route overlays (e.g. Argonautica voyage).

New optional story field:

```ts
interface StoryPlaceRef {
  id?: string;           // GeoPlace id
  name: string;          // plain attested name if not yet promoted
  role: string;
  featureId?: string;    // route segment
}
```

### 5.6 Validation (`pnpm validate-data`)

New checks:

- Every `places[].characterIds` / `storyIds` / `deityIds` / `cityId` resolves
- Every `features[].characterId` / `placeIds` resolves
- `cities.json` ids ⊆ `places.json` where `kind === 'city'`
- Lineage `city` matches a place with `cityId`
- `coordinates` within §3.1 bounds (warn if outside)
- `certainty: 'fixed'` requires `pleiadesId` OR explicit `{ citation, sources }` in summary
- Homonym guard: duplicate `(name, kind)` within 50 km triggers review flag

---

## 6. UX specification

### 6.1 Core interactions

- **Pan:** drag + **momentum** (inertia decay ~800 ms)
- **Zoom:** wheel / pinch toward cursor; smooth double-click zoom-in
- **Hover:** place/feature glow; lightweight tooltip (name + one-line summary for active lens)
- **Click place:** `PlacePanel` slides in — summary, story excerpt, linked characters, stories, lineage link (cities), "Open city sky" (cities)
- **Click feature:** feature panel — river-god, myth episodes along the course
- **Click region:** fly-to region bounds (reuse bbox from vector layer metadata)
- **ESC / back:** panel close → zoom out one level → overview
- **⌘K:** unified search adds **Places** tab (name, greekName, epithet, region)
- **URL state:** `/areas?place=delphi&z=9.5&lon=…&lat=…&layers=cities,sanctuaries,rivers`

### 6.2 Layer bar

Toggle groups:

- Cities · Sanctuaries · Landmarks · Mountains · Myth sites
- Rivers · Lakes · Plains · Straits
- Regions (fill) · Region labels
- **Story overlay** (when navigated from a story page)

### 6.3 Story overlay mode

From `/story/[id]`, "Show on map" flies to bounds of all referenced places/features, tints non-cast geography, draws optional route polyline (Argonautica, Odysseus wanderings, Seven Against Thebes march).

### 6.4 Cross-links

| From | To |
|---|---|
| Character panel | "Show on map" → residences + myth-sites |
| Story page | Story overlay on Lands |
| Place panel | Character codex, story reader, city sky |
| Galaxy (future) | Optional "realms on earth" deep link for place-tied figures |

### 6.5 Relief control (Settings)

Same surface as galaxy music/spacing — **Atlas Settings** panel on `/areas`:

- **Relief:** Off · Subtle · Dramatic (segmented control)
- Persisted to localStorage (key shared with atlas settings store)
- Changing mode animates pitch/terrain over ~400 ms (respects reduced motion)
- Mobile: default Off; toast on first visit — “Enable relief for 3D landscape (uses more battery)”

### 6.6 Mobile

- Reduced halo layers; no coast violet halo
- Layer bar collapses to sheet
- Clustering aggressive below zoom 9
- Touch targets ≥ 44 px via hit padding on symbols
- Relief defaults Off; Subtle/Dramatic available if user enables

### 6.7 Accessibility & attribution

- Persistent **Attributions** chip (Natural Earth · AWMC · Pleiades · HydroSHEDS)
- Keyboard: +/- zoom, arrow pan, Enter opens focused place
- Reduced motion: disable fly animations, snap camera

---

## 7. Data sources & licenses

| Source | Use | License | Notes |
|---|---|---|---|
| [Natural Earth](https://www.naturalearthdata.com/) | Coastlines, land, lakes at 1:10m | **CC0** | Base physical layer |
| [AWMC geodata](https://github.com/AWMC/geodata) | Ancient roads, cultural regions, some rivers | **ODbL** | Derive; attribute; share-alike on DB if redistributing raw derivatives |
| [HydroSHEDS](https://www.worldwildlife.org/pages/hydrosheds) | River geometry refinement | WWF terms | Build-time only; simplify heavily |
| [Pleiades](https://pleiades.stoa.org/) | Place coordinates & ids | **CC BY 3.0** | Store `pleiadesId`; chip links to Pleiades page |
| Copernicus GLO-30 / [SRTM](https://www2.jpl.nasa.gov/srtm/) | Elevation → Terrain-RGB tiles | Copernicus TOU / NASA PD | Build-time only; stylized hillshade |
| Local corpus | All myth prose, citations | research-only | `pnpm corpus:search` before any new place |

**CAWM tiles:** reference for visual QA only; **do not** ship as runtime basemap (external dependency, mismatched aesthetic).

---

## 8. Milestones

Each milestone ends with: `pnpm lint && pnpm build && pnpm validate-data` green + manual UX review.

### M9.4 — MapLibre engine & extended basemap (**2D flat — START HERE**)

First implementation slice. No terrain, no DEM, pitch always 0°.

- Add `maplibre-gl` dependency
- `scripts/build-map-tiles.ts` + `scripts/build-map-style.ts` (no `build-map-terrain.ts` yet)
- Self-hosted **vector** tiles covering §3.1 bounds
- Aether Nebula style v1 (land, water, coast — flat, no hillshade mesh)
- New `MapView.tsx` with pan/zoom/momentum; replaces SVG when parity reached
- Side-by-side dev route or feature flag until cutover
- **`pnpm validate-data` unchanged** (no new data yet)

### M9.5 — Places & features schema

- Types + zod schemas for `GeoPlace`, `GeoFeature`
- Migrate `cities.json` → `places.json` (6 flagship cities)
- Empty `features.json` scaffold
- Validator rules from §5.6
- `docs/LANDS_PLAN.md` ✅ (this file)

### M9.6 — Hydrography pilot (geography layer)

**Batch G1 — rivers (~25):**  
Scamander/Simois, Achelous, Inachus, Asopus, Eurotas, Alpheus, Cephissus, Peneus, Spercheius, Ister, Nile, Eridanus (mythic), Styx (traditional anchor), Hermus, Maeander, Cayster, Halys, Orontes, Jordan, Euphrates, Tigris, Araxes, Danube tributaries (where attested).

**Batch G2 — mountains & ranges (~20):**  
Olympus, Ida (Troas), Parnassus, Pelion, Helicon, Cithaeron, Taygetus, Pindus, Oeta, Athos, Ararat, Nemea, Etna, Atlas, Caucasus (mythic horizon), Libyan Syrtis vicinity.

**Batch G3 — plains, straits, gulfs (~15):**  
Trojan plain, Thessaly, Argive plain, Thermopylae pass, Hellespont, Corinth isthmus, Pillars of Hercules, Cyrene plateau, Syrtis, Ambracian Gulf.

Render as MapLibre line/fill layers; hover panels for features.

### M9.7 — Sanctuaries & sacred geography

**Batch S1 (~30):** Delphi, Dodona, Olympia, Eleusis, Nemea, Epidaurus, Brauron, Isthmia, Delos, Samothrace, Didyma, Claros, Branchidae, Labraunda, Cybele sites, Oracular springs.

Each: `summary`, `deityIds`, `sources`, Pleiades pin where available.

### M9.8 — Cities expansion

Phased city batches (each ships lineage when attested, else place-only):

| Batch | Count | Examples |
|---|---|---|
| C1 — Core Greece | ~30 | Corinth, Thebes environs, Orchomenos, Tiryns, Knossos, Gortyn, Iolcus, Larisa, Megara, Epidaurus (polis), Chalcis |
| C2 — Aegean islands | ~20 | Rhodes, Kos, Samos, Lesbos, Naxos, Thera, Cythera, Salamis (Cyprus) |
| C3 — Anatolia | ~35 | Sardis, Ephesus, Miletus, Halicarnassus, Pergamon, Gordion, Sinope, Colchis (Aea), Troy environs (Ilion, Dardanus) |
| C4 — North Africa | ~20 | Memphis, Thebes (Egypt), Cyrene, Carthage, Utica, Alexandria (if within period), Syrtis ports |
| C5 — West | ~15 | Syracuse, Agrigentum, Tartessus, Gades, Lilybaeum, Cumae, Cumaean Sibyl cave |
| C6 — Long tail | ~50+ | Remaining attested poleis in corpus-driven order |

**Lineages:** extend `data/lineages/` for Mycenae, Argos, Sparta (partial), Corinth, Knossos, etc. as research completes.

### M9.9 — Regions: Anatolia & Africa

- Full §3.2 region tree in `regions.json`
- Authored or AWMC-derived polygons as MapLibre fill layers
- Two-level zoom: e.g. `anatolia` → `ionia`, `lycia`, …
- Retire SVG region click logic entirely

### M9.10 — Roam & discover (Google Maps parity)

- Minimap, geolocation-style "reset north" (bearing locked 0)
- Layer bar, URL state, ⌘K places search
- Story overlay mode
- Character → map links
- Fly-to routes: Argonautica, Odysseus, Seven Against Thebes, Trojan War theater
- Momentum polish, label collision tuning, performance budget (60 fps pan on mid-tier laptop)

### M9.10b — 3D terrain & Relief toggle

**After M9.10.** Flat map must feel finished before adding elevation.

- `scripts/build-map-terrain.ts` — Copernicus/SRTM → Terrain-RGB tiles (full §3.1 bounds)
- Stylized nebula hillshade layer
- `map.setTerrain` + pitch; **Relief** Off / Subtle / Dramatic in Settings (persisted)
- Overview zoom auto-flattens pitch; reduced-motion respected
- Mobile defaults Relief = Off

### M9.11 — City skies at scale

- `residences` backfill for all C1–C4 cities (corpus-verified)
- `/city/[id]/sky` for every city with ≥3 attested residents
- Validator: residence ↔ place ↔ lineage integrity

### M9.12 — Cutover & legacy removal

- Remove SVG `MapView`, `build-basemap.ts`, `data/geo/basemap.json` from runtime path
- Update PLAN.md M9.x status
- Final attribution page

---

## 9. Research & entry workflow

Same discipline as character batches:

1. **Dossier** — `docs/LANDS_<REGION>.md` or extend existing dynasty dossiers with a **Places** section
2. **Corpus search** — `pnpm corpus:search "<place name>"` before web
3. **Pleiades pin** — store id + coordinates; if multiple locations, pick per `CONTRADICTIONS.md` or mark `disputed`
4. **Same-name map** — homonyms (`thebes`, `salamis`, `alexandria`) get suffixed ids
5. **Incremental PR** — one batch = one reviewable unit (~15–30 places or ~10 features)
6. **Never** auto-import Pleiades CSV into app data

---

## 10. Performance & technical guards

- Vector tiles: simplify at low zoom; max 500 KB per tile target
- GeoJSON places: ≤ ~2000 curated entries v1 (cluster beyond that)
- Use `promoteId` for feature state hover
- WebGL context shared with galaxy route — **lazy-load MapLibre** on `/areas` only (dynamic import)
- Fallback: static PNG + "WebGL required for Lands" if MapLibre fails init
- Terrain: when Relief = Off, skip DEM tile fetches entirely (`setTerrain(null)`)
- Target: 60 fps pan on mid-tier laptop with Relief = Subtle; Dramatic may dip on older GPUs — acceptable with toggle

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Scope explosion | Batches gated by dossier + validator; PLAN.md decision log |
| License stack | `attributions.json` + UI chip; legal review before AWMC derivative redistribution |
| Coordinate disputes | `certainty` field + ⚖ topics in CONTRADICTIONS.md |
| Dual renderer maintenance | Time-boxed parallel run; M9.12 deletes SVG path |
| MapLibre bundle size | Dynamic import; tree-shake; no duplicate three.js overlap |
| Terrain GPU cost on mobile | Relief defaults Off; user opt-in; Off mode skips DEM fetches |

---

## 12. Relationship to PLAN.md

This document **supersedes** the M9.2 "edge markers only" framing for far-myth locations. Far-myth places (Colchis, Egypt, Italy, Gibraltar) are first-class `GeoPlace` entries at proper coordinates, not decorative edge dots.

Update `docs/PLAN.md` §8 M9 entry when M9.4 lands to reference `docs/LANDS_PLAN.md`.

---

## 13. Open questions (defaults chosen; override anytime)

| Question | Default |
|---|---|
| 3D terrain | **Yes — Option B, in M9.10b** (not M9.4). Relief toggle Off / Subtle / Dramatic (see §4.4, §6.5). “Optional” = user can disable in Settings, not “skip building it.” |
| Commit generated tiles to git? | **No** — generate in `pnpm build`; CI caches tile build |
| Keep `/areas` name vs rename to `/lands`? | **Keep `/areas`** — HUD already says AREAS; rename is cosmetic later |

---

## 14. First implementation slice (vertical proof)

**The Trojan theater** — validates engine + geography + story overlay in one corridor:

- Tiles: Troad through Thessaly to Sparta
- Features: Scamander, Simois, Hellespont, Mount Ida
- Places: Troy (existing), Ilium, Dardanus, Samothrace, Lesbos, Sparta, Mycenae
- Story overlay: `trojan-war`, `house-of-troy`, `judgment-of-paris`
- Then expand west (Greece) and south (Egypt) in parallel batches.

---

*Last updated: 2026-06-15 (start 2D M9.4; terrain M9.10b).*
