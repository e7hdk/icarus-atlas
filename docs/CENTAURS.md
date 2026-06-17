# The Centaurs — origin, Chiron, and the Lapith wars — Research Dossier

> Research status: source-mapped against the seven atlas lenses (`pnpm corpus:search` + character/relation audit), 2026-06-15. Three centaur **character nodes** already existed (`chiron`, `nessus`, `pholus`); the Lapith war is referenced in prose on `polypoetes-lapith`, `leonteus-lapith`, and `atalanta`, but the origin figures (Ixion, Centauros, Peirithous) and most named centaurs had **no nodes yet**. This dossier gates entry; same-name hazards and existing-node collisions must be resolved before any character is written (per CLAUDE.md hard rule 7).
>
> **Batch A entered 2026-06-15** (M2.22): 6 figures — `ixion`, `centauros`, `philyra`, `chariclo-centaur`, `nubes-ixion`, `silenus` — plus relation pass on `chiron`, `pholus`, `nessus`, `endeis`. Four documented contradictions (`ixion-cloud-mother`, `nessus-parentage`, `endeis-parentage`, `peirithous-paternity` on deferred `peirithous`). Chiron gains mother `philyra` and consort `chariclo-centaur`; Pholus gains father `silenus`.
>
> **Batch B entered 2026-06-15** (M2.22, with war story): 4 figures — `peirithous`, `hippodameia-lapith`, `caeneus-lapith`, `eurytion-centaur` — wired to `theseus`, `polypoetes-lapith`, `heracles`. Story episode `lapith-centaur-war` under `theseus-cycle`; cast id `peirithous` fixes `pirithous-and-the-underworld`.
>
> **Batch C entered 2026-06-15** (M2.22) — house complete: 3 figures — `rhoecus-centaur`, `hylaeus-centaur`, `elatus-centaur` — plus edges: `atalanta` slayer of both Arcadian assailants; `heracles` accidental slayer of `chiron`; `elatus-centaur` adversary `heracles`.
>
> **Batch D entered 2026-06-15** (M2.22 extension): 16 Ovid Met. 12 wedding centaurs — `styphelus-centaur`, `bromus-centaur`, `antimachus-centaur`, `elymus-centaur`, `pyracmos-centaur`, `latreus-centaur`, `dictys-centaur`, `helops-centaur`, `melaneus-centaur`, `abas-centaur`, `asbolus-centaur`, `gryneus-centaur`, `amycus-centaur`, `petraeus-centaur`, `lycus-centaur`, `chromis-centaur`. Wired to `caeneus-lapith` and `peirithous`; `lapith-centaur-war` cast expanded. Thaumas, Pisenor, Mermerus and other fleeting names stay note-only.
>
> **The centaur cluster is complete (A+B+C+D = 29 new figures + 3 existing centaurs enriched).**
>
> **Schema note (2026-06-15):** all centaur nodes carry `type: "creature"` and include `kinds: ["centaur"]` (Batch 0 backfill complete). Star colour stays magenta — kinds are display-only.
>
> Scope: the two centaur genealogies (Chiron's divine line vs Ixion's wild stock), the major attested centaurs, the Lapith–centaur wars (Peirithous' wedding and the later Pelium expulsion), and the Heracles labour cluster (Pholus cave, Nessus at Evenus, Chiron's death). **Not** a city dynasty — no lineage file; geo anchors are Mount Pelion, Arcadian Pholoe, the river Evenus, and Thessaly/Larissa.

## 1. Why this cluster

