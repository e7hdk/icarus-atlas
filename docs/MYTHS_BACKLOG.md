# MYTHS_BACKLOG.md — candidate myths for the Spindle

This is a **research backlog**, not data. It lists myths that are well attested in our
seven source lenses but do **not yet** have a file in `data/stories/`. The Spindle of
Time (the `/stories` page) renders every story as a star on the thread of mythic time;
the more stories we curate, the fuller the spiral.

## Rules before promoting any entry to `data/stories/`

1. **Hard rule 3 (incremental data)** — add in small verified batches, never bulk-import
   this list. Each promoted story must be hand-written with sourced `summary`/`chapters`.
2. **Hard rule 5 (research local-first)** — verify the reading with `pnpm corpus:search`
   and the original-language edition before writing; the citations below are *candidate
   pointers* for discovery, not pre-verified attributions.
3. **Hard rule 2 (attribution)** — every `summary`/`chapter` gets real `sources: SourceId[]`.
   Where a myth's best source is outside our seven lenses (e.g. the Homeric Hymns,
   Pindar, Apuleius), note it and decide whether to attribute via Apollodorus/Ovid/Hyginus
   instead, or defer until a lens is added.
4. **`era`** is the spindle's vertical (time) axis; concurrent events get near-equal era so
   they fan out side-by-side. Pick era to slot the new star between its neighbours.
5. **`parent`** nests an episode under its saga; standalone myths use `parent: null` and
   land in the "Heroic Ages" / unaffiliated arm.

Our seven lenses (`data/sources.json`): `hesiod`, `homer`, `apollodorus`, `apollonius`,
`ovid`, `hyginus`, `pausanias`. Source IDs below use these; "(no lens)" flags a primary
source we do not yet carry.

---

## Cosmic & divine arm (era 0–4)

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`theogony-succession`~~ | ~~The Succession of Heaven~~ | ~~0.5~~ | hesiod (Theog. 453–506) | _Promoted 2026-06-18 — split into `data/stories/birth-of-zeus.json` (era 0.06) and `data/stories/the-swallowed-siblings.json` (era 0.15)._ |
| ~~`birth-of-aphrodite`~~ | ~~The Foam-Born~~ | ~~0.05~~ | hesiod (Theog. 188–206) | _Promoted 2026-06-18 — `data/stories/birth-of-aphrodite.json`._ |
| ~~`birth-of-athena`~~ | ~~The Birth of Athena~~ | ~~0.35~~ | hesiod (Theog. 886–926), apollodorus (1.3.6) | _Promoted 2026-06-18 — `data/stories/birth-of-athena.json`._ |
| ~~`apollo-artemis-delos`~~ | ~~Apollo and Artemis at Delos~~ | ~~0.38~~ | apollodorus (1.4.1), hesiod (Th. 918–923) | _Promoted 2026-06-18 — `data/stories/apollo-artemis-delos.json`._ |
| ~~`birth-of-hermes`~~ | ~~The Birth of Hermes~~ | ~~0.40~~ | hesiod (Th. 938–939), apollodorus (3.10.2), hyginus (Astr. 2.7) | _Promoted 2026-06-18 — `data/stories/birth-of-hermes.json`._ |
| ~~`birth-of-hephaestus`~~ | ~~The Birth of Hephaestus~~ | ~~0.42~~ | hesiod (Th. 927–929), homer (Il. 1.590–594, 18.394–405), apollodorus (1.3.5) | _Promoted 2026-06-18 — `data/stories/birth-of-hephaestus.json`._ |
| ~~`birth-of-ares`~~ | ~~The Birth of Ares~~ | ~~0.44~~ | hesiod (Th. 921–923), homer (Il. 5.889–898), ovid (Fasti 5.229–258) | _Promoted 2026-06-18 — `data/stories/birth-of-ares.json`._ |
| ~~`hymn-to-demeter`~~ | ~~Demeter and Persephone~~ | ~~2.4~~ | apollodorus (1.5.1), ovid (Met. 5.385–571) | _Promoted 2026-06-20 — `data/stories/hymn-to-demeter.json`; crossing to `nekuia`._ |
| ~~`typhon-vs-zeus`~~ | ~~Zeus and Typhon~~ | ~~1.5~~ | hesiod (Theog. 820–880), apollodorus (1.6.3) | _Superseded 2026-06-20 — covered by `data/stories/typhonomachy.json`; no duplicate star._ |
| ~~`aloadae`~~ | ~~Otus and Ephialtes~~ | ~~3.5~~ | apollodorus (1.7.4), homer (Od. 11.305–320) | _Promoted 2026-06-20 — `data/stories/aloadae.json`; crossings to `nekuia`, `typhonomachy`._ |
| ~~`tithonus`~~ | ~~Eos and Tithonus~~ | ~~3.2~~ | apollodorus (3.12.4) | _Promoted 2026-06-20 — `data/stories/tithonus.json`; crossing to `orion-the-hunter`._ |
| ~~`ganymede`~~ | ~~The Rape of Ganymede~~ | ~~3.1~~ | apollodorus (3.12.2), ovid (Met. 10.155–161) | _Promoted 2026-06-20 — `data/stories/ganymede.json`; crossing to `house-of-troy`._ |
| ~~`the-sinners-of-tartarus`~~ | ~~Tantalus, Sisyphus, Ixion, Tityus~~ | ~~3.8~~ | apollodorus (Epit. 2; 1.9.1), ovid (Met. 4.456–461), homer (Od. 11.576–600) | _Promoted 2026-06-20 — `data/stories/the-sinners-of-tartarus.json`; crossing to `nekuia`._ |

