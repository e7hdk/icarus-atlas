# Palimpsest — Compare the Tellers (M14)

> **Status:** APPROVED 2026-08-30 — recorded in `docs/PLAN.md` as **M14** (acceptance gate M14.0–M14.2) with the deferred continuation as **M15.x**. This document stays the full specification; `docs/PLAN.md` carries the roadmap entry and the decision row. The open questions in §20 remain open and do not block M14.0.
> **Codename:** *Palimpsest* (a surface written, erased, and written again while earlier traces remain visible).
> **Public language:** **Compare the Tellers**. Supporting surface: **The Tellers**.
> **Scope:** turn the existing source lens from a mostly filtering control into a first-class comparative experience. §6 specifies every surface — Galaxy, character Poets, Myths, story pages, Lands, city lineages, and the teller observatory. §14 ships only the audit, the pair state, and one Story Theatre slice inside the M14 acceptance gate; the remaining surfaces keep their specification and follow once the model is proven.
> **Core constraint:** the update reveals differences already supported by verified source-bearing data. It does not infer missing traditions, rank ancient authors by truth, or bulk-import a new mythology corpus.

---

## 1. Product thesis

Icarus Atlas already has three strong ways to enter mythology:

- **Galaxy** answers *who is connected to whom?*
- **Lands** answers *where did a tradition place them?*
- **Myths** answers *what happened, and in what mythic order?*

The source lens supplies the question that makes this atlas distinct:

> **Who says so — and what changes when another teller speaks?**

Today the lens can dim unattested stars, re-filter relations, and change character prose. The Spindle also reacts to attestation. Those mechanics are valuable, but they are quiet: the visitor sees a changed result without being shown the disagreement as an intelligible event.

Palimpsest makes the difference itself explorable. A visitor chooses two tellers, sees where their skies overlap or diverge, opens a **Knot of Fate**, and reads the competing claims with their citations and consequences across the atlas.

This is not a fourth content universe. It is a comparative layer over the three existing doors.

### North-star outcome

A visitor should be able to begin with one visible contradiction — for example Aphrodite's parentage — and understand, without prior classical knowledge:

1. what each included source attests;
2. where the accounts differ or remain silent;
3. which stars, bonds, myths, or places change as a result;
4. where the claim is cited;
5. how to continue exploring either tradition without losing context.

### Why this is the right large update

The project is now broad enough that adding another isolated surface would increase scope without strengthening the whole. Palimpsest instead compounds the value of the existing corpus:

- every sourced character becomes more legible;
- every disputed relation becomes an interaction;
- every `topic` becomes a navigable cross-surface object;
- every source author gains a coherent editorial identity;
- every silence becomes explicit rather than visually ambiguous;
- existing routes gain depth without being replaced.

The update also fulfills the original promise recorded at the top of `docs/PLAN.md`: the sources contradict one another, and the disagreement is the point.

---

## 2. Current state — measured 2026-08-30

`pnpm validate-data` is green at the time of this proposal.

| Layer | Current state |
|---|---:|
| Source lenses | 7 |
| Characters | 1,487 |
| Relations | 4,274 source-bearing edges, already lens-filtered in Galaxy and codex |
| Stories | 176 |
| Story-culture galleries | 176 |
| Places | 269 |
| Cities | 247 |
| City lineages | 89 |
| Story crossings | 38 |
| Voyages | 1 flagship experience (`/odyssey`) |
| Contradiction sections in `docs/CONTRADICTIONS.md` | 173 headings |
| Disputed topics recognized by the validator | 163 |

### Source coverage in the current application data

Counts below mean that the source appears in at least one character summary or story paragraph (**Figures**), in a story's chapters, summary, or `attestations` (**Myths**), or on a relation edge (**Relations**). They describe atlas coverage, not the historical importance or completeness of an author.

The Myths column is attestation-inclusive by design — a source that is named as telling a story counts even when no chapter carries it yet. Counting chapters and summaries alone gives 90 / 36 / 144 / 15 / 98 / 111 / 59 for the same seven lenses. Any re-measurement must state which of the two it used; the teller pages in §6.8 must use the same method as this table.

| Lens | Figures | Myths | Relations |
|---|---:|---:|---:|
| Homer | 645 | 94 | 1,597 |
| Hesiod | 244 | 38 | 564 |
| Pseudo-Apollodorus | 1,091 | 144 | 2,523 |
| Apollonius of Rhodes | 150 | 16 | 225 |
| Ovid | 292 | 100 | 254 |
| Hyginus | 584 | 113 | 807 |
| Pausanias | 458 | 62 | 399 |

These numbers prove that a comparison feature can ship from current data. They also reveal an important design rule: **coverage is radically uneven**. Palimpsest must distinguish disagreement from silence and must never imply that an author denied a claim merely because the atlas contains no attestation from that author.

### Measured migration debt

