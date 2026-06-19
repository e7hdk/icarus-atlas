# West Mediterranean — Expansion Plan (Italy, Sicily, Magna Graecia)

> Research status: planning dossier, 2026-06-19.  
> Scope: the Italian peninsula, Sicily, Sardinia, and the western basin horizon (Iberia edge) as myth-bearing geography — the same incremental, corpus-first discipline as `docs/ANATOLIA_REGIONS.md`.  
> Entry driver: story strands already live (`aeneas-to-italy`, `philoctetes-to-italy`, `diomedes-exile`, `daedalus-icarus`, `nostoi`) but **regions, cities, lineages, and city skies are largely absent**.

---

## 1. Why this dossier

1. **Stories precede geography.** The Trojan Returns shelf already sends Aeneas, Philoctetes, and Diomedes westward; Ovid and Apollodorus anchor Sicily (Arethusa, Etna, Cyclopes, Proserpina) and southern Italy (Daedalus, Bellerophon in Apulia). The map and city layer have not caught up.
2. **Fill order is locked:** top-level regions → sub-regions → cities/places → lineages + `residences` → optional character promotion.
3. **Seven lenses only** (`docs/SOURCES.md`). Virgil's *Aeneid* is out of scope; Italy is read through Homer, Apollodorus, Ovid, Hyginus, Pausanias, Apollonius, and Hesiod where attested.
4. **Rome is a horizon, not day-one flagship.** Mythic Latium (Lavinium, Alba Longa) and Campania ship first; Republican Rome stays reference-only until a sourced mythic king-list exists in the seven lenses.

---

## 2. Current state audit

### 2.1 Stories (✅ partial)

| Story id | Parent | West-Med material |
|---|---|---|
| `aeneas-to-italy` | `nostoi` | Antandros → storms → Italy (Apollodorus Epit. 6.20) |
| `aeneas-after-troy` | `metamorphoses` | Ovid Met. 13–14 westward strand |
| `philoctetes-to-italy` | `nostoi` | Campanians (Apollodorus) |
| `diomedes-exile` | `nostoi` | Italian wanderings, meeting Aeneas |
| `daedalus-icarus` | `metamorphoses` | Flight to Sicily, Cocalus, Minos |
| `nostoi` | — | Index chapter names Aeneas + Philoctetes west |
| `odyssey` | — | Scylla/Charybdis (Strait of Messina), Cyclopes (Sicily west coast tradition) |

### 2.2 Places (⚠️ thin, `region: null`)

| Place id | Status | Gap |
|---|---|---|
| `syracuse` | ✅ city + place, Pleiades 462503 | Promoted Phase 2; corrected from 462311 (Malta) |
| `campania` | ✅ myth-site, Pleiades 433087 | No `region`; no city lineage |
| — | ❌ | No Latium, Sicily region, Magna Graecia, Sardinia, Etna, Messina strait, Cumae, Lavinium |

### 2.3 Characters (⚠️ scattered residences)

| Figure | West-Med attestation | `residences` today |
|---|---|---|
| `aeneas` | Italy destiny (Apollodorus, Ovid) | `troy`, `lavinium`, `cumae` |
| `anchises`, `ascanius-dardanian` | Aeneas arc | `troy` (Anchises); `troy`, `cumae`, `lavinium` (Ascanius) |
| `daedalus` | Sicily refuge (Ovid) | Crete / Athens strand |
| `galatea-nymph`, `acis` | Etna river (Ovid) | check Sicily |
| `polyphemus` | Cyclopes coast | check |
| `aristaeus` | Migrates to Sardinia (Pausanias) | none for Sardinia |
| `philoctetes` | Campania (Apollodorus) | none for Campania |
| `diomedes` | Italian exile (Apollodorus) | Argos / Calydon |
| `helenus` | Buthrotos mimic Troy (Ovid) — Epirus, not Italy | — |

### 2.4 Regions & cities (❌)

