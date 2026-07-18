# Culture — The Legacy Expansion (M8 Plan)

> **Status:** APPROVED 2026-07-09 — M8.1 in progress.
> **Scope:** grow the lens-independent Legacy layer from artworks-only to the full modern afterlife of a myth: historical artifacts, film & television, music & stage, and popular culture.
> **Applies to:** `data/culture/` (characters) and `data/story-culture/` (myths) — one shared model.
> **Does not touch:** the source lens, `sources`-tagged mythology, or the Poets tab. Legacy stays lens-independent by design (PLAN.md decision, 2026-06-11).

---

## 1. Vision

Every figure and myth in the atlas casts a shadow forward through time. Today the Legacy page shows one slice of that shadow — paintings and sculpture from verified Wikimedia Commons. M8 widens it to the rest: the vase in the Louvre, the 1959 film that won the Palme d'Or, the Monteverdi opera, the video game a teenager knows the myth from. The page should answer *"where does this story live now?"* with the same honesty the Poets tab answers *"who told it first?"*.

The bar stays curatorial, not encyclopedic: a handful of genuinely significant works per shelf, each verifiable in one click — never an IMDB dump.

## 2. Current state (measured 2026-07-09)

| Layer | Coverage | Items |
|---|---|---|
| `data/culture/*.json` (characters) | 301 / 1484 figures (24 honest-empty) | 793 artworks |
| `data/story-culture/*.json` (myths) | 24 / 176 stories | 34 artworks |
| Schema | `CultureData { id, artworks: Artwork[] }` | artworks only |

UI: character Legacy route (`/character/[id]/legacy`) and the story page's "How the centuries saw it" section render the same alternating figure/caption gallery; both now open a themed lightbox on click.

## 3. Principles

