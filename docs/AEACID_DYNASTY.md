# The Aeacid House — Asopus to Achilles and Ajax — Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus + web), 2026-06-12. **Batch A (12) entered into `data/characters/` on 2026-06-12** — the Aeacid trunk from Aegina to Achilles/Ajax/Neoptolemus, 33 relations, 1 documented contradiction (`phocus-murder`), all shipping the three-layer codex. **Wired straight into the Trojan sky**: `achilles`→`hector` (slayer), `paris`→`achilles` (slayer), `neoptolemus`→`priam` (slayer), `ajax-telamonian`↔`hector`, plus `aegina-nymph`→`asopus`/`zeus`, `telamon`→`hesione`→`teucer`, `eris` at Peleus' wedding, the Aeacids among `jason`'s Argonauts, and `achilles`↔`agamemnon` (the wrath). **Batches B and C entered on 2026-06-13 — the Aeacid house is COMPLETE: A+B+C = 25 figures**, ~98 relations, 1 documented contradiction (`phocus-murder`). Batch B added the Asopid eponym sisters (`metope`, `thebe`, `salamis-nymph`, `corcyra`) and the Phocis line (`crisus`, `panopeus`, `epeius` the Wooden-Horse builder); Batch C added Peleus' Phthian household (`eurytion`, `antigone-peleus`, `polydora`) and Achilles' circle (`patroclus`, `chiron`, `deidamia`). New interlocks: `hector`→`patroclus` (the death that breaks Achilles' wrath), `chiron`→`peleus`/`achilles`/`jason` (the tutor), `deidamia`→`neoptolemus`, `peleus`→`eurytion` (the Calydon accident), and `thebe`→`zethus` (a bridge to the Theban house). Verified branch-by-branch; same-name hazards and existing-node collisions resolved before any character was added (per CLAUDE.md hard rule 7).
>
> Scope: the house of Aeacus from the river Asopus and the nymph Aegina through Aeacus' three lines — Telamon of Salamis (Ajax, Teucer), Peleus of Phthia (Achilles, Neoptolemus), and the murdered Phocus — i.e. the Greek champions of the Trojan War. The deep war saga and the Trojan royal house are existing nodes the Aeacids plug into, not re-expanded.

## 1. Why this dynasty needs a dossier

