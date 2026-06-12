# Tantalus and the Pelopid Dynasty — Research Dossier

> Research status: source-mapped; Batches A and B entered into `data/characters/` on 2026-06-12. Post-Orestes succession and collateral branches remain deferred.
>
> Scope: the direct house of Tantalus from its founder through Pelops, Niobe and Broteas; the Atreus–Thyestes branches; the children of Agamemnon and Menelaus; and the post-Trojan heirs of Orestes. Marriage links into the Theban, Neleid, Theseid and Perseid houses are identified but not recursively expanded into complete second dynasties.

## 1. Why this dynasty needs a dossier

The "family tree of Tantalus" is not a single stable genealogy. It is a stack of competing traditions produced across epic, lyric, tragedy, mythography and local history. Four problems make direct bulk entry unsafe:

1. **The same names recur inside the same house.** There are at least three relevant figures named Tantalus: the punished founder, a son of Thyestes, and a son of Broteas in the alternative genealogy reported by Pausanias.
2. **Parentage changes by source.** Agamemnon and Menelaus are direct sons of Atreus in Homer and Apollodorus' catalogue, but a Pleisthenes generation is inserted in other traditions. The first husband of Clytemnestra is a son of Thyestes in Apollodorus and either a son of Thyestes or Broteas in Pausanias.
3. **The family expands sideways into several other major houses.** Niobe's surviving daughter Chloris enters the Neleid line of Nestor; Pittheus leads to Aethra and Theseus; daughters of Pelops enter the Perseid and Heraclid genealogies.
4. **The central myths deliberately contradict one another.** Pindar rejects the cannibal banquet of Pelops that Apollodorus preserves. Homer, Apollodorus and the tragedians do not agree on the names or number of Agamemnon's daughters.

The project should therefore model a **source-rewiring dynasty**, not a flattened modern pedigree.

## 2. Evidence policy

### 2.1 Sources already supported by the atlas

| Source id | Material relevant to this dynasty |
|---|---|
| `homer` | Tantalus' punishment; Niobe's twelve children; the Atreid brothers; Agamemnon's children; Hermione and Megapenthes |
| `apollodorus` | The continuous narrative from Tantalus through Pelops, Atreus, Thyestes, the Trojan War and Orestes |
| `hyginus` | Variant genealogies, the banquet of Thyestes, Pelopia and Aegisthus, later family catalogues |
| `pausanias` | Local graves, alternative parentage, post-Orestes descendants, cult and migration traditions |
| `ovid` | Niobe, Pelops' ivory shoulder and the literary memory of the family's punishments |

Hesiod and Apollonius offer only peripheral material for the direct Pelopid genealogy in the surviving works represented by the current atlas.

### 2.2 Essential sources not yet available as atlas lenses

| Source | Why it matters | Data policy |
|---|---|---|
| Pindar, *Olympian* 1 | Explicitly rejects the story that the gods ate Pelops and replaces it with Tantalus stealing nectar and ambrosia | Research-only until a Pindar source id exists |
| Aeschylus, *Oresteia* | The fullest surviving dramatic architecture of Agamemnon's murder, Orestes' revenge and the Furies | Research-only until tragedians are supported |
| Sophocles, *Electra* | A distinct Electra/Orestes recognition and revenge tradition | Research-only |
| Euripides, *Electra*, *Orestes*, *Iphigenia* plays, *Helen* | Major variants for Iphigenia, Hermione, Helen and the aftermath of matricide | Research-only |
| Scholia and lost epic fragments | Pleisthenes genealogies and several collateral children | Never map to an existing source id by inference |

## 3. Source-conscious overview

The following is the safest **structural** view. A question mark or slash means that the edge must remain source-dependent.

