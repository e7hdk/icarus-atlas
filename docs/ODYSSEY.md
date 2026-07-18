# The Odyssey — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses + CONTRADICTIONS, 2026-06-16. **Batch 1** — root trim + eight new nested episodes + existing `nekuia` and `telegony`; **no new character nodes**.

## 1. Story tree

```
era 9     odyssey                           (root — Returns shelf)
          ├─ telemachus-and-the-suitors     (era 9.0)
          ├─ lotus-and-cyclops              (era 9.01)
          ├─ winds-and-circe              (era 9.015)
          ├─ nekuia                       (era 9.02)
          ├─ sirens-and-the-strait          (era 9.025)
          ├─ calypso-and-scheria            (era 9.05)
          ├─ the-beggar-king                (era 9.08)
          ├─ slaughter-of-the-suitors       (era 9.1)
          ├─ penelope-tested                (era 9.12)
          └─ telegony                       (era 9.15)
```

Narrative order in Homer differs (Books 1–4 present, 5–8 present, 9–12 flashback at the Phaeacian court); era numbers follow **chronology of Odysseus' wanderings**, then Ithaca, then Epic-Cycle endings.

## 2. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `odysseus-death` | penelope-tested ch. Alternate endings; telegony ch. The sting-ray spear, Penelope and the Blest Isles |
| `penelope-antinous-affair` | penelope-tested ch. Alternate endings |
| `penelope-amphinomus-affair` | penelope-tested ch. Alternate endings |
| `odysseus-paternity` | prose only if cited in beggar/recognition colour — not yet a chapter topic |

## 3. Overlap policy

- **Nostoi / Agamemnon murder** — Agamemnon's shade in `nekuia`; full Mycenae arc on the Trojan shelf.
- **Telegony vs Homer** — Homer's reunion lives in `penelope-tested`; Circe's son lives in `telegony`.
- **Metamorphoses** — Circe/Scylla Ovid colour stays cross-shelf prose unless a dedicated Ovid episode is added later.

## 4. Batch log

- **Batch 1** — eight wanderings/Ithaca episodes + root trim + `docs/ODYSSEY.md` + geo `storyIds`.

## 5. Verification

```bash
pnpm validate-data
```

## 6. M13.1 micro-batch (Nostos, 2026-07-17)

Two nodes + one extension, corpus-verified (docs/NOSTOS_PLAN.md §7):

- **`mentor-ithaca`** — Odysseus' guardian of the house (Od. 2.225–241; Athena's guise 2.267–268, 2.399–406, 22.205–240, 24.502–548). **Same-name hazard:** `mentor-eurystheus` (Heraclid-cycle homonym) and `mentor-trojan` already exist — the bare id `mentor` stays unused.
- **`argos-dog`** — the hound (Od. 17.290–327), `type: creature`, `kinds: ['hound']` (new controlled kind, NOSTOS_PLAN D10). **Same-name hazard:** `argus-panoptes`, `argus-arestor`, `argus-colchis`, `argus-eponym`, `argeus-argos` are all different figures; the city is `argos`.
- **`ino`** — Leucothea aspect added (epithets + Homer summary/story fragments, Od. 5.333–353, 5.458–462); no separate `leucothea` node — dual identity on one star, Styx precedent.
