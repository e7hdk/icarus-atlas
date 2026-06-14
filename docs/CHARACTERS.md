# Character roster

The original research draft below covers the 26 characters that gated Milestone 1; four load-bearing additions brought the completed core to 30. Six verified expansion batches bring the live data set to 96. Relation bullets reflect the research draft; see [Data-entry conventions](#data-entry-conventions) for how they map onto the schema in `src/types/character.ts`.

## Summary table

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `zeus` | Zeus | Zeus (Ζεύς) | olympian | sky, thunder, kingship, justice |
| `hera` | Hera | Hera (Ἥρα) | olympian | marriage, women, queenship, childbirth |
| `poseidon` | Poseidon | Poseidon (Ποσειδῶν) | olympian | sea, earthquakes, horses, storms |
| `demeter` | Demeter | Demeter (Δημήτηρ) | olympian | agriculture, grain, harvest, sacred law |
| `athena` | Athena | Athena (Ἀθηνᾶ) | olympian | wisdom, strategic warfare, crafts, the city |
| `apollo` | Apollo | Apollon (Ἀπόλλων) | olympian | prophecy, music, healing, archery |
| `artemis` | Artemis | Artemis (Ἄρτεμις) | olympian | the hunt, wilderness, childbirth, the moon |
| `ares` | Ares | Ares (Ἄρης) | olympian | war, bloodlust, courage |
| `aphrodite` | Aphrodite | Aphrodite (Ἀφροδίτη) | olympian | love, beauty, desire, the sea-foam* |
| `hephaestus` | Hephaestus | Hephaistos (Ἥφαιστος) | olympian | fire, metalworking, craftsmanship, volcanoes |
| `hermes` | Hermes | Hermes (Ἑρμῆς) | olympian | travel and messengers, commerce, thieves, boundaries |
| `hestia` | Hestia | Hestia (Ἑστία) | olympian | the hearth, home, family, the civic fire |
| `dionysus` | Dionysus | Dionysos (Διόνυσος) | olympian | wine, ecstasy, theater, vegetation and rebirth |
| `hades` | Hades | Haides (ᾍδης) | god | the underworld, the dead, hidden wealth |
| `persephone` | Persephone | Persephone (Περσεφόνη) | god | spring growth, the underworld, the dead |
| `chaos` | Chaos | Chaos (Χάος) | primordial | the primal void, the gap between earth and sky, mist and air |
| `gaia` | Gaia | Gaia (Γαῖα) | primordial | the earth, motherhood, prophecy, oaths |
| `uranus` | Uranus | Ouranos (Οὐρανός) | primordial | the sky, the heavens |
| `nyx` | Nyx | Nyx (Νύξ) | primordial | night, darkness |
| `eros` | Eros | Eros (Ἔρως) | primordial | love, desire, generative force |
| `tartarus` | Tartarus | Tartaros (Τάρταρος) | primordial | the abyss, imprisonment, the deep underworld |
| `cronus` | Cronus | Kronos (Κρόνος) | titan | kingship of the Titans, the harvest, time (by later conflation) |
| `rhea` | Rhea | Rhea (Ῥέα) | titan | motherhood, fertility, the mountain wilds |
| `oceanus` | Oceanus | Okeanos (Ὠκεανός) | titan | the earth-encircling river, fresh water, the sources of all streams |
| `prometheus` | Prometheus | Prometheus (Προμηθεύς) | titan | forethought, fire, craft, champion of mankind |
| `atlas` | Atlas | Atlas (Ἄτλας) | titan | bearing the heavens, endurance, astronomy |

\* "the sea-foam" is flagged for replacement — it is an origin story, not a domain (see fix-notes below).

## Expansion batch 1 — Night Court

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `aether` | Aether | Aithēr (Αἰθήρ) | primordial | upper air, brightness |
| `hemera` | Hemera | Hēmera (Ἡμέρα) | primordial | day, daylight |
| `moros` | Moros | Moros (Μόρος) | god | doom, destined death |
| `thanatos` | Thanatos | Thanatos (Θάνατος) | god | death, the passage of the dead |
| `hypnos` | Hypnos | Hypnos (Ὕπνος) | god | sleep, rest, divine slumber |
| `momus` | Momus | Mōmos (Μῶμος) | god | blame, reproach |
| `oizys` | Oizys | Oizys (Ὀϊζύς) | god | misery, distress, suffering |
| `nemesis` | Nemesis | Nemesis (Νέμεσις) | god | retribution, indignation |
| `apate` | Apate | Apatē (Ἀπάτη) | god | deceit, fraud, delusion |
| `geras` | Geras | Gēras (Γῆρας) | god | old age, the decline of mortal life |
| `eris` | Eris | Eris (Ἔρις) | god | strife, discord, conflict |
| `themis` | Themis | Themis (Θέμις) | titan | divine law, custom, order |
| `clotho` | Clotho | Klōthō (Κλωθώ) | god | fate, the allotment of mortal life |
| `lachesis` | Lachesis | Lachesis (Λάχεσις) | god | fate, the allotment of mortal life |
| `atropos` | Atropos | Atropos (Ἄτροπος) | god | fate, the limit of mortal life |

Batch boundary: collective figures such as the Oneiroi, Keres and Hesperides remain deferred. This batch uses one star per individual figure and adds Themis because the Zeus–Themis parentage of the Moirai cannot be modeled with a dangling endpoint.

## Expansion batch 2 — The first humans

The anthropogony batch: the missing Iapetionids, the making of Pandora, the Deucalion flood, and the rival Argive line of first men. Brings the live data set to 56 and lights up the first `mortal` and `nymph` stars. Every fact was verified against the primary texts (Perseus, ToposText) before entry; per-figure research dossiers cover the candidate claims, citations and inter-author contradictions.

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `epimetheus` | Epimetheus | Epimētheus (Ἐπιμηθεύς) | titan | afterthought, hindsight |
| `menoetius` | Menoetius | Menoitios (Μενοίτιος) | titan | presumption, overweening pride |
| `clymene` | Clymene | Klymenē (Κλυμένη) | nymph | fresh waters, the nurture of youths |
| `asia` | Asia | Asia (Ἀσία) | nymph | fresh waters, the nurture of youths |
| `pandora` | Pandora | Pandōra (Πανδώρα) | mortal | the first woman, all gifts, the jar of ills |
| `pyrrha` | Pyrrha | Pyrrha (Πύρρα) | mortal | the great flood, piety, the renewal of mankind |
| `deucalion` | Deucalion | Deukaliōn (Δευκαλίων) | mortal | the great flood, survival, the stone-born people |
| `hellen` | Hellen | Hellēn (Ἕλλην) | mortal | the naming of the Hellenes, kingship |
| `phoroneus` | Phoroneus | Phorōneus (Φορωνεύς) | mortal | first kingship, the gathering of mankind, the fire of Argos |
| `inachus` | Inachus | Inachos (Ἴναχος) | god | the Argive river, fresh waters, judgment between gods |
| `melia` | Melia | Melia (Μελία) | nymph | motherhood of the Argive line |

Batch rationale and boundaries:

- **Epimetheus and Menoetius** complete the four Iapetionids; Prometheus and Atlas had sibling notes pointing at them since M1.
- **Clymene and Asia** are both included because the mother of the Iapetionids is a genuine lens dispute (`iapetionid-mother`): Clymene in Hesiod and Hyginus, Asia in Apollodorus. Modeling only one would leave the other lens dangling.
- **Inachus and Melia** anchor Phoroneus: without them the Argive first man would float edge-less. Inachus is typed `god` (river god); kingship claims about him are Pausanias-reported local tradition only.
- Cluster placement: the two titans and the three Oceanid nymphs and Inachus sit in `titan-ring` (genealogical generation), the five mortals open the new outer `mortal-arm` cluster.
- Deferred: Hellen's sons (Dorus, Xuthus, Aeolus) and the line of Io descend from this batch but belong with the hero sagas (M4); Argia (Hyginus' rival mother of Phoroneus) and Orseis stay note-only, single-sentence figures.

Same-name cautions recorded during research (do NOT merge):

