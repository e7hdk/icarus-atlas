# EPHEMERIS_PLAN.md — The Ephemeris (the daily sky)

**Status: DRAFT awaiting review.** Milestone M12 in docs/PLAN.md §8.

The Ephemeris (Greek *ephēmeros*, "of the day" — an astronomer's daily table of
star positions) is the atlas's daily ritual: every day one star of the sky is
the **star of the day**, every week tells one saga as the **constellation of
the week**, and on the days the ancients kept their festivals, the calendar of
Classical Athens takes over the sky. It answers the 1484-star problem — "where
do I start?" — with a single, deliberate door that changes every midnight in
Athens. And the door is not a page: it opens as the **Proem** (§6), a
five-beat telling staged inside the galaxy itself — the codex stays the place
where depth lives.

Everything the Ephemeris shows is existing sourced data (summaries, relations,
disputes, Legacy artworks, stories). The feature adds **no new mythological
facts** until the festival layer (M12.4), which enters as lens-independent
reference data under the same verification discipline as everything else.

---

## 1. Non-goals

- No backend, no accounts, no push notifications. Selection is a pure function
  of the date and the data — every visitor sees the same star on the same day.
- No gamification pressure: no streaks, badges, or scores. (localStorage may
  later remember Oracle answers; nothing more.)
- No "importance" ranking anywhere in the UI. Spotlight eligibility is an
  internal editorial gate only (D9).
- No Roman calendar. Ovid's *Fasti* is a tempting lens flavor but out of scope.
- No share/OG-image pipeline in this milestone.
- No dedicated `/today` altar page. The daily experience lives in the galaxy
  (the Proem, §6); a routed wrapper only becomes worth building if sharing/SEO
  demands it later.

## 2. Decision log

- **D1 — Deterministic, client-computable selection.** No server state. The
  day flips at **midnight in Athens** (`Europe/Athens` via `Intl`), uniform for
  all visitors and pleasingly thematic.
- **D2 — Eligibility rule**: `hasCulture || (degree >= 4 && castAppearances >= 2)`.
  Audited 2026-07-11 against live data (1484 characters, 4264 relations,
  176 stories, 341 culture files): pool = **453**. Probes: `icarus` IN (culture
  saves the app's namesake at degree 1), `machaon` IN (woven + storied, no
  culture yet), `amycus-centaur` OUT (Ovid wedding filler), `taras-hero` OUT
  (degree-0 eponym), `eurycleia` OUT (pinnable later). Reference-file existence
  is deliberately **not** a signal — batches wrote references for filler too.
  Refinement (M12.1): a culture file only counts when at least one shelf is
  non-empty — an "honest empty Legacy" (the M2.20 abstractions) documents the
  absence of reception, it is not curation of presence. Pool after the
  refinement: **429** (a ~14-month cycle).
- **D3 — No-repeat daily cycle.** A seeded Fisher–Yates permutation of the
  eligible roster (seed = cycle index) walked one star per day: ~15 months
  without a repeat at today's pool. A deploy that changes the roster re-deals
  the current cycle — accepted; the golden-sequence validator (§8) makes such
  changes deliberate rather than silent.
- **D4 — Weekly themes from the sagas.** Auto rotation over top-level stories
  (`parent == null`, ≥ 4 eligible cast members) in the era order `loadStories()`
  already provides — the year walks mythic time from cosmogony toward the
  returns. Day picks walk the saga's cast in cast order (narrative order),
  filtered to the eligible pool. Curated overrides in `data/spotlight/weeks.json`.
  **Repeat-breaker (M12.3):** era-neighbour sagas share casts (cosmogony hands
  Cronus straight to the reign of Cronus), so today's pick avoids yesterday's
  shown star — colliding week slots step forward along the cast, exhausted
  casts fall to the cycle. The avoid-chain folds from a fixed 14-day horizon,
  so every visitor computes the identical sequence. This supersedes the
  type-interleave idea from the original M12.3 scope.