- **No** top-level `sicily`, `magna-graecia`, `latium`, `sardinia`, `iberia` in `data/geo/regions.json`.
- **No** Italian/Sicilian entries in `data/geo/cities.json` (76 cities are overwhelmingly Greece + Anatolia + islands).
- **No** `data/lineages/*.json` for western Mediterranean cities.

### 2.5 Map geometry (❌)

- `REGION_EXTENSIONS` / `SUBREGIONS` in `scripts/build-basemap.ts` stop at Greece, Anatolia, Cyprus, Colchis — no Italian polygons.

---

## 3. Evidence policy (seven lenses)

| Source | West-Mediterranean material |
|---|---|
| `homer` | Od. 9–12 Cyclopes; Scylla & Charybdis (Messina); Aeneas survival (Il. 20); Sirens |
| `apollodorus` | Aeneas → Italy (Epit. 6.20); Philoctetes → Campanians; Diomedes in Italy; Daedalus-Sicily; Persephone/Sicily variants |
| `ovid` | Met. 5 (Proserpina/Enna), 8 (Daedalus), 13–14 (Aeneas, Galatea/Acis, Scylla); Fasti fragments |
| `hyginus` | Returns catalogue (Fab. 120); pious Aeneas (Fab. 94); Italian wanderers |
| `pausanias` | Magna Graecia cult (Tarentum, Croton, Locri); Aeneas storm landfall (3.22.11); Aristaeus → Sardinia |
| `apollonius` | Less Italy; Argo western return geography |
| `hesiod` | Thin; Typhoeus under Etna (Theog. 820–880) overlaps `typhonomachy` |

**Out of scope for automatic attribution:** Virgil (*Aeneid*), Livy, Dionysius of Halicarnassus, Strabo, Herodotus — cite in prose or defer. Full *Aeneid* book-by-book is a **future lens decision**, not this batch.

**Corpus-first:** `pnpm corpus:search "<toponym> Italy|Sicily|Latium"` before every `regions.json` / `cities.json` row.

---

## 4. Top-level regions (Batch A — metadata)

Proposed `parent: null` ethnic/geographic regions. Blurbs need `sources: SourceId[]` each.

| id | name | greekName | Priority | Primary sources | Notes |
|---|---|---|---|---|---|
| `sicily` | Sicily | Σικελία | P0 | homer, ovid, apollodorus | Cyclopes, Scylla, Etna, Arethusa, Proserpina |
| `magna-graecia` | Magna Graecia | Μεγάλη Ἑλλάς | P0 | pausanias, apollodorus | Achaean colonies: Tarentum, Croton, Locri, Sybaris, Rhegium |
| `latium` | Latium | Λατίον | P0 | apollodorus, ovid, hyginus | Aeneas landing, Lavinium, Alba Longa horizon |
| `campania` | Campania | Καμπανία | P1 | apollodorus | Philoctetes, Diomedes, Cumae (Sibyl) |
| `apulia` | Apulia | Ἀπουλία | P1 | pausanias | Bellerophon in Italy (Hyginus/Pausanias strand) |
| `sardinia` | Sardinia | Σαρδώ | P2 | pausanias | Aristaeus migration |
| `iberia` | Iberia | Ἰβηρία | P2 | homer, apollodorus | Pillars, Gades, Tartessus — **edge horizon** |
| `corsica` | Corsica | Κύρνος | P3 | apollonius | Thin; defer unless corpus hit |

**Not a separate top-level:** `italy` as umbrella — use `latium` + `magna-graecia` + `campania` + `apulia` (Model B, same as Anatolia).

### Deferred top-level

| id | Rationale |
|---|---|
| `etruria` | Pausanias thin in seven lenses for mythic kings; verify before entry |
| `lucania` / `bruttium` | Locri/Rhegium covered under Magna Graecia first |

---

## 5. Sub-regions (Batch B — optional)

Only where corpus + polygon pair is ready.

