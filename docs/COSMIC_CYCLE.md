# The Cosmic Cycle — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus + character-layer citations), 2026-06-16. **Batch 1** — cosmogony expansion + Titanomachy, Typhonomachy, Gigantomachy, Prometheus & Pandora episodes + great-flood expansion. Gates M10.2; **no new character nodes** — cast links only to existing stars.
>
> Scope: the inner-cosmos narrative shelf (era 0–2). Character agents own roster expansion; this track owns **Stories** depth only.

## 1. Why this track

1. **The stars are done; the saga is not.** M2.20 completed primordial broods, elder/younger Titans, Typhon, Deucalion, Pandora, Prometheus — but `cosmogony.json` stops at Uranus' castration (3 chapters) and there is no Titanomachy, Typhonomachy, or Gigantomachy story at all.
2. **Zero collision with character agents.** ILIAD_ROSTER, Odyssey/Ithaca, and dynasty batches add nodes; this dossier adds **zero** — only `data/stories/*.json` and optional `storyIds` backfill on geo places later.
3. **Disputes are already documented.** CONTRADICTIONS.md carries load-bearing topics for this shelf (`division-of-the-cosmos`, `fire-bringer`, `prometheus-creation-of-man`, `pandora-animation`, `first-woman`, `flood-landing`, `flood-survivors`, `gigantes-parentage`). Chapters that surface competing variants **must** share the matching `topic` key.

## 2. Story tree (target)

```
era 0   cosmogony              (expand — Cronus' reign, Rhea's stone)
          ├─ birth-of-aphrodite (episode — foam-born; aphrodite-parentage)
          ├─ birth-of-zeus      (episode — Dicte cave, stone trick; Cretan nursery)
          ├─ titanomachy       (ten-year war, Tartarus)
          │    ├─ the-swallowed-siblings (episode — five devoured, Metis' drug, omphalos)
          │    ├─ birth-of-athena      (episode — Metis swallowed; athena-parentage)
          │    ├─ apollo-artemis-delos (episode — Leto on Delos)
          │    ├─ birth-of-hermes      (episode — Maia at Cyllene; cattle and lyre)
          │    ├─ birth-of-hephaestus  (episode — Hera alone vs Zeus+Hera; fall; Thetis cave)
          │    └─ birth-of-ares        (episode — Zeus+Hera; ares-conception Ovid variant)
          ├─ typhonomachy      (Gaia's last revolt)
          ├─ gigantomachy      (Phlegra, Heracles)
          ├─ prometheus-fire   (Mecone, theft, binding)
          │    └─ pandora      (moulded maiden, jar)
era 2   great-flood            (Ogyges prologue, repopulation, Hellen)
          └─ five-ages         (episode — Hesiod WD 109-201 in full)

era 5   theban-cycle
          └─ semele-and-the-birth (episode — Dionysus thigh-birth; dionysus-first-birth)
```

`great-flood` stays a top-level saga (era 2): it closes the succession myth arc into mortal time, not nested under cosmogony, so the `/stories` index keeps a clear cosmology → catastrophe shelf break.

## 3. Evidence policy

| Source id | Material for this shelf |
|---|---|
| `hesiod` | Primary spine — *Theogony* 116–885 (cosmogony through Typhoeus), *Works and Days* 42–105 (fire, Pandora, Five Ages) |
| `apollodorus` | Systematic summaries — Bibl. 1.1–1.7 (succession, Gigantomachy, flood, Prometheus) |
| `homer` | *Iliad* 15.187–193 (lot division); *Odyssey* 7.56–60 (Giants as wild tribe) |
| `ovid` | *Metamorphoses* 1 (alternative cosmogony, Lycaon, flood) |
| `hyginus` | *Fabulae* 139–144, 152–153 (Cronus stone, Prometheus clay, flood on Etna) |
| `pausanias` | Delphi omphalos stone, Gigantomachy local variants (Enceladus/Sicily), flood survivors |
| `apollonius` | Deucalion as city-founder (*Argonautica* 3.1085–1095) — secondary colour |