1. **Two origins, one sky.** Ancient sources never fully reconcile Chiron (Cronus + Philyra, just and civilized) with the wild centaurs (Ixion + cloud → Centauros → the race). The atlas should **show both genealogies** and let the lenses disagree — not flatten them.
2. **Chiron is already a hub.** He tutors `achilles`, `jason`, `peleus`; fostered Asclepius and Actaeon; died in the Pholus riot. His mother **Philyra** is named in relations prose but has **no node**; his wife **Chariclo** collides with the existing Theban nymph `chariclo`.
3. **The Lapith war is half-wired.** `polypoetes-lapith` and `leonteus-lapith` cite Peirithous driving centaurs from Pelium, but **Peirithous**, **Ixion**, **Hippodameia**, and **Caeneus the Lapith** are missing — while `caeneus-gortyn` is a **different** Argonaut.
4. **Heracles batch left threads.** `nessus` and `pholus` entered with Heracles Batch C; **Eurytion the centaur** (Dexamenus / wedding traditions) is still prose-only and must not merge with the existing Phthian king `eurytion`.
5. **Stories already cite centaurs** (`twelve-labours`, `death-of-heracles`, `deianira-at-the-feast`, `argonautica`, `pirithous-and-the-underworld`) — character entry will let cast links resolve to real nodes.

## 2. Evidence policy

| Source id | Material |
|---|---|
| `apollodorus` | Chiron's birth (Bibliotheca 1.2.4); Pholus cave & centaur rout (2.5.4); Nessus/Evenus & poison shirt (2.7.6–7); centaur Eurytion at Olenus (2.5.5); Caeneus vs centaurs (Epitome 1.22); Ixion → Centaurus (Epitome 1.20); Calydonian roll (1.8.2) |
| `homer` | Drunk Eurytion at Peirithous' feast (Odyssey 21); Peirithous' vengeance on centaurs at Pelium (Iliad 2.735–775); Nestor's roll of mightiest men vs centaurs (Iliad 1.262–282); Zeus & Ixion's wife (Iliad 14.317–328) |
| `hyginus` | Nessus son of Ixion & Nubes (Fabulae 34); Peirithous brother of Centaurus (Fabulae 14.2); Pholus OR Chiron as constellation Centaurus (Astronomica 2.38.3); Caeneus invulnerability (Fabulae 14) |
| `ovid` | Nessus/Deianira (Met. 9); Lapith–centaur battle at wedding (Met. 12.315–463) with named centaurs; Chiron/Asclepius fosterage (Met. 2) |
| `apollonius` | Chiron on Pelion, Argonaut farewell (Argonautica 1.553–558); Chiron's birth from Philyra (Argonautica 2.1231–1241) |
| `hesiod` | Medeus reared by Chiron (Theogony 1000–1002) |
| `pausanias` | Centaur battle on throne of Amyclae (3.18.10–12); Peirithous pediment at Athens (1.28.2); Olenus & centaur Eurytion (7.17.1) |

Out of scope (research-only): Pindar (*Pythian* 2 Ixion); Statius *Achilleid* (Chiron paternal theme); Diodorus; scholia-only names; exhaustive Ovid Met. 12 centaur catalogue unless promoted in Batch C.

## 3. Genealogies (source-conscious)

Bracketed nodes exist; "(NEW)" marks proposed entry; "[note]" = attested name, no node.

```text
── CHIRON'S LINE (the just centaur) ──
[cronus] + Philyra (Oceanid) (NEW) ── [chiron] + Chariclo-centaur (NEW)
         │                              ├── Endeïs? [endeis] (parentage disputed: Sciron vs Chiron — already prose)
         │                              ├── foster: Asclepius, [achilles], [jason], [actaeon], Medeus …
         │                              └── death: Hydra arrow → Prometheus swap (Bibliotheca 2.5.4, 2.5.11)

── IXION'S LINE (the wild centaurs) ──
Ixion (NEW) + cloud (Zeus' phantom Hera → Centaurus per Apollodorus; Ixion + Nephele/Nubes per Hyginus)
         ├── Centaurus (NEW) ── the centaur race [note: many unnamed]
         │        └── [nessus] (Hyginus: son of Ixion & Nubes; ref layer also: son of Centauros)
         └── Peirithous (NEW) (Homer: son of Zeus by Ixion's wife; Hyginus: son of Ixion, brother of Centaurus)
                  + Hippodameia (NEW) ── wedding war (Eurytion-centaur seizes bride)
                  └── [polypoetes-lapith] (born when centaurs driven from Pelium)

── PHOLUS' LINE (hospitality centaur) ──
Silenus (NEW?) + Melian nymph [note] ── [pholus]
         └── common wine-jar → riot → [heracles] pursuit → [chiron] wounded

── LAPITH ALLIES (not centaurs; interlock Batch B) ──
Caeneus-lapith (NEW) — invulnerable; buried under pines (Apollodorus Epit. 1.22; Ovid Met. 12)
Dryas [note], Exadius [note], [theseus], [polypoetes-lapith], [leonteus-lapith]
```