| id | parent | name | Sources | Corpus anchor |
|---|---|---|---|---|
| `sicania` | `sicily` | Sicania | ovid, apollodorus | Western Sicily / Cyclopes coast |
| `trinacria` | `sicily` | Trinacria | ovid | Three-caped island (Proserpina) |
| `ionian-colonies` | `magna-graecia` | Ionian Colonies | pausanias | Croton, Sybaris, Locri |
| `achaean-colonies` | `magna-graecia` | Achaean Colonies | pausanias | Tarentum, Metapontum |
| `laurentum` | `latium` | Laurentum | apollodorus, ovid | Aeneas' landing coast |

---

## 6. Cities & places (Batch C)

Attach to sub-region where possible, else top-level region. Promote `places.json` myth-sites to `cities.json` when lineage or city-sky is planned.

| Priority | City / place | Suggested id | `region` | Corpus | Status |
|---|---|---|---|---|---|
| P0 | Syracuse | `syracuse` | `sicily` | homer, ovid, pausanias | ✅ city + place; Pleiades 462503 |
| P0 | Cumae | `cumae` | `campania` | apollodorus, ovid | ✅ city + place |
| P0 | Lavinium | `lavinium` | `latium` | apollodorus, hyginus | ✅ city + place |
| P0 | Troy → Antandros | `antandros` | `troad` | ovid | already Troad-adjacent; link in story |
| P1 | Tarentum | `tarentum` | `magna-graecia` | pausanias | ✅ city + place |
| P1 | Croton | `croton` | `magna-graecia` | pausanias | ✅ city + place |
| P1 | Locri | `locri` | `magna-graecia` | pausanias | ✅ city + place |
| P1 | Rhegium | `rhegium` | `magna-graecia` | apollodorus | ✅ city + place |
| P1 | Messina strait | `messina-strait` | `sicily` | homer | Scylla/Charybdis — linear feature? |
| P1 | Mount Etna | `mount-etna` | `sicily` | hesiod, ovid, hyginus | Typhon, Acis, flood variant |
| P2 | Selinus | `selinus` | `sicily` | pausanias | verify |
| P2 | Sybaris | `sybaris` | `magna-graecia` | pausanias | verify |
| P2 | Alba Longa | `alba-longa` | `latium` | apollodorus | plain-name lineage OK |
| P2 | Neapolis | `neapolis` | `campania` | pausanias | Siren Parthenope strand |
| P2 | Gades | `gades` | `iberia` | apollodorus | Heracles, Pillars edge |
| P3 | Caralis (Sardinia) | `caralis` | `sardinia` | pausanias | Aristaeus |

**Homonym hazards**

| Name | Collision | Resolution |
|---|---|---|
| `ascanius` | Trojan prince vs Roman eponym | `ascanius-dardanian` if promoted; ILIAD_ROSTER reserves Roman line |
| `creusa` | Athens vs Troy | `creusa-troy` exists; do not merge |
| `latinus` | King vs people | `latinus-king` if promoted |
| `rhea` / `cybele` | Ida Mater | Mount Ida = Trojan; Phrygian Mater = separate |

---

## 7. Story integration (Batch S)

Wire existing and new `storyIds` on places/regions; avoid duplicating full Aeneid.

| Action | Story | Geo links to add |
|---|---|---|
| Wire | `aeneas-to-italy` | `lavinium`, `cumae`, `latium`, `campania` |
| Wire | `aeneas-after-troy` | Carthage horizon? — **defer** unless Apollodorus/Ovid pin |
| Wire | `daedalus-icarus` | Sicily, `mount-etna`, Cocalus plain name |
| Wire | `philoctetes-to-italy` | `campania` (already partial) |
| Wire | `diomedes-exile` | `campania`, Magna Graecia |
| New episode? | `scylla-charybdis` | `messina-strait`, `rhegium` — if not folded into `odyssey` |
| New episode? | `proserpina-sicily` | Enna/Henna, `mount-etna` — MYTHS_BACKLOG `hymn-to-demeter` overlap |
| New episode? | `galatea-acis` | Sicily coast — story may exist via `acis-galatea` |