```text
Zeus + Plouto
└── Tantalus I + Euryanassa / Dione / other reported consorts
    ├── Pelops + Hippodamia
    │   ├── Atreus + Aerope
    │   │   ├── Agamemnon + Clytemnestra
    │   │   │   ├── Orestes + Hermione / Erigone
    │   │   │   │   ├── Tisamenus
    │   │   │   │   └── Penthilus [Pausanias separates the mothers]
    │   │   │   ├── Electra + Pylades
    │   │   │   │   ├── Medon
    │   │   │   │   └── Strophius
    │   │   │   ├── Iphigenia / Iphianassa
    │   │   │   └── Chrysothemis
    │   │   ├── Menelaus + Helen
    │   │   │   └── Hermione
    │   │   └── Menelaus + unnamed slave / Pieris
    │   │       ├── Megapenthes
    │   │       └── Nicostratus [Pausanias]
    │   ├── Thyestes
    │   │   ├── Aglaus
    │   │   ├── Callileon
    │   │   ├── Orchomenus
    │   │   ├── Tantalus II
    │   │   └── Pelopia
    │   │       └── Aegisthus [father: Thyestes; mother: Pelopia]
    │   │           ├── Erigone [with Clytemnestra]
    │   │           └── later children reported outside the core seven-source account
    │   ├── Pittheus → Aethra → Theseus [external dynasty boundary]
    │   ├── Troezen, Alcathous, Copreus and other collateral sons
    │   ├── Chrysippus [mother outside the Hippodamia marriage in major accounts]
    │   └── collateral daughters → Perseid/Heraclid marriages [external boundary]
    ├── Niobe + Amphion
    │   ├── twelve, fourteen, twenty, or five children depending on source
    │   └── Chloris / Meliboea (+ sometimes Amyclas) survive in variant traditions
    │       └── Chloris + Neleus → Nestor and the Neleids [external dynasty boundary]
    └── Broteas
        └── Tantalus III [alternative father of Clytemnestra's first husband]
```

### 3.1 The Pleisthenes insertion

Some genealogies place an extra generation between Atreus and the famous brothers:

```text
Atreus
└── Pleisthenes + Aerope / Cleolla (tradition-dependent)
    ├── Agamemnon
    ├── Menelaus
    └── Anaxibia
```

This must not be merged into the direct Homeric/Apollodoran `Agamemnon → Atreus` and `Menelaus → Atreus` edges. If Pleisthenes is added, the competing parent relations need a shared topic such as `atreid-brothers-parentage`.

## 4. Generation-by-generation findings

## 4.1 Tantalus I: founder of the house

### Identity

- **Recommended id:** `tantalus`
- **Greek name:** Tantalos (Τάνταλος)
- **Type:** `mortal`
- **Cluster:** `pelopid-house` or a wider `anatolian-royal-line`
- **Core locations:** Mount Sipylus/Lydia, Hades

### Parentage and consorts

Pausanias identifies the famous Tantalus as a son of Zeus and Plouto. The wider tradition supplies several incompatible wives or mothers of his children, most commonly Euryanassa, Dione and Clytia. Only an attribution actually present in a supported source should become an edge. A modern synthesis must not silently choose one wife for all children.

### Secure children for the first atlas batch

| Child | Support | Notes |
|---|---|---|
| Pelops | Apollodorus, Pindar, Pausanias, Ovid, Hyginus | Central heir; his resurrection itself is disputed |
| Niobe | Apollodorus, Homer, Ovid | Marries Amphion and opens the Theban/Neleid branch |
| Broteas | Apollodorus, Pausanias-related tradition | Hunter who dishonors Artemis and burns himself |

### Crime and punishment are separate facts

- Homer describes Tantalus standing in water beneath fruit he cannot reach, but does not make the Pelops banquet the explicit cause in the surviving passage.
- Apollodorus reports punishment by the receding water, fruit and hanging stone, then gives disclosure of divine secrets and sharing ambrosia as reported causes.
- Pindar rejects the cannibal feast and instead accuses Tantalus of sharing nectar and ambrosia stolen from the gods.
- The boiled-Pelops banquet belongs to Apollodorus, Hyginus, Ovid and the tradition Pindar is arguing against.

These should become separate story entries under a topic such as `tantalus-offence` rather than one blended paragraph.

## 4.2 Broteas and Tantalus III

- **Broteas** is a son of Tantalus I and a hunter who refuses to honor Artemis. Apollodorus says he boasted that fire could not harm him, was driven mad and threw himself into fire (`Epitome 2.2`).
- **Tantalus III** is a necessary distinct entity only if the Pausanian alternative for Clytemnestra's first husband is modeled. Pausanias says that this younger Tantalus was a son of Thyestes **or Broteas** (`2.22.3`).
- Do not merge Tantalus III with the founder or with a child served in the banquet of Thyestes.

