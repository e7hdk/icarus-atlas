# The Nymphs — taxonomy, inventory & batch plan — Research Dossier

> Research status: source-mapped taxonomy locked 2026-06-15. **51** character nodes carry `type: "nymph"` (~4.4% of the live roster); **Pleiades complete (7/7)**. This dossier gates future entry; same-name hazards must be resolved before any character is written (per CLAUDE.md hard rule 7).
>
> **Schema locked 2026-06-15:** mythological sub-class lives in `kinds: FigureKind[]` (max 3), **not** in `domains` and **never** as extra `CharacterType` values. Primary `type: "nymph"` alone drives emerald glow and timeless mortal-clock placement. See docs/PLAN.md §5.1.
>
> **Batch E entered 2026-06-15:** 4 figures — `alcyone-pleiad`, `celaeno-pleiad`, `electra-pleiad`, `sterope-pleiad` — completing the seven sisters. `electra-atlas` stays `hero`; maternity retargeted to `electra-pleiad`. One contradiction (`oenomaus-sterope-relation`).
>
> **Batch F entered 2026-06-15:** 1 figure — `cyrene-nymph` — Libyan/Peneus nymph wired to Apollo, Aristaeus, and Idmon. One contradiction (`idmon-parentage`).
>
> **Phase 2 plan locked 2026-06-15:** Batches **G–L** below — deferred §3 candidates, city-eponym kind pass, Pleione parent edges, Trojan nymph wires, and hygiene backfill. Batch F complete.
>
> **Batch D entered 2026-06-15:** 4 figures — `daphne-nymph`, `echo-nymph`, `arethusa-nymph`, `syrinx-nymph` — iconic Metamorphoses nymphs wired to the existing story shelf and Apollo/Pan/Hera edges. Reuses documented contradiction `daphne-transformation-agent`.
>
> **Batch C entered 2026-06-15:** 3 figures — `cyllene-oread`, `nonacris-oread`, `melia-thebes` — Arcadian oreads of the Pelasgid/Lycaonid line and the Boeotian ash-nymph of the Ismenian spring. One documented contradiction (`lycaon-mother`).
>
> **Batch B entered 2026-06-15:** 2 figures — `batia-naiad`, `cleocharia-naiad` — wiring Oebalus↔Batia and Lelex↔Cleocharia↔Eurotas. One documented contradiction (`tyndareus-mother`).
>
> **Batch A entered 2026-06-15:** 6 figures — `doris-oceanid`, `electra-oceanid`, `eurynome`, `metis`, `amphitrite`, `galatea-nymph` — wiring Nereus↔Doris, Thaumas↔Electra, Charites↔Eurynome, Metis↔Athena, Poseidon↔Amphitrite, and the Galatea/Acis line. One documented contradiction (`amphitrite-parentage`).
>
> **Batch 0 backfill complete 2026-06-15:** 36/37 nymph nodes tagged with `kinds`; 25 centaur nodes tagged `kinds: ["centaur"]`; `styx` tagged `kinds: ["oceanid"]`. **`calypso`** omitted — Homer attests only “daughter of Atlas” with no sub-class in our seven lenses (kinds deferred until a sourced tag lands).

## 1. Why this cluster

1. **"Nymph" is not one thing.** Ancient sources distinguish Oceanids, Nereids, Naiads, Dryads, Hamadryads, Oreads, Pleiads, Nephelai, Meliae, Hesperides — the atlas currently collapses them into one green star and scatters the distinction across free-text `domains` or id suffixes (`erato-dryad`).
2. **The sky is already full of nymph prose.** Batia, Cleocharia, and dozens of unnamed Naiads appear in Spartan and Attic genealogies without nodes; iconic metamorphosis nymphs (Daphne, Echo, Arethusa, Syrinx) now have nodes in Batch D — Creusa, Cyrene, and others remain deferred.
3. **Homonym density is high.** `chariclo` (Theban) vs `chariclo-centaur`; `melia` (Argive Oceanid) vs `meliae` (ash brood); `clymene` (Oceanid) vs `clymene-catreus`; `erato-dryad` vs `erato-muse`; city eponyms (`aegina-nymph`, `thebe`) vs geo regions.
4. **Dual identity figures need two layers.** Styx is genealogically an Oceanid but functionally a `god` (oath river); Thetis is a Nereid but typed `nymph`. Primary `type` = cosmic role; `kinds` = mythological class.

