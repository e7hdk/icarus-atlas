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