Recommended ids:

- `broteas`
- `tantalus-son-of-thyestes` for the Apollodoran relation
- If the UI cannot support one entity with competing fathers cleanly, use one younger `tantalus-clytemnestra-husband` entity and attach alternative parent edges from Thyestes and Broteas under `younger-tantalus-parentage`.

The second option is preferable: Pausanias treats the buried husband as one person with two reported fathers.

## 4.3 Pelops

### Identity

- **Recommended id:** `pelops`
- **Type:** `hero`
- **Domains:** kingship, chariot racing, Pisa, the naming of the Peloponnese
- **Cluster:** `pelopid-house`

### Death or disappearance at Tantalus' feast

| Source | Version |
|---|---|
| Apollodorus | Pelops was slaughtered and boiled; after restoration he was more beautiful than before and became beloved by Poseidon (`Epitome 2.3`) |
| Ovid | Preserves the ivory-shoulder motif in the Niobe narrative |
| Pindar | Rejects the cannibal banquet as slander against the gods; Poseidon carried the beautiful Pelops away, while Tantalus' actual crime concerned divine nectar and ambrosia |

Suggested topic: `pelops-feast-and-restoration`.

### Hippodamia, Oenomaus and Myrtilus

Apollodorus gives a continuous chain (`Epitome 2.4–2.9`):

1. Oenomaus kills Hippodamia's suitors in chariot races.
2. Hippodamia persuades Myrtilus, charioteer of Oenomaus, to sabotage the axle pins.
3. Oenomaus dies and curses Myrtilus.
4. Pelops later throws Myrtilus into the sea after an attempted assault on Hippodamia.
5. Myrtilus curses the house of Pelops.

The dynasty therefore carries two distinct inherited-pollution narratives: the crime of Tantalus and the curse of Myrtilus. The UI should not present a single universally defined "curse of the house."

### Children

Apollodorus securely names Pittheus, Atreus and Thyestes and acknowledges additional sons (`Epitome 2.10`). Other ancient traditions add Troezen, Alcathous, Copreus, Chrysippus and several daughters. The first implementation should resist adding every collateral child at once.

Recommended core children:

| Entity | Why it belongs in the first dynasty batch |
|---|---|
| Atreus | Main succession branch |
| Thyestes | Rival succession branch |
| Pittheus | Strongly attested, but may be deferred with the Theseus batch |
| Chrysippus | Required to explain the pre-Atreid fratricidal conflict and Hippodamia's exile/death traditions |

Recommended collateral children for later targeted batches:

- Troezen and Alcathous with local-city traditions.
- Copreus with the Heracles/Eurystheus cycle.
- Astydamia, Nicippe, Lysidice and Eurydice only when their spouse and child lines are added, because otherwise they become isolated name nodes.

## 4.4 Niobe and Amphion

### The child-count dispute

Apollodorus explicitly preserves the disagreement (`Library 3.5.6`):

| Source/tradition | Children |
|---|---|
| Apollodorus' main list | Seven sons and seven daughters, all named |
| Hesiod as quoted by Apollodorus | Ten sons and ten daughters |
| Herodorus as quoted by Apollodorus | Two sons and three daughters |
| Homer | Six sons and six daughters |

Suggested topic: `niobids-number-and-names`.

### Apollodorus' named Niobids

**Sons:** Sipylus, Eupinytus, Ismenus, Damasichthon, Agenor, Phaedimus, Tantalus.

**Daughters:** Ethodaia/Neaera, Cleodoxa, Astyoche, Phthia, Pelopia, Astycratia, Ogygia.

Apollodorus then creates another contradiction inside the survivor tradition:

- His main account says the male survivor was Amphion and the female survivor was Chloris, wife of Neleus.
- Telesilla's version says Amyclas and Meliboea survived; Meliboea is commonly connected with Chloris, but the text should not silently collapse the names without explanation.

Suggested topic: `niobids-survivors`.

### Expansion boundary

Chloris' marriage to Neleus makes Tantalus an ancestor of Nestor and the Neleids. The dynasty dossier records that connection, but the full Neleid house should be a separate batch. Otherwise "all descendants" expands through Nestor's children into a second large epic genealogy.

