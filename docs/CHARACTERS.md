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