- **D5 — Festivals are reference-layer data, not lens facts.** Festival dates
  come from inscriptions, scholia and modern scholarship, not from the seven
  lenses — so the layer is lens-independent (like `data/reference` and the
  Pleiades geo data), pinned to the **Attic calendar as recorded**, with
  free-text `testimonia` citations. Pausanias-lensed festival prose on
  character pages remains possible separately and is out of scope here.
- **D6 — Swappable date resolver.** v1 maps each festival to curated
  `conventionalDates` (traditional modern placement, labeled as such). v2.5
  replaces the resolver with a computed **Attic calendar reconstruction**
  (generated astronomy table + Metonic intercalation convention, labeled
  "reconstructed"). The festival data itself never changes between modes.
- **D7 — Override precedence**: festival deity > curated week day > auto week
  day > daily cycle. An override must resolve to an eligible-or-pinned
  character, else it falls through to the next rule.
- **D8 — Editorial control** via `data/spotlight/spotlight.json`
  (`pins`/`exclusions`) rather than threshold debates.
- **D9 — Prominence never surfaces.** No UI copy, tooltip, sort order or badge
  may reveal the eligibility gate. Out-of-pool figures remain fully present in
  galaxy, search and stories.
- **D10 — Validator culture, no test framework.** Correctness ships as
  `pnpm validate-ephemeris` (probes, determinism, golden sequence), beside
  `validate-data` / `validate-layout`, matching the repo's existing gates.
- **D11 — The destination is the Proem, not a page.** The chip opens the card
  (a glance); the card's primary action stages the in-galaxy **Proem** (§6);
  the codex page remains the depth door and gains only a quiet day laurel.
  A dedicated `/today` page stays rejected (non-goals).
- **D12 — Proem lines are assembled, never invented.** Every beat renders
  existing sourced data (epithets, domains, summaries, relations, `topic`
  disputes, Legacy artworks) — no synthetic hymn text. The quarrel beat shows
  competing variants side by side and never flips the global lens mid-proem.
- **D13 — Always escapable, always degradable.** Beats advance on the reader's
  click; skip and ESC everywhere; `prefers-reduced-motion` and the mobile
  guarded experience run the same beats as a static card sequence with no
  camera motion.

## 3. Architecture

```
src/features/spotlight/
  eligibility.ts   pure: (characters, relations, castCounts, cultureIds,
                   overrides) -> sorted eligible roster
  calendar.ts      Athens date math: athensDate(now), dayIndex since epoch,
                   isoWeek, next-midnight timer helper
  selection.ts     pure: (roster, dayIndex, weekPlan, festivalsToday,
                   overrides) -> DayPick
  weeks.ts         auto saga rotation + curated weeks merge -> WeekPlan
  festivals.ts     v1 conventional-date resolver; v2.5 swaps internals only
  proem.ts         pure beat builder: (star, relations, lens facts, dispute,
                   culture) -> ProemScript — five data-driven beats (§6)
  build.ts         server-only assembly of EphemerisData (import 'server-only')
  store.ts         zustand: { data, pick, cardOpen, proem: { active, beat },
                   spotlightRelationIds } (client)
src/types/spotlight.ts   SpotlightOverrides, WeekEntry, Festival, AtticMonth,
                         DayPick, EphemerisData
src/components/hud/EphemerisChip.tsx     chip in AtlasBar
src/components/hud/EphemerisCard.tsx     GlassPanel overlay (all routes)
src/components/hud/ProemOverlay.tsx      staged beat cards over the scene (M12.2)
src/components/galaxy/EphemerisBeacon.tsx   ring pulse at today's star
src/components/galaxy/WeekConstellation.tsx faint polyline (M12.3)
scripts/validate-ephemeris.ts            pnpm validate-ephemeris
scripts/build-attic-calendar.ts          M12.5, generates the moon table
```

**PRNG reuse.** `hashString` and `mulberry32` already live in
`src/features/galaxy/layout.ts`. M12.1 lifts them verbatim into
`src/lib/prng.ts` and re-imports them in `layout.ts` — a move, not a change;
baked positions and `LAYOUT_VERSION` are unaffected.