## Metamorphoses arm (era 4–7) — Ovid stories still missing

Existing Ovid stars: Daphne, Arachne, Narcissus, Niobe, Callisto, Actaeon, Phaethon,
Byblis, Myrrha, Baucis & Philemon, Erysichthon, Cyparissus, Acis & Galatea, Pomona &
Vertumnus, Scylla & Minos, Alcyone & Ceyx, Marsyas, Midas, Pygmalion, Io.

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`tereus-procne-philomela`~~ | ~~Tereus, Procne and Philomela~~ | ~~5.3~~ | ovid (Met. 6.412–674), apollodorus (3.14.8) | _Promoted 2026-06-20 — `data/stories/tereus-procne-philomela.json`._ |
| ~~`pyramus-thisbe`~~ | ~~Pyramus and Thisbe~~ | ~~5.1~~ | ovid (Met. 4.55–166) | _Promoted 2026-06-20 — `data/stories/pyramus-thisbe.json`._ |
| ~~`hyacinthus`~~ | ~~Apollo and Hyacinthus~~ | ~~5.2~~ | ovid (Met. 10.162–219), apollodorus (3.10.3) | _Promoted 2026-06-20 — `data/stories/hyacinthus.json`; crossing to `cyparissus-cypress`._ |
| ~~`atalanta-race`~~ | ~~Atalanta and Hippomenes~~ | ~~6.4~~ | ovid (Met. 10.560–680), apollodorus (3.9.2) | _Promoted 2026-06-20 — `data/stories/atalanta-race.json`._ |
| ~~`glaucus-scylla`~~ | ~~Glaucus, Scylla and Circe~~ | ~~6.9~~ | ovid (Met. 13.898–14.74) | _Promoted 2026-06-20 — `data/stories/glaucus-scylla.json`; crossing to `sirens-and-the-strait` (not `scylla-minos` — homonym)._ |
| ~~`hermaphroditus`~~ | ~~Salmacis and Hermaphroditus~~ | ~~5.0~~ | ovid (Met. 4.285–388) | _Promoted 2026-06-20 — `data/stories/hermaphroditus-salmacis.json`; characters `hermaphroditus`, `salmacis-nymph`._ |
| ~~`caenis-caeneus`~~ | ~~Caenis and Caeneus~~ | ~~6.6~~ | ovid (Met. 12.169–209), apollodorus (Epit. 1.22) | _Promoted 2026-06-20 — `data/stories/caenis-caeneus.json`; crossing to `lapith-centaur-war`._ |
| ~~`picus-canens`~~ | ~~Picus, Canens and Circe~~ | ~~8.5~~ | ovid (Met. 14.320–434) | _Promoted 2026-06-20 — `data/stories/picus-canens.json`; crossing to `winds-and-circe`._ |
| ~~`iphis-ianthe`~~ | ~~Iphis and Ianthe~~ | ~~5.4~~ | ovid (Met. 9.666–797) | _Promoted 2026-06-20 — `data/stories/iphis-ianthe.json`._ |
| ~~`aglauros-mercury`~~ | ~~Aglauros and Mercury~~ | ~~4.5~~ | ovid (Met. 2.708–832) | _Promoted 2026-06-20 — `data/stories/aglauros-mercury.json`._ |

