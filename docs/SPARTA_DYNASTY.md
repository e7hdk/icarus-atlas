# The Spartan / Lacedaemonian Royal House — Lelex to the Tyndarids — Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus + web), 2026-06-12. **Batch A (14) entered into `data/characters/` on 2026-06-12** — the Lelex-to-Dioscuri spine, 43 relations, 6 documented contradictions (`eponym-generation-count`, `perieres-parentage`, `tyndareus-parentage`, `hyacinthus-parentage`, `helen-parentage`, `dioscuri-paternity`), all shipping the three-layer codex. **The long-parentless `helen` and `clytemnestra` are now wired to Tyndareus/Leda/Zeus/Nemesis; `perieres-aeolid`→`cynortas`, `gorgophone`→Oebalus, `taygete`→`atlas`, `hyacinthus`↔`apollo`, the Dioscuri→`jason` are all live.** Areas integration done: `data/lineages/sparta.json` (king-list Lelex→…→Tisamenus) + `residences:[{city:'sparta'}]` populate `/city/sparta` and its city-sky. **Batches B and C entered on 2026-06-13 — the Spartan house is COMPLETE: A+B+C = 29 figures**, ~137 relations, 8 documented contradictions. Batch B added the Messenian wing (`aphareus`, `leucippus`, `idas`, `lynceus-apharetid`, `marpessa`, `arene`, the Leucippides `phoebe-leucippid`/`hilaira`/`arsinoe-leucippid`); Batch C added `icarius`→`penelope`, `periboea-naiad`, `hippocoon`, and the Tyndarid daughters `timandra`/`phylonoe`. New interlocks: the Dioscuri carried off the Leucippides (`castor`↔`hilaira`, `polydeuces`↔`phoebe-leucippid`), `idas`→`castor` and `polydeuces`→`lynceus-apharetid` (the deadly feud), `hippocoon`↔`tyndareus` (the usurpation), and the Apharetids among `jason`'s Argonauts. Two new documented contradictions (`marpessa-suitor`, `idas-parentage`); Sparta residences extended to the new Spartan royals. The bare Hippocoontid/Icariad catalogue names stay note-only. Verified branch-by-branch; same-name hazards and existing-node collisions resolved before any character was added (per CLAUDE.md hard rule 7).
>
> Scope: the Laconian autochthons and the house from Lelex through the eponyms (Eurotas, Sparte, Lacedaemon) to Amyclas, the Oebalus/Perieres seam, Tyndareus and Leda, the Dioscuri, and the Messenian Apharetid/Leucippid cousins. This is the **most densely interlocked addition in the atlas**: it wires the already-present `helen`, `clytemnestra`, `perieres-aeolid`, `gorgophone`, `nemesis`, `atlas` and `apollo` into one house.

## 1. Why this dynasty needs a dossier