**Data flow.** `RootLayout` already awaits `loadAtlasData()`. `build.ts` adds
one call beside it: loads stories (`loadStories()`), culture ids (readdir),
spotlight overrides and festivals, computes the roster + week plan, and returns
a compact `EphemerisData` (roster ids, saga rotation table, curated weeks,
festival table; ≈15 KB). The layout passes it to a client `<EphemerisHost>`
mounted beside `GlobalOverlays`.

**Hydration.** The server never renders "today". `EphemerisHost` computes the
pick after mount (chip shows a skeleton shimmer until then) and re-computes on
a timer at the next Athens midnight. All date math flows through
`calendar.ts`; pure functions take `now: Date` as an argument — nothing below
the host calls `Date.now()` directly.

## 4. Selection algorithm (normative)

- `EPHEMERIS_EPOCH = '2026-01-01'` (Athens). `dayIndex` = whole days between
  the Athens calendar date of `now` and the epoch, computed via `Date.UTC` on
  extracted Y/M/D parts (DST-proof).
- Roster = eligible ids sorted lexicographically (stable base order).
- `cycle = floor(dayIndex / N)`, `pos = dayIndex mod N`,
  `perm = fisherYates(roster, mulberry32(hashString('ephemeris-cycle-' + cycle)))`,
  cycle pick = `perm[pos]`.
- Week: ISO week of the Athens date; `weekIndex` since the epoch's ISO week;
  auto theme = `sagas[weekIndex mod sagas.length]`; day slot = Mon..Sun index;
  auto week pick = nth eligible cast member, if any — else fall through.
- Precedence per D7. Result: `DayPick { id, reason: 'festival'|'week'|'cycle',
  festivalId?, week?: { storyId, title, day, of } }`.
- Optional refinement (M12.3, behind a constant): interleave the permutation
  round-robin by `CharacterType` so runs of same-type days don't occur.

## 5. UI surfaces

