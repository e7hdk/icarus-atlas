# The Monster Genealogy — Pontus to the Lernaean Hydra — Research Dossier

> Research status: source-mapped branch-by-branch against the seven atlas lenses (corpus + web; Hesiod's *Theogony* 233–336, 820–880 and Apollodorus the master sources), 2026-06-14. The atlas had almost no monsters (only `sphinx`, `minotaur`, `cretan-bull`, `chiron`); this is a major expansion that finally gives the bestiary its own chthonic quarter. This dossier gates entry; same-name hazards and existing-node collisions resolved before any character is written (per CLAUDE.md hard rule 7).
>
> Scope: the Hesiodic monster catalogue — the sea-roots Pontus, Phorcys & Ceto; the Gorgons and Graeae; Echidna "the mother of monsters" and the serpents (Ladon, Python); Typhon and his brood (Orthrus, Cerberus, the Lernaean Hydra, the Chimera, the Nemean Lion, and the existing Sphinx); Medusa's foals Pegasus and Chrysaor and his son Geryon; and the standalone sea-monsters Scylla, Charybdis, the Harpies, the Sirens, and Cetus.
>
> **Batch A entered 2026-06-14** (M2.13): 11 figures — `pontus`, `phorcys`, `ceto`, `nereus`, `thaumas`, `medusa`, `stheno`, `euryale`, `graeae`, `pegasus`, `chrysaor` — 40 relations, no new contradictions (the Graeae count/names and Medusa's birth narrated in prose). Seated in the new chthonic quarter (Pontus in `core`, the rest `chthonic`); wired `gaia`, `poseidon` (Medusa's lover, sire of the foals), `perseus` (slayer of Medusa, robber of the Graeae), `bellerophon` (Pegasus' rider), and **gave the existing Nereid `thetis` her father `nereus`** (the sea-roots bridge to the Aeacids). `validate-layout` confirms the chthonic band holds generation order.
>
> **Batch B entered 2026-06-14** (M2.14): 10 figures — `echidna`, `typhon`, `orthrus`, `cerberus`, `hydra`, `chimera`, `nemean-lion`, `ladon`, `geryon`, `python` — 37 relations; the Typhon+Echidna brood clique, `typhon` adversary `zeus`, `bellerophon` slayer `chimera`, `apollo` slayer `python`, `geryon` ← `chrysaor`, and **the existing Theban `sphinx` wired into the brood**. Five documented contradictions (`echidna-parentage`, `ladon-parentage`, `chimera-parentage`, `nemean-lion-parentage`, `sphinx-parentage`); Cerberus' head-count, the Nemean Lion's lunar variant, and the Heracles labour-kills stay prose.
>
> **Batch C entered 2026-06-14** (M2.15) — the bestiary complete: 5 figures — `scylla-monster`, `charybdis`, `harpies`, `sirens`, `cetus` — 7 relations; `harpies` ← `thaumas` (and adversary of the Boreads `zetes`/`calais`), `sirens` ← `achelous`, `perseus` slayer of `cetus` (the Andromeda rescue), and one documented contradiction (`scylla-parentage`, Phorcys vs Typhon). Charybdis stands alone (no parentage in the seven). **The monster genealogy is complete: A + B + C = 26 new figures, and the bestiary's chthonic quarter is full** (creatures 6 → 26).

## 1. Why this expansion

1. **The bestiary is the atlas's missing quarter.** Gods, Titans, heroes and seven royal houses are deep; the monsters — the most iconic figures of Greek myth — are nearly absent. The galaxy's `creature` glow has almost nothing to light.
2. **It is a true genealogy, not a grab-bag.** Hesiod's *Theogony* threads the monsters into one descent: Pontus → Phorcys & Ceto → the Gorgons/Graeae/Echidna/Ladon; Gaia & Tartarus → Typhon; Typhon & Echidna → the labour-beasts. The atlas's genealogical engine is built for exactly this.
3. **It lights a new region — the chthonic band.** The monster brood sits in the `chthonic` cluster (below the disc, inner-mid radius), a dark quarter beneath the bright dynasties.
4. **It interlocks with the standing sky.** `gaia`/`tartarus` (Typhon, Pontus), `poseidon`/`perseus` (Medusa, Pegasus, Chrysaor), `bellerophon` (Pegasus & the Chimera), `apollo` (Python), the Boreads (`zetes`/`calais` vs the Harpies), `achelous` (the Sirens), `nereus`→`thetis` (the Aeacid bridge), the existing `sphinx`, and `andromeda` (Cetus). Heracles' labour-monsters (Hydra, Nemean Lion, Cerberus, Geryon, Ladon) stay boundary prose until a Heracles batch.

## 2. Evidence policy

| Source id | Material |
|---|---|
| `hesiod` | *Theogony* — the monster catalogue (233–239 the sea-roots; 270–336 the brood; 820–880 Typhoeus) |
| `apollodorus` | *Bibliotheca* 1.2.6 (sea-roots), 2.4.2–3 (Gorgons/Graeae/Perseus), 2.1.2 / 2.3 / 2.5 (Echidna, Chimera, the labours), 1.6.3 (Typhon), Epitome 7.18–21 (Scylla, Sirens) |
| `homer` | Scylla & Charybdis (*Odyssey* 12); the Chimera (*Iliad* 6.179–183); Phorcys the old sea-man (*Odyssey* 13) |
| `ovid` | Medusa's tale and Perseus (*Metamorphoses* 4.770–803); Cetus (4.689–734) |
| `hyginus` | *Fabulae* (the Gorgon/Typhon/monster catalogues, pref.; 151 Typhon's brood; 140 Python) |
| `apollonius` | The Harpies and the Boreads (*Argonautica* 2.178–300); the Colchian dragon |
| `pausanias` | Cult and rationalising notes (the Sirens, Cerberus, the Nemean Lion) |

Out of scope (research-only): the Homeric Hymn to Apollo (Python); Nonnus; the *Catalogue of Women*; Eratosthenes' *Catasterismi*; Quintus Smyrnaeus.

## 3. Source-conscious overview

Bracketed nodes already exist; "(NEW)" marks this expansion; "[note]" = note-only.

```text
[gaia] ── Pontus(NEW)
   ├── Nereus(NEW) ──> [thetis] and the Nereids[note]
   ├── Thaumas(NEW) + Electra[note] ── the Harpies(NEW), Iris[note]
   ├── Phorcys(NEW) + Ceto(NEW)
   │      ├── the Graeae(NEW)  (Pemphredo, Enyo, Deino)
   │      ├── the Gorgons: Stheno(NEW), Euryale(NEW), Medusa(NEW)
   │      │        └── Medusa + [poseidon] ── Pegasus(NEW), Chrysaor(NEW)
   │      │                 Chrysaor + Callirhoe[note] ── Geryon(NEW)
   │      ├── Echidna(NEW)  [parents disputed: Phorcys/Ceto vs Tartarus/Gaia vs Chrysaor/Callirhoe]
   │      └── Ladon(NEW)    [parents disputed: Phorcys/Ceto vs Typhon/Echidna]
   └── Eurybia[note → Titan/astral dossier]
[gaia] + [tartarus] ── Typhon(NEW)
   Typhon + Echidna ── Orthrus(NEW), Cerberus(NEW), Hydra(NEW), Chimera(NEW)
        Orthrus + (Echidna or Chimera) ── the Nemean Lion(NEW), [sphinx] (existing — wire in)
Standalone: Python(NEW, child of [gaia], slain by [apollo]); Scylla(NEW, scylla-monster); Charybdis(NEW); the Sirens(NEW, ← [achelous]); Cetus(NEW, slain by [perseus] for [andromeda])
```

## 4. The same-name hazard map & existing-node collisions

| Name | Resolution |
|---|---|
| **Scylla** | the sea-monster → `scylla-monster`; the existing `scylla-nisus` (daughter of Nisus of Megara) is a different figure — never merge. |
| **Sphinx** | already a node (`sphinx`, Theban) — do NOT recreate; add its disputed monster-parentage edges (Orthrus/Echidna vs Typhon/Echidna). |
| **Ceto** | `ceto` (the sea-goddess, Phorcys' wife) ≠ the Nereid Ceto (Apollodorus 1.2.7, note-only). |
| **Medusa / Euryale / Enyo** | the Gorgon `medusa` ≠ the Danaid Medusa and Sthenelus' daughter; the Gorgon `euryale` ≠ Minos' daughter Euryale; the Graia Enyo ≠ the war-goddess Enyo (kept inside the collective `graeae`). |
| **Ladon** | the dragon `ladon` ≠ the Arcadian river Ladon (a geo feature, note-only). |
| **Iris / Eurybia / Thoosa / the Nereids / Callirhoe** | sea-kin but note-only here (Iris & the Nereids belong to a sea/sky batch; Eurybia to the Titan/astral side; Callirhoe is Geryon's mother, kept prose). |
| **Hydra / Cetus** | the monsters, not the constellations. |
| **Gaia / Tartarus / Poseidon / Perseus / Bellerophon / Apollo / Achelous / Nereus→Thetis / Andromeda / Zetes / Calais** | existing — link, never recreate. |

## 5. Proposed contradiction topics

| Topic id | Competing claims (node-modelable?) | Citations |
|---|---|---|
| `echidna-parentage` | Phorcys & Ceto vs Tartarus & Gaia (vs Chrysaor & Callirhoe) — Phorcys/Ceto/Tartarus/Gaia are nodes → competing edges | Hesiod Theog. 295–305 vs Apollodorus 2.1.2 |
| `ladon-parentage` | Phorcys & Ceto vs Typhon & Echidna — all nodes → competing edges | Hesiod Theog. 333–336 vs Apollodorus 2.5.11 |
| `chimera-parentage` | mother the Hydra vs Echidna (father Typhon) — both nodes → competing edges | Hesiod Theog. 319–325 |
| `nemean-lion-parentage` | borne by Echidna to Orthrus vs the Chimera the mother — nodes → competing edges | Hesiod Theog. 326–329; Apollodorus 2.5.1 |
| `sphinx-parentage` | Orthrus & Echidna (Hesiod) vs Typhon & Echidna (Apollodorus) — nodes → competing edges on the existing `sphinx` | Hesiod Theog. 326; Apollodorus 3.5.8 |
| `scylla-parentage` | Phorcys vs Typhon vs Crataeis — Phorcys/Typhon nodes → competing edges (Crataeis prose) | Apollodorus Epit. 7.20; Hyginus pref. |

Narrated in prose (no clean node-pair): `cerberus-heads` (fifty vs three), `graeae-count` (two vs three), `harpies-count`, `sirens-parentage` (mother Melpomene vs Terpsichore vs Sterope — none nodes), `typhon-mother` (Gaia+Tartarus, undisputed within the seven), `scylla-monster-vs-glaucus-maiden` (born vs made a monster).

## 6. Roster & batch plan (≈26 new nodes; the `sphinx` gets new edges)

### Batch A — the sea-roots, the Gorgons & the Graeae (11)
`pontus`, `phorcys`, `ceto`, `nereus`, `thaumas`, `medusa`, `stheno`, `euryale`, `graeae`, `pegasus`, `chrysaor`. Wires `gaia` (Pontus' parent), `poseidon` (Medusa's lover; sire of Pegasus/Chrysaor), `perseus` (slayer of Medusa, robber of the Graeae), `bellerophon` (Pegasus' rider), and `nereus`→`thetis` (the Aeacid bridge).

### Batch B — Echidna, Typhon & the brood (10)
`echidna`, `typhon`, `orthrus`, `cerberus`, `hydra`, `chimera`, `nemean-lion`, `ladon`, `geryon`, `python`. Wires `gaia`/`tartarus` (Typhon), the existing `sphinx` (← Orthrus/Echidna), `bellerophon` (slayer of the Chimera), `apollo` (slayer of Python), and `chrysaor` (Geryon's father). Four documented contradictions (`echidna-parentage`, `ladon-parentage`, `chimera-parentage`, `nemean-lion-parentage`, `sphinx-parentage`). Heracles' labour-beasts (Hydra, Nemean Lion, Cerberus, Geryon, Ladon) stay boundary prose until a Heracles batch.

### Batch C — sea & standalone monsters (5)
`scylla-monster`, `charybdis`, `harpies`, `sirens`, `cetus`. Wires `phorcys`/`typhon` (Scylla, disputed — `scylla-parentage`), `thaumas` (the Harpies), `achelous` (the Sirens), the Boreads `zetes`/`calais` (the Harpy-chase), and `perseus`/`andromeda` (Cetus).

### Note-only / deferred
Eurybia, Iris, Thoosa, the individual Nereids and Callirhoe (sea/sky/Titan batches); the Caucasian eagle, the Colchian dragon, the Crommyonian sow/Phaea, Geryon's herdsman Eurytion (boundary monsters narrated in prose); the river Ladon and the constellations (geo/other layers).

## 7. Relation & data-modeling notes

1. Cluster: the monster brood → `chthonic` (the dark band below the disc); the sea-roots Pontus → `core` (a primordial), Phorcys/Ceto/Nereus/Thaumas → `chthonic` (so the brood hangs below their parents; `core` rMax 13 sits inside `chthonic` rMin 14, preserving generation order). Run `pnpm validate-layout` to confirm.
2. Collectives: the `graeae`, the `harpies`, and the `sirens` are single collective creature nodes (they act as one); the three Gorgons are separate nodes (Medusa is distinct and essential).
3. The disputes are competing topic-tagged parent edges (Echidna, Ladon, the Chimera/Nemean-Lion mother, the Sphinx) and Scylla's father.
4. Heracles is a boundary frame: the labour-beasts get their genealogy edges, and the Heracles fights are narrated in prose, until a Heracles node exists.
5. Boundary non-nodes (prose): Heracles, Crataeis, Callirhoe, Electra (the Oceanid), Melpomene/Terpsichore, Eurytion, Phineus, Crataeis, the golden apples.

## 8. Primary-source map

- [Hesiod, *Theogony*](https://www.theoi.com/Text/HesiodTheogony.html) — 233–239 (sea-roots), 270–336 (the brood), 820–880 (Typhoeus)
- [Pseudo-Apollodorus, *Bibliotheca* 1–2 & Epitome](https://www.theoi.com/Text/Apollodorus1.html) — 1.2.6, 2.4.2–3, 2.5, 1.6.3, Epit. 7.18–21
- [Homer, *Odyssey* 12](https://www.theoi.com/Text/HomerOdyssey12.html) (Scylla & Charybdis); *Iliad* 6 (the Chimera)
- [Ovid, *Metamorphoses* 4](https://www.theoi.com/Text/OvidMetamorphoses4.html) (Medusa, Perseus, Cetus)
- [Apollonius, *Argonautica* 2](https://www.theoi.com/Text/ApolloniusRhodius2.html) (the Harpies & the Boreads)

## 9. Conclusion

The monsters are the chthonic underside the atlas has been missing: from the Sea itself descend the sea-deities Phorcys and Ceto, and of them the stone-gazing Gorgons, the one-eyed Graiae, the serpent of the apples, and Echidna the mother of monsters, who by storm-born Typhon bears the beasts that the heroes must kill — Cerberus and the Hydra, the Chimera and the Nemean Lion — while from slain Medusa leap the winged horse and the golden-sword father of Geryon, and in the straits lurk Scylla and Charybdis. Build the sea-roots and the Gorgons first (Batch A), the Echidna/Typhon brood second (Batch B), the standalone sea-monsters third (Batch C); seat them in the chthonic band, resolve the `scylla`/`ceto` homonyms up front, keep Heracles a boundary frame, and preserve the parentage forks (Echidna, Ladon, the Chimera, the Sphinx) as first-class disputes.
