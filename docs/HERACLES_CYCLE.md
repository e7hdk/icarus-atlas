# The Labours of Heracles — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (character-layer citations + CONTRADICTIONS + `HERACLES_DYNASTY.md`), 2026-06-16. **Batch 1 + Batch 2 complete** — full shelf tree from birth through the Heraclid Return; **no new character nodes**.

## 1. Story tree

```
era 6.5   heracles-cycle           (root)
          ├─ birth-and-banishment  (era 6.45 — serpents, Megara, the oracle)
          ├─ twelve-labours        (era 6.5 — Apollodorus' twelve, Bibl. 2.5)
          ├─ omphale-and-troy      (era 6.55 — first sack, Iphitus, Lydia, Phlegra)
          ├─ deianira-and-achelous (era 6.58 — Calydon, the river-god)
          ├─ death-of-heracles     (era 6.6 — Oeta, apotheosis)
          └─ return-of-heraclids   (era 6.7 — Hyllus, Temenus, the Dorian lots)
```

## 2. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `heracles-father` | birth-and-banishment ch. the twin birth |
| `nemean-lion-parentage` | twelve-labours ch. 1 |
| `augeas-father` | twelve-labours ch. 5 |
| `deianira-parentage` | deianira-and-achelous ch. 1 |
| `eurystheus-slayer` | return-of-heraclids ch. 1 |

## 3. Cast policy

All labour-foes use existing monster or mortal ids (`nemean-lion`, `hydra`, `ceryneian-hind`, …). `diomedes-thrace` ≠ Argive `diomedes`. Troy sack overlaps `house-of-troy` (Trojan-cycle shelf) — this shelf keeps the hero's POV.

## 4. Batch log

- **Batch 1** — dossier + root + birth episode + shelf wiring + `story-culture/heracles-cycle.json` + geo `storyIds`; re-parented `twelve-labours`, `death-of-heracles`, `return-of-heraclids` from retired `house-of-heracles`.
- **Batch 2** — `omphale-and-troy`, `deianira-and-achelous` (split from death episode); geo backfill on Troy, Sardis, Ephesus, Calydon.

## 5. Verification

```bash
pnpm validate-data
```
