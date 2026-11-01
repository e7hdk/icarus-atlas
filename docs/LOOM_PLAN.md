# The Loom — the Art door (M14 Plan)

> **Status:** APPROVED 2026-11-01 — the direction is `mockups/art-loom-web.html`, the cloth with its web; `mockups/art-loom.html` is its flat ancestor. M14.1 to M14.3 done on branch `art-loom` (see §9); M14.4 is next.
> **Door:** `ART` in the main nav, route **`/art`**, one work at **`/art/[id]`**. The world behind the door is **the Loom**, as the world behind Myths is the Spindle.
> **Scope:** gather every image of the culture layer into one designed place, with a coordinate system that means something, without changing how the Legacy tab works.
> **Does not touch:** the source lens, the authored files in `data/culture/` and `data/story-culture/`, the text-only shelves (film, music, popular culture).

---

## 1. Why this door

The three doors answer three questions: the Galaxy *who*, Lands *where*, Myths *when*. Art answers the fourth: *how did people see it?*

The metaphor comes from the myths and continues the door beside it. The Spindle spins; the Loom weaves the same threads, in the same order and the same colours.

- Ovid's Arachne weaves the crimes of the gods, opening with Europa and the bull, and Athena tears the cloth (*Met.* 6.103, 6.129–131).
- Homer's Helen weaves the battles fought over her into a purple web (*Il.* 3.125–128).
- Velázquez's *Las Hilanderas* paints that contest, and the tapestry on its back wall is Titian's *Rape of Europa*. Arachne's first scene, a Titian and a Velázquez are one object, and both paintings are already in our data.
- A Greek warp-weighted loom was woven from the top downward, with clay weights hanging from the warp. So time runs down the cloth and the unwoven threads hang below it.
- Aby Warburg's *Mnemosyne Atlas* (63 black panels, 971 images at his death in 1929) tracked the afterlife of ancient gestures across centuries. The Patterns layer (§3) is that idea, in a project already called an Atlas.
- When Athena has torn the cloth, Ovid's Arachne becomes a spider and goes on weaving (*Met.* 6.139–145). So the front of the Loom is her tapestry and its back is her web: turn the cloth and the network between the works is there, as the back of any real tapestry shows its threads.

### Non-goals

- **No walkable 3D museum.** No overview, slow to cross, poor on phones.
- **No free-floating network.** A force-directed 3D graph would repeat the Galaxy's grammar, throw away the axes and show paintings at an angle. The web always grows out of the cloth, and every work keeps its place on it.
- **No lens.** Legacy is lens-independent by design and so is this door.
- **No replacement for the Legacy tab.** A figure's shelves stay curated and capped; the Loom is the collection, Legacy is the figure's selection.
- **No images on the text shelves.** Film, music and popular culture stay image-free (CULTURE_PLAN §3). Showing them as loose threads in the fringe is a possible later idea, not part of M14.
- **No bloom or tone mapping on paintings.** A painting's colours are never re-graded at reading distance.

---

## 2. What we have (measured 2026-11-01, after M14.3)

| Measure | Value |
|---|---|
| Artwork entries (`data/culture` + `data/story-culture`) | 2,734, plus 3 artifacts |
| Unique Commons files | 1,740, all alive |
| Catalogue | **1,703 works**: 35 scans merged by reviewed `sameAs` overrides, 2 modern photographs of places excluded |
| Medium | 666 paintings, 338 prints and drawings, 319 sculpture and objects, 245 vases and ceramics, 135 walls and floors |
| Era | 533 before AD 500, 11 from 500–1400, 1,159 after 1400 (53 of them from 1900 on) |
| License | 1,291 public domain or CC0, 97 CC BY, 315 CC BY-SA |
| Attribution required by Commons metadata | 414 images; 18 of them have no `Artist` field |
| Image credit in the UI | None before M14.1; now on every image surface |
| Original width | 322 under 960 px, 66 under 500 px; 355 files over 4,096 px on the long side |
| Aspect | 720 landscape, 611 portrait, 329 square, 81 wide |
| Works in *Other tales* | 126 (7.4%), down from 426 (25%) in the mockup. 109 are real `heroic` tales such as Orpheus and Bellerophon; 17 (1%) have nothing to place them |
| The network on Legacy shelves alone | Median 1 figure per work; largest connected set 89 works (5%), 425 separate sets; longest thread 8 works |
| The network in the catalogue | Median 2 figures per work; largest connected set 1,379 works (81%), 93 sets; 565 threads, 2,571 stitches; Heracles 104, Achilles 64, Odysseus 63, Zeus 53 |
| Figures seen on both sides of the tear | 301 |