- **Chip** (AtlasBar, beside `HudActions`): a quiet `★` circle sized like the
  settings button, tinted in today's `TYPE_GLOW`; the name joins only at `lg`
  (`★ MEDUSA`, max-width capped) where the centered MainNav has clearance.
  Opens the card. Skeleton until the pick resolves. (First UX review: a full
  `TODAY ★ NAME` pill overran the bar's grammar and collided with MainNav.)
- **Card** (GlassPanel overlay, every route): type badge, name + Greek name;
  lens-aware summary line (reuse the lens fact-filtering from
  `src/features/lens`; consensus outside the galaxy); context line
  (`This week: The Trojan War — day 4 of 7` / `Today is the Anthesteria — the
  flowers of Dionysus`); **dispute teaser** when the figure carries a `topic`
  with competing variants ("Two traditions disagree about her birth ⚖");
  artwork thumb when culture data exists (`next/image`, Commons host already
  whitelisted); primary action **Begin the proem** (§6), then the doors:
  *Fly to star* (`/?fly=<id>`), *Read the story* (week's saga if the star is in
  its cast, else first appearance via `features/stories/appearances`),
  *Open codex* (`/character/<id>`), city link on festival days; plus a
  *Yesterday* link (free — the cycle is deterministic) and a *Tomorrow: ?*
  tease that leaks only tomorrow's `TYPE_GLOW` color.
- **`?fly=` param**: `GalaxyView` reads it once on mount and calls the existing
  `select(id)` — CameraRig's fly-to and panel behavior come free, and the URL
  becomes shareable. `?proem=1` rides the same path, then starts the beats
  once the scene settles.
- **Beacon** (galaxy only): one ring mesh at the star's position, slow
  shader-driven pulse (uniform time), colored from `TYPE_GLOW`, additive and
  ≤ 1 draw call; visible (dimmed) while another star is selected; respects
  `prefers-reduced-motion`. Hard rule 4 applies: 60 fps or it ships without
  the pulse.
- **Week constellation** (M12.3): faint polyline through the week's cast in
  day order, drawn with the relation-line approach at low opacity.
- **Day laurel**: visiting `/character/<id>` on the star's own day shows a
  quiet `★ Star of the day` marker by the breadcrumb strip — the same codex
  page, crowned for its day.
- **Heortologion** (`/festivals`, post-M12.5 UX review): the festival year as
  an **instrument, not a catalog** (a month-by-month list read as a list and
  was rejected). The **year wheel** (`FestivalWheel`, pure SVG) IS the
  interface: twelve Attic months as a ring, every feast a gold star on its
  opening day, today a violet needle, the reconstructed date in the hub.
  Selecting a star (or a month name; feastless months sit dim) swings a gold
  **alidade** — the astrolabe's sighting rule — onto it (700ms ease swing,
  ping halo on the chosen star), and ONE feast at a time lies on the
  **plaque** beneath (`HeortologionView`): date overline, name + Greek,
  small-caps meta (deity links in `TYPE_GLOW`, city/sanctuary seat,
  penteteric note, live countdown chip via `nextOccurrenceOf` — gold ★
  "today — day X of Y" while it runs), summary, aition door, testimonia
  footnote. ‹ › arrows walk the year cyclically; selection writes the URL
  hash (`replaceState`), and with no hash the instrument aims itself at
  today's or the next feast via the store. The door in: the card's
  **calendar strip** — one gold Link uniting the Attic-date line, the
  feast-day announcement and the "Next feast" tease ("Open the
  Heortologion"; on feast days it deep-links `#<festival-id>`). Deliberately
  NOT a MainNav tab — the Heortologion is the Ephemeris layer's depth page,
  not a fourth world; on `/festivals` no nav door lights (`doorFor` → null).
  Festival depth (summary, founding myth) lives here, so the card's feast
  block shrank to the strip. The server resolves feasts into plain display
  entries (`loadFestivals`); the aim, countdowns and needle ride the
  Ephemeris store so the static page never goes stale.
- **The bar owns its strip** (first UX review): no fixed overlay may claim the
  top 3.5rem — right-opening surfaces start below the bar (SettingsPanel, the
  card) or pad their content past it while keeping a full-height silhouette
  (CharacterPanel), and the bar's right cluster stays compact. The Proem
  (M12.2) inverts the rule: while it plays, the whole bar retracts via the
  existing scroll-hide mechanic and the stage owns the screen.

## 6. The Proem — the day's telling (normative)

The chip opens the card; the card's primary action opens the **Proem**: a
~45–60 second, five-beat telling staged inside the galaxy. The codex is where
depth lives; the Proem is the experience. Beats advance on click/tap — never
on a timer alone — and *Skip to codex* stays visible throughout. Beat order is
fixed; a proem never grows a sixth beat.

| # | Beat | Line (assembled, never invented) | Stage direction |
|---|---|---|---|
| 1 | **Invocation** | `Of MEDUSA we sing — the Gorgon, the sea-bride.` — built from name + kinds/epithets/domains | camera flies in (existing `select()`/CameraRig); ambient dims; display type set in the star's `TYPE_GLOW` color |
| 2 | **The thread** | up to three sourced edges: `loved by Poseidon · slain by Perseus · mother of Pegasus` | each relation line lights in 3D in sequence (hover-highlight machinery, driven by `spotlightRelationIds`) |
| 3 | **The telling** | one summary sentence under the active lens, citation as a footnote | close-up holds |
| 4 | **The quarrel** | `Hesiod says …; Ovid says …` + quiet ⚖ | textual only — the global lens never flips mid-proem (edge re-routing would wash the stage) |
| 5 | **The trace** | the Legacy artwork + `Caravaggio, 1597` | image fades in as a backdrop card |

Beats 4–5 drop out silently when the star carries no `topic` dispute / no
culture data; the eligibility gate guarantees beats 1–3 always have material.
Then **the doors**: *Descend into the codex* · *Visit the city sky* (when
`residences` exist) · *Read the myth* — plus the *Tomorrow: ?* tease. During a
themed week the doors row carries the continuity line (`Day 4 of the Trojan
War — yesterday Hector fell`); on festival days (M12.4) beat 1 opens with the
festival instead (`Today is the Anthesteria — the flowers of Dionysus`).

**Staging (second UX review — "more hype"):** the Proem plays as a title
sequence, not a subtitle card. Letterbox bars carry all chrome (story-segment
progress, `Skip to codex`, `continue ▸`, the date); the beats are full-bleed
classical type over the living galaxy — the invocation settles out of wide
tracking in the star's own `TYPE_GLOW` with a layered glow, the thread stacks
monumental names, the trace breathes with a slow Ken Burns inside a
glow-rimmed frame. The left screen edge steps back; everywhere else advances.
Until today's telling is opened, the AtlasBar chip beckons with a soft halo in
the star's color (`ephemeris-seen` stamp in localStorage — never a badge, just
light). Thematic dressing (third UX review — "more sparkle"): a gold Greek-key
hairline runs the letterbox inner edges, a deterministic scatter of ✦ stage
sparks twinkles over the upper stage, and a glow-tinted rule crowns the
invocation. The stage also carries its own music: `public/audio/proem.mp3`
crossfades from the ambient score when the letterbox closes in and hands back
on exit; AmbientAudio owns both elements, and a missing file degrades silently
to the ambient bed.