1. **It joins two stemmas already in the sky.** Perieres is `perieres-aeolid` (entered as Aeolus' son) but the Laconian tradition makes him Cynortas' son; Gorgophone (`gorgophone`, daughter of Perseus) is his wife, then Oebalus'. The dossier must wire onto these existing nodes, not duplicate them.
2. **Helen and Clytemnestra already exist but are parentless.** Both were added (by the Pelopid/Trojan work) with marriage and child edges but **no parents** — because Tyndareus and Leda did not yet exist. Batch A supplies their parentage, and with it the atlas's richest parentage disputes.
3. **The succession forks twice over.** Eurotas is Lelex's son or grandson; Perieres or Oebalus heads the Tyndarid line; Tyndareus and Hyacinthus each have two fathers across sources.
4. **The signature myths are disputed at their core.** Helen's mother (Leda or Nemesis), the Dioscuri's paternity (mortal, divine, or split), who killed Castor (Idas or Lynceus), and whether Marpessa was carried off willingly — each is a documented inter-author dispute.
5. **Severe homonyms with existing nodes.** Phoebe (the Titan vs the Leucippid), Lynceus (the Danaid vs the Apharetid), and the city `sparta` vs the eponym nymph all demand suffixed ids.

## 2. Evidence policy

| Source id | Material |
|---|---|
| `apollodorus` | The backbone: the Laconian stemma and both forks (Bibliotheca 3.10.3–3.11.2), the Perieres dispute (1.9.5), Idas/Marpessa (1.7.8–9), the Dioscuri feud (3.11.2) |
| `pausanias` | The richest cult/king-list source — Book 3 (Laconia) throughout and Book 4 (Messenia): the eponyms (3.1.1–3.1.3), Hyacinthus (3.19.4), the Oebalus line (3.1.3–4), the Dioscuri and Leucippides (3.13–14), the Apharetids (4.2–3) |
| `homer` | Leda, Castor & Polydeuces and their alternating life (Odyssey 11.298–304), Helen "daughter of Zeus" and her brothers (Iliad 3.236–244), Idas vs Apollo for Marpessa (Iliad 9.557–564) |
| `hyginus` | The egg of Nemesis/Leda and the Dioscuri as Gemini (Fabulae 77, 80; Astronomica 2.8, 2.22), the split paternity (Fabulae 14.3), the Oebalus genealogy (Fabulae 78, 271) |
| `ovid` | Hyacinthus' death and flower (Metamorphoses 10.162–219) |
| `apollonius` | Idas, Lynceus and the Dioscuri among the Argonauts; Polydeuces boxing Amycus (Argonautica 1.146–155, 2.1–97) |
| `hesiod` | Theogony only at the edges; the dense Spartan genealogy is **Catalogue of Women** material — OUT OF SCOPE, never tagged `hesiod`. |

Out of scope (research-only): the Catalogue of Women, the Cypria, Euripides' *Helen*, Pindar *Nemean* 10, Theocritus 22, Plutarch, Ovid's *Heroides*/*Fasti*.

## 3. Source-conscious overview

Bracketed nodes already exist. "[disputed]" = source-dependent edge.

```text
Lelex (autochthon) ── Myles ── Eurotas  [Eurotas son or grandson of Lelex — disputed]
   └── Sparte + Lacedaemon (son of [zeus] + Taygete, the Pleiad daughter of [atlas])
       └── Amyclas + Sparte
           ├── Hyacinthus  [+ [apollo]; father Amyclas or Oebalus — disputed]
           └── Cynortas
               └── (Perieres = [perieres-aeolid]) / Oebalus  [Tyndarid line via Perieres or Oebalus — disputed]
                   + [gorgophone] (daughter of [perseus])  / the Naiad Batia
                   ├── Tyndareus + Leda
                   │   ├── Castor          [mortal, son of Tyndareus]   ┐ dioscuri-paternity
                   │   ├── Polydeuces      [immortal, son of [zeus]]    ┘ (Homer: both Tyndareus')
                   │   ├── [helen]         [father [zeus]; mother Leda or [nemesis] — disputed]
                   │   └── [clytemnestra]  [mortal, daughter of Tyndareus]
                   ├── Icarius + the Naiad Periboea → Penelope (+ Odysseus, boundary)   [Batch C]
                   ├── Hippocoon → the Hippocoontids (slain by Heracles, boundary)      [Batch C]
                   ├── Aphareus + Arene → Idas, Lynceus-apharetid (Marpessa)            [Batch B]
                   └── Leucippus → Phoebe-leucippid, Hilaira (the Leucippides), Arsinoe [Batch B]
```

## 4. The same-name hazard map

| Name | Distinct entities |
|---|---|
| **Sparta / Sparte** | `sparte` (the eponym nymph, daughter of Eurotas) vs the city node `sparta` in `data/geo/cities.json`. |
| **Phoebe** | `phoebe-leucippid` (daughter of Leucippus, carried off by a Dioscurus) vs existing `phoebe` (the **Titan**, mother of Leto). |
| **Lynceus** | `lynceus-apharetid` (sharp-sighted son of Aphareus, brother of Idas) vs existing `lynceus` (the **Danaid** king of Argos). |
| **Eurydice** | `eurydice-lacedaemon` (daughter of Lacedaemon, wife of Acrisius — Argive bridge) vs existing `eurydice-thebes` and the chthonic Eurydice. |
| **Arsinoe / Periboea / Batia** | `arsinoe-leucippid`, `periboea-naiad`, `batia-naiad` — suffixed Naiad/spouse nodes, each with famous homonyms. |
| **Eurytus / Alcon / Idas / Aphareus / Leucippus** | scope-filtered: the Spartan/Messenian figure is the in-scope one; Homeric/other homonyms (Eurytus of Oechalia, the Egyptiad Idas, the Aeginetan Leucippus) are excluded. |
| **Perieres / Gorgophone / Helen / Clytemnestra / Nemesis** | already in the atlas — link, never recreate. |

## 5. Proposed contradiction topics

| Topic id | Competing claims | Citations |
|---|---|---|
| `eponym-generation-count` | Eurotas son of Lelex (Apollodorus) vs grandson via Myles (Pausanias) | Bibliotheca 3.10.3 vs Description of Greece 3.1.1 |
| `perieres-parentage` | Perieres son of Aeolus vs of Cynortas | Bibliotheca 1.9.5 / Theogony-tradition vs Bibliotheca 3.10.3 |
| `tyndareus-parentage` | Tyndareus son of Perieres vs of Oebalus | Bibliotheca 3.10.3 vs Description of Greece 3.1.3–4; Fabulae 78 |
| `hyacinthus-parentage` | Hyacinthus son of Amyclas vs of Oebalus | Bibliotheca 3.10.3 vs Fabulae 271 |
| `helen-parentage` | Helen's mother Leda vs Nemesis (the egg) | Bibliotheca 3.10.7; Fabulae 77 vs Astronomica 2.8; Description of Greece 1.33.7 |
| `dioscuri-paternity` | Castor & Polydeuces both Tyndareus' (Homer) vs split — Polydeuces Zeus', Castor Tyndareus' (Apollodorus, Hyginus) | Odyssey 11.298–304 vs Bibliotheca 3.10.7; Fabulae 77 |
| `castor-slayer` | Castor killed by Idas (Apollodorus) vs Castor first kills Lynceus then is killed by Idas (Hyginus) | Bibliotheca 3.11.2 vs Fabulae 80 |
| `marpessa-suitor` | Idas vs Apollo for Marpessa; she chooses Idas (Apollodorus) / carried off not unwilling (Pausanias) | Iliad 9.557–564; Bibliotheca 1.7.8–9; Description of Greece 5.18.2 |
| `idas-parentage` | Idas son of Aphareus vs of Poseidon | Bibliotheca 3.10.3 vs the "many say" variant |
| `asclepius-mother` (boundary) | Arsinoe the Leucippid vs Coronis — Asclepius stays a non-node | Bibliotheca 3.10.3; Description of Greece 2.26.7 |
| `penelope-fate` (boundary) | Faithful wife (Homer) vs sent away by Odysseus (Apollodorus Epit. 7.38) | Odyssey 24.193 vs Epitome 7.38 |
| `hippocoontid-roster` (boundary) | Apollodorus' 12 sons vs Pausanias' cult names vs Hyginus' hunters | Bibliotheca 3.10.5; Description of Greece 3.14.6–3.15.2 |

## 6. Roster interlocks with existing nodes

- **`helen`** ← parent `zeus` (father), and mother disputed `leda` vs `nemesis` (`helen-parentage`); sister of the Dioscuri and Clytemnestra.
- **`clytemnestra`** ← parents `tyndareus` + `leda` (the fully mortal daughter).
- **`perieres-aeolid`** ← add parent `cynortas` and tag the existing `perieres-aeolid → aeolus-hellene` edge with `perieres-parentage`.
- **`gorgophone`** ← add consort `oebalus` (Pausanias: the first woman to marry twice).
- **`atlas`** ← `taygete` parent edge (a Pleiad, like the existing `merope-pleiad`).
- **`apollo`** ↔ `hyacinthus` (lover + the accidental discus death); ↔ Idas (`marpessa-suitor`); → Asclepius (boundary).
- **`zeus`** ← `lacedaemon`, `polydeuces`, `helen` (fathered); lover of `leda` and `taygete`.
- **`nemesis`** ← `helen` parent (the egg tradition).
- **`jason`** ← `castor`/`polydeuces` ally (Argonauts), like the existing Boread ally-edges.

## 7. Entity roster proposal

### Batch A — the spine: eponyms, the Oebalus seam, Tyndareus, Leda, the Dioscuri (15)

`lelex-laconia`, `myles`, `eurotas`, `sparte`, `lacedaemon`, `taygete`, `amyclas`, `cynortas`, `oebalus`, `tyndareus`, `leda`, `castor`, `polydeuces`, `hyacinthus`, `batia-naiad`. Closes a sub-tree from the autochthon Lelex to the Dioscuri, wiring the existing `helen`/`clytemnestra` into their parents and lighting six documented disputes. Anchors onto `zeus`/`atlas` (Lacedaemon/Taygete), `apollo` (Hyacinthus), `perieres-aeolid`/`gorgophone` (the seam), and `nemesis` (Helen's egg).

### Batch B — the Messenian wing: Apharetids and Leucippids (9)

`aphareus`, `arene`, `leucippus`, `idas`, `lynceus-apharetid`, `marpessa`, `phoebe-leucippid`, `hilaira`, `arsinoe-leucippid` — hanging off the existing `perieres-aeolid`; the Idas/Apollo and Dioscuri-feud disputes; Asclepius as a boundary note.

### Batch C — Icarius/Penelope and the Hippocoontid leaves (≈11)

`icarius`, `penelope`, `periboea-naiad`, `hippocoon`, `timandra`, `phylonoe`, and a curated subset of the Icariads and Hippocoontids; Odysseus and Heracles stay boundary prose.

## 8. Relation & data-modeling notes

1. `parent` from child to parent only; disputed parentage = competing topic-tagged `parent` edges on ONE child node.
2. The Tyndarids are a recognised nuclear brood — `castor`/`polydeuces`/`helen`/`clytemnestra` take sibling edges among themselves despite the dual paternity (they are universally "the children of Leda"), unlike scattered Zeus half-siblings.
3. Dioscuri typed `hero` (horse-tamer and boxer, Argonauts) even though they end half-divine — consistent with the project's treatment of demigods.
4. The egg/swan and Hyacinthus' flower have no relation type — narrate in sourced prose.
5. **Areas**: create `data/lineages/sparta.json` (the king-list) and give the Sparta-resident figures `residences:[{city:'sparta'}]`, populating `/city/sparta` and its city-sky. (Messene/Amyclae are not flagship nodes.)
6. Boundary non-nodes — keep as prose, never edges: Heracles (restoring Tyndareus, slaying the Hippocoontids), Odysseus (winning Penelope), Asclepius, Amycus.

## 9. Primary-source map

- [Pseudo-Apollodorus, *Bibliotheca* 3](https://www.theoi.com/Text/Apollodorus3.html) (3.10–3.11) and [*Library* 1](https://www.theoi.com/Text/Apollodorus1.html) (1.7.8–9, 1.9.5)
- [Pausanias, Book 3 (Laconia)](https://www.theoi.com/Text/Pausanias3A.html) and [Book 4 (Messenia)](https://www.theoi.com/Text/Pausanias4A.html)
- [Homer, *Iliad* 3 & 9](https://www.theoi.com/Text/HomerIliad3.html); [*Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html)
- [Hyginus, *Fabulae*](https://topostext.org/work/206) (77, 78, 80, 155, 271) and *Astronomica* 2.8, 2.21–22
- [Ovid, *Metamorphoses* 10](https://www.theoi.com/Text/OvidMetamorphoses10.html) (Hyacinthus)
- [Apollonius, *Argonautica* 1–2](https://www.theoi.com/Text/ApolloniusRhodius1.html) (Idas, the Dioscuri, Amycus)

## 10. Conclusion

The Spartan house is the keystone that locks the southern Peloponnese into the rest of the sky: it gives the long-parentless Helen and Clytemnestra their mother and brothers, joins the Aeolid Perieres line to the Laconian throne, threads the Pleiad Taygete back to Atlas, and sets the Dioscuri among the Argonauts and the stars. Build the Lelex-to-Dioscuri spine first (Batch A), the Messenian Apharetids second (Batch B), the Icarius/Penelope and Hippocoontid leaves third (Batch C); resolve every homonym up front; and preserve each fork — whose son is Tyndareus, whose daughter is Helen, which twin is the god's — as a first-class dispute, so the same sky changes its parents as the teller changes.
