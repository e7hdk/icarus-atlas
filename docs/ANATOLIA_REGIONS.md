# Anatolia — Region Inventory (Model B)

> Research status: corpus-verified name list, 2026-06-18; pending pass §10 (2026-06-19).  
> Taxonomy: **ethnic regions stay top-level** (`parent: null`); classical subdivisions nest underneath (Peloponnese → Argolis pattern).  
> Scope: western & central Anatolia roster from `docs/LANDS_PLAN.md` §3.2 — not Armenia, Syria, or Egypt (separate horizons).

## 1. Why this dossier

1. **Fill order is locked:** top-level names → sub-regions → cities (`cityFamily` depends on the tree).
2. **Map geometry:** top-level Anatolian ids and Batch B sub-regions have `REGION_EXTENSIONS` / `SUBREGIONS` rings in `build-basemap.ts` (M9.9, 2026-06-18). `pisidia` remains metadata-only until corpus + polygon land.
3. **Corpus-first:** every blurb in `regions.json` carries `sources: SourceId[]` from the seven atlas lenses only.

## 2. Evidence policy

| Source id | Anatolian material |
|---|---|
| `homer` | Trojan catalogue (*Iliad* 2–3): Mysians, Phrygians, Maeonians, Carians, Lycians, Paphlagonians, Cilicia (Eëtion); Bellerophon & the Solymi |
| `apollodorus` | Lydia (Omphale), Mysia/Teuthrania (Telephus), Bithynia (Amycus), Caria (Argonautica route) |
| `pausanias` | Aeolis, Pamphylia, Cappadocia, Teuthrania→Pergamus, Caria (Halicarnassus colonists) |
| `apollonius` | Pontus (Sinope), Colchis approach |
| `ovid` | Lydia (Midas), Phrygia (Marsyas) |
| `hyginus` | Phrygia (Midas, Marsyas) |
| `hesiod` | Aeolian Cyme (western Asia Minor anchor) |

**Out of scope for automatic attribution:** Herodotus, Strabo, Pliny — not in the seven lenses. `pisidia` stays **corpus-pending** until a pinned passage is found or the source roster grows.

## 3. Top-level regions (Batch A)

| id | name | greekName | Status | Primary sources | Notes |
|---|---|---|---|---|---|
| `troad` | Troad | Τρῳάς | ✅ data + polygon | homer | Priam's country; `REGION_EXTENSIONS` in `build-basemap.ts` |
| `mysia` | Mysia | Μυσία | ✅ data | homer, apollodorus, pausanias | Caicus / Telephus coast |
| `lydia` | Lydia | Λυδία | ✅ data | apollodorus, ovid, pausanias | Croesus, Omphale, Tmolus |
| `ionia` | Ionia | Ἰωνία | ✅ data | homer, pausanias, apollonius | Ionian coast; cities batch next |
| `caria` | Caria | Καρία | ✅ data | homer, pausanias | Mausolus horizon; Halicarnassus |
| `lycia` | Lycia | Λυκία | ✅ data (this batch) | homer | Sarpedon, Xanthus |
| `pamphylia` | Pamphylia | Παμφυλία | ✅ data (this batch) | pausanias | Cretan migration strand (Sarpedon kin) |
| `pisidia` | Pisidia | Πισιδία | ⏳ corpus-pending | — | See §10.1 — zero direct hits; Solymi indirect only |
| `cilicia` | Cilicia | Κιλικία | ✅ data (this batch) | homer | Eëtion's lordship (Thebe under Placus) |
| `phrygia` | Phrygia | Φρυγία | ✅ data | homer, ovid, hyginus, pausanias | Gordius, Midas, Sangarius |
| `bithynia` | Bithynia | Βιθυνία | ✅ data (this batch) | apollodorus | Bebryces / Amycus strand |
| `paphlagonia` | Paphlagonia | Παπφλαγονία | ✅ data (this batch) | homer | Eneti, Pylaemenes |
| `pontus` | Pontus | Πόντος | ✅ data | apollonius, pausanias | Southern Black Sea coast |
| `cappadocia` | Cappadocia | Καππαδοκία | ✅ data (this batch) | pausanias | Eastern plateau horizon |

**Horizons (top-level peers, not children of the above):** `cyprus`, `colchis` — already in `regions.json`.

## 4. Sub-regions (Batch B)

Only entries with corpus support ship in this batch. Polygon work (`SUBREGIONS` rings in `build-basemap.ts`) is **Batch B-geo** — ids can exist in `regions.json` first.