Out of scope until a later Epic-Cycle milestone: Orphic cosmogonies, Nonnus' *Dionysiaca*, Statius.

## 4. Chapter map (Theogony spine)

| Passage | Story file | Chapter beat |
|---|---|---|
| Th. 116–210 | cosmogony | Chaos → castration (Aphrodite beat — see `birth-of-aphrodite`) |
| Th. 176–206 | birth-of-aphrodite | Foam-born; Cythera/Cyprus; Homer vs Hesiod |
| Th. 886–926 | birth-of-athena | Metis swallowed; head-birth; axe dispute |
| Th. 918–923; Bibl. 1.4.1 | apollo-artemis-delos | Leto persecuted; twins on Delos |
| Th. 938–939; Bibl. 3.10.2 | birth-of-hermes | Maia at Cyllene; cattle theft; lyre |
| Th. 927–929; Il. 1.590–594, 18.394–405; Bibl. 1.3.5 | birth-of-hephaestus | Hera alone vs Zeus+Hera; fall; Ocean cave |
| Th. 921–923; Il. 5.889–898; Fasti 5.229–258 | birth-of-ares | Zeus+Hera; Ovid fatherless Mars |
| Th. 453–467 | cosmogony | Cronus swallows his first five children |
| Th. 468–491 | birth-of-zeus | Rhea's counsel; Dicte cave; stone in swaddling clothes |
| Th. 497–506 | the-swallowed-siblings | Metis' drug; stone at Pytho; five disgorged |
| Th. 617–735 | titanomachy | Ten-year war; Cyclopes; Hundred-Handers |
| Th. 820–880 | typhonomachy | Typhoeus born; blasted down |
| Th. 881–885 | titanomachy | Zeus king (vs Homer's lot — `division-of-the-cosmos`) |
| Bibl. 1.6.1–2 | gigantomachy | Oracle; Heracles; individual slayings |
| Th. 535–616; WD 42–105 | prometheus-fire | Mecone; fire theft |
| Th. 570–593; WD 60–105 | pandora | Moulded maiden; jar |
| Bibl. 1.7.2; WD 143–201 | great-flood | Deluge; stones; Five Ages |

## 5. Cast — existing character ids only

| Figure | id | Notes |
|---|---|---|
| Cronus, Rhea, Zeus | `cronus`, `rhea`, `zeus` | |
| Swallowed siblings | `hestia`, `demeter`, `hera`, `hades`, `poseidon` | |
| Cyclopes | `brontes-cyclops`, `steropes-cyclops`, `arges-cyclops` | |
| Hundred-Handers | `cottus`, `briareus`, `gyges-hecatoncheir` | |
| Typhon, Echidna | `typhon`, `echidna` | |
| Gigantes (collective) | `gigantes` | Named kings stay prose until promoted |
| Heracles | `heracles` | Gigantomachy mortal ally |
| Prometheus, Epimetheus | `prometheus`, `epimetheus` | |
| Pandora | `pandora` | |
| Gift-givers | `hephaestus`, `athena`, `aphrodite`, `hermes` | Pandora workshop |
| Flood line | `deucalion`, `pyrrha`, `prometheus`, `themis`, `hellen`, `lycaon` | |
| Primordials (cosmogony) | `chaos`, `gaia`, `uranus`, `tartarus`, `eros`, `nyx`, `erebus`, `aphrodite` | |
| Olympian births (Batch 1) | `athena`, `metis`, `apollo`, `artemis`, `leto`, `dione`, `semele`, `dionysus` | `birth-of-aphrodite`, `birth-of-athena`, `apollo-artemis-delos`, `semele-and-the-birth` |
| Olympian births (Batch 2) | `hermes`, `maia`, `hephaestus`, `ares`, `thetis`, `eurynome`, `atlas` | `birth-of-hermes`, `birth-of-hephaestus`, `birth-of-ares` |
| Olympian births (Batch 3) | `zeus`, `hestia`, `demeter`, `hera`, `hades`, `poseidon`, `metis` | `birth-of-zeus`, `the-swallowed-siblings` |

## 6. Places

Story `places[].id` must match `data/geo/cities.json` (validator rule). Myth sites without a city node use **plain names only**:

| Name | city id | When |
|---|---|---|
| Knossos (Crete nursery) | `knossos` | titanomachy |
| Troy, etc. | — | not used on this shelf |

Delphi, Parnassus, Olympus, Phlegra, Caucasus — plain `name` + `role` until promoted in a Lands batch.

## 7. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `aphrodite-parentage` | cosmogony ch. sickle; `birth-of-aphrodite` ch. Dione |
| `athena-parentage` | `birth-of-athena` ch. axe / Libyan tradition |
| `hephaestus-conception` | `birth-of-hephaestus` ch. Hera alone vs Homer |
| `hephaestus-fall-from-olympus` | `birth-of-hephaestus` ch. Hera vs Zeus throw; Lemnos vs Ocean |
| `ares-conception` | `birth-of-ares` ch. Ovid Fasti flower / fatherless Mars |
| `dionysus-first-birth` | `semele-and-the-birth` ch. two mothers (Hyginus Zagreus) |
| `division-of-the-cosmos` | titanomachy closing chapter |
| `cyclopes-nature` | titanomachy (Cyclopes freed vs Homer's savage race — prose only unless split) |
| `prometheus-creation-of-man` | prometheus-fire ch. 1 |
| `fire-bringer` | prometheus-fire ch. 3 |
| `pandora-animation` | pandora ch. 2 |
| `first-woman` | pandora summary / closing |
| `gigantes-parentage` | gigantomachy ch. 1 |
| `flood-landing` | great-flood ch. chest / landing |
| `flood-survivors` | great-flood ch. who survived |
| `flood-repopulation` | great-flood ch. bones of the mother |
| `hellen-paternity` | great-flood closing chapter |
| `ogyges-deluge-tradition` | great-flood prologue |

## 8. Batch plan

- **Batch 1 (done)** — dossier + 6 new story files + cosmogony/great-flood expansion.
- **Batch 2 (done)** — character codex "Appears in the myths" cross-links; `storyIds` on Delphi, Parnassus, Knossos; multi-saga map panel links; `data/story-culture/` galleries on story pages (cosmogony, titanomachy, typhonomachy, great-flood, prometheus-fire).
- **Batch 3 (done)** — `five-ages` episode under `great-flood`; Ogygian deluge prologue + `ogyges-deluge-tradition`; repopulation and Hellen chapters with dispute topics; `story-culture` for gigantomachy and pandora.
- **Olympian Births Batch 1 (done)** — `birth-of-aphrodite`, `birth-of-athena`, `apollo-artemis-delos`, `semele-and-the-birth`; dispute topics `aphrodite-parentage`, `athena-parentage`, `dionysus-first-birth`.
- **Olympian Births Batch 2 (done)** — `birth-of-hermes`, `birth-of-hephaestus`, `birth-of-ares`; dispute topics `hephaestus-conception`, `hephaestus-fall-from-olympus`, `ares-conception`.
- **Olympian Births Batch 3 (done)** — `birth-of-zeus`, `the-swallowed-siblings`; **Olympian births shelf complete**. Design: **hybrid (C)** — Zeus gets a standalone Crete/stone episode parented under `cosmogony` (era 0.06, after `birth-of-aphrodite`); the five siblings share one group episode `the-swallowed-siblings` parented under `titanomachy` (era 0.15) because swallow/disgorge is a single narrative beat. Avoids six thin duplicates and verbatim overlap with `cosmogony` ch. 4–5 / `titanomachy` ch. 1; expands with dedicated cast, `knossos`/`Pytho` places, Metis emetic (Apollodorus), Amalthea/Curetes nursing. No new dispute topics — division-of-cosmos stays in `titanomachy` closing chapters only.

## 9. Same-name hazards

None for new **characters**. Story cast must not introduce plain names that collide with unpromoted homonyms without disambiguation in `role` prose (e.g. "Cronus the Titan" not "Cronus son of Minos").

## 10. Verification checklist

After each batch:

```bash
pnpm validate-data
```

No `pnpm validate-layout` required (no character/relation edits).
