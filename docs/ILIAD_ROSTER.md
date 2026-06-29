# The Iliad Roster — Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus-first), 2026-06-16. **Batch A (7)** — Wrath spine. **Batch B (5)** — night raid. **Batch C (3)** — Cretan & Locrian Ajax. **Batch D (4)** — Trojan counsel. **Batch E (2)** — Lycian membrane. **Batch F (5)** — Boeotian captains. **Batch G (4)** — Minyan & Phocian captains. **Batch H (4)** — Epeian captains. **Batch I (5)** — Halizones, Magnetes & Lapiths. **Batch J (5)** — Cyphus, Paphlagonians & Mysians. **Batch K (5)** — Phrygians, Maeonians & Carians. **Batch L (5)** — Paeonians, Pelasgians & Thracians. **Batch M (5)** — Cicones, Dardanian princes & Asius. **Batch N (5)** — Merops' sons, Antenor's third son, Alcathous & Medon. **Batch O (5)** — Iasus, rally captains & Book 15 deaths. **Batch P (5)** — Echius, Polites, Chroraius & Paeonian rout. **Batch Q (5)** — Alastor & Scamander Paeonians. **Batch R (5)** — Ophelestes, Priam's sons & ransom roll. **Batch S (5)** — Teucer victims, Hippothous & Hicetaon's Melanippus. **Batch T (5)** — Teucer roll complete & Chromius homonyms. **Batch U (5)** — Echemmon, Chromius homonyms & Nestor's Pylians. **Batch V (5)** — Nestor's company complete & Lycian rout. **Batch W (5)** — Lycian rout complete, Coeranus & Podarces. **Batch X (5)** — Protesilaus, Athenians, Euphorbus & battle roll. **Batch Y (5)** — Athenian & Epeian captains, Cleitus & Croesmus. **Batch Z (5)** — Agamemnon's Book 11 roll & Dolops. **Batch AA (5)** — Deïopites, Socus, Dolops homonym & Phaenops' sons. **Batch AB (5)** — Hector's Danaan roll (first five). **Batch AC (5)** — Hector's roll complete & homonyms. **Batch AD (5)** — Book 6 Euryalus victims & Patroclus roll (first three). **Batch AE (6)** — Patroclus roll complete. **Batch AF (5)** — Book 6 ransom, *Iliad* 20 homonyms & Priam stemma. **Batch AG (5)** — Mulius homonym complete & *Iliad* 20 rout (first three). **Batch AH (5)** — *Iliad* 20–21 rout & Megas. **Batch AI (5)** — *Iliad* 16 Laogonus & *Iliad* 20 rout (first four). **Batch AJ (5)** — *Iliad* 20 parent nodes & Pandarus' Lycaon. **Batch AK (5)** — Catalog parents & *Iliad* 4 Thracians. **Batch AL (5)** — Hyginus Boeotian parents & Trojan elders. **Batch AM (6)** — Trojan parent nodes & Antimachus' sons. **Batch AN (5)** — Hippasus' third son, Hicetaon, Polyaemon, Mentor & Medesicaste. **Batch AO (5)** — Scaean Gate elders & catalog parents. **Batch AP (5)** — Catalog parents & Antimachus' third son. **Batch AQ (5)** — Epeian & Phrygian catalog parents. **Batch AR (5)** — Catalog parents & Lapith stemma. **Batch AS (5)** — Remaining catalog parents. **Batch AT (7)** — Pelasgian, Epeian & allied parent nodes. **Batch AU (6)** — Athenian, Phthian, Trojan & Dardanian parent nodes. **Batch AV (5)** — Anchises' daughter, Oileus' household & Bucolion stemma. **Batch AW (8)** — Hecuba stemma & Apollodorus Priam sons. **Batch AX (5)** — Minyan, Nestor's hut & Paeonian parent nodes. **Batch AY (5)** — Paeonian river & Bellerophon Lycian stemma.
>
> Scope: every named figure in Homer's *Iliad*, entered in verified batches. This dossier is **book/contingent–indexed**, not dynasty-indexed — the complement to the Odyssey/Ithaca track the other agents are running. The Trojan royal house, Aeacids, Pelopids, Calydonians and Olympians are already in the sky; this roster fills the long tail.

## 1. Why this track needs a dossier

1. **The war is half-modeled; the cast is not.** `data/stories/trojan-war.json` names Achilles, Patroclus and Odysseus without `id` links; dozens of Iliadic figures who drive the plot (Briseis, Chryseis, Phoenix, Thersites, the heralds) are still absent.
2. **Homonym density is extreme.** Three Glaucuses, two Ajaxes, two Phoenixes, two Chryseses, two Thoases, multiple Hyperenors — every new entry must be collision-checked against `data/characters/` before writing.
3. **The Catalog of Ships alone names ~170 leaders** (Il. 2.494–877). A single bulk import would violate the incremental-data rule; batches of 7–20 keep validation and layout reviewable.
4. **Source boundaries are sharp.** In scope: everything Homer names in the *Iliad*. Out of scope until a later "Epic Cycle" milestone: Memnon, Penthesilea, the death of Achilles at the Scaean Gate (post-*Iliad* Aethiopis), Statius' invulnerable heel.

## 2. Evidence policy

| Source id | Material |
|---|---|
| `homer` | Primary — the whole *Iliad*; every Batch A figure is Homer-attested |
| `apollodorus` | Stemmas, Epic Epitome summaries, Phoenix's backstory (Bibl. 3.13.8), Thersites son of Agrius (Bibl. 1.8.6) |
| `hyginus` | Variant parentages (Briseis daughter of Brisa, Fab. 106), catalogues |
| `pausanias` | Thersites on the Cypselus chest (10.31.1) |
| `ovid`, `apollonius` | Secondary colour only where the *Iliad* figure also appears outside Homer |

Out of scope (research-only): the Epic Cycle (*Cypria*, *Aethiopis*, *Little Iliad*); the Hesiodic *Catalogue of Women* genealogies; Euripides; scholia-only figures with no ancient-author sentence.

## 3. Same-name hazard map