| id | parent | name | greekName | Sources | Corpus anchor |
|---|---|---|---|---|---|
| `dardania` | `troad` | Dardania | Δαρδανία | homer | *Iliad* 2.820–855 — Aeneas leads the Dardanians |
| `teuthrania` | `mysia` | Teuthrania | Τευθρανία | apollodorus, pausanias | Bibliotheca 2.7.4 (Telephus); Pergamus formerly Teuthrania (1.4.5) |
| `aeolis` | `mysia` | Aeolis | Αἰωλίς | hesiod, pausanias | Aeolian Cyme (*Works and Days*); twelve Aeolian cities (7.5.1) |
| `maeonia` | `lydia` | Maeonia | Μαιονία | homer | *Iliad* 2.860–875 — Maeonians beneath Tmolus |
| `ascania` | `phrygia` | Ascania | Ἀσκανία | homer | *Iliad* 2.860–875 — Phrygians from Ascania |
| `hellespontine-phrygia` | `phrygia` | Hellespontine Phrygia | Ἑλλησπόντια Φρυγία | apollodorus, pausanias | Telephus/Teuthras Phrygian reach; Pergamus–Sangarius overlap |

### Deferred sub-regions (name reserved — verify before entry)

| id | parent | Rationale |
|---|---|---|
| `cilicia-tracheia` | `cilicia` | Classical split; needs non-Homeric lens or indirect batch |
| `cilicia-pedias` | `cilicia` | Plain Cilicia — same |
| `xanthus-valley` | `lycia` | Homer names the river; polygon TBD |
| `ionic-dodecapolis` | `ionia` | City cluster — prefer per-city `region` links in Batch C |

### Flat top-levels (no sub-region in Batch B)

`ionia`, `caria`, `lycia`, `pamphylia`, `cilicia`, `bithynia`, `paphlagonia`, `pontus`, `cappadocia` — subdivide only when a polygon + corpus pair is ready.

## 5. Cities & places (Batch C)

Attach to **sub-region** where possible, else top-level ethnic region.

| Priority | City / place | Suggested `region` | Status |
|---|---|---|---|
| P0 | Troy | `troad` | ✅ |
| P0 | Ephesus, Miletus | `ionia` | ✅ |
| P0 | Sardis | `lydia` | ✅ |
| P0 | Gordion | `phrygia` | ✅ |
| P1 | Halicarnassus | `caria` | ✅ |
| P1 | Smyrna | `aeolis` (⚖ Ionian strand) | ✅ |
| P1 | Pergamon | `teuthrania` | ✅ |
| P1 | Sinope | `pontus` | ✅ |
| P1 | Tarsus, Side | `cilicia` / `pamphylia` | ✅ |
| P2 | Cyme | `aeolis` | ✅ |
| P2 | Myrina | `aeolis` | ⏳ corpus-pending — see §10.2 (Myrine homonyms only) |
| P2 | Xanthus, Patara | `lycia` | ✅ |

## 6. Implementation checklist

| Step | Artifact | Owner milestone |
|---|---|---|
| A1 | Top-level + sub-region rows in `data/geo/regions.json` | ✅ this batch |
| A2 | `pnpm validate-data` | ✅ |
| B-geo | `REGION_EXTENSIONS` rings for each top-level Anatolian id | ✅ M9.9 |
| B-geo | `SUBREGIONS` rings for Batch B ids | ✅ M9.9 |
| B-geo | `pnpm build:map` → `regions-meta.json` | ✅ M9.9 |
| C | `places.json` / `cities.json` promoted cities | ✅ Batch C (2026-06-18) |

## 7. Polygon sketch (Batch B-geo — authored in `build-basemap.ts`)

Approximate WGS84 boxes for `REGION_EXTENSIONS` authoring (hand rings in `build-basemap.ts`, same discipline as `troad`):

```
lycia:        [27.8, 35.8, 31.5, 37.2]
ionia:        [26.0, 37.5, 28.5, 38.8]
aeolis:       [26.0, 38.5, 27.8, 39.2]   → sub-region of mysia
mysia:        [26.5, 39.0, 28.8, 40.2]
bithynia:     [28.5, 40.0, 31.5, 41.5]
phrygia:      [27.5, 38.5, 32.5, 40.5]
lydia:        [27.0, 38.0, 29.5, 39.5]
caria:        [27.0, 36.5, 29.5, 37.8]
pamphylia:    [30.0, 36.2, 32.5, 37.5]
pisidia:      [30.0, 37.0, 32.5, 38.5]   → pending corpus
cilicia:      [32.5, 36.0, 36.5, 37.8]
paphlagonia:  [32.0, 40.5, 36.0, 42.0]
pontus:       [36.0, 40.0, 41.5, 42.5]
cappadocia:   [33.5, 38.0, 38.5, 40.5]
```

Rings must be clipped to land (`foreign` layer) like the Troad extension.

## 8. Same-name hazard map