The collection is not "every painting of Greek myth". It is what the atlas holds. §9 M14.9 is how it grows.

---

## 3. What every shape means — the contract

Same discipline as hard rule 6: no position is decoration.

| Shape | Meaning | Source in the data |
|---|---|---|
| **Tile** | One physical work, once | a catalogue record (§4.2) |
| **Column position (→)** | The order of the myths | `SAGA_ORDER`, shared with the Spindle |
| **Row (↓)** | When the work was made, oldest at the beam | `sortYear` |
| **Band** | One saga's tiles, always contiguous in a row | `saga` (§4.3), colour from `SAGA_ACCENT` |
| **Band width** | That age's share of attention | count per saga per row |
| **Anchor** | A work the eye can land on, drawn large with a gold hairline | hand-picked `span` in overrides, 40 at most |
| **The tear** | AD 500–1400: a gold-mended gap where the collection thins | works in that range sit inside it as stitches |
| **Warp** | Bare threads above and below the cloth | one bundle per saga, sized by its share of works |
| **Clay weight** | A saga as a control: hover lights its band, click holds it | `SAGA_ORDER` |
| **Fell line** | The gold line at the weaving edge during the opening reveal | none, motion only |
| **Fringe** | The cloth is not finished: the last rows thin into loose warp | the actual count of recent works |
| **Gold thread (Pattern)** | One gesture followed through time; it only ever falls | a curated pattern file (§4.6) |
| **Thread** | One figure, falling through the cloth from its oldest work to its newest | `figures` (§4.3), two works or more |
| **Stitch** | One step of a thread: an arc out of the cloth between two works next to each other in time | consecutive works of a thread |
| **Knot** | A work where threads cross: two figures meet in one image | a work on several threads |
| **Pulled work** | The work you hold, lifted out of the cloth with its nearest neighbours along each thread | a click; at most 24 neighbours |
| **The back** | The reverse of the cloth: every thread at once, brighter where it crosses the tear | *Turn the cloth* |

Rules that keep the drawing honest:

- The vertical axis is rank time, not linear time: rows hold equal counts, so dense centuries take more height. The era rail always shows where each age begins.
- The tear states what the collection lacks, never that art stopped. Medieval images of the myths exist; ours are few. Its label must say so, and adding manuscripts (M14.9) thins it honestly.
- The cloth shows shares; prose does not interpret them. In the catalogue Ovid goes from 10% of works before AD 500 to 28% in the 1500s–1600s and back to 13% in the 1700s–1800s, while Troy goes 25%, 19%, 27%. That shape survived the better links of M14.1, but it still rests on derived sagas, so it stays out of UI copy until it has a citation.
- A Pattern groups by likeness. Descent ("Rubens copied Titian") is stated only with an evidence link.
- A thread says a figure appears in both works, nothing more. It is not influence, and no copy reads it as influence.
- Threads are chains in time order, never cliques: 2,583 stitches instead of a far denser all-pairs graph. Held by one work a thread shows only its neighbours and fades along its length; drawn whole, a 65-work thread is a scribble.
- Titles stay as the holding museum gives them.

---

## 4. Data layer

### 4.1 Sources of truth

`data/culture/*.json` and `data/story-culture/*.json` remain the authored source; nothing in them is rewritten. The CULTURE_PLAN decision to accept duplication said "measure before abstracting": measured, 2,734 entries are 1,741 files, but a shared-reference migration across 1,011 files buys nothing the door needs. Dedupe happens at bake time instead.

| File | Authored? | Purpose |
|---|---|---|
| `data/art/overrides.json` | yes, small | Exceptions only: `sameAs` merges, medium, date, saga, anchors, focus points, caption choice |
| `data/art/patterns/*.json` | yes | Curated Patterns (§4.6) |
| `data/art/collection/*.json` | yes, M14.9 | Works beyond the Legacy cap (§4.7) |
| `data/generated/art-commons.json` | generated by `pnpm art:commons`, network | Size, MIME, license, author, categories per Commons file |
| `data/generated/art-catalogue.json` | generated by `pnpm bake-art`, offline | One record per work; content signature as in `bake-layout`, chained into `dev` and `build` |

