# Mythic chronology — the BC-year spine of the Spindle

**Status: RESEARCH DOSSIER for verification.** No application data is written from
this yet. Once the anchor table and method below are signed off, it becomes
`data/chronology.json` (a verified batch, hard rule 3) and drives the Spindle's
vertical axis (`Chronos` mode).

## Why this exists

The Spindle's length wants to read as *mythic time*. The `era` field on each
story is only a **sort key** — its magnitudes (4.01, 6.02, …) carry order, not
duration — so positioning world-lines proportionally to `era` is positioning
them by an arbitrary number. To make "down the tunnel = later in time" and
"same height = same moment" *true*, we anchor the axis to real ancient
chronology pulled from outside our 7 literary sources.

## The honest caveat (this is on-brand, not a bug)

**There is no single canonical timeline of Greek myth** — the ancient
chronographers disagree, exactly as our authors disagree about everything else.
So chronology is treated as a **sourced, lens-able, sometimes-disputed fact**,
like any other in the atlas. The flagship disagreement:

> **The fall of Troy** — **1184/83 BC** (Eratosthenes) vs **1209 BC** (Parian
> Marble). A 25-year gap that the Spindle can show literally: under the
> Eratosthenes lens the Troy ring sits at 1184; switch lenses and it slides.

## The two chronographic authorities

Neither is one of the 7 galaxy lenses (Hesiod … Pausanias). They are
**chronology-only attribution authorities**; see the data-model note below for
how we register them.

| id | Authority | What it is | How we cite it |
|---|---|---|---|
| `eratosthenes` | Eratosthenes of Cyrene, *Chronographiai* (~225 BC) | First scientific chronography; counted backward from the Olympiads. The **spine you chose.** Lost, reconstructed via Clement & Censorinus. | `Eratosthenes ap. Clement, Stromata 1.21.138`; `Censorinus, De Die Natali 21` |
| `marmor-parium` | The Parian Marble (*Marmor Parium*, IG XII.5.444), inscribed 264/3 BC | An actual inscribed stele dating events backward from the archon Diognetus. Dates the deep heroic age the spine leaves blank. | `Marmor Parium, ep. N` (entry number / FGrHist 239) |
| `eusebius` | Eusebius' *Chronicle* (~AD 311), transmitting Castor of Rhodes & Julius Africanus | The synchronizing tradition that pushed the count **back before Cecrops** — the Sicyonian and Argive king-lists (Aegialeus, Inachus, Phoroneus) and the Ogygian flood. Where it preserves Castor's *invented* god-reign dates we treat those as legend, not date. | `Africanus / Castor ap. Eusebius, Chronicle 1` |

## The deep past — what the chronographers DID and did NOT date

Researched in answer to "don't the early ones have dates too?" — **partly yes.**
There are two different deep zones, and only one of them is datable:

**(a) The early *human* age IS dated.** The chronographers (Castor, Africanus,
Eusebius) ran the count back well before Cecrops via the Sicyonian and Argive
king-lists:

- **Sicyon founded (Aegialeus)** — the earliest Greek kingdom, **235 years
  before Inachus** → **≈2200 BC**.
- **Inachus, first king of Argos** — **≈1960 BC** (Inachus→Sthenelus is 9 kings
  over 382 years, ending as Cecrops takes Athens at 1581).
- **Phoroneus & the Ogygian flood** — the *first* great flood (in Phoroneus'
  reign), **1796 BC** (Africanus: 1020 years before the first Olympiad of 776).
  Note: this is a **separate, earlier flood** from Deucalion's (1528) — our
  `great-flood` story is Deucalion's; Ogyges' is a gap in the roster.

So the **mortal clock can start ~2200–1960 BC** (Sicyon/Inachus), not at Cecrops
— and the Argive/Inachid material gets real early years (e.g. `io-wandering`:
Io, daughter of Inachus, ≈1900 BC).