| Name | Distinct entities | Correct id |
|---|---|---|
| **Phoenix** | Achilles' Myrmidon tutor (Hom. *Il.* 9) vs Phoenician eponym, son of Agenor (`phoenix`) | `phoenix-myrmidon` |
| **Chryses** | Apollo's priest at Chryse (*Il.* 1) vs son of Minos on Paros (`chryses-paros`) | `chryses-apollo` |
| **Chryseis** | Agamemnon's prize, daughter of Chryses (*Il.* 1) vs Oceanid in Hesiod (*Theog.* 356) vs wife-names in Apollodorus 2.7.8 | `chryseis` (Homer only; never merge with the Oceanid) |
| **Glaucus** | Lycian captain (*Il.* 6) vs Corinthian king (`glaucus-corinth`) vs Ithacan (`glaucus-dulichium`) | `glaucus-lycian` |
| **Pandarus** | Archer of Zeleia (*Il.* 4–5); father Lycaon (`lycaon-pandarusid`) | `pandarus` |
| **Ajax** | Telamonian (`ajax-telamonian`) vs Oileus' son (*Il.* 2.527 ff.) | `ajax-oileus` |
| **Deucalion** | Flood-survivor (`deucalion`) vs Cretan Argonaut (`deucalion-crete`) vs Trojan slain by Achilles (`deucalion-trojan`) | suffixed per context |
| **Thoas** | Aetolian captain (`thoas-aetolia`) vs Lemnian king (`thoas-lemnos`) vs Dulichian suitor (`thoas-dulichium`) | already disambiguated |
| **Thersites** | Homer's railer (*Il.* 2) vs son of Agrius in Calydon (*Bibl.* 1.8.6) — traditionally identified as one man | `thersites` |
| **Hyperenor** | Trojan (*Il.* 13–17) vs Spartos (`hyperenor-spartos`) vs Samian (`hyperenor-same`) | suffix per house |
| **Helenus** | Trojan seer (`helenus`) vs Ithacan (`helenus-ithaca`) | already disambiguated |
| **Eurybates** | Agamemnon's herald (*Il.* 1–2) — check before any new Eurybates | `eurybates` |
| **Eumedes** | Dolon's father the herald (*Il.* 10) vs son of Melas in the Calydonian feud (*Bibl.* 1.8.5) | `eumedes-herald` |
| **Eïoneus** | Father of Rhesus (*Il.* 10) vs warrior slain by Hector (*Il.* 7) vs Deioneus in older stemmas | `eioneus-thrace` |
| **Hippocoon** | Kinsman of Rhesus (*Il.* 10) vs Spartan usurper (`hippocoon`) | `hippocoon-thrace` |
| **Schedius** | Phocian captain (*Il.* 2) vs Dulichian suitor (`schedius-dulichium`) | `schedius-phocis` |
| **Epistrophus** | Phocian captain (*Il.* 2) vs son of Evenus slain at Lyrnessus (*Il.* 2.655) vs Halizone captain from Alybe (*Il.* 2.820) | `epistrophus-phocis` |
| **Ascalaphus** | Minyan captain, son of Ares (*Il.* 2) vs Orchomenus keeper turned owl (later myth) | `ascalaphus-minyan` |
| **Amphimachus** | Epeian captain, son of Cteatus (*Il.* 2) vs suitors (`amphimachus-ithaca`, `amphimachus-nomionid`) | `amphimachus-epeian` |
| **Polyxenus** | Epeian captain, son of Agasthenes (*Il.* 2) vs king of Elis in the Taphian cattle tale (*Bibl.* 2.4.6) | `polyxenus-epeian` |
| **Cteatus** | Epeian father of Amphimachus (*Il.* 2) — twin of Eurytus in Apollodorus | `cteatus-epeian` |
| **Eurytus** | Epeian father of Thalpius (*Il.* 2) vs Oechalia (`eurytus-oechalia`), Argonaut (`eurytus-hermes`) | `eurytus-epeian` |
| **Amarynceus** | Epeian lord, father of Diores (*Il.* 2) vs Hyginus' Mycenaean captain of the same name (*Fab.* 97) | `amarynceus-epeian` |
| **Agasthenes** | Epeian king, father of Polyxenus (*Il.* 2) | `agasthenes-epeian` |
| **Aretaon** | Phrygian father of Phorcys and Ascanius (Apollodorus) | `aretaon-phrygian` |
| **Teutamus** | Pelasgian grandfather of Hippothous and Pylaeus (*Il.* 2) | `teutamus-pelasgian` |
| **Molione** | Mother of Cteatus and Eurytus (Apollodorus); Homer names the Moliones | `molione-epeian` |
| **Troezenus** | Ciconian father of Euphemus (*Il.* 2) vs city-founder homonyms | `troezenus-ciconian` |
| **Iphiclus** | Phthian father of Protesilaus and Podarces (*Il.* 2) vs Calydonian hunter (`iphiclus-thestiad`) | `iphiclus-phthian` |
| **Eusorus** | Thracian father of Acamas (*Il.* 2) vs Propontis king in Argonautica | `eusorus-thracian` |
| **Odius** | Halizone captain from Alybe (*Il.* 2) — no homonym in atlas | `odius-halizone` |
| **Prothous** | Magnet captain, son of Tenthredon (*Il.* 2) vs suitor from Same (`prothous-same`) | `prothous-magnesia` |
| **Leonteus** | Lapith captain (*Il.* 2) — no homonym in atlas yet | `leonteus-lapith` |
| **Polypoetes** | Lapith captain, son of Peirithous (*Il.* 2) vs Ithacan suitor (`polypoetes-ithaca`) vs Thesprotian son (`polypoetes-thesprotian`) | `polypoetes-lapith` |
| **Agenor** | Antenor's son at Troy (*Il.* 11, 21) vs Phoenician king (`agenor`), Aetolian, Ithacan, Zacynthian suitors | `agenor-trojan` |
| **Pylaemenes** | Paphlagonian captain (*Il.* 2, 5, 13) vs Dulichian suitor (`pylaemenes-dulichium`) | `pylaemenes-paphlagon` |
| **Chromis** | Mysian captain (*Il.* 2, 17) vs Ovidic warriors in *Metamorphoses* 5, 12 | `chromis-mysian` |
| **Ennomus** | Mysian augur (*Il.* 2, 17) vs Ovidic fighter in *Metamorphoses* 13 | `ennomus-mysian` |
| **Gouneus** | Cyphus captain (*Il.* 2) — no homonym in atlas | `gouneus-cyphus` |
| **Phorcys** | Phrygian captain (*Il.* 2, 17) vs sea-god (`phorcys`) vs Thoosa's father in *Odyssey* 1 | `phorcys-phrygian` |
| **Ascanius** | Phrygian captain (*Il.* 2) vs Roman Aeneas-line eponyms (out of scope until promoted) | `ascanius-phrygian` |
| **Antiphus** | Maeonian captain (*Il.* 2, 17) vs Coan captain (`antiphus-thessalus-cos`) vs Ithacan brother of Eurynomus | `antiphus-maeonian` |
| **Nastes** | Carian captain (*Il.* 2) — no homonym in atlas | `nastes-nomionid` |
| **Amphimachus** | Carian captain, son of Nomion (*Il.* 2, 13) vs Epeian (`amphimachus-epeian`) vs suitors (`amphimachus-ithaca`) | `amphimachus-nomionid` (pre-existing) |
| **Hippothous** | Pelasgian captain (*Il.* 2, 17) vs Priam's son (*Il.* 24) vs Calydonian hunter, Arcadian king | `hippothous-pelasgian` |
| **Acamas** | Thracian captain, son of Eüssorus (*Il.* 2, 6) vs Antenor's son (`acamas-antenorid`) vs Dulichian suitor (`acamas-dulichium`) | `acamas-thracian` / `acamas-antenorid` |
| **Pyraechmes** | Paeonian captain (*Il.* 2, 16) — no homonym in atlas | `pyraechmes-paeonian` |
| **Asteropaeus** | Paeonian captain (*Il.* 12, 17, 21) — no homonym in atlas | `asteropaeus-paeonian` |
| **Pylaeus** | Pelasgian captain (*Il.* 2) — no homonym in atlas yet | `pylaeus-pelasgian` |
| **Euphemus** | Ciconian captain (*Il.* 2) vs Argonaut son of Poseidon (`euphemus`) | `euphemus-ciconian` |
| **Asius** | Captain from Arisbe, son of Hyrtacus (*Il.* 2, 12) — not Hecuba's brother Asius | `asius-hyrtacid` |
| **Archelochus** | Son of Antenor (*Il.* 2, 12, 14) — no homonym in atlas | `archelochus-antenorid` |
| **Adrastus** | Argive king (`adrastus`) vs Merops' son (`adrastus-meropsid`) vs Patroclus victim (`adrastus-trojan`) vs Menelaus' captive (`adrastus-trojan-ransom`) | suffixed per context |
| **Araphius** | Son of Merops in Homer (*Il.* 2, 11); Apollodorus names Amphius among Merops' sons | `araphius-meropsid` |
| **Polybus** | Son of Antenor at Troy (*Il.* 11) vs Ithacan suitor (`polybus-ithaca`) vs Zacynthian suitor (`polybus-zacynthus`) | `polybus-antenorid` |
| **Alcathous** | Trojan captain, son-in-law of Anchises (*Il.* 12–13) — no homonym in atlas yet | `alcathous-trojan` |
| **Medon** | Bastard son of Oileus, Phthian captain (*Il.* 2, 13, 15) vs Ithacan herald (`medon-ithaca`) vs Dulichian suitor (`medon-dulichium`) | `medon-phthian` |
| **Iasus** | Athenian captain, son of Sphelus (*Il.* 15) vs Argive king (`iasus` in stemmas) vs `iasus-arcadia` (Atalanta's father) | `iasus-athenian` |
| **Thersilochus** | Paeonian captain (*Il.* 17, 21) vs Dulichian suitor (`thersilochus-dulichium`) | `thersilochus-paeonian` |
| **Mecisteus** | Son of Echius at Troy (*Il.* 8, 13, 15) vs Argive son of Talaus (`mecisteus-aeolid`) vs Dulichian suitor (`mecisteus-dulichium`) vs Halizone parent in Apollodorus (prose) | `mecisteus-echius` |
| **Deisenor** | Trojan ally in the rally (*Il.* 17) — no homonym in atlas | `deisenor-trojan` |
| **Deiochus** | Achaean slain by Paris (*Il.* 15) — no homonym in atlas | `deiochus-achaean` |
| **Echius** | Father of Mecisteus, slain by Polites (*Il.* 8, 13, 15) vs Echius among Patroclus' victims (*Il.* 16) | `echius-achaean` |
| **Polites** | Son of Priam (*Il.* 2, 13, 15, 24) vs Odysseus' comrade in Circe's land (*Od.* 10) | `polites-trojan` |
| **Chroraius** | Trojan ally in the rally (*Il.* 17) — no homonym in atlas | `chroraus-trojan` |
| **Mydon** | Paeonian slain by Achilles (*Il.* 21) vs charioteer of Atymnius (*Il.* 5) | `mydon-paeonian` |
| **Astypylus** | Paeonian slain by Achilles (*Il.* 21) — no homonym in atlas yet | `astypylus-paeonian` |
| **Alastor** | Goodly comrade of Mecisteus (`alastor-achaean`) vs Pylian under Nestor (`alastor-pylian`) vs Lycian slain by Odysseus (`alastor-lycian`) vs Trojan father of Tros (`alastor-trojan`) | suffixed per context |
| **Mnesus** | Paeonian slain by Achilles (*Il.* 21) — no homonym in atlas | `mnesus-paeonian` |
| **Thrasius** | Paeonian slain by Achilles (*Il.* 21) — no homonym in atlas | `thrasius-paeonian` |
| **Aenius** | Paeonian slain by Achilles (*Il.* 21) — no homonym in atlas | `aenius-paeonian` |
| **Ophelestes** | Paeonian slain by Achilles (*Il.* 21) vs Trojan slain by Teucer (*Il.* 8) | `ophelestes-paeonian` / `ophelestes-trojan` |
| **Pammon** | Son of Priam (*Il.* 24) — no homonym in atlas | `pammon-trojan` |
| **Antiphonus** | Son of Priam in Homer's ransom roll (*Il.* 24) vs Antiphus in Apollodorus' Hecuba list | `antiphonus-trojan` |
| **Agathon** | Goodly son of Priam (*Il.* 24) — no homonym in atlas yet | `agathon-trojan` |
| **Dius** | Lordly son of Priam (*Il.* 24) — no homonym in atlas | `dius-trojan` |
| **Orsilochus** | Trojan slain by Teucer (*Il.* 8) vs Pylians' king and Crethon's brother (*Il.* 5) | `orsilochus-trojan` |
| **Ormenus** | Trojan slain by Teucer (*Il.* 8) vs `ormenus-zacynthus` and Phoenix's grandfather | `ormenus-trojan` |
| **Melanippus** | Teucer victim (`melanippus-trojan`) vs Hicetaon's son (`melanippus-hicetaonid`) vs Patroclus victim (`melanippus-patroclus-roll`) vs tripod embassy (`melanippus-achaean`) | suffixed per context |
| **Mulius** | Patroclus victim (`mulius-trojan`) vs Achilles' victim (`mulius-iliad20`) vs Nestor's victim, son-in-law of Augeias (`mulius-augeiad`) | suffixed per context |
| **Echeclus** | Patroclus victim (`echeclus-trojan`) vs Agenor's son (`echeclus-agenorid`) | suffixed per context |
| **Lycaon** | Arcadian king (`lycaon`) vs Pandarus' father (`lycaon-pandarusid`) vs Priam's son (`lycaon-trojan`) | suffixed per context |
| **Laogonus** | Son of Bias (`laogonus-trojan`) vs son of Onetor, priest of Zeus (`laogonus-onetorid`) | suffixed per context |
| **Polydorus** | Cadmean king (`polydorus`) vs Epigoni captain (`polydorus-epigoni`) vs Zacynthian suitor (`polydorus-zacynthus`) vs Priam's youngest son (`polydorus-priamid`) | suffixed per context |
| **Hippodamas** | Calydonian eponym (Euryte's father, prose) vs Priam son in Apollodorus (prose) vs Trojan slain by Achilles (`hippodamas-trojan`) | `hippodamas-trojan` for *Il.* 20 victim |
| **Dardanus** | Primordial founder (`dardanus`) vs eponym king (`tros` line) vs son of Bias (`dardanus-trojan`) | `dardanus-trojan` |
| **Tros** | Eponym king of Troy (`tros`) vs son of Alastor (`tros-alastorid`) | suffixed per context |
| **Lycomedes** | Scyros king (`lycomedes-skyros`) vs son of Creon at Troy (`lycomedes-creonid`) | `lycomedes-creonid` |
| **Hippothous** | Son of Priam (*Il.* 24) vs Pelasgian captain (`hippothous-pelasgian`) | `hippothous-trojan` |
| **Chromius** | Teucer victim (*Il.* 8) vs son of Priam slain by Diomedes (*Il.* 5) vs Nestor's comrade (*Il.* 4) vs Lycian slain by Odysseus (*Il.* 5) | `chromius-trojan` / `chromius-priamid` / `chromius-pylian` / `chromius-lycian` |
| **Daetor** | Trojan slain by Teucer (*Il.* 8) — no homonym in atlas | `daetor-trojan` |
| **Lycophontes** | Godlike Trojan slain by Teucer (*Il.* 8) — no homonym in atlas | `lycophontes-trojan` |
| **Amopaon** | Son of Polyaemon, Teucer victim (*Il.* 8) — no homonym in atlas | `amopaon-trojan` |
| **Echemmon** | Son of Priam slain by Diomedes (*Il.* 5) — no homonym in atlas | `echemmon-priamid` |
| **Bias** | Pylian shepherd (`bias-pylian`) vs Aeolid (`bias-aeolid`) vs Athenian captain (`bias-athenian`) vs Dulichian suitor (`bias-dulichium`) vs Trojan father of Laogonus and Dardanus (`bias-trojan`) | suffixed per context |
| **Peiros** | Thracian leader from Aenus (`peiros-thracian`) — no homonym in atlas | `peiros-thracian` |
| **Imbrasus** | Father of Peiros (`imbrasus-thracian`) vs Samian river in the Argonautica (prose) | `imbrasus-thracian` |
| **Alectryon** | Guardian of Helios' horses (myth, out of scope) vs father of Leïtus (`alectryon-boeotian`) | `alectryon-boeotian` |
| **Theobula** | Mother of Arcesilaus and Prothoënor (`theobula-boeotian`) — no homonym in atlas | `theobula-boeotian` |
| **Lacritus** | Father of Leïtus and Clonius (`lacritus-boeotian`) — no homonym in atlas | `lacritus-boeotian` |
| **Cleobule** | Mother of Leïtus and Clonius (`cleobule-boeotian`) vs Aleus' wife, Arcadian stemmas | `cleobule-boeotian` |
| **Hippolochus** | Father of Glaucus (`hippolochus-lycian`) vs son of Bellerophon in stemmas vs son of Antimachus slain by Agamemnon (`hippolochus-antimachid`) | `hippolochus-lycian` / `hippolochus-antimachid` |
| **Antimachus** | Trojan counsellor (`antimachus-trojan`) vs Dulichian suitor (`antimachus-dulichium`) vs centaur at the wedding war (Ovid) | `antimachus-trojan` |
| **Peisenor** | Father of Cleitus (`peisenor-trojan`) vs Odyssey genealogy of Eurycleia vs suitor of Same (`pisenor-same`) | `peisenor-trojan` |
| **Hippasus** | Father of Charops and Socus (`hippasus-trojan`) — Hypsenor deferred | `hippasus-trojan` |
| **Lampus** | Trojan elder and father of Dolops (`lampus-trojan`) vs Hector's horse (*Il.* 8) | `lampus-trojan` |
| **Panthous** | Trojan elder, father of Polydamas and Euphorbus (`panthous-trojan`) — no homonym in atlas | `panthous-trojan` |
| **Onetor** | Father of Laogonus the priest (`onetor-trojan`) vs father of Phrontis the helmsman (*Od.* 3) | `onetor-trojan` for *Il.* 16 |
| **Haemon** | Pylian under Nestor (*Il.* 4) vs son of Creon (`haemon`) | `haemon-pylian` |
| **Coeranus** | Lycian slain by Odysseus (*Il.* 5) vs charioteer of Meriones from Lyctus (*Il.* 17) | `coeranus-lycian` / `coeranus-lyctian` |
| **Halius** | Lycian slain by Odysseus (*Il.* 5) vs Phaeacian prince (`halius-phaeacian`) vs Zacynthian suitor (`halius-zacynthus`) | `halius-lycian` |
| **Pelagon** | Mighty Pylian under Nestor (*Il.* 4) — no homonym in atlas | `pelagon-pylian` |
| **Alcandrus** | Lycian slain by Odysseus (*Il.* 5) — no homonym in atlas | `alcandrus-lycian` |
| **Noëmon** | Lycian slain by Odysseus (*Il.* 5) vs son of Phronius in the *Odyssey* | `noemon-lycian` |
| **Prytanis** | Lycian slain by Odysseus (*Il.* 5) — no homonym in atlas | `prytanis-lycian` |
| **Podarces** | Phthian captain, brother of Protesilaus (*Il.* 2, 13) — no homonym in atlas | `podarces-phthian` |
| **Protesilaus** | First Achaean ashore at Troy (*Il.* 2, 13) — no homonym in atlas | `protesilaus` |
| **Stichius** | Athenian captain under Menestheus (*Il.* 13) — no homonym in atlas | `stichius-athenian` |
| **Euphorbus** | Son of Panthous, slain by Menelaus (*Il.* 16–17) — no homonym in atlas | `euphorbus-trojan` |
| **Imbrius** | Son-in-law of Priam, slain by Teucer (*Il.* 13) — no homonym in atlas | `imbrius-trojan` |
| **Dracius** | Epeian captain under Meges (*Il.* 13) — no homonym in atlas | `dracius-epeian` |
| **Pheidas** | Athenian captain under Menestheus (*Il.* 13) — no homonym in atlas | `pheidas-athenian` |
| **Araphion** | Epeian captain under Meges (*Il.* 13) vs son of Merops (`araphius-meropsid`) | `araphion-epeian` |
| **Cleitus** | Son of Peisenor, comrade of Polydamas, slain by Teucer (*Il.* 15) vs son of Melampus (`cleitus-melampid`) | `cleitus-trojan` |
| **Croesmus** | Trojan slain by Polydamas (*Il.* 15) — no homonym in atlas | `croesmus-trojan` |
| **Thoön** | Trojan slain by Agamemnon (*Il.* 11) vs son of Phaenops slain by Diomedes (*Il.* 5) vs Trojan slain by Antilochus (*Il.* 13) | `thoon-trojan` / `thoon-phaenopid` |
| **Eunomus** | Trojan slain by Agamemnon (*Il.* 11) — no homonym in atlas | `eunomus-trojan` |
| **Chersidamas** | Trojan slain by Agamemnon (*Il.* 11) vs son of Pterelaus in Apollodorus (*Bibl.* 2.4.5) vs Priam son in Apollodorus (*Bibl.* 3.12.5) | `chersidamas-trojan` |
| **Charops** | Son of Hippasus at Troy (*Il.* 11) vs husband of Oia in Attic stemmas (reference only) | `charops-trojan` |
| **Dolops** | Son of Lampus at Troy (*Il.* 15) vs son of Clytius in Hector's rampage (*Il.* 11) vs Argonaut tomb-hero, Hyginus figures | `dolops-trojan` / `dolops-clytiid` |
| **Deïopites** | Trojan slain by Agamemnon (*Il.* 11) — Apollodorus names among Priam's sons | `deiopites-trojan` |
| **Socus** | Son of Hippasus, brother of Charops, wounds Odysseus (*Il.* 11) — no homonym in atlas | `socus-trojan` |
| **Xanthus** | Son of Phaenops slain by Diomedes (*Il.* 5) vs river in Lycia, Achilles' horse, Theban king (`xanthus-theban`) | `xanthus-phaenopid` |
| **Asaeus** | First Danaan leader slain by Hector (*Il.* 11) — no homonym in atlas | `asaeus-achaean` |
| **Autonous** | Danaan leader slain by Hector (*Il.* 11) vs Trojan slain by Patroclus (*Il.* 16) | `autonous-achaean` / `autonous-trojan` |
| **Opites** | Danaan leader slain by Hector (*Il.* 11) — no homonym in atlas | `opites-achaean` |
| **Opheltius** | Danaan leader slain by Hector (*Il.* 11) vs Trojan slain by Euryalus (*Il.* 6) | `opheltius-achaean` / `opheltius-trojan` |
| **Agelaus** | Danaan leader slain by Hector (*Il.* 11) vs suitor (`agelaus-same`), Temenus' son, Omphale's son | `agelaus-achaean` |
| **Aesymnus** | Danaan leader slain by Hector (*Il.* 11) — no homonym in atlas | `aesymnus-achaean` |
| **Orus** | Danaan leader slain by Hector (*Il.* 11) — other Homeric namesakes deferred | `orus-achaean` |
| **Hipponous** | Danaan leader (`hipponous-achaean`) vs son of Priam (`hipponous-trojan`) vs Capaneus' father, Periboea's father | `hipponous-achaean` / `hipponous-trojan` |
| **Peisander** | Son of Antimachus at Troy (*Il.* 11) vs suitor of Same (`peisander-same`) | `peisander-trojan` |
| **Mentor** | Father of Imbrius at Pedaeum (*Il.* 13) vs Ithacan companion of Odysseus, suitor of Penelope | `mentor-trojan` |
| **Hicetaon** | Son of Laomedon, elder at the Scaean gates (*Il.* 3, 20) — no homonym in atlas | `hicetaon-trojan` |
| **Hypsenor** | Son of Hippasus (*Il.* 13) — no homonym in atlas | `hypsenor-trojan` |
| **Polyaemon** | Father of Amopaon (*Il.* 8) — no homonym in atlas | `polyaemon-trojan` |
| **Phaenops** | Father of Xanthus and Thoön (`phaenops-trojan`) vs Phaenops father of Phorcys (*Il.* 17); Asius' guest-friend at Abydus (prose) | `phaenops-trojan` |
| **Clytius** | Laomedonid elder (`clytius-trojan`) vs Achaean father of Dolops (`clytius-achaean`) vs suitors / Argonaut | suffixed per context |
| **Tenthredon** | Father of Prothous the Magnet (`tenthredon-magnesia`) — no homonym in atlas | `tenthredon-magnesia` |
| **Nomion** | Father of Nastes and Amphimachus (`nomion-carion`) — no homonym in atlas | `nomion-carion` |
| **Hippomachus** | Son of Antimachus (`hippomachus-antimachid`) vs Zacynthian suitor (`hippomachus-zacynthus`) | `hippomachus-antimachid` |
| **Clytius** | Laomedon son at the Scaean gates (`clytius-trojan`) vs father of Achaean Dolops (`dolops-clytiid`) vs suitors (`clytius-same`, `clytius-zacynthus`) vs Oechalia (`clytius-oechalia`) | suffixed per context |
| **Merops** | Seer of Percote (`merops-percote`) vs king of Ethiopia, Ovid's father of Clymene | `merops-percote` |
| **Thymoetes** | Elder at Troy (*Il.* 3) vs Athenian king in Pausanias | `thymoetes-trojan` |
| **Ucalegon** | Elder at the Scaean gates (*Il.* 3) — no homonym in atlas | `ucalegon-trojan` |
| **Hyrtacus** | Father of Asius (`hyrtacus-trojan`) vs Samian river in Argonautica (prose) | `hyrtacus-trojan` |

## 4. Pre-entry collision checklist

Before any new `id` is written:

1. `grep`/search `data/characters/` for the plain name and likely homonyms.
2. Record hits in §3 and §4 of this dossier.
3. If a same-name figure exists under a different id, use a suffixed id (`ajax-oileus`, `deucalion-crete`, …) — never merge.
4. Only then corpus-verify and write JSON.

## 5. Existing-node collision list (resolved before Batch A)

| Proposed id | Collision | Resolution |
|---|---|---|
| `phoenix-myrmidon` | `phoenix` (Agenorid) | New suffixed node; never merge |
| `chryses-apollo` | `chryses-paros` (Minos' son) | New suffixed node |
| `chryseis` | Hesiodic Oceanid (not in atlas) | Enter Homer figure; Oceanid stays out of scope |
| `briseis` | None | Clean id |
| `thersites` | `thersander`, `thersilochus-dulichium` | Different names; clean id |
| `talthybius`, `eurybates` | None | Clean ids |
| `antenor` | `antenor-zacynthus` (suitor) | New plain id for the Trojan elder |
| `agenor-trojan` | `agenor`, `agenor-aetolian`, `agenor-ithaca`, `agenor-zacynthus` | New suffixed id |
| `polydamas`, `cebriones` | None | Clean ids |
| `glaucus-lycian` | `glaucus-corinth`, `glaucus-dulichium` | New suffixed id; Corinthian line in prose via `bellerophon` |
| `pandarus` | None | Clean id; `lycaon-pandarusid` parent wired |
| `peneleos`, `leitus`, `arcesilaus`, `prothoenor`, `clonius` | None | Clean ids; `Alectryon` wired (`alectryon-boeotian`); `Areilycus` wired (`areilycus-achaean`); `Lacritus`, `Cleobule`, `Theobula` wired (Hyginus) |
| `ascalaphus-minyan`, `ialmenus-minyan` | Future owl-keeper homonym | Suffixed id; parent `ares` wired |
| `schedius-phocis` | `schedius-dulichium` (suitor) | New suffixed id |
| `epistrophus-phocis` | Lyrnessus warrior, Halizone captain (same name) | New suffixed id; `naubolus-phocis` wired |
| `amphimachus-epeian`, `thalpius-epeian`, `diores-epeian`, `polyxenus-epeian` | `amphimachus-ithaca`, `amphimachus-nomionid`; Apollodorus' Polyxenus of Elis (Taphians) | Suffixed ids; `Cteatus`, `Eurytus`, `Amarynceus`, `Agasthenes`, `Actor`, `Augeias`, `Molione` wired |
| `odius-halizone`, `epistrophus-halizone` | `epistrophus-phocis`, Lyrnessus warrior | Suffixed ids |
| `prothous-magnesia` | `prothous-same` (suitor) | Suffixed id; `Tenthredon` deferred |
| `leonteus-lapith`, `polypoetes-lapith` | `polypoetes-ithaca`, `polypoetes-thesprotian` | Suffixed ids; `Peirithous`, `Coronus` wired (`peirithous`, `coronus-gyrton`) |
| `gouneus-cyphus` | None | Clean id |
| `pylaemenes-paphlagon`, `harpalion-paphlagon` | `pylaemenes-dulichium` (suitor) | Suffixed ids; `Bilsates` deferred |
| `chromis-mysian`, `ennomus-mysian` | Ovidic homonyms | Suffixed ids; `arsinous-mysian` wired |
| `phorcys-phrygian`, `ascanius-phrygian` | `phorcys` (sea-god); Roman Ascanius out of scope | Suffixed ids; `Aretaon` wired (`aretaon-phrygian`); `Phaenops` (*Il.* 17) parentage dispute remains |
| `mesthles-maeonian`, `antiphus-maeonian` | `antiphus-thessalus-cos` | Suffixed ids; `Talaemenes` deferred |
| `nastes-nomionid` | `amphimachus-nomionid` (pre-existing) | New node; `Nomion` deferred; relations wired |
| `pyraechmes-paeonian`, `asteropaeus-paeonian` | None | Clean ids; `pelegon-paeonian`, `axius-river`, `periboea-paeonian`, `accessamenus-paeonian` wired |
| `hippothous-pelasgian`, `pylaeus-pelasgian` | Priam's son Hippothous (*Il.* 24), Ovidic hunters | Suffixed ids; `Lethus`, `Teutamus`, `Pelasgus` (Larissa) wired |
| `acamas-thracian` | `acamas-dulichium`, `acamas-antenorid` | Suffixed ids; `Peirous` wired in Batch M |
| `euphemus-ciconian`, `peirous-thracian`, `archelochus-antenorid`, `acamas-antenorid`, `asius-hyrtacid` | `euphemus` (Argonaut); `acamas-thracian`; `acamas-dulichium`; Hecuba's brother Asius (prose) | Suffixed ids; `Troezenus`, `Eusorus` wired; `Hyrtacus`, `Theanus` deferred |
| `adrastus-meropsid`, `araphius-meropsid` | `adrastus` (Argive king) | Suffixed ids; `Merops` deferred; Apollodorus' Amphius = Araphius (prose + topic) |
| `polybus-antenorid` | `polybus-ithaca`, `polybus-zacynthus` | Suffixed id |
| `alcathous-trojan` | None | Clean id; `Aesyetes` wired; `hippodameia-trojan` wired |
| `medon-phthian` | `medon-ithaca`, `medon-dulichium` | Suffixed id; `rhene-phthian`, `eriopis-phthian` wired |
| `iasus-athenian` | `iasus-arcadia`; Argive Iasus in stemmas (prose) | Suffixed id; `Sphelus`, `Bucolus` wired |
| `deisenor-trojan` | None | Clean id |
| `thersilochus-paeonian` | `thersilochus-dulichium` | Suffixed id |
| `mecisteus-echius` | `mecisteus-aeolid`, `mecisteus-dulichium` | Suffixed id; `Echius`, `Alastor` deferred |
| `deiochus-achaean` | None | Clean id |
| `echius-achaean` | Echius among Patroclus' Lycian victims (*Il.* 16) | Suffixed id; wired parent to `mecisteus-echius` |
| `polites-trojan` | Polites comrade of Odysseus (*Od.* 10) | Suffixed id; `Aesyetes` barrow in prose |
| `chroraus-trojan` | None | Clean id |
| `mydon-paeonian` | Mydon charioteer of Atymnius (*Il.* 5) | Suffixed id |
| `astypylus-paeonian` | None | Clean id |
| `alastor-achaean` | Nestor's Alastor (*Il.* 4), Lycian Alastor (*Il.* 5) | Suffixed id; `alastor-pylian`, `alastor-lycian` entered Batches U–W |
| `mnesus-paeonian`, `thrasius-paeonian`, `aenius-paeonian` | None | Clean ids |
| `ophelestes-paeonian` | Ophelestes Trojan (*Il.* 8) | Suffixed id; `ophelestes-trojan` entered Batch R |
| `pammon-trojan`, `dius-trojan` | None | Clean ids |
| `antiphonus-trojan` | Antiphus son of Hecuba in Apollodorus (prose) | Suffixed id |
| `agathon-trojan` | None | Clean id; `ophelestes-trojan` wired |
| `orsilochus-trojan`, `ormenus-trojan`, `melanippus-trojan` | Pylians' Orsilochus (*Il.* 5); `ormenus-zacynthus`; `melanippus-patroclus-roll` | Suffixed ids |
| `hippothous-trojan` | `hippothous-pelasgian` | Suffixed id |
| `melanippus-hicetaonid` | `melanippus-trojan`; `melanippus-patroclus-roll`; Achaean Melanippus | Suffixed id; `Hicetaon` deferred |
| `daetor-trojan`, `chromius-trojan`, `lycophontes-trojan`, `amopaon-trojan` | None | Clean ids; `Polyaemon` deferred |
| `chromius-priamid` | `chromius-trojan`; Nestor's Chromius (*Il.* 4); Lycian Chromius (*Il.* 5) | Suffixed id; `Echemmon` deferred |
| `echemmon-priamid` | None | Clean id; sibling `chromius-priamid` wired |
| `chromius-pylian`, `chromius-lycian` | `chromius-trojan`, `chromius-priamid` | Suffixed ids; `Pelagon`, `Haemon` deferred |
| `alastor-pylian` | `alastor-achaean`; Lycian Alastor (*Il.* 5) | Suffixed id |
| `bias-pylian` | `bias-aeolid`, `bias-dulichium` | Suffixed id |
| `pelagon-pylian`, `haemon-pylian` | `haemon` (Creonid) | Suffixed ids; Nestor's *Il.* 4 company complete |
| `coeranus-lycian`, `alcandrus-lycian`, `halius-lycian` | `coeranus-lyctian` (*Il.* 17); `halius-phaeacian`, `halius-zacynthus` | Suffixed ids; Lycian rout completed Batch W |
| `noemon-lycian`, `prytanis-lycian`, `alastor-lycian` | Odyssey Noëmon son of Phronius; `alastor-achaean`, `alastor-pylian` | Suffixed ids |
| `coeranus-lyctian` | `coeranus-lycian` | Suffixed id; `hector` slayer wired |
| `podarces-phthian` | None | Clean id; `protesilaus` sibling wired; `iphiclus-phthian`, `phylacus-phthian` wired; `Phylacus` (Pedasus) homonym noted |
| `protesilaus` | None | Clean id; Dardanian slayer unnamed in Homer (prose only) |
| `stichius-athenian` | None | Clean id |
| `pheidas-athenian` | None | Clean id |
| `bias-athenian` | `bias-aeolid`, `bias-dulichium`, `bias-pylian` | Suffixed id |
| `araphion-epeian` | `araphius-meropsid` | Suffixed id |
| `cleitus-trojan` | `cleitus-melampid` | Suffixed id; `Peisenor` wired (`peisenor-trojan`) |
| `euphorbus-trojan` | None | Clean id; `Panthous` wired (`panthous-trojan`); `polydamas` sibling wired |
| `imbrius-trojan` | None | Clean id; `Mentor`, `Medesicaste` deferred |
| `dracius-epeian` | None | Clean id |
| `croesmus-trojan` | None | Clean id; `dolops-trojan` wired Batch Z |
| `thoon-trojan` | Thoön son of Phaenops (*Il.* 5); Thoön slain by Antilochus (*Il.* 13) | Suffixed id |
| `eunomus-trojan` | None | Clean id |
| `chersidamas-trojan` | Chersidamas son of Pterelaus (*Bibl.* 2.4.5); Apollodorus Priam son | Suffixed id; `Priam` parent wired |
| `charops-trojan` | Attic Charops husband of Oia (reference only) | Suffixed id; `Hippasus` wired (`hippasus-trojan`); sibling `socus-trojan` wired |
| `dolops-trojan` | Dolops son of Clytius (*Il.* 11); Argonaut/Hyginus namesakes | Suffixed id; `Lampus` wired (`lampus-trojan`) |
| `deiopites-trojan` | Apollodorus Priam son | Clean id; `Priam` parent wired |
| `socus-trojan` | None | Clean id; `Hippasus` wired (`hippasus-trojan`); sibling `charops-trojan` wired |
| `dolops-clytiid` | `dolops-trojan`; Laomedon's son Clytius (prose) | Suffixed id; parent `clytius-achaean` wired; Achaean leader, not Trojan |
| `thoon-phaenopid` | `thoon-trojan`; Thoön slain by Antilochus (*Il.* 13) | Suffixed id; `Phaenops` deferred |
| `xanthus-phaenopid` | `xanthus-theban`; river Scamander; Achilles' horse | Suffixed id; sibling `thoon-phaenopid` wired |
| `asaeus-achaean` | None | Clean id |
| `autonous-achaean` | `autonous-trojan` (Patroclus victim) | Suffixed id |
| `opites-achaean` | None | Clean id |
| `opheltius-achaean` | `opheltius-trojan` (Euryalus victim) | Suffixed id |
| `agelaus-achaean` | `agelaus-same`; Temenus' son; Omphale's son | Suffixed id |
| `aesymnus-achaean` | None | Clean id |
| `orus-achaean` | Other Homeric Orus figures | Suffixed id |
| `hipponous-achaean` | `hipponous-trojan`; Capaneus' father; Periboea's father | Suffixed id |
| `autonous-trojan` | `autonous-achaean` | Suffixed id |
| `opheltius-trojan` | `opheltius-achaean` | Suffixed id; `euryalus-aeolid` slayer wired |
| `dresus-trojan` | None | Clean id; `euryalus-aeolid` slayer wired |
| `adrastus-trojan` | `adrastus`, `adrastus-meropsid`; Menelaus captive (*Il.* 6) deferred | Suffixed id; `patroclus` slayer wired |
| `aesepus-trojan`, `pedasus-trojan` | River Aesepus (*Il.* 2); place-name Pedasus in later myth | Suffixed ids; twin siblings wired; `bucolion-trojan`, `abarbarea-trojan` wired |
| `echeclus-trojan` | Echeclus son of Agenor (*Il.* 20) | Suffixed id; `patroclus` slayer wired |
| `perimus-trojan`, `epistor-trojan`, `melanippus-patroclus-roll`, `elasus-trojan`, `mulius-trojan`, `pylartes-trojan` | `melanippus-trojan`, `melanippus-hicetaonid`; `mulius-trojan` ≠ `mulius-iliad20`; Elatus homonyms | Suffixed ids; `Megas` deferred; Patroclus roll nine of nine complete |
| `adrastus-trojan-ransom` | `adrastus`, `adrastus-meropsid`, `adrastus-trojan` | Suffixed id; `agamemnon` slayer wired |
| `echeclus-agenorid` | `echeclus-trojan` | Suffixed id; parent `agenor-trojan` wired |
| `mulius-iliad20` | `mulius-trojan`; `mulius-augeiad` | Suffixed id; `achilles` slayer wired |
| `hipponous-trojan` | `hipponous-achaean` | Suffixed id; Apollodorus stemma; `hecuba` parent wired |
| `melanippus-achaean` | `melanippus-trojan`, `melanippus-hicetaonid`, `melanippus-patroclus-roll` | Suffixed id; `lycomedes-creonid` wired |
| `mulius-augeiad` | `mulius-trojan`, `mulius-iliad20` | Suffixed id; `nestor` slayer wired; pre-Troy Epeian war |
| `lycomedes-creonid` | `lycomedes-skyros` | Suffixed id; `Creon` wired (`creon-achaean`) |
| `deucalion-trojan` | `deucalion`, `deucalion-crete` | Suffixed id; `achilles` slayer wired |
| `dryops-trojan` | None | Suffixed id; `priam` parent wired |
| `demuchus-trojan` | None | Clean id; `Philetor` parent deferred |
| `laogonus-trojan`, `dardanus-trojan` | `dardanus` (primordial), `laogonus-onetorid` (deferred) | Suffixed ids; `Bias` (Trojan) parent deferred |
| `megas-trojan` | None | Clean id; parent `perimus-trojan` wired |
| `lycaon-trojan` | `lycaon` (Arcadian); Pandarus' father Lycaon (prose) | Suffixed id; `priam` parent wired |
| `tros-alastorid` | `tros` (eponym king) | Suffixed id; `Alastor` (Trojan) parent deferred |
| `laogonus-onetorid` | `laogonus-trojan` | Suffixed id; `meriones` slayer wired; `onetor-trojan` parent wired |
| `iphition-otrynteid` | None | Clean id; `otrynteus-trojan` parent wired |
| `demoleon-antenorid` | Ovidic hunter at Calydon (out of scope) | Suffixed id; `antenor` parent wired |
| `hippodamas-trojan` | Hippodamas eponym | Suffixed id; `achilles` slayer wired; `priam` parent wired |
| `polydorus-priamid` | `polydorus`, `polydorus-epigoni`, `polydorus-zacynthus` | Suffixed id; `priam` parent wired; `hipponous-trojan` sibling corrected |
| `philetor-trojan` | None | Clean id; parent `demuchus-trojan` wired |
| `bias-trojan` | `bias-pylian`, `bias-aeolid`, `bias-athenian`, `bias-dulichium` | Suffixed id; sons `laogonus-trojan`, `dardanus-trojan` wired; `priam` parent wired |
| `onetor-trojan` | Onetor father of Phrontis (*Od.* 3) | Suffixed id; parent `laogonus-onetorid` wired |
| `alastor-trojan` | `alastor-pylian`, `alastor-lycian`, `alastor-achaean` | Suffixed id; parent `tros-alastorid` wired |
| `lycaon-pandarusid` | `lycaon`, `lycaon-trojan` | Suffixed id; parent `pandarus` wired |
| `alectryon-boeotian` | Alectryon guardian of dawn (myth) | Suffixed id; parent `leitus` wired |
| `areilycus-achaean` | None | Clean id; `patroclus` slayer wired; parent `prothoenor` (Homer), `arcesilaus` (Hyginus) |
| `otrynteus-trojan` | None | Clean id; parent `iphition-otrynteid` wired |
| `peiros-thracian` | None | Clean id; `thoas-aetolia` slayer wired; slayer `diores-epeian` |
| `imbrasus-thracian` | Samian Imbrasus (Argonautica) | Suffixed id; parent `peiros-thracian` wired |
| `peisenor-trojan` | Peisenor in Odyssey genealogy; Pisenor suitor of Same | Clean id; parent `cleitus-trojan` wired |
| `antimachus-trojan` | `antimachus-dulichium` (suitor); `antimachus-centaur` (Ovid) | Suffixed id; sons `peisander-trojan`, `hippolochus-antimachid`, `hippomachus-antimachid` wired |
| `hippolochus-antimachid` | `hippolochus-lycian` (father of Glaucus) | Suffixed id; parent `bellerophon`; `Peisander` sibling wired |
| `peisander-trojan` | `peisander-same` (suitor) | Suffixed id |
| `hippasus-trojan` | None | Clean id; sons `charops-trojan`, `socus-trojan`, `hypsenor-trojan` wired |
| `lampus-trojan` | Lampus, one of Hector's horses (*Il.* 8) | Suffixed id; parent `laomedon`, son `dolops-trojan` wired |
| `hypsenor-trojan` | None | Clean id; parent `hippasus-trojan`; slayer `deiphobus` wired |
| `hicetaon-trojan` | None | Clean id; parent `laomedon`; sibling `priam`; parent `melanippus-hicetaonid` wired |
| `polyaemon-trojan` | None | Clean id; parent `amopaon-trojan` wired |
| `mentor-trojan` | Odyssey Mentor; suitor Mentor | Suffixed id; parent `imbrius-trojan` wired |
| `medesicaste-trojan` | None | Clean id; parent `priam`; consort `imbrius-trojan` wired |
| `thymoetes-trojan` | Thymoetes Athenian king (Pausanias) | Clean id |
| `clytius-trojan` | `clytius-same`, `clytius-zacynthus`, `clytius-oechalia`; father of `dolops-clytiid` (Achaean, separate) | Suffixed id; sibling `priam`, `hicetaon-trojan`, `lampus-trojan` wired |
| `ucalegon-trojan` | None | Clean id |
| `hyrtacus-trojan` | Samian Imbrasus (Argonautica) | Suffixed id; parent `asius-hyrtacid` wired |
| `merops-percote` | Merops Ethiopia; Ovidic Merops father of Clymene | Suffixed id; parent `adrastus-meropsid`, `araphius-meropsid` wired; `Merops` deferral cleared |
| `phaenops-trojan` | Phaenops at Abydus (*Il.* 17); father of Phorcys in *Il.* 17 | Clean id; parent `xanthus-phaenopid`, `thoon-phaenopid` wired |
| `clytius-achaean` | `clytius-trojan`, suitor homonyms | Suffixed id; parent `dolops-clytiid` wired |
| `tenthredon-magnesia` | None | Clean id; parent `prothous-magnesia` wired |
| `nomion-carion` | None | Clean id; parent `nastes-nomionid`, `amphimachus-nomionid` wired |
| `hippomachus-antimachid` | `hippomachus-zacynthus` (suitor) | Suffixed id; `leonteus-lapith` slayer wired; Antimachus son map now three of three |
| `bucolus-athenian` | None | Clean id; parent `sphelus-athenian` wired |
| `ceas-ciconian` | None | Clean id; parent `troezenus-ciconian` wired |
| `phylacus-phthian` | Phylacus slain by Leïtus (*Il.* 6) | Suffixed id; parent `iphiclus-phthian` wired |
| `aesyetes-trojan` | None | Clean id; parent `alcathous-trojan` wired |
| `theanus-dardanian` | None | Clean id; Apollodorus Dardanian leader only; ally `aeneas`, `archelochus-antenorid`, `acamas-antenorid` wired |
| `creon-achaean` | `creon`, `creon-corinth` | Suffixed id; parent `lycomedes-creonid` wired |
| `hippodameia-trojan` | `hippodameia-lapith`; Pelops' bride; Odyssey maid | Suffixed id; parent `anchises`; consort `alcathous-trojan` wired |
| `rhene-phthian` | Pausanias' Delian island name | Suffixed id; parent `medon-phthian`; Hyginus also names her mother of `ajax-oileus` |
| `eriopis-phthian` | Jason's daughter Eriopis (Pausanias) | Suffixed id; consort `oileus-locris` wired |
| `bucolion-trojan` | `bucolus-athenian` | Suffixed id; parent `laomedon`; sons `aesepus-trojan`, `pedasus-trojan` wired |
| `abarbarea-trojan` | None | Clean id; consort `bucolion-trojan`; twin sons wired |
| `astyoche-minyan` | Astyoche Simoeis, Phylas, Laomedon; Astyocheia mother of Tlepolemus | Suffixed id; parent `ascalaphus-minyan`, `ialmenus-minyan` wired; consort `ares` |
| `actor-azeus` | `actor-argonaut`, `actor-epeian`, Actor father of Menoetius | Suffixed id; palace of Minyan begetting (*Il.* 2) |
| `arsinous-achaean` | `arsinous-mysian` (Epit. 3.35) | Suffixed id; parent `hecamede` wired |
| `hecamede` | None | Clean id; parent `arsinous-achaean`; ally `nestor` |
| `pelegon-paeonian` | None | Clean id; parent `asteropaeus-paeonian` wired; parents `axius-river`, `periboea-paeonian` wired |
| `axius-river` | Scamander (`scamander`) | Suffixed id; parent `pelegon-paeonian`; consort `periboea-paeonian` |
| `periboea-paeonian` | `periboea-oeneus`, `periboea-naiad`, `periboea-phaeacian` | Suffixed id; parent `pelegon-paeonian`; parent `accessamenus-paeonian` |
| `accessamenus-paeonian` | None | Clean id; parent `periboea-paeonian` wired |
| `laodameia-lycian` | Laodameia Protesilaus' wife (*Il.* 2) | Suffixed id; parent `sarpedon`; parent `bellerophon` wired |
| `isander-lycian` | None | Clean id; parent `bellerophon`; slayer `ares` wired |

## 6. Proposed contradiction topics

| Topic id | Competing claims | Citations | Batch |
|---|---|---|---|
| `briseis-parentage` | Homer names no father; Hyginus makes her daughter of the priest Brisa (Fab. 106); Apollodorus Epitome 4.1 conflates her with Chryses' daughter | *Il.* 1; Hyg. Fab. 106; Epit. 4.1 | A (prose only — no parent node yet) |
| `thersites-death` | Homer leaves him alive at Troy's end; Epitome 5.1 has Achilles slay a Thersites who mocked his grief for Penthesilea (post-*Iliad*) | *Il.* 2; Epit. 5.1 | A (prose; Cycle out of scope) |
| `schedius-parentage` | Catalogue and *Il.* 17 name Schedius son of Iphitus; *Il.* 15 names Schedius son of Perimedes when Hector slays a Phocian leader | *Il.* 2.515–545, 15.515–555, 17.275–315 | G (prose + relation `topic`) |
| `pylaemenes-survival` | *Il.* 5 has Menelaus slay Pylaemenes; *Il.* 13 has the same king tend his dying son Harpalion | *Il.* 5.580–625, 13.640–670 | J (prose only) |
| `ennomus-death-timing` | Catalogue foretells Ennomus slain by Achilles in the river; *Il.* 17 still names him among living allied captains | *Il.* 2.860–875, 17.210–245 | J (prose only) |
| `phorcys-phrygian-parentage` | Catalogue and Apollodorus name Phorcys son of Aretaon; *Il.* 17 names him son of Phaenops | *Il.* 2.860–875, 17.275–315; Epit. 3.35 | K (prose only) |
| `merops-sons-name` | Homer names Araphius son of Merops; Apollodorus Epit. 3.35 names Amphius — not the Amphius son of Selagus at *Il.* 5.580 | *Il.* 2.820–855, 11.295–335; Epit. 3.35 | N (prose only) |

## 7. Batch plan

### Batch A — The Wrath spine ✅ (7 figures)

`briseis`, `chryseis`, `chryses-apollo`, `thersites`, `phoenix-myrmidon`, `talthybius`, `eurybates`

The quarrel of Achilles: the plague-priest, the two captives, the ugly railer, the embassy elder, the heralds who lead Briseis away.

### Batch B — The night raid ✅ (5 figures)

`dolon`, `eumedes-herald`, `rhesus`, `eioneus-thrace`, `hippocoon-thrace`

*Iliad* 10: Dolon the spy, his father Eumedes, the Thracian king Rhesus and his kinsman Hippocoön. Homer names Eïoneus as Rhesus' father; Apollodorus names Euterpe or Calliope (`rhesus-mother`, already in docs/CONTRADICTIONS.md). Hypsenor was removed from this batch — the Book 5 and Book 13 Homonyms are not Book-10 figures.

### Batch C — Cretan & Locrian champions ✅ (3 figures)

`idomeneus`, `meriones`, `ajax-oileus` — *Iliad* 2, 4, 13, 16–17. Collision checks: no existing nodes; `ajax-telamonian` kept distinct; Cretan `Deucalion` not merged with flood-hero `deucalion` (parentage in prose until `deucalion-crete` batch).

### Batch D — Trojan counsel & princes ✅ (4 figures + `helenus` wiring)

`antenor`, `polydamas`, `agenor-trojan`, `cebriones` — *Iliad* 3, 6–8, 11–18, 21. `helenus` already in the sky; new ally edges to `hector`, `antenor`, `polydamas`. Collision checks: `antenor` ≠ `antenor-zacynthus`; `agenor-trojan` ≠ Phoenician `agenor` or suitor homonyms; `Panthous` deferred as parent node (prose only in `polydamas`).

### Batch E — Lycian membrane ✅ (2 figures)

`glaucus-lycian`, `pandarus` — *Iliad* 2, 4–7, 12, 16–17. Collision checks: `glaucus-lycian` ≠ `glaucus-corinth` / `glaucus-dulichium`; `Hippolochus` and Trojan `Lycaon` deferred as parent nodes; `patroclus`→`sarpedon` slayer edge added for the membrane.

### Batch F — Boeotian captains ✅ (5 figures)

`peneleos`, `leitus`, `arcesilaus`, `prothoenor`, `clonius` — *Iliad* 2 (Catalog of Ships), 13–17. Fifty ships; parent nodes `Alectryon` and `Areilycus` deferred. Deaths wired to `polydamas`, `hector`, `agenor-trojan`.

### Batch G — Minyan & Phocian captains ✅ (4 figures)

`ascalaphus-minyan`, `ialmenus-minyan`, `schedius-phocis`, `epistrophus-phocis` — *Iliad* 2 (Catalog of Ships), 9, 13–17. Thirty Minyan ships; forty Phocian ships. `schedius-phocis` ≠ `schedius-dulichium`; `epistrophus-phocis` ≠ Lyrnessus/Halizone homonyms; `Astyoche`, `Iphitus` son of Naubolus deferred.

### Batch H — Epeian captains ✅ (4 figures + `elephenor` wiring)

`amphimachus-epeian`, `thalpius-epeian`, `diores-epeian`, `polyxenus-epeian` — *Iliad* 2, 4, 13. Forty Epeian ships (ten each). `elephenor` (Abantes, pre-existing) corrected: slain by `agenor-trojan`, not Ajax. `epeius` (horse-builder) stays distinct. `Peiros` deferred.

### Batch I — Halizones, Magnetes & Lapiths ✅ (5 figures)

`odius-halizone`, `epistrophus-halizone`, `prothous-magnesia`, `leonteus-lapith`, `polypoetes-lapith` — *Iliad* 2, 5, 12. `agamemnon` slayer `odius-halizone`. `Peirithous`, `Tenthredon` wired/deferred; `Coronus` wired in Batch AR (`coronus-gyrton`).

### Batch J — Cyphus, Paphlagonians & Mysians ✅ (5 figures)

`gouneus-cyphus`, `pylaemenes-paphlagon`, `harpalion-paphlagon`, `chromis-mysian`, `ennomus-mysian` — *Iliad* 2, 5, 13, 17. `pylaemenes-paphlagon` ≠ `pylaemenes-dulichium`; `chromis-mysian` / `ennomus-mysian` ≠ Ovidic homonyms; `Bilsates`, `Arsinous` deferred.

### Batch K — Phrygians, Maeonians & Carians ✅ (5 figures + `amphimachus-nomionid` wiring)

`phorcys-phrygian`, `ascanius-phrygian`, `mesthles-maeonian`, `antiphus-maeonian`, `nastes-nomionid` — *Iliad* 2, 13, 17. `amphimachus-nomionid` pre-existing; relations wired. `phorcys-phrygian` ≠ `phorcys`; `antiphus-maeonian` ≠ `antiphus-thessalus-cos`; `nastes-nomionid` ↔ `amphimachus-nomionid`.

### Batch L — Paeonians, Pelasgians & Thracians ✅ (5 figures)

`pyraechmes-paeonian`, `asteropaeus-paeonian`, `hippothous-pelasgian`, `pylaeus-pelasgian`, `acamas-thracian` — *Iliad* 2, 6, 12, 16–17, 21. `hippothous-pelasgian` ≠ Priam's son; `acamas-thracian` ≠ `acamas-dulichium` / Antenor's son (deferred).

### Batch M — Cicones, Dardanian princes & Asius ✅ (5 figures)

`euphemus-ciconian`, `peirous-thracian`, `archelochus-antenorid`, `acamas-antenorid`, `asius-hyrtacid` — *Iliad* 2, 6, 11–14. `euphemus-ciconian` ≠ `euphemus`; `acamas-antenorid` ≠ `acamas-thracian`; `asius-hyrtacid` ≠ Hecuba's brother Asius (prose).

### Batch N — Merops' sons, Antenor's third son, Alcathous & Medon ✅ (5 figures)

`adrastus-meropsid`, `araphius-meropsid`, `polybus-antenorid`, `alcathous-trojan`, `medon-phthian` — *Iliad* 2, 11–13, 15. `adrastus-meropsid` ≠ `adrastus`; `araphius-meropsid` vs Apollodorus' Amphius (`merops-sons-name` topic); `polybus-antenorid` ≠ suitor homonyms; `medon-phthian` ≠ `medon-ithaca` / `medon-dulichium`; `Merops`, `Hippodameia` deferred; `Aesyetes` wired in Batch AU.

### Batch O — Iasus, rally captains & Book 15 deaths ✅ (5 figures)

`iasus-athenian`, `deisenor-trojan`, `thersilochus-paeonian`, `mecisteus-echius`, `deiochus-achaean` — *Iliad* 8, 13, 15, 17, 21. `iasus-athenian` ≠ `iasus-arcadia`; `thersilochus-paeonian` ≠ `thersilochus-dulichium`; `mecisteus-echius` ≠ `mecisteus-aeolid` / `mecisteus-dulichium`; `Echius` slain by Polites and `Chroraius` deferred.

### Batch P — Echius, Polites, Chroraius & Paeonian rout ✅ (5 figures)

`echius-achaean`, `chroraus-trojan`, `polites-trojan`, `mydon-paeonian`, `astypylus-paeonian` — *Iliad* 2, 13, 15, 17, 21, 24. `echius-achaean` parent `mecisteus-echius`; `polites-trojan` ≠ Odysseus' comrade; `mydon-paeonian` ≠ Mydon son of Atymnius; `Mnesus`, `Thrasius`, `Aenius`, `Ophelestes` deferred.

### Batch Q — Alastor & Scamander Paeonians ✅ (5 figures)

`alastor-achaean`, `mnesus-paeonian`, `thrasius-paeonian`, `aenius-paeonian`, `ophelestes-paeonian` — *Iliad* 8, 13, 21. `alastor-achaean` ≠ Nestor's and Lycian homonyms; `ophelestes-paeonian` ≠ Trojan Ophelestes (*Il.* 8); Paeonian rout cluster beside `thersilochus-paeonian` now complete.

### Batch R — Ophelestes, Priam's sons & ransom roll ✅ (5 figures)

`ophelestes-trojan`, `pammon-trojan`, `antiphonus-trojan`, `agathon-trojan`, `dius-trojan` — *Iliad* 8, 24; Apollodorus 3.12.5. `ophelestes-trojan` ≠ `ophelestes-paeonian`; `antiphonus-trojan` ≠ Apollodorus' Antiphus; `helenus` sibling wiring.

### Batch S — Teucer victims, Hippothous & Hicetaon's Melanippus ✅ (5 figures)

`orsilochus-trojan`, `ormenus-trojan`, `melanippus-trojan`, `hippothous-trojan`, `melanippus-hicetaonid` — *Iliad* 8, 15, 24. Teucer roll four of eight deferred to Batch T; `hippothous-trojan` completes Priam's nine-son ransom list; `nestor` slayer `melanippus-hicetaonid`.

### Batch T — Teucer roll complete & Chromius homonyms ✅ (5 figures)

`daetor-trojan`, `chromius-trojan`, `lycophontes-trojan`, `amopaon-trojan`, `chromius-priamid` — *Iliad* 5, 8. Teucer roll now complete (eight of eight); `chromius-trojan` ≠ `chromius-priamid` (Diomedes victim) ≠ Nestor's comrade or Lycian Chromius (Batch U); `Polyaemon`, `Echemmon` deferred as parent/sibling nodes.

### Batch U — Echemmon, Chromius homonyms & Nestor's Pylians ✅ (5 figures)

`echemmon-priamid`, `chromius-pylian`, `chromius-lycian`, `alastor-pylian`, `bias-pylian` — *Iliad* 4, 5. Chromius homonym map complete (four nodes); Nestor's *Il.* 4 company three of five (`Pelagon`, `Haemon` deferred to Batch V); `echemmon-priamid` sibling `chromius-priamid`.

### Batch V — Nestor's company complete & Lycian rout ✅ (5 figures)

`pelagon-pylian`, `haemon-pylian`, `coeranus-lycian`, `alcandrus-lycian`, `halius-lycian` — *Iliad* 4, 5, 17. Nestor's *Il.* 4 company now complete (five of five); Lycian rout four of seven (`alastor-lycian`, `noemon-lycian`, `prytanis-lycian` deferred to Batch W); `coeranus-lycian` ≠ `coeranus-lyctian`; `haemon-pylian` ≠ `haemon`.

### Batch W — Lycian rout complete, Coeranus & Podarces ✅ (5 figures)

`noemon-lycian`, `prytanis-lycian`, `alastor-lycian`, `coeranus-lyctian`, `podarces-phthian` — *Iliad* 2, 5, 13, 17. Lycian rout now complete (seven of seven); `coeranus-lyctian` ≠ `coeranus-lycian`; Alastor homonym map complete (three nodes); `noemon-lycian` ≠ Odyssey Noëmon; `Protesilaus` deferred to Batch X.

### Batch X — Protesilaus, Athenians, Euphorbus & battle roll ✅ (5 figures)

`protesilaus`, `stichius-athenian`, `euphorbus-trojan`, `imbrius-trojan`, `dracius-epeian` — *Iliad* 2, 13, 16–17. `protesilaus` sibling `podarces-phthian`; `euphorbus-trojan` sibling `polydamas`; `menelaus` slayer `euphorbus-trojan`; `teucer` slayer `imbrius-trojan`; `Pheidas`, `bias-athenian`, `Araphion`, `Mentor`, `Medesicaste` deferred.

### Batch Y — Athenian & Epeian captains, Cleitus & Croesmus ✅ (5 figures)

`pheidas-athenian`, `bias-athenian`, `araphion-epeian`, `cleitus-trojan`, `croesmus-trojan` — *Iliad* 13, 15. Menestheus' picked Athenians complete (`stichius-athenian`, `pheidas-athenian`, `bias-athenian`); Meges' Epeian captains complete (`dracius-epeian`, `araphion-epeian`); `teucer` slayer `cleitus-trojan`; `polydamas` slayer `croesmus-trojan`; `Peisenor`, `dolops-trojan` deferred.

### Batch Z — Agamemnon's Book 11 roll & Dolops ✅ (5 figures)

`thoon-trojan`, `eunomus-trojan`, `chersidamas-trojan`, `charops-trojan`, `dolops-trojan` — *Iliad* 11, 15. Agamemnon's *Il.* 11 onrush complete with Batch AA (`deiopites-trojan`); `dolops-trojan` ≠ `dolops-clytiid`; `Hippasus`, `Socus`, `Lampus` wired; `Priam` parent edges for `deiopites-trojan`, `chersidamas-trojan` cleared in Batch AU.

### Batch AA — Deïopites, Socus, Dolops homonym & Phaenops' sons ✅ (5 figures)

`deiopites-trojan`, `socus-trojan`, `dolops-clytiid`, `thoon-phaenopid`, `xanthus-phaenopid` — *Iliad* 5, 11. Agamemnon's *Il.* 11 roll now five of five; `socus-trojan` sibling `charops-trojan`; `dolops-clytiid` Achaean leader ≠ `dolops-trojan`; Phaenops' sons paired.

### Batch AB — Hector's Danaan roll (first five) ✅ (5 figures)

`asaeus-achaean`, `autonous-achaean`, `opites-achaean`, `opheltius-achaean`, `agelaus-achaean` — *Iliad* 11.295–335. Hector's nine-leader roll five of nine (`dolops-clytiid` entered Batch AA).

### Batch AC — Hector's roll complete & homonyms ✅ (5 figures)

`aesymnus-achaean`, `orus-achaean`, `hipponous-achaean`, `autonous-trojan`, `opheltius-trojan` — *Iliad* 6, 11, 16. Hector's nine-leader roll now nine of nine; `autonous-trojan` ≠ `autonous-achaean`; `opheltius-trojan` ≠ `opheltius-achaean`; `dresus-trojan` deferred to Batch AD.

### Batch AD — Book 6 deaths & Patroclus roll (first three) ✅ (5 figures)

`dresus-trojan`, `adrastus-trojan`, `aesepus-trojan`, `pedasus-trojan`, `echeclus-trojan` — *Iliad* 6, 16. Euryalus' *Il.* 6 chain now four of four (`dresus`, `opheltius`, `aesepus`, `pedasus`); Patroclus roll three of nine (`adrastus-trojan`, `autonous-trojan`, `echeclus-trojan`); `adrastus-trojan` ≠ `adrastus` / `adrastus-meropsid`; `echeclus-trojan` ≠ future `echeclus-agenorid` (*Il.* 20).

### Batch AE — Patroclus roll complete ✅ (6 figures)

`perimus-trojan`, `epistor-trojan`, `melanippus-patroclus-roll`, `elasus-trojan`, `mulius-trojan`, `pylartes-trojan` — *Iliad* 16.660–695. Patroclus roll now nine of nine; `melanippus-patroclus-roll` ≠ `melanippus-trojan` / `melanippus-hicetaonid`; `mulius-trojan` ≠ future Achilles victim (*Il.* 20); `Megas` parent deferred.

### Batch AF — Book 6 ransom, *Iliad* 20 homonyms & Priam stemma ✅ (5 figures)

`adrastus-trojan-ransom`, `echeclus-agenorid`, `mulius-iliad20`, `hipponous-trojan`, `melanippus-achaean` — *Iliad* 6, 19, 20; Apollodorus 3.12.5. `adrastus-trojan-ransom` ≠ `adrastus-trojan`; `echeclus-agenorid` parent `agenor-trojan`; `mulius-iliad20` ≠ `mulius-trojan`; `hipponous-trojan` Apollodorus-only prince; `melanippus-achaean` completes Melanippus homonym map.

### Batch AG — Mulius homonym complete & *Iliad* 20 rout (first three) ✅ (5 figures)

`mulius-augeiad`, `lycomedes-creonid`, `deucalion-trojan`, `dryops-trojan`, `demuchus-trojan` — *Iliad* 11, 19, 20. Mulius homonym map now three of three; `lycomedes-creonid` ≠ `lycomedes-skyros`; `deucalion-trojan` ≠ `deucalion` / `deucalion-crete`; `Philetor` wired; `Creon` wired in Batch AU (`creon-achaean`).

### Batch AH — *Iliad* 20–21 rout & Megas ✅ (5 figures)

`laogonus-trojan`, `dardanus-trojan`, `megas-trojan`, `lycaon-trojan`, `tros-alastorid` — *Iliad* 16, 20–21. Sons of Bias (`laogonus-trojan`, `dardanus-trojan`) ≠ `dardanus` primordial / `laogonus-onetorid` (deferred); `megas-trojan` parent of `perimus-trojan`; `lycaon-trojan` Priam son ≠ `lycaon` Arcadian / Pandarus' father; `tros-alastorid` ≠ `tros` eponym; `Bias`, `Alastor` (Trojan) parents deferred.

### Batch AI — *Iliad* 16 Laogonus & *Iliad* 20 rout (first four) ✅ (5 figures)

`laogonus-onetorid`, `iphition-otrynteid`, `demoleon-antenorid`, `hippodamas-trojan`, `polydorus-priamid` — *Iliad* 16, 20–21. Laogonus homonym map now two of two; `demoleon-antenorid` brother of `archelochus-antenorid` / `acamas-antenorid`; `polydorus-priamid` ≠ Theban / Epigoni / Zacynthian homonyms; `hipponous-trojan` sibling edge corrected; `Onetor`, `Otrynteus` parents deferred.

### Batch AJ — *Iliad* 20 parent nodes & Pandarus' Lycaon ✅ (5 figures)

`philetor-trojan`, `bias-trojan`, `onetor-trojan`, `alastor-trojan`, `lycaon-pandarusid` — *Iliad* 16, 20; *Iliad* 2, 4. *Il.* 20.455–485 victim roll now complete; Lycaon homonym map now three of three; Alastor homonym map now four of four; `Bias` / `Philetor` / `Onetor` / `Alastor` parent deferrals cleared.

### Batch AK — Catalog parents & *Iliad* 4 Thracians ✅ (5 figures)

`alectryon-boeotian`, `areilycus-achaean`, `otrynteus-trojan`, `peiros-thracian`, `imbrasus-thracian` — *Iliad* 4, 14, 16, 17, 20. Boeotian parent deferrals (`Alectryon`, `Areilycus`) cleared; `Otrynteus` parent wired; Peiros–Diores–Thoas chain complete.

### Batch AL — Hyginus Boeotian parents & Trojan elders ✅ (5 figures)

`theobula-boeotian`, `lacritus-boeotian`, `cleobule-boeotian`, `hippolochus-lycian`, `panthous-trojan` — Hyginus *Fabulae* 97; *Iliad* 3, 6, 12, 16–17. Hyginus Boeotian parent deferrals (`Theobula`, `Lacritus`, `Cleobule`) cleared; `Hippolochus` (Lycian) and `Panthous` parent deferrals cleared; `cleobule-boeotian` ≠ Arcadian Cleobule; Hippolochus homonym map now two of two.

### Batch AM — Trojan parent nodes & Antimachus' sons ✅ (6 figures)

`peisenor-trojan`, `hippolochus-antimachid`, `hippasus-trojan`, `lampus-trojan`, `antimachus-trojan`, `peisander-trojan` — *Iliad* 3, 11, 15. Parent deferrals cleared for `Peisenor`, `Hippasus`, `Lampus`, `Antimachus`; `hippolochus-antimachid` ≠ `hippolochus-lycian`; `antimachus-trojan` ≠ `antimachus-dulichium`; `peisander-trojan` ≠ `peisander-same`; `lampus-trojan` ≠ Hector's horse Lampus.

### Batch AN — Hippasus' third son, Hicetaon, Polyaemon, Mentor & Medesicaste ✅ (5 figures)

`hypsenor-trojan`, `hicetaon-trojan`, `polyaemon-trojan`, `mentor-trojan`, `medesicaste-trojan` — *Iliad* 8, 13, 15, 20. `hypsenor-trojan` completes Hippasus' sons; `hicetaon-trojan` elder deferral cleared; `Polyaemon`, `Mentor`, `Medesicaste` deferrals cleared; `mentor-trojan` ≠ Odyssey Mentor.

### Batch AO — Scaean Gate elders & catalog parents ✅ (5 figures)

`thymoetes-trojan`, `clytius-trojan`, `ucalegon-trojan`, `hyrtacus-trojan`, `merops-percote` — *Iliad* 2–3, 11–12, 20. Scaean Gate elder roll now complete with Batch AL (`panthous-trojan`, `lampus-trojan`, `hicetaon-trojan`, `antenor`); `clytius-trojan` ≠ father of `dolops-clytiid`; `hyrtacus-trojan` parent deferral cleared; `Merops` parent deferral cleared; `thymoetes-trojan` ≠ Athenian Thymoetes.

### Batch AP — Catalog parents & Antimachus' third son ✅ (5 figures)

`phaenops-trojan`, `clytius-achaean`, `tenthredon-magnesia`, `nomion-carion`, `hippomachus-antimachid` — *Iliad* 2, 5, 11–12. Parent deferrals (`Phaenops`, `Tenthredon`, `Nomion`, Achaean `Clytius`) cleared; Antimachus son map now three of three; `phaenops-trojan` ≠ Il. 17 Phaenops homonyms; `clytius-achaean` ≠ `clytius-trojan`; `hippomachus-antimachid` ≠ `hippomachus-zacynthus`.

### Batch AQ — Epeian & Phrygian catalog parents ✅ (5 figures)

`cteatus-epeian`, `eurytus-epeian`, `amarynceus-epeian`, `agasthenes-epeian`, `aretaon-phrygian` — *Iliad* 2, 4, 13, 23; Epit. 3.35; *Descr.* 5.1–5.3. Epeian parent deferrals (`Cteatus`, `Eurytus`, `Amarynceus`, `Agasthenes`) cleared; `Aretaon` parent deferral cleared; `eurytus-epeian` ≠ `eurytus-oechalia` / `eurytus-hermes`; `Augeias` still deferred.

### Batch AR — Catalog parents & Lapith stemma ✅ (5 figures)

`actor-epeian`, `talaemenes-maeonian`, `arsinous-mysian`, `coronus-gyrton` (enriched), `iphitus-phocis` (enriched) — *Iliad* 2; Epit. 3.34–3.35; *Bibl.* 2.7.2. Parent deferrals cleared; `coronus-gyrton` used instead of new `coronus-lapith`; `actor-epeian` ≠ `actor-argonaut`; `arsinous-mysian` ≠ *Il.* 11 Arsinous (Hecamede's father, deferred).

### Batch AS — Remaining catalog parents ✅ (5 figures)

`naubolus-phocis`, `bilsates-paphlagon`, `lethus-pelasgian`, `mecisteus-halizone`, `augeas` (enriched) — *Iliad* 2, 5, 17; Epit. 3.34–3.35; *Bibl.* 1.9.16. `Augeias`, `Naubolus`, `Bilsates`, `Lethus`, `Mecisteus` (Halizone) parent deferrals cleared; `augeas` used instead of new `augeias-epeian`; `mecisteus-halizone` ≠ `mecisteus-aeolid` / `mecisteus-echius` / `mecisteus-dulichium`; `naubolus-phocis` ≠ *Od.* 8 Naubolus; `Teutamus`, `Pelasgus` (Larissa) cleared in Batch AT.

### Batch AT — Pelasgian, Epeian & allied parent nodes ✅ (7 figures)

`teutamus-pelasgian`, `molione-epeian`, `pelasgus-larissa`, `troezenus-ciconian`, `sphelus-athenian`, `iphiclus-phthian`, `eusorus-thracian` — *Iliad* 2, 6, 11, 13, 15; Epit. 3.34–3.35; *Bibl.* 2.7.2. Parent deferrals cleared; `pelasgus-larissa` ≠ `pelasgus-arcadia`; `iphiclus-phthian` ≠ `iphiclus-thestiad`; `eusorus-thracian` ≠ Propontis Eusorus; `hippothous-pelasgian-parentage` dispute wired; `Phylacus`, `Bucolus`, `Ceas` cleared in Batch AU.

### Batch AU — Athenian, Phthian, Trojan & Dardanian parent nodes ✅ (6 figures)

`bucolus-athenian`, `ceas-ciconian`, `phylacus-phthian`, `aesyetes-trojan`, `theanus-dardanian`, `creon-achaean` — *Iliad* 2, 6, 13, 15, 19; Epit. 3.34; *Bibl.* 3.12.5. `Bucolus`, `Ceas`, `Phylacus` (Phthian), `Aesyetes`, `Theanus`, `Creon` (Achaean) parent deferrals cleared; `priam` parent edges for `deiopites-trojan`, `chersidamas-trojan`; `phylacus-phthian` ≠ Pedasus homonym (*Il.* 6); `creon-achaean` ≠ `creon` / `creon-corinth`; `theanus-dardanian` Apollodorus-only (Homer names Aeneas alone for the Dardanians); `Hippodameia`, `Rhene`, `Eriopis` cleared in Batch AV.

### Batch AV — Anchises' daughter, Oileus' household & Bucolion stemma ✅ (5 figures)

`hippodameia-trojan`, `rhene-phthian`, `eriopis-phthian`, `bucolion-trojan`, `abarbarea-trojan`, `calybe-nymph` — *Iliad* 2, 6, 13, 15; *Bibl.* 3.12.3, 3.12.5; Fabulae 97. `Hippodameia`, `Rhene`, `Eriopis`, `Bucolion`, `Abarbarea` deferrals cleared; `priam` parent edge for `bias-trojan`; `hippodameia-trojan` ≠ `hippodameia-lapith` / Pelops' bride; `bucolion-trojan` ≠ `bucolus-athenian`; Hyginus names `rhene-phthian` mother of `ajax-oileus` (Homer silent); Apollodorus names Bucolion's mother `calybe-nymph` — rival to Homer's `abarbarea-trojan` (`bucolion-mother`).

### Batch AW — Hecuba stemma & Apollodorus Priam sons ✅ (8 relations)

`hecuba` parent edges for `pammon-trojan`, `polites-trojan`, `antiphonus-trojan`, `hipponous-trojan`, `polydorus-priamid`; `priam` parent edges for `dryops-trojan`, `hippodamas-trojan`, `melanippus-trojan` — *Bibl.* 3.12.5. Completes Hecuba's son-roll beside pre-existing `deiphobus`, `helenus`, `troilus`; Apollodorus' Antiphus = Homer's `antiphonus-trojan` (prose only); `melanippus-trojan` ≠ `melanippus-hicetaonid` / Patroclus-roll / Achaean homonyms.

### Batch AX — Minyan, Nestor's hut & Paeonian parent nodes ✅ (5 figures)

`astyoche-minyan`, `actor-azeus`, `arsinous-achaean`, `hecamede`, `pelegon-paeonian` — *Iliad* 2, 11, 14, 21. `Astyoche` and `Actor` (Azeus) Minyan deferrals cleared; `Arsinous` (Hecamede's father) ≠ `arsinous-mysian`; `Pelegon` parent deferral cleared; `Axius`, `Periboea`, `Acessamenus` cleared in Batch AY.

### Batch AY — Paeonian river & Bellerophon Lycian stemma ✅ (5 figures)

`axius-river`, `periboea-paeonian`, `accessamenus-paeonian`, `laodameia-lycian`, `isander-lycian` — *Iliad* 2, 6, 16, 21. Paeonian river parentage cleared; `bellerophon` parent edges for `hippolochus-lycian`, `laodameia-lycian`, `isander-lycian`; `laodameia-lycian` mother of `sarpedon` in the Iliadic stemma (Apollodorus' Europa line prose on `sarpedon` unchanged); `periboea-paeonian` ≠ Oeneus / Penelope / Phaeacian homonyms; `ares` slayer `isander-lycian`.

### Batch AZ → — Remaining catalog parents (deferred)

Remaining Priam stemma edges, catalog Boeotian dispute topics, and other deferred parent nodes from the collision list.

## 8. Relation notes

### Batch A

- `chryseis` → parent `chryses-apollo`
- `chryseis` consort `agamemnon` (prize of honour)
- `briseis` consort `achilles` (prize of valour)
- `chryses-apollo` ally `apollo`; adversary `agamemnon` (the dishonour that loosed the plague)
- `phoenix-myrmidon` ally `achilles` (tutor and embassy envoy)
- `talthybius`, `eurybates` ally `agamemnon` (heralds)
- `eurybates` ally `odysseus` (picked up the cloak at the assembly, *Il.* 2.184)
- `thersites` parent `agrius-aetolian` (Apollodorus 1.8.6); adversary `agamemnon` (reviled the king); `odysseus` adversary `thersites` (beat him with the sceptre)

### Batch B

- `dolon` parent `eumedes-herald`; ally `hector`; slain by `diomedes`
- `rhesus` parent `eioneus-thrace` (Homer) vs `euterpe`/`calliope` (`rhesus-mother`); slain by `diomedes`
- `hippocoon-thrace` ally `rhesus` (kinsman roused by Athene's dream)
- `odysseus` ally `diomedes` (the night raid, *Il.* 10)

### Batch C

- `idomeneus` ally `meriones`, `agamemnon`
- `meriones` ally `idomeneus`
- `ajax-oileus` ally `ajax-telamonian` (the twain Aiantes), `odysseus` (first to Patroclus' body)

### Batch D

- `antenor` parent `agenor-trojan`; ally `priam`, `helenus`; adversary `paris` (return-Helen counsel rejected)
- `agenor-trojan` parent `antenor`; ally `hector`; adversary `achilles` (stand at the Scaean Gate, *Il.* 21)
- `polydamas` ally `hector` (night-born comrade), `helenus`
- `cebriones` parent `priam`; sibling `hector`; ally `hector` (charioteer); slain by `patroclus`
- `helenus` ally `hector`, `antenor`, `polydamas` (existing node — relations only)

### Batch E

- `glaucus-lycian` ally `sarpedon`, `diomedes` (guest-friendship), `hector`; adversary `teucer` (arm wound)
- `pandarus` adversary `menelaus`, `athena`, `diomedes`; ally `aeneas`; slain by `diomedes`
- `patroclus` slayer `sarpedon` (membrane closure)

### Batch F

- `peneleos`, `leitus`, `arcesilaus`, `prothoenor`, `clonius` ally `agamemnon` (fifty Boeotian ships, *Il.* 2)
- `arcesilaus` ally `menestheus` (trusty comrade at the wall)
- `polydamas` slayer `prothoenor`; adversary `peneleos` (wound)
- `hector` slayer `arcesilaus`; adversary `leitus` (wrist wound)
- `agenor-trojan` slayer `clonius`

### Batch G

- `ascalaphus-minyan`, `ialmenus-minyan` parent `ares`; sibling each other; ally `agamemnon`
- `ascalaphus-minyan` ally `idomeneus`; slain by `deiphobus`
- `schedius-phocis`, `epistrophus-phocis` ally `agamemnon` and each other
- `hector` slayer `schedius-phocis` (`schedius-parentage` topic)

### Batch H

- `amphimachus-epeian`, `thalpius-epeian`, `diores-epeian`, `polyxenus-epeian` ally `agamemnon`; Amphimachus↔Thalpius; Diores↔Polyxenus
- `hector` slayer `amphimachus-epeian`
- `elephenor` ally `agamemnon`; slain by `agenor-trojan` (existing node — story fix + relations)

### Batch I

- `odius-halizone`, `epistrophus-halizone` ally `agamemnon` and each other; `agamemnon` slayer `odius-halizone`
- `prothous-magnesia` ally `agamemnon` (forty Magnet ships)
- `leonteus-lapith`, `polypoetes-lapith` ally `agamemnon` and each other (forty Lapith ships; centaur war at Pelium)

### Batch J

- `gouneus-cyphus` ally `agamemnon` (twenty-two ships from Cyphus)
- `pylaemenes-paphlagon` ally `agamemnon`; parent `harpalion-paphlagon`; `menelaus` slayer `pylaemenes-paphlagon`
- `meriones` slayer `harpalion-paphlagon`; `paris` ally `harpalion-paphlagon` (wroth at his death)
- `chromis-mysian`, `ennomus-mysian` ally `agamemnon` and each other; `achilles` slayer `ennomus-mysian`

### Batch K

- `phorcys-phrygian`, `ascanius-phrygian` ally `agamemnon` and each other; `ajax-telamonian` slayer `phorcys-phrygian`
- `mesthles-maeonian`, `antiphus-maeonian` ally `agamemnon` and each other (sons of Talaemenes)
- `nastes-nomionid`, `amphimachus-nomionid` ally `agamemnon` and each other; `achilles` slayer `nastes-nomionid`; `poseidon` slayer `amphimachus-nomionid`

### Batch L

- `pyraechmes-paeonian` ally `agamemnon`; `patroclus` slayer `pyraechmes-paeonian`
- `asteropaeus-paeonian` ally `agamemnon`, `sarpedon`; `achilles` slayer `asteropaeus-paeonian`
- `hippothous-pelasgian`, `pylaeus-pelasgian` ally `agamemnon` and each other; `ajax-telamonian` slayer `hippothous-pelasgian`
- `acamas-thracian` ally `agamemnon`; `agamemnon` slayer `acamas-thracian`

### Batch M

- `euphemus-ciconian` ally `agamemnon`
- `peirous-thracian` ally `agamemnon`, `acamas-thracian`
- `archelochus-antenorid`, `acamas-antenorid` parent `antenor`; ally `aeneas` and each other; `ajax-telamonian` slayer `archelochus-antenorid`
- `acamas-antenorid` ally `agenor-trojan`
- `asius-hyrtacid` ally `agamemnon`; `idomeneus` slayer `asius-hyrtacid`

### Batch N

- `adrastus-meropsid`, `araphius-meropsid` ally `agamemnon` and each other; `diomedes` slayer both (chariot-team, *Il.* 11)
- `antenor` parent `polybus-antenorid`; `polybus-antenorid` ally `acamas-antenorid`, `agenor-trojan`
- `alcathous-trojan` ally `aeneas`, `paris`, `anchises`; `idomeneus` slayer `alcathous-trojan`
- `medon-phthian` ally `agamemnon`, `ajax-oileus`; `aeneas` slayer `medon-phthian`

### Batch O

- `iasus-athenian` ally `menestheus`, `agamemnon`; `aeneas` slayer `iasus-athenian`
- `deisenor-trojan` ally `hector`, `asteropaeus-paeonian`
- `thersilochus-paeonian` ally `agamemnon`, `asteropaeus-paeonian`, `pyraechmes-paeonian`, `hector`; `achilles` slayer `thersilochus-paeonian`
- `mecisteus-echius` ally `agamemnon`; `polydamas` slayer `mecisteus-echius`
- `deiochus-achaean` ally `agamemnon`; `paris` slayer `deiochus-achaean`

### Batch P

- `echius-achaean` parent `mecisteus-echius`; ally `agamemnon`; `polites-trojan` slayer `echius-achaean`
- `priam` parent `polites-trojan`; `polites-trojan` sibling `deiphobus`, ally `hector`
- `chroraus-trojan` ally `hector`, `deisenor-trojan`
- `mydon-paeonian`, `astypylus-paeonian` ally `agamemnon`, `thersilochus-paeonian`, `asteropaeus-paeonian`; `achilles` slayer both

### Batch Q

- `alastor-achaean` ally `mecisteus-echius`, `agamemnon`
- `mnesus-paeonian`, `thrasius-paeonian`, `aenius-paeonian`, `ophelestes-paeonian` ally `agamemnon`, `thersilochus-paeonian`; `achilles` slayer all four

### Batch R

- `teucer` slayer `ophelestes-trojan`; ally `hector`
- `priam` parent `pammon-trojan`, `antiphonus-trojan`, `agathon-trojan`, `dius-trojan`
- `pammon-trojan` sibling `helenus`, `polites-trojan`, `deiphobus`, `antiphonus-trojan`, `agathon-trojan`, `dius-trojan`; ally `hector`, `paris`
- `antiphonus-trojan`, `agathon-trojan`, `dius-trojan` ally `hector`

### Batch S

- `teucer` slayer `orsilochus-trojan`, `ormenus-trojan`, `melanippus-trojan`
- `priam` parent `hippothous-trojan`; `hippothous-trojan` sibling `pammon-trojan`, ally `hector`, `priam`
- `melanippus-hicetaonid` ally `hector`, `priam`; `nestor` slayer `melanippus-hicetaonid`

### Batch T

- `teucer` slayer `daetor-trojan`, `chromius-trojan`, `lycophontes-trojan`, `amopaon-trojan`; ally `hector` for all four
- `priam` parent `chromius-priamid`; `diomedes` slayer `chromius-priamid`; ally `hector`, `priam`

### Batch U

- `priam` parent `echemmon-priamid`; `echemmon-priamid` sibling `chromius-priamid`; `diomedes` slayer `echemmon-priamid`; ally `hector`, `priam`
- `chromius-pylian`, `alastor-pylian`, `bias-pylian` ally `nestor`, `agamemnon`
- `odysseus` slayer `chromius-lycian`; ally `hector`, `sarpedon`

### Batch V

- `pelagon-pylian`, `haemon-pylian` ally `nestor`, `agamemnon`
- `odysseus` slayer `coeranus-lycian`, `alcandrus-lycian`, `halius-lycian`; ally `hector`, `sarpedon` for all three

### Batch W

- `odysseus` slayer `noemon-lycian`, `prytanis-lycian`, `alastor-lycian`; ally `hector`, `sarpedon` for all three
- `hector` slayer `coeranus-lyctian`; ally `meriones`, `idomeneus`, `agamemnon`
- `podarces-phthian` ally `agamemnon`, `medon-phthian`

### Batch X

- `protesilaus` sibling `podarces-phthian`; ally `agamemnon`, `podarces-phthian`
- `stichius-athenian` ally `menestheus`, `agamemnon`
- `euphorbus-trojan` sibling `polydamas`; adversary `patroclus`; `menelaus` slayer `euphorbus-trojan`; ally `hector`, `polydamas`
- `teucer` slayer `imbrius-trojan`; ally `hector`, `priam`
- `dracius-epeian` ally `meges-dulichium`, `agamemnon`

### Batch Y

- `pheidas-athenian`, `bias-athenian` ally `menestheus`, `agamemnon`; `pheidas-athenian` ally `stichius-athenian`
- `araphion-epeian` ally `meges-dulichium`, `dracius-epeian`, `agamemnon`
- `teucer` slayer `cleitus-trojan`; ally `polydamas`, `hector`
- `polydamas` slayer `croesmus-trojan`; ally `hector`

### Batch Z

- `agamemnon` slayer `thoon-trojan`, `eunomus-trojan`, `chersidamas-trojan`, `charops-trojan`; ally `hector` for all four
- `dolops-trojan` adversary `meges-dulichium`; ally `hector`, `polydamas`

### Batch AA

- `agamemnon` slayer `deiopites-trojan`; ally `hector`
- `socus-trojan` adversary `odysseus`; sibling `charops-trojan`; ally `hector`
- `hector` slayer `dolops-clytiid`; ally `agamemnon`
- `diomedes` slayer `thoon-phaenopid`, `xanthus-phaenopid`; siblings each other; ally `hector` for both

### Batch AB

- `hector` slayer `asaeus-achaean`, `autonous-achaean`, `opites-achaean`, `opheltius-achaean`, `agelaus-achaean`; ally `agamemnon` for all five

### Batch AC

- `hector` slayer `aesymnus-achaean`, `orus-achaean`, `hipponous-achaean`; ally `agamemnon` for all three
- `patroclus` slayer `autonous-trojan`; ally `hector`
- `euryalus-aeolid` slayer `opheltius-trojan`; ally `hector`

### Batch AD

- `euryalus-aeolid` slayer `dresus-trojan`, `aesepus-trojan`, `pedasus-trojan`; ally `hector` for all three
- `aesepus-trojan` sibling `pedasus-trojan`; `Bucolion`, `Abarbarea`, `laomedon` in prose only
- `patroclus` slayer `adrastus-trojan`, `echeclus-trojan`; ally `hector` for both

### Batch AE

- `patroclus` slayer `perimus-trojan`, `epistor-trojan`, `melanippus-patroclus-roll`, `elasus-trojan`, `mulius-trojan`, `pylartes-trojan`; ally `hector` for all six

### Batch AF

- `agamemnon` slayer `adrastus-trojan-ransom`; ally `hector`
- `achilles` slayer `echeclus-agenorid`, `mulius-iliad20`; ally `hector` for both; ally `melanippus-achaean`
- `agenor-trojan` parent `echeclus-agenorid`
- `priam` parent `hipponous-trojan`; siblings `pammon-trojan`, `helenus`, `polites-trojan`, `deiphobus`, `troilus`, `polydorus`; ally `hector`, `priam`
- `melanippus-achaean` ally `nestor`, `meges-dulichium`, `thoas-aetolia`, `meriones`, `odysseus`

### Batch AG

- `nestor` slayer `mulius-augeiad`
- `achilles` ally `lycomedes-creonid`; ally `melanippus-achaean`, `nestor`, `meges-dulichium`, `thoas-aetolia`, `meriones`, `odysseus`, `agamemnon`
- `achilles` slayer `deucalion-trojan`, `dryops-trojan`, `demuchus-trojan`; ally `hector` for all three

### Batch AH

- `achilles` slayer `laogonus-trojan`, `dardanus-trojan`, `lycaon-trojan`, `tros-alastorid`; ally `hector` for all four
- `laogonus-trojan` sibling `dardanus-trojan`; ally `hector`
- `megas-trojan` parent `perimus-trojan`; ally `hector`
- `priam` parent `lycaon-trojan`; ally `lycaon-trojan`, `hector`

### Batch AI

- `meriones` slayer `laogonus-onetorid`; ally `hector`
- `achilles` slayer `iphition-otrynteid`, `demoleon-antenorid`, `hippodamas-trojan`, `polydorus-priamid`; ally `hector` for all four
- `antenor` parent `demoleon-antenorid`; siblings `archelochus-antenorid`, `acamas-antenorid`
- `priam` parent `polydorus-priamid`; sibling `lycaon-trojan`; ally `polydorus-priamid`, `hector`
- `hipponous-trojan` sibling `polydorus-priamid` (corrected from `polydorus`)

### Batch AJ

- `philetor-trojan` parent `demuchus-trojan`; ally `hector`
- `bias-trojan` parent `laogonus-trojan`, `dardanus-trojan`; ally `hector`
- `onetor-trojan` parent `laogonus-onetorid`; ally `hector`
- `alastor-trojan` parent `tros-alastorid`; ally `hector`
- `lycaon-pandarusid` parent `pandarus`; ally `pandarus`, `hector`

### Batch AK

- `alectryon-boeotian` parent `leitus`; ally `agamemnon`
- `patroclus` slayer `areilycus-achaean`; parent `prothoenor` (Homer), `arcesilaus` (Hyginus); ally `agamemnon`
- `prothoenor` sibling `arcesilaus` (Hyginus)
- `otrynteus-trojan` parent `iphition-otrynteid`; ally `hector`
- `peiros-thracian` slayer `diores-epeian`; `thoas-aetolia` slayer `peiros-thracian`; ally `hector`
- `imbrasus-thracian` parent `peiros-thracian`; ally `hector`

### Batch AL

- `theobula-boeotian` consort `areilycus-achaean`; parent `arcesilaus`, `prothoenor` (Hyginus); ally `agamemnon`
- `lacritus-boeotian` consort `cleobule-boeotian`; parent `leitus`, `clonius` (Hyginus); ally `agamemnon`
- `leitus` sibling `clonius` (Hyginus); Homer parent `alectryon-boeotian` retained
- `hippolochus-lycian` parent `glaucus-lycian`; ally `hector`
- `panthous-trojan` parent `polydamas`, `euphorbus-trojan`; ally `hector`, `priam`

### Batch AM

- `peisenor-trojan` parent `cleitus-trojan`; ally `hector`
- `antimachus-trojan` parent `hippolochus-antimachid`, `peisander-trojan`; ally `hector`, `paris`
- `agamemnon` slayer `hippolochus-antimachid`, `peisander-trojan`
- `hippolochus-antimachid` sibling `peisander-trojan`; ally `hector`
- `hippasus-trojan` parent `charops-trojan`, `socus-trojan`; ally `hector`
- `laomedon` parent `lampus-trojan`; `lampus-trojan` parent `dolops-trojan`; ally `hector`, `priam`

### Batch AN

- `hippasus-trojan` parent `hypsenor-trojan`; `hypsenor-trojan` sibling `charops-trojan`, `socus-trojan`; `deiphobus` slayer `hypsenor-trojan`; ally `hector`
- `laomedon` parent `hicetaon-trojan`; `priam` sibling `hicetaon-trojan`; `hicetaon-trojan` parent `melanippus-hicetaonid`; ally `priam`, `hector`
- `polyaemon-trojan` parent `amopaon-trojan`; ally `hector`
- `mentor-trojan` parent `imbrius-trojan`; ally `hector`
- `priam` parent `medesicaste-trojan`; `medesicaste-trojan` consort `imbrius-trojan`; ally `priam`

### Batch AO

- `thymoetes-trojan`, `ucalegon-trojan` ally `priam`, `hector`
- `laomedon` parent `clytius-trojan`; `priam`, `hicetaon-trojan`, `lampus-trojan` sibling `clytius-trojan`; ally `priam`, `hector`
- `hyrtacus-trojan` parent `asius-hyrtacid`; ally `hector`
- `merops-percote` parent `adrastus-meropsid`, `araphius-meropsid`

### Batch AP

- `phaenops-trojan` parent `xanthus-phaenopid`, `thoon-phaenopid`; ally `hector`
- `diomedes` slayer `xanthus-phaenopid`, `thoon-phaenopid`
- `clytius-achaean` parent `dolops-clytiid`; ally `agamemnon`
- `tenthredon-magnesia` parent `prothous-magnesia`; ally `agamemnon`
- `nomion-carion` parent `nastes-nomionid`, `amphimachus-nomionid`; ally `hector`
- `antimachus-trojan` parent `hippomachus-antimachid`; `hippomachus-antimachid` sibling `hippolochus-antimachid`, `peisander-trojan`
- `leonteus-lapith` slayer `hippomachus-antimachid`; ally `hector`

### Batch AQ

- `cteatus-epeian` parent `amphimachus-epeian`; sibling `eurytus-epeian`; ally `agamemnon`
- `eurytus-epeian` parent `thalpius-epeian`; sibling `cteatus-epeian`; ally `agamemnon`
- `amarynceus-epeian` parent `diores-epeian`; ally `agamemnon`
- `agasthenes-epeian` parent `polyxenus-epeian`; ally `agamemnon`
- `aretaon-phrygian` parent `phorcys-phrygian`, `ascanius-phrygian`; ally `hector`
- `phorcys-phrygian` sibling `ascanius-phrygian`

### Batch AR

- `actor-epeian` parent `cteatus-epeian`, `eurytus-epeian`; ally `agamemnon`
- `talaemenes-maeonian` parent `mesthles-maeonian`, `antiphus-maeonian`; ally `hector`
- `mesthles-maeonian` sibling `antiphus-maeonian`
- `arsinous-mysian` parent `chromis-mysian`, `ennomus-mysian`; ally `hector`
- `chromis-mysian` sibling `ennomus-mysian`
- `caeneus-lapith` parent `coronus-gyrton`; `coronus-gyrton` parent `leonteus-lapith`; ally `agamemnon`
- `iphitus-phocis` parent `schedius-phocis`, `epistrophus-phocis`; ally `agamemnon`
- `schedius-phocis` sibling `epistrophus-phocis`
- `peirithous` parent `polypoetes-lapith` (pre-existing from Batch I)

### Batch AS

- `augeas` parent `agasthenes-epeian`
- `naubolus-phocis` parent `iphitus-phocis`; ally `agamemnon`
- `bilsates-paphlagon` parent `pylaemenes-paphlagon`; ally `hector`
- `lethus-pelasgian` parent `hippothous-pelasgian`, `pylaeus-pelasgian`; ally `hector`
- `hippothous-pelasgian` sibling `pylaeus-pelasgian`
- `mecisteus-halizone` parent `odius-halizone`, `epistrophus-halizone`; ally `hector`
- `odius-halizone` sibling `epistrophus-halizone`

### Batch AT

- `teutamus-pelasgian` parent `lethus-pelasgian`; ally `hector`
- `molione-epeian` parent `cteatus-epeian`, `eurytus-epeian`; consort `actor-epeian`; ally `agamemnon`
- `pelasgus-larissa` parent `hippothous-pelasgian` (`hippothous-pelasgian-parentage`); ally `hector`
- `troezenus-ciconian` parent `euphemus-ciconian`; ally `hector`
- `sphelus-athenian` parent `iasus-athenian`; ally `agamemnon`
- `iphiclus-phthian` parent `protesilaus`, `podarces-phthian`; ally `agamemnon`
- `eusorus-thracian` parent `acamas-thracian`; ally `hector`

### Batch AU

- `bucolus-athenian` parent `sphelus-athenian`; ally `agamemnon`
- `ceas-ciconian` parent `troezenus-ciconian`; ally `hector`
- `phylacus-phthian` parent `iphiclus-phthian`; ally `agamemnon`
- `aesyetes-trojan` parent `alcathous-trojan`; ally `hector`
- `creon-achaean` parent `lycomedes-creonid`; ally `agamemnon`
- `priam` parent `deiopites-trojan`, `chersidamas-trojan`
- `theanus-dardanian` ally `hector`, `aeneas`, `archelochus-antenorid`, `acamas-antenorid` (Epit. 3.34 Dardanian leaders)

### Batch AV

- `hippodameia-trojan` parent `anchises`; consort `alcathous-trojan`
- `rhene-phthian` parent `medon-phthian`; parent `ajax-oileus` (Hyginus only)
- `eriopis-phthian` consort `oileus-locris`
- `bucolion-trojan` parent `laomedon`; parent `aesepus-trojan`, `pedasus-trojan`; consort `abarbarea-trojan`
- `abarbarea-trojan` parent `aesepus-trojan`, `pedasus-trojan`; consort `bucolion-trojan`
- `priam` parent `bias-trojan`

### Batch AW

- `hecuba` parent `pammon-trojan`, `polites-trojan`, `antiphonus-trojan`, `hipponous-trojan`, `polydorus-priamid` (Bibliotheca 3.12.5)
- `priam` parent `dryops-trojan`, `hippodamas-trojan`, `melanippus-trojan` (Bibliotheca 3.12.5; Homer battle rolls only)

### Batch AX

- `astyoche-minyan` parent `ascalaphus-minyan`, `ialmenus-minyan`; consort `ares`
- `actor-azeus` ally `agamemnon` (Minyan palace, Iliad 2.515–545)
- `arsinous-achaean` parent `hecamede`; ally `nestor`
- `hecamede` ally `nestor` (cupbearer from Tenedos, Iliad 11.620–650, 14.1–25)
- `pelegon-paeonian` parent `asteropaeus-paeonian`; ally `hector`

### Batch AY

- `accessamenus-paeonian` parent `periboea-paeonian`
- `axius-river` parent `pelegon-paeonian`; consort `periboea-paeonian`
- `periboea-paeonian` parent `pelegon-paeonian`
- `bellerophon` parent `hippolochus-lycian`, `laodameia-lycian`, `isander-lycian`
- `laodameia-lycian` parent `sarpedon`; consort `zeus`
- `ares` slayer `isander-lycian`

## 9. Primary-source map

- [Homer, *Iliad* 1](https://www.theoi.com/Text/HomerIliad1.html) (Chryses, Chryseis, Briseis, the heralds)
- [Homer, *Iliad* 2](https://www.theoi.com/Text/HomerIliad2.html) (Thersites, Eurybates with Odysseus)
- [Homer, *Iliad* 9](https://www.theoi.com/Text/HomerIliad9.html) (Phoenix's embassy and autobiography)
- [Pseudo-Apollodorus, *Bibliotheca* 1.8.6](https://www.theoi.com/Text/Apollodorus1.html) (Thersites son of Agrius)
- [Pseudo-Apollodorus, *Bibliotheca* 3.13.8](https://www.theoi.com/Text/Apollodorus3.html) (Phoenix son of Amyntor)
- [Homer, *Iliad* 10](https://www.theoi.com/Text/HomerIliad10.html) (Dolon, Rhesus, Hippocoön, the night raid)
- [Pseudo-Apollodorus, *Bibliotheca* 1.3.4](https://www.theoi.com/Text/Apollodorus1.html) (Rhesus son of Strymon and Euterpe/Calliope)

## 10. Conclusion

The Iliad Roster track completes the war's human cast without touching the Odyssey/Ithaca line. Batch A lands the wrath-plot figures; Batches B–Z march through raid-episodes, champions, Trojan counsellors and the Catalog of Ships until every Homeric name in the poem has a star.