`art:commons` batches the Commons API (40 titles a call, about a minute for the whole set, as measured). It is a manual network step like `verify:culture`, so `build` stays offline.

### 4.2 The catalogue record

```ts
type Medium = 'painting' | 'vase' | 'stone' | 'wall' | 'print';
type FigureVia = 'shelf' | 'title' | 'category' | 'override';

interface ArtWork {
  id: string;           // stable slug, the URL: artist + title, hash suffix on collision
  title: string;        // display, from the culture entry
  artist: string;
  year: string;         // display string
  sortYear: number;     // signed year for ordering
  medium: Medium;
  file: string;         // Commons file name; sameAs scans merge into one record
  path: string;         // Commons hash path, for thumbnails
  width: number;        // original pixels, so no thumbnail is guessed
  height: number;
  license: string;      // Commons LicenseShortName
  licenseUrl?: string;
  author?: string;      // Commons Artist, HTML stripped
  figures: { id: string; via: FigureVia }[]; // everyone the work shows (§4.3)
  stories: string[];    // story ids, same
  saga: SagaId;
  sagaVia: 'story' | 'cast' | 'type' | 'relation' | 'override' | 'none';
  span?: [number, number]; // anchors, in cells
  focus?: [number, number]; // tile crop centre, 0..1
}
```

`description` is held apart from the record (§4.8). When entries disagree, the caption comes from a story entry first, then the figure who leads the work's cast, then overrides. Captions written for one figure can read oddly out of context, so anchors and Pattern stops get a hand check.

### 4.3 Resolution rules