**(b) The truly *divine* age is NOT dated in Greek years.** Chaos, the
Titanomachy, the birth of the Olympians — no Greek chronographer assigns these a
BC year. The only "dates" are the Egyptian **reign of the gods** (Manetho: the
gods ruled 11,985 years, Hephaestus alone 9,000) — symbolic vast spans, not a
usable Greek date — and Castor's acknowledged *invented* god-reign numbers. So
hard rule 6 holds for the gods on **both** mythic and historiographic grounds:
they stay in a **timeless band above the year scale**:

- `cosmogony` + subtree (`titanomachy`, `typhonomachy`, `gigantomachy`, the
  divine births, `prometheus-fire`, `pandora`) — divine time, no BC.
- `five-ages` (Hesiod's golden→iron ages) — the bridge gradient *into* the
  mortal clock, dissolving down toward Sicyon/Inachus.

The timeless band now has a clear **lower boundary** (it ends where the human
count begins, ~2200 BC), instead of floating with no floor.

## The anchor spine (verified)

BC years; `E` = Eratosthenes, `P` = Parian Marble, `Eu` = Eusebius
(Castor/Africanus), `gen` = generational estimate (see method). "≈" marks a
chronographer-derived or generational estimate, not a directly attested year.

| Anchor event | Our story id(s) | BC year | Authority | Citation / note |
|---|---|---|---|---|
| Sicyon founded (Aegialeus) | (Sicyon lineage) | **≈2200** | Eu | Castor ap. Eusebius; 235 yrs before Inachus |
| Inachus, first king of Argos | (Argos lineage) | **≈1960** | Eu | Africanus ap. Eusebius; Inachus→Sthenelus 382 yrs |
| Io, daughter of Inachus | `io-wandering` | **≈1900** | gen | within the Inachid period |
| Ogygian flood (Phoroneus) | — (roster gap) | **1796** | Eu | Africanus; 1020 yrs before the first Olympiad |
| Cecrops, birth of Athens | (Athens lineage) | **1581** | P | Marmor Parium ep. 1 |
| Deucalion's flood | `great-flood` | **1528** | P | Marmor Parium ep. 4 (1528/7) |
| Hellen son of Deucalion | `five-ages` (tail) | **1520** | P | Marmor Parium ep. 6 |
| Cadmus founds Thebes | `cadmus-and-thebes` (`theban-cycle` root) | **1519/18** | P | Marmor Parium ep. 7 |
| Danaus' first ship from Egypt | (Argive/Danaid lineage) | **1511/10** | P | Marmor Parium ep. 9 |
| Perseus, founding of Mycenae | `perseus-cycle` | **≈1300** | gen | ~2–3 gen before Heracles; cf. Eusebius |
| Bellerophon & the Chimera | `bellerophon-chimera` | **≈1290** | gen | grandfather's gen of Glaucus/Sarpedon (Troy) |
| Minos thalassocracy | `minotaur-and-ariadne` (Crete) | **1294** | P | Marmor Parium ep. 11 |
| Oedipus / house of Laius | `oedipus-at-thebes` | **≈1260** | gen | gen before the Seven |
| Theseus unites Attica | `theseus-cycle`, `king-of-athens` | **1259** | P | Marmor Parium ep. 20 |
| Amazons invade Attica | `amazon-campaign` | **1256** | P | Marmor Parium ep. 21 |
| Calydonian boar hunt | `calydonian-boar` | **≈1250** | gen | Argonaut generation |
| Heracles' labours / floruit | `heracles-cycle`, `twelve-labours` | **≈1250** | gen | 1 gen before Troy; Heraclid return +80 = 1104 |
| The Argo to Colchis | `argonautica` | **≈1245** | gen | fathers of the Trojan heroes (Peleus, Telamon) |
| Seven against Thebes | `seven-against-thebes` | **≈1230** | gen | their sons (Epigoni) sack Thebes just before Troy |
| Epigoni take Thebes | `epigoni` | **≈1205** | gen | one gen after the Seven |
| **Trojan War begins** | `trojan-cycle`, `cypria` | **1218** (P) / **1194** (E) | P/E | Marmor Parium ep. 23; E = fall + 10 |
| **Fall of Troy** | `sack-of-troy`, `little-iliad` | **1209** (P) / **1184/83** (E) | P/E | ⚖ flagship dispute |
| The Returns / Nostoi | `nostoi`, `returns` arm | **1184–1174** | E | the decade after E's fall |
| Odysseus reaches Ithaca | `odyssey` | **≈1174** | E | fall + 10 |
| Murder & vengeance at Mycenae | `oresteia` | **≈1176** | E | within the Returns decade |
| Return of the Heraclidae | `return-of-heraclids` | **1104** | E | E: fall + 80 (Dorian return) |
| (epoch marker) First Olympiad | — | **776** | E | the system's zero |

## Method — placing the other ~120 stories

Most stories are **not** an anchor. They are placed by:

1. **Bracketing.** A story falls between the two nearest anchors that surround it
   in narrative order (the existing `parent`/`era` order is the tie-break within
   a bracket), and its BC year is interpolated across that bracket's year span.
   So the dozens of Trojan episodes spread between 1218/1194 and 1209/1184; the
   Theban episodes between Cadmus (1519) and the Epigoni (1205); etc.
2. **Generational estimate (`gen`).** Undated heroic events anchor to a known
   kinship relative to a dated one, at **~30 years per generation** back from the
   fall of Troy. Every `gen` year is flagged in the data as an estimate, never
   dressed up as an attested date.
3. **Catalogue sagas.** `metamorphoses` is a trans-temporal catalogue, not a
   point in time; its episodes are placed individually by their own content
   (e.g. `daphne-laurel` early/divine, `niobe-niobids` ~Theban era), and the
   saga root itself stays in the divine-prologue band.
4. **Trans-arm figures must be co-anchored.** A figure told across several saga
   arms (Aristaeus in heroic + Cadmean Thebes; Actaeon's death in both the
   `aristaeus-cycle` and the Ovidian `actaeon-artemis`) free-floats to a
   *different* year in each arm's local interpolation — which scattered Actaeon
   to 1694 BC in metamorphoses (before his own grandfather Cadmus, 1519) while
   his father sat at 1327 in the heroic arm. The fix: give the shared
   generation an explicit anchor (`aristaeus-cadmean` 1490, `actaeon-death` 1475)
   so every arm agrees and the "same event told twice" crossings stay short and
   horizontal. Sweep for these wherever a crossing links two arms.

## What changes vs the current `era` order

Real chronology gently **re-clusters contemporaries** that `era` spreads apart:
Theseus (1259), Heracles (~1250), the Calydonian boar (~1250) and the Argo
(~1245) collapse toward the **same few rings** — which is correct, they *are* one
generation — and this is exactly the payoff: simultaneity becomes visible.

## How the Spindle will use it

- **Y = BC year** (linear), divine prologue stacked above year ~1581.
- A story's world-line spans **start year → end year** (its `eraEnd`/subtree
  reach mapped through the same anchors) — a real lifetime on the wall.
