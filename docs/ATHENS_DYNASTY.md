# The Athenian Royal House — Cecrops to Theseus — Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus + web), 2026-06-12. **The Athenian house is COMPLETE: Batches A (15) + B (13) + C (12) = 40 Athenians**, ~139 relations, 6 documented contradictions (`amphictyon-parentage`, `theseus-paternity`, `who-erechtheus-slew`, `death-of-erechtheus`, `ion-paternity`, plus the reused `ariadne-fate`), all shipping the three-layer codex (mythology + Wikipedia-section reference + verified-Commons artwork gallery). Batch C brought the Boreas/Orithyia branch (the Boreads `zetes`/`calais` who sail with `jason`, `cleopatra-boreas`, `chione-boreas` mother of `eumolpus`), the Ionian stem (`xuthus` ← `hellen`, `ion`, `achaeus`), the Erechtheid `orneus`, the two Naiad queens (`praxithea-naiad`, `zeuxippe-naiad`, completing the maternity of Pandion I and his children), and `scylla-nisus`. **Areas integration done**: `data/lineages/athens.json` holds the king-list and the Athens-resident figures carry `residences:[{city:'athens'}]`, so the `/city/athens` lineage panel and `/city/athens/sky` mini-galaxy are populated. Verified branch-by-branch; same-name hazards and existing-node collisions resolved before any character was added (per CLAUDE.md hard rule 7).
>
> Scope: the autochthonous Attic kings and their house from Cecrops I through Erechtheus, the Tereus tragedy, the Pandionid restoration, and the spine of Theseus' saga. The Argonaut connections (the Boreads, Phineus) and the deep Theseus episodes (Pirithous, the Amazons, the children Demophon/Acamas) are identified but bounded out as deferred batches.

## 1. Why this dynasty needs a dossier

The Athenian king-list is the densest cluster of homonyms and source-disputes in Attic myth. Five problems make bulk entry unsafe:

1. **Severe same-name collisions with figures already in the atlas.** Erichthonius of Athens vs the existing Dardanid `erichthonius-troy`; Creusa daughter of Erechtheus vs the existing `creusa-troy`; Pallas son of Pandion vs the existing Titan `pallas`; Lycus son of Pandion vs the existing Theban `lycus`. All four Athenian figures take suffixed ids.
2. **The house repeats its own names.** Two kings named Cecrops (I, the autochthon; II, son of Erechtheus) and two named Pandion (I, son of Erichthonius; II, exiled to Megara); two Praxitheas (the Naiad wife of Erichthonius and the mortal wife of Erechtheus).
3. **The succession itself is disputed.** Cecrops is soil-born in Apollodorus/Hyginus but Actaeus' son-in-law in Pausanias; Amphictyon is Deucalion's son or autochthon; Erichthonius' mother is Gaia or the princess Atthis; Aegeus is Pandion's son or a supposititious child of Scyrius.
4. **The signature myths carry deliberately rival versions.** Who judged the Athena–Poseidon contest (the twelve gods, or Cecrops/Cranaus); which sister becomes which bird in the Tereus tragedy (Apollodorus and Ovid flatly reverse it); how Erechtheus died (Poseidon's trident, Zeus' thunderbolt, or simply in battle); and above all, whether Theseus is the son of Aegeus or of Poseidon.
5. **The house is the hub of the Attic interlock.** It already touches `procris` and `cephalus-aeolid` (Erechtheus' daughter and son-in-law, entered with the Aeolids), `deucalion`/`pyrrha` (Amphictyon), `hellen` (Xuthus), `pittheus` (Aethra), the Cretan cluster `minos`/`ariadne`/`phaedra`/`minotaur`/`daedalus` (Theseus), and the Olympians `athena`/`poseidon`/`hephaestus`/`gaia`/`ares`.

Model a **source-rewiring dynasty**, not a flattened modern pedigree.

## 2. Evidence policy

### 2.1 Sources already supported by the atlas

| Source id | Material |
|---|---|
| `apollodorus` | The backbone: the king-list and the contest (Bibliotheca 3.14.1–6), Erichthonius (3.14.6), the Tereus tragedy (3.14.8), Erechtheus and the Eleusis war (3.15.1–5), the Boreads (3.15.2–3), Pandion II and the four sons (3.15.5–6), Aegeus and Theseus (3.15.7–3.16.2, Epitome 1) |
| `pausanias` | The richest cult/king-list source — Book 1 (Attica) throughout: the contest relics (1.24.3, 1.26.5), the Cecropides (1.18.2), the Erechtheus war (1.5.2–3, 1.27.4, 1.38.3), Aegeus (1.5.4), and dozens of local graves and variants |
| `ovid` | Metamorphoses: Aglauros (2.708–832), the Tereus tragedy in full (6.424–674), Boreas and Orithyia (6.675–721), Medea and Theseus (7.404–452), Ariadne and the Minotaur (8.152–182), Nisus and Scylla (8.1–151) |
| `hyginus` | Fabulae: the king-list (48), the Erechtheus/Chthonia sacrifice (46, 238), the Tereus birds (45), Theseus' conception (37), Nisus (198); Astronomica on Erichthonius/Auriga (2.13) |
| `homer` | Theseus "son of Aegeus" (Iliad 1.265), Aethra daughter of Pittheus (Iliad 3.144), Ariadne slain by Artemis on Dia (Odyssey 11.321–325) |
| `apollonius` | The Boreads as Argonauts and the Harpy chase (Argonautica 1.211–223, 2.273–434) |
| `hesiod` | Only at the edges: Ariadne made Dionysus' immortal wife (Theogony 947–949) |

### 2.2 Out of scope (research-only)

Euripides' *Erechtheus* (the daughters' sacrifice and Praxithea's speech), *Ion* (Apollo as Ion's true father), *Hippolytus* and *Medea*; Plutarch's *Theseus* (the bandits, the synoikismos, the historicizing); the Hesiodic *Catalogue of Women*; Ovid's *Heroides*; Bacchylides 17–18. Never map these to a lens id — the Apollo-paternity of Ion, in particular, must stay prose-only unless Apollodorus/Pausanias carry it.

## 3. Source-conscious overview

Bracketed nodes already exist in the atlas. "[disputed]" marks a source-dependent edge.

```text
(Actaeus) [Pausanias only]
└── Cecrops I + Aglaurus-of-Actaeus  [autochthon in Apollodorus/Hyginus]
    ├── Aglaurus, Herse, Pandrosus (the Cecropides), Erysichthon
    │      └── the chest of Erichthonius → the sisters' deaths
    ⇒ Cranaus (autochthon) ⇒ Amphictyon [son of [deucalion]+[pyrrha], or autochthon]
    ⇒ Erichthonius of Athens (born of [hephaestus] + [gaia], reared by [athena]) + Praxithea (a Naiad)
        └── Pandion I + Zeuxippe
            ├── Erechtheus + Praxithea
            │   ├── sons: Cecrops II, Pandorus, Metion, (Orneus [Pausanias])
            │   └── daughters: [procris] (+ [cephalus-aeolid]), Creusa-athens, Chthonia (+ Butes), Orithyia, (Protogeneia, Pandora, Merope)
            │           ├── Creusa-athens + Xuthus (son of [hellen]) → Ion, Achaeus  [or Ion by Apollo — disputed]
            │           ├── Orithyia + Boreas → Zetes, Calais (Argonauts), Cleopatra, Chione (→ Eumolpus by Poseidon)
            │           └── the Eleusis war: Erechtheus slays Eumolpus / Immaradus; Poseidon destroys Erechtheus
            ├── Butes (twin of Erechtheus, priest of Athena & Poseidon-Erechtheus) + Chthonia
            └── Procne (+ Tereus son of [ares]) & Philomela → Itys → the bird metamorphoses
    ⇒ Cecrops II ⇒ Pandion II (exiled to Megara)
        └── the four sons divide Attica: Aegeus, Pallas (the Pallantids), Nisus (Megara, the purple lock), Lycus
            └── Aegeus [+ Poseidon] + Aethra (daughter of [pittheus]) → Theseus  [paternity disputed]
                └── Theseus → the Minotaur ([minos]/[ariadne]), the Aegean death of Aegeus,
                    + the Amazon (Antiope/Hippolyte) → Hippolytus (+ [phaedra]) [deferred episodes]
```