- **`figures`:** the union, in order of trust: the Legacy shelves holding the work; names in its title, read by the prose linker with its homonym guard (`parseLinkedProse`, scoped to the work's own figures and its stories' casts); a Commons category that *is* the figure (`Athena`, `Athena (mythology)`, `Athena in art`); overrides, which can also remove a link. Measured: 2,053 links from shelves, 1,015 from titles, 121 from categories. Captions and loose category matches stay out: sampling found them noisy (`Paris` from Louvre categories, `Artemisia` from Gentileschi, vase painters' names).
- **`sortYear`:** parsed from `year` (BC/AD, ranges, centuries, early/late, a few era words); a leading modern year wins, as in `1893 (after a 5th-century BC mural)`. Anything unparsable must be in overrides; zero unresolved is a gate.
- **`medium`:** override, then `artifacts.kind`, then a vote between Commons categories and keywords in title, description and artist. Where the two signals disagree the record goes on a review list printed by `loom:metrics`.
- **`saga`**, first that resolves:
  1. Stories linked to the work, by majority.
  2. The figures' story casts, weighted lead 3, top three 2, others 1.
  3. A divine figure's `type`: olympian and god to `olympian`, titan to `titan`, primordial to `primordial`. Resolves 156 of the mockup's catch-all.
  4. One hop through `relations.json`: the neighbours' cast weights. Resolves 191 more.
  5. `heroic`, shown as *Other tales*.

Measured: 561 works settled by story, 957 by cast, 113 by type, 55 by relation, 17 by nothing. The 126 in *Other tales* are mostly real tales outside every cycle, so the band is meaningful, not a residue.

`sagaVia` is stored so the heuristic share stays visible. The plate shows only real links (figures, stories), never the guessed saga's reasoning. These rules are metadata on already verified works, so hard rule 3 is not in play, but each rule's output is reviewed in samples before it ships.

### 4.4 Duplicates

Same file merges automatically. Everything else is a reviewed `sameAs` override, because a shared title proves nothing: Cranach and Rubens each painted the *Judgement of Paris* more than once, and the catalogue holds distinct versions under one title. Near-identical images under different names come from a difference hash of the thumbnails: `pnpm bake-loom-atlas` writes the candidates to `research/loom/duplicates.json`, and they land the same way. The first pass gave 26 pairs; looking at them, 16 were one work, the rest unrelated images or real second versions such as Batoni's two *Aeneas*. No merge is ever automatic on title or hash alone.

Reading Commons also showed where the shelves were wrong. 37 entries on 23 files had their artist or date corrected from the file pages, for instance *Ixion and Nephele* from "Unknown, 18th–19th century" to Rubens, 1615, because a wrong date puts a tile in the wrong row. Fetching every thumbnail also found one dead file, `07leucip.jpg`, listed by the Commons API but gone from its storage, so Rubens's *Daughters of Leucippus* was broken on its Legacy page. It now points at a live scan.

### 4.5 Credits

`LICENSING.md` treats attribution errors as bugs, and 414 images are in that state now. This is fixed first, for every surface, not only the new door.

- `<WorkCredit>` renders `Image: {author} · {license} · Commons ↗`, or `Public domain · Commons ↗`. It always links the file page, which also covers the 18 files with no `Artist`.
- The Commons `Artist` field can name the painter rather than the photographer, so the link carries the real attribution. Credit text comes only from Commons, never from us.
- It appears on the plate, the Legacy lightbox and vitrines, the story section, and the Nostos art. Server pages look it up and pass it down, so no client ever loads the metadata file.
- `ATTRIBUTION.md` says images are "not vendored". The baked sheets change that; it gets rewritten in M14.3, naming the sheets and stating that each tile stays under its own license.

### 4.6 Patterns

`data/art/patterns/<id>.json`, gated by `validate-data`:

```ts
interface ArtPattern {
  id: string;
  title: string;           // "Arms become branches"
  summary: string;         // museum-caption voice
  stops: {                 // oldest first; the thread passes through these
    work: string;
    note?: string;
    citation?: string;     // an ancient claim: required, with sources (hard rules 2 and 5)
    sources?: SourceId[];
    evidence?: string;     // an art-historical claim: required https link (CULTURE_PLAN §3)
  }[];
  members?: string[];      // lit, but off the thread
}
```

Launch set of six, five of them working in the mockup: *Arachne's first scene*, *Arms become branches*, *The carried body*, *The fall*, *The monster slain*, *The judgement of Paris*.

### 4.7 Growth beyond the Legacy cap

Legacy is capped per figure on purpose, which conflicts with "all of them in one place". `data/art/collection/*.json` holds works that deserve the Loom but not a figure's shelf: the thirtieth *Judgement of Paris*. Same shape as an artwork plus `figures` and `stories` ids, same harvest → curate → verify pipeline, `verify:culture` extended to cover it. The "no bulk imports" guard stands: reviewed batches of at most 100.

### 4.8 What reaches the client

| Payload | Contents | Target |
|---|---|---|
| RSC prop on `/art` | ids, cells for both layouts, saga, medium, title, artist, year | ≤ 80 KB gzipped |
| `public/art/details.json` | captions, credits, links; fetched on first plate | ≤ 150 KB gzipped |
| `/art/[id]` | the one work, server-rendered | ordinary page |

---

## 5. The layout engine

`src/features/art/loom.ts`, pure and deterministic, ported from the mockup's generator. It runs on the server, as the Spindle's layout does, for desktop width 58 and phone width 26.

1. Split into three blocks: before AD 500, the tear, from 1400 on.
2. In each block give every work an ideal row by cumulative area in time order.
3. Place anchors first, at their ideal row and at their saga's share of the width, keeping one clear cell between anchors. Spans follow the image's real shape: 4×3 for a landscape, 3×4 for a portrait, 3×3 near square.
4. Fill the remaining cells row by row from per-saga quotas: each saga's density across rows is smoothed (Gaussian, σ 1.8 rows) and each saga keeps its own chronological queue, so a single print series cannot stripe a row. Quotas chase a cumulative target, so a saga that falls behind catches up and drift never accumulates.
5. Sort each row by saga and assign left to right.
6. Lay the tear's works evenly across its two rows.

`pnpm validate-loom` gates, offline, at both widths:

- Every catalogue work has exactly one tile; no overlap, nothing out of bounds, every cell filled except the fringe rows and the tear.
- Deterministic and blind to input order (hash compare after a shuffle).
- Within a saga, row order follows `sortYear`; no work sits more than 3 rows from its ideal row (6 on a phone, where a row is short).
- Nothing crosses the tear: before 500 above it, 1400 on below it.
- A saga's tiles are contiguous within a row, and 95% of band edges move at most 8 cells between rows. The worst single move is reported, not gated: where several anchors begin in one row they push its singles aside, and one such row says nothing about the flow.
- Every saga appears at the phone width.
- *Other tales* ≤ 8%, unplaced works (`sagaVia: none`) ≤ 1.5%, anchors ≤ 40, unresolved dates 0, every work carries a free license, every work has a sprite.

`pnpm loom:metrics` (`--json`) reports those numbers, shares by saga and era, the medium review list and `sagaVia` counts. `pnpm loom:sketch` draws the cloth flat to gitignored `research/loom/`.

---

## 6. Atlas and rendering

**Why bake:** the mockup hot-links every thumbnail. Commons refused 212 of a burst at nine concurrent requests, and a full weave took about a minute. A door cannot open that way.

`pnpm bake-loom-atlas` (`scripts/bake-loom-atlas.ts`, uses `sharp`, already a dev dependency):

- Fetches each work's Commons thumbnail at a standard step, politely and resumably, into gitignored `research/loom/thumbs/`.
- Crops to the cell with `sharp`'s attention strategy or the override `focus`. Only 329 files are close to square, so a plain centre crop would lose too much.
- Writes to `public/art/`: `sheet.webp` (64 px cells), `anchors.webp` (256 px cells), `sheet-lq.webp` (24 px cells), `manifest.json`.
- Budget: LQ ≤ 300 KB, full sheet ≤ 4 MB, total ≤ 6 MB. First bake: LQ 248 KB, full sheet 1.7 MB, anchors 302 KB, total 2.3 MB. Rebakes happen at batch boundaries to limit git growth.

The catalogue only includes works present in the manifest, so a culture batch simply waits for the next bake; the door never shows a hole. Drift is a warning in `validate-loom`.

**Rendering** (React Three Fiber, `src/components/art/`), proven in `mockups/art-loom-web.html`:

- Sprites are composed into one cloth render target at load, at 64 px per cell on desktop and 32 on phones, then mipmapped. Sampling sheets directly would bleed neighbouring sprites through the mips; the mockup's cloth-as-one-texture avoids that and keeps the shader unchanged. It also lets one sheet serve both layouts. `createImageBitmap` keeps decoding off the main thread.
- One subdivided plane for the cloth, line segments for the warp, a small per-cell data texture for saga colour, anchor flag and brightness. Eased on the CPU, as in the mockup.
- The cloth is pinned at the beam and freer lower down; ripple and sway fade out by 62 px per cell.
- Colour passes through untouched: no tone mapping, no composer. The "wool" grade (highlights pulled down, warmed) is in the shader and reaches zero by 84 px per cell, so what you read is the painting. Museum-white backgrounds made the cloth glare without it.
- Above 58 px per cell a DOM `<img>` pool takes over, at most 80, choosing the largest standard Commons step the original supports. `width` makes this exact; 322 files would otherwise fail at 960.
- The tear is a seeded texture, identical every load.
- Stitches are one instanced ribbon each, computed in the vertex shader from the two works' cells, a per-work lift (a float data texture: offset and height out of the cloth) and per-thread state (alpha, width, the held work's place, reach). Blending is additive.
- Lifted works are DOM images placed by projecting their 3D point every frame, so they stay crisp at any size and take ordinary hover and click.
- The camera orbits the cell it looks at, so hit tests are a ray through the cursor meeting the cloth's plane, and labels are projected, not offset.
- The canvas is opaque and draws the sky itself, which keeps blending plain.