Fallbacks (D13): `prefers-reduced-motion` keeps the same monumental
composition with all `motion-safe:` animation stripped — no camera motion, no
settling type, same words at the same scale; the mobile guarded experience
plays identically without the flight. Off the galaxy route, *Begin the proem*
navigates to `/?proem=1` and the beats start once the scene settles. ESC at
any beat closes back to the card.

## 7. Data files & schemas (zod in `src/lib/schemas.ts`)

- `data/spotlight/spotlight.json` — `{ pins: string[], exclusions: string[] }`.
  Ships in M12.1 as empty lists. Checks: ids exist, no overlap.
- `data/spotlight/weeks.json` — array of
  `{ isoWeek: 'YYYY-Www', story: StoryId, title?: string,
     days?: Partial<Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', CharacterId>> }`.
  Checks: story + day ids exist, isoWeek unique and well-formed; warn when a
  day id is neither eligible nor pinned.
- `data/festivals/<id>.json` —

  ```ts
  interface Festival {
    id: string;
    name: string;              // "Anthesteria"
    greekName?: string;        // "Ἀνθεστήρια"
    deities: string[];         // CharacterIds, >= 1, in day order (windows rotate)
    place?: string;            // Geo place id — city OR sanctuary (Olympia
                               // already lives in places.json as a sanctuary,
                               // pleiadesId 570268); the UI only links a door
                               // when the place is a city
    panhellenic?: boolean;
    games?: { cycleYears: 2 | 4 };
    atticDate: {
      month: AtticMonth;       // 12-value enum, hekatombaion..skirophorion
      days?: [number] | [number, number];  // 1..30; absent = month-known-only
      approximate?: boolean;   // scholarly uncertainty flag
    };
    conventionalDates?: string[]; // 'MM-DD' Gregorian, v1 resolver, curated
    aition?: string;           // StoryId of the founding myth, when we have it
    summary: string;           // museum-caption prose, English
    testimonia: string[];      // >= 1, e.g. "Thuc. 2.15.4", "IG II² 1367",
                               // "Mikalson (1975) 117"
    furtherReading?: string[];
  }
  ```

  Checks: deity/city/aition refs exist, days within 1..30, `conventionalDates`
  well-formed, ids unique. Multi-day festivals may carry several
  `conventionalDates`.
- `data/generated/attic-calendar.json` (M12.5, committed like
  `galaxy-positions.json`): Attic-year month starts for 2024/25–2044/45,
  generated by `scripts/build-attic-calendar.ts` (`pnpm bake-attic-calendar`,
  dev-dep `astronomy-engine`). Convention as implemented and documented in
  the file header: Hekatombaion Day 1 is the Athens day **after** the first
  new-moon conjunction following the June solstice (a first-crescent
  stand-in); each conjunction starts the next month the same way; a
  13-lunation year doubles Poseideon (`poseideon-ii`, festival-free) — which
  reproduces the Metonic rhythm without bookkeeping (8 intercalary years in
  the 21 baked); Olympiad years (astronomical ≡ 1 mod 4, anchored on 776 BC)
  record the second full moon after the solstice as the games' five-day peak.
  The UI always labels the result *reconstructed*. Day-precise festivals
  resolve on the reconstruction; day-less ones keep their conventional
  placements; monthly sacred days (`data/sacred-days.json`, Hesiod *WD*
  768–780 corpus-anchored) appear as flavor on festival-less days only.

