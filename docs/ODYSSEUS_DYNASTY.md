# The House of Odysseus — Ithaca, the Cephallenians, and the Autolycid Circle — Research Dossier

> Research status: source-mapped against the seven atlas lenses (pinned corpus), 2026-06-16. **Spine Batch A (Laertes line) and Circle Batch B (Autolycus branch) are largely entered** — `arceisius`, `laertes`, `anticleia`, `autolycus`, `odysseus`, `telemachus`, `penelope`, plus the circle nodes `chione-daedalion`, `daedalion`, `lucifer-morning`, `philammon`, `polymede`, with parent/consort/lover edges and `odysseus-paternity` / `philammon-mother` in `docs/CONTRADICTIONS.md`. Odyssey cast, suitor waves, and `proteus`/`eidothea-proteus` (Telemachus voyage) are live in `data/stories/odyssey.json`. **Still thin:** `data/lineages/ithaca.json` (Odysseus only), Laertes as former Cephallenian king in the lineage panel, Apollodorus alternate endings (`callidice-thesprotian`, `telegonus-circe`, exile judges), and reference/culture backfill for the core family.
>
> Scope: the **Ithacan royal house** from Arceisius through Laertes and Odysseus to Telemachus; the **maternal Autolycid line** (Hermes → Autolycus → Anticleia / Polymede); marriage to **Penelope** via the Spartan `icarius`; and the boundary myths (Troy, wanderings, mnesterophonia, variant deaths). This dossier does **not** recursively expand the full suitor catalogues (Dulichium / Same / Zacynthus / Ithaca lists — see Odyssey data slices) or the entire Spartan house (see `SPARTA_DYNASTY.md`).

## 1. Why this dynasty needs a dossier