Budgets: 60 fps on the user's desktop, 45+ on a mid-range phone, GPU memory ≤ 64 MB desktop and ≤ 20 MB phone, cloth on screen within 1.5 s on broadband. **No real frame rate exists yet:** the mockups were only checked under software GL. M14.4 and M14.5 measure on real hardware.

---

## 7. The door

Everything in `mockups/art-loom.html` is the visual bar; ship nothing that reads worse than it.

**Desktop.** Era rail left of the cloth, sticky to the screen edge when zoomed. Title block bottom left. Patterns and medium on the right. Clay weights under the warp. Wheel zooms to the cursor, drag pans, double-click returns home. Hover lifts a tile, shows a card in the HoverCard grammar and raises a few stitches of its threads. Click pulls the work (below); above 46 px per cell, where the tile can already be read, click opens the plate. Once among the paintings the rails step aside and the era rail becomes small chips.

**The web.** The cloth tilts a little to the pointer, so it reads as an object in space. A click lifts the work to the front with its nearest neighbours along each thread, nearest in time first, at most 24, spread apart just enough to read. The rest of those threads stay lit on the cloth. The rail shows the work and its threads with counts: hovering a name isolates that thread, clicking one lifts along it. Click a neighbour to walk the web, click the held work for the plate, drag to turn the whole thing, `Esc` to let go. Escape always steps back one level: plate, web, Pattern, home.