### Who is the "first centaur"?

| Claim | Sources | Atlas handling |
|---|---|---|
| **Chiron** — "a centaur of double form," born to Cronus and Philyra | Apollodorus 1.2.4; Apollonius Arg. 2.1231–1241 | **Primary node** — already entered; prose cites him as the civilized first teacher |
| **Centaurus** — born from Ixion and the cloud | Apollodorus Epitome 1.20 | **Proposed node** — progenitor of the wild race; father of Nessus in encyclopedic tradition |
| **Chiron** — "first among centaurs" in healing | Hyginus via reference layer | Reference prose only unless we add a `centaur-firstborn` dispute topic |

Do **not** pick one origin as undisputed. Chiron's separate parentage is the canonical explanation for his difference from the wild centaurs (Apollodorus 1.2.4; Hyginus Fabulae 138 / Astronomica 2.38).

## 4. Same-name hazard map & existing-node collisions

| Name | Resolution |
|---|---|
| **Eurytion** | **COLLISION** — `eurytion` is the Phthian king, son of Actor (`peleus` slayer at Calydon). The **centaur** Eurytion (Odyssey wedding; Apollodorus Olenus/Dexamenus; Hyginus son of Ixion & Nubes) → **`eurytion-centaur`**. Never merge. |
| **Caeneus** | **COLLISION** — `caeneus-gortyn` is the Argonaut son of Coronus. The **invulnerable Lapith** Caeneus (Peirithous' ally) → **`caeneus-lapith`**. |
| **Chariclo** | **COLLISION** — `chariclo` is the Theban nymph, mother of Tiresias. Chiron's wife on Pelion → **`chariclo-centaur`**. |
| **Elatus** | **COLLISION** — `elatus-arcadia` is Arcas' son. The centaur wounded in Pholus' fight (arrow through arm) → **`elatus-centaur`** or note-only in `pholus`/`chiron` prose. |
| **Nephele / Nubes** | **COLLISION** — `nephele` is Athamas' cloud-wife (Phrixus/Helle). Ixion's cloud-mate is a **separate tradition** (Hyginus *Nubes*). Do not retcon the existing node; either **`nubes-ixion`** as a distinct figure or narrate Ixion's cloud parentage in prose on `ixion` / `centauros` with a documented **`ixion-cloud-mother`** dispute if both are noded. |
| **Dictys** | `data/reference/dictys.json` covers the centaur at the wedding; distinct from **`dictys-centaur`** (Ovid Met. 12) and **`dictys`** the Seriphian fisherman. |
| **Pholus vs Chiron** | Both linked to constellation Centaurus (Hyginus Astr. 2.38.3) — **narrate in prose**, not a contradiction topic with competing edges on one node. |
| **Nessus parentage** | Son of **Centauros** (ref/encyclopedic) vs son of **Ixion & Nubes** (Hyginus Fabulae 34) → **`nessus-parentage`** if both parents are nodes. |
| **Peirithous / Pirithous** | Story cast uses `pirithous` in `pirithous-and-the-underworld.json`; character id should be **`peirithous`** (standard anglicization in atlas) with story cast updated on entry. |
| **Chiron, Nessus, Pholus, Heracles, Peleus, Achilles, Jason, Deianira, Atalanta, Theseus, Polypoetes, Leonteus** | already in atlas — link, never recreate. |

## 5. Current atlas inventory

### Character nodes (`type: creature`, cluster `mortal-arm`)

| id | Role | Relations wired |
|---|---|---|
| `chiron` | Wise centaur, Pelion tutor | parent → `cronus`; ally → `achilles`, `peleus`, `jason`. **Missing:** mother `philyra`, wife, wound from `heracles` (accident), Prometheus swap. |
| `nessus` | Evenus ferryman | mutual slayer ↔ `heracles`; cast in death-of-heracles stories. **Missing:** parentage edges, Lapith-war mention. |
| `pholus` | Pholoe host | ally ← `heracles`. **Missing:** parent Silenus, accidental death edge, Chiron wound cross-link. |

**Total dedicated centaur nodes: 3** (of ~1052 characters).

### Named in prose / reference only (candidates for promotion)

| Figure | Where cited | Batch |
|---|---|---|
| Eurytion (centaur) | Odyssey 21; Apollod. 2.5.5; Hyginus | B |
| Rhoecus, Hylaeus | `atalanta.json` | C (minor) |
| Elatus (centaur) | Apollod. 2.5.4 | C or note-only |
| Dictys, Melaneus, Abas, Latreus, Styphelus … | Ovid Met. 12; ref/dictys | C note-only unless art/cult anchor found |
| Centauros | Apollod. Epit. 1.20; ref/nessus | A |

### Lapith side (partially present)

| id | Status |
|---|---|
| `polypoetes-lapith`, `leonteus-lapith` | Nodes exist; cite Pelium war but parent `peirithous` missing |
| `caeneus-gortyn` | **Wrong Caeneus** — Argonaut, not the Lapith |
| `theseus` | Underworld episode with Pirithous; wedding battle not in character prose yet |

### Geo

| Feature | Status |
|---|---|
| `mount-pelion` | In `data/geo/features.json` — centaur homeland |
| Pholoe, Evenus, Malea, Olenus | **Not yet** feature/city nodes — add in Batch B geo pass or cite as plain place names until M9 geo grows |

## 6. Proposed contradiction topics

| Topic id | Competing claims | Citations |
|---|---|---|
| `nessus-parentage` | Son of Centauros vs son of Ixion & Nubes | ref/nessus; Hyginus Fabul. 34 |
| `ixion-cloud-mother` | Zeus' phantom Hera (→ Centaurus alone) vs Nephele/Nubes as mate of Ixion | Apollod. Epit. 1.20 vs Hyginus Fabul. 34 |
| `constellation-centaur-identity` | Chiron vs Pholus as the star-figure Centaurus | Hyginus Astr. 2.38.1–3 |
| `peirithous-paternity` | Son of Ixion vs Zeus by Ixion's wife | Hyginus Fabul. 14.2 vs Hom. Il. 14.317–328, 2.740–741 |
| `caeneus-sex-and-invulnerability` | Born woman, Poseidon grant vs always male | Apollod. Epit. 1.22 vs Hyginus Fabul. 14 — **narrate in prose** on `caeneus-lapith` unless we edge-model Poseidon grant |

`endeis-parentage` (Sciron vs Chiron) already lives on `endeis` — wire `chiron` as competing parent in Batch A if we add the Hyginus edge.

## 7. Roster & batch plan

### Batch A — Origins & Chiron's house (~6–8 figures)

`ixion`, `centauros`, `philyra`, `chariclo-centaur`, optionally `silenus` (Pholus' father — bridges to Dionysus circle).

- Wire `chiron` parent → `philyra` (new edge alongside existing `cronus`).
- Document **`nessus-parentage`**, **`ixion-cloud-mother`**, **`peirithous-paternity`** (Peirithous deferred to B but Ixion/Centauros land here).
- **`endeis-parentage`**: add Hyginus competing edge `chiron` parent `endeis` vs existing Sciron prose.
- Residences: `chiron` → Mount Pelion (when residence backfill runs).
- Three-layer codex for all new figures.

### Batch B — Lapith war & the missing king (~5–7 figures)

`peirithous`, `hippodameia`, `caeneus-lapith`, `eurytion-centaur`, optionally `dryas-lapith` (shepherd king in Nestor's roll).

- Relations: `peirithous` parent → `ixion` (+ competing `zeus` per Iliad); `polypoetes-lapith` parent → `peirithous` / `hippodameia`; `caeneus-lapith` adversary centaurs (generic cluster note); `eurytion-centaur` adversary `peirithous`, `heracles` slayer `eurytion-centaur` (Olenus labour); `theseus` ally `peirithous`.
- Update story cast ids: `pirithous` → `peirithous` in `pirithous-and-the-underworld.json`.
- **Story episode (optional same batch):** `lapith-centaur-war` under a Thessaly/Lapith shelf or as inset — sourced chapters from Homer Od. 21, Apollodorus, Ovid Met. 12.
- Geo: consider `olenus` city or feature for Dexamenus episode.

### Batch C — Named centaurs & Heracles cross-links (~4–6 figures + edges)

`rhoecus-centaur`, `hylaeus-centaur`, optionally `elatus-centaur`; **edges only** pass on existing nodes:

- `heracles` accidental slayer/wounder → `chiron`; `atalanta` slayer → `rhoecus-centaur`, `hylaeus-centaur`.
- Complete `pholus` parent → `silenus` if Silenus not in A.
- Ovid Met. 12 names (Styphelus, Bromus, Latreus, Dictys …) stay **note-only** unless a Pausanias/art anchor warrants promotion.

### Note-only / deferred

Bulk of the centaur race at the wedding (Amycus, Gryneus, Orius, Petraeus, … in Ovid); Nessus' brothers in Hyginus' CENTAURS passage; Mount Malea/Eleusis hiding-place centaurs; Dante's Phlegethon centaurs (out of lens).

## 8. Relation & data-modeling notes

1. **Type:** keep `creature` for centaurs (matches `chiron`, `nessus`, `pholus`); Lapiths remain `hero`.
2. **Cluster:** `mortal-arm` — same as existing centaurs and Thessalian heroes (per HERACLES_DYNASTY.md convention).
3. **Generation / layout:** divine-origin Chiron stays inner (Cronus parent); Ixion hangs off `zeus`/`hera` orbit; wild centaurs and Lapiths share the Thessaly mortal band; run `pnpm validate-layout` after relations.
4. **Homeric double paternity for Peirithous:** model as **`peirithous-paternity`** competing edges (`ixion` vs `zeus`), same pattern as `theseus-paternity`.
5. **Do not duplicate labour stories** — link `heracles`↔`pholus`/`nessus`/`eurytion-centaur` with relation notes pointing at existing `twelve-labours` / `death-of-heracles` stories.

## 9. Milestone proposal

**M2.22 — The Centaur cluster (Batches A–C):** ~15–20 new figures + relation pass on 3 existing centaurs; 1–3 new contradiction topics; optional story episode for the Lapith war; Pelion residence backfill. Target: centaur origin legible in the sky, Peirithous no longer a dangling name in Lapith prose, homonym ids stable.

## 10. Pre-entry checklist

- [ ] Confirm `peirithous` vs `pirithous` id for story cast migration
- [ ] Resolve `nubes-ixion` vs prose-only cloud parentage before Ixion entry
- [ ] Verify no id collision: `eurytion-centaur`, `caeneus-lapith`, `chariclo-centaur`, `elatus-centaur`, `rhoecus-centaur`, `hylaeus-centaur`
- [ ] Corpus pass on each new figure before JSON write
- [ ] `pnpm validate-data` + `pnpm validate-layout` after each batch
