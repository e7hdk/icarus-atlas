# The House of Aeolus — the Aeolids — Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus + web), 2026-06-12. **Batches A (16), B (15) and C (16) all entered into `data/characters/` on 2026-06-12 — the House of Aeolus is complete: 47 Aeolids, ~163 relations, 12 documented contradiction topics.** Batch B and C figures ship the full three-layer codex (sourced mythology + Wikipedia-section reference + verified-Commons artwork gallery). The full ten-child Aeolid sibling clique is in place; the house interlocks `hellen`, `ino`, `atlas`, `asopus`, `danae`/`perseus`, `proetus`, `deucalion`/`pyrrha`, `eos` and the Olympians (Aloadae). Verified branch-by-branch; same-name hazards and existing-node collisions resolved before any character was added (per CLAUDE.md hard rule 7).
>
> Batch A topics now live in docs/CONTRADICTIONS.md: `aeolus-name-conflation`, `reason-for-sisyphus-punishment`, `jason-mother`, `ram-golden-ram-parentage`, `cause-of-athamas-madness`, `melicertes-death-cauldron-vs-leap`, `phrixus-cretheus-parentage`, `pelias-paternity`. The richer branch disputes (Bellerophon's accuser, the Aloadae's slayer, Tyndareus' father, Endymion's descent) await their Batch B/C nodes before being badged.
>
> Scope: the house of **Aeolus son of Hellen** (NOT the wind-keeper), from the founder through his seven sons and five daughters and the load-bearing next generation — the Iolcus/Argonaut stem, the Corinthian Sisyphus–Bellerophon line, the Athamas golden-ram tragedy, the Salmoneus/Tyro pivot, and the daughters' lines. Marriages into the Spartan (Tyndarid), Neleid (Nestor), Calydonian (Oeneus) and Argive (Proetid) houses are identified but not recursively expanded into complete second dynasties.

## 1. Why this dynasty needs a dossier

The Aeolids are the broadest mortal stemma in Greek myth: Aeolus is the trunk from which Iolcus, Corinth, Orchomenus, Pylos, Messene, Phocis, Elis and Seriphos all descend, and the dynasty feeds directly into the Argonautica, the Bellerophon cycle and the Perseus saga. Five problems make bulk entry unsafe:

1. **Same names recur as distinct figures, often inside one pedigree.** There are three figures named **Aeolus** (the Hellene, the wind-keeper, a Thessalian), four named **Actor** inside this single house, three named **Glaucus** (two in one Corinthian line), and existing-atlas collisions on **Epopeus**, **Orchomenus** and **Clymene**.
2. **Parentage changes by source at load-bearing forks.** Perieres is Aeolus' son or Cynortas'; Tyndareus and Icarius hang off Perieres or off Oebalus; Jason's mother is Polymede or Alcimede; Endymion descends via Aethlius, or from Zeus, or (in a garbled Hyginus line) from his own son Aetolus.
3. **The pivot nodes are shared between branches.** **Tyro** belongs to the Salmoneus branch (her father) and the Cretheus branch (her husband) and bears two sets of sons by two fathers; **Pelias** is genealogically Salmoneus' grandson but dramatically the Iolcus usurper of Jason's story. These must be modeled once.
4. **The densest ancient source is out of scope.** Most Aeolid genealogy descends from the **Hesiodic Catalogue of Women / Ehoiai**, which is NOT the admissible Hesiod (Theogony + Works and Days only). The atlas backbone is therefore Apollodorus' *Bibliotheca* 1.7.3–1.9.x, cross-checked against Homer, Apollonius, Ovid, Hyginus and Pausanias.
5. **The same myth carries deliberately rival versions.** Why Sisyphus rolls the stone, who slew the Aloadae, how Melicertes died, whether Pegasus is in the Bellerophon story — each is a documented inter-author dispute, which is exactly what the source lens exists to show.

The project should model a **source-rewiring dynasty**, not a flattened modern pedigree.

## 2. Evidence policy

### 2.1 Sources already supported by the atlas