**The back.** *Turn the cloth*, or `T`, rotates the whole cloth in 3D. It comes to rest about 19° off square so the arcs read as depth, and dragging turns it. A clay weight isolates one saga's threads, hovering shows a work's threads, a click turns the cloth back and pulls that work. The back is atmosphere and overview first; following one thread needs a hover.

**The plate** (`/art/[id]`, pushed with shallow history so Back closes it): the image in its true ratio with the gold double frame; kicker with saga, era and medium; title, artist, year; caption; Pattern note if it is a stop; *Stars in this work* linking to `/character/[id]`; *The myth* linking to `/story/[id]`; `<WorkCredit>`. Arrow keys walk to the neighbouring work in time.

**Filters.** Saga, medium, Pattern, and deep links (`/art?figure=perseus`, `/art?story=daedalus-icarus`, `/art?saga=trojan`). They intersect. Dimmed tiles sink into the warp rather than vanish, so the shape of the selection stays readable. The user's first ask was paintings, so *Paintings* is one click away.

**Search.** `WorkSearchOverlay` on ⌘K, in the mould of `StorySearchOverlay`: title, artist, figure; a hit flies to the tile. `/art` joins `HAS_OWN_OVERLAYS`.

**Opening.** With a baked sheet the weave is instant, so the fell line becomes a designed 1.6 s reveal from the beam, first visit per session only.

**Nav.** `MainNav` gains `art` with a thin-stroke loom glyph; `doorFor` learns `/art`; comments saying "three doors" change. The label stays one plain word beside Galaxy, Lands, Myths.

**Phone** (the audience arrives from Instagram, so this is not a footnote). The 26-wide layout makes a tall cloth: one-finger scroll travels down through time, pinch zooms. A tap pulls the work with at most 12 neighbours, and the house two-detent bottom sheet carries its threads and the plate; one finger then orbits the web instead of scrolling. Weights become a chip strip, Patterns a sheet. The back is one button away and, on weak devices, draws only the threads that cross the tear. `touch-action: none` on the canvas, `svh`/`dvh`, 32 px cells, ripple off. Four door glyphs must be proven beside the brand, Wain chip, Ephemeris chip and actions at 360 px.

**Access and fallback.** `prefers-reduced-motion` removes ripple, sway and reveal. Keyboard walks tiles. `/art/list` is a server-rendered, filterable catalogue, and it serves as the accessible view, the no-WebGL fallback and the crawl path in one route.

---

## 8. Bridges

The Loom must lead back into the atlas, and into it.

- Legacy gallery and story "How the centuries saw it" gain *See on the Loom* (`/art?figure=…`, `/art?story=…`).
- Spindle story panel: *Woven on the Loom* with a count, when the count is above zero.
- Ephemeris card: the day's artwork opens its plate.
- `/art/[id]` gets `generateMetadata` and an Open Graph image, so one painting can be shared on its own.

---

## 9. Milestones

Each lands green on `pnpm lint`, `pnpm build`, `pnpm validate-data`, plus its own gate.