| Name | Disambiguation |
|---|---|
| **Aeolis** (geo) vs **Aeolis** (wind-god's wife in *Met.* 11) | Geographic sub-region cites Pausanias 7.5.1 / Hesiod Cyme only |
| **Dardania** (Troad) vs **Dardanian** at Phylace (*Iliad* 2.695) | Sub-region id `dardania` = Trojan plain only |
| **Maeonia** vs **Maeander** river | Maeonia = Lydia; Maeander = separate river feature |
| **Pontus** (region) vs **Pontus** (sea) | Region = southern Black Sea **coast** |
| **Myrine** (Homer *Il.* 2.814) vs **Myrine** (Apollonius Lemnos) vs **Myrina** (Aeolian city) | Only the Amazon barrow and the Lemnian city appear in the seven lenses; Aeolian Myrina is unattested — see §10.2 |

## 9. Batch log

| Batch | Contents | Status |
|---|---|---|
| **A** | 6 new top-level regions + 6 sub-regions in `regions.json` | 2026-06-18 |
| **A-pending** | `pisidia` top-level | awaits corpus — §10.1 (2026-06-19) |
| **C-pending** | `myrina` city | awaits corpus — §10.2 (2026-06-19) |
| **B-geo** | Basemap polygons for all Anatolian ids | not started |
| **C** | City/place promotion | 2026-06-18 |

## 10. Corpus-pending research log

Research pass: **2026-06-19**. Method: `pnpm corpus:search` across all seven atlas lenses (hesiod, homer, apollodorus, apollonius, ovid, hyginus, pausanias). **No data entries added** — policy requires a pinned passage in a lens before `regions.json` / `cities.json` / `places.json` rows ship.

### 10.1 Pisidia (`pisidia`) — STILL PENDING

| Query | Hits |
|---|---|
| `Pisidia` | 0 |
| `Pisidians` | 0 |
| `Pisidian` | 0 |
| `Πισιδία` | 0 |
| `Pisidai` | 0 |
| `Pisida` | 0 |

**Closest indirect passages (insufficient for region entry):**

| Lens | Citation | Why not Pisidia |
|---|---|---|
| homer | *Iliad* 6.184–187; 6.210–211 | Bellerophon fought the **Solymi** — people/mountains named, never “Pisidia” or “Pisidians” |
| homer | *Odyssey* 5.283 | Poseidon sees Odysseus “from the mountains of the **Solymi**” — same gap |
| apollodorus | Bibliotheca 2.3.2 | Bellerophon ordered to fight the **Solymi** after the Chimera — no ethnic region label |
| pausanias | 7.3.7; 8.28.3 | **Pamphylia** named (Cretan migration; Side’s river) — no Pisidia border or mention |

The Lycia blurb in `regions.json` already cites Homer’s Solymi strand (*Iliad* 6) for the hills above Lycia. That geography overlaps modern Pisidia but does **not** supply the region name under the seven-lens rule.

**Polygon:** sketch box `[30.0, 37.0, 32.5, 38.5]` remains in §7 for when a lens passage lands or the source roster grows (Herodotus, Strabo — out of scope per §2).

**Verdict:** STILL PENDING — no `regions.json` row, no `REGION_EXTENSIONS` ring.

### 10.2 Myrina Aeolis (`myrina`) — STILL PENDING

| Query | Hits | Aeolis? |
|---|---|---|
| `Myrina` | 0 | — |
| `Μυρίνα` | 0 | — |
| `Myrinus` | 0 | — |
| `Myrinoi` | 0 | — |
| `Aeolian Myrina` | 0 | — |
| `Myrine` | 3 | **No** — homonyms only (see below) |

**Homonym hits (must not be conflated with Aeolian Myrina):**

| Lens | Citation | What “Myrine” is |
|---|---|---|
| homer | *Iliad* 2.814 | The **barrow of Myrine** at Batieia on the Trojan plain — Amazon, not a city |
| apollonius | *Argonautica* 1.592 | **Myrine on Lemnos** — gates of the Lemnian city, not Aeolis |
| apollonius | *Argonautica* 1.609 | Same Lemnian **Myrine** — Hypsipyle’s people |

**Aeolis context without Myrina:**

| Lens | Citation | Content |
|---|---|---|
| pausanias | 7.5.1 | “Smyrna, **one of the twelve Aeolian cities**” — only Smyrna named; Myrina not in the list |
| hesiod | *Works and Days* 636–640 | **Aeolian Cyme** — anchor city, not Myrina |
| pausanias | 5.24.6 | **Elaea**, “first city of Aeolis” descending from the Caicus — not Myrina |

Pausanias 7.5.1 is the canonical “twelve cities” anchor but does **not** enumerate all twelve or name Myrina explicitly. Apollodorus Epitome 3.33 lists Cyme and Smyrna among Achilles’ conquests but not Myrina.

**Future ship path (not executed):** Pleiades **550756** (Myrina/Sebastopolis, Aeolis; ~26.986°E, 38.840°N) is the expected gazetteer id when a seven-lens passage appears. No lineage attested in the pinned corpus.

**Verdict:** STILL PENDING — no `cities.json` / `places.json` row.
