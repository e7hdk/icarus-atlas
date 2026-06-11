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