| Source id | Material relevant to this dynasty |
|---|---|
| `apollodorus` | The continuous backbone: the roster (1.7.3), the daughters' lines (1.7.4–1.7.6), and each branch (Sisyphus 1.9.3; Magnes/Perieres 1.9.5–6; Salmoneus/Tyro 1.9.7–9; Cretheus/Iolcus 1.9.11–16; Athamas 1.9.1–2, 3.4.3); Bellerophon and the Seriphos saga (2.2–2.4); the Perieres rival line (3.10.3) |
| `homer` | Tyro and her sons in the Nekyia (*Odyssey* 11.235–259); Sisyphus' punishment (11.593–600); Sisyphus→Glaucus→Bellerophon and the Chimera (*Iliad* 6.152–211); the Aloadae (11.305–320); the wind-keeper Aeolus son of Hippotas, kept distinct (*Odyssey* 10.1–2) |
| `apollonius` | The Argonaut frame: Aeson→Jason, Alcimede as Jason's mother, the Iolcus catalogue, the golden ram as Hermes' work (*Argonautica* 1.45–233; 2.1140–1145; 3.355–360) |
| `ovid` | Athamas' madness and Ino's leap (*Metamorphoses* 4.416–542); Ceyx and Alcyone (11.410–748); "Aeolides Cephalus" and Procris (6.681; 7) |
| `hyginus` | Variant genealogies and the conflations: the wind-keeper as "son of Hellen" (*Fabulae* 125); Salmoneus/Tyro (*Fab.* 60–61); Stheneboea (*Fab.* 57, 243); the Astronomica generation-garbles and the divine golden ram (*Astronomica* 2.20) |
| `pausanias` | Local cult and rival genealogy: Salmoneus and Elis; Neleus' Messenian Pylos (4.2.4–5); the Perieres/Oebalus Spartan fork; Endymion's Elean tomb vs Latmian sleep (5.1.3–5; 6.20.9); Bellerophon and Pegasus at Corinth (2.4.1) |

Hesiod's admissible works touch the house only at the edges: the Chimera and Pegasus (*Theogony* 319–325) and the catalogue of Nereids/rivers. **The Theogony/Works-and-Days never name Aeolus son of Hellen** — that genealogy is Catalogue-of-Women material. Never tag `hesiod` for an Aeolid pedigree edge.

### 2.2 Essential sources not yet available as atlas lenses

| Source | Why it matters | Data policy |
|---|---|---|
| Hesiod, *Catalogue of Women* (*Ehoiai*) | The original systematic Aeolid stemma; the root of nearly every parentage here | Research-only; never map to the `hesiod` id (which is Theogony + W&D only) |
| Pindar, *Pythian* 4 | The fullest archaic Argonaut/Pelias narrative | Research-only until a Pindar lens exists |
| Euripides, *Alcestis*, *Stheneboea*, *Ino*, *Phrixus*, *Melanippe* plays | Alcestis' rescue by Heracles; Bellerophon's accuser; the Athamas/Ino tragedies | Research-only |
| Ovid, *Heroides* 11 (Canace) | Canace–Macareus incest as a letter | Out of scope — *Metamorphoses* only |
| Valerius Flaccus, *Argonautica* (Latin) | A second Argonaut epic | Research-only |
| Scholia and Diodorus | Collateral children and the Demodice/Biadice golden-ram variant | Never map to a lens by inference |

## 3. Source-conscious overview

A slash or "[disputed]" marks an edge that must stay source-dependent. Bracketed nodes already exist in the atlas.

```text
[hellen] + Orseis (nymph)
└── Aeolus the Hellene + Enarete (daughter of Deimachus)
    ├── Cretheus (Iolcus) + Tyro  [uncle–niece; Apollodorus]
    │   ├── Aeson + Polymede / Alcimede [disputed mother]
    │   │   └── Jason  → Argonautica  [Medea/Corinth branch deferred]
    │   ├── Pheres (Pherae)
    │   │   ├── Admetus + Alcestis
    │   │   └── Lycurgus of Nemea → Opheltes/Archemorus [deferred]
    │   └── Amythaon + Idomene [father: Pheres / Abas, disputed]
    │       ├── Melampus  → cures the Proetids  → [proetus]
    │       └── Bias + Pero
    ├── Sisyphus (Ephyra/Corinth) + Merope (a Pleiad, daughter of [atlas])
    │   └── Glaucus + Eurymede
    │       └── Bellerophon (Chimera, Pegasus)
    │           └── Laodameia + Zeus → [sarpedon]
    ├── Athamas (Boeotia/Orchomenus)
    │   ├── + Nephele → Phrixus (→ Colchis, the fleece), Helle (→ Hellespont)
    │   ├── + [ino] (daughter of [cadmus]) → Learchus, Melicertes (→ Palaemon)
    │   └── + Themisto → Leucon, Erythrius, Schoeneus, Ptous
    ├── Salmoneus (Salmone/Elis) + Alcidice → Tyro
    │   └── Tyro + Poseidon-as-Enipeus → Pelias (Iolcus usurper), Neleus (→ Nestor, deferred)
    ├── Deion (Phocis) + Diomede
    │   ├── Cephalus + Procris  [+ Eos]
    │   └── Actor, Phylacus, Aenetus, Asterodia
    ├── Magnes (Magnesia) → Dictys, Polydectes (Seriphos) → [danae], [perseus]
    ├── Perieres (Messene) [son of Aeolus / of Cynortas, disputed] + Gorgophone (daughter of [perseus])
    │   ├── Aphareus, Leucippus
    │   └── Tyndareus, Icarius [or sons of Oebalus — disputed; Spartan/Dioscuri boundary]
    ├── Canace + [poseidon] → Hopleus, Nireus, Epopeus, Aloeus, Triops
    │   └── Aloeus (nominal) / Poseidon + Iphimedeia → Otus & Ephialtes (the Aloadae)
    ├── Calyce + Aethlius [son of Zeus + Protogeneia, daughter of [deucalion]+[pyrrha]]
    │   └── Endymion + the Moon → Aetolus → the Aetolian/Calydonian line [deferred]
    ├── Alcyone + Ceyx → halcyon transformation
    ├── Pisidice + Myrmidon → Antiphus, Actor
    └── Perimede + Achelous → Hippodamas, Orestes [bare-name, NOT the matricide]
```

