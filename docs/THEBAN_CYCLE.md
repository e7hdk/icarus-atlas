# The Theban Cycle — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (character-layer citations + CONTRADICTIONS), 2026-06-16. **Batch 1** — root saga + five new episodes + re-parented `seven-against-thebes`. Gates M10.2 Theban shelf; **no new character nodes** — cast links only to existing stars.
>
> Scope: the Cadmean house (era ~5–6). Character agents own roster expansion; this track owns **Stories** depth only.

## 1. Why this track

1. **The Theban sky is whole.** `THEBES_DYNASTY.md` completion batch landed Cadmus through Thersander; `seven-against-thebes.json` was a lone top-level war with prologue and epilogue chapters folded in.
2. **Zero collision with character agents.** This dossier adds **zero** character nodes — only `data/stories/*.json`, shelf wiring, geo `storyIds`, and `story-culture/`.
3. **Disputes are documented.** CONTRADICTIONS carries `europa-paternity`, `sphinx-parentage`, `oedipus-children-mother`, `haemon-death`. Chapters that surface competing variants **must** share the matching `topic` key.

## 2. Story tree (Batch 1)

```
era 6   theban-cycle              (root — framing chapters)
          ├─ cadmus-and-thebes    (era 5 — cow, dragon, Spartoi, Harmonia)
          ├─ pentheus-and-dionysus (era 5.4 — the maenads' king)
          ├─ oedipus-at-thebes    (era 5.8 — Laius, Sphinx, revelation, curse)
          ├─ oedipus-at-colonus   (era 5.85 — exile, Theseus, death and tomb)
          ├─ seven-against-thebes (era 6 — re-parented; war only)
          ├─ antigone-at-thebes   (era 6.02 — unburied Polynices)
          └─ epigoni              (era 6.1 — sons of the Seven return)
          └─ alcmaeon-wanderings  (era 6.15 — matricide, purification, Acarnania)
```

The later Alcmaeon material beyond Apollodorus 3.7.7 (full Euripides `Alcmaeon` plot, Tegean settlement detail) stays **out of scope** unless a future character batch promotes plain-name cast.

## 3. Evidence policy

| Source id | Material for this shelf |
|---|---|
| `apollodorus` | Primary spine — Bibl. 3.4–3.7 (Cadmus through Epigoni) |
| `homer` | *Odyssey* 11 (Oedipus, Epic Cycle colour); *Iliad* 4–14 (Epigoni at Troy) |
| `hesiod` | *Theogony* 975–983 (Cadmus, Harmonia); Semele/Dionysus 940–942 |
| `hyginus` | *Fabulae* 67–72 (Seven, Antigone, Epigoni variants) |
| `pausanias` | Boeotian topography — gates, tombs, Euryganeia tradition |
| `ovid` | *Metamorphoses* 3–4 (Cadmus, Pentheus); 7 (Sphinx riddle colour) |

## 4. Cast — existing character ids only

See individual story files. Homonym guard: `creon` (Theban) ≠ `creon-corinth`; `echion` (Spartos) is the Theban founder, not the Argonaut.

## 5. Places

| Name | city id | When |
|---|---|---|
| Thebes | `thebes` | all episodes |
| Argos | `argos` | seven-against-thebes, epigoni, alcmaeon-wanderings |
| Delphi | `delphi` | cadmus-and-thebes, oedipus-at-thebes, alcmaeon-wanderings |
| Athens | `athens` | oedipus-at-colonus |
| Colonus | plain `name` | oedipus-at-colonus (Attic deme; no separate geo node) |
| Argos Amphilochicum | `argos-amphilochicum` | alcmaeon-wanderings |
| Psophis, Achelous, Epirus, Tegea | plain `name` | alcmaeon-wanderings |

Cithaeron, Glisas — plain `name` + `role`.

## 6. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `europa-paternity` | cadmus ch. the search |
| `sphinx-parentage` | oedipus ch. the monster |
| `oedipus-children-mother` | oedipus ch. the children |
| `haemon-death` | antigone ch. Creon's son |
| `oedipus-death-place` | oedipus-at-colonus ch. where the king died |
| `alcmaeon-matricide-agency` | alcmaeon-wanderings ch. matricide at Thebes |
| `amphilochus-parentage` | alcmaeon-wanderings ch. Delphi and Acarnania |

## 7. Batch plan

- **Batch 1 (done)** — dossier + root + 5 episodes + re-parent `seven-against-thebes` + Theban shelf on `/stories` + `story-culture/theban-cycle.json` + geo `storyIds` on Thebes, Argos, Delphi.
- **Batch 2 (done)** — `oedipus-at-colonus` episode + `story-culture/oedipus-at-colonus.json` + geo `storyIds` on Athens and Thebes + `oedipus-death-place` in CONTRADICTIONS.
- **Batch 3 (done)** — `alcmaeon-wanderings` episode + `story-culture/alcmaeon-wanderings.json` + geo `storyIds` on Thebes, Delphi, Argos, Argos Amphilochicum + dispute topics wired on shelf.

## 8. Verification checklist

```bash
pnpm validate-data
```