## 4.5 Atreus and Thyestes

### The golden lamb and kingship

Apollodorus (`Epitome 2.10–2.12`) records:

- Atreus marries Aerope.
- Aerope becomes the lover of Thyestes and gives him the hidden golden lamb.
- Thyestes wins the Mycenaean throne by displaying it.
- Zeus validates Atreus by reversing the course of the sun, and Atreus banishes Thyestes.

Potential topic: `mycenaean-succession-sign` if Hyginus or another supported source provides a materially different sequence.

### The banquet of Thyestes

Apollodorus names three sons of Thyestes by a Naiad:

- Aglaus
- Callileon
- Orchomenus

Atreus kills them at the altar of Zeus, cooks them, serves them to Thyestes and reveals their extremities after the meal (`Epitome 2.13`). Hyginus preserves additional names and arrangements in his catalogues. Children should not be combined across authors into one universal sibling set.

### Pelopia and Aegisthus

The oracle tells Thyestes that revenge will come through a son born from his own daughter. Thyestes fathers Aegisthus by Pelopia; Aegisthus later learns his origin, kills Atreus and restores Thyestes (`Apollodorus, Epitome 2.14`).

Required relations:

- `aegisthus → thyestes` (`parent`)
- `aegisthus → pelopia` (`parent`)
- `aegisthus → atreus` (`slayer`)

The incestuous parentage is a sourced genealogical fact, not a domain or character label.

## 4.6 Agamemnon and Menelaus

### Their father is disputed

Homer repeatedly calls the brothers Atreidai, and Apollodorus' Trojan catalogue calls both sons of Atreus and Aerope (`Epitome 3.12`). Other traditions insert Pleisthenes between Atreus and the brothers.

Suggested topic: `atreid-brothers-parentage`.

Implementation rule:

- Add direct Atreus/Aerope parent edges only for sources that state or clearly use that genealogy.
- Add Pleisthenes edges only when a supported source explicitly preserves them.
- Do not use “Atreid” alone as proof that Atreus is the immediate biological father; patronymics can describe dynasty as well as direct descent.

## 4.7 Agamemnon's household

### Clytemnestra's first marriage

Apollodorus says Agamemnon killed Tantalus, son of Thyestes, and their newborn child before marrying Clytemnestra (`Epitome 2.15–2.16`). Pausanias reports the husband as a son of Thyestes or Broteas (`2.22.3`).

Suggested topic: `clytemnestra-first-husband-parentage`.

### Children of Agamemnon and Clytemnestra

| Source | Children explicitly represented |
|---|---|
| Homer, *Iliad* 9 | Orestes; daughters Chrysothemis, Laodice and Iphianassa |
| Apollodorus, *Epitome* 2.16 | Orestes; Chrysothemis, Electra and Iphigenia |
| Later tragedy | Electra and Iphigenia become central, but their plots and even Iphigenia's fate vary by playwright |

The project must not simply declare `Iphianassa = Iphigenia` or `Laodice = Electra`. They may be poetic equivalents in later interpretation, but the source data should preserve the names actually used.

Suggested topics:

- `agamemnon-daughters-identities`
- `iphigenia-fate`

### Murder and revenge

- Agamemnon returns with Cassandra and is murdered by Clytemnestra and Aegisthus in Apollodorus (`Epitome 6.23`).
- Electra saves Orestes and sends him to Strophius, where he grows up with Pylades (`6.24`).
- Orestes and Pylades kill Clytemnestra and Aegisthus (`6.25`).
- Orestes is pursued by the Furies and acquitted at Athens after an evenly split vote (`6.25`).

The exact agency in Agamemnon's murder and the moral architecture of Orestes' trial differ sharply between Homer, Apollodorus and Aeschylus. Use source-atomic paragraphs.

## 4.8 Menelaus' household

### Helen's child

Hermione is the secure child of Menelaus and Helen. Apollodorus says Helen left nine-year-old Hermione behind when she departed with Paris (`Epitome 3.3`). Homer calls Hermione Helen's only child in the relevant household description.

### Other sons

Homer gives Menelaus a son Megapenthes by a slave woman. Pausanias names Nicostratus and Megapenthes as sons of Menelaus by a slave woman (`2.18.6`). Later sources name the mother Pieris or Tereis.