## 4. The same-name hazard map

This house has the worst homonym density in the project. The following must **never** be merged, and disambiguated ids are mandatory.

| Name | Distinct entities |
|---|---|
| **Aeolus** | (1) `aeolus-hellene` son of Hellen, the patriarch; (2) Aeolus son of Hippotas, the Odyssey wind-keeper (*Od.* 10.1–2) — Hyginus *Fab.* 125 and Ovid *Met.* 14 conflate them, see `aeolus-name-conflation`; (3) a third Aeolus in later genealogy. The founder is **not** a wind god. |
| **Actor** | Four inside this house: `actor-aeolid` (son of Pisidice by Myrmidon, 1.7.3); Actor son of Deion; Actor son of Phorbas; plus the Aeginetan Actor — never merge. |
| **Glaucus** | `glaucus-corinth` son of Sisyphus, father of Bellerophon, eaten by his mares (*Il.* 6.154); his great-grandson Glaucus the Lycian ally of Troy (*Il.* 6.119); Glaucus the sea-god; Glaucus son of Minos. |
| **Orestes** | `orestes-aeolid` (bare-name son of Perimede by Achelous, 1.7.3) — **must not merge** with the existing atlas node `orestes`, the matricide son of Agamemnon. |
| **Epopeus** | `epopeus-aeolid` (Canace's son by Poseidon, 1.7.4) **collides with the existing atlas node `epopeus`** (king of Sicyon, abductor of Antiope, son of a different Aloeus son of Helios). Resolve before entry. |
| **Orchomenus** | Athamas' Boeotian city — but the existing atlas node `orchomenus` is a person; verify identity before linking Athamas' realm. Also a name of one of Themisto's slain sons in Hyginus. |
| **Clymene** | The existing atlas node `clymene` is the Oceanid Iapetionid mother; do not merge with Apollonius' Clymene daughter of Minyas (Jason's grandmother). |
| **Pisidice / Alcyone / Merope / Calyce** | Each Aeolid daughter shares her name with two-plus others (Pisidice of Nestor and of Pelias; Alcyone the Pleiad; Merope wife of Cresphontes; Calyce daughter of Hecato). Note `merope-pleiad`, Sisyphus' wife, **is** the Pleiad sister of the existing `atlas`' daughters. |
| **Magnes / Deion(eus) / Perieres / Pheres / Bias / Triops / Nireus / Antiphus / Argus / Chalciope / Schoeneus / Idomene** | Each has a documented homonym; ids carry an `-aeolid` or descriptive suffix where the bare name is already taken or ambiguous. Deion and "Deioneus" (Apollodorus 2.4.7) are ONE figure. |

## 5. Generation-by-generation findings

### 5.1 Aeolus the founder

- **id:** `aeolus-hellene` · **type:** `mortal` · **cluster:** `mortal-arm` (or a dedicated `aeolid-house`)
- Son of **Hellen** by the nymph **Orseis** (Apollodorus 1.7.3 — the only passage naming Orseis in the seven sources). This is the anchor edge onto the existing `hellen` node; relates to the `hellen-paternity` topic.
- Married **Enarete**, daughter of Deimachus (named only at 1.7.3). Begat the canonical **seven sons** (Cretheus, Sisyphus, Athamas, Salmoneus, Deion, Magnes, Perieres) and **five daughters** (Canace, Alcyone, Pisidice, Calyce, Perimede) — verbatim at *Bibliotheca* 1.7.3.
- Apollonius independently attests Cretheus and Athamas as Aeolus' sons (*Arg.* 3.355–360). Hyginus *Fab.* 125 collapses him into the wind-keeper.

### 5.2 The Cretheus branch — Iolcus and the Argonaut stem

