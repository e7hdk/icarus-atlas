# The Argonautica — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (character-layer citations + CONTRADICTIONS), 2026-06-16. **Batch 1** — root saga + five episodes (golden fleece prologue through Pelias' doom). Gates M10.2 Argonaut shelf; **no new character nodes** — cast links only to existing stars.
>
> Scope: the voyage shelf (era ~7). Character agents own roster expansion; this track owns **Stories** depth only.

## 1. Why this track

1. **The sky is ready.** Jason, Pelias, Aeetes, Medea, Phrixus, and dozens of named Argonauts are already stars; Apollonius' lens has a full character codex on Jason and Medea but no story file.
2. **Zero collision with character agents.** ILIAD_ROSTER and parallel batches add nodes; this dossier adds **zero** — only `data/stories/*.json`, shelf wiring, optional geo `storyIds`, and `story-culture/`.
3. **Disputes are documented.** CONTRADICTIONS carries `jason-mother`, `ram-golden-ram-parentage`, `phrixus-cretheus-parentage`, `pelias-paternity`, `apsyrtus-death`. Chapters that surface competing variants **must** share the matching `topic` key.

## 2. Story tree (Batch 1)

```
era 7   argonautica              (root — framing chapters)
          ├─ golden-fleece       (era 6.95 — Phrixus, Helle, fleece at Aea)
          ├─ muster-of-the-argo  (era 6.99 — Pelias, one sandal, ship, catalogue)
          ├─ voyage-to-colchis   (era 7.01 — Lemnos, Cyzicus, Phineus, Symplegades)
          ├─ trials-at-colchis   (era 7.05 — Medea, bulls, dragon, theft)
          ├─ return-of-the-argo  (era 7.1 — Apsyrtus, Rocks, Corcyra, Pelias)
          └─ medea-at-corinth    (era 7.15 — Glauce, poisoned robe, sons, flight)
```

Corinth closes the Argonautica shelf on the pinned seven lenses. Euripides' deliberate infanticide is out of scope (not in the corpus); the episode surfaces only the forked Greek traditions documented in CONTRADICTIONS (`medea-children-corinth`).

## 3. Evidence policy

| Source id | Material for this shelf |
|---|---|
| `apollonius` | Primary spine — *Argonautica* 1–4 (muster, voyage, Colchis, return) |
| `apollodorus` | Systematic summaries — Bibl. 1.9.1 (Phrixus), 1.9.16–27 (Jason through Pelias) |
| `homer` | *Odyssey* 12.69–72 (Wandering Rocks, Hera's favour); *Iliad* 7.467–469 (Euneus of Lemnos) |
| `hesiod` | *Theogony* 956–961 (Medea daughter of Aeetes and Idyia) |
| `hyginus` | *Fabulae* 3, 14 (ram parentage variant); Argonaut roll |
| `ovid` | *Metamorphoses* 7.1–158 (Medea's arts; Pelias episode colour) |
| `pausanias` | Local Argonaut lore (secondary colour) |

Out of scope until a later milestone: Valerius Flaccus, full Euripidean *Medea* (not in the seven lenses).

## 4. Cast — existing character ids only

| Figure | id | Notes |
|---|---|---|
| Jason, Aeson, Pelias | `jason`, `aeson`, `pelias` | |
| Phrixus line | `phrixus`, `helle`, `nephele`, `athamas` | |
| Colchians | `aeetes`, `medea-colchis`, `idyia-oceanid`, `apsyrtus-colchis` | |
| Ship & seers | `argus-arestor`, `tiphys`, `mopsus`, `phineus-thrace` | |
| Named Argonauts | `heracles`, `orpheus`, `atalanta`, `castor`, `polydeuces`, `peleus`, `telamon`, `hylas` | Catalogue in prose for the rest |
| Voyage hosts | `hypsipyle`, `thoas-lemnos`, `cyzicus-dolion`, `amycus-bebrycian` | |
| Gods | `hera`, `athena`, `eros`, `hecate` | |
| Phaeacians | `arete-phaeacian`, `alcinous-phaeacian` | Corcyra episode |
| Jason's mother fork | `polymede` vs plain **Alcimede** | `jason-mother` |

## 5. Places

| Name | city id | When |
|---|---|---|
| Iolcus | `iolcus` | muster, return |
| Aea / Colchis | `aea-colchis` | golden-fleece, trials |
| Lemnos | `lemnos` | voyage |
| Corcyra | `corcyra` | return |
| Corinth | `corinth` | medea-at-corinth |

Symplegades, Propontis, Mount Pelion — plain `name` + `role` until promoted.

## 6. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `ram-golden-ram-parentage` | golden-fleece ch. the ram |
| `phrixus-cretheus-parentage` | golden-fleece ch. why Phrixus fled |
| `jason-mother` | muster ch. Jason's birth |
| `pelias-paternity` | muster ch. Pelias on the throne |
| `eros-origin` | trials ch. Medea's desire (Apollonius' child Eros vs Hesiod) |
| `apsyrtus-death` | return ch. the brother slain |
| `medea-children-corinth` | medea-at-corinth ch. who killed the sons |

## 7. Batch plan

- **Batch 1 (done)** — dossier + root + 5 voyage episodes + Argonautica shelf on `/stories` + `story-culture/argonautica.json` + geo `storyIds` on Iolcus, Aea, Lemnos, Corcyra.
- **Batch 2 (done)** — `medea-at-corinth` episode; `story-culture/medea-at-corinth.json`; Corinth geo `storyIds`.

## 8. Same-name hazards

- **Argus** — `argus-arestor` (Argo builder) vs `argus-colchis` (Phrixus' son at Aea). Never merge.
- **Actor** — multiple Argonaut Actors; catalogue stays prose unless a promoted id is chosen.

## 9. Verification checklist

After each batch:

```bash
pnpm validate-data
```

No `pnpm validate-layout` required (no character/relation edits).
