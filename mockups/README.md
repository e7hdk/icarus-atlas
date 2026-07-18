# Icarus Atlas — Theme Mockups

Three interactive theme candidates for the galaxy UI. Open any file directly in a browser.

| File | Theme | Mood |
|------|-------|------|
| `theme-a-olympian-gold.html` | Olympian Gold | Museum-like, classical serif, gold on deep space, Greek key motifs |
| `theme-b-aether-nebula.html` | Aether Nebula | Vivid nebula colors, glassmorphism panels, neon type-coded glows |
| `theme-c-celestial-atlas.html` | Celestial Atlas | Antique star chart, engraved astrolabe rings, footnote citations |

All three share the same interaction prototype (`shared/atlas-data.js`):

- **Hover a star** — summary card with type, domains, story excerpt and relations; relation lines light up.
- **Click a star** — camera "travels" to it (zoom animation); `Esc` or the back button returns.
- **Lens switcher** (top bar) — switch between Hesiod, Homer and Consensus to see Aphrodite's parentage (and her relation lines) change per source.

These are throwaway design artifacts; the real app implements the chosen direction in Next.js + React Three Fiber.

## Character page mockups (round 2)

Three interaction concepts for the `/character/[id]` detail page, all in the decided Aether Nebula + classical serif theme. Open in a browser; everything labeled is clickable.

| File | Concept | Signature interaction |
|------|---------|-----------------------|
| `character-page-a-codex.html` | Codex | Source-lens tabs rewrite the story live; epithet pills reveal meanings; disputed paragraphs badged |
| `character-page-b-orrery.html` | Orrery | Bonds orbit the character as live stars; hover pauses the heavens; Hesiod/Homer toggle re-lights the disputed parent orbit |
| `character-page-c-tapestry.html` | Tapestry | Artwork hero; story as expandable chapter cards with source seals; "poets disagree" duel where hovering one author dims the other |
| `character-page-d-final.html` | **Codex + Orrery (merged, current direction)** | ONE global "told after" lens controls everything; orbit rings are relation categories (parents / children / loves / wars & allies); ring chips reveal name lists on click; citations live in hover footnotes, not in the prose |

Design rules locked in round 2 feedback: the source authors appear in exactly ONE place (the lens); the page reads as a single coherent story under the chosen lens; crowded relation sets are revealed on demand, never listed permanently.

## Character page mockups (round 3)

Three fresh directions for `/character/[id]`, all honoring the round-2 locked rules (one lens, hover-footnote citations, ⚖ disputes). Sample figure: Perseus.

| File | Concept | Signature idea |
|------|---------|----------------|
| `character-page-e-marginalia.html` | Codex Marginalia | An illuminated manuscript: one unbroken reading column, citations as engraved sidenotes aligned to their paragraph (the note in view lights up); bonds as a quiet constellation strip under the hero; the lens fades paragraphs out instead of reflowing |
| `character-page-f-observatory.html` | Observatory | The page IS the sky: full-bleed orbit system with parallax nebula; the codex floats as one glass pane that scrolls internally; reading dims the heavens; hover halts the orbits and names the body |
| `character-page-g-atlas-plate.html` | Atlas Plate | An engraved sheet from a celestial atlas: framed plate with corner ticks, sticky roman-numeral contents that follows scroll, genealogy as a leadered table, citations set as colophons under each paragraph |

## Character page mockups (round 4 — E × F mixes)

Round-3 feedback: Marginalia (E) and Observatory (F) both landed; round 4 blends them at three different ratios. Same locked rules, same sample figure (Perseus).

| File | Mix | Signature idea |
|------|-----|----------------|
| `character-page-h-skylight-folio.html` | Skylight Folio (F hero, E body) | The bonds orbit the NAME itself — a full-bleed helio hero; scrolling draws a veil over the heavens and hands the page to the manuscript column with margin sidenotes |
| `character-page-i-split-codex.html` | Split Codex (50 / 50) | Half sky, half open illuminated column — and they answer each other: hover a paragraph and its stars flare; hover a star and its paragraphs are cued |
| `character-page-j-orbit-margin.html` | Orbit Margin (E page, F companion) | The observatory shrunk into a sticky mini-orrery riding the left margin; it follows the tale — the stars of the paragraph you are reading burn, the rest recede |

## Character page mockups (round 5 — the story-page language)

Round-4 feedback: none of the E × F mixes fully landed; instead, retell the character codex in the myth page's APPROVED language (story concept F — Marquee & Path, now shipped on `/story/[id]`).

| File | Concept | Signature idea |
|------|---------|----------------|
| `character-page-k-codex-marquee.html` | **Codex Marquee** | Identity, the "told after" lens, bonds (as a dramatis-personae list with type-colored stars) and the registers fold into the sticky gold marquee card; the life marches down the igniting spine in passages; hovering a bond lights every mention in the prose — one design language across character and myth pages. Round-5b feedback kept the beloved mini-orrery: it rides the card as the **codex seal** under the identity block — the bonds in slow orbit, following the tale (the passage under your eyes decides which stars burn), flaring when you hover its bond row, naming itself on hover |