- Menoetius the Titan ≠ Menoetius of Opus, father of Patroclus (Homer, Apollonius) ≠ Menoetes, herdsman of Hades (Apollodorus 2.5.10–12).
- Clymene wife of Iapetus ≠ Ovid's Clymene, mother of Phaethon by Sol (Metamorphoses 1.750ff; though Hyginus 156 gives Phaethon's mother the same "daughter of Ocean" parentage) ≠ Homer's Nereid/handmaid Clymenes ≠ Apollonius' Clymene daughter of Minyas.
- Asia the Oceanid ≠ Athena's epithet "Asia" (Pausanias 3.24.7); the continent-eponym claim is Herodotus, out of scope.
- Melia of Argos ≠ the Meliae ash-nymphs (Theogony 187) ≠ Melia of Thebes (Pausanias 9.10.5–6) ≠ Melie the Bithynian, mother of Amycus (Argonautica 2.1–4).
- Hellen ≠ Helen of Troy (Hyginus' Latin "Hellen" is sometimes mistranslated "Helen") ≠ Helle of the Hellespont (accusative "Hellen" in Hyginus' Latin).
- Pyrrha the flood-heroine ≠ "Pyrrha", Achilles' girl-name on Scyros (Fabulae 96).
- Famous out-of-scope material kept OUT of the data: Plato's Protagoras myth of Epimetheus, Thucydides 1.3 on Hellen, the Hesiodic Catalogue of Women genealogies, Aeschylus' Io, Plutarch's flood dove, Lucian's Hierapolis chasm, "Pandora's box" (Erasmus' mistranslation — the Greek is pithos, a jar).

## The House of Aeolus — Batch A

Continues the Deucalionid thread (Hellen → Aeolus). Researched as a full source-mapped dossier **before** entry — genealogy, 27 contradiction topics, the same-name hazard map (3 Aeoluses, 4 Actors, 3 Glaucuses; the `epopeus`/`orchomenus`/`clymene`/`orestes` existing-node collisions) and the A/B/C batch plan all live in **[docs/AEOLUS_DYNASTY.md](AEOLUS_DYNASTY.md)**.

Batch A = 16 figures (`aeolus-hellene`, `enarete`, `orseis`, `cretheus`, `tyro`, `salmoneus`, `sisyphus`, `athamas`, `pelias`, `neleus`, `aeson`, `jason`, `nephele`, `phrixus`, `merope-pleiad`, `glaucus-corinth`): the founder, the branch-founding sons, and the Iolcus/Argonaut and golden-ram seeds. Anchored onto `hellen`; interlocks `ino` (Athamas' wife), `atlas` (Merope the Pleiad), `asopus` and `poseidon`. Eight contradiction topics entered (see docs/CONTRADICTIONS.md).

Batch B = 15 figures (`helle`, `learchus`, `melicertes`, `amythaon`, `pheres-aeolid`, `admetus`, `alcestis`, `acastus`, `bellerophon`, `deion`, `magnes-aeolid`, `dictys`, `polydectes`, `perieres-aeolid`, `gorgophone`): the Athamas-branch tragedy, the Iolcus seer/Pherae lines, the Corinthian Bellerophon, and the Seriphos/Messene sons. Completes the seven-brother sibling clique; interlocks `danae`/`perseus` (Dictys, Polydectes, Gorgophone) and `proetus` (Bellerophon). **Each Batch B figure ships all three data layers**: sourced mythology (`data/characters/`), an Information reference that embeds its Wikipedia article body as section headings + paragraphs (`data/reference/`, CC BY-SA), and a Legacy gallery of verified Wikimedia-Commons artworks (`data/culture/`).

Batch C = 16 figures (`melampus`, `bias-aeolid`, `cephalus-aeolid`, `procris`, `canace`, `alcyone-aeolid`, `ceyx`, `calyce`, `aethlius`, `protogeneia`, `endymion`, `aetolus`, `iphimedeia`, `aloeus-aeolid`, `otus`, `ephialtes-aload`): the Melampid seers, the daughters' lines (Canace → the Aloadae; Calyce → Aethlius → Endymion → Aetolus; Alcyone → Ceyx) and the Phocian Cephalus/Procris. Completes the full **ten-child Aeolid sibling clique** and loops the flood line back in (`protogeneia` ← `deucalion`/`pyrrha`); interlocks `eos`, `proetus`, `poseidon` and the Olympians (the Aloadae vs `ares`/`apollo`). Two documented contradictions (`aethlius-paternity`, `endymion-parentage`). Same three-layer codex as Batch B. **The House of Aeolus is now complete (A+B+C = 47 Aeolids).** Same-name collisions resolved per CLAUDE.md hard rule 7 (`alcyone-aeolid` vs the Pleiad, `cephalus-aeolid` vs the Athenian, `aloeus-aeolid`/`ephialtes-aload` suffixes).

## The Athenian Royal House — Batch A

The Attic autochthonous line. Researched as a full source-mapped dossier **before** entry — genealogy (Cecrops I → Theseus), the same-name hazard map (the `erichthonius-athens`/`creusa-athens`/`pallas-pandionid`/`lycus-pandionid` suffixes resolving collisions with existing nodes; two Cecrops, two Pandion, two Praxithea), 17 contradiction topics and the A/B/C plan all live in **[docs/ATHENS_DYNASTY.md](ATHENS_DYNASTY.md)**.

Batch A = 15 figures (`cecrops`, `cranaus`, `amphictyon`, `erichthonius-athens`, `pandion`, `erechtheus`, `praxithea`, `cecrops-ii`, `metion`, `pandorus`, `creusa-athens`, `procne`, `philomela`, `tereus`, `itys`): the Cecropid/Erechtheid royal spine and the Tereus tragedy. Anchored onto `deucalion`/`pyrrha` (Amphictyon), `hephaestus`/`gaia`/`athena` (Erichthonius and the Athena–Poseidon contest), `ares` (Tereus), and the existing `procris` (wired as Erechtheus' daughter). One documented contradiction (`amphictyon-parentage`); the bird/star metamorphoses and the contest-judge dispute are narrated in sourced prose. Each figure ships the three-layer codex (mythology + Wikipedia-section Information reference + Legacy artwork gallery). Batches B (Aegeus/Theseus + Eleusis war) and C (the Boreads + the Ionian stem) are deferred. 

Batch B = 13 figures (`pandion-ii`, `aegeus`, `pallas-pandionid`, `nisus`, `lycus-pandionid`, `aethra`, `theseus`, `hippolytus`, `eumolpus`, `immaradus`, `butes-athenian`, `chthonia-athens`, `orithyia-athens`): the Pandionid restoration (the four sons who divide Attica) and the spine of the Theseus saga. **Theseus** interlocks the existing Cretan cluster (`minotaur` slain, `ariadne`/`phaedra`, `minos`/`daedalus`) and `pittheus` (through his mother `aethra`); the Eleusis war wires `poseidon` and `zeus`. Three new documented contradictions (`theseus-paternity`, `who-erechtheus-slew`, `death-of-erechtheus`) plus the reused `ariadne-fate`. Same three-layer codex. Batch C (the Boreads `boreas`/`zetes`/`calais` and the Ionian stem `xuthus`/`ion`) is deferred. 

Batch C = 12 figures (`boreas`, `zetes`, `calais`, `cleopatra-boreas`, `chione-athens`, `xuthus`, `ion`, `achaeus`, `orneus`, `praxithea-naiad`, `zeuxippe-naiad`, `scylla-nisus`): the Boreas/Orithyia branch (the Boreads who sail with `jason`; Chione, mother of `eumolpus`), the Ionian stem (`xuthus` ← `hellen` → `ion`/`achaeus`), the Erechtheid `orneus`, the two Naiad queens (`praxithea-naiad`/`zeuxippe-naiad`, completing the maternity of Pandion I and his children), and `scylla-nisus`. One new documented contradiction (`ion-paternity`). **The Athenian house is complete (A+B+C = 40).** Areas integration done: `data/lineages/athens.json` (the king-list) and `residences:[{city:'athens'}]` on the Athens-resident figures populate the `/city/athens` lineage panel and city-sky. Same-name collisions resolved per hard rule 7 (`erichthonius-athens`/`creusa-athens`/`pallas-pandionid`/`lycus-pandionid`, the two Praxitheas, `scylla-nisus` vs the sea-monster, `cleopatra-boreas` vs Meleager's wife).

## Expansion batch 3 — The Pelopid curse

The first implementation slice from `docs/TANTALUS_DYNASTY.md`: the founder's immediate house, the race for Hippodamia, and the Atreus–Thyestes feud. This adds 12 characters and brings the live data set to 68.

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `tantalus` | Tantalus | Tantalos (Τάνταλος) | mortal | divine favor betrayed, the unreachable feast, the Pelopid dynasty |
| `plouto` | Plouto | Ploutō (Πλουτώ) | nymph | the ancestry of Tantalus, the Sipylian royal line |
| `pelops` | Pelops | Pelops (Πέλοψ) | hero | Pisa, chariot racing, the Peloponnese, dynastic kingship |
| `niobe` | Niobe | Niobē (Νιόβη) | mortal | Theban queenship, maternal pride, mourning, the weeping stone |
| `broteas` | Broteas | Broteas (Βροτέας) | mortal | hunting, Mount Sipylus, the Mother of the Gods |
| `hippodamia` | Hippodamia | Hippodameia (Ἱπποδάμεια) | mortal | the chariot contest of Pisa, Pelopid queenship, dynastic succession |
| `oenomaus` | Oenomaus | Oinomaos (Οἰνόμαος) | mortal | Pisa, chariot racing, the death of suitors |
| `myrtilus` | Myrtilus | Myrtilos (Μυρτίλος) | hero | charioteering, betrayal, the Myrtoan Sea, the Pelopid curse |
| `atreus` | Atreus | Atreus (Ἀτρεύς) | mortal | Mycenaean kingship, the golden lamb, the banquet of Thyestes |
| `thyestes` | Thyestes | Thyestēs (Θυέστης) | mortal | rival kingship, the golden lamb, the accursed banquet |
| `aerope` | Aerope | Aeropē (Ἀερόπη) | mortal | Mycenaean queenship, the golden lamb, the Atreid succession |
| `chrysippus` | Chrysippus | Chrysippos (Χρύσιππος) | hero | the Nemean games, contested succession, the first Pelopid fratricide |

Batch boundary: Amphion, the individual Niobids, Pittheus, Pelopia, Aegisthus, Agamemnon and Menelaus remain deferred. Pindar's rejection of the cannibal Pelops story remains research-only because Pindar is not yet an atlas source id.

## Expansion batch 4 — The two royal houses

The Trojan-generation continuation of the Pelopid dossier adds 14 figures and brings the live data set to 82. It connects the Thyestes–Pelopia branch to Aegisthus and carries the Atreus branch through Agamemnon, Menelaus, their children, and Orestes' marriages.

| id | Name | Type | Domains |
|---|---|---|---|
| `pelopia` | Pelopia | mortal | Sicyon, the sword of Thyestes, concealed parentage |
| `aegisthus` | Aegisthus | mortal | vengeance on Atreus, Mycenaean usurpation, Agamemnon's murder |
| `tantalus-clytemnestra-husband` | Tantalus (Clytemnestra's husband) | mortal | the Thyestid or Brotead succession, Clytemnestra's first marriage |
| `agamemnon` | Agamemnon | hero | Mycenaean kingship, the Achaean command, the homecoming murder |
| `menelaus` | Menelaus | hero | Spartan kingship, Helen's recovery, the Trojan War |
| `clytemnestra` | Clytemnestra | mortal | Argive queenship, vengeance for Iphigenia, Agamemnon's murder |
| `helen` | Helen | hero | Sparta, the Trojan War, contested divine beauty |
| `orestes` | Orestes | hero | vengeance, purification, the Taurian escape, dynastic restoration |
| `electra` | Electra | mortal | mourning, recognition, vengeance, the house of Atreus |
| `iphigenia` | Iphigenia | mortal | Aulis, substitution, Tauris, contested parentage |
| `chrysothemis` | Chrysothemis | mortal | the daughters of Agamemnon, the divided royal household |
| `hermione` | Hermione | mortal | Spartan succession, Orestes' marriage |
| `erigone` | Erigone | mortal | the Thyestid line, Orestes' alternate succession |
| `pylades` | Pylades | hero | friendship, exile, vengeance, the Taurian escape |

Batch boundary: Pleisthenes remains deferred because the surviving traditions use the name for incompatible generations. Homer's Laodice and Iphianassa are not silently merged with Electra and Iphigenia. Tisamenus, Penthilus, Medon and Strophius belong to the next verified succession batch.

## Expansion batch 5 — The elder Titans

This batch completes the named first-generation Titan roster across Hesiod and Pseudo-Apollodorus. Six figures complete Hesiod's canonical twelve; Dione is included because Pseudo-Apollodorus explicitly calls her a Titanis even though Hesiod makes her an Oceanid. The seven additions bring the live data set to 89.

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `coeus` | Coeus | Koios (Κοῖος) | titan | the Titan generation, ancestry of Leto and Asteria |
| `crius` | Crius | Kreios (Κρεῖος) | titan | the Titan generation, ancestry of stars and winds |
| `hyperion` | Hyperion | Hyperiōn (Ὑπερίων) | titan | heavenly light, the solar lineage, watchfulness |
| `theia` | Theia | Theia (Θεία) | titan | heavenly light, motherhood of the sun, moon and dawn |
| `mnemosyne` | Mnemosyne | Mnēmosynē (Μνημοσύνη) | titan | memory, song, the Muses |
| `phoebe` | Phoebe | Phoibē (Φοίβη) | titan | brightness, the lineage of Leto, ancestry of prophecy |
| `dione` | Dione | Diōnē (Διώνη) | titan | divine motherhood, the lineage of Aphrodite |

Batch boundary: this completes the first generation. The standard younger Titan lineage is completed in the following batch; Eurybia and the individual Muses are not Titans in the source genealogies and remain outside this scope.

Source-sensitive classifications:

- Dione is a Titan daughter of Gaia and Uranus in Pseudo-Apollodorus, but an Oceanid daughter of Oceanus and Tethys in Hesiod.
- Mnemosyne is a Titan daughter of Gaia and Uranus in Hesiod and Pseudo-Apollodorus, but Hyginus' transmitted genealogy makes her a daughter of Jove and Clymene.
- Theia bears Helios, Selene and Eos to Hyperion in Hesiod and Pseudo-Apollodorus; Hyginus names Aethra as their mother.

## Expansion batch 6 — The younger Titans

The seven remaining figures in the standard second-generation Titan genealogy complete the two-generation Titan roster. They connect the newly restored elder houses to Delos and Hecate, the winds and stars, victory and force, dawn, sun and moon. The additions bring the live data set to 96 and the `titan` type to 25 characters, including Pseudo-Apollodorus' source-disputed Dione.

| id | Name | Greek name | Type | Domains |
|---|---|---|---|---|
| `asteria` | Asteria | Asteria (Ἀστερία) | titan | the island of Delos, motherhood of Hecate, escape from Zeus |
| `astraeus` | Astraeus | Astraios (Ἀστραῖος) | titan | stars, winds |
| `pallas` | Pallas | Pallas (Πάλλας) | titan | the lineage of victory, strength, force |
| `perses` | Perses | Persēs (Πέρσης) | titan | wisdom, the lineage of Hecate |
| `eos` | Eos | Ēōs (Ἠώς) | titan | dawn, morning light, the opening of heaven |
| `helios` | Helios | Hēlios (Ἥλιος) | titan | the sun, sight, oaths, the passage of day |
| `selene` | Selene | Selēnē (Σελήνη) | titan | the moon, night light, the lunar cycle |

Scope note: "all Titans" here means the standard first and second generations recoverable from Hesiod and Pseudo-Apollodorus, plus Dione where Pseudo-Apollodorus explicitly classifies her as a Titanis. It does not reclassify every divine descendant or every later figure occasionally called a Titan.

Batch boundary: Eurybia, Styx, Hecate, the winds, the individual stars and the children of Pallas are named in these stories but are not silently added as Titans. They belong to later source-verified divine-family batches.

## Zeus

- **Epithets**: Olympios, Keraunios, Xenios

Youngest child of Cronus and Rhea, Zeus escaped his father's stomach by a trick of his mother and a swaddled stone, then led his disgorged siblings to victory in the ten-year Titanomachy. As wielder of the thunderbolt and king of Olympus, he presides over sky, law, and hospitality, and fathers an enormous share of the Greek pantheon.

Key relations:

- parent → `cronus`
- parent → `rhea`
- consort → `hera`
- sibling → `poseidon`
- sibling → `hades`
- sibling → `demeter`
- sibling → `hestia`
- child → `athena` (born from Zeus' head after he swallowed Metis — Hesiod)
- child → `apollo`
- child → `artemis`
- child → `ares`
- child → `hermes`
- child → `dionysus`
- child → `persephone` (by Demeter)
- lover → `demeter`

Variant flags:

- Aphrodite's father: not Zeus (Hesiod, foam-born of Uranus) vs daughter of Zeus and Dione (Homer)
- Hephaestus' father: Zeus and Hera (Homer) vs Hera alone (Hesiod)
- Infancy hiding place: Crete's Mount Ida vs Dicte vs Arcadia, varying by source

## Hera

- **Epithets**: Boopis, Teleia, Argeia

Daughter of Cronus and Rhea, Hera is queen of Olympus and goddess of lawful marriage — an irony she defends fiercely against Zeus' endless infidelities. Her grudges drive whole epics, from her persecution of Heracles and Dionysus to her partisanship against Troy.

Key relations:

- parent → `cronus`
- parent → `rhea`
- consort → `zeus`
- sibling → `zeus`
- sibling → `poseidon`
- sibling → `hades`
- child → `ares`
- child → `hephaestus` (borne by Hera alone in Hesiod; son of Zeus and Hera in Homer)

Variant flags:

- Hephaestus' conception: parthenogenic, in rivalry over Athena's birth (Hesiod) vs fathered by Zeus (Homer)
- Ares' conception: by Zeus (standard) vs by a magic flower without Zeus (Ovid, Fasti, on Roman Mars)

## Poseidon

- **Epithets**: Ennosigaios, Hippios, Asphaleios

Trident-bearing son of Cronus and Rhea who drew the sea as his realm when the three brothers divided the cosmos. Earth-shaker and tamer of horses, he is as volatile as his element — patron of sailors, wrecker of Odysseus, and famously sore loser of Athens to Athena.

Key relations:

- parent → `cronus`
- parent → `rhea`
- sibling → `zeus`
- sibling → `hades`
- sibling → `hera`
- sibling → `demeter`
- sibling → `hestia`
- lover → `demeter` (pursued her as a mare; fathered the horse Arion and Despoina — Arcadian tradition)

Variant flags:

- Infancy: swallowed by Cronus (Hesiod) vs hidden by Rhea among a flock of lambs (Pausanias' Arcadian tradition) or raised by the Telchines on Rhodes (Diodorus)

## Demeter

- **Epithets**: Sito, Thesmophoros, Chloe

Goddess of grain and the cultivated earth, daughter of Cronus and Rhea. When Hades carried off her daughter Persephone, Demeter's grief withered the world's crops until Zeus brokered Persephone's partial return — the mythic root of the seasons and of the Eleusinian Mysteries.

Key relations:

- parent → `cronus`
- parent → `rhea`
- sibling → `zeus`
- sibling → `hera`
- sibling → `hestia`
- child → `persephone` (by Zeus)
- lover → `zeus`
- lover → `poseidon` (unwilling; as a mare in Arcadian myth)

Variant flags:

- Site of Persephone's abduction: Nysa (Homeric Hymn) vs Sicily (Ovid, Diodorus) vs Eleusis or Crete in local traditions

## Athena

- **Epithets**: Pallas, Glaukopis, Parthenos

Born in full armor from the head of Zeus after he swallowed her pregnant mother Metis, Athena embodies cunning intelligence and disciplined war. Patron of Athens, weaving, and heroes like Odysseus and Perseus, she is the grey-eyed strategist to Ares' berserker.

Key relations:

- parent → `zeus` (mother was the Oceanid Metis, swallowed by Zeus — Hesiod)

Variant flags:

- Birth: from Zeus' head after he swallowed Metis (Hesiod) vs motherless daughter of Zeus alone (some later accounts)
- Epithet Pallas: from a slain Giant Pallas vs an accidentally killed playmate, by source

## Apollo

- **Epithets**: Phoebus, Pythios, Loxias

Son of Zeus and the Titaness Leto, born on floating Delos with his twin Artemis. Apollo slew the serpent Python to claim Delphi, making him the voice of prophecy for the Greek world, while his lyre, healing arts, and far-shooting bow made him the very ideal of Greek divinity.

Key relations:

- parent → `zeus` (mother is the Titaness Leto)
- sibling → `artemis` (twin)

Variant flags:

- Solar identity: distinct from Helios in early sources vs conflated with the sun god from the fifth century BC onward
- Birthplace: Delos (Homeric Hymn) vs Lycia or Ortygia in rival local traditions

## Artemis

- **Epithets**: Agrotera, Potnia Theron, Cynthia

Virgin huntress and twin of Apollo, daughter of Zeus and Leto. Mistress of wild animals and protector of girls and women in childbirth, she is swift to punish trespass — Actaeon torn by his own hounds and Niobe's slaughtered children stand as warnings.

Key relations:

- parent → `zeus` (mother is the Titaness Leto)
- sibling → `apollo` (twin)

Variant flags:

- Birth order: born first and served as midwife at Apollo's birth (Apollodorus and others) vs unspecified
- Lunar identity: conflated with Selene only in later antiquity

## Ares

- **Epithets**: Enyalios, Brotoloigos, Chalkeos

Son of Zeus and Hera and god of war's raw carnage, Ares was feared by mortals and disliked even by his own father. Yet Aphrodite loved him: their affair, exposed when Hephaestus snared the couple in an unbreakable net, is one of Olympus' great scandals.

Key relations:

- parent → `zeus`
- parent → `hera`
- lover → `aphrodite`
- sibling → `hephaestus`

Variant flags:

- Conception: son of Zeus and Hera (Greek sources) vs conceived by Hera alone via a magic flower (Ovid's Fasti, of Mars)
- Eros' father: Ares with Aphrodite in later genealogies only

## Aphrodite

- **Epithets**: Cypris, Cytherea, Ourania

Goddess of love and irresistible desire, whose power bends gods and mortals alike. In Hesiod she rises full-grown from the sea-foam around Uranus' severed genitals near Cyprus; in Homer she is a daughter of Zeus and Dione — Greek myth's most famous genealogical dispute.

Key relations:

- parent → `uranus` (born from the foam around his severed genitals — Hesiod)
- parent → `zeus` (with Dione, in Homer's Iliad)
- consort → `hephaestus` (wife in the Odyssey; Hesiod gives Hephaestus the Charis Aglaia instead)
- lover → `ares`
- child → `eros` (only in post-Hesiodic tradition; in Hesiod Eros is primordial)

Variant flags:

- Parentage: born of Uranus' foam (Hesiod) vs daughter of Zeus and Dione (Homer)
- Marriage: wife of Hephaestus (Odyssey) vs Hephaestus weds Aglaia (Hesiod)
- Cult distinction: Aphrodite Ourania (heavenly) vs Pandemos (of all the people), per Plato's Symposium

## Hephaestus

- **Epithets**: Amphigyeeis, Kyllopodion, Klytotechnes

The lame smith-god whose forge produced Achilles' shield, Zeus' aegis, and Pandora herself. Cast from Olympus — by Hera for his lameness or by Zeus for taking Hera's side, depending on the teller — he returned to build the gods' palaces and snare his unfaithful wife Aphrodite in a net of his own making.

Key relations:

- parent → `hera` (borne by Hera alone — Hesiod)
- parent → `zeus` (father in Homer)
- consort → `aphrodite` (in the Odyssey)
- sibling → `ares`

Variant flags:

- Parentage: Hera alone (Hesiod) vs son of Zeus and Hera (Homer)
- Wife: a Charis (Iliad) vs Aphrodite (Odyssey) vs Aglaia (Hesiod)
- Fall from Olympus: thrown by Hera at birth (Homeric Hymn) vs by Zeus for defending Hera (Iliad)

## Hermes

- **Epithets**: Argeiphontes, Diaktoros, Psychopompos

Son of Zeus and the Pleiad Maia, born in an Arcadian cave — and by nightfall of his first day he had invented the lyre and rustled Apollo's cattle. Herald of the gods in winged sandals, he guides travelers, merchants, tricksters, and the souls of the dead across every boundary.

Key relations:

- parent → `zeus` (mother is the Pleiad Maia, daughter of Atlas)

Variant flags:

- Maternal line: grandson of Atlas through Maia, a link emphasized in the Homeric Hymn
- Syncretism: identified with Egyptian Thoth as Hermes Trismegistus in Hellenistic sources

## Hestia

- **Epithets**: Boulaia, Prytanitis

Firstborn of Cronus and Rhea — and so the first swallowed and last disgorged, making her "first and last" of the gods. Gentle keeper of the hearth who swore eternal virginity, refusing both Poseidon and Apollo, she received the first portion of every sacrifice yet appears in almost no myths: she simply stays home, which is precisely her power.

Key relations:

- parent → `cronus`
- parent → `rhea`
- sibling → `zeus`
- sibling → `hera`
- sibling → `demeter`
- sibling → `poseidon`
- sibling → `hades`

Variant flags:

- Olympian status: counted in the Twelve (Athenian agora altar) vs replaced by Dionysus (Parthenon east frieze); the "gave up her throne" story is modern, not ancient

## Dionysus

- **Epithets**: Bacchus, Bromios, Eleutherios

The twice-born god of wine: when his mortal mother Semele was incinerated by Zeus' unveiled glory, Zeus sewed the unborn child into his own thigh. God of intoxication, the mask, and liberating madness, he punishes those who deny him — as Pentheus of Thebes learned in pieces.

Key relations:

- parent → `zeus` (mother: the mortal Semele, incinerated by Zeus' glory — note required since Semele has no node; see review)
- parent → `persephone` (mother of his first incarnation Zagreus in the Orphic tradition only)

Variant flags:

- Mother: mortal Semele (standard tradition) vs Persephone, as the dismembered and reborn Zagreus (Orphic theogony)
- Olympian status: later tradition seats him among the Twelve in place of Hestia (Parthenon frieze)
- Birthplace Nysa: located everywhere from Thrace to India by different authors

## Hades

- **Epithets**: Plouton, Polydegmon, Klymenos

Eldest brother of Zeus and Poseidon who drew the unseen realm of the dead when the cosmos was divided. Stern but just rather than evil, he rarely leaves his kingdom — most famously to seize Persephone as his queen, with Zeus' quiet consent. Though a first-generation child of Cronus, he is conventionally excluded from the Twelve Olympians because he dwells below, not on Olympus.

Key relations:

- parent → `cronus`
- parent → `rhea`
- sibling → `zeus`
- sibling → `poseidon`
- sibling → `hera`
- sibling → `demeter`
- sibling → `hestia`
- consort → `persephone` (abducted with Zeus' sanction — Homeric Hymn to Demeter)

Variant flags:

- Olympian status: usually excluded from the canonical Twelve as ruler of the underworld, though some lists admit him
- Euphemistic cult name Plouton ("the wealthy") increasingly replaces the feared name Hades in classical sources

## Persephone

- **Epithets**: Kore, Despoina, Praxidike

Daughter of Zeus and Demeter, gathering flowers when the earth opened and Hades carried her below. Because she ate pomegranate seeds in the underworld, she must return there each year — maiden of spring above, dread queen of the dead below, and the dual heart of the Eleusinian Mysteries.

Key relations:

- parent → `zeus`
- parent → `demeter`
- consort → `hades`
- child → `dionysus` (as mother of Zagreus by Zeus, Orphic tradition only)

Variant flags:

- Underworld term: one third of the year (Homeric Hymn to Demeter) vs half the year (Ovid and later sources)
- Orphic tradition makes her mother of Dionysus-Zagreus by Zeus

## Chaos

- **Epithets**: none

In Hesiod's Theogony, Chaos is the very first thing to exist — not a swirl of disorder but a yawning gap or chasm from which Erebus and Nyx are born. Gaia, Tartarus, and Eros arise after Chaos but independently of it; only later authors make Chaos the literal ancestor of everything.

Key relations:

- child → `nyx` (Nyx and Erebus are born of Chaos — Hesiod)
- child → `gaia` (only in later authors such as Hyginus; in Hesiod Gaia arises independently after Chaos)

Variant flags:

- Nature: yawning void or chasm (Hesiod) vs confused primal matter (Ovid's Metamorphoses)
- Gaia's origin: independent of Chaos (Hesiod) vs child of Chaos (Hyginus' Fabulae preface)

## Gaia

- **Epithets**: Ge, Pammeter, Kourotrophos

The Earth herself, who arose just after Chaos and bore Uranus the sky, the mountains, and the sea without a partner, then mothered the Titans by Uranus. When he imprisoned her children inside her, she forged the sickle for Cronus' rebellion — and later turned against gods and grandsons alike, raising Typhon by Tartarus. The first oracle at Delphi was hers.

Key relations:

- child → `uranus` (borne by Gaia alone, "equal to herself" — Hesiod)
- consort → `uranus`
- child → `cronus`
- child → `rhea`
- child → `oceanus`
- lover → `tartarus` (by whom she bore the monster Typhon — Hesiod)

Variant flags:

- Origin: self-arising after Chaos (Hesiod) vs daughter of Chaos (Hyginus) vs offspring of Phanes/Nyx (Orphic theogonies)
- Typhon's mother: Gaia by Tartarus (Hesiod) vs Hera alone (Homeric Hymn to Apollo)

## Uranus

- **Epithets**: Akmonides

The starry sky, born of Gaia alone to cover her completely, and father by her of the Titans, Cyclopes, and Hundred-Handers. Hating his children, he shoved them back inside the Earth until Cronus castrated him with an adamantine sickle; from the blood sprang Giants and Furies, and from the sea-foam around the severed parts, Aphrodite.

Key relations:

- parent → `gaia` (born of Gaia without a father — Hesiod)
- consort → `gaia`
- child → `cronus`
- child → `rhea`
- child → `oceanus`
- child → `aphrodite` (sprang from the foam around his severed genitals — Hesiod)

Variant flags:

- Parentage: son of Gaia alone (Hesiod) vs son of Nyx (Orphic Eudemian theogony) vs son of Aether and Dies/Hemera (Cicero, Hyginus)

## Nyx

- **Epithets**: Melaina

Night, daughter of Chaos, who bore a brood of dark powers — Sleep, Death, the Fates, Strife, Doom — many of them by herself. So ancient and formidable is she that in the Iliad even Zeus holds back from angering her; in the earliest Orphic theogonies she, not Chaos, is the first principle of the cosmos.

Key relations:

- parent → `chaos`
- child → `uranus` (only in the Orphic Eudemian theogony, where Nyx is the first of all — cannot be source-tagged; see conventions)

Variant flags:

- Cosmic rank: daughter of Chaos (Hesiod) vs first principle of the universe (Orphic Eudemian theogony)
- Children borne alone vs with Erebus, varying by child and source

## Eros

- **Epithets**: Protogonos, Phanes (both Orphic, not Hesiodic — flagged to move into variant flags; see fix-notes)

In Hesiod, Eros is no winged cherub but one of the first four beings — alongside Chaos, Gaia, and Tartarus — the unbegotten force of attraction that makes all subsequent generation possible, "who unnerves the limbs and overcomes the mind" of gods and mortals alike. Only later poets demote him to Aphrodite's mischievous son, and the Orphics hatch him from a cosmic egg as shining Phanes.

Key relations:

- parent → `aphrodite` (only in post-Hesiodic tradition, often with Ares; in Hesiod Eros is primordial and unbegotten)

Variant flags:

- Origin: self-arisen primordial (Hesiod) vs son of Aphrodite and Ares (later poets) vs hatched from the cosmic egg as Phanes-Protogonos (Orphic theogony)

## Tartarus

- **Epithets**: none

The murky pit as far beneath Hades as heaven is above the earth — a bronze anvil would fall nine days to reach it. Both a place and a primordial being, Tartarus arose among the first four in Hesiod and fathered the monstrous Typhon upon Gaia; the defeated Titans were locked behind its bronze doors.

Key relations:

- lover → `gaia` (father of Typhon by Gaia — Hesiod)

Variant flags:

- Nature: primordial deity among the first four (Hesiod) vs purely a place of punishment (most later usage)
- Typhon's parentage: Tartarus and Gaia (Hesiod) vs Hera alone (Homeric Hymn to Apollo)

## Cronus

- **Epithets**: Ankylometes

Youngest and craftiest of the Titans, who castrated his father Uranus with a sickle and ruled the cosmos — only to swallow his own children one by one to dodge the same prophecy. Tricked by Rhea with a swaddled stone, he was overthrown by Zeus in the Titanomachy; his reign was nonetheless remembered as the Golden Age.

Key relations:

- parent → `uranus`
- parent → `gaia`
- consort → `rhea`
- sibling → `oceanus`
- child → `hestia`
- child → `demeter`
- child → `hera`
- child → `hades`
- child → `poseidon`
- child → `zeus`

Variant flags:

- Fate after defeat: imprisoned in Tartarus (Hesiod's Theogony) vs released to rule the Isles of the Blessed (Hesiod's Works and Days variant lines; Pindar)
- Identity: distinct from Chronos (Time) originally vs conflated with him in Orphic and later sources

## Rhea

- **Epithets**: Meter Theon

Titaness daughter of Uranus and Gaia, wife of Cronus, and mother of the six eldest Olympians. When Cronus swallowed each newborn, Rhea hid the infant Zeus in a Cretan cave and fed her husband a stone wrapped in swaddling clothes — the trick that ended the Titans' age.

Key relations:

- parent → `uranus`
- parent → `gaia`
- consort → `cronus`
- sibling → `oceanus`
- child → `hestia`
- child → `demeter`
- child → `hera`
- child → `hades`
- child → `poseidon`
- child → `zeus`

Variant flags:

- Syncretism: identified with the Phrygian mother-goddess Cybele in later sources
- Where Zeus was hidden: Mount Ida vs Mount Dicte on Crete vs Arcadia (Pausanias' local claims)

## Oceanus

- **Epithets**: none

Eldest of the Titans in Hesiod, the great river that rings the flat earth and feeds every spring, river, and well through his three thousand sons and three thousand Oceanid daughters by Tethys. A pacifist among Titans, he sat out both the castration of Uranus and the Titanomachy — and in Homer's Iliad he and Tethys are themselves called the origin of the gods.

Key relations:

- parent → `uranus`
- parent → `gaia`
- sibling → `cronus`
- sibling → `rhea`

Variant flags:

- Cosmic rank: eldest Titan son of Uranus and Gaia (Hesiod) vs primeval parent of the gods with Tethys (Homer, Iliad 14)
- Titanomachy: neutral, even sending his daughter Styx to aid Zeus (Hesiod); only Titan to abstain from attacking Uranus (Apollodorus)

## Prometheus

- **Epithets**: Pyrphoros, Desmotes

Son of the Titan Iapetus, "Forethought" tricked Zeus over the sacrificial portions at Mecone, then stole fire in a fennel stalk to give to humanity. For this Zeus chained him to a Caucasian crag where an eagle devoured his ever-regrowing liver, until Heracles shot the bird; later authors credit Prometheus with molding mankind itself from clay.

Key relations:

- sibling → `atlas` (both sons of the Titan Iapetus)

Variant flags:

- Mother: the Oceanid Clymene (Hesiod) vs Asia (Apollodorus) vs Themis, identified with Gaia (Aeschylus' Prometheus Bound)
- Creator of mankind from clay: present in Apollodorus, Ovid, and Pausanias but absent from Hesiod
- Release: freed by Heracles with Zeus' consent (Hesiod) vs holding the secret of Zeus' downfall as leverage (Aeschylus)

## Atlas

- **Epithets**: Telamon Ouranou (unverified — flagged to drop; see fix-notes)

Son of the Titan Iapetus and brother of Prometheus, condemned after the Titanomachy to stand at the western edge of the world holding up the sky for eternity. Heracles briefly shouldered the burden in exchange for the apples of the Hesperides, and in Ovid, Perseus turns the weary Titan to stone with the Gorgon's head, creating the Atlas Mountains. Through his daughter Maia, he is grandfather of Hermes.

Key relations:

- sibling → `prometheus` (both sons of the Titan Iapetus)

Variant flags:

- Mother: the Oceanid Clymene (Hesiod) vs Asia (Apollodorus)
- Fate: eternally bearing the heavens (Hesiod) vs petrified into Mount Atlas by Perseus (Ovid's Metamorphoses) — chronologically incompatible with the Heracles episode
- What he holds: the sky on his head and hands (Hesiod) vs the celestial spheres/globe (later art and rationalizing authors)
- Hesperides parentage: daughters of Nyx (Hesiod) vs daughters of Atlas (later, e.g. Diodorus) — do not state the Atlas parentage as fact

## Recommended roster additions (from review)

The adversarial review found four characters that are load-bearing for existing edges and should be ADDED:

- **Leto** (titan) — mother of two roster Olympians; already name-dropped in the parent notes of both Apollo and Artemis, so without her the twins have no mother edge. Highest-priority addition.
- **Iapetus** (titan) — Prometheus and Atlas both cite him in their sibling notes yet have zero parent relations; without him they float disconnected from the Uranus/Gaia genealogy.
- **Erebus** (primordial) — Chaos' relation note and Nyx's variant flag both depend on him; including Nyx without Erebus leaves Chaos' brood half-modeled.
- **Tethys** (titan) — Oceanus' summary and his Iliad-14 variant flag both depend on her, and the source-lens feature cannot re-wire the Homer variant without her node; she also anchors the Oceanid mothers (Metis, Clymene, Styx).

Scope note: these adds push the roster to 30 while PLAN.md pins M1 at 26. The review recommends raising the M1 cap to 30 (none of the current 26 is clearly droppable), or alternatively deferring Erebus and Tethys to M4 and recording the dangling references.

## Data-entry conventions

Distilled from the adversarial review. Follow these when entering or editing roster data.

1. **Relations are stored once, from the child/agent side, using type `parent`.** `RELATION_TYPES` in `src/types/character.ts` has no `child` type — a `Relation` has `from` = child side, `to` = parent side. Every `child` bullet in this document must be entered as a single `parent` record on the child's character. This also resolves mirroring: the schema stores one record per edge, so duplicated parent/child pairs collapse into single records and no asymmetry (e.g. Zeus listing some children but not others) can exist in the data layer.
2. **Sibling edges are for full siblings and twins only.** Full-sibling meshes (the six Cronus–Rhea children; Apollo–Artemis twins; Ares–Hephaestus) get sibling edges; half-siblings via Zeus (Athena, Apollo, Hermes, etc.) get none. This is a deliberate rule — do not "fix" it by adding half-sibling edges. Caveat: Ares–Hephaestus are full brothers only in Homer (half-brothers via Hera in Hesiod); their variant flags cover this.
3. **Incestuous couples carry BOTH consort and sibling edges.** Zeus–Hera and Cronus–Rhea each get a `consort` edge and a `sibling` edge. Known fixes implied by this rule and by rule 2: add Zeus sibling Hera; add Hera sibling Demeter and Hestia; add Demeter sibling Poseidon and Hades; add Cronus sibling Rhea and Rhea sibling Cronus.
4. **Add the succession-myth adversary/ally edges.** The schema defines `adversary` and `ally` but the draft uses neither. Add at minimum: Zeus adversary Cronus (Titanomachy), Cronus adversary Uranus (castration), Prometheus adversary Zeus (Mecone, fire theft, Caucasus), Oceanus ally Zeus (neutrality and sending Styx). Gaia's arc (ally of Zeus against Cronus, then adversary via Typhon) is also expressible.
5. **Orphic-only facts cannot be tagged to a source id.** `SOURCE_IDS` contains only the seven lens authors — no Orphic corpus. Orphic-only claims (Nyx as mother of Uranus, Persephone as mother of Dionysus-Zagreus, Eros' epithets Protogonos/Phanes) must live in prose or variant flags, not as source-tagged edges — or propose adding an `orphic` source id later. By contrast, Chaos→Gaia "Hyginus only" is fine: Hyginus IS a lens, and that edge is exactly what the lens system should re-wire.
6. **Fix-notes from review**:
   - Atlas' epithet "Telamon Ouranou" is unverified (reads as a modern art-historical coinage) — drop it; Atlas can stand with no epithets like Oceanus, Chaos, and Tartarus.
   - Atlas' summary must not state "the Hesperides — Atlas' own daughters" as fact; in Hesiod they are daughters of Nyx, the Atlas parentage is later (e.g. Diodorus). Soften the phrasing or add a variant flag.
   - Aphrodite's domain "the sea-foam" is an origin story, not a domain — replace with something she governs (e.g. "procreation" or "pleasure").
   - Standardize epithet transliteration to Greek throughout ("Phoibos" not "Phoebus"; "Kynthia" not "Cynthia") and put Latin forms in the `romanName` field the schema already provides.

## Open review notes

Remaining adjustments from the critique, not yet folded into data:

- Defer to M4 but record as known gaps: Helios (Apollo's entry flags the conflation but the sun god is absent), Hecate (prominent in Hesiod and in the Persephone abduction story), Metis (Athena's whole entry hinges on her), Selene, Themis, and Dione (Homeric mother of Aphrodite, currently note-only).
- Hades typed `god` is defensible, but the legend/UI must explain that `olympian` means a seat among the Twelve, not "child of Cronus" — otherwise his different glow color reads as a data error. Consider a distinct chthonic cluster value for Hades and Persephone (PLAN.md already envisions an underworld cluster near Hades/Nyx).
- With both Hestia and Dionysus typed `olympian`, the roster contains 13 Olympians — the right inclusive choice, but ensure no UI copy ever hard-codes "the Twelve".
- Eros' headline epithets Protogonos and Phanes are Orphic, not Hesiodic — move them into his variant flag (or tag to an Orphic source if one is added), since the entry is classified by its Hesiod-primary frame.
- Dionysus' only mother-edge is the Orphic-only Persephone one; add a note on his Zeus parent edge ("mother: the mortal Semele, incinerated by Zeus' glory") so the standard tradition stays visible without a Semele node.

## The Spartan / Lacedaemonian House — Batch A

The Laconian house, and the atlas's densest interlock. Researched as a full source-mapped dossier **before** entry — genealogy (Lelex → the Dioscuri), the same-name hazard map (`sparte` ≠ the city, `phoebe-leucippid` ≠ the Titan, `lynceus-apharetid` ≠ the Danaid), 12 contradiction topics and the A/B/C plan all live in **[docs/SPARTA_DYNASTY.md](SPARTA_DYNASTY.md)**.

Batch A = 14 figures (`lelex-laconia`, `myles`, `eurotas`, `sparte`, `lacedaemon`, `taygete`, `amyclas`, `cynortas`, `oebalus`, `tyndareus`, `leda`, `castor`, `polydeuces`, `hyacinthus`): the eponym chain, the Oebalus/Perieres seam, Tyndareus & Leda, and the Dioscuri. **It gives the long-parentless `helen` and `clytemnestra` their parents** (Tyndareus/Leda/Zeus, with the Leda↔Nemesis dispute), joins the Aeolid `perieres-aeolid`/`gorgophone` to the Laconian throne, threads `taygete` to `atlas`, binds `hyacinthus` to `apollo`, and sets the Dioscuri among `jason`'s Argonauts. Six documented contradictions (`eponym-generation-count`, `perieres-parentage`, `tyndareus-parentage`, `hyacinthus-parentage`, `helen-parentage`, `dioscuri-paternity`). Areas done: `data/lineages/sparta.json` + `residences:[{city:'sparta'}]`. Each figure ships the three-layer codex. Batches B (the Messenian Apharetids/Leucippids) and C (Icarius/Penelope + Hippocoontids) are deferred. 

Batch B/C = 15 figures (`aphareus`, `leucippus`, `idas`, `lynceus-apharetid`, `marpessa`, `arene`, `phoebe-leucippid`, `hilaira`, `arsinoe-leucippid`, `icarius`, `penelope`, `periboea-naiad`, `hippocoon`, `timandra`, `phylonoe`): the Messenian Apharetid/Leucippid wing (off the existing `perieres-aeolid`/`gorgophone`) and the Spartan Icarius/Hippocoon line. The Dioscuri carry off the Leucippides (`castor`↔`hilaira`, `polydeuces`↔`phoebe-leucippid`); `idas`→`castor` and `polydeuces`→`lynceus-apharetid` (the feud); `icarius`→`penelope`; the Tyndarid daughters `timandra`/`phylonoe` join the Leda-brood; the Apharetids sail with `jason`. Two documented contradictions (`marpessa-suitor`, `idas-parentage`). Sparta residences extended. **The Spartan house is complete (A+B+C = 29).** The bare Hippocoontid/Icariad catalogue names stay note-only. Each figure ships the three-layer codex.

## The Aeacid House — Batch A

The Greek spine of the Trojan War. Researched as a full source-mapped dossier **before** entry — genealogy (Asopus/Aegina → Aeacus → Telamon/Peleus → Achilles/Ajax), the same-name hazard map (`aegina-nymph` ≠ the geo region, `ajax-telamonian` ≠ the Locrian Ajax, `antigone-peleus` ≠ the Theban, `phocus-aeacid` ≠ the Corinthian) and the A/B/C plan all live in **[docs/AEACID_DYNASTY.md](AEACID_DYNASTY.md)**.

Batch A = 12 figures (`aegina-nymph`, `aeacus`, `endeis`, `psamathe`, `telamon`, `peleus`, `thetis`, `achilles`, `ajax-telamonian`, `teucer`, `phocus-aeacid`, `neoptolemus`): the Aeacid trunk. **Wired straight into the existing Trojan sky** — `achilles`→`hector`, `paris`→`achilles`, `neoptolemus`→`priam`, `ajax-telamonian`↔`hector`, `achilles`↔`agamemnon` (the wrath) — plus `aegina-nymph`→`asopus`/`zeus`, `telamon`→`hesione`→`teucer`, `eris` at Peleus' wedding, the Aeacids among `jason`'s Argonauts. One documented contradiction (`phocus-murder`); the invulnerable heel kept OUT as the late Statius accretion (Homer's Achilles is woundable). Each figure ships the three-layer codex. No lineage file (Aegina/Salamis/Phthia are regions, not flagship cities). Batches B (Asopid eponyms + the Phocis line) and C (Peleus' Phthian household + Patroclus/Chiron/Deidamia) are deferred. 

Batch B/C = 13 figures (`metope`, `thebe`, `salamis-nymph`, `corcyra`, `crisus`, `panopeus`, `epeius`, `eurytion`, `antigone-peleus`, `polydora`, `patroclus`, `chiron`, `deidamia`): the Asopid eponym sisters (joining the existing `aegina-nymph`), the Phocis line (Phocus → Crisus/Panopeus → `epeius` the Wooden-Horse builder), and Achilles' circle. New interlocks: `hector`→`patroclus` (the death that breaks Achilles' wrath), `chiron`→`peleus`/`achilles`/`jason` (the tutor of heroes), `deidamia`→`neoptolemus`, `peleus`→`eurytion` (the Calydon accident), and `thebe`→`zethus` (a bridge to the Theban house). **The Aeacid house is complete (A+B+C = 25).** Each figure ships the three-layer codex.

## The Calydonian / Aetolian House — Batch A

The Aetolian hinge of the heroic age. Researched as a full source-mapped dossier **before** entry — genealogy (Aetolus → Pleuron/Calydon → Oeneus → Meleager/Tydeus → Diomedes), the same-name hazard map (`agenor-aetolian` ≠ the Phoenician `agenor`, `periboea-oeneus` ≠ `periboea-naiad`, `cleopatra-meleager` ≠ `cleopatra-boreas`, the Argive `diomedes` ≠ Diomedes of Thrace), eight contradiction topics and the A/B/C plan all live in **[docs/CALYDON_DYNASTY.md](CALYDON_DYNASTY.md)**.

Batch A = 14 figures (`pleuron`, `calydon`, `agenor-aetolian`, `porthaon`, `oeneus`, `althaea`, `thestius`, `meleager`, `atalanta`, `tydeus`, `diomedes`, `deipyle`, `deianira`, `gorge`): the Calydonian spine. Hangs off the existing root `aetolus` (the Aeolid son of Endymion) via the city-eponyms Pleuron and Calydon, and **bridges Calydon to Sparta — it gives the parentless `leda` her father `thestius`**, who fathers both Althaea of Calydon and Leda of Sparta (`althaea`↔`leda` are sisters). Wires the Iliad/Theban membrane: `diomedes`→`aphrodite`/`ares` (the Iliad-5 woundings), `tydeus`→`polynices` (the Seven against Thebes), `artemis`→`oeneus` (the slighted sacrifice that looses the boar), `dionysus`→`oeneus` (the gift of the vine, whence *oinos*), `althaea`→`meleager` (the brand burned in revenge for her brothers), `meleager` lover of `atalanta` and among `jason`'s Argonauts. Three documented contradictions model the divine-paternity forks as competing topic-tagged edges: `meleager-father` (Oeneus↔Ares), `deianira-parentage` (Oeneus↔Dionysus), `thestius-parentage` (Ares↔Agenor); the rest (`meleager-death`, `tydeus-mother`, `atalanta-parentage`, `porthaon-offspring`, `tydeus-immortality-lost`) stay in sourced prose. Atalanta is typed `hero` and enters here as the boar-hunt guest; her full Arcadian saga (footrace, golden apples) is a later batch. No lineage file/residences (Calydon and Pleuron are regions, not flagship cities). Each figure ships the three-layer codex (sourced mythology + Wikipedia-section reference + Legacy gallery of verified Wikimedia Commons artworks). Batches B (the Thestiads + inner circle) and C (collateral Aetolians + Achelous) are deferred.

Batch B/C = 6 figures (`iphiclus-thestiad`, `plexippus-thestiad`, `cleopatra-meleager`, `periboea-oeneus`, `agrius-aetolian`, `achelous`): the Thestiads, Meleager's inner circle, and the river-god. The two sons of Thestius complete the **Thestiad sibling clique** alongside the existing `althaea`/`leda` (one quartet of Eurythemis' children); `iphiclus-thestiad` sails with `jason` (the maternal uncle on the Argo), while `plexippus-thestiad` is the uncle `meleager` slays in the boar-hide quarrel (the `slayer` edge). `cleopatra-meleager` (Homer's Cleopatra, surnamed Alcyone) is Meleager's wedded wife, daughter of the existing `idas`/`marpessa` — wiring the Calydon house to the Apharetids. `periboea-oeneus` is Oeneus' second wife and the dominant mother of Tydeus, against whom the **`tydeus-mother`** contradiction sets the incest variant (Tydeus by Oeneus on his own daughter `gorge`, which Apollodorus credits to Peisander). `agrius-aetolian` is Oeneus' brother who (with his sons) usurps Calydon, until `diomedes` returns to restore the house — two `adversary` edges. `achelous`, the great river-god, enters as a son of `oceanus`/`tethys` (Hesiod's river-catalogue); his Calydon tie — the wrestling-match with Heracles for Deianira, the broken horn that becomes the cornucopia — is rich prose (Heracles is not a node). **The Calydonian house is complete (A + B/C = 20).** The collateral Aetolians Melas and Andraemon stay note-only. Homonym-prone ids were suffixed defensively (`plexippus-thestiad` ≠ Phineus' son Plexippus; `agrius-aetolian` ≠ the Giant Agrius, the centaur, or Odysseus' son). Each figure ships the three-layer codex.

## The Theban / Cadmean House — completion

The Theban house was built into the atlas incrementally **before** a dossier (34 nodes, a Thebes city node, `data/lineages/thebes.json`, and 32 residents already present). The **completion audit** — what existed, the verified gaps, the same-name hazard map (`hyperenor-spartos` ≠ the Trojan Hyperenor; `laodamas-theban` ≠ the Phaeacian Laodamas; `chthonius-spartos` ≠ the Giant Chthonius) and the collision list — lives in **[docs/THEBES_DYNASTY.md](THEBES_DYNASTY.md)**.

Completion batch = 8 figures (`actaeon`, `aristaeus`, `chthonius-spartos`, `hyperenor-spartos`, `pelorus-spartos`, `nycteis`, `thersander`, `laodamas-theban`). It closes four gaps. **Actaeon** is the fourth of Cadmus' grandchild-tragedies — Pentheus (the madness), Ino (the leap), and Semele (the lightning) were all present; the hunter torn by his own hounds was conspicuously absent — and his father **Aristaeus** (the rustic culture-god, son of Apollo and Cyrene) completes Autonoe's branch. The three missing **Spartoi** finish Apollodorus' canonical five Sown Men (`echion`/`udaeus` were already nodes); among them `chthonius-spartos` is, in Apollodorus 3.5.5, the father of the previously parentless `nycteus` and `lycus` — so the Sown Man becomes genealogically load-bearing. **Nycteis** fills Polydorus' missing marriage and Labdacus' missing mother, carrying the Cadmean line into the Labdacid kings. **Thersander** (son of Polynices) and **Laodamas** (son of Eteocles) promote the last two named lineage rulers and open the **Epigoni war**: Thersander and the existing `diomedes` (a Calydonian who was also an Epigonos) against the Theban king Laodamas. No new contradictions — Actaeon's offense (he saw Artemis bathing, or boasted to outhunt her, or wooed Semele) is a narrated multi-variant, and Laodamas' fate (slain by Alcmaeon vs the night-flight to the Encheleans) stays prose. Residences set to Thebes for the new Thebans (Aristaeus, a pan-Hellenic god, excepted), so they populate the Thebes city-sky. The bare Spartoi were given short, honest entries (the sowing, the mutual slaughter, the five survivors — no invented individual deeds). **The Cadmean house is complete.** Each figure ships the three-layer codex.

## The Arcadian House — Batch A

The wild highland and the atlas's third autochthony (beside the Argive Phoroneus and the Attic Cecropids). Researched branch-by-branch as a full source-mapped dossier **before** entry — the genealogy (Pelasgus → Lycaon → Callisto → Arcas → the three branches → the Tegean line), the same-name hazard map and the live id-collisions (`clymene` the Oceanid ≠ Atalanta's mother `clymene-minyas`; `pallas`/`pallas-pandionid` ≠ the Lycaonid `pallas-lycaonid`; the Arcadian `lycurgus-arcadia`/`cepheus-tegea`/`ancaeus-arcadian` ≠ their famous namesakes) and the A/B/C plan live in **[docs/ARCADIA_DYNASTY.md](ARCADIA_DYNASTY.md)** (Pausanias Book 8 the master source).

Batch A = 10 figures (`pelasgus-arcadia`, `lycaon`, `callisto`, `nyctimus`, `arcas`, `maia`, `pan`, `azan`, `apheidas`, `elatus-arcadia`): the Pelasgid root, the bear and the eponym, and the divine anchors. **Pelasgus** the autochthon invents huts, sheepskins, and the acorn diet; his son **Lycaon** serves Zeus human flesh and is made a wolf, his impiety bringing the flood (`lycaon` adversary `zeus`); Lycaon's daughter **Callisto**, Artemis' huntress, bears **Arcas** to Zeus and is turned into the Great Bear (`artemis` adversary `callisto`; the transformer — Hera/Artemis/Zeus — and her four rival fathers stay sourced prose). **Arcas** the eponym is reared by the Pleiad **Maia**, who — daughter of the existing `atlas` — **gives the standing `hermes` node his mother** (and Zeus his lover); the goat-god **Pan** hangs off Hermes. The three sons of Arcas by the Dryad Erato — **Azan**, **Apheidas** (→ the Tegean line), **Elatus** (→ the Elatid five and Phocis) — found the branches Batch B will fill. No new contradictions (the parentage/footrace forks arrive with Atalanta in Batch C). Arcadia is a region, not a flagship city — no lineage/residences. Each figure ships the three-layer codex. Batches B (the three branches & the Tegean house of Aleus) and C (Atalanta's completed saga + Auge/Telephus) are deferred.

## The Arcadian House — Batch B

The three branches of Arcas and the Tegean line of Aleus — see the full dossier in **[docs/ARCADIA_DYNASTY.md](ARCADIA_DYNASTY.md)**. Batch B = 13 figures (`erato-dryad`, `cleitor`, `stymphalus-arcadian`, `aepytus-elatid`, `cyllen`, `pereus`, `ischys-elatid`, `aleus`, `cepheus-tegea`, `lycurgus-arcadia`, `amphidamas-arcadia`, `ancaeus-arcadian`, `epochus`). The Dryad **Erato** is Arcas' wife and so gives the Batch-A branch-founders Azan/Apheidas/Elatus their mother (against Apollodorus' rival Leanira/Meganira/Chrysopelia, narrated). Azan's line gives the city-founder **Cleitor**; Elatus' five sons include the eponyms **Stymphalus** (whom `pelops` treacherously slew and dismembered) and **Cyllen** (of Mt. Cyllene), and **Ischys** (the Coronis-lover whose killer — Zeus' bolt or Apollo's arrows — stays a sourced prose dispute, the Lapith-Elatus homonym flagged). Apheidas' son **Aleus** founds the Tegean house and the cult of Athena Alea; his sons **Cepheus** and **Lycurgus** and the Argonaut **Amphidamas** sail with `jason`, and Lycurgus' son **Ancaeus** — the double-axe Argonaut — is gored by the Calydonian boar. One documented contradiction: **`amphidamas-generation`** (son of Aleus per Pausanias/Apollonius vs son of Lycurgus per Apollodorus), modeled as competing parent edges. Each figure ships the three-layer codex; the minor branch figures (Erato, Cleitor, the lesser Elatids) carry honest short entries with empty Legacy galleries where no genuine art exists. Batch C (Atalanta's completed saga + Auge/Telephus) remains.

## The Arcadian House — Batch C (Atalanta's saga; house complete)

The completion of the Arcadian house — see the dossier in **[docs/ARCADIA_DYNASTY.md](ARCADIA_DYNASTY.md)**. Batch C = 10 new figures + the long-deferred completion of the existing **`atalanta`**. Atalanta entered the atlas with the Aetolian house as the bare Calydonian boar-hunt guest; here her myth is recomposed to the full Arcadian saga — exposed and suckled by a she-bear, the centaurs Rhoecus and Hylaeus shot down, first blood at the boar, the deadly golden-apple footrace, the lions, and her son Parthenopaeus — while her Information reference and Legacy gallery are preserved untouched. The new figures supply her family and the disputes: **Iasus** (son of Lycurgus) and **Clymene** daughter of Minyas (`clymene-minyas`, kept strictly distinct from the existing Oceanid `clymene`) are her Arcadian parents; **Schoeneus** — himself a son of the existing Aeolid **Athamas**, a cross-house bridge — is her Boeotian father; **Melanion** (son of the Tegean Amphidamas) and **Hippomenes** (son of Megareus) are the rival apple-race winners; **Parthenopaeus** is her son, one of the Seven against Thebes. The Aleid line is closed with **Auge** (Aleus' daughter, priestess of Athena Alea) and her son **Telephus** (king of Mysia, wounded then healed by Achilles' spear), the Tegean champion **Echemus** (who slew Hyllus and married the Spartan `timandra`), and **Agapenor** (son of Ancaeus, leader of the Arcadians at Troy under Agamemnon's lent ships, later founder of Paphos). Three documented contradictions land here as competing edges: **`atalanta-parentage`** (Iasus↔Schoeneus), **`atalanta-husband`** (Melanion↔Hippomenes), and **`parthenopaeus-father`** (Melanion↔Ares↔Meleager). The Euripidean third father Maenalus, and Telephus' father Heracles (a boundary frame until a Heracles batch), stay sourced prose. Each new figure ships the three-layer codex; `echemus`/`agapenor` carry honest empty Legacy galleries where no genuine solo art exists. **The Arcadian house is complete (A + B + C = 33 new figures + Atalanta completed).**

## The Monster Genealogy — Batch A (the bestiary opens)

The atlas's long-missing chthonic quarter — the Hesiodic monster catalogue (Theogony 233–336). Researched branch-by-branch as a full dossier **before** entry — the genealogy (Pontus → Phorcys/Ceto → the Gorgons/Graeae/Echidna/Ladon; Gaia/Tartarus → Typhon → the labour-beasts), the same-name hazard map (`scylla-monster` ≠ `scylla-nisus`; the sea-goddess `ceto` ≠ the Nereid; the Gorgon `medusa`/`euryale` ≠ their mortal namesakes; the dragon `ladon` ≠ the Arcadian river) and the A/B/C plan live in **[docs/MONSTERS.md](MONSTERS.md)**.

Batch A = 11 figures (`pontus`, `phorcys`, `ceto`, `nereus`, `thaumas`, `medusa`, `stheno`, `euryale`, `graeae`, `pegasus`, `chrysaor`): the sea-roots, the Gorgons, the Graeae, and Medusa's foals. **Pontus** the Sea, born of Gaia alone, fathers by her the sea-gods **Nereus** (the kindly Old Man of the Sea — whose daughter is the existing Nereid `thetis`, now given her father), **Thaumas** (sire of the Harpies, Batch C), and the monster-parents **Phorcys** and **Ceto**. Of Phorcys and Ceto come the grey **Graeae** (a single collective node, one eye between them, robbed by Perseus) and the three **Gorgons** — immortal **Stheno** and **Euryale** and mortal **Medusa**, who lay with `poseidon` and, beheaded by `perseus`, brought forth the winged horse **Pegasus** (rider: the existing `bellerophon`) and the golden-sword **Chrysaor**. Seated in the new **`chthonic`** cluster (the dark band below the disc; Pontus alone in `core`), the first heavy use of that quarter — `validate-layout` confirms the band preserves generation order, parents inside descendants. No new contradictions (the Graeae's two-vs-three count and Medusa's by-birth Gorgon-hood stay sourced prose; the parentage forks come with Echidna and Typhon in Batch B). Each figure ships the three-layer codex. Batches B (Echidna, Typhon & the brood) and C (the standalone sea-monsters) follow.

## The Monster Genealogy — Batch B (Echidna, Typhon & the brood)

The dark heart of the bestiary — see the dossier in **[docs/MONSTERS.md](MONSTERS.md)**. Batch B = 10 figures (`echidna`, `typhon`, `orthrus`, `cerberus`, `hydra`, `chimera`, `nemean-lion`, `ladon`, `geryon`, `python`). The storm-giant **Typhon** — son of Gaia and Tartarus, who warred on `zeus` for the throne and was pinned under Etna — mates with **Echidna**, the cave-dwelling "mother of monsters," to sire the brood the heroes must unmake: the two-headed **Orthrus**, the hound of Hades **Cerberus**, the **Lernaean Hydra**, and the fire-breathing **Chimera** (slain by the existing `bellerophon` on `pegasus`). The **Nemean Lion** and — crucially — the already-standing Theban **`sphinx`** are wired into the line, and the apple-dragon **Ladon**, three-bodied **Geryon** (son of `chrysaor`), and the Delphic **Python** (slain by `apollo`) complete the batch. Five documented contradictions trace the brood's tangled descent: **`echidna-parentage`** (Phorcys/Ceto per Hesiod vs Tartarus/Gaia per Apollodorus), **`ladon-parentage`** (the sea-line vs the Typhon-brood), **`chimera-parentage`** (mother Echidna vs the Hydra), **`nemean-lion-parentage`** (Orthrus/Echidna vs Typhon vs the Moon), and **`sphinx-parentage`** (Orthrus vs Typhon, mother Echidna shared) — the last reaching back to fill the parentless Theban Sphinx. Cerberus' fifty-vs-three heads, the Nemean Lion's lunar fall, and the famous Heracles labour-kills (Hydra, Nemean Lion, Cerberus, Geryon, Ladon, Orthrus) stay sourced prose, awaiting a Heracles batch to wire the slayings. All sit in the `chthonic` band; each ships the three-layer codex. Batch C (the standalone sea-monsters — Scylla, Charybdis, the Harpies, the Sirens, Cetus) completes the bestiary.

## The Monster Genealogy — Batch C (the bestiary complete)

The standalone sea-monsters that close the bestiary — see the dossier in **[docs/MONSTERS.md](MONSTERS.md)**. Batch C = 5 figures (`scylla-monster`, `charybdis`, `harpies`, `sirens`, `cetus`). **Scylla** the six-headed cliff-monster (kept strictly distinct from the existing Megarian `scylla-nisus`) and her counterpart **Charybdis** the whirlpool guard the strait; **Scylla's parentage** is the batch's one documented contradiction (`scylla-parentage`: Phorcys per Apollodorus/Apollonius vs Typhon per Hyginus; the Crataeis/Hecate mother and Ovid's "made-not-born" Glaucus/Circe variant stay prose). The **Harpies** are wired to their father `thaumas` (Batch A) and as adversaries of the Boreads `zetes`/`calais` (the rescue of blind Phineus); the **Sirens** to their father `achelous` (promoted from the prose of the Calydon batch). **Cetus**, the sea-beast Poseidon sent against Aethiopia, is wired to `perseus` who slew it to free Andromeda. Charybdis alone stands without a parent edge (no parentage is attested in the seven sources). All sit in the `chthonic` band; each ships the three-layer codex. **The monster genealogy is complete (A + B + C = 26 new figures), and the bestiary — long the atlas's emptiest type — now fills its own chthonic quarter (creatures 6 → 26).**

## The House of Heracles — Batch A (the Perseid bridge & the birth)

The keystone hero enters — see the dossier in **[docs/HERACLES_DYNASTY.md](HERACLES_DYNASTY.md)**. Batch A = 12 figures (`heracles`, `alcmene`, `amphitryon`, `iphicles`, `iolaus`, `electryon`, `alcaeus-perseid`, `sthenelus-perseid`, `mestor-perseid`, `perses-perseid`, `eurystheus`, `licymnius`). The five Perseid sons of the existing `perseus`/`andromeda` (joining their sister `gorgophone`) carry the line down two branches that meet in Heracles: through **Electryon** to **Alcmene**, and through **Alcaeus** to **Amphitryon**, the cousins who wed. In a threefold night Zeus, in Amphitryon's shape, fathers **Heracles**, while Amphitryon fathers the mortal twin **Iphicles** — the cardinal **`heracles-father`** dispute (Zeus vs Amphitryon, mother Alcmene undisputed); the infant strangles Hera's cradle-serpents. **Iolaus** (Iphicles' son) is the charioteer-companion; **Eurystheus** (son of **Sthenelus**), rushed to birth by Hera ahead of Heracles, gains Mycenae and so the power to impose the Labours; **Licymnius** is the lone surviving Electryonid. Homonyms suffixed: `sthenelus-perseid`/`alcaeus-perseid`/`mestor-perseid`/`perses-perseid` (≠ the Titan Perses, the Epigonos Sthenelus) and `iphicles` (≠ the Aetolian `iphiclus-thestiad`). Each ships the three-layer codex. Batch B (the Twelve Labours — finally giving the chthonic bestiary its hunter) and Batch C (wives, death on Oeta, apotheosis, the Heraclids) follow.

## The House of Heracles — Batch B (the Twelve Labours)

The Labours wired at last — see **[docs/HERACLES_DYNASTY.md](HERACLES_DYNASTY.md)**. Batch B = 6 new foes (`augeas`, `diomedes-thrace`, `hippolyta`, `erymanthian-boar`, `ceryneian-hind`, `stymphalian-birds`) plus the edges that finally connect the chthonic bestiary to its hunter. `heracles` is now slayer of the Nemean Lion, the Lernaean Hydra, Geryon (and his hound Orthrus), the apple-dragon Ladon, the Stymphalian Birds, Diomedes of Thrace (fed to his own mares) and Hippolyta (for the belt of Ares), and the killer of Augeas in the war over the unpaid wage; and adversary/captor of the Ceryneian Hind, the Erymanthian Boar, the Cretan Bull, and Cerberus (dragged up from Hades) — with `heracles` adversary `eurystheus`, the taskmaster who set them. One documented contradiction (`augeas-father`: Helios the Sun vs Poseidon, with Phorbas/Eleius in prose; `diomedes-thrace` and `hippolyta` are children of `ares`). The labour-beasts carry no genealogy in the seven sources, as the dossier notes. Each ships the three-layer codex. Batch C (wives, the death on Oeta, the apotheosis, and the eldest Heraclids) completes the house.

## The House of Heracles — Batch C (wives, the death on Oeta, the apotheosis; house complete)

The hero's life and line closed — see **[docs/HERACLES_DYNASTY.md](HERACLES_DYNASTY.md)**. Batch C = 10 figures (`megara`, `omphale`, `iole`, `eurytus-oechalia`, `nessus`, `pholus`, `philoctetes`, `hebe`, `hyllus`, `macaria`). **Megara** (eldest daughter of the existing `creon`) is the first wife whose children Heracles slays in madness — her own fate disputed in prose (slain per Hyginus vs given to Iolaus per Apollodorus); **Omphale** the Lydian queen he serves; **Iole**, daughter of the archer-king **Eurytus** of Oechalia, the cause, through Deianira's fear, of his death. The centaur **Nessus** — whom Heracles shoots, and whose poisoned blood on the shirt kills him in return (a mutual `slayer` pair) — and the hospitable **Pholus**; **Philoctetes**, who lit the pyre on Oeta and took the bow; **Hebe**, the goddess of youth wedded to the deified Heracles; and the eldest Heraclids **Hyllus** (slain by the Tegean `echemus` in the duel that stays the Return) and **Macaria** (the willing sacrifice). The batch **closes the atlas's standing hooks**: `deianira` gets her consort, `auge` her lover and `telephus` his father Heracles (the Arcadia tie), and `echemus` his victim Hyllus (the Sparta/Tegea tie). One documented contradiction (`eurystheus-slayer`: Hyllus per Apollodorus vs the rejuvenated Iolaus per Pausanias). Mixed clusters (Hebe `olympian-band`, the centaurs `creature`/`mortal-arm`); each ships the three-layer codex. **The House of Heracles is complete (A+B+C = 28 figures).** The Dorian Return (Temenus/Cresphontes/Aristodemus, the Spartan/Messenian/Argive royal lines) remains a deferred later batch.