Potential topic: `menelaus-children-and-mothers`.

Do not attach Megapenthes or Nicostratus to Helen.

## 4.9 Orestes and the final royal generations

### Spouses and sons

Apollodorus says Orestes married Hermione, or according to some Erigone, and fathered Tisamenus (`Epitome 6.28`). Pausanias gives a cleaner split (`2.18.6`):

- Hermione is mother of Tisamenus.
- Erigone, daughter of Aegisthus, is mother of the illegitimate Penthilus.

Suggested topic: `orestes-heirs-maternity`.

### Electra's descendants

Pausanias cites Hellanicus for two sons of Electra and Pylades (`2.16.7`):

- Medon
- Strophius

These are useful endpoint entities only if the project continues beyond the revenge generation.

### Tisamenus' sons

Pausanias (`7.6.2`) names five sons who lead the Achaeans after the Dorian return:

- Cometes, the eldest
- Daimenes
- Sparton
- Tellis
- Leontomenes

### Penthilus' line

Pausanias preserves a post-Orestes line through Penthilus. `5.4.3` traces Agorius as son of Damasius, son of Penthilus, son of Orestes. This is distinct from the longer Neleid Penthilus genealogy elsewhere in Pausanias; do not merge same-name figures merely because both belong to migration narratives.

The direct Pelopid implementation can reasonably stop at Tisamenus and Penthilus. Their children belong to a later “Return of the Heracleidae and migrations” batch.

## 5. Same-name and identity hazards

| Name | Entities that must remain separate |
|---|---|
| Tantalus | Founder and son of Zeus; Niobid son of Amphion and Niobe; younger husband of Clytemnestra; son eaten in some Thyestes catalogues |
| Pelopia | Daughter of Thyestes and mother of Aegisthus; daughter of Niobe in Apollodorus' Niobid list |
| Pleisthenes | Inserted father of Agamemnon and Menelaus; son of Thyestes killed in some catalogues; other minor same-name figures |
| Atreus | Pelopid king; do not confuse with later historical or minor namesakes |
| Tisamenus | Son of Orestes; a different Tisamenus appears in other heroic genealogies |
| Penthilus | Son of Orestes; Neleid Penthilus in Pausanias' migration genealogy is separate |
| Amphion | Husband of Niobe; Apollodorus confusingly calls a surviving Niobid son Amphion in one line |
| Chloris / Meliboea | Possibly two names for the surviving daughter, but preserve the source wording until identity comparison is implemented |
| Iphianassa / Iphigenia | Commonly harmonized, but never auto-merge in source data |
| Laodice / Electra | Commonly harmonized, but never auto-merge in source data |

## 6. Proposed contradiction topics

| Topic id | Competing claims |
|---|---|
| `tantalus-offence` | Divine secrets/ambrosia theft versus the banquet of Pelops; Homer states punishment without the later causal synthesis |
| `tantalus-consort` | Euryanassa, Dione, Clytia and other reported mothers of his children |
| `pelops-feast-and-restoration` | Dismembered and restored with ivory shoulder versus Pindar's explicit rejection |
| `myrtilus-betrayal` | Who solicits the sabotage, what reward is promised, and why Pelops kills Myrtilus |
| `chrysippus-death` | Laius, Hippodamia, Atreus/Thyestes or suicide traditions in sources beyond the current seven |
| `niobids-number-and-names` | 6+6, 7+7, 10+10, or 2+3 |
| `niobids-survivors` | Chloris, Meliboea, Amyclas, Amphion, or no surviving sons depending on the account |
| `atreid-brothers-parentage` | Sons of Atreus versus sons of Pleisthenes |
| `thyestes-sons-banquet` | Different names and numbers of the murdered children |
| `younger-tantalus-parentage` | Son of Thyestes versus son of Broteas |
| `agamemnon-daughters-identities` | Homeric Chrysothemis/Laodice/Iphianassa versus Chrysothemis/Electra/Iphigenia |
| `iphigenia-fate` | Sacrificed, substituted and rescued, immortalized, or absent under another name |
| `agamemnon-murder-agency` | Aegisthus-led, Clytemnestra-led, or jointly executed versions |
| `orestes-trial` | Accuser and mechanism of purification/acquittal vary |
| `orestes-heirs-maternity` | Tisamenus by Hermione or Erigone; Pausanias separates Tisamenus and Penthilus by mother |
| `menelaus-children-and-mothers` | Hermione as Helen's only child; Megapenthes and Nicostratus by slave/concubine traditions |