## 4. The same-name hazard map

Mandatory disambiguated ids; **never merge** across these.

| Name | Distinct entities |
|---|---|
| **Erichthonius** | `erichthonius-athens` (autochthon king, son of Hephaestus+Gaia) vs existing `erichthonius-troy` (the Dardanid). |
| **Creusa** | `creusa-athens` (daughter of Erechtheus, mother of Ion) vs existing `creusa-troy` (daughter of Priam, wife of Aeneas). |
| **Pallas** | `pallas-pandionid` (son of Pandion II, father of the fifty Pallantids) vs existing `pallas` (the **Titan**, son of Crius). |
| **Lycus** | `lycus-pandionid` (son of Pandion II, the Messenian mystery-bringer) vs existing `lycus` (the **Theban** regent, husband of Dirce). |
| **Cecrops** | `cecrops` (I — autochthon first king) vs `cecrops-ii` (II — son of Erechtheus). |
| **Pandion** | `pandion` (I — son of Erichthonius, father of Procne/Philomela/Erechtheus) vs `pandion-ii` (II — exiled to Megara, father of Aegeus). |
| **Praxithea** | `praxithea` (mortal wife of Erechtheus, the sacrifice heroine) vs `praxithea-naiad` (the Naiad wife of Erichthonius — deferred). |
| **Chthonia** | `chthonia-athens` (Erechtheid daughter, wife of Butes) vs the Hermionian Chthonia. |
| **Orithyia** | `orithyia-athens` (Erechtheid, carried off by Boreas) vs the Nereid Orithyia. |
| **Cleopatra / Chione / Scylla / Nisus / Hippolytus / Aethra / Butes / Erysichthon** | each has a documented homonym (Cleopatra wife of Meleager; Chione daughter of Daedalion; the sea-monster Scylla; Nisus of Dulichium; the Giant Hippolytus; Aethra the Oceanid; Butes the Argonaut; the Triopid Erysichthon of Ovid Met 8) — suffix on entry. |
| **Pandora / Protogeneia (Erechtheid)** | if the later-list Erechtheid daughters are ever entered, they collide with existing `pandora` (the first woman) and `protogeneia` (Deucalion's daughter) — suffix them. |
| **Cephalus** | Hyginus 160's "Cephalus son of Mercury by Creusa daughter of Erechtheus" must NOT be merged with existing `cephalus-aeolid` (son of Deion, husband of Procris). |

## 5. Proposed contradiction topics

| Topic id | Competing claims | Citations |
|---|---|---|
| `cecrops-origin` | Cecrops soil-born vs son-in-law of an earlier king Actaeus | Bibliotheca 3.14.1; Fabulae 48 vs Description of Greece 1.2.6 |
| `athena-poseidon-judges` | The twelve gods judged the contest vs Cecrops/Cranaus/Erysichthon | Bibliotheca 3.14.1 vs the versions Apollodorus rejects |
| `amphictyon-parentage` | Son of Deucalion vs autochthon | Bibliotheca 1.7.2 vs 3.14.6 ("some say… others say") |
| `erichthonius-mother` | Mother is Gaia/Earth vs Atthis daughter of Cranaus | Bibliotheca 3.14.6; Description of Greece 1.2.6 |
| `cecropides-fate` | How the Cecropides died and which opened the chest | Bibliotheca 3.14.6; Description of Greece 1.18.2; Metamorphoses 2.552–565; Fabulae 166 |
| `tereus-alliance-cause` | Pandion gives Procne for the Labdacus war (Apollodorus) vs to repel a barbarian siege (Ovid) | Bibliotheca 3.14.8 vs Metamorphoses 6.421–432 |
| `sisters-bird-assignments` | Procne nightingale + Philomela swallow (Apollodorus) vs reversed (Ovid, Hyginus) | Bibliotheca 3.14.8 vs Metamorphoses 6.668–670; Fabulae 45 |
| `tereus-bird-form` | Tereus a hoopoe (Apollodorus, Ovid, Pausanias) vs a hawk (Hyginus) | Bibliotheca 3.14.8 vs Fabulae 45 |
| `death-of-erechtheus` | Destroyed by Poseidon vs Zeus' thunderbolt at Poseidon's request vs simply killed in battle | Bibliotheca 3.15.5; Fabulae 46; Description of Greece 1.38.3 |
| `who-erechtheus-slew` | Erechtheus slew Eumolpus vs his son Immaradus (Eumolpus survives) | Bibliotheca 3.15.4 vs Description of Greece 1.27.4, 2.14.2 |
| `sacrificed-daughter` | The sacrificed daughter named Chthonia (Hyginus) vs the unnamed youngest (Apollodorus) | Fabulae 46, 238 vs Bibliotheca 3.15.4 |
| `ion-paternity` | Ion son of Xuthus (Apollodorus, Pausanias' genealogy) vs of Apollo (the Acropolis-cave cult tradition) | Bibliotheca 1.7.3 vs Description of Greece 1.28.4, 7.1.2 |
| `aegeus-paternity` | Aegeus a true son of Pandion II vs a supposititious child of Scyrius | Bibliotheca 3.15.5 vs Description of Greece 1.5.4 |
| `theseus-paternity` | Theseus son of Aegeus (Homer, Ovid) vs of Poseidon (Pausanias) vs the both-the-same-night reconciliation (Apollodorus, Hyginus) | Iliad 1.265; Met 7–8 vs Description of Greece 2.33.1 vs Bibliotheca 3.15.7; Fabulae 37 |
| `ariadne-end-on-naxos` | Artemis slays Ariadne on Dia (Homer) vs Dionysus weds and immortalizes her (Hesiod, Ovid, Apollodorus) | Odyssey 11.321–325 vs Theogony 947–949; Met 8.174–182; Epitome 1.9 |
| `boreads-death` | Zetes and Calais die chasing the Harpies vs slain later by Heracles | Bibliotheca 3.15.2 vs Argonautica 1.1298–1308 |
| `theseus-amazon-wife-name` | The Amazon mother of Hippolytus is Antiope / Melanippe / Hippolyte | Epitome 1.16, 5.2; Fabulae 250; Description of Greece 1.2.1 |

`ariadne-end-on-naxos` already exists in CONTRADICTIONS.md as `ariadne-fate` — reuse that topic when wiring Theseus rather than duplicating it.

## 6. Roster interlocks with existing nodes

- `procris` ← parent `erechtheus`; `cephalus-aeolid` becomes Erechtheus' son-in-law (both files already name Erechtheus — wire the edges).
- `amphictyon` ← parents `deucalion` + `pyrrha` (Bibliotheca 1.7.2); `hellen.json` already lists the brother Amphictyon under `hellen-paternity` prose.
- `xuthus` ← parent `hellen`; bridges the Athenian house to the Hellene stock.
- `aethra` ← parent `pittheus`; `theseus` ← `aethra` (+ the Poseidon paternity dispute on `poseidon`).
- `theseus` → `minotaur` (slayer), `ariadne` (lover, then the `ariadne-fate` dispute), with `minos`/`daedalus`/`phaedra` in the Cretan cluster.
- `erichthonius-athens` ← parents `hephaestus` + `gaia`; ally `athena`.
- the Athena–Poseidon contest: `cecrops` ally `athena`, adversary `poseidon` (topic `athena-poseidon-judges`).
- `tereus` ← parent `ares`.
- `eumolpus` ← parent `poseidon`; `orithyia-athens` consort `boreas`, whose sons `zetes`/`calais` sail with the existing `jason`.

## 7. Existing-node collisions to resolve before entry

| Existing node | Collision | Resolution |
|---|---|---|
| `erichthonius-troy` | the Athenian autochthon | use `erichthonius-athens` |
| `creusa-troy` | Erechtheus' daughter | use `creusa-athens` |
| `pallas` (Titan) | Pandion's son | use `pallas-pandionid` |
| `lycus` (Theban) | Pandion's son | use `lycus-pandionid` |
| `pandora` (first woman), `protogeneia` (Deucalion's) | possible Erechtheid daughters | suffix if entered |
| `procris`, `cephalus-aeolid`, `pittheus`, `phaedra`, `ariadne`, `minos`, `daedalus` | already present | link, never recreate |

## 8. Entity roster proposal

Three verified batches. **Batch A is the next data drop.**

### Batch A — the Cecropid/Erechtheid spine + the Tereus tragedy (15)

`cecrops`, `cranaus`, `amphictyon`, `erichthonius-athens`, `pandion`, `erechtheus`, `praxithea`, `cecrops-ii`, `metion`, `pandorus`, `creusa-athens`, `procne`, `philomela`, `tereus`, `itys`.

The linear royal succession Cecrops I → Cranaus → Amphictyon → Erichthonius → Pandion I → Erechtheus → Cecrops II (the spine of a future `data/lineages/athens.json`), plus the two self-contained tragedies that hang directly off Pandion I (Tereus/Procne/Philomela/Itys) and off Erechtheus (Praxithea, Creusa, the sons). No dangling endpoints; anchors onto `deucalion`/`pyrrha` (Amphictyon), `hephaestus`/`gaia`/`athena` (Erichthonius), `ares` (Tereus), `poseidon`/`athena` (the contest), and the existing `procris`/`cephalus-aeolid`.

### Batch B — the Pandionid restoration, Aegeus and Theseus (13)

`pandion-ii`, `aegeus`, `pallas-pandionid`, `nisus`, `lycus-pandionid`, `aethra`, `theseus`, `hippolytus`, `eumolpus`, `immaradus`, `butes-athenian`, `chthonia-athens`, `orithyia-athens` — the second royal spine and the Eleusis-war pair, plus the first-generation Erechtheids Batch A defers. Lands the Cretan-cluster and `pittheus` interlocks.

### Batch C — the Boreads, the Ionian stem, and the leaves (12)

`boreas`, `zetes`, `calais`, `cleopatra-boreas`, `chione-boreas`, `xuthus`, `ion`, `achaeus`, `orneus`, `praxithea-naiad`, `zeuxippe-naiad`, `scylla-nisus` — closes the genealogy (the Boreas/Orithyia children, the Hellene bridge), with the Argonaut-cycle figures (Phineus, the Harpies) staying deferred.

The Cecropides (Aglaurus, Herse, Pandrosus, Erysichthon) and the deep Theseus episodes (the Pallantids, Pirithous, the Amazon campaign, Demophon/Acamas) remain note-only until they earn their own stars.

## 9. Relation & data-modeling notes

1. `parent` from child to parent only; `erichthonius-athens` carries parent edges to both `hephaestus` and `gaia` (topic `erichthonius-mother` competes Gaia vs Atthis).
2. Disputed parentage = competing topic-tagged `parent` edges on ONE child node (`theseus-paternity`: `theseus` → `aegeus` and `theseus` → `poseidon`; `aegeus-paternity`: `aegeus` → `pandion-ii` vs the Scyrius variant which, lacking a node, stays a prose/note variant).
3. The bird/star metamorphoses (Procne/Philomela → nightingale/swallow, Tereus → hoopoe, Ariadne's crown) have no relation type — narrate them in sourced prose; the `sisters-bird-assignments` and `tereus-bird-form` disputes live as topic-tagged story entries.
4. Reuse the existing `ariadne-fate` topic for Theseus/Ariadne; do not mint `ariadne-end-on-naxos`.
5. Ethnonyms (Ionians, Achaeans) are not nodes — Ion's/Achaeus' eponymy stays prose, not a `creator` edge, until an ethnonym model exists.
6. `athena-poseidon-judges` and `athena-poseidon-contest` must unify to ONE topic id at entry.

## 10. Open questions before JSON entry

1. **Theseus paternity topic id** — unify `theseus-paternity` / `theseus-parentage` to one string.
2. **Eumolpus type** — son of Poseidon and Eleusinian cult-founder: `hero` or `god`? Follow the project's treatment of comparable demigods.
3. **Lineage file** — ✅ done: `data/lineages/athens.json` encodes the reign order Actaeus → Cecrops I → Cranaus → Amphictyon → Erichthonius → Pandion I → Erechtheus → Cecrops II → Pandion II → (the Metionids) → Aegeus → Theseus, each `characterId`-linked and sourced.
4. **Residences** — ✅ done: the 21 Athens-resident figures carry `residences: [{city:'athens', …}]`, so they populate the `/city/athens` lineage panel and the `/city/athens/sky` mini-galaxy. (Megara and Troezen are not yet flagship city nodes, so Nisus/Aethra keep no residence until those cities land.)
5. **Aethra's end** — keep both the Iliad/Apollodorus tradition (Helen's captive handmaid at Troy, freed by Demophon/Acamas) as a deferred note.

## 11. Primary-source map

- [Pseudo-Apollodorus, *Bibliotheca* 3](https://www.theoi.com/Text/Apollodorus3.html) (3.14–3.16) and [*Epitome* 1](https://www.theoi.com/Text/ApollodorusE.html)
- [Pausanias, Book 1 (Attica)](https://www.theoi.com/Text/Pausanias1A.html) — the king-list, the contest relics, the cults
- [Ovid, *Metamorphoses* 6](https://www.theoi.com/Text/OvidMetamorphoses6.html) (Tereus, Boreas), [*Met.* 7](https://www.theoi.com/Text/OvidMetamorphoses7.html) (Medea/Theseus), [*Met.* 8](https://www.theoi.com/Text/OvidMetamorphoses8.html) (Minotaur, Nisus/Scylla)
- [Hyginus, *Fabulae*](https://topostext.org/work/206) (45, 46, 48, 166, 198, 238) and *Astronomica* 2.13
- [Homer, *Iliad* 1 & 3](https://www.theoi.com/Text/HomerIliad1.html); [*Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html) (Ariadne)
- [Apollonius, *Argonautica* 1–2](https://www.theoi.com/Text/ApolloniusRhodius1.html) (the Boreads, the Harpies)

Every edge entered must cite the passage that states it (hard rule 2); translation wording is not copied into summaries without checking license and context.

## 12. Conclusion

The Athenian house is the Attic spine of the atlas: an unbroken autochthonous succession that produces, in turn, the contest-myth of the city's name, the Tereus tragedy, the self-sacrificing Erechtheids, the Ionian eponym, and finally Theseus — and it threads into the flood line, the Hellenes, Crete and the Argonauts already in the sky. The strategy: build the Cecrops-to-Erechtheus spine first (Batch A), the Aegeus/Theseus spine and Eleusis war second (Batch B), the Boreads and Ionian leaves third (Batch C); resolve every homonym to a suffixed id up front; and preserve each parentage, succession and metamorphosis dispute as a first-class topic, so that under different authors the same sky changes who judged the contest, which sister sang as the nightingale, and whether the founder-hero is the son of a king or of the sea.