1. **It is the Greek half of the Trojan War, and the war is already half in the sky.** Achilles, Ajax and Teucer slay and duel `hector`, fall to `paris`, and sack `priam`'s city — all existing nodes. The Aeacids must wire onto the Trojan house, not duplicate it.
2. **It plugs into edges already drawn.** `asopus` (Aegina's father), `hesione` (Telamon's prize, Teucer's mother), `eris` (the apple at Peleus' wedding), `zeus` (Aegina's ravisher), `sisyphus` (who betrayed the abduction — already `sisyphus-ally-asopus`) are all present.
3. **Severe id collisions with the geo layer.** `aegina`, `salamis`, `thebe`, `phocis`, `phthia` are place names already in `data/geo/`; the nymph/hero homonyms need suffixed character ids.
4. **The same-name traps are classic.** Two Ajaxes (Telamonian vs Locrian), two Antigones (Peleus' wife vs the Theban), two Phocuses (Aeacid vs Corinthian), two Epeiuses (the horse-builder vs Endymion's son).
5. **The signature myths carry real disputes.** Who killed Phocus (Telamon or Peleus), how the Myrmidons arose, why Thetis was given to a mortal, and the late invulnerable-heel motif (Statius — **out of scope**; Homer's Achilles is woundable).

## 2. Evidence policy

| Source id | Material |
|---|---|
| `homer` | The core: Achilles, Ajax, Teucer, Patroclus, Peleus and the war (the whole *Iliad*); Ajax in Hades (*Odyssey* 11.543–565), Achilles' shade (11.467–540) |
| `apollodorus` | The Aeacid stemma (Bibliotheca 3.12.6–3.13) and the Trojan Epitome 3–6 |
| `ovid` | Aeacus & the Myrmidons (Metamorphoses 7.490–660), Peleus & Thetis (11.221–265), the death of Achilles and the arms of Ajax (12.580–13.398) |
| `pausanias` | Aegina, Salamis, Phthia, Phocis cult and local genealogy (esp. 1.35, 2.29, 10.1) |
| `apollonius` | Telamon and Peleus among the Argonauts |
| `hyginus` | Variant genealogies, the apple (Fabulae 92), the Trojan catalogues |
| `hesiod` | Theogony only — Phocus and the Nereids (1003–1005); the dense Aeacid stemma is **Catalogue of Women**, OUT OF SCOPE |

Out of scope (research-only): the Catalogue of Women; the Epic Cycle (Cypria, Aethiopis, Little Iliad); **Statius' Achilleid and the Styx-dipped invulnerable heel**; Euripides; Pindar's Aeginetan odes; Ovid's Heroides.

## 3. Source-conscious overview

Bracketed nodes already exist. "[disputed]" = source-dependent edge.

```text
[asopus] + Metope
   └── Aegina (the nymph) + [zeus]   [Sisyphus ([sisyphus]) betrays the abduction to [asopus]]
       └── Aeacus (king of Aegina; the Myrmidons; judge of the dead)
           ├── + Endeïs
           │   ├── Telamon (Salamis)
           │   │   ├── + Periboea → Ajax the Great
           │   │   └── + [hesione] (daughter of Laomedon) → Teucer
           │   └── Peleus (Phthia)
           │       └── + Thetis (Nereid)  [wedding: [eris] throws the apple → the Trojan War]
           │           └── Achilles
           │               └── + Deidamia → Neoptolemus (sacks Troy, slays [priam])
           └── + Psamathe (Nereid)
               └── Phocus  [murdered by Telamon or Peleus — disputed] → the Phocian line (Crisus, Panopeus → Epeius)

Trojan membrane (edges onto existing nodes): achilles → [hector] (slayer); [paris] → achilles (slayer);
neoptolemus → [priam] (slayer); ajax/teucer/patroclus ↔ [hector] (war).
```

## 4. The same-name hazard map

| Name | Distinct entities |
|---|---|
| **Aegina** | `aegina-nymph` (the Asopid, mother of Aeacus) vs the geo region/island `aegina` in `data/geo/`. |
| **Salamis / Thebe / Phocis / Phthia** | the eponym nymphs `salamis-nymph`, `thebe` (Batch B) vs the geo places; Phocis/Phthia are existing regions — the Aeacid `phocus-aeacid` and Peleus' Phthian residence reference them, never recreate them. |
| **Ajax** | `ajax-telamonian` (the Great, son of Telamon) vs the Locrian Ajax son of Oileus (out of scope). |
| **Antigone** | `antigone-peleus` (Peleus' first wife, daughter of Eurytion) vs the existing Theban `antigone`. |
| **Phocus** | `phocus-aeacid` (son of Aeacus) vs the Corinthian Phocus son of Ornytion. |
| **Epeius** | `epeius` (son of Panopeus, the Wooden-Horse builder) vs Epeius son of Endymion. |
| **Asopus / Hesione / Eris / Zeus / Sisyphus / Poseidon / Priam / Hector / Paris** | already in the atlas — link, never recreate. |

## 5. Proposed contradiction topics

| Topic id | Competing claims | Citations |
|---|---|---|
| `phocus-murder` | The fatal blow at the games struck by Telamon vs by Peleus | Bibliotheca 3.12.6; the quoit/discus variants |
| `myrmidons-origin` | Ants made into men on an empty island vs ants made men after a plague | Bibliotheca 3.12.6 vs Metamorphoses 7.517–657 |
| `place-of-aegina-conception` | Zeus took Aegina to Oenone/Aegina vs to Delos | Bibliotheca 3.12.6; Pausanias 2.29.2 vs Fabulae 52 |
| `thetis-marriage` | Thetis simply wed to Peleus (Homer, Hesiod) vs given because the prophecy said her son would outshine his father (Apollodorus) | Iliad 18.432–434 vs Bibliotheca 3.13.5 |
| `achilles-immortality-rite` | Thetis anoints/burns the infant (Apollodorus) vs the late Styx-dipped invulnerable heel (out of scope, Statius — flagged, not entered) | Bibliotheca 3.13.6 |
| `achilles-death` | Slain by Paris and Apollo at the Scaean gate (all sources agree on the agents; the wound/heel varies) | Iliad 22.359–360; Apollodorus Epitome 5.3; Metamorphoses 12.580–628 |
| `endeis-parentage` | Endeïs daughter of Chiron vs of Sciron | Bibliotheca 3.12.6 vs Fabulae 14 |
| `telamon-parentage` | Telamon a true son of Aeacus vs a friend of different birth (the foster variant) | Bibliotheca 3.12.7 ("some say") |

Only `phocus-murder` is modeled as competing edges in Batch A (both Telamon and Peleus are nodes); the rest are narrated in sourced prose until their counter-nodes exist, or are inherently single-agent facts.

## 6. Roster interlocks with existing nodes

- `aegina-nymph` ← parent `asopus`, lover `zeus`; the abduction wires `asopus` adversary `zeus` and the existing `sisyphus`-ally-`asopus`.
- `aeacus` ← parent `zeus`.
- `telamon` consort `hesione` → `teucer` (Hesione is Teucer's mother); Telamon + Periboea → Ajax.
- `eris` → the apple at the wedding of Peleus + Thetis (adversary edge / `apple-of-discord` note).
- `achilles` slayer `hector`; `paris` slayer `achilles`; `neoptolemus` slayer `priam`; `ajax-telamonian` & `patroclus` adversary `hector` (Batch C for Patroclus).
- `peleus` adversary `acastus` (the existing `acastus` already models the swordless-on-Pelion betrayal).
- The Phocian line reaches the existing `pylades` (via Crisus → Strophius, Batch B).

## 7. Entity roster proposal

### Batch A — the Aeacid trunk (12 new + 3 existing wired) 

New: `aegina-nymph`, `aeacus`, `endeis`, `psamathe`, `telamon`, `peleus`, `thetis`, `achilles`, `ajax-telamonian`, `teucer`, `phocus-aeacid`, `neoptolemus`. Wires existing `asopus`, `hesione`, `eris` and the Trojan nodes `hector`/`priam`/`paris`. One documented dispute (`phocus-murder`); the Trojan-War edges land here.

### Batch B — the Asopid eponyms + the Phocis line (7)

`metope`, `thebe`, `salamis-nymph`, `corcyra`, `crisus`, `panopeus`, `epeius` — the eponym sisters and the Phocian offshoot (reaching `pylades` via Strophius).

### Batch C — Peleus' Phthian household and Achilles' circle (6)

`eurytion`, `antigone-peleus`, `polydora`, `patroclus`, `chiron`, `deidamia`.

## 8. Relation & data-modeling notes

1. `parent` child→parent only; `phocus-murder` = two `slayer` edges (Telamon→Phocus, Peleus→Phocus) sharing the topic.
2. Thetis typed `nymph` (a Nereid); Achilles/Ajax/Teucer/Neoptolemus/Aeacus/Phocus typed `hero`.
3. The invulnerable heel stays out — Homer's Achilles is woundable; narrate Thetis' rite per Apollodorus only.
4. No lineage file: Aegina, Salamis, Phthia are regions, not the six flagship lineage cities. Residences may point at the `aegina`/`phthia`/`salamis` regions only if those are valid city ids — otherwise omit (the city-sky is keyed to the six flagship cities).
5. Boundary non-nodes (prose only): Heracles, Odysseus, Lycomedes, Cychreus, Alcathous, Borus, Menesthius.

## 9. Primary-source map

- [Homer, *Iliad*](https://www.theoi.com/Text/HomerIliad1.html) (Achilles, Ajax, Teucer, Peleus throughout) and [*Odyssey* 11](https://www.theoi.com/Text/HomerOdyssey11.html)
- [Pseudo-Apollodorus, *Bibliotheca* 3](https://www.theoi.com/Text/Apollodorus3.html) (3.12.6–3.13) and [*Epitome*](https://www.theoi.com/Text/ApollodorusE.html) (3–6)
- [Ovid, *Metamorphoses* 7](https://www.theoi.com/Text/OvidMetamorphoses7.html) (Aeacus/Myrmidons), [*Met.* 11](https://www.theoi.com/Text/OvidMetamorphoses11.html) (Peleus/Thetis), [*Met.* 12–13](https://www.theoi.com/Text/OvidMetamorphoses12.html) (Achilles' death, the arms)
- [Pausanias, Book 2](https://www.theoi.com/Text/Pausanias2C.html) (Aegina) and [Book 1](https://www.theoi.com/Text/Pausanias1B.html) (Salamis)
- [Hyginus, *Fabulae*](https://topostext.org/work/206) (52, 92, 96–97, 107, 113)

## 10. Conclusion

The Aeacid house is the Greek spine of the Trojan War: from a ravished river-nymph descend the pious Aeacus, the bulwark Ajax, the archer Teucer, and Achilles himself, whose mother's wedding lit the war and whose son ended it. Build the trunk first (Batch A), wiring it straight into the existing Trojan sky; add the Asopid eponyms and the Phocis line second; the Phthian household and Achilles' circle third. Resolve every place-name and homonym to a suffixed id up front, keep the invulnerable heel out as the late accretion it is, and preserve the forks — who killed Phocus, how the Myrmidons rose, why a goddess wed a mortal — as first-class disputes.
