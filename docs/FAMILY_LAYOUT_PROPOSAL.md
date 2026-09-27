# Family-First Galaxy Layout Proposal

Status: Revision 6, 2026-09-17 — **Stages 0, 1 and 2 are complete**, and the one part
of Stage 3 worth doing — ordering the houses — is in (§6). The engine is in
`src/features/galaxy/layout.ts` (`LAYOUT_VERSION = '11-ordered-houses'`), the galaxy is
rebaked, and `validate-layout` gates family locality at the current levels (§7). The
tidy-tree rewrite that Stage 3 was named for stays unbuilt: its trigger is not met.

The user has chosen readable family relationships over a spiral galaxy silhouette.
Preserve cosmological height. The horizontal plane should communicate households,
siblings, and successive generations before a decorative overall shape. The audit
shows the two goals barely conflict: a constant-pitch spiral costs nothing measurable (§2).

**What changed in revision 6 (houses ordered)**

- Roots were laid out by size and children by alphabet, so which houses were
  neighbours was arbitrary. They are now ordered by their ties: median consort distance
  35.1 → **11.9**, a child's other parents 24.9 → **16.9**, with parent–child and sibling
  distances unchanged (7.2 / 18.5 and 4.2 / 20.4). See "Stage 3" in §6.
- Cohort members no longer consume wedge arc of their own (250 of 454 root wedges were
  never used), and a wedge is never narrower than one star at its radius — without
  that, some orderings knotted six narrow-wedge gods on ring 4 beyond any resolution.

**What changed in revision 5 (Stage 2 done)**

- **The mortal clock is solved, not counted.** A least-squares balance of
  contemporaneity evidence replaces longest-path counting and the old marriage
  levelling: 154 of 156 mortal couples now share a ring (103 before), no mortal
  parent step spans four rings (78 before), and Agamemnon → Orestes falls from 47.8
  to 11.5. The levelling had also dragged Zeus to the mortal base ring; the gods are
  back on their Hesiodic rings.