- **Lens-aware:** disputed anchors (Troy) read their year from the active lens;
  under `consensus` the ring carries a ⚖ badge and both years are shown.
- Age-ring labels become **century marks** (1500 BC, 1400 BC …) instead of the
  current prose bands.

## Data-model proposal (for the build step, not yet written)

```jsonc
// data/chronology.json
{
  "anchors": [
    {
      "id": "fall-of-troy",
      "label": "The fall of Troy",
      "stories": ["sack-of-troy", "little-iliad"],
      "dates": [
        { "year": -1184, "source": "eratosthenes", "citation": "ap. Clement, Stromata 1.21.138" },
        { "year": -1209, "source": "marmor-parium", "citation": "Marmor Parium ep. 23" }
      ],
      "topic": "fall-of-troy-date",      // folds into the dispute gate
      "estimate": false
    }
    // …
  ]
}
```

- New attribution ids `eratosthenes`, `marmor-parium` live in a **separate
  `chronographers` list** (decided), NOT in `data/sources.json` — they are
  chronology-only authorities and must never appear as galaxy genealogy lenses.
  The Spindle reads this list for the BC-year axis and its dispute badges.
- `validate-data` grows: anchor `stories[]` must reference real story ids;
  every `dates[]` entry needs a `source` + `citation`; `topic` (if present)
  joins the existing dispute-topic set.