## Navbar concepts (round 1)

The atlas has one nav (MainNav, the three doors) but it only shows on some surfaces — desktop codex pages carry no nav or search at all. One file, three concepts; toggle A / B / C bottom-right and scroll to feel each bar over both surfaces it must serve (immersive canvas + long codex page).

| Concept | Idea | Scroll behaviour |
|---------|------|------------------|
| **A — Atlas Bar** | Classic fixed glass masthead: brand left, the three doors centered, search ⌘K + settings right; codex pages add a breadcrumb strip that scrolls away | Transparent over the canvas, glass deepens once the page moves |
| **B — Floating Dock** | Detached centered pill (glyph · doors · ⌘K), back arrow and settings as floating corner pills — minimum sky occlusion | Steps aside on scroll-down, returns on scroll-up |
| **C — Editorial Masthead** | Newspaper-style: centered ✦ ICARUS ATLAS ✦ wordmark flanked by the doors, hairline breadcrumb row above | Breadcrumb row folds away and the wordmark condenses past the fold |

**Decision (2026-07-09): A as the backbone with B's step-aside scroll behaviour — shipped as the global `AtlasBar` (+ `CrumbBar` breadcrumb strip on codex pages, `GlobalOverlays` for ⌘K everywhere).**

## City page concepts (round 1 — the codex-marquee family)

Three directions for `/city/[id]` in the shipped design language, all on real Thebes data (19 reigns, 5 ⚖ disputes, 101 residents, Pleiades 541138). Each mockup includes the shipped AtlasBar + crumb for context.

| File | Concept | Signature idea |
|------|---------|----------------|
| `city-page-a-dynasty-spine.html` | **Dynasty Spine** | The family standard: gold marquee (identity, "her sky in miniature" seal, live reign index, registers) beside the succession marching down the igniting spine — a dynasty read like a tale; starred kings link to their codices |
| `city-page-b-gazetteer.html` | **Gazetteer Plate** | The archival voice: survey-chart hero (the city star under crosshair ticks, coast lines, coordinates), plate-meta identity band, and the succession as an engraved leadered table with teller refs; sticky roman contents |
| `city-page-c-seven-gates.html` | **Seven Gates** | The city as a crossroads, not a document: ceremonial identity under the pulsing city-star, three temple gates with meander lintels — LINEAGE (mini-spine preview), HER SKY (drifting starfield), MYTHS (tale list) — and the notable dwellers hung as a constellation strip |

**Decision (2026-07-09): A with C's gates folded beneath — shipped on `/city/[id]` as `CityTheatre` (marquee + seal of real dwellers + reign spine) + `CityGates` (HER SKY · MYTHS SET HERE · ON THE MAP; the lineage gate dropped as self-referential).**

## Story page mockups (round 1)

Three directions for `/story/[id]`. No lens here by design — the lens lives only on the character Poets tab; story sourcing stays in hover footnotes, ⚖ and the "Told in" block. Sample tale: Daedalus and Icarus.

| File | Concept | Signature idea |
|------|---------|----------------|
| `story-page-a-starpath.html` | Star Path | The tale as a voyage: chapters are stars on a constellation line that fills and ignites as you read past it; places dock onto the chapter where they enter the story |
| `story-page-b-playbill.html` | Playbill | The myth as a night at the theatre: gold-ruled programme, dramatis personae before the tale, chapters as acts split by meander ornaments; hovering a player illuminates them through every act |
| `story-page-c-lectern.html` | Lectern | A reader's desk: sticky companion rail (story map with progress, cast, scenes, tellers) beside one unbroken prose column; chapters open under huge ghost numerals; the rail follows your reading |

## Story page mockups (round 2 — A × B mixes)

Round-1 feedback: Star Path (A) and Playbill (B) both landed; round 2 blends them at three different ratios. Still no lens on story pages by design. Same sample tale (Daedalus and Icarus).

| File | Mix | Signature idea |
|------|-----|----------------|
| `story-page-d-illuminated-programme.html` | Illuminated Programme (B sheet, A spine) | The gold-ruled playbill kept whole — personae first, meanders, colophon — but the acts march down an igniting constellation spine with ports of call; the terminal star closes as · EXEUNT · |
| `story-page-e-skybill.html` | Sky Bill (A body, B voice) | The programme dissolved into the open sky: the dramatis personae hang as a cast constellation; hover a player and their name lights in the prose while their acts are ringed on the spine |
| `story-page-f-marquee-path.html` | Marquee & Path (side by side) | The playbill folds into a sticky gold marquee card riding beside the star path; its act list is live — the act under your eyes glows on the card while its star burns on the spine |
