# The Children of the First Beings — completing the primordial broods — Research Dossier

> Research status: produced by a 7-lens audit of every primordial node against the canonical genealogies (Hesiod *Theogony* the master source; Apollodorus, Hyginus, Ovid, Homer, Apollonius, Pausanias for variants), 2026-06-14, corpus-verified. Gates the primordial-offspring expansion (M2.20–M2.26). Same-name hazards resolved per CLAUDE.md hard rule 7 BEFORE any batch is written.

## 1. Why this expansion

The atlas held all ten primordials (Chaos, Gaia, Tartarus, Eros, Erebus, Nyx, Uranus, Pontus, Aether, Hemera) and most of Nyx's daemon brood, but the audit found whole canonical broods missing: the elder Uranus+Gaia children (Cyclopes, Hecatoncheires), the castration-blood brood (Erinyes, Gigantes, Meliae), the fifth Pontid (Eurybia), the Mountains (Ourea), and several of Nyx's own children (Keres, Oneiroi, Hesperides, Philotes), plus the whole strife-brood of Eris. This expansion closes those gaps so the inner cosmos reads complete.

## 2. Batch plan (small verified batches — hard rule 3)

- **Batch 0** (edges only, no new nodes) — DONE: python→[hyginus,ovid]; typhon +hyginus; cecrops +apollodorus; cronus +apollonius; the five Spartoi all earth-born of Gaia; the Hyginus Aether+Dies parentage of Uranus & Pontus (dispute topics `uranus-parentage`, `pontus-parentage`). Gaia deliberately kept unbegotten.
- **Batch 1 — Eurybia** (1 node): the missing fifth Pontid, consort of Crius, mother of the existing Astraeus/Pallas/Perses (orphan-reference fix).
- **Batch 2 — the Titan-tier broods** (6 nodes): Cyclopes (Brontes, Steropes, Arges) + Hecatoncheires (Cottus, Briareus, Gyges).
- **Batch 3 — the castration-blood brood** (3 collective nodes): Erinyes, Gigantes, Meliae.
- **Batch 4 — Ourea & the earth-monsters** (3 nodes): Ourea, Tityos, Antaeus.
- **Batch 5 — Nyx's remaining children** (5 nodes): Keres, Oneiroi, Hesperides, Philotes, Styx.
- **Batch 6 — the strife-brood of Eris** (15 nodes): Ponos, Lethe (daimon), Limos, Algea, Hysminai, Makhai, Phonoi, Androktasiai, Neikea, Pseudea, Logoi, Amphillogiai, Dysnomia, Ate, Horkos.

## 3. Same-name hazard map & existing-node collisions (resolve before writing)

| Name | Resolution |
|---|---|
| **Melia** | `melia.json` ALREADY EXISTS = the Argive Oceanid (daughter of Oceanus, consort of Inachus). The ash-tree nymph brood uses the plural id **`meliae`**; NEVER attach a Uranus/Gaia edge to `melia`. |
| **Lethe** | `lethe.json` ALREADY EXISTS (the underworld figure/spring). Eris's daughter Forgetfulness uses **`lethe-daimon`**. |
| **Antaeus** | the Arcadian Argonaut (son of Lycurgus) is a plain attested name; the Libyan earth-giant wrestler uses **`antaeus-giant`** (Gaia per Hyginus; Apollodorus instead Poseidon — dispute). |
| **Cyclopes** | the Hesiodic/Uranian thunder-smiths (Brontes/Steropes/Arges) are DISTINCT from the Odyssean Cyclopes (Polyphemus, sons of Poseidon, not in data). Suffix **`-cyclops`**: `brontes-cyclops`, `steropes-cyclops`, `arges-cyclops`. |
| **Gyges** | the Hundred-Hander is distinct from the historical Lydian king Gyges (not in data). Use **`gyges-hecatoncheir`**. (Cottus, Briareus need no suffix.) |
| **Eros (Lysimeles)** | EDITORIAL: Hyginus lists "Love/Lysimeles" among Nyx+Erebus's brood, but `eros.json` already models the self-born primordial Eros (Hesiod) with no parents. Do NOT silently add a Nyx/Erebus parent edge — left to a human decision (see §5). |
| **Eris / Nyx** | Eris's fifteen children are parented to **`eris`** only, NEVER to `nyx` (they are Nyx's grandchildren). |
| **Ate** | ONE node with a dispute (Eris in Hesiod vs eldest daughter of Zeus in Homer), not two. |
| **Styx** | the dominant genealogy is the eldest Oceanid (Oceanus+Tethys); the Nyx+Erebus parentage is Hyginus-only and secondary. If `styx` is added, the Oceanid edge is primary. |
| **Hesperides** | collective node; DISPUTE: Nyx alone (Hesiod, Hyginus) vs daughters of Atlas (Apollodorus, others) — competing parent edges, topic `hesperides-parentage`. |