---

## 8. City fill (Batch D — lineages + skies)

Three layers per city (see Anatolia work): `lineages/*.json`, `residences`, promoted characters.

### P0 city-fill targets

| City | Lineage (plain names OK) | Residents to backfill |
|---|---|---|
| **Lavinium** | Latinus → Aeneas marriage strand (Apollodorus) | `aeneas`, `latinus-king`, `lavinia`, `ascanius-dardanian` — sky 4 |
| **Cumae** | Sibyl as attested figure, not king-list | `aeneas`, `sibyl-cumae`, `ascanius-dardanian` — sky 3 |
| **Syracuse** | Archias (Corinthian founder) — Pausanias | `arethusa-nymph`, `archias-syracuse`, `alpheus` — sky 3 |
| **Campania** (myth-site) | No kings — keep place + residents | `philoctetes`, `diomedes` |

### P1

| City | Lineage | Residents (Phase 3b) | Status |
|---|---|---|---|
| **Tarentum** | Phalanthus → Taras (Pausanias 10.10.6–8) | `phalanthus-tarentine`, `taras-hero` | ✅ sky 2 |
| **Croton** | Myscelus, Croton eponym (Ovid Met. 15) | `myscelus-croton`, `leonymus-croton`, `heracles` | ✅ sky 3 |
| **Locri** | Spartan colony under Polydorus (Paus. 3.3.1) | — (no named Locrian resident in seven lenses) | ✅ lineage only; sky 0 |
| **Rhegium** | Heracles' cattle crossing (Apollod. 2.5.10) | `heracles` (passage, not rule) | ✅ sky 1 |

**Skipped (corpus reason):**
- `diomedes` → Italy only in Apollodorus Epit. 6.9; no Tarentum/Croton/Locri/Rhegium toponym in seven lenses.
- `achilles` → White Island cult reached from Croton (Paus. 3.19.11–12); hero cult, not civic residence at Tarentum.
- `scylla-monster` → strait peril (Homer Od. 12); story link on `rhegium` place, not residence.
- `galatea-nymph` → Ovid sets the tale beside Rhegium's walls (Met. 14.1–108); narrative scene, not residence.

---

## 9. Character batches (Batch E — optional promotion)

Only figures with corpus-verified Italian/Sicilian **residence** or rule.

| Batch | Figures | Interlock | Status |
|---|---|---|---|
| E1 — Aeneas Italy | `lavinia`, `latinus-king`, `ascanius-dardanian`, `sibyl-cumae` | `aeneas`, `anchises` residences; Lavinium/Cumae/Syracuse skies | ✅ E1 done (2026-06-19) |
| E1 — Sicily founder | `archias-syracuse`, `alpheus` | `arethusa-nymph` Syracuse sky | ✅ E1 done (2026-06-19) |
| E2 — Sicily metamorphosis | `cocalus`, `aretha` duplicates check | `galatea-nymph`, `acis`, `polyphemus` | pending |
| E3 — Nostoi west | — | `philoctetes` → campania, `diomedes` → campania |
| E4 — Sardinia | — | `aristaeus` → sardinia |

**Do not bulk-promote:** Roman kings (Romulus), Aeneid-only cast (Dido/Carthage full arc), Pythagoras, historical tyrants.

---

## 10. Map geometry (Batch B-geo)

Approximate WGS84 boxes for `REGION_EXTENSIONS` in `scripts/build-basemap.ts` (hand rings, clip to land):

```
sicily:         [12.4, 36.4, 15.7, 38.3]
magna-graecia:  [15.5, 37.8, 18.5, 41.3]   # toe + instep of Italy
latium:         [12.2, 41.4, 13.2, 42.1]
campania:       [13.8, 40.5, 15.5, 41.3]
apulia:         [15.0, 40.0, 18.5, 42.0]
sardinia:       [8.0, 38.8, 9.8, 41.3]
iberia:         [-9.5, 36.0, 3.5, 43.8]     # edge horizon — low zoom only
```

