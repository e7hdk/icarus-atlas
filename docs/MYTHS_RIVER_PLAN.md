# The River of Myth — redrawing `/stories` as a river system

**Status, 2026-09-28: R0 (sketch) and R1 (engine) done. R2 changed course: a flat river scene was built and dropped — laid on a plane, the myths read as a chart of neon bands, and the river's 15:1 length never framed well. The engine's layout is now spun onto the Spindle instead (`src/features/stories/threadedSpindle.ts`, `SpindleThreads`): each saga one continuous thread down the spindle, its stories stars on it in time order, threads touching where the sources say the myths meet, parting only at the Nostoi. It keeps the Spindle's tunnel, rolling-marble rig and navigation, and is previewed at `/stories/river` beside the old Spindle at `/stories`.** Open question 1 (the stage) is settled by that: the Spindle. Orphans are short streams (a tributary where they meet a saga); the name stays undecided. The engine is `src/features/stories/river.ts` on the shared `timeAxis.ts` and `sagas.ts`; `pnpm validate-myth-river` gates it, `pnpm myth-river:metrics` reports it, `pnpm myth-river:sketch` draws it flat to gitignored `research/myth-river/sketch.svg` (the `myth-river` prefix keeps these apart from the map's geographic `rivers` scripts). The threads will replace the Spindle's branching world-lines on the Myths door.
The page shell, the story panel, search, the legend, the chronology pipeline and
the lens stay; the geometry, the scene and the camera are rebuilt.

## 1. Why the Spindle reads as artificial

Measured on the current roster (176 stories, 38 crossings) with the layout
unrolled flat and its helix undone:

- **The data is not a tree, but the layout draws one.** 23 roots, 113 stories at
  depth 1, 36 at depth 2, 4 at depth 3. A saga is mostly a *sequence* of
  episodes. The Spindle still gives every episode its own thread that peels off
  the trunk and stops after ~76 world units — under 1% of the 11,500-unit
  corridor — so each episode reads as a short curled whisker going nowhere.
- **Motion that means nothing.** The whole field winds ~13 full turns along the
  corridor (`TWIST_PER_UNIT` × length) and every trunk rides a sine meander.
  From inside the tube the trunks sweep around the viewer as hooks and arcs;
  unrolled, they wriggle like snakes.
- **The one true fork is a rake.** The thirteen Returns leave the Nostoi at one
  instant as a rigid comb.
- **The myths never touch.** The 38 sourced crossings only appear on focus, the
  14 stories outside any cycle float as loose dots, and most of the wall is
  empty.
- **The tunnel itself.** Seen from inside a cylinder every line converges on the
  vanishing point and bends around the viewer; the structure cannot be read
  from any single view.

## 2. The idea

The myths flow like rivers of light. Each saga is one **stream**; its episodes
are **stars on the stream**, in the order they happen, so travelling the stream
is travelling from one star to the next. Streams run side by side where sagas
are concurrent, **touch where the sources say they meet**, and **split only where
the story itself splits**. Upstream is the timeless divine prologue — the
spring; downstream the heroic age braids through the plain, gathers at Troy and
scatters again in the Returns.

This is a storyline visualization (the idiom of xkcd's *movie narrative charts*;
Tanahashi & Ma 2012; Liu et al., StoryFlow 2013) rendered in the atlas's own
light: every bend is caused by a neighbour, a meeting or a fork — never by
decoration.

## 3. What every shape means — the contract