- **Realm bands are hard.** No star of any realm leaves its storey (249 had, 134 of
  them mortals at a god's height). The resolution pass frees a pinned pair along the
  ring, the radius, or in height within its band, and never disturbs generation order.
- **Cohort patches are compact satellites.** A units bug had pinned every patch at
  ±153°, smearing Priam's children over a third of the ring; patches are now sized by
  what their members need (median spread 114° → 12°), centred on their leader, and a
  city catalogue gathers on the head of its contemporary house.
- Overall: child → placement-parent distance 9.7 / 54.6 → **7.7 / 18.7** (median / P90),
  adjacent siblings 5.5 / 35.8 → 4.3 / 20.6, figure without genealogy → its leader
  118.7 → 16.5, galaxy radius 188 → 113.

**What changed in revision 4 (Stage 1 done)**

- The six engine repairs landed one at a time, each measured (§6, Stage 1). The result
  reproduces the S1 prototype to the decimal: median child → placement-parent distance
  58.9 → 9.7, P90 195.6 → 54.6, adjacent siblings 31.0 → 5.5.
- The solver now visits only near pairs through a planar grid, in the same order as
  the all-pairs sweep: output is bit-identical (cosmos and eight city skies checked
  against the old engine), and the solve drops from 39 s to about 1 s.
- `pnpm layout:metrics` reports the §7 measurements; `validate-layout` enforces the
  Stage 1 gates on them, plus a guard on the mortal base ring (finding 16).
- The §1 diagnosis describes the engine *before* Stage 1; the table at the end of §1
  says what each finding looks like now.

**What changed in revision 3 (Stage 0 done)**

- 64 reversed parent edges corrected, each checked against the local corpus
  (Appendix B). One correction surfaced a real dispute — Sarpedon's mother — now
  documented as `sarpedon-mother`; the Europa edge had wrongly cited Homer.
- A `bond` marker (`foster` | `nominal`) on parent edges, set on the five non-birth
  parents in the data. The 16 catalogue Nereids and the Sirens reconciled by `cluster`.
- `validate-data` gained three parent-edge gates; `pnpm audit:parents` is the heuristic
  companion. Layout rebaked; `validate-data`, `validate-layout` (cosmos and six
  flagship cities), `validate-ephemeris`, `tsc`, and `eslint` all pass.
- Two lessons that shape later stages: a consistently reversed family is invisible to
  structural checks (§6, Stage 0), and the mortal base ring hangs on the single
  deepest divine chain (finding 16).

**What changed in revision 2**

- Every diagnosis claim was checked against the code and the baseline numbers were
  reproduced exactly. The diagnosis stands.
- The causes were then *attributed* by experiment. One mechanism dominates: cohort
  placement. The generation rings and dynasty wedges — the parts revision 1 proposed
  to remove — work well wherever they are actually applied.
- The plan is therefore staged. Repair the existing engine first (prototype: scaffold
  parent distance 57.6 → 9.6 median, current validator still green), and escalate to
  structural change only for the residual classes the repairs cannot reach.
- Dropped: per-lens baked layouts, ELK. Moved out: camera, zoom, and relationship
  rendering. Reframed: "generation rings are removed" becomes a continuous mortal
  clock that keeps radius = mythic time and converges with PLAN.md M11.
- New findings that need their own work: at least 32 reversed parent edges (probably
  50–60), a chronology filter that silently drops 21 undisputed or buggy edges, a mortal
  base ring holding 537 stars for a capacity of 85, and hub cohorts that sit ~120–140
  units from their own leader.

## 1. Diagnosis (verified)

Dataset: 1,487 figures, 4,274 relations (parent 1,560 · ally 1,059 · adversary 563 ·
sibling 471 · slayer 283 · consort 249 · lover 82 · creator 7). The parent graph has
no cycles. Counts below are after Stage 0 unless marked otherwise. The layout uses
global generation rings, recursively divided dynasty wedges, and a `0.38` radian turn
per generation. Symbols below are in `src/features/galaxy/layout.ts`.

Revision 1 claims, all confirmed:

1. `buildKinship` chooses the placement parent by total relation degree. Alliances
   and enemies count toward that degree although they say nothing about which
   household locates a child.
2. A shared divine parent therefore takes precedence over the mortal branch and
   collects otherwise distinct houses.
3. In `computeDynastyWedges`, a parent sits at its wedge midpoint while its children
   subdivide the whole wedge, so an edge-positioned child is far from a mid-positioned
   parent. Worse for hub parents: the arc bought by `weightBonus` for cohort satellites
   is also split among the real children, spreading a few children across the
   satellites' arc (Odysseus → Telemachus).
4. `SPIRAL_TWIST` adds `0.38 · r` of sideways travel per ring: 38 units at radius 100.
   An edge spanning *n* rings is rotated `n · 0.38` rad. Orestes sits 8 rings outside
   Agamemnon, so he is turned 3.04 rad (174°) to the far side of the galaxy. The
   twist, not the ring gap, produces the headline distance (281 before Stage 0, 270 after).
5. The relaxation has consort, lover, sibling, and hostile forces but no parent–child
   attraction, and `clampToBounds` defeats other repairs of a long family edge.
6. Cohorts override genealogy. `detectCohorts` lets hub fans (`host:` ally,
   `foes:` adversary/slayer) and residence groups capture any leaf, including leaves
   with a known parent. Members take the *anchor's* wedge, not their own.
   `cohortAngularOffset` then displaces every cohort — sibling broods included — by a
   hash-derived ±0.86 rad. `residenceCohortAnchor` picks the earliest-generation
   resident outside the group, which is typically a local river god or nymph
   (Troy → `simois`, Thebes → `melia-thebes`, Sparta → `nemesis`).
7. Residence groups overlap because assigned members are not removed when a group is
   emitted; `buildCohortOf` lets the last sorted group win. 60 stars are listed in
   more than one cohort. Worked example: Telemachus has residences Ithaca, Pylos, and
   Sparta; he ends in `residence:sparta`, anchored on Nemesis, 260 units from Odysseus.
8. Collision resolution spends height: the vertical bias in the resolution pass,
   `REALM_OVERFLOW = 14`, and `cohortBandHalf` seeding. Of 1,236 terrestrial-realm
   stars, 355 sit outside the base band (|y| > 9) and 236 (19%) sit beyond |y| > 12,
   at heights that belong to the upper, ouranic, or chthonic realms.
9. `validate-layout` checks order and separation but has no locality criterion. The
   contract's "consort pairs orbit as close binaries" is consequently unmeasured and
   false in the bake: median consort distance is 67.9 (89.4 before Stage 0).

New findings:

10. **The mortal base ring is over-subscribed 6×.** Generation 6 holds 519 stars; its
    circumference fits 85 at the 3.6 floor. Generation 7 holds 185 for 95. Every
    mortal-time figure without a mortal parent starts there, including ~300 war-host
    and catalogue figures whose leaders sit on rings 9–14. Orphans have no clock. This
    is the main source of the wide population bands and of the height pressure.
11. **Hub cohorts are not satellites.** Median distance from a parentless leaf to its
    `ally` hub is 123.8.
12. **The chronology predicate dropped edges silently** *(resolved in Stage 0)*.
    `isChronologicalParentRelation` compares *cluster baselines* and rejected 32
    parent edges: 11 documented variants carrying a dispute `topic` (the intended use,
    e.g. Eros ⇐ Aphrodite); 2 reversed data bugs it thereby hid (`ares ⇐ penthesilea`,
    `eos ⇐ memnon`); and 19 undisputed edges — 16 Nereids with `cluster: titan-ring`
    detached from Nereus (`cluster: chthonic`), `sirens ⇐ achelous` likewise, and two
    Olympians born of later mothers (`hermes ⇐ maia`, `dionysus ⇐ semele`). Now 13 are
    rejected: the 11 variants and those two Olympians, listed by id in `validate-data`.
13. **Reversed parent edges** *(resolved in Stage 0)*. The contract is `from = child`,
    `to = parent`. 64 edges violated it — Priam was recorded as the child of 18 of his
    own children. See Appendix B. They corrupted the UI as well as the layout.
14. A quarter of the dataset has no genealogy: 523 figures have no parent edge, 374
    have neither parent nor child (mortal 200 · hero 128 · creature 30 · nymph 11 ·
    god 5), 38 have no relation at all. Revision 1 had no placement rule for them.
15. 913 of 1,487 stars (61%) are positioned by cohort rules rather than by their
    dynasty wedge. In practice the current layout is cohort-first.
16. **The mortal base ring hangs on one divine chain.** `mortalBase` is one more than
    the deepest divine generation. During Stage 0, giving Maia a `cluster` that made
    `hermes ⇐ maia` count as chronological ran Gaia → Uranus → Oceanus → Clymene →
    Atlas → Maia → Hermes → Pan to generation 7, moved the base ring from 6 to 8, and
    shifted every mortal star two rings outward, leaving rings 6–7 almost empty. The
    change was reverted. One nymph's metadata must not be able to move 1,200 stars.

Where each finding stands now:

| Finding | After Stage 1 | After Stage 2 |
| --- | --- | --- |
| 1–2 placement parent by degree; divine hub wins | Fixed: a mortal-time child is placed with its mortal-time house | — |
| 3 parent mid-wedge, children across the whole wedge | Eased: children centred, cohort arc flanks them | Arc starvation no longer shows in the gates; Stage 3 not triggered |
| 4 linear twist | Fixed: constant-pitch spiral | — |
| 5 no parent–child attraction | Fixed: spring on placement edges | — |
| 6 cohorts override genealogy | Fixed for anyone with a known parent | Patches compact and centred on the leader; city catalogues anchor on the head of their house |
| 7 overlapping residence groups | Fixed: one cohort per figure | — |
| 8 collisions spend height | 236 → 134 stars off their plane | Fixed: bands are hard, 0 stars of any realm out of band |
| 9 no locality criterion | Fixed: `validate-layout` gates | Gates ratcheted to Stage 2 levels (§7) |
| 10 base ring 6× over-subscribed | Open | The crowd left the base ring (519 → 46) for the rings it belongs to; the war generation is now the dense one (430 for a single-layer 134) |
| 11 hub cohorts are not satellites | Open: 118.7 | Fixed: 16.5 |
| 14 a quarter of the figures have no genealogy | Open | Dated by whom they met and where they lived; placed beside their leader |
| 15 cohort-first layout | 913 → 504 cohort-placed stars | Same 504, now compact |
| 16 mortal base hangs on one chain | Guarded by a gate | Fixed at the root: the base rests on the fifth-deepest divine figure |
| new: Zeus on the mortal base ring | (unnoticed) | Fixed: the marriage levelling that dragged the Olympians outward is gone |

Baseline of the bake *before Stage 1*, on the corrected data, planar world units
(galaxy radius 188). The last column is the median before Stage 0, when the galaxy radius
was 193:

| Measurement | n | Median | P75 | P90 | Max | Median before |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All parent edges | 1,560 | 62.2 | 146.1 | 208.2 | 335.9 | 64.0 |
| Scaffold (placement-parent) edges | 963 | 58.9 | 142.8 | 195.6 | 335.9 | 57.6 (n 938) |
| Adjacent siblings in the scaffold | 621 | 31.0 | 80.0 | 174.3 | 365.7 | 33.0 |
| Consort pairs | 249 | 67.9 | 155.7 | 226.3 | 300.8 | 89.4 |
| Parentless leaf → `ally` hub | 218 | 123.8 | 166.5 | 184.1 | 232.4 | 138.7 |

Agamemnon → Orestes 270.1 (281.20 before), Atreus → Agamemnon 69.9 (73.62 before).
Correcting the data barely moves the medians: 25 more children now have a placement
parent, and the cohort machinery throws them just as far as it throws everyone else.
The engine is the problem, not the data.

## 2. Attribution: what actually stretches family edges

Method: a scratch copy of `layout.ts` with each change behind an environment flag,
solved over the full 1,487-star dataset and measured with one harness that reproduces
the baked baseline exactly. Nothing was merged. Every row kept the separation floor
(0 violations). Rows 0–6 were measured before Stage 0, rows 4–6 with the first 32
reversed edges flipped in memory; rows 0′ and 6′ repeat the two ends on the corrected data.

| Cumulative step | Scaffold median | Scaffold P90 | All-parent median | Sibling median | Consort median |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0. Current engine | 57.6 | 204.4 | 64.0 | 33.0 | 89.4 |
| 1. Twist = 0 | 46.0 | 199.0 | 56.2 | 22.6 | 66.0 |
| 2. + Temporal child prefers a temporal placement parent | 35.6 | 190.5 | 49.4 | 16.4 | 69.4 |
| 3. + Hub/residence cohorts capture parentless leaves only; no hash offset on sibling broods | 12.5 | 58.5 | 24.4 | 6.2 | 43.8 |
| 4. + Parent–child spring (k 0.08, target 6) and 32 suspect edges flipped | 8.7 | 50.4 | 15.3 | 5.3 | 48.0 |
| 5. Step 4 with a log spiral (k 0.35) instead of zero twist | 8.9 | 50.9 | 15.8 | 5.2 | 46.6 |
| 6. Step 5 with degree tie-break among temporal parents and children centred in the parent wedge — **"S1 prototype"** | 9.6 | 54.6 | 16.9 | 5.6 | 41.0 |
| 0′. Current engine, corrected data | 58.9 | 195.6 | 62.2 | 31.0 | 67.9 |
| 6′. S1 prototype, corrected data | 9.7 | 54.6 | 16.6 | 5.5 | 46.9 |

Scaffold-edge length by how the child was placed (twist = 0, engine otherwise
unmodified, corrected data):

| Child placement | n | Median | P90 |
| --- | ---: | ---: | ---: |
| Own dynasty wedge (no cohort) | 356 | 11.2 | 44.1 |
| — of which the edge spans one ring | 274 | 8.6 | 30.2 |
| — spans 2–3 rings | 49 | 26.7 | 44.1 |
| — spans 4+ rings | 33 | 65.6 | 89.1 |
| Sibling brood of its own parent | 279 | 54.8 | 171.8 |
| `host:` / `foes:` cohort | 113 | 138.7 | 193.9 |
| Residence / island cohort | 215 | 141.8 | 247.1 |

Fixtures on the corrected data, current engine → S1 prototype: Atreus → Agamemnon
69.9 → 8.4 · Priam → Hector 19.3 → 5.7 · Peleus → Achilles 40.7 → 6.3 · Tyndareus →
Clytemnestra 52.2 → 6.2 · Odysseus → Telemachus 260.0 → 25.6 · Agamemnon → Orestes
270.1 → 47.8.

The S1 prototype passes the *current* `validate-layout` for the cosmos and for the
six flagship city skies (Thebes, Mycenae, Argos, Athens, Sparta, Troy). Cohort-placed
stars fall from 913 in 36 cohorts to 504 in 17, with no double membership.

Conclusions:

- **Cohort capture is the dominant cause.** Where rings and wedges are actually
  applied, a one-ring parent edge is already 8.4 units (2.3× the star floor). A child
  with a known parent that is pulled into a cohort sits 5–13× farther away.
- **The twist explains the famous cases, not the tail.** Removing it collapsed
  Atreus → Agamemnon from 73.6 to 8.6 but moved the P90 only from 204 to 199.
- **The spiral does not have to go.** The defect is the *linear per-generation* turn,
  whose sideways cost grows with radius. A constant-pitch logarithmic spiral
  `θ += k · ln(r / r₀)` costs about `k · Δr` ≈ 2 units per parent step at every radius.
  With k = 0.35 (pitch ≈ 19°, ≈ 69° total sweep) it is indistinguishable from zero
  twist in every metric (step 4 vs 5).
- **The placement-parent rule is nearly metric-neutral but not fixture-neutral.**
  "Nearest generation" attaches Orestes to Clytemnestra (133.6 from Agamemnon);
  "degree among temporal parents" keeps him in his father's house (47.6) at a cost of
  under one unit of median.
- Parent–child attraction is a modest, consistent gain: 35.6 → 25.1 before the cohort
  fix, 12.5 → 8.7 after it (the latter also includes the 32 flipped edges).

What the repairs do **not** fix — the residual classes for Stage 2:

- **Documentation-depth mismatch.** Agamemnon sits on ring 11 and Clytemnestra on
  ring 18, so Orestes (ring 19) lands one ring outside his mother and eight outside
  his father — 45 radial units in the S1 prototype. Class size: of 904 mortal →
  mortal parent edges, 143 span more than one ring and 78 span four or more; of 249
  consort pairs, 73 are four or more rings apart (166 share a ring).
- **Cross-house marriages.** Consort median improves 68 → 47 and stays there. Most of
  what remains is angular and inherent (§4).
- **Ring over-subscription** (finding 10) and the **height leak**: 236 → 134
  terrestrial stars beyond |y| > 12 under S1, not zero.
- **Orphan → hub scatter**: 123.8 → 118.7, essentially unchanged.
- **Sunburst arc starvation.** 95% of non-cohort leaf children own less arc (median
  1.6 units) than the 3.6 separation floor, because arc is allotted by descendant
  count. The engine pays the difference with radial bands and height.

Two further probes on top of step 5, both negative or partial, recorded so they are
not repeated:

- *Height.* Removing the vertical bias alone changes nothing (132 leaked stars) and
  causes 5 floor violations. Adding `REALM_OVERFLOW = 3` brings terrestrial stars
  beyond |y| > 12 to **0**, with the same 5 violations — all among divine sibling
  groups in the thin `upper` band (`bia`/`cratos`/`nike`, `eos`/`helios`,
  `salamis-nymph`/`sinope-nymph`). The mortal plane does not need the overflow; the
  over-subscribed divine rings (generation 2: 39 for 36, generation 3: 72 for 49) do,
  or need tangential resolution.
- *Era by association.* Re-dating 300 parentless leaves to the median clock of their
  anchored ally/adversary/slayer neighbours relieves ring 6 (537 → 252) but moves the
  crowd to ring 11 (111 → 251 for a capacity of 134) and does not shorten orphan → hub
  distance (118.8 → 128.0): hub cohorts remain angularly scattered by the hash offset
  and by patches up to 0.85π wide. Re-dating is necessary for the clock to mean
  anything for orphans, but it is not sufficient to make satellites.

## 3. Coordinate contract (revised)

The application uses `x/z` for the horizontal plane and `y` for height.

1. **Height remains cosmological, and becomes enforced.** Preserve realm semantics
   and type-driven appearance. Height is not the relief valve for horizontal crowding.
   Target: no terrestrial star at another realm's height.
2. **Horizontal proximity represents local kinship.** A child sits near its placement
   parent, siblings are adjacent, descendants advance outward along a legible branch.
3. **Radius stays mythic time, on a continuous mortal clock.** Revision 1 reduced
   radius to bare ancestry order; that discards the axis PLAN.md M11 exists to perfect.
   Instead the clock becomes real-valued (Stage 2). Hard: for every applicable
   chronological parent edge, `r(child) ≥ r(parent) + parentGap` (2.5 today). Soft:
   a parent step stays near one nominal step; temporal spouses share a radius. M11's
   sourced synchronisms later enter the same solve as additional constraints. Radius
   remains a reading of mythic generations, never a historical date.
4. **Generation rings become soft, not removed.** Integer rings survive Stage 1
   unchanged. In Stage 2 two unrelated figures of equal graph depth need not share an
   exact radius, and long king-lists may compress while short chains stretch.
5. **Dynasty wedges stay for Stage 1.** They are not the main defect. Envelope-based
   allocation replaces descendant-count allocation only if Stage 2 metrics still
   demand it (Stage 3).
6. **The twist becomes a constant-pitch spiral.** No per-generation angular turn.
   Lineages still read as arms.
7. **Spacing and determinism remain hard requirements.** Every figure has one global
   star, finite coordinates, stable ordering, and an enforced collision floor. Source
   alternatives remain data; layout choices are presentation.
8. **One canonical layout.** Lenses rewire the visible relation lines and never move
   stars — the existing deliberate rule ("the layout stays fixed while lenses rewire
   the visible relation lines"). See §5.

This changes the layout contract in CLAUDE.md and AGENTS.md (hard rule 6) and PLAN.md
§6, beyond a parameter adjustment: Stage 1 rewords the twist and cohort clauses,
Stage 2 rewords the radius clause.

## 4. Placement scaffold, parental units, and figures without genealogy

The scaffold is the acyclic set of one placement parent per figure. It decides where a
star goes. It never removes another relationship from the data or the UI, and it is
not a claim that one parent matters more in the mythology.

**Placement parent.** A mortal-time child (`hero`, `mortal`, `creature`) prefers a
mortal-time parent, so a timeless shared parent stops collecting unrelated mortal
houses. Among several temporal parents, break ties by relation degree restricted to
those parents, then by id. The schema has no gender field, so a patrilineal rule is
not expressible; degree among temporal parents is the measured proxy (§2). Divine
children keep the existing rule.

**Parental units.** A parental unit is a layout anchor, not an invented character or
marriage; one attested parent is sufficient. Relations are independent edges, so the
data has no notion of a parental *pair*. The evidence that two co-parents form one
unit is an existing `consort` or `lover` edge between them with overlapping sources
(Zeus–Leda, Tyndareus–Leda); without it, keep separate candidate units and flag the
gap for review. Multiple partnerships imply several units, not one family or
contemporaneity. Do not merge the consort graph into one household.

Non-birth parents carry `bond` (`foster` | `nominal`, settled in Stage 0): Oedipus has
four parents under Apollodorus — Laius and Jocasta by birth, Polybus and Periboea by
fostering. Units are built from birth parents only; a `bond` parent is a bridge edge
and never a second biological household.

**Shared parents.** Widely shared parents remain one global star with explicit
bridges to several households. A family focus may later show a clearly identified
reference position, never a silent second canonical star. Start without reference
copies.

**Figures without genealogy** (374, a quarter of the dataset). Cohorts are the right
idea for them and the wrong idea for anyone with a known parent:

- Hub and residence cohorts capture only leaves with no placement parent.
- A figure belongs to at most one cohort, chosen by a documented deterministic
  priority (own host, then opposed figure, then one city).
- Sibling broods stay centred on their parent: no hash offset.
- An orphan is a satellite of its best-attested association: the clock dates it by
  whom it met and where it lived, and its patch is centred on its leader, sized by
  what its members need. A city catalogue gathers on the contemporary resident with
  the largest family — the head of the house it lived under (Priam for Troy). The
  lineage files are not read by the layout: the engine stays a pure function of
  characters and relations, and the family-size rule finds the same house. Done in
  Stage 2; orphan → leader distance is its gate.
- A figure with no relation at all (38) keeps a deterministic position in its
  realm's fallback region, outside every family envelope.

**What no layout can do.** With a positive spacing floor, arbitrarily many children
cannot fit inside a fixed neighbourhood around one parent. A child cannot be close to
two parents separated by more than twice the allowed distance. Cross-lineage
marriages, shared divine parents, and long ancestry chains therefore require some
longer bridge edges. Do not promise that all consorts or all parent–child pairs
become close. Metrics report scaffold edges and bridge edges separately for this reason.

## 5. Source lenses and alternative parentage

Retain relation IDs, sources, and dispute topics. Do not assign source confidence
scores, privilege the most numerous authors, or treat an absent edge as a denial.

Source overlap does not prove that two claims belong to one version: an author can
report alternatives. A shared dispute topic does not identify parental roles or a
complete compatible pair. Combine claims only when existing evidence supports the
combination (§4); otherwise preserve separate candidate units and flag the ambiguity.

The scaffold is built once, from the union of attested edges, and is a deterministic
presentation choice. Do not manufacture one biological household containing every
disputed parent, or a synthetic chronology assembled from incompatible versions. The
default attachment is never displayed as a scholarly resolution; under a lens that
does not attest the placement edge, the star stays put and only the lines change.

The hard radial order applies to compatible chronological constraints. If their union
contains a cycle, no radial solution exists: report the cycle by name. **No edge is
dropped silently.** An edge rejected by the chronology predicate must be explicitly
marked (a dispute `topic`, or a dedicated marker for a god born of a later mother);
an unmarked rejection is a validation error. Do not increment generations until a
loop limit.

Per-lens baked layouts are **not** part of this proposal. They would multiply bake,
validation, and city-sky cost by eight, move stars on every lens switch, and destroy
the spatial memory the fixed sky provides — none of which the readability goal needs.
If revisited, measure lens-switch displacement first and pin every unaffected star.

## 6. Staged plan

Each step lands as its own commit with a before/after metric row, so every delta
stays attributable. A stage ends at its gate (§7), not at a date.

### Stage 0 — Data audit and gates (done 2026-09-17, no layout code change)

1. **64 reversed parent edges corrected** in `data/relations.json`, each read in the
   local corpus first (Appendix B). Ids follow the direction (`polites-trojan-parent-priam`);
   four ids were already right and only `from`/`to` were swapped. No id is referenced
   outside `relations.json`.
2. **A dispute surfaced, not invented.** Turning `laodameia-lycian ⇐ sarpedon` round
   gave Sarpedon two Homeric mothers. Homer names only Laodameia (Iliad 6.198–199);
   Apollodorus and Hyginus name Europa, and Bibliotheca 3.1.1 reports Homer's version
   itself. `homer` was removed from `sarpedon-parent-europa`, both edges carry
   `sarpedon-mother`, and the dispute is documented in CONTRADICTIONS.md.
3. **`bond` on parent edges** — `foster` (Polybus and Periboea for Oedipus, Teuthras
   for Telephus) and `nominal` (Aloeus for Otus and Ephialtes). This settles the open
   question in §4: non-birth parentage is an undisputed fact, so it is a marker, never
   a dispute `topic`. Type, zod schema, and PLAN.md §4 updated; nothing reads it yet.
4. **`cluster` reconciled.** The 16 catalogue Nereids move `titan-ring` → `chthonic`,
   beside Nereus and their sisters Amphitrite and Galatea; their generation is
   unchanged and their realm becomes the deep. The Sirens move `chthonic` →
   `mortal-arm`; their realm stays chthonic through the "death" domain keyword.
   `hermes ⇐ maia` and `dionysus ⇐ semele` are deliberate drops (finding 16) and are
   listed by id in `validate-data` — by id, because a rule such as "divine child of a
   mortal parent" would also wave through `ares ⇐ penthesilea`.
5. **Three gates in `scripts/validate-data.ts`**: at most two birth parents without a
   `topic` per child per source; no loop in the parent graph; no undisputed parent edge
   silently dropped by the layout. `bond` is rejected on non-parent edges.
6. **`pnpm audit:parents`** (`scripts/audit-parent-direction.ts`), warning-level: reads
   the edge note, both figures' prose, and the kinship around the edge. On the
   uncorrected data it finds 52 of the 64; on the corrected data it is silent, with six
   corpus-checked false positives acknowledged by id.
7. Rebaked; §1, §2, and §7 re-measured.

Lesson for every later data batch: **a consistently reversed family is
self-consistent.** It forms no loop and trips no count. `cinyras ⇐ adonis` stayed
hidden until its neighbours were corrected and a loop appeared, and
`rhene ⇐ ajax-oileus` was found only by reading every parent edge in the eight file
regions where reversals cluster. The batches that went in backwards used ids of the
form `<parent>-parent-<child>`; treat that id shape as a smell in review.

Left open by Stage 0:

- `bias-trojan` is one node for two figures — a son of Priam (Bibliotheca 3.12.5) and
  the father of Laogonus and Dardanus (Iliad 20.460). Hard rule 7 wants them split.
- Sarpedon's prose does not yet mention Laodameia; only the relation carries the ⚖.
- `ajax-oileus` has a mother edge and no father: Oileus is not yet a node.
- Notes and corpus disagree on Ovid line numbers: notes cite one numbering
  (`Metamorphoses 1.452–748`), the pinned English edition another (`1.577-687`).

### Stage 1 — Repair the existing engine (done 2026-09-17)

Contract-preserving except the twist shape; all in `layout.ts` unless noted. Each
repair was applied alone and measured with `pnpm layout:metrics` before the next.
Columns are median / P90 in planar world units; "off-plane" counts terrestrial stars
at another realm's height. Every row kept the separation floor (0 violations).

| Step | Scaffold edges | All parent edges | Adjacent siblings | Consort pairs | Off-plane |
| --- | ---: | ---: | ---: | ---: | ---: |
| After Stage 0 | 58.9 / 195.6 | 62.2 / 208.2 | 31.0 / 174.3 | 67.9 / 226.3 | 236 |
| 2. Near-pair grid | bit-identical | bit-identical | bit-identical | bit-identical | 236 |
| 3. Constant-pitch spiral | 45.9 / 188.6 | 55.2 / 199.1 | 22.8 / 155.5 | 54.8 / 206.6 | 240 |
| 4. Placement-parent rule | 38.2 / 184.1 | 51.0 / 201.0 | 17.3 / 155.6 | 71.0 / 213.8 | 237 |
| 5. Cohorts for parentless leaves only | 14.7 / 65.2 | 24.8 / 134.0 | 7.0 / 34.7 | 42.0 / 172.9 | 143 |
| 6. Children centred in the parent wedge | 14.3 / 64.8 | 24.3 / 132.2 | 7.0 / 34.8 | 40.7 / 179.1 | 147 |
| 7. Parent–child spring | **9.7 / 54.6** | **16.6 / 122.5** | **5.5 / 35.8** | 46.9 / 179.0 | **134** |

Fixtures after step 7: Atreus → Agamemnon 8.4 · Priam → Hector 5.7 · Peleus →
Achilles 6.3 · Tyndareus → Clytemnestra 6.2 · Odysseus → Telemachus 25.6 · Agamemnon →
Orestes 47.8. Bridge edges (584 chronological parent edges that are not the placement
edge) 71.4 / 221.0 → 47.3 / 172.9. Cohorts 36 → 17, cohort-placed stars 913 → 504,
double membership 60 → 0. Galaxy radius unchanged at 188. The final row equals the S1
prototype row 6′ in §2 to the decimal.

1. **Metrics harness** — `scripts/lib/layout-metrics.ts` (`measureLayout`) is shared by
   `pnpm layout:metrics` (report; `--baked`, `--json`) and the validator gates, so the
   two cannot disagree about what a number means.
2. **Near-pair grid.** Repulsion and the resolution pass only act inside a reach, so a
   planar grid (`createPlanarGrid`) supplies the near pairs and they are visited in the
   same ascending (i, j) order as the all-pairs sweep; in the resolution pass a shoved
   star's partners are re-read from where it now is. Output is bit-identical to the
   all-pairs engine — checked against the committed bake and eight city skies — and
   the solve drops from 39 s to about 1 s. The stale-bake fallback in the browser
   benefits as much as the bake.
3. **Constant-pitch spiral.** `spiralTwistOf(generation) = SPIRAL_PITCH · ln(ringRadius / BASE_RADIUS)`,
   `SPIRAL_PITCH = 0.35`; `SPIRAL_TWIST` is gone.
4. **Placement-parent rule** in `buildKinship`: a mortal-time child prefers a
   mortal-time parent, then relation degree, generation, id.
5. **Cohorts** in `detectCohorts`: hub and residence cohorts capture only leaves with
   no placement parent; residence groups are emitted largest-first and take only
   unassigned members; `cohortAngularOffset` is zero for `siblings:` cohorts.
6. **Children centred** in `computeDynastyWedges`: children share the arc their own
   subtrees earned; the arc bought by `weightBonus` flanks them.
7. **Parent–child spring** over placement edges in the relaxation (k 0.08, rest
   length 6).
8. **Validator.** `validate-layout` gates locality on the whole cosmos (§7) and guards
   the mortal base ring. Negative-tested: the old engine's positions trip every gate,
   and the Maia change from finding 16 trips the base-ring guard (ring 8, two figures
   inside it).
9. Hard rule 6 (CLAUDE.md, AGENTS.md), PLAN.md §6 and its decision log reworded;
   `LAYOUT_VERSION` bumped; rebaked.

Not verified by this stage: nothing was looked at in a browser. Camera framing,
labels, and relation lines should be checked by eye against the new positions —
especially the Trojan and Ithacan neighbourhoods, which moved the most.

### Stage 2 — Residual classes (done 2026-09-17)

Each change was applied alone and measured with `pnpm layout:metrics`. Distances are
median / P90 in planar world units; "off band" counts stars of any realm outside
their own realm band. Every row kept the separation floor.

| Step | Scaffold edges | Adjacent siblings | Orphan → leader | Couples on one ring | Steps 4+ rings | Off band | Radius |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| After Stage 1 | 9.7 / 54.6 | 5.5 / 35.8 | 118.7 | 103 / 156 | 78 | 249 | 188 |
| 1. Compact cohort patches; mortal plane may swell by 3 | 8.4 / 30.8 | 4.8 / 21.9 | 96.1 | 103 | 78 | 162 | 188 |
| 2. Hard realm bands; escapes for pinned pairs | 8.6 / 30.9 | 4.6 / 22.6 | 96.4 | 103 | 78 | **0** | 188 |
| 3. Mortal clock solved, whole-ring steps | 9.1 / 26.2 | 4.7 / 31.1 | 96.2 | 131 | 13 | 0 | 172 |
| 4. A ring holds two layers before it billows | 7.4 / 21.0 | 4.4 / 23.9 | 83.7 | 131 | 13 | 0 | 150 |
| 5. Every cohort patch centred on its leader | 7.3 / 21.5 | 4.4 / 23.9 | **15.3** | 131 | 13 | 0 | 150 |
| 6. City catalogue anchored on the head of its house | 7.2 / 20.7 | 4.4 / 24.0 | 15.6 | 131 | 13 | 0 | 150 |
| 7. Half-ring minimum step; resolution holds chronology | **7.7 / 18.7** | **4.3 / 20.6** | 16.5 | **154** | **0** | 0 | **113** |

Fixtures after step 7: Atreus → Agamemnon 8.3 · Priam → Hector 3.3 · Peleus → Achilles
9.7 · Tyndareus → Clytemnestra 6.2 · Odysseus → Telemachus 17.8 · Agamemnon → Orestes
11.5. Bridge edges 47.3 / 172.9 → 24.9 / 115.4. Consort pairs 46.9 → 35.1 median.
Cosmos, the six flagship cities, and all 192 city skies (2,308 stars) validate with
no floor violation and no star out of band.

1. **Cohort patch width** (`cohortPatchHalf`). The old formula's golden-angle "spread"
   was a length read as radians; it exceeded the 0.85π cap for every cohort of eight or
   more, so *every* patch was ±153° wide. A patch is now the arc its members need to
   pack at the separation floor into its radial depth and realm height, never less
   than the anchor's own wedge. `cohortAngularOffset` (a hash-derived ±49° shift) and
   the vertical cohort band stretch are gone.
2. **Hard realm bands.** `REALM_OVERFLOW` is removed. A sweep showed the floor holds
   with no overflow at all once patches are compact; what failed was a deadlock — two
   stars of adjoining realms pinned against their shared band edge, pushed the wrong
   way round by the fixed vertical bias. A pinned pair now tries the ring, the radius,
   and both vertical directions, and takes whichever opens the gap.
3. **The mortal clock** (`solveMortalClock`, replacing "era through marriage" and the
   marriage levelling in `computeGenerations`). Unknowns are the mortal-time figures,
   plus nymphs of no divine parentage who married or mothered mortals. Terms: a parent
   step wants one ring; spouses, lovers and siblings want one era (weight 2); allies,
   adversaries, slayer and slain roughly so (0.15); co-residents share a city era
   (0.02); a house with no evidence leaves eternity at the base (0.001); a step shorter
   than the minimum and a figure inside its floor are stiff one-sided terms. Timeless
   parents and spouses only bound mortals from below — gods date nobody.
   *Solver.* Gauss–Seidel was tried first and rejected twice: re-weighting the
   one-sided terms from the previous sweep chatters forever (0.165 rings per sweep),
   and with exact coordinate minima it converges but crawls, whole houses moving as
   rigid blocks, so the answer depended on the sweep cap. The shipped solver is a
   semismooth Newton method: freeze the active one-sided terms, solve that quadratic
   with Jacobi-preconditioned conjugate gradients, backtrack on the true cost, repeat.
   It reaches the exact optimum in about ten rounds and half a second.
   *Robustness.* Halving or doubling the `together` and `met` weights changes no
   metric by more than a few tenths and never produces a violation.
4. **Mortal base** rests on the fifth-deepest divine figure (`BASE_SUPPORT`). The Maia
   change from finding 16 now leaves the base on ring 6 and the layout unmoved.
5. **Ring capacity counts two layers** (`RING_LAYERS`). A ring is a band 18 units tall,
   not a line; treating it as a line made the synchronised war generation billow, and
   every parent → child step across a billowed ring paid the band's width.
6. **Sub-ring steps** (`MIN_STEP_RINGS = 0.5`). With whole-ring steps the deep Argive
   line pins Perseus at ring 15 and his great-granddaughter Helen at 18, two rings
   outside her husband. Letting an over-charted line compress to half-ring steps closes
   it (25 couples apart → 2). Half an outer ring is 2.8 units, just clear of the 2.5
   parent–child radial gap, so the resolution pass now *holds* chronology — each
   candidate position is clamped outside every parent and inside every child — instead
   of leaving it to a later nudge that could re-open a separation gap.
7. **Orphans.** Dated by the clock (whom they met, where they lived); hub and city
   patches centred on the leader; `residenceCohortAnchor` picks the contemporary
   resident with the largest family — Priam for Troy, not Simois.
8. Validator gates ratcheted (§7); hard rule 6, PLAN.md §6, M11 note and decision log
   reworded; `LAYOUT_VERSION = '10-mortal-clock'`; rebaked. `buildKinship` is memoised
   per dataset, so the clock is solved once per layout (bake ≈ 1.7 s).

What Stage 2 did **not** achieve, and what it changed that needs eyes:

- **Heracles still falls after Troy** (ring 12.5 against 11.9 for the war generation).
  The Argive line is already compressed to its half-ring floor from Phoroneus to
  Heracles; only sourced synchronisms (M11) or a lower floor can move him.
- Odysseus → Telemachus is 17.8, short of the provisional ≤ 15: Telemachus shares his
  father's wedge with a 122-star patch of suitors and monsters.
- Consort median 35.1: cross-house marriages are angular and inherent (§4).
- The war generation is dense: ring 11 holds 430 stars for a single-layer
  circumference of 134 (3.2×; 1.6× of the two layers the engine now counts). The ≤ 2×
  target is met only in the two-layer sense.
- **The galaxy looks different.** Radius 188 → 113. Gods sit on rings 3–5 again, inside
  their nebula bands. Mortal time runs from ring 6 to ring 17, with most mortals
  between rings 9 and 13 and a thin stretch at rings 7–8 where only the founders of the
  deepest houses live. Camera framing, labels and relation lines were not looked at.

### Stage 3 — Ordering the houses (done 2026-09-17); the tidy-tree rewrite (not triggered)

Stage 3 was named for replacing descendant-count wedges with contour-based packing.
Its trigger — scaffold P90 or sibling spread still missing the gate after Stage 2,
traceable to arc starvation — is not met (P90 18.5 against 40), so that rewrite stays
unbuilt. One idea inside it did not depend on the rewrite and addressed what Stage 2
left weakest: *order siblings and houses so that married houses end up adjacent.*

Before: dynasty roots went round the disc largest first, and every parent's children
were laid out alphabetically — Zeus' 34 children ran `achaea, aeacus, aglaea, aphrodite,
apollo, arcas, …`. How much arc a house gets was principled; who its neighbours were
was an accident of spelling.

| Step | Consort pairs | Bridge parent edges | Scaffold edges | Adjacent siblings | Orphan → leader |
| --- | ---: | ---: | ---: | ---: | ---: |
| After Stage 2 | 35.1 / 128.6 | 24.9 / 115.4 | 7.7 / 18.7 | 4.3 / 20.6 | 16.5 |
| 1. Cohort members take no arc of their own | 32.4 / 135.6 | 27.0 / 121.3 | 7.5 / 20.4 | 4.2 / 21.2 | 16.5 |
| 2. Houses and siblings ordered by their ties | 11.4 / 91.3 | 16.7 / 80.7 | 7.2 / 18.5 | 4.0 / 20.0 | 15.4 |
| 3. A wedge is at least one star wide | **11.9 / 90.8** | **16.9 / 80.4** | 7.2 / 18.5 | 4.2 / 20.4 | 15.4 |

1. **No arc for patch members** (`wedgeForestOf`). 250 of 454 root wedges belonged to
   cohort members who sit in their anchor's wedge and never used their own; brood
   leaves likewise held slivers inside their parent's wedge. The anchor's `weightBonus`
   already pays for them. Neutral on its own, and the precondition for a clean order.
2. **`orderFamilies`**, run once inside `buildKinship`. Ties: consort and lover (weight
   2), and a child's chronological parents other than its placement parent (1), each
   scaled by ring radius so an outer-ring tie counts for the arc it really spans. Each
   sweep lays the wedges out, moves every subtree toward the weighted circular centre
   of what it is tied to *outside itself*, then tries swapping neighbours; a change is
   kept only if it shortens the total tie length. Twelve sweeps take ~0.7 s and get
   nearly everything (40 sweeps: 11.4 / 89.5). The orders are written into
   `kinship.childrenOf` and `kinship.rootOrder`, so the sibling spring and the
   "adjacent sibling" metric follow the angular order actually drawn.
3. **Minimum wedge = one star of arc** (`effectiveWedges`). The old floor was a fixed
   0.015 rad — ±0.5 units at radius 35, a seventh of the separation floor. Under one
   ordering (tie weights 1 : 1) six narrow-wedge gods of the thin `upper` band landed
   side by side on ring 4 and no resolver could part them: the configuration was
   infeasible, not unsolved. With the floor at `MIN_STAR_DISTANCE / 2r` every tested
   weighting resolves with no violation.

Results are insensitive to the tie weights (partners : bridge of 1 : 1, 2 : 1 and 4 : 1
give consort medians of 12.1, 11.9 and 11.5). Cosmos, the six flagship cities and all
192 city skies validate; the bake equals a fresh solve bit for bit; bake ≈ 2.4 s.

Not improved, and why: Agamemnon → Orestes 11.5 → 13.7 and Odysseus → Telemachus 17.8 →
19.0 (both inside their gates) — ordering trades a little inside a house for a lot
between houses. Consort P90 is still 90.8: a figure with spouses in three houses can
sit beside one of them.

The unbuilt remainder, for the record: a radial Reingold–Tilford / Buchheim–Walker tidy
tree (parent centred over children, subtrees packed by measured envelope), roughly 150
lines, deterministic, dependency-free. If radial packing destroyed useful family
ordering, a direct layered forest was the fallback; it gives up radius as a universal
coordinate and would need an explicit contract decision.

ELK Layered is dropped as a candidate. It re-imposes discrete layers, minimises
crossings on a line rather than a circle, would still need the custom radial and
envelope stages, and `GalaxyView` solves city skies at runtime — so `elkjs` would
either ship to the client or force every city sky to be baked.

### Out of scope

- **Camera, zoom levels, relationship rendering.** Revision 1 §6 (scale-dependent
  labels, household framing on select, bridge-edge reveal at close range, reduced
  background competition) moves to its own proposal once positions settle. Judging
  the layout and the camera in one change makes neither falsifiable.
- **Per-lens layouts** (§5).

## 7. Validation and acceptance

Every figure below is measured on the shipped engine with `pnpm layout:metrics`.
Two provisional Stage 2 targets were missed and are marked ✗. Compare stages with the
same harness.

Kept from revision 1:

- All figures appear exactly once; coordinates are finite and deterministic under
  repeated runs and reordered equivalent input.
- Every applicable chronological parent edge passes the radial gap constraint; cycles
  and rejected edges produce named diagnostics.
- Separation floors and realm bounds pass after the final solver operation.
- Locality must not be obtained by silently reclassifying difficult edges. Publish
  edge counts per class with every report.
- Review the Pelopid, Perseid, Aeacid, and Trojan fixtures, plus disputed-parent,
  cross-marriage, large-brood, isolated-figure, and shared-hub synthetic fixtures.
- Measure fresh-data displacement, bake cost, and interaction frame time on
  representative desktop and mobile devices.
- Inspect desktop and mobile screenshots at overview, family, and selected-person
  distances. Coordinate-only tests are insufficient.

Metrics and gates (planar world units; separation floor 3.6):

| Metric | Before Stage 1 | After Stage 1 | After Stage 2 | Provisional target | Gate now enforced |
| --- | ---: | ---: | ---: | ---: | ---: |
| Scaffold edge median / P90 | 58.9 / 195.6 | 9.7 / 54.6 | **7.7 / 18.7** → 7.2 / 18.5 ordered | P90 ≤ 40 ✓ | ≤ 10 / ≤ 25 |
| Adjacent sibling median / P90 | 31.0 / 174.3 | 5.5 / 35.8 | **4.3 / 20.6** → 4.2 / 20.4 ordered | hold ✓ | ≤ 6 / ≤ 28 |
| Bridge (non-scaffold parent) edges median / P90 | 71.4 / 221.0 | 47.3 / 172.9 | 24.9 / 115.4 → **16.9 / 80.4** ordered | report | median ≤ 25 |
| Consort median | 67.9 | 46.9 | 35.1 → **11.9** ordered | report | ≤ 20 |
| Mortal couples on one generation ring | 103 / 156 | 103 / 156 | **154 / 156** | radial gap ≤ 1 step ✓ | ≥ 90% |
| Mortal → mortal edges spanning 4+ rings | 78 | 78 | **0** | ≤ 20 ✓ | ≤ 5 |
| Atreus → Agamemnon, Priam → Hector, Peleus → Achilles, Tyndareus → Clytemnestra | 69.9 / 19.3 / 40.7 / 52.2 | 8.4 / 5.7 / 6.3 / 6.2 | 8.3 / 3.3 / 9.7 / 6.2 | hold ✓ | each ≤ 12 |
| Odysseus → Telemachus | 260.0 | 25.6 | 17.8 | ≤ 15 ✗ | ≤ 24 |
| Agamemnon → Orestes | 270.1 | 47.8 | **11.5** | ≤ 20 ✓ | ≤ 16 |
| Parentless leaf → leader, median | 123.8 | 118.7 | **16.5** | ≤ 30 ✓ | ≤ 30 |
| Cohort patch spread, median (degrees) | 114 | 114 | **12** | — | ≤ 25 |
| Stars outside their own realm band (all realms) | — | 249 | **0** | 0 ✓ | 0 (check 3) |
| Terrestrial stars beyond \|y\| > 12 | 236 (19%) | 134 (11%) | **0** | 0 ✓ | 0 (check 3) |
| Most crowded ring (population / single-layer capacity) | 519 / 85 | 519 / 85 | 430 / 134 | ≤ 2× ✗ (3.2×; 1.6× of two layers) | — |
| Timeless figures on the ring inside the mortal base | 16 | 16 | 31 | robust to one chain ✓ | ≥ 5 |
| Galaxy radius | 188 | 188 | 113 | — | — |
| Separation violations | 0 | 0 | 0 | 0 ✓ | 0 |
| Cohort double membership | 60 | 0 | 0 | 0 ✓ | 0 |
| Unmarked chronology rejections | 0 (was 21) | 0 | 0 | 0 ✓ | 0 (`validate-data`) |
| Parent-direction suspects (`pnpm audit:parents`) | 0 (was 52) | 0 | 0 | 0 ✓ | warning-level |
| Cosmos + six flagship cities + all 192 city skies | pass | pass | pass | pass ✓ | pass |
| Bake time | ≈ 39 s | ≈ 1.2 s | ≈ 1.7 s → 2.4 s ordered | ≤ 5 s ✓ | — |

All columns are measured on the corrected data with `pnpm layout:metrics`. The
enforced gates live in `scripts/validate-layout.ts` (`LOCALITY`) and the fixture
limits in `scripts/lib/layout-metrics.ts` (`FIXTURES`), each set with headroom over
the Stage 2 result; rows without a gate are printed by the report only. The gates run on the whole cosmos only — a city
subset has no fixtures and too few edges for a percentile to mean anything.



## 8. Files

- Stage 0 (done): `data/relations.json`, 17 `data/characters/*.json` (`cluster`),
  `data/generated/galaxy-positions.json` (rebake), `scripts/validate-data.ts`,
  `scripts/audit-parent-direction.ts`, `src/types/character.ts` and
  `src/lib/schemas.ts` (`bond`), `docs/CONTRADICTIONS.md`, `docs/PLAN.md` §4, the
  command lists in CLAUDE.md and AGENTS.md, `package.json`.
- Stage 1 (done): `src/features/galaxy/layout.ts`, `scripts/validate-layout.ts`,
  `scripts/layout-metrics.ts`, `scripts/lib/layout-metrics.ts`, `package.json`,
  `data/generated/galaxy-positions.json` (rebake), hard rule 6 in CLAUDE.md and
  AGENTS.md, PLAN.md §6 and decision log. The baked format is unchanged.
- Stage 2 (done): `src/features/galaxy/layout.ts` (clock, hard bands, patches,
  resolution), `scripts/validate-layout.ts` (gates, no overflow),
  `scripts/lib/layout-metrics.ts` and `scripts/layout-metrics.ts` (heights, ring gaps,
  patch spread), `data/generated/galaxy-positions.json` (rebake), hard rule 6,
  PLAN.md §6, M11 and decision log.
- Contract text: CLAUDE.md and AGENTS.md hard rule 6, PLAN.md §6 and its decision
  log, with M11 cross-referenced from Stage 2.
- Review, do not assume untouched: the background samplers keyed to ring radii
  (`CLUSTERS`, `sampleBandPoint` → `DustLanes`, `NebulaWisps`, `StarField`) whenever
  radial extents move; city skies through `GalaxyView.tsx` (runtime `compact` solve);
  `RelationLines.tsx`, `CameraRig.tsx`, and labels for regressions only.

Make the new layout the default only after the stage gate passes and the visual
comparison is done.

## Appendix A — Experiment flags

Each flag is a few lines on a copy of `layout.ts`; the harness computes planar
distances from `computePositions` output.

| Flag | Patch |
| --- | --- |
| `TWIST` | value of `SPIRAL_TWIST` |
| `LOG_SPIRAL=k` | twist term becomes `k · ln(ringRadiusOf(g) / BASE_RADIUS)` in `effectiveWedges` |
| `PARENT_PREF=temporal` | `buildKinship` sort: temporal child → temporal parents first, then degree |
| `PARENT_PREF=temporal-near` | as above, then larger generation before degree |
| `COHORT_ORPHANS_ONLY` | `collectHubs` and the residence pass skip ids present in `primaryParent` |
| `SIB_NO_OFFSET` | `cohortAngularOffset` returns 0 for `siblings:` cohorts |
| `CHILDREN_CENTERED` | `assignWedge` gives children `width · childTotal / (childTotal + bonus)`, centred |
| `PC_K=k` | `apply(child, parent, 6, k, false)` over scaffold edges in the relaxation |
| `NO_VBIAS`, `OVERFLOW=n` | drop the `uy += 0.55` bias; set `REALM_OVERFLOW` |
| `ERA_BY_ASSOCIATION` | parentless, childless, consort-less temporal figures take the median generation of anchored ally/adversary/slayer neighbours before the final fixpoint |
| `FIX_REVERSED` | flip the first 32 reversed edges in memory (obsolete since Stage 0 corrected the data) |

Isolation runs not in the §2 table: temporal-near preference alone with the twist on —
scaffold median 52.0; the spring without the cohort fix — scaffold median 25.1.

## Appendix B — Stage 0 record: corrected parent edges

64 edges, written parent ⇒ children, each with the passage read in the pinned local
corpus. Citations use the corpus's own labels; for Ovid that is the pinned English
edition's line numbering, which differs from the numbering in the relation notes.

Found by the count gate (more than two undisputed parents under one source):

- Priam ⇒ Polites, Pammon, Antiphonus, Agathon, Dius, Hippothous (Iliad 24.230–260,
  the nine sons rebuked); Chromius, Echemmon (Iliad 5.160–200); Polydorus (Iliad
  20.375–415); Lycaon (Iliad 20.55–85); Medesicaste (Iliad 13.155–190); Hipponous,
  Deiopites, Chersidamas, Bias, Dryops, Hippodamas, Melanippus (Bibliotheca 3.12.5;
  Deiopites also Fabulae 90)
- Antenor ⇒ Archelochus, Acamas (Iliad 12.80–105; Epitome 3.34), Polybus (Iliad
  11.50–80), Demoleon (Iliad 20.375–415)
- Telephassa ⇒ Europa, Cadmus, Phoenix, Cilix (Bibliotheca 3.1.1)
- Philonoe ⇒ Isander, Hippolochus, Laodameia (Iliad 6.195–230, mother unnamed;
  named at Bibliotheca 2.3.2)
- Laomedon ⇒ Hicetaon, Clytius (Iliad 20.200–240)
- Eos ⇒ Memnon (Theogony 970–990)

Found by the note, prose, and kinship detectors:

- Tithonus ⇒ Memnon (Epitome 5.3) · Ares, Otrera ⇒ Penthesilea (Fabulae 112)
- Pylaemenes ⇒ Harpalion (Iliad 13.640–670) · Echius ⇒ Mecisteus (Iliad 8.295–330) ·
  Megas ⇒ Perimus (Iliad 16.660–695) · Bias ⇒ Laogonus, Dardanus (Iliad 20.455–485) ·
  Agenor ⇒ Echeclus (Iliad 20.455–485) · Alectryon ⇒ Leitus (Iliad 17.600–625) ·
  Arsinous ⇒ Hecamede (Iliad 11.620–650) · Anchises ⇒ Hippodameia (Iliad 13.425–450) ·
  Rhene ⇒ Medon (Iliad 2.695–730)
- Acessamenus ⇒ Periboea; Axius ⇒ Pelegon; Pelegon ⇒ Asteropaeus (Iliad 21.140–160)
- Laodameia ⇒ Sarpedon (Iliad 6.195–230; see `sarpedon-mother`)
- Peneus ⇒ Cyrene (Fabulae 161), Daphne (Metamorphoses 1.577–687, "daughter of a
  River God"; Latin 1.452 *Daphne Peneia*)
- Iobates ⇒ Philonoe (Bibliotheca 2.3.2), Stheneboea (Fabulae 57)
- Crisus ⇒ Strophius (Description of Greece 2.29.4) · Strophius ⇒ Pylades (Fabulae 119)
- Sthenelus ⇒ Cometes (Epitome 6.9) · Melisseus ⇒ Adrasteia, Ida (Bibliotheca 1.1.6)
- Erysichthon ⇒ Mestra (Metamorphoses 8.1124–1225) · Ligdus ⇒ Iphis (Metamorphoses
  9.1058–1208) · Cinyras ⇒ Myrrha; Myrrha ⇒ Adonis (Metamorphoses 10.464–818, 10.819–879)

Found only after the first corrections:

- Cinyras ⇒ Adonis (Bibliotheca 3.14.3) — exposed as a loop by the new gate
- Rhene ⇒ Locrian Ajax (Fabulae 97) — found by reading every parent edge in the eight
  file regions where reversals cluster

Checked and left as they are (the detectors' false positives, acknowledged by id in
the audit script): Admetus ⇐ Pheres (Bibliotheca 1.8.2), Theseus ⇐ Aethra
(Bibliotheca 3.10.7), Oebalus ⇐ Cynortas (Description of Greece 3.1.3), Elatus ⇐ Erato
(Description of Greece 8.4.2), Pelegon ⇐ Periboea (Iliad 21.141–143), Alcimede ⇐
Clymene (Argonautica 1.228).
