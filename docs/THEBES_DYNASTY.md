# The Theban / Cadmean House — Completion Dossier

> Research status: the Theban house was built incrementally into the atlas **before** this dossier (34 nodes already present, with a Thebes city node, `data/lineages/thebes.json`, and 32 residents). This dossier is a **completion audit**: it maps what already exists, names the verified gaps, and gates the small completion batch that finishes the house. Source-mapped against the seven atlas lenses (corpus + web), 2026-06-14. Same-name hazards and existing-node collisions resolved before entry (per CLAUDE.md hard rule 7).

## 1. What already exists (the standing house — 34 nodes)

The Cadmean spine and its tragedies are in the sky already. Bracketed = existing node.

```text
[agenor] (the Phoenician) ── [europa], [cadmus]  (Phoenix, Cilix out of scope)
[cadmus] + [harmonia]
   ├── [autonoe]  + Aristaeus(NEW) ── Actaeon(NEW)
   ├── [ino]      + Athamas ── [learchus], [melicertes]   (entered with the Aeolids)
   ├── [semele]   + Zeus ── [dionysus]
   ├── [agave]    + [echion] ── [pentheus]
   └── [polydorus] + Nycteis(NEW) ── [labdacus]
                                        └── [laius] ── [oedipus] + [jocasta]/[euryganeia]
                                              ├── [eteocles] ── Laodamas(NEW)
                                              ├── [polynices] ── Thersander(NEW)
                                              ├── [antigone] (+ [haemon])
                                              └── [ismene]
The Spartoi (Sown Men): [echion], [udaeus] + Chthonius(NEW), Hyperenor(NEW), Pelorus(NEW)
The Nycteid regency: [nycteus] ── [antiope] ── [amphion] (+ [niobe]), [zethus];  [lycus] + [dirce]
Seers & throne: [tiresias] (← [udaeus] via Everes), [manto], [creon], [menoeceus], menoeceus-young
```

Other present nodes: `sphinx`, `chrysippus`, `udaeus`, `euryganeia`, `menoeceus-young`. Thebes lineage rulers already ranked: Cadmus → Pentheus → Polydorus → Labdacus → Lycus → Amphion & Zethus → Laius → Oedipus → Eteocles & Polynices → Creon → (Creon regent) → Laodamas → Thersander.

## 2. The verified gaps (what is missing)

1. **Actaeon** — the fourth of Cadmus' grandchild-tragedies. Pentheus (madness), Ino (the leap), Semele (the lightning) are all present; Actaeon (the hounds) is conspicuously absent. Son of Autonoe.
2. **Aristaeus** — Autonoe's husband, Actaeon's father, the rustic culture-god (son of Apollo and Cyrene). Completes Autonoe's branch.
3. **The three missing Spartoi** — Chthonius, Hyperenor, Pelorus. Apollodorus 3.4.1 names five Sown Men; only `echion` and `udaeus` are nodes (they earned it through descendants). Adding the other three completes the canonical five.
4. **Nycteis** — Polydorus' wife and Labdacus' mother (daughter of Nycteus). `polydorus` currently has no consort edge and `labdacus` no mother edge; she is the genealogically load-bearing link that also ties the Nycteus/Antiope regency to the main Cadmean line.
5. **Thersander** & **Laodamas** — the Epigoni-generation kings already named in the lineage but not yet nodes: Thersander son of Polynices (the Epigonos who retakes Thebes, then dies at Troy) and Laodamas son of Eteocles (the king the Epigoni defeat).

Deliberately left **note-only** (bare catalogue names, per the atlas convention used for the Hippocoontids and Melas/Andraemon): Cyrene (Aristaeus' mother, a Thessalian/Libyan nymph, not Theban), Telephassa (Cadmus' mother), Aedon (a variant wife of Zethus), Illyrius (Cadmus' late Illyrian son), and the fourteen Niobids. Deferred to the **Heracles batch**: Megara (Creon's daughter, Heracles' first wife).

## 3. The same-name hazard map

| Name | Distinct entities |
|---|---|
| **Chthonius** | `chthonius-spartos` (the Sown Man) vs the Giant Chthonius and the son of Aegyptus; mind also the atlas's `erichthonius-athens`/`erichthonius-troy`. |
| **Hyperenor** | `hyperenor-spartos` (the Sown Man) vs the Trojan Hyperenor whom Menelaus kills (*Iliad* 14.516–519, 17.24–60). |
| **Laodamas** | `laodamas-theban` (son of Eteocles) vs Laodamas son of Alcinous, the Phaeacian (*Odyssey* 8). |
| **Thersander** | the Epigonos (son of Polynices) vs Thersander son of Sisyphus — the Epigonos is the famous one; kept as plain `thersander`, the homonym noted. |
| **Actaeon** | the Theban hunter (this figure) vs the Corinthian Actaeon, son of Melissus — the Theban is THE Actaeon, kept plain. |
| **Aristaeus / Nycteis** | one figure each in scope; `nycteis` (daughter of Nycteus) ≠ her father `nycteus` (existing node). |

## 4. Existing-node interlocks

- `actaeon` ← `aristaeus` + `autonoe`; his death is the wrath of `artemis` (the hounds are boundary prose).
- `aristaeus` ← `apollo` (Cyrene, his mother, stays boundary); consort `autonoe`.
- The three new Spartoi ← `gaia` (autochthonous, sprung from the sown earth — matching the existing `udaeus`→`gaia`); narrate Cadmus' sowing in prose.
- `nycteis` ← `nycteus`; consort `polydorus`; and a NEW mother edge `labdacus` ← `nycteis`.
- `thersander` ← `polynices`; `laodamas-theban` ← `eteocles`; the **Epigoni war** wires `thersander`/`diomedes` (the existing Calydonian Diomedes was an Epigonos) against `laodamas-theban`.

## 5. Contradiction topics

No new node-to-node disputes. Actaeon's **offense** (he saw Artemis bathing, or boasted to outhunt her, or wooed Semele — Apollodorus 3.4.4) is a single-figure multi-variant narrated in sourced prose, not a competing edge. Laodamas' **fate** (slain by Alcmaeon vs the night-flight to the Encheleans) is likewise prose. The pre-existing Theban topics (`europa-paternity`, the Oedipus/Sphinx material) are untouched.

## 6. Roster & batch

**Theban completion batch (8):** `actaeon`, `aristaeus`, `chthonius-spartos`, `hyperenor-spartos`, `pelorus-spartos`, `nycteis`, `thersander`, `laodamas-theban`. All `mortal-arm`; `aristaeus` typed `god`, `actaeon`/the Spartoi/`thersander` typed `hero`, `nycteis`/`laodamas-theban` typed `mortal`. Each ships the three-layer codex (sourced mythology + Wikipedia-section reference + Legacy gallery). No new lineage file (Thebes already has one); residences set to Thebes for the new Thebans (Aristaeus, a wandering rustic god, kept without a Theban residence beyond Autonoe's marriage — decided at entry).

## 7. Conclusion

The Theban house stood almost complete: the dragon-slayer Cadmus and his doomed daughters, the seer Tiresias, the Labdacid kings down to the brothers who killed each other at the seventh gate. What remained were the hunter Actaeon and his rustic father, the last three of the five Sown Men, the wife who carried Polydorus' line, and the two Epigoni-age kings who close the Theban king-list. With them the Cadmean house is whole, the Sown Men are five, and the lineage's named rulers are all stars.
