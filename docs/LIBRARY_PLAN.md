# The Library — the fifth door (M15 Plan)

> **Status:** BUILT 2026-11-06, all eight milestones (§11), on the user's go at each step; the decisions in §13 stay marked as proposed until the user's look. M15.0's mockups and the licence check came first, M15.1 (the citation spine) is done, and M15.2–M15.7 (the texts, the margin, the Quarrels, the door, *First, Chaos* and the bridges) are built. The measurements in §2 come from throwaway scripts run against `data/` and the pinned corpus; none of them is committed.
> **Door:** `LIBRARY` in the main nav, route **`/library`**. A teller at `/library/[author]`, a work at `/library/[author]/[work]`, one book of it at `/library/[author]/[work]/[unit]`, the quarrels at `/library/quarrels` and `/library/quarrels/[topic]`. The flagship reading, *First, Chaos*, is at **`/theogony`**.
> **Scope:** make the seven tellers readable. The texts the atlas cites, in the original and in English; every citation in the atlas a way into its passage, and every passage a way back out to the stars, stories and quarrels that rest on it.
> **Does not touch:** the meaning of any fact. The Library reads `data/` and adds no mythology. The one data repair it asks for (Ovid's line numbers, §4.3) moves loci, never claims.

---

## 1. Why this door

Four doors answer four questions: the Galaxy *who*, Lands *where*, Myths *when*, Art *how did people see it*. The fifth answers the question under all of them: *who told it?* Every fact in the atlas carries its tellers, and 10,887 citations name the passage that proves one. Apart from the Nostos epigraphs, a visitor cannot read a single one of those passages.

The door's metaphor is already in the sources:

- One of the seven tellers wrote a book called *the Library*: Apollodorus' *Bibliotheca* (Βιβλιοθήκη), the work the atlas cites most (4,200 resolved loci, against 2,465 for the *Iliad*).
- Another, Apollonius, was librarian at Alexandria (the list of librarians in P.Oxy. 1241).
- The *Theogony* opens with the Muses telling Hesiod: "we know how to speak many false things as though they were true; but we know, when we will, to utter true things" (*Theog.* 27–28, Evelyn-White). That is the atlas's thesis — the tellers disagree, and the disagreement is the subject — in the mouth of the Muses. It is the door's epigraph and the Quarrels' motto.
- Ovid ends the *Metamorphoses* promising that his better part will be borne above the stars and that he will be read on the people's lips (*ore legar populi*, *Met.* 15.875–879). The galaxy is the stars; the Library is where he is read.

### Non-goals

- **No library to walk through.** The door is a 2D shelf and the reading room is typography: no 3D hall of scrolls, no page curl, no parchment texture.
- **No lens selector.** Every page in the Library is already one teller, and the Quarrels show all of them at once. The lens keeps its one home on the Poets tab.
- **No new mythology.** Nothing here writes a fact. A passage is displayed as text and never becomes data on its own (hard rule 5: corpus hits are evidence, not data).
- **No full-text search in v1.** ⌘K learns works, books, quarrels and citations (type `Il. 5.370` and land on the line). Searching inside 8.4 MB of text needs its own index and its own budget, later.
- **No token links in Greek or Latin.** Inflection defeats the name index (Ἀχιλῆος is not Ἀχιλλεύς). The margin covers the original column; lemma-aware linking is later.
- **No commentary.** The translators' notes stay out, as the research normalizer already drops them (Frazer's would be a book of their own). The atlas's own facts in the margin are the only gloss.
- **No new translation.** The English is a century old. The original beside it is the correction, not a modern paraphrase.

---

## 2. What we have (measured 2026-11-05)