## 8. Validation & definition of done

`scripts/validate-ephemeris.ts`:

1. **Probes** — the D2 examples asserted against live data: `icarus` IN,
   `odysseus` IN, `machaon` IN, `amycus-centaur` OUT, `taras-hero` OUT.
2. **Determinism** — recomputing a 60-day sequence twice (fresh module state)
   is identical; a cycle permutation visits every roster member exactly once.
3. **Golden sequence** — the first 14 picks from `EPHEMERIS_EPOCH` are
   snapshotted in the script; any drift (roster change, algorithm change)
   fails with a printed diff and must be updated deliberately in the same PR.
4. **Precedence** — synthetic fixtures: a festival date resolves to the deity;
   an excluded deity falls through to the week pick.
5. **Proem** (from M12.2) — `ProemScript`s build for the probe ids; beats 1–3
   always exist; every relation, citation and artwork a beat references exists
   in the loaded data.

Every M12.x closes the way PLAN.md already demands:
`pnpm lint && pnpm build && pnpm validate-data && pnpm validate-layout &&
pnpm validate-ephemeris` green + a manual UX review together.

## 9. Milestones

- **M12.1 — The engine & the chip (v1).** `src/lib/prng.ts` lift; spotlight
  feature module (eligibility, calendar, selection with cycle-only picks);
  `data/spotlight/spotlight.json` (empty); `build.ts` + `EphemerisHost` wiring
  in `RootLayout`; chip, card with its doors (the proem lands in M12.2,
  week/festival lines later), `?fly=` handling, beacon; `validate-ephemeris` (probes, determinism, golden sequence);
  schema + validate-data checks for spotlight.json. *Acceptance:* identical
  pick for a fixed date across machines/reloads; chip + card work on every
  route; fly-to lands and opens the star; no hydration warnings; 60 fps
  unchanged with beacon on.
- **M12.2 — The Proem (v1.1).** `proem.ts` pure `ProemScript` builder;
  `ProemOverlay` staged beat cards; beat-1 camera choreography over the
  existing `select()`/CameraRig; sequenced relation-line spotlight
  (`spotlightRelationIds`); `?proem=1`; day laurel on the codex; *Yesterday*
  link and *Tomorrow: ?* tease in the card; static fallback for
  `prefers-reduced-motion` and the mobile guarded experience. *Acceptance:* a
  proem builds for every eligible star (probe-checked); beats 4–5 degrade
  silently when data is absent; skip/ESC work at every beat; 60 fps holds
  through beat transitions with lines highlighted; the global lens is
  untouched after a full run; `validate-ephemeris` gains the proem probes.
- **M12.3 — The week constellation (v1.5).** `weeks.ts` auto rotation (era
  order, ≥ 4 eligible cast), week line in the card, `WeekConstellation` line,
  `data/spotlight/weeks.json` + checks, the D4 repeat-breaker (which
  supersedes the type-interleave idea); the proem doors gain the continuity
  line (`Day 4 of the Trojan War — yesterday, Hector`). *Acceptance:* a full
  ISO week walks one saga's cast in narrative order (repeat-breaker skips
  allowed); curated week overrides win; validator covers week refs, ISO-week
  edges and the curated-pin semantics.