1. **The paternal line is unusually narrow.** Homer makes Zeus shape the house so that Arceisius, Laertes, and Odysseus each leave **one son** — a genealogical fact with narrative stakes (suitor plots to extinguish the race of godlike Arceisius).
2. **The maternal line is a cunning hub.** Autolycus, son of Hermes, fathers both **Anticleia** (Odysseus' mother) and **Polymede** (Jason's mother in Apollodorus) — linking the Odyssey and Argonautica through one thief-grandfather.
3. **Odysseus' paternity is disputed.** Homer and Apollodorus make him son of Laertes and Anticleia; Hyginus records a Sisyphus seduction scandal (`odysseus-paternity`) that explains the epithet "Sisyphean" for his wit.
4. **Penelope is an inter-dynasty marriage.** She enters through `icarius` and `periboea-naiad` (Spartan house — `SPARTA_DYNASTY.md`); her fidelity and the variant endings (`penelope-antinous-affair`, `penelope-amphinomus-affair`, `odysseus-death`) are among the atlas's richest dispute clusters.
5. **Homonym density at Ithaca.** Dozens of suitor names (`eurylochus-ithaca` vs Odysseus' companion `eurylochus`, `euryalus-ithaca` vs Phaeacian and Zacynthian homonyms, two `polybus` figures, etc.) demand the suffixed-id discipline documented here before any new entry.
6. **Geography spans islands and mainland.** Residences tie to `ithaca`, `cephallenia` (Laertes as former lord of the Cephallenians), and the western suitor isles — the `/areas` and `/city/ithaca` sky must stay consistent with `places.json` `characterIds`.

## 2. Evidence policy

| Source id | Material |
|---|---|
| `homer` | The backbone: the single-line house (Odyssey 16.90–130); Laertes in the orchard (Od. 24); Anticleia in Hades (Od. 11); Autolycus and the boar-scar (Od. 19); Telemachus' voyage (Od. 1–4); mnesterophonia (Od. 21–22); Ithaca/Cephallenian geography (Od. 9.21–28; Il. 2.629–637) |
| `apollodorus` | Catalogue parentage Laertes + Anticlia → Ulysses (Epit. 3.10); suitor island rolls (Epit. 7.26–7.31); Penelope shroud stratagem (Epit. 7.31); variant endings (Epit. 7.33–7.40); Autolycus → Polymede → Jason (Bibliotheca 1.9.16) |
| `hyginus` | Autolycus' divine theft-gift (Fab. 200–201); Sisyphus and Anticleia (`odysseus-paternity`, Fab. 201); Philammon twin-birth (Fab. 200); Menelaus/Proteus strand (Fab. 118) |
| `ovid` | Chione's twin sons by Apollo and Mercury (Met. 11.301–317); Daedalion's hawk transformation (via Hyginus Fab. 200) |
| `pausanias` | Penelope exile at Mantinea (Description of Greece 8.12.6) — pairs with Apollodorus Epit. 7.38 |

Out of scope for tagging: the *Catalogue of Women*, Euripides' lost *Odysseus* plays, the *Telegony*, scholia that invent Arceisius' parentage, and modern identifications of Ithaca with specific modern islands.

## 3. Source-conscious overview

Bracketed nodes already exist. "[disputed]" = competing sourced edges.

```text
[Arceisius]  [no parent attested in the seven lenses — terminally narrow root]
   └── Laertes + Anticleia
       │         └── daughter of [autolycus] ── [hermes] + [chione-daedalion] (+ [daedalion] ← [lucifer-morning])
       │                    ├── [philammon]  [+ [apollo]; mother disputed — philammon-mother]
       │                    └── [polymede] → [jason] by [aeson]  [mother disputed — jason-mother]
       └── Odysseus  [father [laertes]; rival father [sisyphus] — odysseus-paternity]
           + [penelope]  [daughter of [icarius] + [periboea-naiad]; fate disputed]
           └── [telemachus]
```

**Autolycus circle (parallel to the throne line):**

```text
[lucifer-morning] ── [daedalion] ── [chione-daedalion] ──┬── [philammon] (+ [apollo])
                                                          └── [autolycus] (+ [hermes])
                                                                  ├── Anticleia → Odysseus
                                                                  └── Polymede → Jason
```

## 4. The same-name hazard map

| Name | Distinct entities in this house / Odyssey work |
|---|---|
| **Odysseus / Ulysses** | `odysseus` only — do not merge with any other bearer. |
| **Eurylochus** | `eurylochus` (Odysseus' lieutenant, cattle/Sirens) vs `eurylochus-zacynthus` (Apollodorus Epit. 7.29 suitor). |
| **Euryalus** | `euryalus-ithaca` / Dulichium roll vs `euryalus-zacynthus` vs Phaeacian boxer (Homer Od. 8 — no separate character file; disambiguate in `euryalus-ithaca` / `euryalus-zacynthus` prose). |
| **Polybus** | `polybus-ithaca` ("wise Polybus" in the hall) vs `polybus-zacynthus` (Epit. 7.29 duplicate entry). |
| **Agenor / Evenorides / Clytius / Amphimachus** | Island-catalogue homonyms (`*-ithaca`, `*-dulichium`, `*-same`, `*-zacynthus`) — never merge across lists. |
| **Anticleia / Anticlia** | One figure (`anticleia`); Apollodorus Latinizes Anticlia in Epit. 3.10. |
| **Autolycus** | `autolycus` (Hermes' son, Odysseus' maternal grandfather) vs unrelated Autolycus figures elsewhere — none currently in atlas. |
| **Helenus** | `helenus-ithaca` (Ithaca suitor) vs `helenus` (Priam's seer son at Troy). |
| **Chione** | `chione-daedalion` (mother of Autolycus and Philammon) vs `chione-boreas` and any other Chiones. |
| **Penelope** | `penelope` (queen of Ithaca) vs unrelated Penelopes — none merged. |
| **Ithaca / Cephallenia / Same** | City nodes in `data/geo/cities.json` vs mythic `cephallenia` as Same's island group in suitor geography. |

## 5. Proposed / live contradiction topics

| Topic id | Competing claims | Status |
|---|---|---|
| `odysseus-paternity` | Laertes + Anticleia (Homer, Apollodorus) vs Sisyphus seduction (Hyginus) | ✓ in CONTRADICTIONS.md; edges on `odysseus`, `sisyphus`, `anticleia` |
| `philammon-mother` | Chione (Ovid, Hyginus Fab. 200) vs Leuconoe daughter of Lucifer (Hyginus Fab. 161) | ✓ in CONTRADICTIONS.md |
| `jason-mother` | Polymede daughter of Autolycus (Apollodorus) vs Alcimede (Apollonius) | ✓ in CONTRADICTIONS.md; boundary to Aeolid house |
| `penelope-antinous-affair` | Faithful queen (Homer) vs seduced / Pan at Mantinea (Apollodorus, Pausanias) | ✓ in CONTRADICTIONS.md |
| `penelope-amphinomus-affair` | Faithful queen (Homer) vs seduced and slain (Apollodorus Epit. 7.39) | ✓ in CONTRADICTIONS.md |
| `odysseus-death` | Survives on Ithaca (Homer) vs Telegonus (Apollodorus) vs Aetolian exile (Apollodorus Epit. 7.40) | ✓ in CONTRADICTIONS.md |
| `theoclymenus-parentage` | Son of Polypheides (Homer Od. 15) vs son of Proteus (Hyginus Fab. 128) | ✓ in CONTRADICTIONS.md — Telemachus-voyage boundary |

No new contradiction file entries required for the Laertes spine itself; Homer and Apollodorus agree on Laertes + Anticleia as Odysseus' parents.

## 6. Roster interlocks with existing nodes

- **`hermes`** ← parent of `autolycus` (Hyginus, Ovid); messenger in Odyssey (Calypso release, moly).
- **`apollo`** ← lover of `chione-daedalion`; parent of `philammon` (disputed mother topic).
- **`sisyphus`** ↔ `anticleia` lover edges under `odysseus-paternity`; Corinthian Aeolid — see `AEOLUS_DYNASTY.md`.
- **`aeson`** / **`jason`** ← `polymede` parent edge; shared Autolycid cunning with Odysseus.
- **`icarius`** / **`periboea-naiad`** ← parents of `penelope` (Spartan batch — `SPARTA_DYNASTY.md`).
- **`nestor`**, **`menelaus`**, **`helen`**, **`peisistratus-nestor`**, **`proteus`**, **`eidothea-proteus`** ← Telemachus voyage allies and news chain (Od. 1–4).
- **`athena`** ← patron of Odysseus and Telemachus; restores Laertes (Od. 24).
- **`calypso`**, **`circe`**, **`polyphemus-cyclops`**, **`penelope`**, suitor `*-ithaca` / `*-dulichium` / `*-same` / `*-zacynthus` ← story cast, not dynasty expansion.

## 7. Entity roster — entry status

### Batch A — the Ithacan spine (entered)

| id | Notes |
|---|---|
| `arceisius` | Forefather; single-line house; no parent in corpus |
| `laertes` | Former Cephallenian lord; orchard reunion; shroud pretext |
| `anticleia` | Mother; shade in Hades; Parnassus visit |
| `odysseus` | Hero; full Odyssey + Iliad load |
| `telemachus` | Son; coming-of-age arc |
| `penelope` | Consort; wired to `icarius` |

Relations live: `laertes-parent-arceisius`, `odysseus-parent-laertes`, `odysseus-parent-anticleia`, `odysseus-parent-sisyphus` (disputed), consort and ally edges among the family and loyal household (`eurycleia`, `eumaeus`, `dolius-ithaca`, etc.).

### Batch B — the Autolycid circle (entered)

| id | Notes |
|---|---|
| `autolycus` | Master-thief; boar-scar hunt; Hermes' gift |
| `chione-daedalion` | Twin-birth night; slain by Artemis (Hyginus) |
| `daedalion` | Hawk transformation |
| `lucifer-morning` | Daedalion's father (Hyginus) |
| `philammon` | Singer; sibling of Autolycus |
| `polymede` | Jason's mother in Apollodorus |

Relations live: Hermes/Apollo lovers of Chione; Autolycus parent edges; Philammon–Autolycus siblings; Polymede–Jason (`jason-mother` topic).

### Batch C — Odyssey boundaries (partial)

| id | Status |
|---|---|
| `proteus`, `eidothea-proteus` | ✓ entered; cast + Memphis geo |
| `telegonus-circe`, `callidice-thesprotian`, `polypoetes-thesprotian`, `poliporthes`, `leontophonus`, `neoptolemus` | In cast for variant endings; character files exist where noted in story cast |
| `theoclymenus` | ✓ entered; joins Telemachus' ship |
| Suitor batches | ✓ data layer complete; cast waves 1–10 + dual-catalogue Ithaca entries |

### Batch D — still deferred

- **`data/lineages/ithaca.json` expansion** — Laertes (and optionally "former kings") before Odysseus; sourced reign notes only.
- **Reference entries** for `arceisius`, `laertes`, `autolycus` if Wikipedia-section backfill is desired.
- **`docs/PLAN.md` cross-link** when M-odyssey milestone is formalized.

## 8. Relation & data-modeling notes

1. **`parent` from child to parent only.** Disputed paternity = competing topic-tagged `parent` edges on one child (`odysseus-parent-laertes` vs `odysseus-parent-sisyphus`).
2. **Autolycus has two mortal/divine parent edges** (`autolycus-parent-hermes`, `autolycus-parent-chione-daedalion`) — not a dispute; both name father and mother in the same tradition.
3. **Arceisius has no parent edge** until a seven-lens citation appears; do not invent a stemma from scholia or the *Catalogue of Women*.
4. **Laertes' Cephallenian kingship** is a sourced fact (`residences: ithaca`, `cephallenia`) — distinct from the sparse `ithaca.json` lineage file, which currently lists only Odysseus' reign.
5. **The boar-scar** and **Odysseus' naming** ("man of wrath") are narrative facts on Anticleia/Autolycus story paragraphs — no relation type for the hunt itself.
6. **Areas**: flagship city **`ithaca`** — ensure dynasty members with `residences` appear in `/city/ithaca` sky; `cephallenia` place holds Same suitors + Laertes residence.
7. **Boundary non-nodes** (prose only unless promoted in a verified batch): Palamedes, most suitors without individual files, Eurycleia's purchase price as a relation, the full Dolius son roster.

## 9. Primary-source map

- [Homer, *Odyssey* 1–4](https://www.theoi.com/Text/HomerOdyssey1.html) (Telemachus; Menelaus; Proteus news indirectly)
- [Homer, *Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html) (Anticleia's shade)
- [Homer, *Odyssey* 16–24](https://www.theoi.com/Text/HomerOdyssey16.html) (single-line house; Laertes; mnesterophonia)
- [Homer, *Odyssey* 19](https://www.theoi.com/Text/HomerOdyssey19.html) (Autolycus; scar; naming)
- [Homer, *Iliad* 2–3](https://www.theoi.com/Text/HomerIliad2.html) (Odysseus; Laertes' son)
- [Homer, *Iliad* 10](https://www.theoi.com/Text/HomerIliad10.html) (Autolycus' stolen cap)
- [Pseudo-Apollodorus, *Epitome* 3.10; 7.26–7.40](https://www.theoi.com/Text/Apollodorus3.html)
- [Pseudo-Apollodorus, *Bibliotheca* 1.9.16](https://www.theoi.com/Text/Apollodorus1.html) (Autolycus → Polymede → Jason)
- [Hyginus, *Fabulae* 200–201](https://www.theoi.com/Text/HyginusFabulae1.html) (Chione; Autolycus; Sisyphus scandal)
- [Ovid, *Metamorphoses* 11.301–317](https://www.theoi.com/Text/OvidMetamorphoses11.html) (Chione's twins)

## 10. Existing-node collision list (resolve before any new id)

| Proposed name | Collision | Resolution |
|---|---|---|
| Eurylochus | Companion vs Zacynthus suitor | `eurylochus` vs `eurylochus-zacynthus` ✓ |
| Euryalus | Three-way | `euryalus-ithaca`, `euryalus-zacynthus`; Phaeacian in prose only |
| Polybus | Ithaca vs Zacynthus | `polybus-ithaca`, `polybus-zacynthus` ✓ |
| Chione | Daedalion's daughter vs others | `chione-daedalion` ✓ |
| Helenus | Ithaca suitor vs Trojan seer | `helenus-ithaca` vs `helenus` ✓ |
| Anticleia | — | single node `anticleia` |
| Autolycus | — | single node `autolycus` |
| Odysseus | — | single node `odysseus` |

## 11. Next incremental slices (suggested order)

1. **Lineage panel** — expand `data/lineages/ithaca.json` with Laertes (and sourced note on Cephallenian rule) without inventing kings before Arceisius.
2. **Reference backfill** — neutral entries for Laertes, Autolycus, Anticleia (CC BY-SA attributed).
3. **Thamyris / Argiope branch** — Philammon's son (Pausanias; already flagged in odyssey slice prompt § E).
4. **`pnpm bake-layout`** — once parallel agent work pauses; id renames from suitor batches may have stale galaxy positions.