| Measure | Value |
|---|---|
| Pinned corpus | 20 editions of 11 works by the 7 tellers; the original language for every work but Hyginus (English only) |
| Text, both languages | 8.4 MB. Largest books: Pausanias 8 at 359 KB, *Argonautica* 4 at 171 KB, *Bibliotheca* 3 at 149 KB |
| Licences | 17 Perseus files, CC BY-SA 4.0, the licence of `data/LICENSE`. 3 ToposText pages, CC BY-NC 4.0: Seaton's *Argonautica* (1912, a public-domain text) and Mary Grant's *Fabulae* and *Astronomica* Book 2 (1960; registered, and no renewal found, so public domain in the US since 1989 — §4.4) |
| Citations in `data/` | 10,887 strings: characters 8,390, stories 1,666, lineages 380, geo 239, reference 62, relations 62, chronology 38, Nostos 21, sky 19, Patterns 10 |
| Resolved by a prototype resolver | 95.3% of strings fully, 95.9% of 17,220 loci. The rest: works outside the corpus (Ovid's *Fasti*, the Homeric Hymns, the Parian Marble, Eusebius), free-text chronology notes, and about 180 loci past the end of their book |
| Spellings of one work | Apollodorus' *Library* appears as "Bibliotheca", "Apollod.", "Apollodorus, Bibliotheca" and "Library"; story attestations call it "The Library" (98), "Epitome" (54) and "Bibliotheca" (4) |
| Story attestations | 625 across 181 stories; `work` is free text and the locus bare ("17–22", "13.750–14.74") |
| Ovid's two lineations | Perseus' English *Metamorphoses* numbers Brookes More's own verse lines (his 1.120 is the Latin 1.89), and the research normalizer kept More's numbers. Of 555 distinct figure–locus pairs, a name test fits 198 only to Magnus' Latin lines, 71 only to More's, 162 to both and 109 to neither; 140 Ovid loci run past the end of the Latin book |
| Relations | 4,277 edges. 3,643 cite inside their `note` prose; 62 carry a `citation` field, which `relationSchema` drops at load |
| The *Theogony* | 242 figures have Hesiod-sourced facts citing it; together they cover 966 of its 1,022 lines (94.5%) |
| Names | 1,313 indexed names, 189 of them with two or more bearers (Agenor 7, Clytius 6). The keys are `name` and `romanName` only: no aliases, no Greek script |
| Quarrels | 192 in `docs/CONTRADICTIONS.md`, each with an Author / Claim / Citation table and a significance note. The validator reads them; no page does. The only side-by-side in the app is the Proem's quarrel beat, without citations |
| Citation UI | No shared primitive: four private `Footnote` components (CharacterTheatre, StoryTheatre, CityTheatre, WorkPlate), and the "Teller · Teller — citation" string rebuilt in six places |
| Galaxy | No way to light a set of stars. The Proem filters lines by `spotlightRelationIds`; stars outside the lens drop to 20% (`attested`); a lens switch snaps the lines |
| Type | Cinzel and Cormorant Garamond load Latin subsets only; Greek falls back to system fonts |
| SEO | No sitemap |

---

## 3. What every shape means — the contract

Same discipline as hard rule 6: no position is decoration.

**The shelf (the door):**

| Shape | Meaning | Source in the data |
|---|---|---|
| **Spine** | One work, once | the works registry (§4.2) |
| **Position (→)** | When the work was composed, oldest at the left | `composed` in the registry |
| **Whisker** | How uncertain that date is | `composed.from`–`to` |
| **Spine height** | The work's length, in lines or words | the baked texts |
| **Gilt band** | The share of the work some atlas fact cites | the reverse index (§4.5) |
| **The empty shelf** | The four centuries between Hesiod and Apollonius, from which the atlas carries no teller | fixed; its label says why (below) |
| **Thread** | One saga, running along the shelf through the works that tell its stories, in time order | story `attestations`, `SAGA_ORDER`, `SAGA_ACCENT` |
| **Knot** | A saga told in a work, larger with more of its stories | attestations per saga and work |
| **⚖ seal** | The quarrels this work takes a side in | `data/quarrels.json` (§4.7) |

**The reading room:**

| Shape | Meaning | Source in the data |
|---|---|---|
| **Line number** | The original's lineation, the one the atlas cites | the edition |
| **Aligned block** | An English card beside the original lines it translates | Perseus card numbers (§4.4) |
| **Gold underline** | A stretch some atlas fact cites | the reverse index |
| **Linked name** | A figure the passage names, linked only when certain | §4.6 |
| **Margin entry** | A fact, story, quarrel or work of art resting on the block being read | the reverse index |

Rules that keep it honest:

- No date on the shelf is more precise than its label. Homer's and Hyginus' dates are disputed; the whisker shows it, and where the two earliest ranges overlap neither is called first.
- The empty shelf states what the atlas lacks, never that nobody told myths then. Its label: the lyric poets and the tragedians reach the atlas only inside the later handbooks, where Apollodorus gives Euripides' versions by name (*Bibl.* 2.1.4, 3.6.8, 3.7.7, 3.9.2).
- A thread says that these works tell this saga, nothing more. It never claims that one teller read another.
- A gilt band measures the atlas's attention, not the work's importance.

---

## 4. Data layer

### 4.1 Sources of truth

| File | Authored? | Purpose |
|---|---|---|
| `research/corpus/manifest.json` | exists | The pinned editions and their hashes; unchanged |
| `data/library/works.json` | yes, small | The works registry (§4.2) |
| `data/library/aliases/<edition>.json` | yes, small | Each translation's own names (§4.6) |
| `data/library/readings/theogony.json` | yes | The beats of *First, Chaos* (§8) |
| `data/quarrels.json` | yes, migrated | The quarrel catalogue, moved out of `docs/` (§4.7) |
| `data/generated/library/<work>.json` | generated by `pnpm bake-library-texts` from the synced corpus, committed | The texts, aligned (§4.4) |
| `data/generated/library-citations.json` | generated by `pnpm bake-library`, offline, committed | Every citation in `data/`, resolved |
| `public/library/` | generated, gitignored | Margin files and the shelf's threads, fetched by the pages |

The texts are committed because `pnpm build` must stay offline and work from a clean tree (docs/HOSTING.md), while `research/corpus/raw/` is gitignored and needs the network. `bake-library-texts` runs only when the manifest changes, and its output is about 9 MB of JSON, once (§12). It is CC BY-SA 4.0 like the rest of `data/`, and `data/generated/library/README.md` carries every edition's credit.

### 4.2 The works registry

```ts
type WorkId =
  | 'iliad' | 'odyssey' | 'theogony' | 'works-and-days' | 'bibliotheca' | 'epitome'
  | 'argonautica' | 'metamorphoses' | 'fabulae' | 'astronomica' | 'description-of-greece';

interface LibraryWork {
  id: WorkId;
  author: SourceId;            // the teller
  title: string;               // "Iliad"
  greekTitle?: string;         // "Ἰλιάς"
  composed: { from: number; to: number; label: string }; // signed years; the label is what shows
  structure: 'books-of-lines' | 'lines' | 'sections' | 'tales';
  units: 'books' | 'whole';    // a book per page, or the whole work on one page
  aliases: string[];           // every spelling the data uses
  original?: Edition;          // absent for Hyginus
  translation: Edition;
  display: 'full' | 'excerpt'; // the licence gate (§4.4)
}

interface Edition {
  corpusId: string;            // a manifest entry
  credit: string;              // "A. T. Murray, 1924–1925; Perseus Digital Library, CC BY-SA 4.0"
  licence: string;
}
```

A page holds one book: 24 each for Homer, 15 for Ovid, 4 for Apollonius, 3 for the *Bibliotheca*, 7 for the *Epitome* and 10 for Pausanias. The *Theogony*, *Works and Days*, the *Fabulae* and the *Astronomica* are one page each. That makes 91 reading pages. Pausanias by book keeps each region of Greece on one page, which is also how Lands will want to link it.

### 4.3 The citation resolver

One pure function, shared by the bakes, the gate, ⌘K and the UI:

```ts
type Locus = { book?: number; line?: number; section?: string; tale?: number | 'preface' };

type CiteRef =
  | { kind: 'passage'; work: WorkId; from: Locus; to?: Locus }
  | { kind: 'external'; label: string } // Ovid's Fasti, the Homeric Hymns, the Parian Marble …
  | { kind: 'note'; text: string };     // "generational (one gen before Troy)"

function resolveCitation(raw: string, context: { sources?: SourceId[]; work?: string }): CiteRef[];
```

1. Split on `;`, then on a comma where a new work begins ("Bibliotheca 1.3.4, Epitome 7.18"). A bare locus inherits the work before it, then the attestation's `work`, then the teller's only work.
2. Work names resolve through the registry's `aliases`. A name the registry does not know is `external` only if it is on the registry's allowlist; a new unknown name fails the gate.
3. Loci are checked against the baked texts. A line past the end of its book, or a section that does not exist, fails the gate.
4. **Ovid is cited in Magnus' Latin lines.** A one-time repair, `pnpm library:ovid-lineation`, proposes for every Ovid locus the Latin lines it means, from the concordance in the English file (each card opens at a Latin line and holds More's lines), checked by the name test. The user reviews the batch; afterwards the gate rejects a More-numbered locus. This is the only data edit M15 makes.

The resolver never rewrites a citation string. Everything else is resolution at read time.

### 4.4 The texts

The research normalizer (`scripts/lib/corpus.ts`) is built for search, not reading: it keeps the Greek *Iliad* and the Latin *Metamorphoses* as one passage per book, and numbers Ovid's English by More's lines. The Library gets its own parser over the same pinned raw files:

- **Verse:** the original line by line, the English by Perseus card: a `div` in Homer and Ovid, a `milestone` in Hesiod. A card opens at the original line it translates from (`n`), so it aligns with the original lines from its `n` to the next card's `n − 1`. More's Ovid also numbers its own lines inside each card; the parser keeps the card's Latin `n` and ignores them.
- **Prose:** section by section, `1.3.1` beside `1.3.1`.
- **Hyginus:** English only; the corpus has no Latin.
- **The licence gate.** The 17 Perseus files show in full, with credit.
- **Seaton's *Argonautica*** is public domain everywhere (Seaton died in 1915), but our copy comes from a CC BY-NC page. The same 1912 text is re-sourced from Project Gutenberg #13977, which keeps the Loeb's summaries with their line ranges, the notes and the index (#830 is Seaton too, without them). The Loeb printed no line numbers beside the English, only beside the Greek, so the English carries no anchors of its own. Matching its paragraphs to the pinned ToposText ones carries ToposText's anchors over; they are facts about where a paragraph starts, not ToposText's expression. Perseus has no English *Argonautica* (its folder holds only Mooney's Greek).
- **Grant's Hyginus** was registered on 30 December 1960 (A489429, University of Kansas Press). No renewal turns up in the Copyright Office's online records, which include 1988, or in NYPL's dataset of renewals from 1950 to 1991. A renewal was due in 1988, so the translation has very likely been public domain in the US since 1 January 1989. HathiTrust has not reviewed it (`ic`, its default for books after 1930). Theoi and ToposText already show it in full. Grant died in 1987, so where the term is life plus 70 years it may stay protected until 2057. Showing it in full as US public domain, with that note, or keeping `display: 'excerpt'` is decision L10.

(Licence findings checked 2026-11-05 against the Catalog of Copyright Entries, the Copyright Office's public records, NYPL's `cce-renewals`, HathiTrust, Project Gutenberg and the PerseusDL repository.)

```ts
interface LibraryText {
  work: WorkId;
  signature: string;           // hash of the manifest entries it was baked from
  units: {
    id: string;                // "5", or "whole"
    blocks: {
      orig?: { from: number; to: number; lines: string[] } | { section: string; text: string };
      trans: { from: number | string; to?: number | string; text: string };
    }[];
  }[];
}
```

### 4.5 The reverse index: the margin

Every citation in `data/` turns around into passage → what rests on it: character paragraphs and residences, relation edges, story summaries, chapters and attestations, reigns, places, and the rest (constellation testimonia, Nostos epigraphs, Pattern stops), which count without a section of their own. It is built at bake time from `data/` (`src/features/library/sites.ts`, `margins.ts`), never committed, and cut per reading page into gitignored `public/atlas/library/`: an index, `<work>/<unit>.json`, with the facts on each block, and the notes in chunks, `<unit>-<n>.json`. An entry carries its teller or tellers, its figure or story, and its ⚖ topic when it has one. A citation that covers more than six blocks, or a whole book, belongs to the page's *across* list rather than to each block.

Relations cite in prose: 3,643 notes carry a citation and only 62 edges a field. The resolver reads citations out of notes for the index and marks them *from a note*. `relationSchema` gains `citation`, so the 62 stop vanishing at load. Lifting note citations into fields is a later, reviewed data batch, not M15.

### 4.6 Names in the texts

The English column is linked with the existing engine (`parseLinkedProse`, `resolveCharacterId`), with two additions:

- **Scope from citations.** A passage's scope is the set of figures whose facts cite it (§4.5). A name links to its one bearer in scope. 189 of 1,313 names have two or more bearers, and one block can hold two of them: Glaucus of Lycia's speech to Diomedes names his great-grandfather Glaucus of Corinth, "and Glaucus begat peerless Bellerophon" (*Il.* 6.154–155). When both are in scope, neither links.
- **Outside the scope, only gods.** A name with no bearer in scope links only if its one bearer is divine (`primordial`, `titan`, `olympian` or `god`). The engine's rule for stories, which links any name with a single bearer, is too loose for the ancient texts. Run on *Iliad* 5.280–459 for the mockup, it made three wrong links in 180 lines: Achaea the land to the figure Achaea, the war-goddess Enyo to Enyo of the Graeae, and Troy's citadel Pergamus to Neoptolemus' son. The tighter rule leaves those plain. It costs five names it would have linked rightly — Tydeus, Capaneus, Aeneas, Aloeus and Amphitryon — which the margin still lists when their facts cite the block.
- **Translation aliases.** Each edition speaks its own names. More's Ovid says Jove; Frazer's Apollodorus begins "Sky was the first who ruled over the whole world" (*Bibl.* 1.1.1). `data/library/aliases.json` maps such forms to ids, edition by edition, and is reviewed by hand. A capitalised common noun ("Sky", "Earth") links only when its figure is in scope.

An unlinked name is always acceptable; a wrong link is a defect (hard rule 7).

A **citation audit** comes with this: a fact that cites a passage which never names its figure, under any alias, goes on a warning list for review. It is a list, never a gate, because some facts cite a passage to say a figure is *not* there: `sterope-pleiad` cites *Theog.* 140 to part her from Steropes the Cyclops.

### 4.7 The Quarrels catalogue

`docs/CONTRADICTIONS.md` already holds 192 quarrels, each with a title ("Aphrodite's birth"), a topic id, its characters, an Author / Claim / Citation table, a significance note and a verification line. Once a page shows them they are data, so they move to `data/quarrels.json`:

```ts
interface QuarrelClaim {
  who: string;                 // the catalogue's own words: "Homer", "Pseudo-Apollodorus (Pherecydes)", "Aeolian"
  sources: SourceId[];         // the tellers who carry it; empty only for a claim `outside` the seven
  claim: string;
  citation?: string;
  outside?: true;
}

interface Quarrel {
  topic: string;               // the `topic` the facts carry
  title: string;               // "Aphrodite's birth"
  characters: string[];
  places?: string[];
  strands?: true;              // the claims are strands of tradition, not authors (Smyrna)
  claims: QuarrelClaim[];      // one at least: a teller may report both versions
  significance?: string;
  verification?: string;
}
```

The shape grew from the plan's `{ source, claim, citation }` when the doc was read: its first column is not always one teller. 46 of 524 claims name a teller reporting another, several tellers, or a strand, and one names no teller at all (Nessus' "encyclopedic tradition"), so a claim keeps the doc's words in `who` and its tellers in `sources`.

`docs/CONTRADICTIONS.md` is then generated from it, so the doc stays readable, and the dispute gate in `validate-data` moves onto the JSON. Claim citations go through the resolver like every other.

### 4.8 What reaches the client

- Reading pages are static HTML rendered on the server from the committed bake, the full text in the HTML for readers without JavaScript and for search engines. Hover cards, the margin and a deep link's highlight are small client islands.
- Margins and the shelf's threads are fetched from `public/atlas/library/`, never passed as props. A page fetches its margin index first and its notes chunk by chunk as the reader moves, the chunks either side ahead.
- The new dynamic routes carry `generateStaticParams` and `dynamicParams = false`; links go through `@/components/ui/Link`.
- Budgets: at most 400 KB of text in one reading page (Pausanias 8 is 359 KB) and a margin file at most 30 KB gzipped, both gated by `validate-library`. One file per page would have broken the second: the *Fabulae*'s weighed 117 KB gzipped, so the notes are chunked. The HTML weight is measured at M15.2 and becomes a gate there.

---

## 5. The door: the Shelf