- **Cretheus** founds Iolcus; marries his niece **Tyro** (Apollodorus 1.9.11; *Od.* 11.237). Sons **Aeson, Pheres, Amythaon**.
- **Aeson → Jason** (`jason`, type `hero`). Jason's mother is a live dispute (`jason-mother`): Polymede daughter of Autolycus (Apollodorus 1.9.16) vs Alcimede (Apollonius 1.45–47; Hyginus *Fab.* 14).
- **Pheres** (`pheres-aeolid`) founds Pherae → **Admetus** + **Alcestis**; Apollo serves Admetus as a thrall (Apollodorus 1.9.15). *Caution:* Heracles' rescue of Alcestis is Euripidean, only alluded to at Apollodorus 2.6.x — do not state it as the Alcestis story.
- **Amythaon** + **Idomene** → the seers **Melampus** and **Bias**; Melampus cures the maddened daughters of Proetus for a third of Argos (Apollodorus 2.2.2 → interlocks the existing `proetus`). Idomene's father is given inconsistently within Apollodorus (`idomene-father`: Pheres 1.9.11 vs Abas 2.2.2).

### 5.3 The Salmoneus branch — impiety and the Tyro pivot

- **Salmoneus** rules in Salmone/Elis, impiously imitates Zeus' thunder (bronze kettles, thrown torches) and is destroyed by a real thunderbolt (Apollodorus 1.9.7; Hyginus *Fab.* 61).
- **Tyro** (daughter of Salmoneus by Alcidice) is the pivot node. Poseidon, in the guise of the river **Enipeus**, fathers the twins **Pelias** and **Neleus** (*Od.* 11.235–259; Apollodorus 1.9.8); she then marries her uncle Cretheus and bears Aeson, Pheres, Amythaon. Model Tyro **once**, shared between branches.
- **Pelias** usurps Iolcus and sends Jason for the fleece; his daughter **Alcestis** crosses into the Cretheus branch by marrying Admetus. **Neleus** is banished, founds Pylos, fathers **Nestor** — the Neleid descent is the **deferred boundary** flagged in `TANTALUS_DYNASTY.md`.

### 5.4 The Sisyphus branch — Corinth and Bellerophon

- **Sisyphus** founds Ephyra/Corinth, "craftiest of men"; marries **Merope** the Pleiad (daughter of the existing `atlas`). Punished eternally with the boulder (*Od.* 11.593–600).
- Why he is punished is disputed (`reason-for-sisyphus-punishment`): Homer gives **no** reason; Apollodorus uniquely supplies the betrayal of Zeus' abduction of Aegina to her father the river **Asopus** (existing node) (1.9.3). The famous cheating-of-Death cause is **not** in any of the seven.
- **Glaucus of Corinth** → **Bellerophon** (`bellerophon`, `hero`): the locus classicus is *Iliad* 6.152–211. Bellerophon's daughter **Laodameia** bears **Sarpedon** (existing node) to Zeus (*Il.* 6.197–199). Disputes: the accuser's name (`proetus-wife-name`: Anteia in Homer vs Stheneboea in the tragedians/Apollodorus/Hyginus) and whether **Pegasus** appears at all (`pegasus-in-bellerophon-myth`: absent in Homer, present in Hesiod *Theog.* 325, Apollodorus 2.3.2, Pausanias 2.4.1).

### 5.5 The Athamas branch — the golden ram and the Theban interlock

