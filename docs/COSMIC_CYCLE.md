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
          ├─ titanomachy       (NEW — ten-year war, Tartarus)
          ├─ typhonomachy      (NEW — Gaia's last revolt)
          ├─ gigantomachy      (NEW — Phlegra, Heracles)
          ├─ prometheus-fire   (NEW — Mecone, theft, binding)
          │    └─ pandora      (NEW — moulded maiden, jar)
era 2   great-flood            (expand — Ogyges prologue, repopulation, Hellen)
          └─ five-ages           (episode — Hesiod WD 109-201 in full)
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
| Th. 116–210 | cosmogony | Chaos → castration → Aphrodite |
| Th. 453–506 | cosmogony | Cronus swallows; Rhea hides Zeus |
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
| `aphrodite-parentage` | cosmogony ch. sickle (already in castration beat) |
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

## 9. Same-name hazards

None for new **characters**. Story cast must not introduce plain names that collide with unpromoted homonyms without disambiguation in `role` prose (e.g. "Cronus the Titan" not "Cronus son of Minos").

## 10. Verification checklist

After each batch:

```bash
pnpm validate-data
```

No `pnpm validate-layout` required (no character/relation edits).
