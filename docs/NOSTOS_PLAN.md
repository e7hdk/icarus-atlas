# Nostos — the Odyssey Experience (M13 Plan)

> **Status:** SHIPPED — M13.1–M13.5 landed 2026-07-17/18 (see the milestone notes below); production `pnpm build` green 2026-07-18 (`/odyssey` + its opengraph-image statically generated). Still open: Lighthouse + full manual UX review, the finale's galaxy cast-highlight, and one pre-M13 deploy chore — hosting the gitignored geo archives (now env-switchable via `GEO_ASSETS_BASE`, scripts/build-map-style.ts). Milestone **M13** (PLAN.md §2 decision row + §8 entry).
> **Codename:** *Nostos* (νόστος — the homecoming). Public route: **`/odyssey`**.
> **Scope:** a flagship, cinematic, scroll-driven retelling of Homer's Odyssey — art, sound, bilingual fragments — built as a **presentation layer over data that already exists**.
> **Occasion:** Nolan's *The Odyssey* premieres 2026-07-17. The film is the door; the atlas is the house. Every screen of this experience must offer a way deeper into the atlas.

---

## 1. Why now, and what for

A wave of people who have never read a line of Homer is about to search for Odysseus. Our goal is not to ride the wave for its own sake — it is to catch that curiosity and turn it into a lasting interest in mythology. The experience must therefore do two things at once:

1. **Tell the poem beautifully and honestly** — the actual Odyssey, with its structure (in-medias-res, the told tale, the long homecoming half that adaptations always cut), its sources, and its human weight.
2. **Open doors constantly** — every character is a star (deep link to codex/galaxy), every place a city (Lands), every variant a ⚖ (Contradictions), the ending a hand-off into the galaxy itself.

**North star metric (qualitative):** a visitor who arrived for the film leaves having clicked into at least one star. The experience is a vestibule, never a terminus.

### Non-goals

- **No film tie-in.** No stills, posters, score, cast likenesses, or plot comparison content. At most one neutral editorial line ("Seen the film? Here is the poem.") — nominative reference only. We are poem-first and film-agnostic; this also keeps us clean on IP.
- **No new mythology data model.** `data/stories/odyssey.json` + nested episodes remain the single source of truth for myth content. Nostos adds a *voyage overlay* (presentation data), not a parallel telling.
- **No lens selector on `/odyssey`.** Story surfaces keep the story-page conventions: teller footnotes + quiet ⚖ markers (character-page rule: the lens lives only on the Poets tab).
- **Not a general "experience engine" (yet).** Components are built cleanly enough that an Argonautica voyage could follow, but we ship one route, hand-tuned.

## 2. Current state (measured 2026-07-17)

The data layer is essentially **done** — this feature is presentation work:

| Layer | State |
|---|---|
| `data/stories/odyssey.json` | saga, 3 chapters, **191 cast entries all resolving to real characters**, 6 geo-linked places, 4 attestations (Homer entire; Apollod. Epit. 7; Hyg. Fab. 125, 127; Ov. Met. 13–14) |
| Nested episodes | ~13 (`telemachus-and-the-suitors`, `nestor-at-pylos`, `menelaus-in-egypt`, `lotus-and-cyclops`, `winds-and-circe`, `nekuia`, `sirens-and-the-strait`, `calypso-and-scheria`, `penelope-tested`, `the-beggar-king`, `slaughter-of-the-suitors`, `telegony`; `nostoi` as sibling context) — dossier: docs/ODYSSEY.md |
| Story culture | `data/story-culture/odyssey.json` (2 artworks) + 8 per-episode files — thin, needs curation to full shelves |
| Corpus | Homer Odyssey pinned **both** `homer-odyssey-en` (A. T. Murray 1919, PD) and `homer-odyssey-grc` (Monro–Allen 1917–19) — bilingual fragments are fully sourceable offline |
| Scrollytelling precedent | `StoryTheatre.tsx` ("Marquee & Path"): rAF + getBoundingClientRect tracking, igniting constellation spine, `gilded-prose` ornate corners, ⚖ chapter markers |
| Audio | `AmbientAudio.tsx` two-bed HTMLAudio crossfade engine already mounted in layout (`icarus-atlas.mp3` shipped; `proem.mp3` slot wired but empty); `musicEnabled`/`musicVolume` persisted prefs |
| Map | All voyage-relevant cities exist (Troy, Ithaca, Pylos, Sparta, Aeaea, Ogygia, Scheria=`corcyra`); **no path/route overlay precedent** |
| Nav | Three doors + satellite convention (`/festivals`: no door lit); `EphemerisChip` beckon + `EphemerisCard` gold door-strip = featured-entry precedent; `data/spotlight/weeks.json` already features sagas by ISO week |
| Gaps | **Mentor and Argos the dog missing** from characters; Leucothea only as `ino`; **no OG/social metadata anywhere**; no analytics |