## Open questions to confirm before I build

1. **Spine when undisputed-but-undated:** for the deep heroic events (Heracles,
   Argo, Perseus, the Seven) there is no Eratosthenes year — accept the **`gen`
   estimates** above, or hunt each one for a specific chronographer's figure
   (Eusebius/Castor) at the cost of more research?
2. ~~**Divine prologue scale.**~~ **Researched.** The early *human* age is
   datable (Sicyon ≈2200, Inachus ≈1960, Ogygian flood 1796) and joins the BC
   axis; the *divine* age has no Greek year and stays in a **timeless band**
   (lower-bounded at ≈2200). **Confirm:** add the Egyptian "reign of the gods"
   (Manetho's symbolic spans) as a flavour layer for the divine band, or leave
   the gods undated entirely? (Recommend: leave undated; it is symbolic, not a
   Greek date.)
3. ~~**Source registration:** `sources.json` vs a separate `chronographers`
   list.~~ **Decided: a separate `chronographers` list** (chronology-only, never
   a galaxy lens).

## Sources

- [Eratosthenes & the dating of the fall of Troy (Kokkinos)](https://www.centuries.co.uk/2009-ancient%20chronography-kokkinos.pdf)
- [Epoch-making Eratosthenes (GRBS 45, 2005)](https://grbs.library.duke.edu/index.php/grbs/article/download/281/361)
- [Parian Chronicle — Wikipedia](https://en.wikipedia.org/wiki/Parian_Chronicle)
- [Digital Marmor Parium](https://www.digitalmarmorparium.org/)
- [Parian Marble — attalus.org (Inscription 239)](http://www.attalus.org/docs/other/inscr_239.html)
- [The Parian Chronicle (thearchaeologist.org)](https://www.thearchaeologist.org/blog/the-parian-chronicle-the-oldest-chronology-of-ancient-greece)
- [Eusebius' Chronicle — Greek Chronicle, Castor, Porphyrius (attalus.org)](https://www.attalus.org/armenian/euseb10.htm)
- [Eusebius: Chronicle, translation (attalus.org)](https://www.attalus.org/translate/eusebius1.html)
- [Varronian chronology (Livius)](https://www.livius.org/articles/concept/varronian-chronology/)
- [Aegyptiaca (Manetho) — reign of the gods (Wikipedia)](https://en.wikipedia.org/wiki/Aegyptiaca_(Manetho))

> Verification note: Parian years (Cecrops 1581, Deucalion 1528, Hellen 1520,
> Minos 1294, Theseus 1259, Amazons 1256, Troy 1218→1209) are stated by the
> inscription and reproduced consistently across the sources above. Eratosthenes'
> Troy 1184/83 + Heraclid-return 1104 (+80) + Olympiad 776 are the standard
> reconstruction via Clement and Censorinus. The deep-past `Eu` rows (Sicyon
> ≈2200, Inachus ≈1960, Ogygian flood 1796) are computed from the Castor/Africanus
> king-list intervals transmitted by Eusebius — internally consistent in that
> tradition but variant across chronographers (Inachus is also given ≈1856 and
> ≈1986 elsewhere), hence `≈`. The `≈ gen` rows are generational estimates and
> must not be presented as attested years.