- **M12.4 — The festival layer, batch 1 (v2).** Festival schema + validators;
  the batch-1 roster below researched and entered **one festival at a time,
  each with testimonia** (hard-rule-2 discipline applied to a reference
  layer); curated `conventionalDates` under one editorial rule — the Attic
  day number echoes into the month's rough Gregorian counterpart (12
  Hekatombaion → 07-12); festival takeover of the card and of proem beat 1
  (`Today is the Anthesteria — …`) with multi-deity windows rotating
  (Thargelia: Artemis the 6th, Apollo the 7th) and later single-deity days
  ambience-only; place doors. Notes from the entry pass: Olympia already
  lived in `data/geo/places.json` as a sanctuary (the schema field became
  `place`), same-day ties break by alphabetical id (Oschophoria over
  Pyanepsia on 7 Pyanopsion), and the games carry **no** conventional dates —
  their penteteric anchor waits for the M12.5 reconstruction instead of being
  faked annually. Research staging in `research/festivals/` (gitignored).
  Optional corpus enrichment: pin the public-domain catalogs (Nilsson,
  *Griechische Feste* 1906; Mommsen, *Feste der Stadt Athen* 1898) so
  `pnpm corpus:search` covers festivals; Mikalson (1975) and Parke (1977)
  guide day-precision but are cited as testimonia, not reproduced.
- **M12.5 — The living Attic calendar (v2.5).** `build-attic-calendar.ts` +
  generated table; resolver swap in `festivals.ts`; the card gains
  `12 Anthesterion · reconstructed Attic calendar`; **monthly sacred days**
  as a quiet flavor line on festival-less days (3rd Athena, 4th Aphrodite &
  Hermes & Heracles, 6th Artemis, 7th Apollo, 8th Poseidon & Theseus — each
  entered with testimonia; Hesiod's *Works and Days* 765–828 is corpus
  material and gets first pass per hard rule 5).
- **M12.6 — The Daily Oracle & the riddle (v3, optional).** Three
  deterministic questions from the day's star: a relation question, a
  *which-poet-says* question from a `topic`'d dispute, a domain/type question;
  distractors seeded from the same-type eligible roster; answers live only in
  localStorage. Card footer UI. Plus **Reveal by riddle**, an opt-in setting:
  the chip shows `★ ?`, card and proem open on an epithet riddle (`Born of
  sea-foam…`) with a guess box wired to the existing search index — reveal on
  guess or give-up. Stretch, pending Proem reception: a **sky journal**
  (localStorage-only trail of visited days drawn as a personal constellation —
  still open). As-built spec in §11.

### Festival batch-1 roster (research targets — verify before entry)