**Desktop.** A long shelf hangs across the nebula, time running left to right: Homer and Hesiod at the left edge, then the empty shelf with its label, then Apollonius, Ovid, and Apollodorus, Hyginus and Pausanias close together at the right. Each spine is lettered in Cinzel, with a gilt band for the share the atlas cites (the *Theogony*'s is nearly full). The sagas run along the shelf as threads in their Spindle colours, knotting at the works that tell them. Hovering a thread lists its stories; hovering a spine lights its threads and lets the rest sink. A teller's name above their works opens `/library/[author]`, and a spine opens the work. Under the shelf wait the Quarrels, under the Muses' line, and *First, Chaos*.

**Opening.** The spines rise in order of composition, once a session; reduced motion shows them standing.

**Phone.** The shelf stands up: time runs down the screen, each work a row with its spine and its threads as colour ticks, the empty shelf a gap with its label.

**A teller** (`/library/[author]`): dates, works and edition credits; what the atlas owes them (facts, figures, stories and quarrels, counted from the index); the figures only they tell of (every fact about them cites this teller alone); the sides they take in the quarrels.

**A work** (`/library/[author]/[work]`): edition and credit; its books, each with a strip showing where the atlas's citations fall; the stories it tells; its quarrels. A one-page work's page is its reading page.

## 6. The reading room

**Desktop, three columns.**

- **Left rail:** the work's books, and the current book's cards or sections with their citation strip.
- **Centre:** aligned blocks, the original and the English side by side, or either alone. Line numbers every five lines in the original's lineation. Cited stretches carry a faint gold underline.
- **Right, the margin:** for the block under the reading line, the figures it names (type glyph, links to the star and the codex), its stories, its ⚖ quarrels, the works on the Loom for those stories, and *N facts rest on these lines*, each with its footnote.

The reading line is the trace CharacterTheatre and StoryTheatre already share (one rAF-throttled scroll listener, the line at 42% of the viewport), lifted into a shared `useReadingTrace` hook.

**Deep links.** Every citation opens `/library/[author]/[work]/[unit]#l370-371`, or `#s1.3.1` in prose: the range glows and settles on the reading line. A shared `<Citation>` primitive in `src/components/ui/` replaces the four private footnotes and the six rebuilt citation strings, and its tooltip gains *Read the passage*.

**Phone.** One column, the language switch in the bar (Greek, English, or both stacked), the margin a bottom sheet at 30% that follows the reading line.

**Type.** A measure of 60–70 characters per column. Greek needs a polytonic face: EB Garamond, which Google Fonts serves with `greek` and `greek-ext` subsets, the Garamond cousin of the body face. Cinzel stays for titles. Gilded corners go only on the fragment-like surfaces (the Muses' epigraph, a quarrel's claims), as the Gilded chrome rule asks.

## 7. The Quarrels

**`/library/quarrels`:** the quarrels (189 once M15.4 merged three written up twice) grouped by saga in Spindle order, with the figures they involve, filterable by teller. Over them, the Muses' line.

**`/library/quarrels/[topic]`:** the title; the claims as columns in their tellers' order of composition; under each claim its passage, in the original and in English, so the quarrel is read in the sources' own words; the significance note; each figure linked to its Poets tab, the one place to read it under a teller's lens. The Proem's quarrel beat links here.

## 8. *First, Chaos*: the Theogony read with the sky

Route **`/theogony`**, a satellite of the Library as `/odyssey` is of Myths. The galaxy is dark. A reading column holds the Greek and Evelyn-White's English, beat by beat, and as the reader scrolls, the figures Hesiod names ignite where they live in the atlas, in the order he sings them: the Muses (1–115); Chaos, Gaia, Tartarus and Eros (116–122); Erebus and Night, Aether and Day (123–125); Sky, the mountains and the Sea (126–132); the Titans, the Cyclopes and the Hundred-Handers (133–153); the castration and what grew from the blood (154–187); Aphrodite from the foam (188–206); and on. Each parent–child line draws in as it is sung.

At the end comes *Now as Homer tells it*: the lens turns to Homer, the stars he never names sink to 20%, and Aphrodite's line leaves Uranus for Zeus and Dione (*Il.* 5.370–371). In the data these are `aphrodite-parent-uranus` (Hesiod) against `aphrodite-parent-zeus` and `aphrodite-parent-dione` (Homer, Apollodorus): the first quarrel, seen.

**Beats** (`data/library/readings/theogony.json`): `{ lines: '116-122', ignite: ['chaos', 'gaia', 'tartarus', 'eros'], focus?: 'gaia', relations?: string[] }`. `pnpm library:theogony-candidates` proposes them from the data (242 figures, 94.5% of the lines), but a first-line rule misplaces figures whose facts cite several stretches: Aphrodite carries a fact citing *Theogony* 116–122 and 201–202, for Eros who attends her, so the rule would light her with Chaos. Citations alone also mislead: 13 figures carry a "not to be confused with…" note that cites the *Theogony*, and for five of them — Sterope the Pleiad, Tisiphone daughter of Alcmaeon, Melia of Thebes, Glauce of Corinth and Cerberus of Same — that note is their only tie to the poem, so a citation-only rule lit them among the Cyclopes, the Erinyes and the Nereids. The candidate script skips such notes, and the beats are authored. In the mockup the first seven beats are written by hand and the rest come from each figure's narrowest citation: 232 figures ignite in 18 beats. Gate: every ignited figure has a Hesiod-sourced fact citing lines that overlap its beat, and every drawn relation is Hesiod-sourced.

**Engineering.**

- The galaxy gains a **lit set**: a store field read by `StarsDriver` beside `attested` (unlit stars near dark, a lit star rising over about 600 ms), with `RelationLines` drawing only the listed relations — the Proem's `spotlightRelationIds` path, generalised.
- Lines **crossfade** on a lens change instead of snapping. The finale needs it, and the main galaxy gains the animated re-routing the M2 roadmap promised.
- The camera takes each beat's focus through `selectAt`. Reduced motion keeps the overview camera, lights stars at once, and leaves the column to carry the reading.
- `/theogony` mounts `GalaxyView` in its own mode, as the city sky does, and never touches the home galaxy's state. Escape returns to the *Theogony*'s reading page.
- No sound in v1; the Nostos engine is there if it is wanted later.

## 9. Bridges

- Every footnote in the atlas: *Read the passage*.
- A story's *Told in*: each attestation opens its book.
- A constellation's testimonia open their *Astronomica* chapters; the Nostos epigraphs open their lines.
- The Proem's quarrel beat opens its quarrel.
- The Poets tab: *Earliest of our tellers*, the oldest work among a figure's citations. It is worded as the oldest of the seven, never as the myth's origin, and names both when Homer's and Hesiod's dates overlap.
- ⌘K: works, books and quarrels, and a typed citation (`Il. 5.370`, `Met. 1.89`) offers its passage.
- Open Graph images for `/library`, each work and each quarrel. `src/app/sitemap.ts` (`force-static`): the atlas has no sitemap yet, and about 300 new pages of text are the reason to add one.

## 10. Gates and budgets

`pnpm validate-library`:

- Every citation in `data/` resolves to a passage that exists, or is an allowlisted external work or a note. Ovid loci are in Latin lines.
- Every attestation `work` resolves through the registry or the allowlist.
- The committed texts match the manifest they were baked from (signature). Every page is within budget, and every edition shown carries a credit.
- Every margin file is within its budget, and every block with notes is in the chunk its index names.
- Links: every translator's form in `aliases.json` names a figure of the atlas, in a pinned edition. (Planned: for each edition, a fixed seeded sample of linked names, each one in scope or a unique bearer. Not built at M15.3, because the linker makes the rule hold by construction — it marks every non-divine name scoped — so a sample would only run the same code again.)
- The anchoring rule of *First, Chaos* (§8). Built at M15.6 as check 8, on the rule `scripts/lib/library-readings.ts` shares with `pnpm library:theogony-candidates`.
- Quarrels: the schema, and every topic with two or more entries present in `data/quarrels.json` (the existing gate, moved). Built at M15.4 in `validate-data`, which also checks that a topic is one quarrel, that its figures and places exist, and that `docs/CONTRADICTIONS.md` is the one `pnpm quarrels:doc` writes.
- Determinism: two bakes, byte-identical.

`pnpm library:metrics`: resolution per work, citation density per book, links per edition, and the audit's warning list (`--audit`).

**Performance.** Reading pages are text without a canvas: 60 fps scrolling with no re-render on scroll, and `content-visibility: auto` on blocks out of view. `/theogony` holds 60 fps through its ignitions on the M1 Pro, and is measured on a phone.

**Accessibility.** Real text throughout; `lang="grc"` or `lang="la"` on the original; line numbers hidden from screen readers; skip links between books; the reduced-motion paths above.

---

## 11. Milestones

Each lands green on `pnpm lint`, `pnpm build` and `pnpm validate-data`, plus `pnpm validate-library` from M15.1.

- **M15.0 — Mockups and the licence check.** `mockups/library-a-shelf.html`, `library-b-reading-room.html` and `library-c-first-chaos.html`, desktop and phone, for the user's look. The Grant renewal check, the Seaton re-source, the nav word and glyph. *Outcome: the direction, decided.* *Built 2026-11-05, the user's look still to come.*
  - **Data.** The three files open straight from disk, on the atlas's own data baked by a throwaway script into `mockups/shared/library-data.js` and `library-theogony.js`. That covers the shelf's figures, *Iliad* 5.280–459 in Monro–Allen and Murray with the facts that cite it, the 192 quarrels, and all 1,487 stars at their baked positions with 18 *Theogony* beats.
  - **Nav.** `LIBRARY` is the fifth door; on phones its glyph is three spines on a shelf (`mockups/shared/library-chrome.js`).
  - **Licences.** The check found what §4.4 now records.
  - **Findings.** The mockup's data turned up two things that changed the plan: the unique-bearer link rule makes wrong links (§4.6), and disambiguation notes mislead the *Theogony* candidates (§8).
  - **Checked.** Headless Chrome at 1440×900 and at 390×844 with touch: no script errors, nothing wider than the screen. Not checked: Safari, Firefox, a real phone.
- **M15.1 — The citation spine.** Registry, resolver, `validate-library` for citations, `library:metrics`, the reviewed Ovid repair, `citation` on `relationSchema`, attestation works through aliases. *Done when every citation resolves or is allowlisted.* *Done 2026-11-05: `pnpm validate-library` passes, and every one of the 19,860 cited stretches resolves.*
  - **Built.**
    - `data/library/works.json` holds 11 works and 6 external ones.
    - The resolver is `src/features/library/cite.ts`; `extents.ts` checks a passage against the edition.
    - `pnpm bake-library-extents` writes the committed `data/generated/library-extents.json` (36 KB).
    - The scripts are `pnpm validate-library`, `pnpm library:metrics` and `pnpm library:ovid-lineation`.
    - Relations keep their `citation`.
  - **Measured.** The 10,887 citations make 19,862 cited stretches. 19,716 of them (99.3%) resolve: 19,629 to passages, 15 to whole works, 32 to external works and 40 to chronology notes.
  - **The data's habits, learned by the resolver.**
    - A bare locus after a semicolon continues the work before it ("Odyssey 3.193–200; 11.404–434").
    - A bare run of lines after book.line stays in that book ("Iliad 16.1–45, 480–505").
    - The *Fabulae* preface is cited by Grant's page ("p. 30", "pref.9").
    - Attestation words are labels, not works ("entire", "the returns, esp. 11").
    - A chronology note cites in its parentheses.
    - The extents accept a section inside a paragraph that ToposText does not cut (*Astronomica* 2.21.3).
  - **Fixed in the data against the corpus: 30 citation strings in 15 files, loci only.**
    - *Bibliotheca* loci written as *Epitome*: 3.10.8 (×3), 3.13.8, 3.15.7 and 2.8.2–3 (×2).
    - Paus. 7.3.12 becomes 7.3.1–2 (×12): 7.3 ends at 7.3.10, and Rhacius, Manto and Mopsus stand at 7.3.1–2.
    - *Epit.* 6.27–30 becomes 6.26–27: the *Epitome* ends at 6.29.
    - *Odyssey* ranges that ran past the end of their book: 10.575 becomes 574 (×5), 16.491 becomes 481 and 18.435 becomes 428.
    - *Il.* 13.860–875 becomes 13.182–196 for Amphimachus son of Cteatus (×3). The old locus repeats the numbers of *Il.* 2.860–875, where the Carian Amphimachus son of Nomion is named: likely a homonym slip.
  - **The Ovid repair, applied 2026-11-05 on the user's approval (certain and probable).**
    - `pnpm library:ovid-lineation --apply certain,probable` rewrote 213 citation strings. These were 142 certain loci, which ran past the end of their Latin book, and 80 probable ones, whose names stand only in More's lines.
    - Short loci moved to the Latin lines where their names stand: Manto's "6.245" became 6.157, *Ismenis Manto*.
    - Two loci were read by eye. Phaethon's chapter 1 "1.780–2.123" became 2.1–123, since chapters 0 and 2 already cite the Latin 1.747–779 and 2.124–329. Alpheus' "5.746–868, 5.869–868" became 5.572–641, Arethusa's tale.
    - Rerun after the repair, the review proposes nothing more: 0 certain and 0 probable. 624 Ovid loci stay ambiguous (the names stand under both numberings) and 230 unknown (under neither); both are left as written.
    - `validate-data`, `validate-layout` and `validate-myth-river` pass on the edited data.
  - **Settled with the user, 2026-11-05.**
    - **`eurydice-thebes` stays, at the user's call.** Her vague citation now names where the claim is told: *Sophocles, Antigone*, added to the registry's external works. Her facts still credit Apollodorus and Hyginus, which the corpus does not bear out (*Bibl.* 3.6.7, *Fab.* 68 and 72 never name Creon's wife). That is a known caveat, outside the gate's reach.
    - **`amphimachus-epeian` story[1] is corrected to *Il.* 13.182–189.** Hector casts at Teucer, Teucer dodges by a little, and the spear strikes Amphimachus.
- **M15.2 — The texts and the reading room.** The parser and the committed bake, the reading pages, the shared `<Citation>` with *Read the passage* on every surface, the deep-link highlight, EB Garamond, the phone layout. *Outcome: every footnote in the atlas opens its passage.*
  - *Built 2026-11-05; the user's look still to come.*
  - **Texts.**
    - `pnpm bake-library-texts` reads the pinned corpus into the committed `data/generated/library/<work>.json`: 11 MB, 91 reading pages, 5,526 blocks.
    - Verse aligns by Perseus card in Homer and Ovid, and by the English chunks in Hesiod; prose goes section by section.
    - The *Argonautica* shows Mooney's Greek, and each block links to Seaton's English at ToposText. The *Fabulae* and the *Astronomica* link each passage out (L10).
    - The largest page is Pausanias 8, with 359 KB of text.
    - The research normalizer now leaves a space where a note or a page mark stood, so words no longer run together ("Meliae all", "Memory (Mnemosyne)").
  - **Pages.**
    - `/library` is a plain front room until the Shelf (M15.5).
    - `/library/[author]/[work]` lists a work's books, or reads a short work whole. `/library/[author]/[work]/[unit]` is one book.
    - All of them are prerendered, with the text in the HTML.
    - Line numbers every five follow the original's lineation. A switch shows the original, both or the English.
    - A deep link (`#l370-417`, `#s1.3.1`, `#t92`) glows and settles on the reading line. It waits for the Greek face and lays the sleeping blocks out first, because `content-visibility` otherwise guesses their height.
    - The block being read is `data-now`, for the margin to come.
    - EB Garamond (`greek`, `greek-ext`) loads under `/library` only. No door lights in the bar until M15.5.
  - **Footnotes.**
    - One shared `Footnote` in `src/components/ui/` replaces the four private copies.
    - It opens on focus as well as hover, so a tap opens it on a phone.
    - Where the Library holds the passage, it offers *Read* links: on the Poets tab, the story pages and the city codices.
    - Still without links: the Loom's Pattern stops, the galaxy's character panel, the Ephemeris card, the Proem and the Nostos citelines (M15.7).
  - **Gate.** `validate-library` also checks that the texts were baked from the editions pinned now, that no page carries more than 400 KB of text, and that every cited passage lands on a page that exists.
  - **Checked.**
    - In headless Chrome, against a dev server of my own, at 1440×900 and at 390×844 with touch.
    - *Iliad* 5#l370-417 lands line 370 on the reading line (374 px against 378), with its 50 lines lit. *Bibl.* 1#s1.3.1 marks its section.
    - A codex footnote reads *Read Theogony 188–206 →*. No script errors.
    - `pnpm build` passes: 7,817 pages in 9.9 minutes.
    - Not checked: Safari, Firefox, a real phone.
- **M15.3 — The margin.** The reverse index and margin files, linking in the English column with scope and aliases, the audit list.
  - *Built 2026-11-05; the user's look still to come.*
  - **The reverse index.**
    - `sites.ts` gathers every citation in `data/`; a relation note's parenthetical citation counts too, marked *from a note*. `margins.ts` turns them round per page and per block (§4.5).
    - `pnpm bake-atlas-data` writes the margins into gitignored `public/atlas/library/`: 91 pages, each an index and its notes in 161 chunks in all. The largest file weighs 12 KB gzipped. One file per page would have weighed 117 KB for the *Fabulae* and 86 KB for *Bibliotheca* 3.
    - An excerpt is cut at a word to 160 characters, about the two lines the margin shows.
  - **The margin.**
    - A column beside the text from 1280 px up, a bottom sheet below that; it follows the block under the reading line.
    - Its sections are figures with their claim, tellers and citation, ⚖ quarrels by title, lines in the sky, stories, and up to three works on the Loom through those stories, then what runs *across* the book. *Iliad* 5.363–415 carries 32 facts, 10 figures and 3 Loom works.
    - The page's index comes first and the notes follow chunk by chunk, the chunks either side fetched ahead.
  - **The strip.** One histogram in the rail: a bar a block, longer where more facts rest on it, and the block being read in gold beside a dot. It fits the *Fabulae*'s 277 tales as well as a book of 20 cards.
  - **Names in the English.**
    - `link-english.ts` runs the atlas's engine with L11: every non-divine name is scoped. `data/library/aliases.json` adds 40 translators' forms across 7 editions (Murray's Athene and Aias, Evelyn-White's Briareos, More's Jove, Frazer's Sky).
    - A name is tinted by type, as elsewhere in the atlas, with a dotted underline, because a mortal's tint is the reading colour itself.
    - Homonyms that are both in scope stay plain: the two Iluses at *Bibl.* 3.12.3.
  - **The grid of tales.** The block being read is the tale in the row that the pointer or the keyboard is on, else the deep link's, else the row's first. `#t92` opens on tale 92, no longer on 94, the row's last.
  - **The audit.**
    - `pnpm library:metrics --audit` (`--all` for the whole list) lists 1,743 facts whose cited passage never names their figure in its English: 801 story paragraphs, 589 residences and 353 summaries. It is a list for an eye, not a gate.
    - A sample shows what it holds. Most are speeches, patronymics and pronouns (Thetis to Achilles, *Il.* 1.413–418). Some are a translator's English for a personification (Frazer's "Violence" for Bia) or a collective (the Cyclopes for Brontes). Many residences are inferred from a contingent's Catalogue entry that names the place, not the person (Phoenix and Automedon in the Myrmidon card, *Il.* 2.655–690).
    - Some are wrong. `achaea` summary[0] cites *Theogony* 1000 for Hesiod naming her, but the line tells of Medea and Medeus, and the *Theogony* never names an Achaea.
    - The list is left for a reviewed data pass (hard rules 2, 3 and 5), not fixed here.
  - **Gate.** `validate-library` also checks each margin file's weight (at most 30 KB gzipped), that every block with notes is in the chunk its index names, and that every alias names a figure in a pinned edition.
  - **Checked.**
    - In headless Chrome, against a dev server of my own, at 1440×900 and at 390×844 with touch.
    - *Iliad* 5#l370-417 shows its margin. Scrolling on to 5.668–710 shows the next chunk at once, since it was already fetched.
    - *Bibl.* 3.12.2 links Erichthonius, Tros, Assaracus, Ganymede, Capys and Anchises. The *Fabulae* opens on its tale, and a hover moves the margin.
    - On the phone, the sheet opens over the text. No script errors, and nothing is wider than the screen.
    - `pnpm build` passes: 7,817 pages in 9.9 minutes, with the margins in the export.
    - Not checked: Safari, Firefox, a real phone.
- **M15.4 — The Quarrels.** The move to `data/quarrels.json` with the generated doc and the moved gate; the index and the pages; the Proem's link.
  - *Built 2026-11-06; the user's look still to come.*
  - **The move.**
    - A one-off parse turned `docs/CONTRADICTIONS.md` into `data/quarrels.json`: 189 quarrels, 524 claims.
    - `pnpm quarrels:doc` writes the doc back. Written from the parse, it matched the old doc byte for byte, except for the line that now says where it comes from and the fix in (b) below.
    - The data-batch prompt (`scripts/prompts/odyssey-data-slice-loop.txt`) now sends new quarrels to the JSON.
  - **What the move found.** The old gate read only the topic ids, so the doc had drifted. Fixed:
    - (a) Three topics were written up twice (`ariadne-fate`, `phrixus-cretheus-parentage`, `ram-golden-ram-parentage`), so each pair is now one quarrel. For Ariadne, the second write-up gave Apollodorus and Hyginus an "immortal wife" their texts do not say. Each now has its own claim, read in the corpus: *Epit.* 1.9, carried off from Naxos to Lemnos; *Fab.* 43, taken from Dia as Liber's wife.
    - (b) Prometheus' significance and verification sat under the next heading; they are back on `prometheus-creation-of-man`.
    - (c) `rhacius` is `rhacius-crete`, the Cretan of Paus. 7.3.1–2, already in the atlas.
    - (d) Six claim citations did not resolve. Two were Ovid in More's lineation: 10.680–818 is now 10.298–518 and 4.903 is now 4.608–611, as Myrrha's and Danae's facts cite them. Paus. 7.3.12 is now 7.3.1–2, as fixed at M15.1. "Fabula 117", "Fabulae 153; likewise 152A" and "Fabulae 70 vs 185" are now written so the resolver reads them.
    - (e) The claim that Gorgophone bore Tyndareus cites Paus. 3.1.4 and says so in its text, so it carries Pausanias beside Apollodorus.
    - (f) Nessus' "encyclopedic tradition" names no teller and no passage, so it is kept as `outside`, shown apart and never as a teller's word.
  - **The pages.**
    - `/library/quarrels` has the Muses' line over it (*Theog.* 27–28, from the bake) and Hesiod's Νείκεα, the Quarrels Strife bore (*Theog.* 229).
    - A filter shows one teller at a time; the quarrels and sagas that teller takes no part in drop out.
    - Each quarrel goes under its saga in Spindle order. The saga is that of the stories whose chapters carry the topic, then of the stories its figures are cast in, its subject counting double. Failing both, it follows its subject's place in the cosmos.
    - `/library/quarrels/[topic]` sets the claims side by side in their tellers' order of composition. Each claim shows its passage: up to 12 cited lines of the original and the English card that translates them, or the section for prose. A work shown as an excerpt links out.
    - The significance note reads its `ids` as linked names.
  - **The margin.** A quarrel card lists its claims in order, marks *these lines* where a claim's passage is the block being read, and leads to the quarrel. At *Il.* 5.363–415, Homer's claim on Aphrodite's birth is marked, under Hesiod's and Apollodorus'. The largest margin file still weighs 11.9 KB gzipped.
  - **The Proem.** The quarrel beat links to its quarrel. 139 figures have that beat, and every one of their topics has a page.
  - **The front room** of `/library` leads to the Quarrels.
  - **Not done.** 25 of 185 significance notes speak of the atlas's own modelling (edges, lenses, nodes). Rewriting them for readers is a later editorial pass.
  - **Checked.**
    - In headless Chrome at 1440×900 and at 390×844 with touch.
    - The index: 13 sagas and 189 quarrels. Under Homer, 55 quarrels remain; under Apollonius, 15 across 6 sagas.
    - Aphrodite's birth shows three columns with Greek and English. Nessus shows its outside claim apart. Smyrna shows its strands.
    - The *Iliad* 5 margin card checked as above. No script errors, and nothing is wider than the screen.
    - The Proem was not staged in a browser. Its quarrel topics were checked in the data and in the `/api/ephemeris` payloads.
    - `pnpm build` passes: 8,007 pages in 11.9 minutes, the 189 quarrel pages and their index among them.
- **M15.5 — The door.** The shelf, the teller and work pages, `LIBRARY` in the nav with the top bar re-measured at 360 px, ⌘K, Open Graph, the sitemap.
  - *Built 2026-11-06; the user's look still to come.*
  - **The Shelf** (`/library`) is drawn as in mockup A: one SVG, the same on the server and the client (`Shelf.tsx`). On a phone, `ShelfRows.tsx` stands it up.
    - A spine's height follows its work's words. `pnpm bake-library-extents` now counts them in the edition that numbers the work: 111,895 Greek words for the *Iliad*, and 38,855 English ones for the *Fabulae*, whose Latin the corpus lacks.
    - A spine's gilt shows the share the atlas cites. Its threads are the sagas of the stories that cite it.
    - The numbers come from `shelf.ts`: every citation in `data/`, relation notes and quarrel claims included, resolved to its work. That makes 25,551 cited passages, against the gate's 19,772, which leaves notes out.
    - Hovering lights a work and shows its card, a teller's spines, or a saga's thread with its stories per work.
    - The spines rise once a session, when the Shelf mounts in the browser on entering by the door. A page loaded whole shows them standing, so nothing flashes; reduced motion keeps them still.
    - The empty shelf's note, that Apollodorus gives Euripides' versions by name, was checked in the bake: *Bibl.* 2.1.4, 3.6.8, 3.7.7 and 3.9.2.
    - Under the shelf come the seven tellers (facts, figures, quarrels, and the figures theirs alone) and the way into the Quarrels. *First, Chaos* joins at M15.6.
  - **The teller pages** (`/library/[author]`, 7) give the dates and the works with their editions, and what the atlas owes the teller. They list the figures that teller alone tells of (Hesiod's 18 are mostly his personifications), and the sides the teller takes in the quarrels.
  - **The work pages** add a strip under each book showing where the citations fall, the stories the work tells (67 for the *Iliad*), and its quarrels (32).
  - **The nav.** `LIBRARY` is the fifth door, with the three-spine glyph (L12). Five lettered doors need some 430 px, so the bar was re-measured:
    - Phone doors are 34 px instead of 40, and the phone bar's gaps are a few pixels narrower.
    - Below 1024 px the doors are glyphs; they were lettered from 640.
    - From 1024 px the letters sit in the flow between the brand and the chips, and from 1280 px at the true optical centre.
    - Nothing overlaps at 360, 390, 640, 768, 1023, 1024, 1279, 1280 or 1440 px. The tightest widths are 360 px (3 and 5 px to spare) and 640 px (2 and 5 px).
  - **⌘K** also answers with the Library.
    - `pnpm bake-atlas-data` writes `library-search.json`: 209 entries for the two doors, 11 works with their registry spellings, 7 tellers and 189 quarrels.
    - A query with a digit loads the Library's resolver, so the galaxy's bundle does not carry it. "Il. 5.370" offers *Read Iliad 5.370*, and "Met. 1" the book. The field now says *Search the atlas*.
  - **Open Graph.** `/library` has a card with its shelf in silhouette. Each work and each quarrel has its own card, Latin text only, and every Library page sets its own title and description.
  - **The sitemap.** `src/app/sitemap.ts` and `robots.ts` are written at build. They list every prerendered page of the atlas from the loaders the routes use, under `NEXT_PUBLIC_SITE_URL` (else icarusatlas.app).
  - **In the data.** Five quarrel texts lost their markdown asterisks, which printed as they were.
  - **Found, for the user's call.** `achaean-eponym` gives Hesiod a claim that the end of the *Theogony* names an Achaea among Zeus' offspring. Its own citation and verification say it rests on a "project roster", not the text, and neither the Greek nor the English names her. The same claim is in `achaea`'s summary (the M15.3 audit's case). It now shows on the quarrel's page and on Hesiod's.
  - **Checked.**
    - In headless Chrome: the door at 1440 px (spine card on hover, dimming) and at 390 px. The teller and work pages. ⌘K with five queries. The bar at the nine widths above.
    - No script errors, and nothing is wider than the screen.
    - `pnpm build` with `NEXT_PUBLIC_SITE_URL` set passes: 8,217 pages in 9.7 minutes. It wrote a sitemap of 7,187 pages, `robots.txt`, and 201 cards, extensionless PNGs that `scripts/finish-export.ts` gives a Content-Type.
    - Two small changes came after that build and were checked in dev only. The Library card's spines are shorter, since they ran into its subtitle. The Shelf's gilt now counts only lines the edition has; it read 101% on the *Metamorphoses*.
    - Not checked: Safari, Firefox, a real phone, and the cards as a social site draws them.
  - **Found: relation notes are not gated.** Their citations feed the margins and the Shelf but not `validate-library`. 42 of their 8,786 cited stretches do not resolve: 23 are Ovid in More's lineation, and the rest are prose like "and throughout" or a work's name alone. A later data pass, with the audit.
- **M15.6 — *First, Chaos*.** The lit set, the line crossfade, the beats and their gate, `/theogony`, reduced motion, the phone.
  - *Built 2026-11-06; the user's look still to come.*
  - **The beats.** `data/library/readings/theogony.json` holds 18 beats and 232 figures, taken from mockup C, whose first seven beats were written by hand.
    - The gate moved one: Cronus has no fact Hesiod tells that cites 133–153. His facts cite the deed (154–187), so he ignites with the sickle.
  - **The gate** (`validate-library` check 8). The beats must run 1–1022 without a gap. Every lit figure must have a fact Hesiod tells whose citation overlaps its beat.
    - The plan's filter for "not to be confused with" notes threw out real anchors that only end on such a clause. The river Ladon's fact names him at 337–345, then adds "not to be confused with Ladon the serpent".
    - So a fact counts as a mere note only when it opens on the distinction, in its first 80 characters. Lighting Sterope the Pleiad among the Cyclopes, or Glauce of Corinth among the Nereids, fails the gate, as it should.
    - `pnpm library:theogony-candidates` applies the same rule: 237 figures are tied to the poem, 232 lit. Of the five tied but unlit, three are the plan's false ties (Cerberus of Same, Melia of Thebes, Tisiphone daughter of Alcmaeon), and they stay unlit.
  - **The galaxy.**
    - The store holds a lit set (`lit`: stars, relations, accents).
    - `StarsDriver` eases each star toward it: an unlit star keeps 7% of its light, and a lit one rises over about 600 ms with a short flare. With no lit set every multiplier is 1, so the home galaxy is unchanged.
    - `RelationLines` cross-fades: a line leaving the drawn set fades out as the next fades in. That gives the main galaxy the animated re-routing on a lens change that M2 promised.
    - `CameraRig` takes an `aim`, so a reading's focus sits in the open sky.
    - `GalaxyView` and the reading share `useGalaxyPositions`.
  - **`/theogony`.**
    - It mounts `GalaxyCanvas` in a reading mode, not `GalaxyView`, since the reading wants none of the cards, panels or picking. The sky is looked at, not touched, so the page's scroll is never taken by a zoom.
    - The column holds the whole poem: each beat's Greek lines exactly, and each of Evelyn-White's cards in the beat holding most of its lines. Under each beat it names the figures it ignites.
    - The camera frames each beat's new figures, and a thread and a counter follow the reading.
    - The finale turns the lens to Homer. The stars he never names sink to a fifth, and Aphrodite's line leaves Uranus for Zeus and Dione in gold. A toggle turns it back to Hesiod.
    - Escape returns to the *Theogony*'s reading page, and leaving restores the galaxy's lens, selection and light.
    - Under reduced motion the stars light at once and the camera keeps the overview.
    - On a phone the sky keeps the top two fifths and the poem scrolls in a pane below.
  - **Ways in:** the door's second card, a link on the *Theogony*'s reading page, the sitemap, and a social card.
  - **Checked.**
    - In headless Chrome at 1440×900 and 390×844: the title (0 lit), the Chaos beat (14), the Titans (37) and the finale (91 of them Homer names). Turned to Hesiod, all 232 are lit with Aphrodite's line to Uranus in gold.
    - The home galaxy with Zeus selected is unchanged. No script errors, nothing wider than the screen.
    - `pnpm build` passes: 8,219 pages in 9.7 minutes, run beside a dev server. `/theogony` weighs 156 KB gzipped with the whole poem in it, near an *Iliad* book (146 KB).
    - Not checked: reduced motion in a browser, Safari, a real phone, and frame rate on the M1 Pro.
- **M15.7 — Bridges and launch.** §9, a changelog stanza, `CLAUDE.md` (nav, a feature section, commands), `docs/PLAN.md` status.
  - *Built 2026-11-06; the user's look still to come.*
  - **Every footnote opens its passage.** `citationParts` cuts a citation at its semicolons and links each stretch the Library holds, a bare locus carrying on the work before it. `<CitationText>` draws the result, and it now does so on:
    - the galaxy's character panel;
    - the Ephemeris card;
    - the Proem's telling, whose link first steps off the stage;
    - the Nostos epigraphs, 21 of them on `/odyssey`.
  - **Pattern stops.** The Loom's stops carry their passages, resolved when the door data is baked (`pnpm bake-art --force` rewrote `public/art/loom.json`), so the plate needs no resolver.
  - **Told in.** A story's *Told in* links each work to its page in the Library and each locus to its passage: *Theogony* 176–206 · *The Library* 1.1.4, 1.3.1 · *Iliad* 5.370–417 for the Foam-Born.
  - **Testimonia.** A testimony's opening citation ("Hyginus, Astronomica 2.29 — many say…") opens its chapter. 33 of 42 do; the other nine cite Eratosthenes, whom the Library does not hold. Inside a card that is itself a link to its story, they stay plain.
  - **Earliest of our tellers.** The Poets tab gives, under *told after*, the oldest work among the passages a figure's facts cite, with any teller whose dates overlap it. It is worded as the oldest of the seven, never the myth's origin. Aphrodite's reads: Homer, *Iliad* 5.370–417 (c. 8th century BC) and Hesiod, *Theogony* 188–206 (c. 700 BC) — their dates overlap.
  - **The rest.** The changelog's 0.6.0 stanza, *The Library and the First Quarrel*, and the Library's feature section in `CLAUDE.md`.
  - **Checked.**
    - In headless Chrome: the links on the codex, a story, a constellation, a Loom plate, the Odyssey and the galaxy's panel.
    - `validate-loom`, `validate-data` and `validate-library` pass. `pnpm build` passes: 8,219 pages in 7.9 minutes, the exported pages carrying their passage links.
    - The Ephemeris card and the Proem were not staged in a browser.
  - **Left open, for the user's call:**
    - the Achaea claim (M15.5);
    - the audit list (M15.3);
    - relation notes that are not gated (M15.5);
    - the 25 significance notes written for data entry (M15.4);
    - L10, Grant's Hyginus in full or in excerpts;
    - the decision log's statuses.

M15.1 comes first, because everything rests on the resolver. M15.2 and M15.4 can then run side by side. M15.6 needs only M15.1 and the *Theogony* page of M15.2, so it can move forward if the launch wants its moment.

## 12. Risks and guards

- **A wrong link inside a classic.** Names link only within the passage's citation scope or to a unique bearer; aliases are reviewed; the gate samples links. Unlinked is fine.
- **Licences.** Full display only where the licence is verified, a credit on every page, ShareAlike kept (the data is already BY-SA). Grant's Hyginus shows in full only if L10 says so.
- **Silent data change.** The resolver never rewrites a citation. The Ovid repair is the one edit, reviewed as a batch.
- **A text dump.** The alignment, the margin and the shelf are what make this a room rather than a file listing; the mockup step is there to prove it before anything is built.
- **Git growth.** About 9 MB of text, once; rebaked only when the manifest changes.
- **Build time.** About 300 new static pages, small beside the codex's 1,487 × 3; measured at M15.2.
- **Scope.** Full-text search, lemma linking, translators' notes, recitation, and new tellers (Pindar, the tragedians) are good ideas and are not in M15. New tellers would change the source system, not the Library.

## 13. Decision log (proposed — confirm on review)

| # | Decision | Choice | Status |
|---|---|---|---|
| L1 | Door and world | `LIBRARY` at `/library`; the world is the Library, after Apollodorus' *Bibliotheca* | the nav word confirmed by the user's go on M15.5, 2026-11-06; the rest proposed |
| L2 | Geometry | A 2D shelf with time along it and the sagas as threads. Rejected: a 3D hall (decoration over reading) and a stemma tree (it asserts descent the sources do not state) | proposed |
| L3 | Lens | None on the door: each page is one teller, and the Quarrels are all of them | proposed |
| L4 | Texts | A committed bake of the pinned corpus at line and section level, aligned by Perseus cards, one page per book | proposed |
| L5 | Ovid | Magnus' Latin lines everywhere, after one reviewed repair | proposed |
| L6 | Linking | The English column only, scoped by citations, with aliases per edition | proposed |
| L7 | Quarrels | The catalogue moves to `data/quarrels.json`, and `docs/CONTRADICTIONS.md` is generated from it | proposed |
| L8 | Flagship | *First, Chaos* at `/theogony`, ending on Homer's Aphrodite | proposed |
| L9 | Greek type | EB Garamond with the `greek` and `greek-ext` subsets | proposed |
| L10 | Licence posture | Full text only where the licence is verified. Seaton from Project Gutenberg #13977. Grant's Hyginus: registered in 1960 and never renewed, so very likely US public domain since 1989; show it in full with that note, or keep excerpts | proposed — the user's call |
| L11 | Names outside a passage's scope | Only a god whose name no other figure bears links; everyone else links only in scope. Measured on *Iliad* 5: the looser rule made three wrong links in 180 lines | proposed |
| L12 | Phone glyph | Three spines of unequal height on a shelf, the middle one gilt-banded, in the bar's thin-stroke idiom | proposed |

## 14. Open questions

1. ~~The nav word: `LIBRARY` (recommended) or `TEXTS`?~~ `LIBRARY`, with the user's go on M15.5 (2026-11-06).
2. Should `/theogony` grow into a general *read with the sky* engine (the *Iliad*'s Catalogue of Ships on the map, *Met.* 1 in the galaxy)? Recommended: one route first, as Nostos did.
3. Frazer's notes in a later version?
4. The empty shelf: leave it as an honest gap, or plan new tellers as a separate source-system milestone?
5. Grant's Hyginus: show it in full as US public domain, as Theoi and ToposText do, or keep it to excerpts (L10)?