## Theban arm (era 5–6)

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`europa-and-the-bull`~~ | ~~The Rape of Europa~~ | ~~4.9~~ | apollodorus (3.1.1), ovid (Met. 2.833–875) | _Promoted 2026-06-20 — `data/stories/europa-and-the-bull.json`; episode under `theban-cycle`; crossing to `cadmus-and-thebes`._ |
| ~~`harmonia-serpents`~~ | ~~Cadmus and Harmonia at the End~~ | ~~6.0~~ | ovid (Met. 4.563–603), apollodorus (3.5.4) | _Promoted 2026-06-20 — `data/stories/harmonia-serpents.json`; crossing to `cadmus-and-thebes`._ |
| ~~`semele-and-the-birth`~~ | ~~Semele and the Birth of Dionysus~~ | ~~5.0~~ | ovid (Met. 3.253–315), apollodorus (3.4.3) | _Promoted 2026-06-18 — `data/stories/semele-and-the-birth.json`._ |
| ~~`tiresias-blindness`~~ | ~~The Blinding of Tiresias~~ | ~~5.1~~ | ovid (Met. 3.316–338), apollodorus (3.6.7) | _Promoted 2026-06-20 — `data/stories/tiresias-blindness.json`; crossings to `oedipus-at-thebes`, `nekuia`._ |

## Dionysus arc (era 5–7) — shelf root `dionysus-cycle` (2026-06-20)

Nested under `dionysus-cycle`: `semele-and-the-birth`, `lycurgus-of-thrace`, `tyrrhenian-pirates`, `pentheus-and-dionysus`, `ariadne-on-naxos`, `midas-golden-touch`. Crossings to `theban-cycle` (Thebes) and `theseus-cycle` (Naxos).

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`tyrrhenian-pirates`~~ | ~~Dionysus and the Pirates~~ | ~~5.4~~ | ovid (Met. 3.582–691), apollodorus (3.5.3) | _Promoted 2026-06-19 — `data/stories/tyrrhenian-pirates.json`; character `acoetes-tyrrhenian`._ |
| ~~`lycurgus-of-thrace`~~ | ~~The Madness of Lycurgus~~ | ~~5.3~~ | homer (Il. 6.130–140), apollodorus (3.5.1) | _Promoted 2026-06-19 — `data/stories/lycurgus-of-thrace.json`; characters `lycurgus-thrace`, `dryas-thrace`._ |
| ~~`ariadne-on-naxos`~~ | ~~Ariadne on Naxos~~ | ~~6.78~~ | ovid (Met. 8.174–182), apollodorus (Epit. 1.9), hyginus (Fab. 43) | _Promoted 2026-06-19 — `data/stories/ariadne-on-naxos.json`; crossing to `minotaur-and-ariadne`._ |
| ~~`icarius-and-erigone`~~ | ~~Icarius, Erigone and the Wine~~ | ~~5.5~~ | apollodorus (3.14.7), hyginus (Fab. 130) | _Promoted 2026-06-20 — `data/stories/icarius-and-erigone.json`; characters `icarius-attica`, `erigone-icaria`._ |

