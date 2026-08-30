# Attribution

Icarus Atlas is built on other people's work. This file names every upstream
source, the license it carries, what was taken from it, and where the credit
appears in the running application. Licensing terms for the repository itself
are in [LICENSE](LICENSE) and [data/LICENSE](data/LICENSE).

If you fork or reuse any part of this, these obligations travel with it.

---

## Ancient primary texts — research corpus

**Not redistributed here.** `research/corpus/manifest.json` pins twenty
editions by URL, edition statement, language, license and SHA-256; the texts
themselves are fetched locally with `pnpm corpus:sync` and are gitignored.
Only citations and short quoted passages appear in the application data.

| Provider | Works | License |
|---|---|---|
| [Perseus Digital Library](https://www.perseus.tufts.edu/) (PerseusDL canonical-greekLit / canonical-latinLit) | 17 entries — Homer *Iliad* and *Odyssey* (Greek; A. T. Murray trans. 1924–25), Hesiod *Theogony* and *Works and Days*, Pseudo-Apollodorus *Bibliotheca* and *Epitome* (J. G. Frazer trans.), Apollonius *Argonautica* (Greek), Ovid *Metamorphoses* (Latin and English), Pausanias *Description of Greece* (Greek and English) | CC BY-SA 4.0 |
| [ToposText](https://topostext.org/) | 3 entries — Apollonius *Argonautica* (R. C. Seaton trans. 1912), Hyginus *Fabulae* and *Astronomica* Book 2 (Mary Grant trans. 1960) | Public-domain text presented on a CC BY-NC 4.0 page |

Hyginus has no original-language edition in the corpus: the *Fabulae* is
available to this project in English only.

Quoted passages that reach the interface — the bilingual epigraphs of the
Odyssey voyage, and any curated excerpt inside a comparison — carry their
edition, language, citation and license metadata with them.

## Encyclopedic reference — the Information tab

| Source | Used for | License |
|---|---|---|
| [Wikipedia](https://www.wikipedia.org/) | `data/reference/*.json` — neutral encyclopedic summaries and article sections | CC BY-SA 4.0 |

Every reference file carries its own `attribution` string naming the article
(for example *Adapted from Wikipedia, "Aphrodite" · CC BY-SA 4.0*), and the
Information tab renders it with a link back to the source article. This is
the reason `data/` as a whole is ShareAlike.

## Cultural legacy — the Legacy shelves

| Source | Used for | License |
|---|---|---|
| [Wikimedia Commons](https://commons.wikimedia.org/) | Artwork images in `data/culture/` and `data/story-culture/`, referenced by URL — the image files are **not** vendored into this repository | Per file; public domain or a free Commons license, checked by `pnpm verify:culture` |
| [Wikidata](https://www.wikidata.org/) | Reception-candidate discovery; 814 pinned QIDs in `data/wikidata-map.json` | CC0 1.0 |

Artwork records store title, artist, date and a Commons image URL. Nothing is
harvested straight into the application: `pnpm harvest:culture` writes to a
gitignored research directory, and entries are curated by hand from there.

## Geography — the Lands map

| Source | Used for | License |
|---|---|---|
| [Pleiades](https://pleiades.stoa.org/) gazetteer | Ancient place and city coordinates; each record stores its `pleiadesId` | CC BY 3.0 |
| [Natural Earth](https://www.naturalearthdata.com/) | Coastlines, land and lake geometry — `public/geo/land.json`, `coastline.json`, `lakes.json` | Public domain (recorded as CC0 1.0 in `public/geo/manifest.json`) |
| [OpenStreetMap](https://www.openstreetmap.org/) contributors | River geometry — `public/geo/rivers-base.json`, built by `scripts/build-rivers-base.ts` | **ODbL 1.0** |
| [Mapterhorn](https://mapterhorn.com/attribution) | Terrain elevation (planet DEM). Fetched on demand by `pnpm dem:fetch`; the tiles are **not** committed | Open Data — see their attribution page |
| Wikimedia Commons, *Greece (ancient)* SVG map series by Pitichinaccio et al. | Historical region geometry adapted into `data/geo/basemap.json`, which records the attribution inline | CC BY-SA 3.0 |

The ODbL obligation on the river layer is the sharpest of these: it is a
derived database that **is** redistributed in this repository, and it stays
under ODbL 1.0 whatever license surrounds it. Map credits in the application
name OpenStreetMap, Natural Earth, Pleiades and Mapterhorn.

## Astronomy

| Source | Used for | License |
|---|---|---|
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | The reconstructed Attic calendar baked by `pnpm bake-attic-calendar` into `data/generated/attic-calendar.json` — lunations and solstices behind the Ephemeris | MIT |

## Typography

| Source | Used for | License |
|---|---|---|
| [Cinzel](https://fonts.google.com/specimen/Cinzel) by Natanael Gama | Display type, and the vendored SDF glyph range in `public/geo/font/Cinzel/` used by the map renderer | SIL Open Font License 1.1 |
| [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) by Christian Thalmann | Body type | SIL Open Font License 1.1 |

## Audio

`public/audio/*.mp3` — the atlas ambient bed and the four Odyssey voyage
stems — were generated by the author with [Suno](https://suno.com/) under a
paid plan. They are © 2026 Mehmet Fatih Aksoy, all rights reserved, and are
published here only so the application runs from a clean checkout. They are
not covered by the MIT or CC BY-SA licenses in this repository. No audio from
any film or licensed recording is used.

## Software dependencies

Runtime and build dependencies keep their own licenses, declared in their
packages and resolved in `pnpm-lock.yaml`: Next.js, React, Three.js,
`@react-three/fiber` / `drei` / `postprocessing`, MapLibre GL, PMTiles, Turf,
zustand, zod, Tailwind CSS, sharp, cheerio, tsx and TypeScript.

---

## Corrections

If something here is credited wrongly, incompletely, or under the wrong
license, please open an issue — attribution errors are treated as bugs.
