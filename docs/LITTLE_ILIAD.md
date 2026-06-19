# The Little Iliad — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (character-layer citations + CONTRADICTIONS), 2026-06-16. **Batch 4** — full episode between Aethiopis and Sack; **no new character nodes** — cast links only to existing stars.
>
> Scope: the Epic-Cycle book (*Mikrē Ilias*) covering the fall of Troy after Achilles' death (Apollodorus Epitome 5.8–5.14). The poem itself is lost; the atlas reconstructs it from Apollodorus, Homer (Odyssey colour), Hyginus, Ovid, and Pausanias.

## 1. Story tree position

```
trojan-war (era 8)
  ├─ rhesus (8.1)
  ├─ philoctetes-on-lemnos (7.97–8.35) — exile on Lemnos; fetch deferred to little-iliad
  ├─ aethiopis (8.26) — Penthesilea, Memnon, death of Achilles
  ├─ ajax-and-the-arms (8.30) — arms judged to Odysseus, Ajax's madness
  ├─ ajax-and-the-arms (8.3) — arms judged, Telamonian Ajax suicide
  ├─ little-iliad (8.35) — THIS SHELF
  │    └─ the-wooden-horse (8.48) — Sinon, Laocoon, horse in citadel
  └─ (sibling) sack-of-troy (8.5) — night of the horse, Priam, Aeneas
```

**Boundary with Aethiopis:** Penthesilea, Memnon, Achilles' death — in `aethiopis.json`. Arms of Achilles, funeral games, Ajax suicide — in `ajax-and-the-arms.json`. Little Iliad opens after the greater Ajax is dead.

**Boundary with Sack:** Night attack, Priam at the altar, Deiphobus slain — in `sack-of-troy.json`. Little Iliad ends with the nested `the-wooden-horse`; the Sack begins when the warriors descend.

## 2. Chapter map (Epitome spine)

| Chapter | Epitome / sources | Dispute topics |
|---|---|---|
| The city that would not fall | 5.1–5.7 recap | — |
| Philoctetes on Lemnos | 3.27, Il. 2.716–728 | nested `philoctetes-on-lemnos` |
| The bow fetched at last | 5.8 | — |
| The death of Paris | 5.8, Bibl. 3.12.6 | — |
| Helenus and the suitors | 5.9 | — |
| The three conditions | 5.10–5.11 | — |
| Neoptolemus and Eurypylus | 5.12, Od. 11.505–537 | — |
| The theft of the Palladium | 5.13, Paus. 1.28.8 | — |
| The wooden horse | 5.14–5.18, Od. 8.492–520 | nested `the-wooden-horse` |

## 3. Cast policy

Existing ids only; plain names for Calchas, Podalirius, Sinon, Oenone (not yet promoted). New slayer edge: `philoctetes-slayer-paris`.

Helen helping Odysseus steal the Palladium is Apollodorus-only colour; not a dispute badge unless a competing tradition denies her agency.

## 4. Verification

Relation `philoctetes-slayer-paris` wired in `data/relations.json`.

```bash
pnpm validate-data
pnpm validate-layout
```
