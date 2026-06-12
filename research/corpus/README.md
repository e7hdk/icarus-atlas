# Local source corpus

This directory defines a reproducible research corpus for the seven ancient-source lenses. The downloaded books are research inputs, not application data: every fact still requires human verification, a precise citation, and the correct `sources` attribution before it enters `data/`.

## Commands

```bash
pnpm corpus:sync
pnpm corpus:verify
pnpm corpus:search aphrodite
pnpm corpus:search "daughter of Zeus" --source homer --language en
pnpm corpus:search pandora --source hesiod --work "Works and Days" --limit 10
```

`corpus:sync` downloads the pinned files, checks their SHA-256 hashes, and writes citation-preserving JSONL under `normalized/`. Both `raw/` and `normalized/` are ignored by Git; `manifest.json` is the reproducible lock file.

## Research rules

- Search results are candidate passages, not ready-to-ship facts.
- Read enough surrounding context to distinguish the ancient author's claim from an editor's note or an embedded attribution such as "some say".
- Prefer the English text for discovery and the Greek or Latin edition for verification.
- Preserve disagreement. Do not merge contradictory passages into a synthetic consensus statement.
- Cite the ancient work and passage, not merely the corpus provider.
- Record the compiler honestly when Pseudo-Apollodorus or Pseudo-Hyginus quotes an older authority.

Perseus files are pinned to repository commits and retain their CC BY-SA 4.0 notices. The ToposText pages used here contain public-domain translations and are distributed by ToposText under CC BY-NC 4.0. See each manifest entry for edition and license details.