Topic counts describe editorial questions; the migration is paid in **fact records**. Measured over `data/characters/`, `data/relations.json`, and `data/stories/` (places and features are not in this scan, so the topic count is slightly below the validator's 163):

| Measure | Value |
|---|---:|
| Topics carrying more than one record ("disputed") | 159 |
| Fact records inside those topics | **1,035** |
| Fact records inside the 12 recommended pilot topics | **147** |
| Topics whose records have fully disjoint source sets | **15 / 159** |
| Topics where one source appears in more than one record | 144 |
| Topics spanning more than one record kind (character, relation, chapter) | 111 |

The last three rows are the load-bearing ones. **A stance cannot be derived mechanically from source sets.** In `aphrodite-parentage`, `hesiod` appears in five separate records — the Aphrodite summary, the Cronus and Uranus summaries, a `parent` relation, and a story chapter — all attesting the *same* stance on different nodes. Only 15 topics have the clean "source A says X, source B says Y" shape.

Consequences for planning:

- milestones must be sized in records, not topics (`moirai-parentage` alone is 39 records, `first-beings-cosmogony` 34);
- every record inside a promoted topic needs a human stance assignment;
- a source appearing in several records of one topic is *usually* the same stance repeated across nodes and only occasionally a genuine internal split. The audit must tell those apart case by case, and no heuristic can do it.

### Existing foundations to reuse

- `SourceId`, `LensId`, and `sources: SourceId[]` are already shared contracts.
- `topic` already links competing facts across characters, relations, stories, places, features, and chronology.
- `docs/CONTRADICTIONS.md` is a verified editorial catalogue of claims and citations.
- `research/corpus/manifest.json` pins primary texts, often in both original language and English translation.
- `useGalaxyStore.lens` already coordinates the active teller across client surfaces.
- Galaxy stars and relation lines already update without changing deterministic positions.
- Myths Spindle nodes and crossings already respond to lens attestation.
- Character Poets already has the only explicit, local lens selector and a source-aware relation seal.
- Story Theatre already has a strong scrollytelling grammar, source footnotes, and quiet dispute markers.
- City lineages, residences, places, and features are already sourced facts.

### Gaps Palimpsest must solve

1. A `topic` groups records, but it does not explicitly name each incompatible **stance**.
2. Some disputed prose combines several source positions inside one paragraph. That is readable in consensus mode but cannot be compared honestly source by source.
3. A single `citation` string may contain passages from several works, so evidence cannot always be assigned to a specific witness mechanically.
4. The story detail route currently renders the union of chapters rather than composing a source-specific or paired telling.
5. The source selector is discoverable in settings and character Poets, but not as a direct invitation from every dispute badge.
6. The current UI marks a disputed fact without explaining its consequences elsewhere in the atlas.
7. The validator proves that a topic is documented, but it does not yet prove that the topic has two machine-readable stances.
8. Source silence, agreement, disagreement, and within-source contradiction are not represented as separate UI states.
9. The shipped dispute signal is a **count, not a comparison**. `isDisputed()` in `src/lib/lens.ts` and `firstQuarrel()` in `src/features/spotlight/build.ts` both read "this topic appears more than once" as disagreement. Measured against current data, **22 of the 137 characters that receive a Proem quarrel beat** derive that beat from records that all carry one identical source set — `amphillogiai / night-brood-parentage` (all `hesiod`), `antinous / penelope-antinous-affair` (all `apollodorus`), and 20 more. Those are presented to visitors as a quarrel between tellers and are not one. Palimpsest is therefore not only a new surface; it repairs a correctness defect on shipped surfaces.
10. A two-teller comparison can present a genuinely disputed topic as agreed. `flood-landing` is attested as Parnassus by Apollodorus **and** Ovid, and as Etna by Hyginus. An Apollodorus ↔ Ovid pair would truthfully report a shared telling while silently hiding that the topic is contested.

---

## 3. Principles and truth conditions

### P1 — Sources remain witnesses, not teams

The interface may place two tellers side by side, but it must not turn scholarship into a winner/loser contest. No votes, truth scores, popularity bars, confidence percentages, or “canonical version” labels.

### P2 — Silence is not denial

“No surviving account included under this lens” is a coverage statement. It must never become “Homer says this did not happen.” The UI vocabulary is fixed:

- **Attested here** — the selected source is attached to the fact.
- **Another telling** — the paired source attests a different stance.
- **Shared telling** — both sources attest the same stance.
- **Silent in the atlas** — no included passage from that source currently supports a stance.
- **The teller differs within the surviving work(s)** — one `SourceId` contains more than one stance at different passages.
- **Other tellers differ** — the two selected sources share a stance, but at least one source outside the pair attests a different one. This state is mandatory wherever a shared telling is announced; see gap 10, §6.2, §6.5, and the `outsidePair` classifier field in §8.6.

### P3 — One claim, one stance

Compare-ready facts must be source-atomic. If a paragraph says that Apollodorus and Ovid place the flood landing on Parnassus while Hyginus places it on Etna, that paragraph must be split into separate sourced records before it powers comparison.

This rule applies only to facts promoted into compare mode. It does not require a rewrite of all 1,487 character files before M14 can begin.

### P4 — `topic` asks the question; `stance` supplies an answer

Example:

```text
topic:  flood-landing
stance: parnassus
stance: etna
```

The stance identifier is editorial structure, not visible prose. It is local to its topic and must not be reused as a universal taxonomy.

### P5 — Author lenses may contain internal disagreement

One author or compiled work can preserve several traditions. Hesiod gives two parentages for the Moirai; Homer gives more than one fall of Hephaestus. The data model must allow the same `SourceId` to witness multiple stances when different citations support them.

### P6 — Primary type remains the sole star-glow driver

Palimpsest does **not** recolor star cores, change pulse, alter size, or move stars. `CharacterType` remains the sole driver of glow and mortal-clock layout.

Comparison uses a separate, non-glow annotation layer:

- outer arcs;
- orbit ticks;
- line treatments;
- panel borders;
- small source sigils;
- labels and patterns.

This preserves hard rule 7 and keeps the galaxy's visual grammar coherent.

### P7 — Positions remain lens-independent

Switching or comparing tellers never rearranges the galaxy or city skies. Only attestation, relation visibility, and comparison annotation change. A visitor must be able to see that the *same sky* has been written differently.

### P8 — Corpus-first evidence

Every new stance or witness follows the existing research workflow:

1. `pnpm corpus:search <query>`;
2. compare the relevant lenses;
3. verify the cited passage against the pinned edition, including original language when available;
4. split the application fact into source-atomic records;
5. add `topic`, `stance`, and witness metadata;
6. reconcile `docs/CONTRADICTIONS.md`;
7. run validation.

Corpus hits remain research evidence, never automatically generated mythology data.

---

## 4. Concept and vocabulary

| Term | Meaning |
|---|---|
| **Lens** | One existing source author selected as the active teller. |
| **Compare pair** | A primary lens and one secondary source lens. Exactly two in M14. |
| **Topic** | A stable question that groups competing facts, e.g. `aphrodite-parentage`. |
| **Stance** | One incompatible answer within a topic, e.g. `sea-foam` or `zeus-and-dione`. |
| **Witness** | One source passage attesting a stance, identified by source and citation. |
| **Knot of Fate** | The public interactive object representing a compare-ready topic. |
| **Trace** | A small source-specific visual mark on a star, relation, story, or place. |
| **Shared telling** | Both selected sources attest the same stance. |
| **Split telling** | The selected sources attest different stances. |
| **Internal split** | One source attests more than one stance in the included passages. |
| **Silence** | The atlas has no included attestation for that source on the fact. |
| **Outside the pair** | A source that is not currently selected attests a different stance on the same topic. A shared telling may never be announced while this is true. |

### Public product names

- Feature invitation: **COMPARE THE TELLERS**
- Topic interaction: **KNOT OF FATE**
- Source directory: **THE TELLERS**
- Technical/project codename: **PALIMPSEST**

“Palimpsest” should not be required vocabulary for a first-time visitor. It can appear in changelog and editorial copy; the control itself should say plainly what it does.

---

## 5. Core user journeys

### 5.1 From a disputed star

1. The visitor hovers Aphrodite in consensus mode.
2. The hover card says **“2 tellings of her birth”**, not only `⚖`.
3. Selecting the prompt opens a compact Knot preview with Hesiod, Homer, and Pseudo-Apollodorus witnesses.
4. The visitor chooses **Compare Hesiod ↔ Homer**.
5. The galaxy remains in place. Source arcs appear around affected stars; competing parent edges are drawn as paired traces.
6. Selecting the knot opens the full comparison drawer with claims, citations, and affected atlas surfaces.
7. “Follow Hesiod” or “Follow Homer” exits comparison into that single lens without moving the camera.

### 5.2 From a story fork

1. The visitor reads *The Great Flood*.
2. Shared prose remains full width.
3. At `flood-landing`, the constellation spine separates into two short rails.
4. Each rail carries the stance, teller name, and citation.
5. On desktop the rails can be read together; on mobile they become a source toggle with a persistent “other telling” tab.
6. The rails reunite after the disputed beat. The entire page does not become a permanent split screen.

### 5.3 From a local tradition on Lands

1. The visitor opens a place or city where Pausanias preserves a local version.
2. A **Local telling** trace identifies the place-specific claim.
3. Compare mode pairs Pausanias with another source when a documented stance exists.
4. The map marker remains fixed; the panel shows how the place's claimed genealogy, founder, event, or cult tradition differs.

### 5.4 From The Tellers

1. The visitor opens **The Tellers** from the source-lens section of Atlas Settings.
2. They choose Homer.
3. The page introduces Homer's included works, period, language, and current atlas coverage.
4. It presents featured Knots, stories strongly attested by Homer, and explicit areas of silence.
5. The visitor selects another teller and enters comparison without returning to settings.

### 5.5 Sharing a comparison

A copied URL preserves the state:

```text
/character/aphrodite?lens=hesiod&compare=homer&topic=aphrodite-parentage
/story/great-flood?lens=apollodorus&compare=hyginus&topic=flood-landing
```

Opening the URL reconstructs the same compare pair and focuses the same topic. Canonical metadata ignores these query parameters.

---

## 6. Surface specification

This section specifies every surface the feature eventually touches. It is not the delivery order: §14 puts only Atlas Settings, the shared Knot shell, Myths, and Story Theatre inside the M14 acceptance gate. Galaxy (§6.2), character Poets (§6.3), Lands (§6.6), and The Tellers (§6.8) keep their specification here and ship afterwards, which also means journeys 5.1, 5.3, and 5.4 land after the gate while 5.2 and 5.5 land inside it.

### 6.1 Global control — Atlas Settings

The current **Source lens** section becomes two progressive layers:

1. **Read after one teller** — existing single-lens behavior, including Consensus.
2. **Compare two tellers** — an explicit action available after choosing a concrete source.

Rules:

- `consensus` cannot be one side of a comparison; it is already the union.
- The primary source is the existing `lens` value.
- `compareWith` stores the secondary source or `null`.
- Selecting the same source on both sides is prevented.
- Swapping sides is one action and preserves the selected topic.
- Exiting compare mode returns to the primary lens.
- The settings list shows current atlas coverage as neutral metadata, never a quality score.
- A **Meet the tellers →** link opens `/tellers`.

When comparison is active, the AtlasBar gains a compact paired-lens chip. It must not compete visually with the three main navigation doors.

### 6.2 Galaxy

#### Star states

The existing type glow stays untouched. One instanced annotation layer renders source traces:

| State | Visual treatment |
|---|---|
| Shared attestation, same stance | two joined outer arcs + small shared notch |
| Shared stance, a teller outside the pair differs | joined arcs + outline knot glyph — never the plain shared notch |
| Primary only | primary arc on the upper-left quadrant |
| Secondary only | secondary arc on the lower-right quadrant |
| Both present, different stance | separated arcs with a small knot glyph |
| Neither attested | existing ghost/dim behavior |
| Internal split in either source | broken arc pattern + knot glyph |

Source identity cannot rely on color alone. Arc position, pattern, source initials, and accessible labels must carry the distinction.

#### Relation states

- Same edge attested by both sources: one line with a paired center tick.
- Edge attested by one source: one source-patterned trace.
- Competing relation edges under the same topic: both edges remain visible and converge on a Knot marker near the active star.
- Internal split: both relevant edges use the same source identity plus distinct stance labels in the detail panel.
- No relation animation may modify baked positions or trigger layout recalculation.

#### Interaction

- Hover remains fast and summary-first.
- A compare-aware hover card shows no more than three changed bonds before “View all differences.”
- Clicking a Knot opens the comparison drawer; clicking a star still flies the camera and opens character detail.
- `Esc` closes the deepest layer first: Knot drawer → character panel → galaxy focus.

#### Performance posture

- No second R3F Canvas.
- No per-star DOM badge for 1,487 stars.
- Source traces are instanced geometry or shader attributes.
- Source masks are precomputed typed arrays.
- Changing a compare pair updates buffers; it does not recreate star objects.
- Relation comparison is scoped to the active/hovered star, spotlight, or selected Knot rather than drawing the entire dual graph.

### 6.3 Character Poets

Poets becomes the fullest per-figure comparison surface.

#### Marquee

- Existing single-lens dropdown remains.
- Compare mode adds a paired teller strip below it.
- The codex seal shows dual source arcs around relation members.
- Registers show counts for shared, split, primary-only, and secondary-only material.

#### Prose

The reading column uses three block types:

1. **Shared passage** — one column, both source witnesses named.
2. **Single witness** — one column with an honest silence note for the other source.
3. **Forked passage** — paired stance cards joined by a Knot header.

The page does not duplicate identical prose into two columns. Comparison is inserted only where it adds information.

#### Bonds

Bond rows group by relation meaning first, then stance. A source-specific parent or slayer edge must be understandable without reading line color.

#### Information and Legacy

These tabs remain lens-independent by project decision. They may preserve the paired-lens chip in the global chrome so state is not lost, but they do not filter or compare their content.

### 6.4 Myths — the Spindle of Time

The Spindle already knows whether a story is attested by a lens. Compare mode adds a lightweight trace layer:

- shared stories: paired rings around the story star;
- primary-only and secondary-only stories: one-sided rings;
- stories containing compare-ready Knots for the pair: a small split filament;
- cross-arm story crossings retain their sourced lens behavior and gain paired styling only when selected.

The cycle colors and myth chronology remain unchanged. Comparison annotations cannot replace the existing shelf/cycle palette.

The selected story card gains:

- `Shared by both tellers`, `Only attested here`, or `Contains N differing tellings`;
- a direct **Compare inside the saga →** action;
- no automated summary of what an absent author “would have said.”

### 6.5 Story Theatre

Story pages are where Palimpsest becomes a reading experience rather than a graph filter.

#### Composition rules

- Summary and chapters are filtered into a source-pair view on the client so routes remain statically generated.
- Chapters with the same stance are rendered once with both witnesses.
- Chapters with different stances enter a **Forked Act**.
- Chapters attested by only one selected source remain readable with a silence label for the other.
- Consensus mode preserves the current union presentation.
- Cast and places are not hidden merely because one source is silent; their roles can carry source traces when the role itself is sourced in a later schema extension.

#### Forked Act anatomy

```text
KNOT OF FATE · FLOOD-LANDING

APOLLODORUS                         HYGINUS
Mount Parnassus                    Mount Etna
Bibliotheca 1.7.2                  Fabulae 152A, 153

[follow this telling]              [follow this telling]

WHAT CHANGES
landing place · linked geography · subsequent local tradition
```

“What changes” is curated in dispute metadata by default, and generated from linked facts only where the generated list is demonstrably clean. It must never introduce a new mythological claim without sources.

Curation is the default because generation is noisy on this data. A topic's affected refs are dominated by the same stance repeated across nodes: `aphrodite-parentage` spans eight paragraphs across four character files, three relation edges, and three story chapters, most of them restating one position on a different node. A consequence sentence generated from that list reads as a pile of duplicates rather than as an explanation. Generation stays useful for the *affected surfaces* list inside the Knot drawer, where repetition is informative; it is the human-facing consequence line that needs an editor.

When the two selected sources share a stance on a compare-ready topic, the act does **not** fork. It renders once, marked as a shared telling, and carries one quiet line naming the tellers outside the pair who differ — “Hyginus tells this landing differently” — linking into the full Knot, where every witness appears. A shared telling is never announced without that check.

#### Marquee and path

- The existing constellation spine remains the dominant scroll affordance.
- A fork separates only for the disputed act and rejoins afterward.
- Multiple stances from the same teller receive separate rails with the same source sigil and distinct citations.
- Reduced motion presents a static branch diagram.

### 6.6 Lands, places, cities, and lineages

Geography needs stricter semantics than the galaxy:

- A city or physical feature does not disappear because a literary source is silent.
- Source comparison applies to mythological claims attached to the location: summaries, foundations, residences, events, cult traditions, and reigns.
- Pleiades coordinates, Natural Earth geometry, OSM rivers, and terrain attribution are reference data and never enter the mythology lens.

#### Place and city panels

- Each sourced paragraph can carry shared/split/single-witness traces.
- A compare-ready place topic opens the same Knot drawer used elsewhere.
- Residence differences are phrased as attestation coverage: “Pausanias places this figure here”; never “Homer places them elsewhere” unless a competing sourced residence exists.

#### Lineages

- Reigns shared by both tellers retain one row.
- Alternative rulers or succession links split into paired branches.
- Plain attested ruler names remain valid; comparison does not require premature character promotion.
- City-sky membership remains the union of sourced residences for spatial stability. Compare traces annotate membership instead of removing stars abruptly.

### 6.7 Proem, Ephemeris, and Odyssey

- **Proem:** existing quarrel beats are a natural entry into a Knot. A new action may open comparison after the five-beat telling; the Proem itself stays focused and does not become a two-column reader.
- **Ephemeris:** a disputed star may advertise “the tellers differ,” then deep-link to its featured Knot. Daily selection remains deterministic and lens-aware as today.
- **Odyssey:** remains a Homer-led flagship presentation. It may preserve global compare state in navigation, but M14 does not split the voyage or add a lens selector inside it. Comparison belongs to linked story/codex surfaces.

### 6.8 The Tellers — `/tellers`

The Tellers is a satellite observatory, not a fourth main nav door.

#### Index

- seven source cards ordered editorially, not by coverage;
- name, works, period, language, concise lens character;
- coverage counts labeled **“included in this atlas”**;
- featured Knots;
- paired comparison launcher;
- explanation of silence and compilation caveats.

#### Teller detail

Recommended route: `/teller/[id]`.

Sections:

1. **The voice** — existing `sources.json` description, expanded only with verified editorial metadata.
2. **Works included** — each work and its corpus edition(s).
3. **Where this teller speaks** — figure, myth, place, and relation coverage.
4. **Signature tellings** — curated, not algorithmically ranked.
5. **Knots** — topics where the teller differs from another included witness.
6. **Silences** — carefully worded coverage boundaries.
7. **Read against another teller** — comparison launcher.

Coverage counts are navigation aids. They are not presented as author authority, completeness, or reliability.

---

## 7. Visual and motion language

### Comparison palette

Add semantic tokens in `src/styles/theme.css`:

```css
--compare-primary: ...;
--compare-secondary: ...;
--compare-shared: ...;
--compare-silence: ...;
--compare-knot: ...;
```

Exact colors require a visual spike. Recommended direction:

- primary: warm parchment-gold;
- secondary: cool violet-blue;
- shared: pale aether;
- knot: existing nebula dispute violet;
- silence: low-contrast graphite.

These tokens annotate sources only. They must never replace `TYPE_GLOW` or alter a figure's star color.

### Source sigils

Each selected teller receives a stable letter/sigil in the active pair. The first release should use typographic initials and arc position rather than inventing seven pictorial logos.

### Motion

- Enter compare mode: source arcs write themselves around visible targets, 260–420 ms.
- Relation differences: crossfade and line-draw, never spatial rearrangement.
- Open Knot: the two source rails unfold from the dispute mark.
- Swap tellers: arcs rotate positions and labels crossfade; content does not flash blank.
- Reduced motion: all end states appear immediately with no line draw, parallax, or animated branch.

### Density rules

- Do not show every Knot at galaxy scale.
- Global view shows aggregate traces only.
- Topic glyphs appear for hovered/selected stars, current story, current place, or a deliberate “show knots” filter.
- Labels remain demand-driven.
- On mobile, comparison uses toggles, stacked cards, and sticky source tabs rather than compressed side-by-side prose.

---

## 8. Data model

The model is additive and preserves all existing `sources` arrays.

### 8.1 Extend source-bearing facts with `stance`

```ts
interface SourcedText {
  text: string;
  sources: SourceId[];
  citation?: string;
  topic?: string;
  /** One answer within topic; required when the topic is compare-ready. */
  stance?: string;
  /** Stable identity for cross-surface references; required when the topic
   *  is compare-ready, because P3 splits records and array indexes move. */
  factId?: string;
  /** Per-source evidence when one citation string is not granular enough. */
  witnesses?: SourceWitness[];
}

interface SourceWitness {
  source: SourceId;
  citation: string;
  /** Optional pinned-corpus entry for a curated original-text excerpt. */
  corpusEntry?: string;
}
```

The same optional fields extend other topic-bearing records:

- `Relation`;
- `StoryChapter` and story summary;
- place/feature sourced text;
- lineage reign or succession fact where supported;
- chronology anchor where comparison is later enabled.

`witnesses` is not required for ordinary facts. It becomes required for compare-ready records when `sources.length > 1` and the existing combined `citation` cannot be assigned safely to individual sources.

Validator invariants:

- `stance` requires `topic`.
- a compare-ready fact has a `factId`, unique within its owning record and never reused after deletion.
- `witnesses[].source` must appear in `sources`.
- witness source/citation pairs must be unique within the fact.
- `corpusEntry`, when present, must resolve to `research/corpus/manifest.json` and match the same `sourceId`.
- a compare-ready topic has at least two distinct stances;
- every compare-ready fact has a stance;
- one source may witness multiple stances when citations differ;
- silence is derived and is never stored as a fabricated stance.

### 8.2 Dispute metadata

Add `data/disputes.json` for presentation metadata only:

```ts
type DisputeCategory =
  | 'cosmogony'
  | 'genealogy'
  | 'identity'
  | 'event'
  | 'agency'
  | 'motivation'
  | 'fate'
  | 'geography'
  | 'chronology';

interface DisputeMetadata {
  id: string;                 // exact existing topic key
  title: string;              // public question/title
  category: DisputeCategory;
  teaser: string;             // non-mythological UI invitation or sourced wording
  status: 'legacy' | 'compare-ready';
  featured?: boolean;
  /** Optional ordered stance labels; facts remain authoritative. */
  stanceLabels?: Record<string, string>;
  /** Optional refs whose changes best explain the consequence. */
  consequenceRefs?: FactRef[];
}
```

This file must not duplicate full myth prose or become a second source of truth. The facts remain in characters, relations, stories, places, features, and lineages. Metadata supplies public labels, curation, and compare readiness.

### 8.3 Stable fact references

The generated index needs to point back to facts without fragile prose matching.

References identify a fact by its own id, not by its position:

```ts
type FactRef =
  | { kind: 'character-summary'; id: string; factId: string }
  | { kind: 'character-story'; id: string; factId: string }
  | { kind: 'relation'; id: string }
  | { kind: 'story-summary'; id: string }
  | { kind: 'story-chapter'; id: string; factId: string }
  | { kind: 'place-summary'; id: string; factId: string }
  | { kind: 'feature-summary'; id: string; factId: string }
  | { kind: 'lineage-reign'; city: string; factId: string };
```

Array indexes are **not** sufficient, and the churn question does not need measuring. P3 requires splitting combined records into source-atomic ones, and splitting a record is exactly what shifts every later index in its array. Index churn is not a hypothesis to test after the pilot — it is a guaranteed consequence of the migration itself. The same positional assumption already exists downstream: `data/generated/linked-prose.json` bakes per-character `summary` and `story` arrays by position under a per-entity signature, so a split re-bakes that entity and renumbers everything after the split point.

Therefore:

- every compare-ready fact receives a stable `factId` **in M14.0**, before the pilot records are split;
- `factId` is opaque and kebab-case, unique within its owning record, and never reused after deletion;
- `FactRef` stores `factId` as the identity; array position survives only as a build-time locator inside the index builder;
- legacy (non-promoted) facts need no `factId`, so 1,487 character files are not rewritten to start;
- the validator rejects missing, duplicate, or reassigned ids on compare-ready facts.

### 8.4 Generated dispute index

Add `scripts/build-dispute-index.ts` and generated output under `data/generated/`.

```ts
interface GeneratedDisputeIndex {
  version: 1;
  generatedFrom: string[];
  topics: Record<string, {
    metadata: DisputeMetadata;
    stances: Record<string, {
      sources: SourceId[];
      facts: FactRef[];
      witnesses: SourceWitness[];
    }>;
    affected: {
      characters: string[];
      relations: string[];
      stories: string[];
      places: string[];
      cities: string[];
    };
    internalSplits: SourceId[];
  }>;
}
```

The generated file stores references and masks, not copied prose. This keeps bundles small and avoids competing truth sources.

Build integration:

```text
pnpm build:palimpsest
pnpm build
```

`build` and `dev` should skip regeneration when all inputs are older than the generated index, following the current baked-layout and linked-prose precedent.

### 8.5 Runtime comparison state

Minimal Zustand extension:

```ts
interface GalaxyState {
  lens: LensId;                  // existing primary/single lens
  compareWith: SourceId | null; // new secondary lens
  focusedTopic: string | null;
  setComparison: (primary: SourceId, secondary: SourceId) => void;
  swapComparison: () => void;
  clearComparison: () => void;
  focusTopic: (topic: string | null) => void;
}
```

Why retain `lens` instead of replacing it with a new mode object:

- existing components keep their single-lens behavior;
- compare-aware components opt in incrementally;
- clearing comparison has an obvious fallback;
- the current persistence policy remains unchanged.

Query-state rules:

- direct load reads `lens`, `compare`, and `topic` once on hydration;
- invalid or identical pairs fail closed to single-lens mode;
- active comparison writes canonical query state with `history.replaceState`;
- client navigation preserves state through the store and re-synchronizes the URL;
- copied links are shareable;
- lens/compare state remains non-persistent across unrelated browser sessions, matching current behavior.

### 8.6 Comparison classifiers

Pure helpers should produce a small shared vocabulary:

```ts
type PairPresence = 'shared' | 'primary-only' | 'secondary-only' | 'neither';
type PairAgreement = 'same-stance' | 'split-stance' | 'internal-split' | 'unknown';

interface PairClassification {
  presence: PairPresence;
  agreement: PairAgreement;
  primaryStances: string[];
  secondaryStances: string[];
  /** Sources outside the selected pair attesting a stance that neither
   *  selected source attests. Non-empty forbids an unqualified
   *  "shared telling" anywhere in the UI. */
  outsidePair: { source: SourceId; stance: string }[];
}
```

These helpers must be unit-tested independently of React and Three.js. All surfaces use the same classifier so that Galaxy, Poets, Story Theatre, and Lands cannot describe the same topic differently.

`outsidePair` exists because a pair is a window, not the whole record. `flood-landing` reads as agreement under Apollodorus ↔ Ovid and as disagreement under Apollodorus ↔ Hyginus, from the same data. No surface may render a shared-telling label while `outsidePair` is non-empty; it must render the qualified form instead and offer the Knot, which always lists every witness.

---

## 9. Editorial migration strategy

### 9.1 Do not migrate every topic at once

M14 begins with a small pilot selected for:

- strong primary-text verification already present in `docs/CONTRADICTIONS.md`;
- visible consequences in more than one atlas surface;
- at least two current source lenses;
- a mix of genealogy, event, geography, and internal contradiction;
- recognizable entry points for non-specialists.

### Recommended pilot Knots

Final inclusion still requires a corpus re-check before data edits.

| Topic | Records | Why it tests the system |
|---|---:|---|
| `aphrodite-parentage` | 14 | iconic incompatible genealogy; changes core relations |
| `first-beings-cosmogony` | 34 | different beginnings of the cosmos; multi-node consequence |
| `hephaestus-fall-from-olympus` | 6 | within-Homer split plus Apollodoran retelling |
| `moirai-parentage` | 39 | within-Hesiod split and cross-author agreement |
| `flood-landing` | 6 | story fork, geography consequence, and a shared pair hiding a third teller |
| `flood-survivors` | 4 | several authors, not merely a binary answer |
| `apsyrtus-death` | 8 | story event, agency, and Argonautic geography |
| `medea-children-corinth` | 13 | local Corinthian tradition versus literary retellings |
| `oedipus-children-mother` | 9 | genealogy plus Theban saga consequence |
| `theseus-paternity` | 4 | Apollodorus attests both fathers — an internal split in the pilot |
| `atalanta-parentage` | 3 | multi-parent genealogy across saga arms |
| `odysseus-paternity` | 7 | recognizable hero, relation rewiring, Hyginus contrast |
| **Total** | **147** | |

The pilot is deliberately not “the twelve most famous contradictions.” It is a systems test across data shapes.

**Size the milestone by the records column, not by the row count.** Twelve topics is 147 fact records to read, stance-assign, split where combined, and re-cite — two of them (`moirai-parentage`, `first-beings-cosmogony`) are half the work on their own. Progress reporting during M14.0 quotes records completed out of 147, never topics out of 12.

### 9.2 Per-topic migration checklist

1. Read the full existing contradiction entry.
2. Search the local corpus for every named passage.
3. Verify original-language wording where available.
4. Enumerate stances without forcing false binaries.
5. Identify combined prose that must be split.
6. Add `stance` to every compare-ready fact.
7. Add granular witnesses where a combined citation is ambiguous.
8. Add minimal metadata to `data/disputes.json`.
9. Generate the dispute index.
10. Check every affected surface manually.
11. Reconcile wording in `docs/CONTRADICTIONS.md` if the audit changes anything.
12. Run all data and layout gates.

### 9.3 Promotion states

- **Legacy:** topic exists and remains a normal consensus dispute badge.
- **Compare-ready:** every rendered claim is atomic enough for stance comparison.
- No partial compare state is exposed publicly. A topic either opens the full Knot experience or retains the existing quiet badge.

### 9.4 Original-text excerpts

Original-language and English excerpts are a later enhancement inside compare-ready Knots, not an M14.0 dependency.

Rules:

- excerpts are curated, never scraped into application data automatically;
- every excerpt stores `corpusEntry`, citation, edition, language, and license metadata;
- quotation length is kept to the minimum needed to show the evidence;
- the UI defaults to concise claim paraphrase and citation;
- visitors explicitly expand **Read the passage**;
- no passage is presented when the corpus lacks a licensed edition suitable for display.

---

## 10. Technical architecture

### 10.1 Modules

Recommended directory:

```text
src/features/palimpsest/
  classify.ts             # pure source-pair and stance logic
  dispute-index.ts        # typed generated-index access
  query-state.ts          # URL parse/serialize/sync
  selectors.ts            # character/story/place affected-topic selectors
  types.ts

src/components/palimpsest/
  ComparePairControl.tsx
  CompareChip.tsx
  SourceTrace.tsx
  KnotBadge.tsx
  KnotPreview.tsx
  KnotDrawer.tsx
  ForkedPassage.tsx
  TellerCard.tsx
  TellerCoverage.tsx
```

**Resolved 2026-08-30.** `src/features/lens/` held nothing but a `.gitkeep` while the source-lens state actually lived in `src/features/galaxy/store.ts` and the fact-filtering helpers in `src/lib/lens.ts`, yet the directory map in `CLAUDE.md` promised it as “source-lens state + fact-filtering logic”. The empty directory was removed and the map corrected to name `src/features/palimpsest/` and `src/lib/lens.ts` for what they are, so the comparison layer does not inherit the ambiguity.

Galaxy-specific rendering stays under `src/components/galaxy/`:

```text
CompareStarTraces.tsx
CompareRelationLines.tsx
```

Story-specific branch layout remains under `src/components/stories/` and imports only the shared classifier/types.

### 10.2 Data flow

```text
source-bearing JSON + data/disputes.json + corpus manifest
                         │
                         ▼
             build-dispute-index.ts
                         │
                         ▼
        data/generated/dispute-index.json
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Galaxy       Story/Poets      Lands/Tellers
          └──────────────┼──────────────┘
                         ▼
              shared pair classifier
```

The generated index answers **where** a topic appears. Original data remains authoritative for **what** the fact says.

### 10.3 Server/client boundary

- Existing routes remain SSG.
- Server components continue loading the union of verified facts.
- Client comparison components receive the records they already render plus compact dispute-index slices.
- Query parameters initialize client state; they do not turn all routes dynamic.
- Teller pages can be statically generated for the seven `SourceId` values.
- No backend or user account is required.

### 10.4 Bundle control

- Do not ship the full generated topic index to every route.
- Galaxy receives character/relation masks and topic refs only.
- A story page receives only topics referenced by that story.
- A character page receives only topics affecting that character or its direct bonds.
- `/tellers` may load aggregate counts; `/teller/[id]` loads that source's curated topic subset.
- Full Knot detail can be a route-level or drawer-level lazy chunk.

### 10.5 Source masks

Seven sources fit in one byte. Build-time masks can represent ordinary attestation:

```ts
const SOURCE_BIT: Record<SourceId, number> = {
  homer: 1 << 0,
  hesiod: 1 << 1,
  apollodorus: 1 << 2,
  apollonius: 1 << 3,
  ovid: 1 << 4,
  hyginus: 1 << 5,
  pausanias: 1 << 6,
};
```

The stance index remains separate because one source can witness multiple stances. Bitmasks optimize presence; they do not encode scholarly meaning.

---

## 11. Accessibility and responsive behavior

### Keyboard

- Compare controls are standard buttons/listboxes with visible focus.
- `C` may open compare controls only if it does not collide with existing shortcuts.
- `S` swaps tellers when focus is not inside a form control.
- `Esc` closes the active Knot before clearing comparison.
- Forked Acts expose headings and source labels in reading order.

### Screen readers

Every visual trace needs a concise text equivalent:

```text
“Aphrodite parentage: Hesiod and Homer preserve different tellings.”
“Hesiod: sea-foam from Uranus. Theogony 188–206.”
“Homer: daughter of Zeus and Dione. Iliad 5.370–417.”
```

Decorative arcs and lines are `aria-hidden`. The Knot drawer is the semantic source of truth.

### Color and pattern

- Primary/secondary identity uses arc position, initials, border pattern, and text labels in addition to color.
- Shared and split states use different geometry.
- Dispute glyphs never carry meaning alone.

### Mobile

- No permanent two-column body text below the desktop breakpoint.
- Source tabs remain sticky within a Forked Act.
- A one-line “Other telling available” control prevents the second stance from being hidden below excessive scrolling.
- Knot drawer becomes a full-height sheet.
- Galaxy traces remain shader/instanced; no additional mobile DOM label cloud.

### Reduced motion

- No writing arcs, line-draw animation, rail unfolding, or source swap rotation.
- All states appear immediately.
- Reading order and information remain identical.

---

## 12. Performance budget

The 60fps target remains the product bar.

### Galaxy gates

- one additional instanced trace draw call target;
- no second Canvas;
- no star-object recreation when pair changes;
- compare masks updated in one linear pass over typed arrays;
- full dual relation graph never rendered globally;
- pair swap performs no layout bake or force relaxation;
- device-pixel-ratio caps remain unchanged.

### DOM gates

- fork components mount only for topics present on the current page;
- long teller topic lists virtualize or paginate if necessary;
- original-text excerpts are collapsed and lazy;
- no full corpus text enters the client bundle;
- generated indexes contain refs and masks, not duplicated prose.

### Measurement

Manual profiling must include:

- Galaxy idle and camera flight with compare off/on;
- a high-degree star such as Zeus or Heracles;
- Myths Spindle with compare traces;
- a long story with several topics;
- Troy city sky;
- mobile viewport with reduced motion on and off.

Any visual treatment that breaks the frame budget is removed before feature expansion. Comparison density is a progressive enhancement, not an excuse to lower the quality bar.

---

## 13. Validation and test plan

### Data validation additions

`pnpm validate-data` grows checks for:

- `data/disputes.json` schema and unique topic ids;
- every metadata id exists in source-bearing data or is explicitly marked editorial-only (not recommended for M14);
- `compare-ready` topics have at least two stances;
- every fact in a compare-ready topic has `stance`;
- stance ids are kebab-case and local to their topic;
- witnesses are subsets of `sources` and carry citations;
- corpus-entry refs exist and match source ids;
- consequence refs resolve;
- generated index is current and deterministic;
- every compare-ready topic remains documented in `docs/CONTRADICTIONS.md`;
- duplicate fact refs and orphan stance labels are rejected;
- every compare-ready fact carries a `factId` that is unique within its record, and no stored ref depends on array position;
- no dispute or quarrel reachable in the UI is derived from record count alone.

### Unit tests

- Add a focused `test:palimpsest` command. Prefer Node's built-in test runner through the existing TypeScript runtime unless the repository adopts a general test framework first; M14 should not introduce a large test dependency for one feature.
- pair presence classification;
- same/split/internal stance classification;
- source silence;
- a single source witnessing multiple stances;
- outside-pair dissent on a stance the selected pair shares;
- `factId` stability across a record split;
- URL parse/serialize round-trip;
- invalid and identical compare pairs;
- deterministic generated index;
- topic selectors for character, relation, story, place, and lineage refs.

### Integration tests

Minimum fixtures:

1. one shared stance;
2. one primary-only fact;
3. one split genealogy edge;
4. one within-source split;
5. one three-stance topic;
6. one story Forked Act;
7. one geography consequence;
8. one legacy topic that must not open a Knot.

### Route checks

Inside the M14 gate:

- `/` with a direct compare URL — state hydrates, the galaxy is otherwise unchanged;
- `/stories` pair traces;
- `/story/great-flood` fork, shared-act qualification, and mobile source tabs;
- `/character/aphrodite` keeps its current behaviour and loses no state;
- `/odyssey` remains unchanged and does not inherit an intrusive compare UI.

With the deferred milestones (M15.x):

- `/character/aphrodite` with focused topic;
- `/areas` and one affected place/city;
- `/tellers` and all seven generated teller pages.

### Visual QA

- type glows match existing tokens with compare on/off;
- source traces are readable across every star type color;
- no label collision regression;
- Knot drawer at narrow and wide widths;
- forked story rail with two and three stances;
- internal split state;
- long citations wrap safely;
- focus, hover, and reduced-motion states.

### Full milestone gate

```text
pnpm lint
pnpm build
pnpm validate-data
pnpm validate-layout
pnpm validate-ephemeris
```

Plus manual UX review of desktop, mobile, keyboard, screen reader labels, reduced motion, and WebGL performance.

---

## 14. Milestones

### Scope of the M14 acceptance gate

Read as one milestone, the programme below is closer to a product: schema, validator, generated index, store, URL state, an instanced Galaxy layer, Poets, the Spindle, story forks, Lands, lineages, eight static teller pages, and a test harness. Against this project's delivery rhythm that is several milestones' worth of work carrying a single name.

M14 therefore ships **three**: the audit and index (M14.0), pair state and controls (M14.1), and exactly one vertical slice that proves the idea in reading form (M14.2, Myths and Story Theatre). Everything else keeps its §6 specification and follows as M15.x.

The Galaxy trace layer is deliberately not the first slice. It carries the highest risk in the proposal — instanced annotation across 1,487 stars, source identity that cannot lean on colour, accessible equivalents for decorative geometry, a frame budget to defend — while §7 already rules that Knots must not be drawn at galaxy scale, so the sky can carry aggregate traces at best. The reading value of Palimpsest lives in the Forked Act. The sky can wait until the vocabulary is proven there.

### M14.0 — The contradiction audit and index

**Goal:** make comparison structurally possible without changing public UI.

Deliverables:

- `stance` and optional `witnesses` in shared schemas/types;
- `data/disputes.json` schema;
- pilot topic selection locked after corpus review;
- pilot facts split into source-atomic records;
- `build-dispute-index.ts` and deterministic generated index;
- validator upgrades;
- stable `factId` on every compare-ready fact, assigned before any record is split;
- pure comparison classifier with tests, including `outsidePair` detection;
- `isDisputed()` (`src/lib/lens.ts`) and `firstQuarrel()` (`src/features/spotlight/build.ts`) rewritten to consume the stance index instead of counting records that share a topic;
- audit report classifying all current validator topics as:
  - compare-ready candidate;
  - needs atomic split;
  - within-source;
  - duplicate/same-stance only;
  - documentation mismatch;
  - not a genuine conflict.

Exit criteria:

- all existing data remains valid;
- no public factual wording changes without corpus verification;
- pilot index is deterministic;
- legacy topics still render exactly as before, with one intended change: a quarrel beat or dispute badge whose records all carry a single identical source set stops claiming a quarrel (22 characters today);
- no shipped surface derives disagreement from record count alone;
- pilot fact ids survive a re-run of the split unchanged;
- progress is reported in records completed out of 147, never topics out of 12.

### M14.1 — Pair state and global controls

**Goal:** introduce a reliable, shareable two-teller mode.

Deliverables:

- `compareWith` and `focusedTopic` store state;
- URL hydration and synchronization;
- progressive compare UI in Atlas Settings;
- paired-lens AtlasBar chip;
- swap, follow-one, and clear actions;
- common `KnotBadge`, preview, and drawer shell;
- silence/shared/split vocabulary locked in UI copy.

Exit criteria:

- direct URLs reproduce state;
- normal consensus and single-lens behavior are unchanged;
- compare state survives client navigation within the session;
- no route becomes dynamic solely because of query parameters.

### M14.2 — Myths, Story Theatre, and Forked Acts

**Goal:** turn source disagreement into a readable narrative form. This is the single vertical slice inside the M14 gate — the surface where comparison earns its keep.

Deliverables:

- paired traces on Spindle nodes;
- compare status in story shelf cards;
- story-page source-pair composition;
- Forked Act component and branching spine;
- shared/single/split/internal block types;
- deep links to focused story topics;
- reduced-motion and mobile source-tab versions.

Exit criteria:

- pilot story topics render from the same authoritative chapter data;
- identical prose is not duplicated;
- a silent source is never presented as contradicting;
- a shared telling is never announced while a source outside the pair attests a different stance — `flood-landing` under Apollodorus ↔ Ovid is the acceptance case;
- story pages remain statically generated and SEO-readable.

### Deferred beyond the M14 gate

The three milestones above are the acceptance gate. The surfaces below keep their §6 specification and their exit criteria unchanged, and ship once the comparison vocabulary has survived contact with real readers. They are numbered M15.x so that “M14 is complete” stays unambiguous.

### M15.0 — Galaxy and character Poets

**Goal:** make genealogy differences visible without compromising the cosmos layout.

Deliverables:

- instanced star trace layer;
- compare-aware active relation lines;
- hover-card difference summary;
- Knot interaction from star and relation;
- paired Poets prose;
- compare-aware codex seal and bonds;
- responsive/mobile variants;
- performance profiling and accessibility labels.

Exit criteria:

- all pilot genealogy topics work end to end;
- star type glow/pulse/size remain unchanged;
- no layout recalculation occurs on lens changes;
- compare mode meets the 60fps target on the agreed test devices.

### M15.1 — Lands and city traditions

**Goal:** show where local traditions differ without treating map reference data as mythology.

Deliverables:

- compare traces in place/city panels;
- lineage branch comparison;
- sourced residence comparison language;
- Knot consequences linking story, character, and geography;
- at least two corpus-verified pilot geography/local-tradition topics.

Exit criteria:

- physical markers and basemap geometry never disappear under a source lens;
- local claims remain separately attributed;
- city sky positions and membership remain stable;
- lineage comparison supports plain-name rulers.

### M15.2 — The Tellers observatory

**Goal:** make the source authors themselves explorable without creating a fourth main door.

Deliverables:

- `/tellers` index;
- seven static `/teller/[id]` pages;
- work/edition metadata from the corpus manifest;
- curated signature tellings and Knots;
- coverage and silence sections;
- comparison launcher;
- optional curated passage expansion for the pilot set.

Exit criteria:

- every figure/claim count is labeled as atlas coverage;
- compilation/pseudonymous caveats remain visible;
- no source is ranked or described as more truthful;
- all displayed passages carry edition, language, license, and citation metadata.

### M15.3 — Expansion and polish

**Goal:** expand only after the pilot proves the model and interaction.

Deliverables:

- migrate the next small, reviewed topic batches;
- add compare entry points to Proem and Ephemeris;
- finish keyboard/screen-reader pass;
- visual density tuning from manual review;
- update changelog and `docs/PLAN.md` only when the milestone is accepted;
- document a repeatable topic-promotion workflow.

Exit criteria:

- at least 30 high-value topics are compare-ready across all supported surfaces;
- no unresolved pilot data debt;
- generated-index and bundle budgets remain within targets;
- all full milestone gates are green.

---

---

## 15. Acceptance criteria

Palimpsest M14 — the gate of M14.0, M14.1, and M14.2 — is complete when:

1. A visitor can select exactly two concrete source lenses and swap or exit them.
2. The comparison is shareable through URL state.
3. Myths indicates which stories are shared or source-specific.
4. Story Theatre renders source-atomic Forked Acts for compare-ready topics, and identical prose is never duplicated.
5. Every public Knot has at least two machine-readable stances and verified citations.
6. Source silence is never described as denial.
7. A shared telling is never announced while a source outside the pair attests a different stance.
8. A single source can preserve multiple stances without data loss.
9. Every compare-ready fact carries a stable `factId`, and no stored reference depends on array position.
10. No shipped surface — dispute badge, Proem quarrel, codex seal — derives disagreement from record count alone.
11. Legacy topics continue using the existing consensus dispute treatment until promoted.
12. All 147 pilot fact records are stance-assigned, split where combined, and re-cited.
13. Galaxy, character Poets, Lands, and `/tellers` are untouched beyond the paired-lens chip in global chrome, and lose no state when comparison is active.
14. No new source lens is required to declare M14 complete.
15. The 60fps target, reduced-motion experience, keyboard flow, and mobile reading mode pass manual review.
16. All lint, build, data, layout, and ephemeris gates are green.

Criteria for the deferred surfaces — Galaxy trace states, paired Poets prose, Lands and lineage comparison, and the teller observatory — move with their milestones into the M15.x gates.

---

## 16. Non-goals

- No automated claim extraction from primary texts.
- No AI-generated stance summaries written directly into the data layer.
- No “correct version,” “most accepted,” vote, or confidence score.
- No arbitrary comparison of more than two tellers in the first release.
- No `consensus` versus author comparison.
- No full-text digital library or corpus search exposed publicly in M14.
- No new database or backend requirement.
- No rearranging stars per source.
- No source-driven star glow, pulse, size, or type changes.
- No filtering out real map geography because a mythic source is silent.
- No forced rewrite of every legacy topic before the pilot ships.
- No automatic promotion of plain names to character nodes.
- No new source authors inside the M14 acceptance gate.

---

## 17. Risks and guards

| Risk | Guard |
|---|---|
| A topic groups several records but not genuinely incompatible stances | M14.0 audit; `legacy` versus `compare-ready`; stance validation |
| Source silence is mistaken for disagreement | fixed vocabulary; classifier separates presence from agreement |
| False binary framing | stance arrays support 2+ answers and internal splits |
| Author-level lens hides work-level differences | witnesses retain citation and optional corpus entry; one source may occupy multiple stances |
| Compare UI overwhelms the galaxy | traces only at aggregate scale; knots appear on demand; instanced rendering |
| Type color semantics are diluted | comparison never touches star core glow/pulse/size/layout |
| Story pages duplicate large amounts of prose | shared passages render once; fork only at changed beats |
| Citation strings are too coarse | optional per-source witnesses; no unsafe automatic splitting |
| Generated index becomes a second truth source | refs/masks only; prose stays in canonical data files |
| Editorial migration balloons to all 163 topics | 12-topic pilot, then small reviewed batches |
| New source expansion multiplies migration work | explicitly out of the M14 completion gate |
| Query state makes SSG routes dynamic | client hydration over pre-rendered union data |
| Original-text display creates licensing issues | corpus manifest license gate; curated minimal excerpts only |
| Coverage counts imply authority | label as “included in this atlas”; never rank sources |
| Mobile becomes an unreadable split screen | sticky source tabs and stacked fork cards |
| Two selected tellers agree while a third differs, and the pair reads as consensus | classifier returns `outsidePair`; shared-telling labels are forbidden while it is non-empty; the shared act names the dissenting teller and links the Knot |
| Migration is sized in topics and overruns | debt is measured in records — 147 in the pilot, 1,035 across all disputed topics; milestones and progress reports quote records |
| Stored fact references break the moment P3 splits a record | stable `factId` assigned in M14.0 before any split; array position kept only as a build-time locator |
| The shipped count-based heuristic keeps reading agreement as quarrel | M14.0 rewrites `isDisputed()` and `firstQuarrel()` onto the stance index; the validator forbids count-derived disputes |
| M14 grows into a product-sized release | acceptance gate is M14.0–M14.2 only; Galaxy, Poets, Lands, and Tellers keep their §6 specification and ship as M15.x |

---

## 18. Future unlocks — not part of M14

Once comparison is stable, it becomes the correct foundation for new source lenses. Recommended order from the current source review:

1. **Homeric Hymns** — fills archaic narrative gaps around Demeter, Hermes, Apollo, and Dionysus.
2. **Euripides** — fills the major classical-tragic gap and exposes versions that later became culturally dominant.
3. **Pindar** or **Proclus' Epic Cycle summaries** — moral revision and Trojan-cycle boundaries respectively.

Each new lens must be its own verified milestone with:

- corpus availability and licensing;
- `SourceId` contract migration;
- source metadata and caveats;
- small character/relation/story/place batches;
- topic-by-topic stance work;
- all validators and layout gates;
- no inferred backfill from later compilers.

Other later possibilities:

- work-level comparison inside one author (`Iliad` versus `Odyssey`, or two Hesiodic works);
- passage-aligned original-language reading rooms;
- curated classroom routes through a contradiction set;
- exportable comparison cards with immutable citations;
- a public “map of disagreements” showing how topics cluster by saga, dynasty, and region;
- scholarly annotations, only after an explicit editorial and moderation model exists.

---

## 19. Recommended decisions to lock before implementation

| Decision | Recommendation |
|---|---|
| Milestone | M14, gated at M14.0–M14.2 |
| Codename | Palimpsest — internal and changelog only; never required visitor vocabulary |
| Public control label | Compare the Tellers |
| Maximum active sources | 2 |
| Consensus as a compare side | Not allowed |
| Shared telling while an outside teller differs | qualified label required; a plain “shared” badge is forbidden |
| Main-nav placement | No fourth door; satellite entry from lens settings |
| Public source directory | `/tellers` + `/teller/[id]` |
| Topic model | existing `topic` + additive local `stance` |
| Evidence model | existing `sources`/`citation` + optional per-source `witnesses` |
| Metadata | one lean `data/disputes.json`; no duplicated prose |
| Runtime index | deterministic generated refs/masks under `data/generated/` |
| Galaxy rendering | one instanced trace layer; no second Canvas — deferred to M15.0 |
| Star semantics | type glow remains untouched |
| Story behavior | fork only disputed acts; shared prose renders once |
| “What changes” copy | curated in dispute metadata by default; generation reserved for the affected-surfaces list |
| Geography behavior | physical map remains stable; only myth claims compare |
| First vertical slice | Story Theatre; Galaxy traces and Poets follow as M15.0 |
| Fact identity | stable `factId` on compare-ready facts, assigned in M14.0 before any split |
| Shipped dispute heuristic | replaced by the stance index in M14.0 |
| Initial migration | 12 corpus-reverified pilot topics = 147 fact records |
| New source authors | deferred beyond M14 acceptance |

---

## 20. Open review questions

1. Is **Palimpsest** only an internal codename, or should it appear in the public editorial intro? *Recommendation: internal and changelog only. §4 already rules it out as required visitor vocabulary, and the control should keep saying plainly what it does.*
2. Should the paired-lens chip live permanently in AtlasBar while active, or collapse to a small knot glyph on mobile?
3. Does the full Knot open as a global right drawer everywhere, or become an in-page section on story and teller routes?
4. Which two local-tradition/geography topics best represent Lands once M15.1 is scheduled?
5. Should original-text excerpts ship with M15.2, or wait until the comparison interaction has passed UX review?
6. Should “What changes” remain entirely generated from affected refs, or allow a short sourced editorial consequence in dispute metadata? *Recommendation: curated and sourced by default, for the duplication reason set out in §6.5.*
7. Which devices form the formal 60fps acceptance set, and does that set bind only once M15.0 puts traces in the sky?

Resolved during review: `FactRef` does not wait for a churn measurement. P3 guarantees index churn, so compare-ready facts receive a stable `factId` in M14.0 (§8.3).

---

## 21. Definition of done for the planning phase

Before coding begins:

- this direction is accepted or amended;
- the M14 decision row and milestones are added to `docs/PLAN.md`, with M15.x recorded as the deferred continuation;
- public naming is locked;
- the `src/features/lens/` directory-map discrepancy is resolved one way or the other (§10.1);
- the 12 pilot topics — 147 fact records — are corpus-reverified;
- a data spike proves `topic + stance + witnesses + factId` can express:
  - a binary cross-author disagreement;
  - three or more stances;
  - two works by the same source disagreeing;
  - a shared stance with multiple witnesses;
  - a stance the selected pair shares while a third source differs;
  - honest source silence;
- one Story Fork, including its shared-act qualification, is prototyped before bulk migration;
- the performance and device acceptance set is agreed.

Moving with M15.0: the visual spike proving source traces can coexist with all eight type glows, and the first Galaxy Knot prototype.

### Spike outcome — 2026-08-30

The data spike ran on two topics (12 records) before any bulk migration, and the model held.

| Shape the model must express | Covered by |
|---|---|
| binary cross-author disagreement | `flood-landing` — Parnassus vs Etna |
| a shared stance with several witnesses | `parnassus` (Apollodorus + Ovid); `cast-by-zeus` (Homer + Apollodorus) |
| one source disagreeing with itself | `hephaestus-fall-from-olympus` — Homer casts him out by Hera's hand at *Il.* 18.394–405 and by Zeus' at *Il.* 1.590–594 |
| a stance the pair shares while a third teller differs | Apollodorus ↔ Ovid on `flood-landing`, with Hyginus on Etna |
| honest source silence | Hesiod on both topics — derived, never stored |
| three or more stances | **fixture only.** No pilot topic in this spike carries three; `first-beings-cosmogony` does, but at 34 records it was too large for the spike. The classifier is tested against a synthetic three-stance case; the shape is unproven on real data. |

Findings that change the work ahead:

- **Splitting is rarer than feared, `witnesses` more useful than expected.** Of the 12 records only one needed a P3 split (the `great-flood` chapter that put Parnassus and Etna in a single paragraph, now two chapters). The other combined records — sources `[homer, apollodorus]`, `[apollodorus, ovid]` — attest the *same* stance and only needed per-source `witnesses`. If that ratio holds, the 147-record pilot is far less invasive than a 1-in-3 split rate would have implied.
- **Combined citations really are too coarse.** The Hyginus flood record cites `Fabulae 152A, 153`, but 152A gives only the flood's *cause*; the mountain is in 153 alone. The stance witness had to cite `Fabulae 153` while the fact keeps the wider citation — exactly the case §8.1 introduced `witnesses` for.
- **Hyginus has no original-language edition in the corpus.** `research/corpus/manifest.json` pins Latin or Greek for six lenses but only English for the *Fabulae*. Four pilot topics lean on Hyginus, so hard rule 5's original-language check cannot be met for them; the plan should say so rather than let the gap pass silently.
- **`node --test` through `tsx` is enough.** `pnpm test:palimpsest` runs the classifier suite with no new dependency — the repository's first tests.

Only then should M14.0 move from proposal to active roadmap work.