## 2. Type vs kinds (locked contract)

| Field | Purpose | Affects glow? | Affects layout? | Example |
|---|---|---|---|---|
| `type` | One of eight cosmic roles | ✅ | ✅ | `nymph` → emerald |
| `kinds` | Controlled sub-taxonomy (0–3) | ❌ | ❌ | `['nereid']` on Thetis |
| `domains` | Thematic prose tags | ❌ | partial (realm keywords) | `"prophetess of Pan"` |
| `id` suffix | Homonym disambiguation | ❌ | ❌ | `erato-dryad` |

**Rules for data entry:**

- New `nymph` entries **must** include at least one `NYMPH_KINDS` value in `kinds`.
- New `creature` entries **must** include at least one `CREATURE_KINDS` value (see docs/CENTAURS.md).
- Do **not** put mythological class in `domains` ("dryad nymph" → use `kinds: ['dryad']`).
- `kinds` may stack (max 3): e.g. Maia → `['pleiad']` (Pleione is Ocean's daughter; add `oceanid` only if sourced parentage is in the node).
- Cross-type `kinds` on non-nymph figures is allowed when sourced: Styx → `type: 'god'`, `kinds: ['oceanid']`.

### Nymph kinds (`NYMPH_KINDS`)

| Kind | Greek class | Notes |
|---|---|---|
| `oceanid` | Ὠκεανίς | Daughter of Oceanus + Tethys |
| `nereid` | Νηρηΐς | Daughter of Nereus + Doris |
| `naiad` | Ναϊάς | Fresh-water nymph (spring, river, lake) |
| `dryad` | Δρυάς | Tree nymph (general) |
| `hamadryad` | Ἁμαδρυάς | Tree-bound nymph (life linked to one tree) |
| `oread` | Ὀρεάς | Mountain nymph |
| `pleiad` | Πλειάς | One of the seven daughters of Atlas + Pleione |
| `melia` | Μελία | Ash-tree nymph (Hesiodic brood; ≠ Oceanid `melia`) |
| `nephele` | Νεφέλη | Cloud nymph |
| `hesperid` | Ἑσπερίς | Evening nymph of the western garden |

Enum grows only via verified batches and PLAN.md decision-log entry — never ad hoc strings.

## 3. Live inventory (51 nodes — Pleiades 7/7)

| id | Target `kinds` | Notes |
|---|---|---|
| `clymene`, `asia`, `melia`, `philyra`, `perseis-oceanid`, `idyia-oceanid`, `plouto`, `orseis` | `oceanid` | |
| `thetis`, `psamathe`, `galatea-nymph` | `nereid` | |
| `praxithea-naiad`, `periboea-naiad`, `zeuxippe-naiad`, `batia-naiad`, `cleocharia-naiad`, `daphne-nymph`, `arethusa-nymph`, `cyrene-nymph` | `naiad` | |
| `erato-dryad` | `dryad` | |
| `cyllene-oread`, `nonacris-oread`, `argiope-parnassus`, `callisto`, `echo-nymph` | `oread` | |
| `syrinx-nymph` | `hamadryad` | |
| `melia-thebes` | `melia` | ≠ Argive `melia` or collective `meliae` |
| `meliae` | `melia` | collective ash nymphs |
| `nephele`, `nubes-ixion` | `nephele` | |
| `maia`, `taygete`, `merope-pleiad`, `alcyone-pleiad`, `celaeno-pleiad`, `electra-pleiad`, `sterope-pleiad` | `pleiad` | `electra-atlas` = hero star-myth, not merged |
| `hesperides` | `hesperid` | collective |
| `aegina-nymph`, `thebe`, `salamis-nymph`, `corcyra`, `metope`, `sinope-nymph`, `astypalaea`, `rhodos`, `sparte` | `naiad` or `oceanid` | verify per source before backfill |
| `chariclo` | `naiad` | ✅ tagged Batch 0; Theban, mother of Tiresias |
| `argiope-parnassus` | `oread` | verify in Batch K |
| `chariclo-centaur` | `oceanid` | Pelion consort of Chiron |
| `calypso`, `callisto`, `pasiphae`, `eidothea-proteus` | TBD | Batch K hygiene pass |

**Unpromoted / prose-only (batched in §5):**

| Figure | Batch | Notes |
|---|---|---|
| **Cyrene** | F ✅ | Apollo's Libyan lover; mother of Aristaeus and (per Hyginus) Idmon. Homonym: Ares' Thracian consort → `diomedes-thrace` prose. |
| **Endymion's wife** | G | Apollodorus 1.7.6: Aetolus born to Endymion by a Naiad nymph *or*, as some say, by Iphianassa — overlaps `endymion-children` in AEOLUS_DYNASTY. Do **not** merge with Homer's Iphianassa daughter of Agamemnon. |
| **Liriope** | G | Narcissus' mother in Ovid; plain name in `narcissus-echo` cast — promote `liriope-nymph`. |
| **Peirene** | G | Corinth spring nymph, mother of Leches and Cenchrias by Poseidon; parentage disputed (Achelous vs Oebalus). |
| **Calybe** | J | Apollodorus names Bucolion son of Laomedon by nymph Calybe — rival to Homer's `abarbarea-trojan`. |
| **Pleione** | I | Ocean's daughter, mother of all seven Pleiads — no node yet; parent edges missing on sisters. |
| **Individual Hesperids** | I | Collective `hesperides` exists; Apollodorus names Aegle, Erytheia, Hesperia, Arethusa — last ≠ `arethusa-nymph`. |
| **Chione (Boreas' daughter)** | L | Eumolpus' mother — distinct from `chione-athens` and `chione-daedalion`. |
| **Chrysopelia** | L | Arcas' consort per Eumelus (Apollodorus 3.9.1) — rival to Leanira/Meganira. |
| **Creusa (nymph)** | L | **Research gate:** no distinct nymph attestation in corpus under that label; `creusa-athens` is mortal (Erechtheus' daughter). Do not promote until a sourced nymph-class Creusa is verified. |

## 4. Same-name hazard map

| Name | Resolution |
|---|---|
| **Alcyone** | `alcyone-pleiad` = Pleiad, Poseidon's lover · `alcyone-aeolid` = daughter of Aeolus, Ceyx's wife and halcyon |
| **Celaeno** | `celaeno-pleiad` = Pleiad, Poseidon's lover · Harpy Celaeno = plain name in `harpies` prose |
| **Electra** | `electra-pleiad` = Pleiad nymph, mother of Dardanus/Iasion · `electra-atlas` = hero, star-grief for Troy · `electra` = Agamemnon's daughter · `electra-oceanid` = Thaumas' wife |
| **Sterope** | `sterope-pleiad` = Pleiad, Oenomaus' wife (disputed) · `steropes-cyclops` = Cyclops smith |
| **Daphne** | `daphne-nymph` = Peneus' daughter → laurel (Ovid, Hyginus) · Arcadian huntress on the Ladon = prose in `daphne-laurel` story and Pausanias 8.20.2–4, not a node |
| **Arethusa** | `arethusa-nymph` = Sicilian spring nymph, Alpheus' pursuit (Ovid) · Hesperid in Apollodorus' Ladon roll = plain name until promoted · Homeric spring on Ithaca = same tradition, geo layer |
| **Chariclo** | `chariclo` = Theban nymph, mother of Tiresias · `chariclo-centaur` = Pelion consort of Chiron |
| **Melia** | `melia` = Argive Oceanid, mother of Phoroneus · `meliae` = Hesiodic ash-nymph brood · `melia-thebes` = Boeotian ash-nymph, Apollo's lover at the Ismenian spring |
| **Cyllene** | `cyllene-oread` = Arcadian oread, consort of Pelasgus · `cyllen` = male eponym of Mount Cyllene, son of Elatus |
| **Nonacris** | `nonacris-oread` = wife of Lycaon, eponym of the Arcadian town · `syrinx-nymph` = Hamadryad of the same summit in Ovid |
| **Clymene** | `clymene` = Oceanid, Iapetionid mother · `clymene-catreus` = Crete · `clymene` in Arcadia (Atalanta's mother) = prose on `iasus-arcadia`, not a node |
| **Erato** | `erato-dryad` = Arcadian Dryad, wife of Arcas · `erato-muse` = Muse of erotic poetry |
| **Nephele** | `nephele` = Athamas cloud · `nubes-ixion` = Hyginus cloud-mother of Centaurus |
| **Batia** | `batia-naiad` = Spartan Naiad, wife of Oebalus, mother of Tyndareus · Trojan princess (Teucer's daughter, Dardanus' bride) = plain name in `dardanus`/`teucer-troas` prose only |
| **Periboea** | `periboea-naiad` = Icarius' wife, mother of Penelope · other Periboeae exist in myth — disambiguate id |
| **Aegina** | `aegina-nymph` = the nymph · geo region `aegina` = separate layer |
| **Cyrene** | `cyrene-nymph` = Peneus/Libya nymph, Apollo's lover, mother of Aristaeus · Thracian Cyrene (Ares, mother of Diomedes) = plain name in `diomedes-thracian` prose only |
| **Creusa** | `creusa-athens` = mortal princess, Xuthus' wife · `creusa-troy` = Priam's daughter · nymph Creusa = not verified — do not merge |
| **Chione** | `chione-athens` = daughter of Boreas, mother of Eumolpus · `chione-daedalion` = Daedalion's daughter, Philammon's mother · other Chiones = disambiguate id |
| **Pleione** | `pleione-oceanid` = Ocean's daughter, mother of the Pleiads · not to be confused with the constellation name alone |
| **Arethusa (Hesperid)** | Apollodorus' Hesperid Arethusa = plain name until promoted (`*-hesperid`) · `arethusa-nymph` = Alpheus' Sicilian spring nymph |
| **Calybe / Abarbarea** | `calybe-nymph` = Apollodorus' mother of Bucolion · `abarbarea-trojan` = Homer's fountain-nymph mother of Aesepus and Pedasus |
| **Liriope** | `liriope-nymph` = Cephissus' lover, Narcissus' mother · no other Liriope nodes |
| **Peirene** | `peirene-naiad` = Corinth spring nymph · geo `corinth` = separate layer |
| **Iphianassa (Elean)** | Endymion's disputed consort in Apollodorus 1.7.6 — if promoted, id `iphianassa-elean` (not Agamemnon's daughter) |

## 5. Phased batch plan

| Batch | Scope | Figures (indicative) | Depends on |
|---|---|---|---|
| **0 — Schema backfill** | Add `kinds` to all 37 existing nymph nodes | ✅ 2026-06-15 (36 tagged; `calypso` deferred) | This dossier §3 table |
| **A — Core genealogies** | Named Oceanids/Nereids missing from Hesiodic/Apollodorean trees | ✅ 2026-06-15 — 6 figures: `doris-oceanid`, `electra-oceanid`, `eurynome`, `metis`, `amphitrite`, `galatea-nymph`; 1 contradiction (`amphitrite-parentage`) | M2.20 ocean line |
| **B — Naiad house wires** | Promote Batia, Cleocharia; Spartan stemma completion | ✅ 2026-06-15 — `batia-naiad`, `cleocharia-naiad`; 1 contradiction (`tyndareus-mother`) | Spartan batch |
| **C — Dryad / Oread pilot** | Arcadian and Boeotian tree nymphs beyond Erato | ✅ 2026-06-15 — `cyllene-oread`, `nonacris-oread`, `melia-thebes`; 1 contradiction (`lycaon-mother`) | Arcadia + Thebes |
| **D — Metamorphosis nymphs** | Daphne, Echo, Arethusa, Syrinx | ✅ 2026-06-15 — 4 figures; story cast links; reuses `daphne-transformation-agent` | Metamorphoses shelf |
| **E — Pleiad completion** | Alcyone, Celaeno, Electra, Sterope as `nymph` + `pleiad` | ✅ 2026-06-15 — 4 figures; 7/7 sisters; 1 contradiction (`oenomaus-sterope-relation`) | Atlas daughters |
| **F — Cyrene cluster** | Libyan/Peneus nymph wired to Apollo, Aristaeus, Idmon | ✅ 2026-06-15 — `cyrene-nymph`; 1 contradiction (`idmon-parentage`) | Argonautica shelf; `aristaeus`, `idmon`, `apollo` |
| **G — Spring naiads** | Cephissus and Corinth springs; Endymion consort dispute | **2–3 figures** — `liriope-nymph`, `peirene-naiad`; optional `iphianassa-elean` *or* unnamed-Naiad edge-only with topic `aetolus-mother` / `endymion-children` | `narcissus-echo` cast link; AEOLUS_DYNASTY interlock |
| **H — City eponyms kind pass** | Verify `kinds` on existing Asopus-daughter nodes — **no new nodes** | **~9 nodes** — `aegina-nymph`, `thebe`, `salamis-nymph`, `corcyra`, `metope`, `sinope-nymph`, `astypalaea`, `rhodos`, `sparte` | Asopus genealogy; `corcyra` reference sibling list |
| **I — Pleione & Hesperid individuals** | Parent node + individual evening nymphs | **1 + up to 4 figures** — `pleione-oceanid`; parent edges Atlas+Pleione → all seven Pleiads; individuals e.g. `aegle-hesperid`, `erytheia-hesperid`, `hesperia-hesperid`, `arethusa-hesperid` (confirm roll vs collective `hesperides`) | Batch E sisters; `hesperides-parentage` |
| **J — Trojan fountain rivals** | Bucolion's dual maternity | **1 figure** — `calybe-nymph`; wire `bucolion-trojan`; backfill `kinds` on `abarbarea-trojan` | `bucolion-mother` (new topic) |
| **K — Hygiene & deferred kinds** | Tag remaining TBD nodes; document Calypso policy | **0 new nodes** — `callisto` (`oread` + parentage note), `pasiphae` (`oceanid`), `eidothea-proteus`, `calypso` (kinds remain empty until Homer sub-class is sourced), `argiope-parnassus` verify | §3 inventory sync |
| **L — Later catalogue** | Lower-priority promotions after F–K | **2+ figures** — `chione-boreas` (or `chione-eumolpus`), `chrysopelia-naiad`; **Creusa nymph** only after corpus gate clears | Arcadia batch; Boreas line |

### Phase 2 contradiction topics (proposed)

| Topic id | Competing claims | Likely batch |
|---|---|---|
| `cyrene-parentage` | Daughter of Peneus (Hyginus *Fab.* 161) vs pastoral nymph on Peneus without named father (Apollonius *Arg.* 2.500) — harmonizable; homonym hazard is Thracian Cyrene (Ares) | — |
| `idmon-parentage` | ✅ Son of Apollo (± Cyrene) vs son of Abas | F |
| `aetolus-mother` / `endymion-children` | Naiad nymph vs Iphianassa vs Pausanias' mortal wives (Asterodia, Cromia, Hyperippe) | G |
| `peirene-parentage` | Daughter of Achelous (Pausanias 2.2.3) vs daughter of Oebalus (*Great Eoeae*) | G |
| `bucolion-mother` | Abarbarea fountain-nymph (Homer *Il.* 6) vs Calybe (Apollodorus) | J |
| `callisto-parentage` | Daughter of Lycaon (Apollodorus default) vs nymph of Hesiod / Nycteus / Ceteus variants | K |
| `hesperid-arethusa-homonym` | Hesperid Arethusa vs Sicilian spring `arethusa-nymph` | I |

Run `pnpm validate-data` and `pnpm validate-layout` after every batch.

## 6. Evidence policy

Same seven lenses as the rest of the atlas. Before any new nymph: `pnpm corpus:search <name>` + compare lenses + check `data/characters/` for homonyms.

Out of scope for first pass: exhaustive Hesiodic Oceanid catalogue (3000 names); scholia-only nymphs; Roman-only accretions without Greek attestation in our seven sources.

## 7. UI contract

- Hover card / story panel: `[ NYMPH ]` `[ Nereid ]` + italic domains.
- Search overlay: kind filter (future milestone).
- Star field: **no change** — all nymphs stay emerald unless a figure-specific override is approved (Muse precedent only).

---

*Last updated: 2026-06-15 (Batch F entered).*