- **M14.1 — The catalogue and the credits.** Types, schemas, `art:commons`, `bake-art`, `data/art/overrides.json`, the §4.3 rules including figure links, `validate-data` growth, `loom:metrics` in first form, `<WorkCredit>` on every existing surface. **User-visible outcome: the attribution gap closes.** *Done 2026-11-01:* 0 unresolved dates, *Other tales* 7.3% with 1% unplaced, the §3 shares re-measured, credits on the Legacy gallery and vitrines, the story section, the Nostos art, the daily card, the proem and every lightbox. The medium review list (`loom:metrics --review`) was read through; 36 overrides corrected what it found, and its remaining 99 disputed and 67 default records were left as they stand.
- **M14.2 — The engine.** `loom.ts`, `validate-loom`, `loom:sketch`. Done when both widths pass every gate. *Done 2026-11-01:* 58 wide makes 38 rows, 26 wide makes 81; no overlaps, no holes; drift 3 rows at worst, 1 at the 95th percentile; 95% of band edges within 6 cells; 35 anchors. Both widths lay out in under 20 ms.
- **M14.3 — The atlas.** Bake script, first sheets, budget check, image-hash duplicate pass, `ATTRIBUTION.md`. Can run beside M14.2. *Done 2026-11-01:* 1,703 sprites in 2.3 MB, 16 more works merged after review by eye, one dead Commons file replaced.
- **M14.4 — The door, desktop.** `/art`, nav, cloth, warp, rig, labels, hover, plate, filters, search, `/art/list`. Done when it matches the mockup's front in the user's browser and the desktop budget is measured.
- **M14.5 — The web.** Threads from the catalogue, ribbons, hover stitches, pull, walk, orbit, turn. Done when it matches `art-loom-web.html` and the budget holds with every stitch drawn.
- **M14.6 — The phone.** §7 phone spec, tested by the user on a real device.
- **M14.7 — Patterns.** The gold thread, six reviewed pattern files, schema gate. Can run beside M14.6.
- **M14.8 — Bridges and launch.** §8, Open Graph, changelog stanza, `CLAUDE.md` (nav, feature section), `docs/PLAN.md` status.
- **M14.9 — Growth (ongoing).** Curated batches of at most 100 through §4.7, first where the cloth is thinnest: medieval manuscripts, then public-domain work after 1900, then the most-painted scenes. Target 3,000 works; every batch rebakes.

---

## 10. Risks and guards

- **It reads as a contact sheet.** The grade, anchors, warp and tear are what prevent it, and each was added because the first prototype failed without it. None of them is optional polish.
- **A wrong saga is visible.** Heuristic links will misplace some works. Bands are approximate by design, the plate shows only real links, and overrides fix what review finds.
- **A wrong figure link draws a wrong thread.** Links are read from titles and exact categories only, carry their provenance, and an override can remove one. The link count per rule is in `loom:metrics`, and new rules get a precision sample before they ship.
- **The tangle.** Drawn all at once the threads cannot be traced. That is acceptable on the back, where they are the view, and never on the front, where only held threads show.
- **Commons hot-linking.** Only the capped reading-distance pool hot-links. The atlas never does. The bake is rate-limited and identifies itself.
- **License drift.** A file relicensed or deleted on Commons surfaces in `verify:culture`; a tile without a free license is a gate failure.
- **Git growth.** Sheets are binary; rebake at batch boundaries only.
- **Share previews.** Much of this art is nude, and the audience comes through Instagram. Open Graph falls back to a cloth image for works flagged in overrides.
- **Interpretive overreach.** Resemblance is not influence, and a share is not a cause. Guards in §3.
- **Scope.** Sound, curated tours and the fringe of modern media are good ideas and are not in M14.

---

## 11. Decision log

| Decision | Choice | Date |
|---|---|---|
| Door and world | `ART` at `/art`; the world is the Loom. Plain door word beside Galaxy, Lands, Myths | 2026-11-01 |
| Metaphor | Loom over the Shield of Achilles (repeats the galaxy's radial grammar), a giant vase (repeats the Spindle's rotation), a 3D stoa (no overview), Warburg panels (kept as Patterns) | 2026-11-01 |
| Axes | Across: myth order, shared with the Spindle. Down: making order, in rank time | 2026-11-01 |
| Source of truth | Culture files stay authored; a derived catalogue plus a small overrides file, rebuilt offline | 2026-11-01 |
| Tile unit | One physical work, merged across figures, stories and scans | 2026-11-01 |
| Saga resolution | Story, cast, divine type, one relation hop, then *Other tales*; provenance stored | 2026-11-01 |
| Atlas | Baked layout-independent sheets, composed into a cloth texture on the client | 2026-11-01 |
| Colour | Pass-through, no composer on this door; the wool grade fades before reading distance | 2026-11-01 |
| Credits | Commons-derived `<WorkCredit>` on every image surface, first milestone | 2026-11-01 |
| Growth | `data/art/collection/` beyond the Legacy cap, reviewed batches of at most 100 | 2026-11-01 |
| 3D and the network | The cloth stays the archive. The web grows out of it: a pulled work lifts with its neighbours, and the back of the cloth shows every thread. A free-floating graph was rejected as a second Galaxy | 2026-11-01 |
| Figure links | Shelves, titles and exact Commons categories, with provenance; captions stay out | 2026-11-01 |
| Thread shape | One thread per figure, a chain in time order; a thread held by one work fades along its length | 2026-11-01 |