1. **Real, checkable, attributed.** Every item is a real work with verifiable metadata (title, creator, year). Modern works don't carry ancient `sources`; their equivalent honesty device is a mandatory `externalUrl` (Wikipedia or equally stable reference) that lets anyone verify the claim in one click. Never invent, never guess a year — hard rule 2's spirit applied forward.
2. **License-safe imagery only.** Images are allowed **only** where the license is verified free (Wikimedia Commons, PD/CC): artworks and museum artifacts. Film posters, album covers, and game art are almost never free — those shelves are **text cards with links, no images**. The validator enforces this structurally (image fields exist only on the types allowed to have them).
3. **Honest empty stays honest.** A figure with no genuine modern legacy keeps an empty (or partial) page. No padding with tangential items; a work qualifies only if the figure/myth is its subject or a titular presence — *Icarus* (2017), a doping documentary that merely borrows the name, does **not** qualify; Bruegel's *Landscape with the Fall of Icarus* does.
4. **Curated, capped, batched.** Per shelf per entity: aim 3–6 items, hard cap 8. Data lands in small verified batches (hard rule 3), A-list figures first. Web research is the norm here (this is modern-reception, not mythology — the corpus rule 5 doesn't apply), but every claim enters with its evidence link.
5. **One model, two surfaces.** Characters and stories share the same `CultureData` shape and the same UI shelves, so the story pages inherit the expansion for free.

## 4. Data model (schema draft)

`Artwork` is untouched; four optional arrays join it. All new types share `title`, `year` (display string, e.g. `"1959"`, `"c. 490 BC"`), `description` (museum-caption voice), and `externalUrl`.

```ts
/** Museum objects: vases, reliefs, coins, gems — Commons imagery allowed. */
interface Artifact {
  title: string;          // "The Mykonos vase"
  kind: 'vase' | 'sculpture' | 'relief' | 'mosaic' | 'coin' | 'fresco' | 'other';
  period: string;         // "c. 670 BC, Archaic"
  museum: string;         // "Archaeological Museum of Mykonos"
  imageUrl: string;       // verified Wikimedia Commons
  description: string;
  externalUrl?: string;   // Commons / museum page
}

/** Cinema & television — text cards, no imagery. */
interface ScreenWork {
  title: string;          // "Black Orpheus"
  year: string;           // "1959"
  medium: 'film' | 'tv' | 'animation';
  director?: string;      // "Marcel Camus"
  description: string;
  externalUrl: string;    // Wikipedia
}

/** Opera, ballet, stage and song — text cards, no imagery. */
interface MusicWork {
  title: string;          // "L'Orfeo"
  year: string;           // "1607"
  kind: 'opera' | 'ballet' | 'song' | 'album' | 'orchestral' | 'stage';
  composer: string;       // "Claudio Monteverdi" (or performing artist)
  description: string;
  externalUrl: string;
}

/** Games, comics, brands, language — text cards, no imagery. */
interface PopCultureItem {
  title: string;          // "Hades"
  year: string;           // "2020"
  kind: 'videogame' | 'comic' | 'novel' | 'brand' | 'language' | 'other';
  creator?: string;       // "Supergiant Games"
  description: string;
  externalUrl: string;
}

interface CultureData {
  id: string;
  artworks: Artwork[];        // unchanged
  artifacts?: Artifact[];
  films?: ScreenWork[];
  music?: MusicWork[];
  popCulture?: PopCultureItem[];
}
```

Validator additions (`pnpm validate-data`): zod schemas for the four types; `externalUrl`/`imageUrl` must be `https:`; `imageUrl` accepted only on `artworks`/`artifacts`; per-shelf cap (8) enforced as a warning; existing 301 files remain valid untouched.

## 5. Legacy page IA

Shelves render in fixed order, each with the standard small-caps tracked header + hairline; empty shelves don't render; the existing "gallery still being curated" line appears only when *everything* is empty.

| Order | Shelf | Header copy | Card style |
|---|---|---|---|
| 1 | `artworks` | THE GALLERY | current alternating figure + lightbox (unchanged) |
| 2 | `artifacts` | SURVIVING STONE & CLAY | image card grid + museum/period line, lightbox |
| 3 | `films` | ON SCREEN | glass text card: title (year) · director · one-liner · ↗ |
| 4 | `music` | IN MUSIC & ON STAGE | same card idiom |
| 5 | `popCulture` | IN PLAY | same card idiom |

Design constraints: Aether Nebula tokens only, `GlassPanel`-derived cards, no external thumbnails on text shelves (a small kind-glyph instead), 60fps — text shelves are static, no new animation surface. Story pages reuse the same shelf components under "How the centuries saw it".

## 6. Pilot roster (M8.1)

Six figures + one story, chosen for rich, easily-verified modern legacies. Candidate items below are illustrative and must each be verified (with `externalUrl` evidence) at entry time:

- **`orpheus`** — Monteverdi *L'Orfeo* (1607), Gluck *Orfeo ed Euridice* (1762), *Black Orpheus* (1959), *Hadestown* (2019).
- **`medusa`** — *Clash of the Titans* (1981), the Versace emblem (brand), Ray Harryhausen legacy.
- **`heracles`** — Disney *Hercules* (1997), Handel *Hercules* (1745), the Farnese Hercules (artifact).
- **`odysseus`** — *Ulysses* (1954), Monteverdi *Il ritorno d'Ulisse in patria* (1640), Joyce *Ulysses* (1922, `novel`), *Ulysses 31* (1981, `tv`).
- **`achilles`** — *Troy* (2004), Led Zeppelin "Achilles Last Stand" (1976), "Achilles' heel" (`language`).
- **`icarus`** — Bruegel (already in artworks), Auden "Musée des Beaux Arts" (1938, `novel`→see open Q1), Iron Maiden "Flight of Icarus" (1983), *Kid Icarus* (1986, `videogame`).
- **story `daedalus-icarus`** — shares the Icarus shelf logic; proves story-culture parity on the new Marquee & Path page.

## 7. Milestones

- **M8.1 — Schema + shelves + pilot**: types/zod/validator, Legacy page shelves, story-page parity, pilot batch above. Gate: `pnpm lint && pnpm build && pnpm validate-data` green + manual UX review. _Shipped 2026-07-09 (validate-data + tsc green; awaiting UX review): four new item types + capped optional shelves in `cultureSchema`; `CultureShelves` component (artifact shelf with lightbox, three image-free text-card shelves) wired into the character Legacy page and `StoryLegacy`; pilot data live on all six figures + the `daedalus-icarus` story — every link and Commons image HTTP-verified. Adjustments discovered during entry: the Farnese Hercules and the Siren Vase already live in `artworks` (pre-M8 curation put museum pieces there), so the artifact pilot is the Rondanini Medusa; the artworks→artifacts re-shelving of such pieces is deferred to the M8.4 audit._
- **M8.2 — A-list coverage**: the ~30 most-connected figures get full shelves; artwork backfill for gallery-less major figures continues in parallel (independent of schema — 1183 figures currently lack any culture file).
- **M8.3 — Story shelves**: culture galleries for every saga root and major episode (24/176 today).
- **M8.4 — Polish & audit**: attribution audit of the existing 793 artworks (optional `commonsUrl`/credit fields), shelf filters if warranted, cross-links (an artifact depicting a scene links to that story).

## 8. Guards

- No fair-use or unverified-license imagery, ever — a shelf with no legal image is a text shelf.
- No bulk imports from IMDB/Wikidata dumps; every item hand-curated with evidence.
- `artworks` is never repurposed or renamed; new kinds are additive.
- The lens never touches Legacy; no per-author framing on modern works.
- Roster of pilot/batch figures changes only at milestone boundaries (same gate as characters).

## 9. Discovery pipeline (M8 stage tooling)

Hand-picking candidates does not scale to 1,484 figures; hand-curating them is the
product. The pipeline splits the two — discovery and verification are scripted,
judgment never is:

1. **Harvest — `pnpm harvest:culture <character-id …>`** (`scripts/harvest-culture.ts`).
   Resolves the figure to its Wikidata QID (cache: `data/wikidata-map.json`, seeded
   from the reference data's Wikipedia link, else a guarded name search — ambiguous
   matches are refused and must be pinned by hand; the homonym rule applies to QIDs
   too). Then SPARQL against Wikidata per shelf: narrative works whose
   `main subject`/`characters`/`based on`/`inspired by` (P921/P674/P144/P941) is the
   figure — films & TV, opera/ballet/song/album/musical, games/comics/novels — and
   visual works that `depict` it (P180): paintings, sculpture, reliefs. Every hit
   must carry an English Wikipedia sitelink (our one-click verification bar) and
   comes ranked by sitelink count (a notability proxy), with year, creator,
   collection and Commons image where present. Output goes to
   **`research/culture-candidates/<id>.json`** — research evidence in the corpus
   sense, gitignored, never application data. The "no bulk imports" guard is
   untouched: nothing flows into `data/` mechanically.
2. **Curate — human/agent, unchanged.** Candidates are sifted against §3 (subject,
   not namesake; 3–6 per shelf; dedup against existing artworks), descriptions are
   written in the museum-caption voice, and the result lands in `data/culture/` as
   a reviewed diff.
3. **Verify — `pnpm verify:culture [ids …]`** (`scripts/verify-culture-links.ts`).
   Network gate, deliberately separate from the offline `validate-data`: checks
   every `externalUrl`/`imageUrl` in `data/culture` + `data/story-culture` for
   liveness (rate-limited, UA-identified, 429-aware) and asks the Commons API for
   each image's license (`extmetadata`), failing on anything not PD/CC. Run before
   milestone gates and after any culture batch.

The same harvest serves M8.2's artwork backfill (P180 + museum open-access APIs can
join later); the Met Open Access API (CC0) is the first candidate for a second
harvest source.

## 10. Decision log

| Decision | Choice | Date |
|---|---|---|
| Literature shelf | **No separate array for M8.1** — post-classical literature lives in `popCulture` (kinds `novel` / `other` for poems); split later only if the data demands it | 2026-07-09 |
| Architecture as artifacts | **Excluded** — artifacts are portable museum objects only; temples and sites belong to the Lands feature | 2026-07-09 |
| PD film posters | **No image exception** — text shelves stay structurally image-free even where a poster is public domain; revisit in M8.4 at the earliest | 2026-07-09 |
| Character/story duplication | **Accepted** — culture files stay independent; the same opera may appear on both Orpheus and his story; measure before abstracting a shared-reference mechanism | 2026-07-09 |
| Discovery pipeline | **Harvest → curate → verify** (§9): Wikidata SPARQL discovery into gitignored `research/culture-candidates/`, human curation unchanged, scripted link + Commons-license verification; QID pins live in `data/wikidata-map.json` | 2026-07-09 |