## 3. Principles — the human threads

The Odyssey endures not because of monsters but because it is about what everyone knows: wanting to go home, and coming home changed. The monsters are the doors; the people are the house. Design pillars, each carried by the poem's own lines (never our editorializing):

1. **Nostos & longing.** Anticleia dies of missing her son (11.202–203); Odysseus refuses immortality for a mortal wife and a rocky island (5.203–224). The most human choice in Greek myth is the emotional center of the experience.
2. **The waiting is also the story.** Penelope unweaving the shroud (2.93–110), Telemachus growing up on rumors of a father, Laertes in the orchard, Argos on the dung-heap (17.290–327). Movement I opens with the house, not the hero.
3. **Xenia is the moral spine.** Every episode is a hospitality test: the Cyclops eats his guests, the Phaeacians ferry a stranger home, the suitors devour a house that cannot refuse them. How you treat a stranger is who you are.
4. **Identity: Nobody → the scar → the bed.** He survives by erasing his name (9.366), is known again by a wound (19.386–475), and proves himself by a secret that is a living tree (23.181–230). You return as someone else; what persists is what was rooted.
5. **The cost, told honestly.** The homecoming ends in blood: the hall slaughter and the hanging of the twelve women (22.465–473) are part of the poem. Brief, unsensational, unerased — the same honesty we apply to source contradictions.
6. **Memory & song.** Demodocus sings Troy and Odysseus weeps like a widow on a battlefield (8.521–531); the bow is strung "as a singer strings a lyre" (21.404–411). The poem knows it is a song — our sound design should too.

**Presentation principles:** the poem carries the emotion (epigraphs are always quotes with citations, never our prose dressed as fact — hard rule 2); every mythological sentence on the route comes from the existing sourced story data; line references below are planning aids to be **corpus-verified at entry time** (hard rule 5).

## 4. The concept — *he sailed home by the stars*

Calypso tells Odysseus to keep the Bear on his left hand; he crosses the open sea steering by the Pleiades, Boötes, and the Bear that never bathes in Ocean (**Od. 5.269–277**). An atlas that renders all of mythology as a night sky retells his voyage the same way:

- **The sea is rendered as a sky.** The route is a dark star-sea (the wine-dark sea and the night sky made one surface). Each station is a star; as you scroll, the ship-line is drawn from star to star — **the voyage becomes a constellation**, completed only at Ithaca.
- **Honest geography.** After Cape Malea the wanderings leave the real map (ancient and modern localizations are speculation) — so the star-sea deliberately is *not* a map. Only the Telemachy (Ithaca–Pylos–Sparta) and the return pin to real places (city links into Lands). The mythic stations float in unmapped sea-sky. The contradiction-honesty ethos, applied to geography.
- **Ring composition.** The experience opens in Ithaca without Odysseus (the poem's own opening: a house besieged, a son who cannot remember his father) and closes in Ithaca with him. The invocation is the overture: Ἄνδρα μοι ἔννεπε, Μοῦσα, πολύτροπον… / "Tell me, Muse, of the man of many devices…" (1.1, grc + Murray), then: *Twenty years. This is the story of a return.*
- **The told tale reads differently.** Books 9–12 are Odysseus narrating his own past at the Phaeacian court. When the route enters the apologoi the visual register shifts (frame narrows, ink darkens, a quiet rubric: *he is telling this himself*) and shifts back at 13. The poem's structure, made visible.
- **Penelope's thread.** The scroll-progress indicator is a woven thread climbing the screen edge; scroll back and it unweaves. At the finale the thread becomes the constellation line. (Reduced-motion: a static filled bar.)
- **The finale hands off to the real galaxy.** The completed constellation ignites, then the view crossfades into the actual 3D galaxy with the voyage cast highlighted: *every figure in this story is a star — go meet them.* Doors: `/story/odyssey` (the codex telling), the Telegony ⚖ ("the poets could not agree how his story ends"), `/stories` spindle, Lands.

## 5. Station map — three movements, eighteen stations, a coda

Chapter texts come from the existing episodes; stations are a curated overlay (grouping, quote, art, sound). **Mapping locked 2026-07-17** against the actual episode files — note `nestor-at-pylos` and `menelaus-in-egypt` are `nostoi` children (Trojan-cycle arm), so the Telemachy stations draw from `telemachus-and-the-suitors` (whose chapters 4–5 cover Pylos and Sparta); "Awake on Ithaca" lives in `calypso-and-scheria`. Exact `chapterIndexes` live in `data/experience/odyssey.json`.

| # | Station | Od. | Episode (verify) | The human line (planning ref) | Sound |
|---|---|---|---|---|---|
| — | **Overture — Tell me, Muse** | 1.1–10 | — | the invocation, grc + en | silence → sea |
| **I** | **THE SON** | 1–4 | | | |
| 1 | A House Eaten Alive | 1–2 | telemachus-and-the-suitors | the loom woven by day, unwoven by night (2.93–110) | hall, uneasy |
| 2 | In Other Men's Halls | 3–4 | telemachus-and-the-suitors (ch. 4–5) | a son collecting his father from other men's memories | open sea |
| **II** | **THE TALE** | 5–12 | | | |
| 3 | The Island at the World's End | 5 | calypso-and-scheria | immortality refused (5.203–224); steering by the Bear (5.269–277); Ino's veil (5.333–353) | island → storm |
| 4 | The Kind Strangers | 6–8 | calypso-and-scheria | he weeps at his own story like a widow (8.521–531); "I am Odysseus" (9.19) | hall, warm |
| — | *register shift: the apologoi — he tells it* | 9–12 | | | |
| 5 | The Lotus and Forgetting | 9.39–104 | lotus-and-cyclops | the first monster is forgetting home | drift |
| 6 | Nobody | 9.105–566 | lotus-and-cyclops | the name shouted in pride becomes the curse (9.526–535) | dread |
| 7 | The Bag of Winds | 10.1–79 | winds-and-circe | asleep within sight of home fires (10.28–33) — the cruelest almost | open sea → collapse |
| 8 | Harbors of the Giants | 10.80–132 | winds-and-circe | eleven ships of twelve — the poem's largest grief in fewest lines | dread |
| 9 | The Witch and the Year | 10.133–574 | winds-and-circe | a year of forgetting; the crew begs him to remember Ithaca | island, strange |
| 10 | The House of the Dead | 11 | nekuia | thrice he tries to embrace his mother (11.204–208); Achilles: better a living serf (11.489–491) | near-silence |
| 11 | The Song That Knows Everything | 12.39–54, 158–200 | sirens-and-the-strait | the Sirens offer knowledge, not just song (12.184–191) — the past as a place to drown | **the only melody** |
| 12 | Six Men | 12.73–126, 222–259 | sirens-and-the-strait | command's arithmetic: six chosen, untold | dread, narrow |
| 13 | The Cattle of the Sun | 12.260–425 | sirens-and-the-strait | hunger against an oath; the last ship; alone | storm → drift |
| **III** | **THE HOMECOMING** | 13–24 | | | |
| 14 | Asleep, He Arrives | 13 | calypso-and-scheria (ch. 5) | carried home unconscious; he does not know his own island until the mist lifts (13.187–221) | dawn, hushed |
| 15 | The Beggar in His Own House | 14–18 | the-beggar-king | the swineherd's hearth; the son found (16.186–219); **Argos wags once and dies (17.290–327)** | hearth |
| 16 | The Scar | 19 | penelope-tested | identity written on the body (19.386–475); the dream of geese (19.535–553) | hall, taut |
| 17 | The Bow and the Blood | 21–22 | slaughter-of-the-suitors | strung like a lyre (21.404–411); the hall; the twelve women (22.465–473), told plainly | strings → silence |
| 18 | The Tree That Is a Bed | 23–24 | penelope-tested | the immovable bed (23.181–230); Laertes' trees counted by a boy (24.336–344) | hearth, resolved |
| — | **Coda — The Oar and the Sea** | 23.248–284; 11.119–137 | telegony ⚖ | walk inland until the sea is unknown; a gentle death "from the sea" — and the poets disagree (Apollod. Epit. 7.34–37; Hyg. Fab. 127) | sea, receding |

## 6. Surfaces & anatomy

- **Route:** `/odyssey` (SSG). One long scroll; sections = stations. Sticky minimal chrome: movement title + Penelope-thread progress; AtlasBar in satellite mode (no door lit, like `/festivals`).
- **Star-sea:** 2D canvas starfield + SVG constellation line (`stroke-dashoffset` draw-on, `vector-effect: non-scaling-stroke`), parallax via transform only. **No second R3F scene** — WebGL is reserved for the finale hand-off into the real galaxy. (60fps + mobile budget is the reason; see §9.)
- **Station section:** star ignites on the spine → gilded-prose fragment (the bilingual epigraph with hover citation) → episode chapter prose (server-linked via the existing baked-prose pipeline) → art figure(s) → cast chips (star links) → place chip when real (Lands link) → ⚖ where the episode chapter carries a topic.
- **Fragments:** grc (Monro–Allen) + en (Murray 1919, PD) pulled via the corpus, entered as voyage-overlay data with `citation`. Rendered in the `gilded-prose` idiom (ornate corners are already fragment-only by design).
- **Galleries:** per-station picks from `data/story-culture/` episode files, rendered with `ArtworkImage` (lightbox included). Curation targets: the Siren Vase (BM), the Eleusis Polyphemus amphora, the Roman **Odyssey Landscapes** frescoes (Vatican — ancient paintings *of the wanderings*), Waterhouse's Circe pair, Draper's *Ulysses and the Sirens*, Böcklin's *Odysseus and Calypso*, Turner's *Ulysses deriding Polyphemus*, Füssli's Tiresias, Pinturicchio's *Return of Odysseus*. All via harvest → `verify:culture` gate (Commons license check).
- **Sound:** §8. Master control = existing `musicEnabled`/`musicVolume`; nothing plays before a user gesture (existing arming pattern).
- **Entries:** (a) AtlasBar beacon during the launch window — *a sail on the horizon* chip reusing the `ephemeris-beckon` idiom; (b) an Odyssey **spotlight week** in `data/spotlight/weeks.json` so the Ephemeris card's gold door-strip points at `/odyssey`; (c) a quiet banner on `/story/odyssey` ("Enter the voyage →") and a spindle affordance on the odyssey node; (d) direct URL for sharing/search.
- **Social/OG (repo-wide gap, fixed here):** `metadataBase` + `openGraph`/`twitter` in root layout; a designed `/odyssey` OG card (the completed constellation on the star-sea); per-story OG titles while we're in there.

## 7. Data model (all additive)

New file `data/experience/odyssey.json`, validated by a new `voyageSchema` in `src/lib/schemas.ts`:

```ts
interface VoyageStation {
  id: string;                 // kebab, unique in voyage
  movement: 1 | 2 | 3;
  title: string;              // "Nobody"
  kicker?: string;            // "Od. 9.105–566"
  episode: string;            // nested story id — chapters render from there
  chapterIndexes?: number[];  // subset when an episode spans stations
  epigraph: {                 // the poem's own line, bilingual
    grc: string;
    en: string;               // Murray 1919 (PD)
    citation: string;         // "Hom. Od. 5.219–220"
  };
  art?: { culture: string; titles: string[] }[]; // picks by exact title from story-culture file(s)
  place?: string;             // real geo city id — only where geography is honest (I & III)
  mood: 'silence' | 'open-sea' | 'drift' | 'storm' | 'island' | 'hall' | 'hearth'
      | 'dread' | 'underworld' | 'sirens' | 'dawn';
  told?: boolean;             // true across the apologoi (register shift)
}

interface Voyage {
  id: 'odyssey';              // keyed by story id — a second voyage stays possible
  story: string;              // root saga id
  movements: { n: 1 | 2 | 3; title: string; books: string }[];
  stations: VoyageStation[];
  finale: { castHighlight: boolean };
}
```

**Rule-2 posture:** `epigraph` is a verbatim quotation with citation (fact-safe); station `title`/`kicker` and movement titles are presentation copy (like existing UI copy), never novel myth claims — all myth prose on the page continues to come from the sourced episode chapters.

**Character batch (small, verified — hard rules 3 & 7):** `mentor-ithaca` (homonym map vs `mentor-eurystheus`, `mentor-trojan`), `argos-dog` (type/kinds decision at entry; hazard map vs `argus-panoptes`, `argus-arestor`, `argus-colchis`, `argus-eponym`), and the **Leucothea** fix as an extension of `ino` (dual-identity precedent: Styx) — plus relations (Mentor–Odysseus, Mentor–Athena disguise ⚖ if warranted, Argos–Odysseus). Run `pnpm validate-layout` after.

**validate-data grows:** voyage schema; station `episode` must exist with `parent` chain to `odyssey`; `chapterIndexes` in range; `art` picks resolve by exact title in the named story-culture file; `place` resolves to geo; epigraph citation format; mood enum; movement coverage (every station's movement declared, order monotone).

## 8. Sound design

**Phase A — the bed (M13.4 core).** One composed ambient loop (`/audio/odyssey.mp3`, produced like `icarus-atlas.mp3`) wired as a route-scoped bed through the existing `AmbientAudio` crossfade engine (the empty `proem.mp3` slot proves the wiring pattern). Entering `/odyssey` crossfades atlas→odyssey; leaving crossfades back. ~Small diff, launch-ready.

**Phase B — the responsive layer (M13.4 stretch, asset-free).** A WebAudio procedural layer mixed by scroll position (rAF-driven weights per station `mood`): filtered-noise sea with slow LFO swell; band-passed wind; sparse Karplus–Strong "lyre" plucks in Dorian/Phrygian modes, **deterministically seeded per station** (no runtime randomness — matches the atlas's determinism ethos); the Underworld is near-silence with a sub drone; **the Sirens station carries the experience's only true melody**; station 17 reduces to a single plucked string (the bow strung like a lyre), then silence. Fully synthesized → zero licensing surface, zero asset weight.

**Rules:** silent until user gesture; respects `musicEnabled`/`musicVolume`; no audio from the film or any licensed recording, ever.

## 9. Performance & accessibility gates

- **60fps hard rule:** transform/opacity-only animation; one rAF loop (StoryTheatre pattern); canvas starfield capped (device-pixel-ratio clamp, star count budget); `content-visibility: auto` on off-screen stations; images lazy via `ArtworkImage`; media budget ≤ ~250 KB per viewport-entry, art loaded on approach.
- **Mobile-first:** the film audience arrives from phones/social. Thread progress and marquee collapse gracefully; tap targets ≥ 44px; galleries swipe.
- **Reduced motion:** static star-sea, no draw-on, thread becomes a plain progress bar; everything readable with zero animation.
- **Accessibility:** the entire narrative is real DOM text (screen-reader complete); constellation is decorative (`aria-hidden`); keyboard scroll/skip per station; contrast per theme tokens.
- **No-JS/SEO:** SSG output contains the full text; OG cards per §6.

## 10. Milestones

- **M13.1 — Content lock.** Verify the station table against the corpus (`corpus:verify`, then `corpus:search` per epigraph; grc + Murray en with citations); lock station→episode/chapter mapping; character micro-batch (`mentor-ithaca`, `argos-dog`, Leucothea-on-`ino`) with hazard maps; expand story-culture episode files to full shelves (harvest → curate → `verify:culture`). **Gate:** `pnpm validate-data && pnpm validate-layout && pnpm verify:culture` green; every epigraph citation corpus-checked. _Shipped 2026-07-17 (validate-data + validate-layout green, 1486 stars): `data/experience/odyssey.json` live — 20 stations + finale, every epigraph extracted verbatim from the pinned corpus (grc Monro–Allen raw TEI lines + en Murray chunks) with citations; station→episode/chapterIndexes locked; micro-batch live with hazard maps in docs/ODYSSEY.md §6. Story-culture shelf expansion deferred to M13.3._
- **M13.2 — The voyage shell.** Built directly on the live route (mockup step waived — the review loop is iterating on `/odyssey` itself; D11): star-sea, movements, stations, constellation spine, thread progress, register shift, reduced-motion path. **Gate:** `pnpm lint && pnpm build && pnpm validate-data` green + manual 60fps check (mid-tier phone) + reduced-motion review. _Shell shipped 2026-07-17: `/odyssey` (satellite nav, no door lit) with `StarSea` deterministic canvas sky — two parallax depth layers (seeds 1184/1178, factors 0.05/0.13) painted only on mount/resize and drifted transform-only with seamless wrap (user-review addition, same day), single-rAF spine/star-ignition/Penelope-thread engine (zero scroll re-renders), 20 gilded epigraph fragments, episode prose via the baked-linking pipeline, 9 told-register stations + rubric, art/cast/city chips, finale Bear fragment + four doors. tsc + lint clean on new code; SSR-verified end-to-end on the dev server. Outstanding for the gate: production `pnpm build` pass (deferred while the dev server holds `.next`) + manual 60fps/mobile/reduced-motion review._
- **M13.3 — Fragments & galleries.** Bilingual epigraphs rendered in gilded-prose; per-station galleries + lightbox; cast chips, place chips, ⚖ pass-through. **Gate:** build green + `verify:culture` green + visual QA of every station. _Shipped 2026-07-17 (batch 1): 15 new artworks across 10 story-culture files (Sperlonga Odysseus; Wright of Derby's Penelope; Böcklin's Calypso; Leighton's Nausicaa; Turner's Polyphemus; the Odyssey Landscapes Laestrygonian fresco; Waterhouse's Circe, Sirens and Penelope; Fuseli's Tiresias and Scylla; Draper's Sirens; van Thulden's Argus; Eckersberg's suitor-slaughter; Pinturicchio's Return) — every file resolved live from the Commons API, `verify:culture` 31/31 alive & free-licensed; 13 of 20 stations now carry a gallery. Visual QA + remaining honest-empty stations (winds/cattle/scar/coda) left open; deepen via harvest later._
- **M13.4 — Sound.** Phase A bed + route crossfade; Phase B responsive layer if time allows. **Gate:** autoplay-policy manual test (no sound before gesture), prefs respected, graceful when files missing. _Shipped 2026-07-18 as a Suno-stem hybrid of A+B: four user-generated beds in `public/audio/` (`odyssey-sea/-storm/-hearth/-sirens.mp3`, Suno paid-plan output) mixed by `VoyageAudio` — the station `mood` under the reading line drives weather-slow (2.6s) crossfades via `useVoyageAudioStore` (sea ← open-sea/drift/island/hall · storm ← storm/dread/underworld · hearth ← hearth/dawn · sirens restarts from its beginning; `silence` fades all out for the overture and the bow). `AmbientAudio` ducks the atlas bed while the voyage is active and hands back on exit. Same enabled/volume prefs, same first-gesture arming, missing stems degrade silently; reduced-motion plays the steady sea bed. Outstanding: manual listen-through (mood boundaries, loop seams, relative stem loudness)._
- **M13.5 — Doors & the moment.** Beacon chip + spotlight week + `/story/odyssey` banner + finale galaxy hand-off (cast highlight) + OG/social metadata + OG card. **Gate:** build green + social-card validation + Lighthouse pass + full-route manual UX review. _Shipped 2026-07-18 (beacon chip had shipped early, D8): curated **spotlight weeks 2026-W29/W30** tell the Odyssey (W29 day-pins Odysseus→Athena; Ephemeris gate green after the sanctioned golden refresh — the M13.1 roster growth reseeded the permutation, noted in scripts/validate-ephemeris.ts); the Ephemeris card's "This week" line routes the odyssey saga to `/odyssey`; `/story/[id]` shows a gold **ENTER THE VOYAGE** strip whenever a voyage overlay exists; root layout gains `metadataBase` (env-driven) + openGraph/twitter defaults — the repo-wide OG gap closed; `/odyssey` carries full OG/twitter metadata and a build-time **`opengraph-image`** (next/og: star-sea, the Wain, title card — no binary asset). Deferred: finale galaxy cast-highlight (needs a galaxy-side highlight mode; finale chips already deep-link), Lighthouse + full manual UX review, production build (dev server holds `.next`)._

Sequencing note: M13.1 and M13.2 can run in parallel (content vs shell); everything else stacks on both.

## 11. Risks & guards

| Risk | Guard |
|---|---|
| Scope creep into re-editing myth data | Data is done; Nostos may not rewrite episode chapters — presentation only (any real content fix goes through the normal story workflow) |
| Film-IP contamination | Non-goal §1: no assets, no likenesses, no score; one nominative sentence max |
| Heavy media kills 60fps/mobile | §9 budgets; canvas caps; art on approach; Lighthouse in the M13.5 gate |
| The slaughter & the twelve women | Told plainly and briefly (pillar 5); art curation avoids gore-forward picks; no triumphal framing |
| Mythic geography false precision | Star-sea is not a map (D2); only Telemachy/return link real places |
| Timing (the film moment passes) | M13.1∥M13.2 parallel start; beacon/spotlight (M13.5a) can ship with a partial-polish route behind it |
| Translation drift in epigraphs | Murray 1919 only (pinned in corpus), citation on every fragment |

## Decision log (proposed — confirm on review)

| # | Decision | Choice | Status |
|---|---|---|---|
| D1 | Route & codename | `/odyssey`, codename *Nostos*; components generic-ish under `src/components/voyage/`, schema keyed by story id | proposed |
| D2 | Geography honesty | wanderings on an unmapped star-sea; real places only for Telemachy & return; no Lands route overlay in v1 | proposed |
| D3 | Film posture | poem-first, film-agnostic; zero film assets; one nominative mention max | proposed |
| D4 | Sound | Phase A composed bed via existing engine, then Phase B procedural WebAudio layer | proposed |
| D5 | Rendering | 2D canvas/SVG star-sea; R3F only at the finale hand-off into the real galaxy | proposed |
| D6 | Architecture | 3 movements / 18 stations / overture + coda; ring composition; apologoi register shift | proposed |
| D7 | Epigraphs | verbatim poem quotes only (grc + Murray), citation-carrying; no editorial dressed as fact | proposed |
| D8 | Nav | no fourth door; satellite convention + beacon chip + spotlight week + story-page banner. Beacon shipped early by user request (2026-07-17): standing `OdysseyChip` in the AtlasBar, placed LEFT of the Ephemeris chip ("the Bear on the left hand", Od. 5.276–277), Wain glyph, gold beckon until first opened | approved 2026-07-17 |
| D9 | Analytics | none for now (repo has none); success judged qualitatively; revisit post-launch | approved 2026-07-17 |
| D10 | `argos-dog` taxonomy | add `hound` to `CREATURE_KINDS` (a real mythological class — Cerberus, Orthus, Laelaps may adopt it later); Argos enters as `type: creature`, `kinds: ['hound']`, cluster `mortal-arm` (he lived and died on Ithaca's mortal plane) | approved 2026-07-17 |
| D11 | Mockup step | waived for M13.2 — user reviews on the live route ("ben gördükçe eklerim"); mockups/ stays untouched | approved 2026-07-17 |
| D12 | Scroll feel | sequential experiments on user review: **A** lerp smooth-scrolling — tried and REJECTED same day ("didn't feel special"; component removed). **B** pinned scroll-scrubbed epigraph scenes (`PinnedEpigraph`, `station.pinned`) — live on exactly two stations where the hold carries meaning: the Sirens (the song stops your ship) and the House of the Dead (the underworld swallows the sky). Native scroll + sticky + progress scrub, works on touch; reduced-motion falls back to the static fragment via motion-safe classes. **ADOPTED and expanded on user review (same day) to six meaning-bearing holds — the poem's most human moments, "the pin is the page's italics":** overture (invocation), Calypso refusal, House of the Dead (dark palette), Sirens, Argos, coda (dark palette). Monsters stay in normal flow | adopted (2026-07-17) |

| D13 | Cinematic chaptering (v2 shell) | on user review ("feels like one long page; scrolling should feel like arriving somewhere new; the text is too narrow"): full-screen movement **gateways** (ghost roman numeral, part-title card), **per-movement sky tints** crossfading over the star-sea (cool Ithacan night → violet tale-sea → gold homecoming dawn; `data-movement` set by the scroll rAF), **station landfall headers** (46vh held breath, title at 4xl–5xl), IO-driven `.voyage-reveal` entrances (stamped once, off under reduced motion), column widened to `max-w-4xl` with prose at a readable `max-w-3xl` measure and art frames wide at 16:10; per-station **reading scrim** (soft-edged gradient veil, no backdrop-filter) dims the star-sea behind prose while gateways stay under naked sky | approved 2026-07-18 |

| D14 | One guide: the knotted thread | on user review: spine, edge thread and star dots merge into one **Penelope's thread**; the violet app scrollbar hides on the voyage (`html.voyage-hide-scrollbar`). **v3 (same day, after overlap + "doesn't look like thread" review):** the thread is real yarn now — a fixed, gently **waving SVG strand** at the viewport's far left (clear of all text; the in-column sticky rail caused knot/text overlap and is gone), gold–violet weave gradient, progress woven via `pathLength`/dashoffset (unweaves backward, station-space). Twenty knots ride the same sine; **hovering the thread reveals every station name**, the hovered/current name glows gold, current knot haloed; click to sail. Thread sm+, knots+labels lg+ (mobile clean). Always above the pinned veils — the thread never breaks | approved 2026-07-18 |

| D16 | Hybrid SSG for the deploy window | Netlify CI's 18-min command cap could not fit 5,639 prerendered pages (~19.5 min at 2 workers), and CLI prebuilt deploys hit the known blob-store 4xx wall (the galaxy `/index` payload is ~20 MB, above the ~10 MB deploy-file guidance). Fix: the three `/character/[id]` routes prerender only the **flagship stars** (those with a curated Legacy shelf, `loadFlagshipCharacterIds`) and the long tail renders on first request + CDN-caches (`dynamicParams`), dropping the build to ~2,300 pages. Follow-ups noted: put the galaxy page's inlined atlas on a diet (the 20 MB blob), optionally raise the CI timeout via support | approved 2026-07-18 |
| D15 | Pinned scenes, animated | on user review ("too plain"): the held fragment becomes a living stage — display-size type (grc 2xl, en 3xl), gold frame lines that **draw themselves** with the scrub (and retract on release), veil deepened to 0.92, and a palette-keyed **aura** behind the words: Siren scenes get a breathing violet heart + two expanding song-rings; underworld scenes (Dead, coda) get a cold under-glow from the trench + drifting pale shades. All transform/opacity keyframes, motion-safe-gated; reduced motion keeps the static fragment with frame lines drawn | approved 2026-07-18 |

D1–D8 approved 2026-07-17 (user review). PLAN.md §2 decision row and §8 M13 entry added the same day.