## Heroic arm — standalone (era 5–7)

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`bellerophon-chimera`~~ | ~~Bellerophon and the Chimera~~ | ~~5.7~~ | homer (Il. 6.155–205), apollodorus (2.3.1), hyginus (Fab. 57) | _Promoted 2026-06-18 — `data/stories/bellerophon-chimera.json`._ |
| ~~`calydonian-boar`~~ | ~~The Calydonian Boar Hunt~~ | ~~6.5~~ | apollodorus (1.8.2), ovid (Met. 8.260–444), homer (Il. 9.529–599) | _Promoted 2026-06-18 — `data/stories/calydonian-boar.json`._ |
| ~~`pelops-and-oenomaus`~~ | ~~Pelops and the Chariot Race~~ | ~~5.9~~ | apollodorus (Epit. 2.3–9), hyginus (Fab. 84), pausanias (5.1, 6.21) | _Promoted 2026-06-20 — `data/stories/pelops-and-oenomaus.json`._ |
| ~~`orion-the-hunter`~~ | ~~Orion the Hunter~~ | ~~4.8~~ | apollodorus (1.4.3–5), hyginus (Astr. 2.34), pausanias (5.1, 6.21) | _Promoted 2026-06-20 — `data/stories/orion-the-hunter.json`._ |
| ~~`phineus-and-the-harpies`~~ | ~~Phineus and the Harpies~~ | ~~6.92~~ | apollodorus (1.9.21), apollonius (Arg. 2.178–434) | _Promoted 2026-06-20 — `data/stories/phineus-and-the-harpies.json`; crossing to `argonautica`; harpy adversary relations._ |
| ~~`salmoneus-false-thunder`~~ | ~~Salmoneus and the False Thunder~~ | ~~4.6~~ | apollodorus (1.9.7), hyginus (Fab. 61) | _Promoted 2026-06-20 — `data/stories/salmoneus-false-thunder.json`._ |
| ~~`the-danaids`~~ | ~~The Danaids~~ | ~~4.4~~ | apollodorus (2.1.4–5), hyginus (Fab. 168) | _Promoted 2026-06-20 — `data/stories/the-danaids.json`; crossing to `io-wandering`._ |

## Trojan & Returns arm (era 7.5–9.5) — episodes still missing

| candidate id | title | ~era | source pointers | note |
|---|---|---|---|---|
| ~~`memnon`~~ | ~~Memnon the Ethiopian~~ | ~~8.27~~ | apollodorus (Epit. 5.3), hyginus (Fab. 112) | _Promoted 2026-06-20 — data/stories/memnon.json; split from aethiopis._ |

_Promoted to data in **Trojan Batch 16** (2026-06-16): `palamedes`, `philoctetes-on-lemnos`, `ajax-and-the-arms`._
_Promoted to data in **Trojan Batch 17** (2026-06-16): `the-wooden-horse`._
_Promoted to data in **Heroic Batch 1** (2026-06-18): `bellerophon-chimera`._
_Promoted to data in **Heroic Batch 1** (2026-06-18): `calydonian-boar`._
_Promoted to data in **Olympian Births Batch 1** (2026-06-18): `birth-of-aphrodite`, `birth-of-athena`, `apollo-artemis-delos`, `semele-and-the-birth`._
_Promoted to data in **Olympian Births Batch 2** (2026-06-18): `birth-of-hermes`, `birth-of-hephaestus`, `birth-of-ares`._
_Promoted to data in **Heroic Myths Batch** (2026-06-20): `phineus-and-the-harpies`, `the-danaids`, `europa-and-the-bull`._
_Promoted to data in **Dionysus Cycle shelf** (2026-06-20): `dionysus-cycle` root; reparented `semele-and-the-birth`, `lycurgus-of-thrace`, `tyrrhenian-pirates`, `pentheus-and-dionysus`, `ariadne-on-naxos`, `midas-golden-touch`._

---

## Working method

When a batch is chosen, write each story with `pnpm corpus:search "<key phrase>"` first,
compare lenses, then create `data/stories/<id>.json` (schema in `src/lib/schemas.ts`) and
run `pnpm validate-data`. The new star appears on the spindle automatically at its `era`,
colored by the saga arm its `parent` chain resolves to (`src/features/stories/spindle.ts`).