## 4. Proposed contradiction topics (≥2 entries ⇒ must be in CONTRADICTIONS.md)

| Topic id | Competing claims | Citations |
|---|---|---|
| `uranus-parentage` | Gaia alone (Hesiod) vs Aether+Dies (Hyginus) — DONE (Batch 0) | Theog. 126-128; Fab. preface |
| `pontus-parentage` | Gaia alone (Hesiod, Apollodorus) vs Aether+Dies (Hyginus) — DONE (Batch 0) | Theog. 131-132; Fab. preface |
| `echidna-parentage` | Phorcys+Ceto (Hesiod) vs Tartarus+Gaia (Apollodorus) — already documented | Theog. 295-303; Bibl. 2.1.2 |
| `hesperides-parentage` | Nyx alone (Hesiod, Hyginus) vs daughters of Atlas (Apollodorus) | Theog. 215-216; Bibl. 2.5.11 |
| `ate-parentage` | Eris (Hesiod) vs eldest daughter of Zeus (Homer) | Theog. 230; Iliad 19.91 |
| `tityos-parentage` | Gaia/Earth (Homer) vs Zeus+Elare hidden in earth (Apollodorus) | Od. 7.324; Bibl. 1.4.1 |
| `antaeus-parentage` | Gaia/Earth (Hyginus) vs Poseidon (Apollodorus) | Fab. 31; Bibl. 2.5.11 |

## 5. Flagged editorial decisions (NOT auto-written)

- **Eros-Lysimeles**: leave `eros` parentless (Hesiod's self-born force) — do not add the Hyginus Nyx+Erebus edge.
- **Gaia's parentage**: leave Earth unbegotten — do not add the Hyginus Aether+Dies edge (would give the Earth-mother surprising parents with no competing edge to form a clean dispute).

## 6. Type & cluster decisions

- Eurybia → `titan` / `titan-ring` (Pontid sea-goddess of the Titan generation, consort of the Titan Crius — shares his ring so the consort binary can form).
- Cyclopes, Hecatoncheires → `primordial` / `titan-ring` (elder Uranus+Gaia brood, the Titans' siblings; purple elder glow, placed on the Titan ring of their generation).
- Erinyes, Keres → `chthonic`-realm `creature` / `chthonic` (avenging death-powers below the disc); Gigantes → `creature` / `chthonic`; Meliae → `nymph` / `titan-ring` (born of the same blood as the elder gods); Ourea → `primordial` / `core`.
- Oneiroi, Hesperides, Philotes, Styx and Eris's strife-brood → `god`/`primordial`/`nymph` as fits each, mostly `night-court` (Nyx's daughters) and `chthonic` (the strife daemons), decided per figure at write time.

## 7. Primary sources

- [Hesiod, *Theogony*](https://www.theoi.com/Text/HesiodTheogony.html) — 116-153 (Chaos to Hundred-Handers), 183-206 (castration brood, Aphrodite), 211-232 (Nyx's & Eris's broods), 233-239 (Pontids)
- [Pseudo-Apollodorus, *Bibliotheca* 1.1-1.2](https://www.theoi.com/Text/Apollodorus1.html) — the elder broods and the Pontid sea-children
- [Hyginus, *Fabulae* preface](https://topostext.org/work/206) — the Latin Aether+Dies cosmogony and the Nox+Erebus daemon list

## 8. Conclusion

Close the inner cosmos brood by brood: the fifth Pontid Eurybia first (her children already hang waiting), then the famous Titan-tier broods (Cyclopes, Hundred-Handers), the castration-blood powers (Erinyes, Gigantes, Meliae), the Mountains and the earth-giants, Nyx's remaining daughters, and finally the fifteen children of Strife — each batch validated with `pnpm validate-data` and `pnpm validate-layout`, every homonym suffixed per §3, every dispute carried into CONTRADICTIONS.md per §4.