| Shape | Meaning | Source in the data |
|---|---|---|
| **Stream** | One line of action through time | a saga root (shelf root), or a story outside every cycle (`heroic`) |
| **Reach** | A sub-saga that *follows* its predecessor: a named stretch of the same stream, never a branch | a child with children whose span starts after its elder sibling's (Cypria → Trojan War → Sack of Troy → Nostoi) |
| **Star** | A story, at its chronological position on its stream | every story; the saga root marks the stream's source |
| **Distributary** | The story splits into simultaneous lines | `forkChildren: true` (the Nostoi's thirteen returns) |
| **Confluence** | Two myths meet | a sourced crossing (`data/story-crossings.json`), lens-gated by its `sources`, between myths running at the same time: the two streams draw together, touch at the moment between their two stars and part again — a kiss — and a knot of light marks it. A short gap in time is bridged by a faint trickle (the later stream rises early); a myth rising where another stream forks leaves the fork's mouth beside its distributaries (the Odyssey at the Nostoi, kept by Memnon ~ Nekuia), and its meeting is a knot at the mouth |
| **Tributary** | A story outside every cycle feeds a saga | a sourced crossing between a lone story and a saga: the story's short stream flows into the saga and ends inside it (the Danaids into Ovid's Io, Phineus into the Argonautica) |
| **Thread of fate** | Two myths are tied across time | a sourced crossing between myths too far apart to touch (the Nekuia's dead, Ganymede and the house of Troy), or kept apart by the streams between them: a faint arc from star to star that bends no stream |
| **Open mouth** | An unfinished myth runs on past its last star and dissolves | `open: true` (Cosmogony, Metamorphoses) |
| **Source** | The timeless divine prologue upstream of the dated plain | the timeless set of `buildChronologyYears` (Cosmogony → Reign of Cronus → Titanomachy) |
| **Width** | How much of the myth flows there | ∝ √(stories near in time): a stream swells where its episodes crowd (the Trojan War) and runs thin where they are sparse (Ovid's long thread); a distributary rises thin from its fork |
| **Colour** | The saga | `SAGA_ACCENT` (unchanged) |
| **Dimmed reach/star** | Not attested under the active lens | `isStoryAttested` (unchanged) |

Rules that keep the drawing honest (hard rule 2):

- A confluence, a tributary and a thread of fate are drawn **only** for a
  sourced crossing, and every lens-visible crossing is drawn as one of the
  three (or joins two stories of one stream, which the stream already does).
  Characters shared between sagas (Heracles in 7, Theseus in 6) never draw a
  meeting.
- A distributary is drawn **only** where `forkChildren` says the actions are
  simultaneous; sequential sub-sagas are reaches of one stream.
- No geometry without a cause: no helix, no random meander.

What the current roster becomes:

- **Source:** Cosmogony → Reign of Cronus → Titanomachy (14 episodes).
- **Undated cycles:** the Dionysus cycle has no chronographic anchor; as on the
  Spindle, it falls back to the global era→year curve, which lands it beside
  the Theban myths it belongs to (Semele is Cadmus' daughter) until a chronology
  batch dates it (hard rule 5).
- **Plain (dated, ~2200 → 848 BC):** Metamorphoses runs almost the whole length
  as a thin Ovidian thread (36 stars) touching other myths at 9 crossings;
  Theban (−1540 → −1200), Perseus, Heracles (−1290 → −1104), Theseus,
  Argonautica, the Trojan cycle; the 14 stories outside any cycle become short
  streams near their contemporaries, drawn toward their crossing partners.
- **Troy and after:** the Trojan stream runs its reaches Cypria → War → Sack →
  Nostoi and fans into thirteen distributaries at the Nostoi. The Odyssey rises
  from the same mouth and touches Nestor's distributary at Pylos — the
  Telemachy; Menelaus at Sparta is kept apart by the lanes and drawn as a
  thread of fate.

## 4. Layout engine — `src/features/stories/river.ts`

Pure TypeScript, deterministic, blind to the order of its input, no randomness;
~0.15 s for 176 stories and 38 crossings, so R2 computes it on the server, never
on the client's first frame. Validated like the galaxy layout. It runs in stages:

1. **Time axis** (`timeAxis.ts`, shared with the Spindle: the timeless set, the
   era → year curve, the year/rank blend `YEAR_BLEND = 0.4`, the age bands). The
   River's axis puts the timeless prologue in the source share and the dated
   myths on the blended scale, where a meeting between two myths near in the
   telling takes room on the rank scale (`MEET_ROOM`), so the crowded crossroads
   of the heroic age get space to draw together and part.
2. **Streams.** Streams, reaches, distributaries and each stream's ordered stars
   from `parent`, `forkChildren`, `open` and the chronology years; a stream whose
   last star forks ends there, its water in the distributaries. A stream's run
   covers its stars' exact moments.
3. **Meetings.** Each crossing becomes a kiss, a tributary, a trickle-bridged
   kiss, a knot at a fork's mouth or a thread of fate (§3). Kisses are scheduled
   one by one, most constrained first, at the slice nearest their moment that
   keeps two meetings of one stream `MEET_GAP` apart.
4. **Lane order.** One permutation of all streams, searched so that as few
   streams as possible stand between two that meet and none inside a fork's
   mouth, seeds a permutation per *epoch* (the stretch of time around each
   meeting or mouth). The epochs are then searched together: a stream in the
   way of a meeting costs `MEET_WEIGHT`, every change of order between epochs —
   a *pass* — costs `PASS_WEIGHT` (far more between two returns of one fork). A
   meeting still kept apart becomes a thread of fate.
5. **Lane positions.** Per slice, least-squares positions that keep the order
   and the gaps (half-widths + clear water; the kiss profile while two streams
   meet, never sinking deeper than `KISS_DEPTH` of the thinner stream; zero at a
   fork's mouth, opening over `DELTA_SLICES`). Deterministic projected
   relaxation: tension passes settle the lanes, then stiffness passes round
   every bend. Two streams passing each other form one rigid unit bound by the
   lanes around them, and cross over along a smooth ramp that begins once their
   own last kiss has ended — a pass is a long soft diagonal, never a step, and
   never spills into a third stream or through a neighbour's kiss.
6. **Curves.** R2 draws Catmull–Rom curves through the slice points; stars sit
   on the curve at their time.
7. **Output.** `RiverLayout { streams, stars, byId, confluences (kiss |
   tributary | knot, with their windows), bridges (far | apart), passes, forks,
   unmet, ages, yMin, yMax }`.

On the real roster: 36 streams (13 distributaries, 10 lone), 14 kisses, 4
tributaries, 2 knots at the Nostoi's mouth, 11 threads of fate (1 kept apart by
the lanes), 7 crossings within one stream — and 3 passes.

**Gate: `pnpm validate-myth-river`** — every story is one star on one stream, in
time order and on its stream's run; every sourced crossing drawn exactly once;
no ribbon overlap outside a kiss, a fork's mouth or a pass; every kiss touches
and every tributary ends inside its partner; determinism, including a reversed
input; readability limits on passes, meetings kept apart, the sharpest bend and
the river's height. **Report: `pnpm myth-river:metrics`** (`--json`) — the same
measurements (`scripts/lib/myth-river-metrics.ts`) plus sideways travel and the
narrowest clear water.

## 5. Stage and rendering — `src/components/stories/river/`

- **Stage.** The river system lies on a gently tilted plane in the cosmic dark
  (the galaxy's palette, the same starfield and nebula language). Time flows away
  from the viewer down a slight slope: the divine source behind and above, the
  heroic plain ahead, the Returns spilling out into a sea of stars. Age bands are
  faint contour lines across the plane with their labels.
- **Ribbons.** Flat ribbons on the plane (merged triangle strips, one draw), a
  soft profile — a bright core line and a falloff — authored below the HDR knee;
  per-vertex attestation for lens dimming.
- **Flow.** Slow sparkles drifting downstream (instanced points whose position
  the vertex shader reads from a data texture of the stream polylines — one draw,
  no CPU per frame). Static under `prefers-reduced-motion`.
- **Stars.** The galaxy's point-spread stars (`shaders/psfStar.ts`), saga roots
  larger, the selection ring in the shader — one visual language across the atlas.
- **Confluences.** A point-spread knot and a faint ring; hover shows the
  crossing's note and place.
- **Post.** The galaxy's HDR pipeline (bloom only past 1.0, `HighlightRolloff`)
  instead of the Spindle's low-threshold bloom.
- **Labels.** Stream names at their sources; titles for the hovered, selected
  and neighbouring stars.

**Superseded.** The stage above was built in R2 as a flat river and dropped
(see the status). The layout now lives on the Spindle: time runs down the
spindle's length, the lane order becomes the angle around it, the whole winds
five turns over time, and each saga is one glowing thread as thick as its myth
is dense there — eased through its samples, pulled together with its partner
over every kiss until they share one point.

## 6. Camera and interaction — `river/RiverRig.tsx`

- The journey opens at the source (Chaos), as today.
- Selecting a star glides the camera to a vantage upstream and above it, looking
  downstream: you see where the story flows next.
- **↑ / ↓** the previous / next star on the current stream; at a stream's end,
  the next story in time.
- **← / →** the nearest star on the neighbouring stream at the same moment —
  walking across the braid.
- **Esc** steps out and holds the camera. **Wheel** pulls back to the whole
  river and in again; **drag** pans along the plane.
- **Mobile:** the same gestures; the story panel's bottom sheet and its
  ‹ earlier / later › buttons map to ↑ / ↓.
- Search, the legend (click → fly to the stream's source) and the story panel
  keep their current UI.

## 7. What stays, what goes

- **Stays:** the `/stories` route, `StoryPanel`, `StorySearchOverlay` (fed the
  river's `byId`), the legend, `buildChronologyYears`, lens gating,
  `SAGA_ACCENT` / `SAGA_LABEL` / `SAGA_ORDER` / `resolveSaga` (moved to
  `src/features/stories/sagas.ts`).
- **Goes at the switch:** `SpindleLines`, `SpindleStars`, `SpindleCrossings`,
  `SpindleControls`, the Spindle scene in `MythsSpindleView` and the layout in
  `spindle.ts`.

## 8. Milestones

- **R0 — Sketch.** ✓ A script lays out the river from the real roster and
  renders it as a flat SVG (time × lane): streams, reaches, the Nostoi delta,
  the confluences. No app change.
- **R1 — Engine.** ✓ `river.ts` in stages, `timeAxis.ts`, `sagas.ts`,
  `validate-myth-river`, `myth-river:metrics`.
- **R2 — Scene.** ✓ (changed course) The flat river scene was built and
  dropped; the layout is spun onto the Spindle instead and previewed at
  `/stories/river` (a static, prerendered route) beside the old Spindle.
- **R3 — Journey.** `RiverRig`, keyboard and click navigation, mobile gestures.
- **R4 — Polish.** Flow sparkles, lens transitions, labels; 60 fps on desktop,
  steady on mid-range phones.
- **R5 — Switch.** The river becomes the Myths door; the Spindle code is removed;
  CLAUDE.md (Stories), docs/CHRONOLOGY.md and the PLAN decision log are updated.

## 9. Open questions

1. **Stage.** Abstract rivers of light on a tilted plane in the cosmic dark
   (recommended: one language with the galaxy), or a mythic landscape — a spring
   on Olympus, a delta into the sea?
2. **Name.** Keep *The Spindle of Time* (Νῆμα τοῦ Χρόνου), or rename to *The River
   of Myth* (ὁ ποταμὸς τῶν μύθων)?
3. **Stories outside every cycle.** Short streams near their contemporaries,
   drawn toward their crossing partners (recommended), or one shared
   "Heroic Ages" stream?
4. ~~Dating the Dionysus cycle~~ — decided: the era→year fallback, as on the
   Spindle (see §3).

## 10. Risks

- **Braid quality** (crossings, wiggles) in the crowded heroic age, where 8+
  sagas run within ~150 years — the R0 sketch and the metrics exist to catch it
  before any rendering work.
- **Width budget** when many streams are concurrent: widths scale with the space
  available, and the camera's default framing stays local.
- **Phones:** ribbons, sparkles and point-spread stars need a budget; sparkles
  drop first under load.