- **Athamas** rules Boeotia/Orchomenus. By **Nephele**: **Phrixus** and **Helle** — the golden-fleeced ram carries them off; Helle falls into the Hellespont; Phrixus reaches Colchis and dedicates the fleece, seeding the Argonautica (Apollodorus 1.9.1).
- By **Ino** (the existing `ino`, daughter of `cadmus`): **Learchus** and **Melicertes**. Ino's plot against Nephele's children, Athamas' Hera-sent madness, his killing of Learchus, and Ino's leap with Melicertes (who becomes the sea-god Palaemon) — Ovid *Met.* 4.416–542; Apollodorus 1.9.1–2, 3.4.3. **This branch supplies the existing `ino` node its Athamas edges and Leucothea apotheosis.**
- Rich dispute cluster: `cause-of-athamas-madness` (Dionysus-nursing vs Phrixus-plot vs Ovid's Juno), `melicertes-death-cauldron-vs-leap`, `athamas-realm-boeotia-vs-thessaly`, `athamas-second-third-wife-order` (Themisto), `ram-golden-ram-parentage` (Hyginus' Poseidon+Theophane vs Hermes-made marvel), and `phrixus-cretheus-parentage` (Hyginus' *Astronomica* Demodice/Biadice variant).

### 5.6 The minor sons — Deion, Magnes, Perieres

- **Deion** (Phocis) + Diomede → **Cephalus** (+ **Procris**, beloved of the existing `eos`), Actor, Phylacus, Aenetus, Asterodia. Two genuine disputes: `cephalus-parentage` (the Procris-husband is the Aeolid son of Deion, *not* the Athenian son of Hermes — Ovid's "Aeolides Cephalus" *Met.* 6.681) and `procris-parentage` (Erechtheus vs Pandion).
- **Magnes** → **Dictys** and **Polydectes** of **Seriphos** (Apollodorus 1.9.6). Within the seven sources their Magnes parentage is **consensus** (Hyginus *Astr.* 2.12.1 agrees) — the popular Poseidon parentage is out of scope. These two are the headline **Perseus interlock**: Dictys rescues and rears Danae+Perseus; Polydectes lusts after Danae and sends Perseus for the Gorgon. `polydectes-danae` records the villain (Apollodorus, Ovid) vs protector (Hyginus *Fab.* 63) split.
- **Perieres** (Messene) + **Gorgophone** (daughter of the existing `perseus`) → Aphareus, Leucippus. Two of the most consequential forks in the whole house: `perieres-parentage` (son of Aeolus vs of Cynortas) and `tyndareus-icarius-paternity` (Tyndareus and Icarius — and so the Spartan/Dioscuri/Penelope line — sons of Perieres per Stesichorus/Apollodorus 1.9.5, or of Oebalus per Apollodorus 3.10.4 and Pausanias). The Spartan house is the deferred boundary.

### 5.7 The daughters

- **Canace** + `poseidon` → Hopleus, Nireus, Epopeus, Aloeus, Triops (Apollodorus 1.7.4). Through **Aloeus** (nominal father) / Poseidon + **Iphimedeia** come the **Aloadae** **Otus** and **Ephialtes**, who pile Ossa on Olympus, chain Ares, woo Hera and Artemis (*Od.* 11.305–320). `aloadae-death`: slain by Artemis' deer-ruse (Apollodorus 1.7.4) vs by Apollo (Homer/Pindar via Pausanias 9.22.6). *Caution:* the Canace–Macareus incest is in-scope only via Hyginus (`canace-macareus-incest`); Ovid's version is *Heroides*, out of scope.
- **Calyce** + **Aethlius** → **Endymion** (the eternal sleeper loved by the Moon). Aethlius is son of Zeus by **Protogeneia**, daughter of `deucalion`+`pyrrha` — **the requested interlock back to the flood line** (Apollodorus 1.7.2; Pausanias 5.1.3). Disputes: `aethlius-paternity` (Zeus vs Aeolus), `endymion-parentage`, `endymion-death-place` (Elean tomb at Olympia vs Latmian sleep), `endymion-children`. Endymion → **Aetolus** → the Aetolian/Calydonian line (deferred).
- **Alcyone** + **Ceyx** → the halcyon transformation; `ceyx-alcyone-transformation` (hubris-punishment in Apollodorus 1.7.4 vs love-and-grief in Ovid *Met.* 11).
- **Pisidice** + Myrmidon → Antiphus, Actor; **Perimede** + the river **Achelous** → Hippodamas, Orestes (bare-name catalogue stubs).

## 6. Proposed contradiction topics

| Topic id | Competing claims | Key citations |
|---|---|---|
| `aeolus-name-conflation` | Aeolus the Hellene = / ≠ the wind-keeper son of Hippotas | *Od.* 10.1–2 (distinct) vs Hyginus *Fab.* 125; Ovid *Met.* 14 |
| `perieres-parentage` | Perieres son of Aeolus vs of Cynortas | Apollodorus 1.7.3/1.9.5 vs 3.10.3 |
| `tyndareus-icarius-paternity` | Tyndareus/Icarius sons of Perieres vs of Oebalus | Apollodorus 1.9.5 (Stesichorus) vs 3.10.4; Pausanias 4.2.4 |
| `tyro-sons-fatherhood` | How Tyro's two sets of sons sort; Hyginus' Sisyphus-sons variant | *Od.* 11.241–259; Apollodorus 1.9.8/1.9.11; Hyginus *Fab.* 12/60/239; Pausanias 4.2.5 |
| `jason-mother` | Polymede daughter of Autolycus vs Alcimede | Apollodorus 1.9.16 vs Apollonius 1.45–47; Hyginus *Fab.* 14 |
| `reason-for-sisyphus-punishment` | No reason (Homer) vs the Aegina/Asopus betrayal (Apollodorus) | *Od.* 11.593–600 vs Apollodorus 1.9.3 |
| `proetus-wife-name` | Anteia vs Stheneboea | *Il.* 6.160 vs Apollodorus 2.3.1; Hyginus *Fab.* 57 |
| `pegasus-in-bellerophon-myth` | Pegasus absent (Homer) vs present (Hesiod, Apollodorus, Pausanias) | *Il.* 6.179–183 vs *Theog.* 325; Apollodorus 2.3.2; Pausanias 2.4.1 |
| `father-of-odysseus` | Laertes (Homer) vs Sisyphus (Hyginus) | *Od.* 24.270 vs Hyginus *Fab.* 201 |
| `cause-of-athamas-madness` | Dionysus-nursing vs Phrixus-plot vs Ovid's Juno | Apollodorus 3.4.3 vs 1.9.2 vs Ovid *Met.* 4.416–542 |
| `melicertes-death-cauldron-vs-leap` | Boiled in a cauldron vs carried alive into the sea | Apollodorus 3.4.3 vs 1.9.2; Ovid *Met.* 4.519–542; Pausanias 1.44.7 |
| `ram-golden-ram-parentage` | Offspring of Poseidon+Theophane vs Hermes-made, no parents | Hyginus *Fab.* 3 vs Apollonius 2.1140–1145; Apollodorus 1.9.1 |
| `athamas-realm-boeotia-vs-thessaly` | Boeotia/Orchomenus vs Thessaly | Apollodorus 1.9.1 vs Hyginus *Fab.* 4 |
| `aloadae-death` | Artemis' deer-ruse vs Apollo | Apollodorus 1.7.4 vs *Od.* 11.317–320; Pausanias 9.22.6 |
| `ceyx-alcyone-transformation` | Hubris-punishment vs love-and-grief | Apollodorus 1.7.4 vs Ovid *Met.* 11.410–748 |
| `aethlius-paternity` | Son of Zeus vs of Aeolus | Apollodorus 1.7.2 vs Pausanias 5.1.3/5.8.2 |
| `endymion-parentage` | Aeolid via Calyce+Aethlius vs son of Zeus vs (garbled) son of Aetolus | Apollodorus 1.7.5; Pausanias 5.1.3; Hyginus *Fab.* 271 |
| `endymion-death-place` | Elean tomb at Olympia vs eternal Latmian sleep | Pausanias 5.1.5/6.20.9 vs Apollodorus 1.7.5 |
| `cephalus-parentage` | Procris' husband = Aeolid son of Deion vs Athenian son of Hermes | Apollodorus 1.9.4/3.14.3; Ovid *Met.* 6.681 vs Hyginus *Fab.* 241 |
| `procris-parentage` | Daughter of Erechtheus vs Pandion | Apollodorus 3.15.1; Pausanias 9.19.1 vs Hyginus *Fab.* 189 |
| `polydectes-danae` | Lustful villain vs benign protector who marries Danae | Apollodorus 2.4.2; Ovid *Met.* 5.242 vs Hyginus *Fab.* 63 |
| `idomene-father` | Daughter of Pheres vs of Abas | Apollodorus 1.9.11 vs 2.2.2 |
| `pelias-wife` | Anaxibia daughter of Bias vs Phylomache daughter of Amphion | Apollodorus 1.9.10; Hyginus *Fab.* 51 |
| `salmoneus-paternity` / `aeolid-generations-conflation` | Salmoneus son of Aeolus vs grandson via Athamas | Apollodorus 1.7.3 vs Hyginus *Astr.* 2.20.2 |
| `phrixus-cretheus-parentage` | Athamas+Nephele+Ino vs Hyginus' Cretheus+Demodice golden-ram motive | Apollodorus 1.9.1 vs Hyginus *Astr.* 2.20.2 |
| `seriphos-brothers-parentage` | Dictys/Polydectes sons of Magnes — **consensus in-scope** (note only; the Poseidon variant is out of scope) | Apollodorus 1.9.6; Hyginus *Astr.* 2.12.1 |
| `canace-macareus-incest` | In-scope only via Hyginus; Apollodorus gives Canace only Poseidon-sons | Hyginus *Fab.* 238/242/243 vs Apollodorus 1.7.4 |

## 7. Roster interlocks with existing atlas nodes

These edges land on characters already in the atlas — the dynasty is densely wired into the existing sky:

- `aeolus-hellene → hellen` (parent) — anchors the house onto the existing Deucalionid stock.
- `athamas → ino` (consort); Ino's children, leap and **Leucothea** apotheosis land on the existing `ino` node, activating `cadmus`/`semele`/`harmonia` Theban interlocks.
- `dictys → danae`/`perseus` (rescuer) and `polydectes → danae` (lover) / `polydectes → perseus` (adversary) — the Seriphos saga ties the house into the existing Perseus story.
- `perieres-aeolid → gorgophone → perseus` — Gorgophone's parent edge lands on the existing `perseus`.
- `aethlius → protogeneia → deucalion`+`pyrrha` — the daughters' line loops back to the flood survivors I just added.
- `merope-pleiad → atlas` (parent) — Sisyphus' Pleiad wife is a daughter of the existing `atlas`; her sisters route to `hermes` (via Maia) and the Dardanid line (via Electra).
- `bellerophon → sarpedon` (ancestor, via Laodameia + Zeus).
- `sisyphus → asopus` (informer/adversary) — the stated cause of his punishment, on the existing `asopus`.
- `melampus`/`bias-aeolid → proetus` (ally) — the seers cure the Proetids for a third of Argos.
- `canace`/`aloadae → poseidon`; the Aloadae chain `ares`, woo `artemis` and `hera`, threaten `zeus`, are slain by `apollo`.
- `cephalus-aeolid → eos` (lover); `endymion →` the Moon (`selene`, but the in-scope texts say "the Moon" — model with care); `admetus → apollo` (ally).
- `neleus → nestor` — the deferred Neleid link noted in `TANTALUS_DYNASTY.md`.

## 8. Existing-node collisions to resolve before entry

| Existing node | Collision | Resolution |
|---|---|---|
| `epopeus` (Sicyon, abductor of Antiope) | Canace's son is a different Epopeus | Use `epopeus-aeolid`; never link the two. |
| `orchomenus` (person) | Athamas' realm is the Boeotian **city** Orchomenus | Treat the realm as a place string, not a parent/consort edge to the person; verify the existing node's identity first. |
| `clymene` (Oceanid Iapetionid) | Jason's grandmother Clymene daughter of Minyas | If she enters, use `clymene-minyas`; keep the Oceanid node untouched. |
| `orestes` (matricide) | Perimede's bare-name son Orestes | Use `orestes-aeolid` (likely note-only). |

## 9. Entity roster proposal

Per hard rule 3, three verified batches. **Batch A is the recommendation for the next data drop.**

### Batch A — The founder and the branch-founding generation (16)

| id | type | why it belongs |
|---|---|---|
| `aeolus-hellene` | mortal | the trunk; anchors onto `hellen` |
| `enarete` | mortal | his consort — prevents a dangling founder marriage |
| `orseis` | nymph | his mother; completes the `hellen` consort edge |
| `cretheus` | mortal | Iolcus branch founder |
| `tyro` | mortal | the pivot node (Salmoneus' daughter, Cretheus' wife, mother of Pelias/Neleus) |
| `salmoneus` | mortal | the impiety myth; Tyro's father |
| `sisyphus` | mortal | Corinth branch; major punishment myth |
| `athamas` | mortal | the golden-ram tragedy; activates `ino` |
| `pelias` | mortal | Iolcus usurper, Jason's antagonist |
| `neleus` | mortal | Pylos; the Nestor/Neleid hinge |
| `aeson` | mortal | Jason's father |
| `jason` | hero | the Argonaut — the Apollonius-lens payoff |
| `nephele` | nymph | mother of Phrixus/Helle — the fleece seed |
| `phrixus` | hero | carries the fleece to Colchis |
| `merope-pleiad` | nymph | Sisyphus' wife; the `atlas` interlock |
| `glaucus-corinth` | mortal | the Sisyphus→Bellerophon link (prevents Bellerophon dangling) |

Batch A stands up the trunk and all five myth-bearing branches with no dangling edges, three-to-six visible source disputes, and the Argonaut/golden-ram seed — without yet depending on the deferred Spartan/Neleid/Calydonian houses or the unsupported tragedian lenses.

### Batch B — Myth completion and the headline interlocks (16)

`helle`, `ino-leucothea` (the existing `ino`'s Athamas edges + Leucothea), `learchus`, `melicertes`, `amythaon`, `pheres-aeolid`, `admetus`, `alcestis`, `acastus`, `bellerophon`, `deion`, `magnes-aeolid`, `dictys`, `polydectes`, `perieres-aeolid`, `gorgophone` — closes the Athamas branch and lands the Perseus and Bellerophon→Sarpedon interlocks.

### Batch C — The seers, the daughters' lines and the Aloadae (16)

`melampus`, `bias-aeolid`, `cephalus-aeolid`, `procris`, `canace`, `alcyone-aeolid`, `ceyx`, `calyce`, `aethlius`, `protogeneia`, `endymion`, `aetolus`, `iphimedeia`, `aloeus-aeolid`, `otus`, `ephialtes-aload` — the daughters' lines, the Proetid-cure seers, and the flood-line loop-back via Aethlius/Protogeneia.

The ~20 bare-name catalogue stubs (Hopleus, Nireus, Triops, the several Actors, Myrmidon, Antiphus, Perimede, Hippodamas, Orestes-aeolid, Themisto's sons, etc.) stay **note-only** until they have enough individual narrative to justify a star.

## 10. Relation modeling notes

1. `parent` only from child to parent, matching project convention.
2. **Tyro** carries two consort/lover edges (Cretheus by marriage; `poseidon` by the Enipeus deception) and two sets of children — model her once; tag the competing sortings under `tyro-sons-fatherhood`.
3. The **Aloadae** are biologically Poseidon's but nominally Aloeus' (both in-scope, *not* a contradiction): give Otus/Ephialtes a `parent` edge to `aloeus-aeolid` and a sourced `parent` edge to `poseidon` with a `note`, not a topic.
4. Disputed parentage (`perieres-parentage`, `tyndareus-icarius-paternity`, `aethlius-paternity`, `endymion-parentage`) = competing `parent` edges sharing a topic, **one** child node — never duplicate the child to dodge the dispute.
5. `adversary`/`slayer` only when a source names the agent: Polydectes↔Perseus, Sisyphus↔Asopus, Zeus→Salmoneus (thunderbolt).
6. Uncle–niece (Cretheus+Tyro) and cousin marriages are `consort` edges like any other; the cosmos layout's close-binary consort rule applies.
7. Athamas' realm "Orchomenus/Boeotia" is a place, not an edge to the person-node `orchomenus`.

## 11. Open questions before JSON entry

1. **Demigod typing.** Pelias and Neleus are sons of a god (Poseidon) by a mortal (Tyro). The type enum has no demigod class — follow the project's existing treatment of comparable figures (e.g. how `perseus` is typed). Likely `hero` for the myth-bearing ones, `mortal` for catalogue stubs.
2. **One node vs split nodes** for rival-parent figures — the relation model favors one node with competing topic-tagged parent edges; confirm the orrery renders that cleanly.
3. **Missing lens.** The Catalogue of Women is the true source of this stemma; consider whether a future lens is warranted, and meanwhile lean on Apollodorus as the spine.
4. **Existing-node collisions** (`epopeus`, `orchomenus`, `clymene`, `orestes`) resolved in §8 — apply the suffix ids on entry.
5. **Selene vs "the Moon"** — the in-scope Endymion texts say "the Moon," not "Selene" by name; decide whether to edge to the existing `selene` node or keep prose-only.
6. **Residences/Areas backfill.** This house seeds Iolcus, Corinth/Ephyra, Orchomenus, Pherae, Pylos, Messene, Seriphos and Elis — coordinate with the Areas/city-sky data layer when adding `residences`.

## 12. Primary-source map

- [Homer, *Iliad* 6](https://www.theoi.com/Text/HomerIliad6.html) (Sisyphus→Glaucus→Bellerophon, Chimera) and [*Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html) (Tyro, Sisyphus, the Aloadae)
- [Pseudo-Apollodorus, *Bibliotheca* 1](https://www.theoi.com/Text/Apollodorus1.html) (1.7.3–1.9.16 — the backbone), [*Library* 2](https://www.theoi.com/Text/Apollodorus2.html) (Bellerophon, Seriphos, Perieres rival line), [*Library* 3](https://www.theoi.com/Text/Apollodorus3.html)
- [Apollonius, *Argonautica* 1–3](https://www.theoi.com/Text/ApolloniusRhodius1.html) (Jason, Alcimede, the golden ram)
- [Ovid, *Metamorphoses* 4](https://www.theoi.com/Text/OvidMetamorphoses4.html) (Athamas/Ino), [*Met.* 11](https://www.theoi.com/Text/OvidMetamorphoses11.html) (Ceyx/Alcyone)
- [Hyginus, *Fabulae*](https://topostext.org/work/206) (1–5, 12, 51, 57, 60–61, 63–65, 125, 157, 189, 201, 238–243) and [*Astronomica* 2](https://topostext.org/work/207) (2.12, 2.20)
- [Pausanias, Book 4](https://www.theoi.com/Text/Pausanias4A.html) (Messenia: Neleus, Perieres) and [Book 5](https://www.theoi.com/Text/Pausanias5A.html) (Elis: Salmoneus, Endymion, Aethlius)

Translation wording must not be copied into summaries without checking license and original context; every edge entered must cite the passage that actually states it, per hard rule 2.

## 13. Conclusion

The House of Aeolus is the connective tissue of heroic Greek myth: from one Thessalian king descend the Argonauts, the Corinthian hero-line, the Orchomenian tragedy, the Pylian and Messenian and Spartan royal houses, and the Seriphos stage of the Perseus saga. The correct atlas strategy is:

1. Build the founder-to-branch-founders cluster first (Batch A), anchored onto the existing `hellen` node.
2. Add the myth-completion generation and the Perseus/Bellerophon interlocks second (Batch B).
3. Add the seers, the daughters' lines and the Aloadae third (Batch C); keep the ~20 bare-name stubs note-only.
4. Preserve every parentage and identity contradiction as a first-class topic, and apply the suffix ids that keep this homonym-dense house from collapsing into the wrong stars.

This house is the strongest test yet of the source lens: under different authors the same sky changes Jason's mother, Bellerophon's accuser, the slayer of the Aloadae, the father of Tyndareus — and even whether the patriarch is a king of Thessaly or the keeper of the winds.