## 7. Entity roster proposal

Adding the entire dossier at once would violate the project's incremental-data rule. Use three verified batches.

### Batch A — The curse begins (12 entities)

| id | Type | Reason |
|---|---|---|
| `tantalus` | mortal | Founder |
| `plouto` | nymph | Supported mother edge for Tantalus; avoid a dangling founder |
| `pelops` | hero | Main dynastic hinge |
| `niobe` | mortal | Major independent branch |
| `broteas` | mortal | Third secure child |
| `hippodamia` | mortal | Mother of the principal Pelopids |
| `oenomaus` | mortal | Chariot-race and succession story |
| `myrtilus` | hero or mortal | Curse of the Pelopid house |
| `atreus` | mortal | Main succession branch |
| `thyestes` | mortal | Rival succession branch |
| `aerope` | mortal | Golden-lamb transfer and both brother genealogies |
| `chrysippus` | hero | Earlier fratricidal rupture |

Research decision required: whether Myrtilus is typed `hero` because he is a son of Hermes, or `mortal` because the current taxonomy has no demigod class. Follow the project's treatment of comparable figures.

### Batch B — The two royal houses (12–14 entities)

Agamemnon, Menelaus, Clytemnestra, Helen, Pelopia, Aegisthus, younger Tantalus, Orestes, Electra, Iphigenia, Chrysothemis, Hermione, Erigone, Pylades.

Pleisthenes should enter this batch only after its supported-source edge matrix is complete.

### Batch C — Survivors and succession

Tisamenus, Penthilus, Medon, Strophius, Chloris/Meliboea and the minimum Neleid endpoints required to connect Nestor. The many named Niobids should be their own carefully validated sub-batch rather than fourteen near-empty stars.

## 8. Relation modeling notes

1. Use `parent` only from child to parent, matching the project convention.
2. Aegisthus requires two parent edges to Thyestes and Pelopia; the relation is both paternal and grand-paternal through the same man, but the schema should store only the literal parent edge.
3. Do not encode “curse” as `adversary`. It is a narrative theme, not a dyadic relationship.
4. Use `slayer` for direct killings only when the source names the agent: Pelops→Myrtilus, Aegisthus→Atreus, Agamemnon→younger Tantalus, Orestes→Clytemnestra/Aegisthus.
5. Atreus serving Thyestes' sons should be represented by story facts plus `slayer` edges; there is no need for a special cannibalism relation type.
6. Marriages use `consort`; sexual unions outside marriage may use `lover`, but incestuous parentage still needs ordinary parent edges.
7. Alternative fathers belong on competing relations sharing a topic. Do not create duplicate younger-Tantalus entities merely to avoid the contradiction.

## 9. Recommended first implementation boundary

The best first data batch is **Tantalus through Atreus and Thyestes**, stopping before the Trojan generation. It creates a coherent cluster with twelve entities, three visible source disputes and no dependency on the still-unsupported tragedian lenses.

Minimum complete graph:

```text
Zeus + Plouto → Tantalus
Tantalus → Pelops, Niobe, Broteas
Pelops + Hippodamia → Atreus, Thyestes
Pelops → Chrysippus [mother/source pending]
Oenomaus → Hippodamia
Hermes → Myrtilus
Atreus + Aerope → later Atreid branch
Thyestes + Pelopia → Aegisthus
```

Niobe's marriage to Amphion can be included in Batch A only if Amphion is added simultaneously. Otherwise her dossier should mention the Theban marriage but no dangling relation should be created.

## 10. Primary-source map

Online editions consulted during this pass:

- [Homer, *Iliad* 9](https://www.theoi.com/Text/HomerIliad9.html), [*Iliad* 24](https://www.theoi.com/Text/HomerIliad24.html), [*Odyssey* 4](https://www.theoi.com/Text/HomerOdyssey4.html), and [*Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html)
- [Pindar, *Olympian* 1](https://topostext.org/work/18)
- [Pseudo-Apollodorus, *Epitome*](https://www.theoi.com/Text/ApollodorusE.html) and [*Library* 3](https://www.theoi.com/Text/Apollodorus3.html)
- [Hyginus, *Fabulae*](https://topostext.org/work/206)
- [Pausanias, Book 2](https://www.theoi.com/Text/Pausanias2B.html), [Book 5](https://www.theoi.com/Text/Pausanias5A.html), and [Book 7](https://www.theoi.com/Text/Pausanias7A.html)
- [Ovid, *Metamorphoses* 6](https://www.theoi.com/Text/OvidMetamorphoses6.html)

The section references below are the evidence map for later character and relation entry. Translation wording must not be copied into summaries without checking its license and the original context.

### Homer

- *Odyssey* 11.582–592: Tantalus' punishment.
- *Iliad* 9.142–148: Orestes and Agamemnon's three named daughters.
- *Iliad* 24.602–617: Niobe's six sons and six daughters.
- *Odyssey* 4.1–14: Hermione and Megapenthes in Menelaus' household.

### Pindar — research-only pending source support

- *Olympian* 1.24–93: Tantalus, Poseidon and Pelops; rejection of the cannibal banquet; nectar and ambrosia offence.

### Pseudo-Apollodorus

- *Epitome* 2.1–2.16: Tantalus, Broteas, Pelops, Hippodamia, Myrtilus, Atreus, Thyestes, Aegisthus, Agamemnon and Menelaus.
- *Library* 3.5.6: Niobe, the competing Niobid counts and survivor traditions.
- *Epitome* 3.3, 3.12, 6.23–6.28: Hermione; Atreid parentage; murder and revenge; Orestes' marriage and Tisamenus.

### Hyginus

- *Fabulae* 82–88: Tantalus/Pelops and the Pelopid crimes.
- *Fabulae* 117–124 and 244–246: Atreid aftermath and catalogues of kin-slaying; verify each number against the Latin/Grant translation before data entry.

### Pausanias

- 2.16.6–7: graves at Mycenae; Electra and Pylades' sons.
- 2.18.1–8: Thyestes, younger Tantalus, Orestes, Hermione, Tisamenus and Penthilus.
- 2.22.3: younger Tantalus as son of Thyestes or Broteas; founder Tantalus' grave on Sipylus.
- 5.4.3, 5.13.1–7: Penthilus' descendants and the cult/bone of Pelops.
- 7.6.2: sons of Tisamenus and the Achaean migration generation.

### Ovid

- *Metamorphoses* 6.146–312: Niobe and the ivory shoulder of Pelops.
- Other Tantalid allusions require line-by-line verification before entry.

## 11. Open research questions before JSON entry

1. Which current supported source explicitly supplies Tantalus' wife Euryanassa in a form suitable for a relation edge?
2. Should Plouto be typed `nymph`, `mortal`, or `god` under the project's taxonomy? The ancient text gives genealogy more readily than ontological class.
3. Which Pelopid daughters can be added without importing whole external dynasties?
4. Does the project want one younger Tantalus with alternative parent edges, or separate source-specific identity nodes? The current relation model strongly favors one entity.
5. Should `Iphianassa` and `Iphigenia` remain two entities until a comparison UI can express possible identity, or one entity with source-specific names? The current character schema has only one display name and no sourced aliases, so separate entities may be safer.
6. The current seven-source set is inadequate for the dramatic core of the house. Pindar and the three tragedians should be considered before the Agamemnon/Orestes batch.

## 12. Conclusion

The direct Tantalid/Pelopid dynasty has a manageable core of roughly thirty high-value entities, but its total collateral descent is much larger. The correct atlas strategy is:

1. Build the founder-to-Atreus/Thyestes cluster first.
2. Add the Trojan royal households as a second source-audited batch.
3. Add Niobids and post-Orestes migration descendants only when they have enough individual narrative to justify their own stars.
4. Preserve every parentage and identity contradiction as a first-class topic rather than choosing a modern harmonized tree.

This house is an ideal stress test for the source lens: under different authors, the same sky should visibly change parents, children, names and even the foundational crime that supposedly cursed the dynasty.