Run `pnpm build:map` after rings land.

---

## 11. Implementation checklist

| Step | Artifact | Milestone |
|---|---|---|
| W-A1 | Top-level regions in `regions.json` (P0: sicily, magna-graecia, latium, campania) | M9.9 ✅ Phase 1 |
| W-A2 | `pnpm validate-data` | after each batch ✅ Phase 1 |
| W-B | Sub-region rows (optional P1) | M9.9 |
| W-B-geo | `REGION_EXTENSIONS` + `SUBREGIONS` rings (P0 west boxes) | M9.9 ✅ Phase 1 |
| W-B-geo | `pnpm build:map` → `regions-meta.json` | M9.9 ✅ Phase 1 |
| W-C | Cities: Lavinium, Cumae, Tarentum, Croton, Locri, Rhegium | M9.5+ ✅ Phase 2 |
| W-C | Fix `syracuse` + `campania` `region` parents | M9.5 ✅ Phase 1 |
| W-S | Story `places` / `storyIds` backfill on new geo | M10 ✅ Phase 2 (geo `storyIds`) |
| W-D | Lineages + `residences` for P0 cities | M9.3 ✅ Phase 3 |
| W-E | Character promotion batches E1–E3 | M2+ ✅ E1 (2026-06-19) |

---

## 12. Recommended execution order

```
Phase 1 — Skeleton (1–2 sessions)
  regions.json P0 (sicily, magna-graecia, latium, campania)
  → build-basemap polygons P0
  → build:map + validate-data
  → wire syracuse + campania region parents

Phase 2 — Cities (2–3 sessions)
  Lavinium, Cumae, Tarentum, Croton, Locri, Rhegium
  → places.json alignment, Pleiades coords
  → storyIds on geo nodes

Phase 3 — City fill (2 sessions)
  Aeneas/Philoctetes/Daedalus residence backfill
  → thin lineages (Lavinium, Syracuse founder)
  → city skies go live

Phase 4 — Depth (ongoing)
  Sub-regions, Etna/Messina features, Iberia edge
  → MYTHS_BACKLOG episodes (Proserpina, Scylla)
  → character batch E1–E3
```

---

## 13. Success criteria

- [ ] Map zoom into Sicily and Magna Graecia shows region polygons (not just Greece).
- [x] At least **6** western cities in `cities.json` with Pleiades coords.
- [x] `aeneas` has `residences` for Troy **and** Italy (dual residence rule).
- [x] `/city/lavinium`, `/city/cumae`, `/city/syracuse` city skies (≥3 residents each).
- [ ] `aeneas-to-italy` place links resolve to real `GeoPlace` ids (no orphan names).
- [ ] No Virgil-sourced facts presented as undisputed.

---

## 14. Open questions (decide before Batch E1)

1. **Carthage / Dido** — Ovid mentions Aeneas' wanderings; full queen of Carthage is Aeneid-primary. Ship as horizon place only, or skip?
2. **Rome** — mythic `rome` city id vs keep `alba-longa` + `lavinium` until Romulus batch?
3. **Linear features** — Messina strait as `GeoFeature` river/strait vs place point?
4. ~~**Ascanius** — promote now for Lavinium sky, or plain name in lineage only?~~ **Resolved:** promoted as `ascanius-dardanian` (E1, 2026-06-19).

---

## 15. Related dossiers

- `docs/LANDS_PLAN.md` §3.2 — full basin roster
- `docs/TROJAN_CYCLE.md` — nostoi / aeneas-to-italy batches (done)
- `docs/METAMORPHOSES.md` — Batch 9 Aeneas after Troy
- `docs/ANATOLIA_REGIONS.md` — template for region/city/fill order
- `docs/MYTHS_BACKLOG.md` — Proserpina, Scylla candidates