| id | name | deities | city | attic date (target) |
|---|---|---|---|---|
| kronia | Kronia | cronus | athens | 12 Hekatombaion |
| panathenaia | Panathenaia | athena | athens | 23–30 Hekatombaion, peak 28 |
| eleusinian-mysteries | Greater Mysteries | demeter, persephone | eleusis | 15–23 Boedromion |
| pyanepsia | Pyanepsia | apollo | athens | 7 Pyanepsion |
| oschophoria | Oschophoria | dionysus (Theseus' return) | athens | 7 Pyanepsion (approx.) |
| thesmophoria | Thesmophoria | demeter | athens | 11–13 Pyanepsion |
| haloa | Haloa | demeter, dionysus | eleusis | 26 Poseideon |
| rural-dionysia | Rural Dionysia | dionysus | athens (demes) | Poseideon (month) |
| lenaia | Lenaia | dionysus | athens | 12–15 Gamelion (approx.) |
| anthesteria | Anthesteria | dionysus | athens | 11–13 Anthesterion |
| diasia | Diasia | zeus | athens | 23 Anthesterion |
| city-dionysia | City Dionysia | dionysus | athens | 10–16 Elaphebolion |
| mounichia | Mounichia | artemis | athens | 16 Mounichion |
| thargelia | Thargelia | apollo, artemis | athens, delos | 6–7 Thargelion |
| plynteria | Plynteria | athena | athens | 25 Thargelion (approx.) |
| skira | Skira | demeter, athena | athens | 12 Skirophorion |
| karneia | Karneia | apollo | sparta | Karneios ≈ Metageitnion (9 days) |
| hyakinthia | Hyakinthia | apollo, hyacinthus | amyclae | early summer (3 days) |
| olympic-games | Olympic Games | zeus | olympia | midsummer, `games: { cycleYears: 4 }` |

(Pythian/Nemean/Isthmian games, Apatouria, Brauronia and the Pausanias local
festivals are batch 2+. Non-Attic month names — Karneios — are recorded in
`testimonia` prose; `atticDate` stores the best Attic-seasonal equivalent with
`approximate: true`.)

## 10. Risks & guards

- **Roster drift on deploy** re-deals the live cycle (D3) — the golden
  sequence makes it visible in review; never silent.
- **Timezone/DST** — one code path (`calendar.ts`), UTC-noon day arithmetic,
  post-mount compute; no `Date.now()` in pure functions.
- **Perf** — payload ≈ 15 KB; beacon and constellation are additive draws; the
  60 fps bar gates both (hard rule 4).
- **Honesty** — `approximate` flags surface as "≈" in UI; the reconstruction
  is always labeled; monthly sacred days ship only with testimonia; disputed
  festival days may carry a ⚖ note in `summary` prose.
- **Scope creep** — the eligibility gate is *not* a general "importance"
  system; any future feature wanting rankings must make its own case (D9).
- **Homonym safety** — festival `deities` reference existing ids; hard rule 7
  applies unchanged (e.g. `hyacinthus`, not a new node).
- **Choreography vs 60 fps** — the proem rides the existing camera and
  relation-line systems only; a device that cannot hold frame gets the static
  beat sequence (same path as reduced motion). Five beats is a hard cap.
- **Ritual fatigue** — beats advance on the reader's click, never a timer; a
  full proem stays under a minute; no autoplay narration or audio.

## 11. Appendix — the Oracle & the riddle (M12.6, as built)

**The Daily Oracle** (`features/spotlight/oracle.ts` + `OracleOverlay`): up to
three deterministic questions, seeded by `oracle-<isoDate>-<starId>` through
the shared prng, so every visitor faces the same oracle. Staged as the day's
**second event** (fourth UX review — "an event, like a quiz show"): where the
Proem is a violet title sequence, the Oracle is a **golden Delphic chamber**
— full-screen over the retracted bar, ember sparks, a title beat (*The tripod
is lit / THE ORACLE SPEAKS*), one question at a time with Greek-letter
progress (Α΄ Β΄ Γ΄), a verdict line after every answer (*The oracle nods.* /
*The tellers say otherwise.*), and the Pythia's pronouncement over the final
score (*The Pythia crowns you…* down to *The tripod stays silent today*).
The card's *Consult the oracle* door opens it; ESC or *Leave* returns to the
card; reopening a finished day goes straight to the verdict. Every option is
existing data — nothing synthetic:

- `bond` — *Complete the bond — MEDUSA, slain by …* Correct = the edge's
  other endpoint; distractors are three same-type roster names.
- `poet` — *Who tells it so — "…variant text…"?* Options are the quarrel
  variants' own source labels only (no filler sources, so the display style
  always matches the data).
- `myth` — *In which myth does X appear?* Correct = the star's first story;
  distractors from the saga shelf titles.
- `role` — the cosmic-role fallback that keeps the oracle at three when a
  star lacks a quarrel or a story.

Answers persist per day in `ephemeris-oracle:<isoDate>:<starId>` — the score
lives and dies with the day; no streaks, no lifetime tallies (non-goals hold),
and the closing line promises only that *the tripod is lit again at midnight
in Athens*.

**The Riddle** (`RiddleOverlay` — the DEFAULT door, no setting; the fifth UX
review removed the toggle): an unrevealed day always opens through the
Sphinx. Full-screen stage like the other two events with its own identity —
**moonlit cyan** against the Proem's violet and the Oracle's gold, a vast
faint `?` behind the chamber. The Sphinx speaks the invocation's flourish as
her question (*"the Gorgon, the sea-bride — who am I?"*) over the lens
summary with the star's names veiled (`maskStarName`, an em-dash curtain).
**Three guesses**, shown as three cyan sparks in the chrome; naming the star
or exhausting them lifts the veil either way (*You named the star* / *The
Sphinx yields*) — the reveal blazes the name in the star's own `TYPE_GLOW`
and doors into the proem, the card or back to the sky. A quiet *Yield →*
skips ahead. The reveal stamps `ephemeris-riddle` in localStorage and unlocks
chip, card, proem and the codex day-laurel (which stays hidden pre-reveal so
browsing never spoils the question). Every unrevealed entry routes here: the
chip, the constellation label, `?proem=1`.
